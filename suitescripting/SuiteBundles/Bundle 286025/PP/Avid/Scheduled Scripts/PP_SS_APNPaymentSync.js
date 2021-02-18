/**
 * This scheduled script pulls APN Payment Information and History from the AvidPay API syncs the fields with records in NetSuite.
 * 
 * This script is designed to be run only as a scheduled script. The PP_SS_BatchSync.js script can be run on demand and will update the same information.
 * The scheduled deployment searches for all payments that are not cleared and were created in the last 30 days
 * 
 * Version    Date            Author           Remarks
 * 2.18.0.11  16 Jul 2019     dwhetten         S54250 - Initial implementation
 * 2.18.0.19  1  Aug 2019     dwhetten         S60539 - Normalize the APN Payment Method stored in NetSuite by looking for the value and creating it if it doesn't previously exist
 *
 */

var myGovernanceThreshold = 200;
var debugLoggingOn = false; // Set to true to turn on all debug logging
var testDateString = null; // Set to null if not testing ('2019-07-16' has 76 (7 for Wasatch) modified payments or '2018-12-17' has 1043 payments for governance checking on Wasatch
var testPaymentId = null; // Set to nul if not testing (4765360 is a valid paymentId)
var yieldCount = 0; // # times the script had to yield during execution
var dateFmtStr = 'YYYY-MM-DD';

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
   nlapiLogExecution('AUDIT', 'PP_SS_APNPaymentSync', 'Executed v2.18.0.19');
   sync();
   nlapiLogExecution('AUDIT', 'PP_SS_APNPaymentSync', 'Sync Complete');
}

//NetSuite does not understand our datetime string so parse and reassemble
function parseDateString(ds) {
   ds = ds.replace(' ', 'T');
   var a = ds.split('T'); // break date from time
   var d = a[0].split('-'); // break date into year, month, day
   var t = a[1].split(':'); // break time into hours, minutes, seconds

   return new Date(d[0], d[1] - 1, d[2], t[0], t[1], t[2]);
}

function getNsDate(ds) {
   var hod = parseDateString(ds);
   return nlapiDateToString(hod, 'datetimetz');
}

function pad(n) {
   return n < 10 ? '0' + n.toString() : n.toString();
}

function shortDateString(ds) {
   var dt = new Date(ds);
   var d = dt.getDate();
   var m = dt.getMonth() + 1;
   var y = dt.getFullYear();
   return y.toString() + '-' + pad(m) + '-' + pad(d);
}

function yesterday() {
   return moment().utc().subtract(1, 'days');
}

function sortBy(prop) {
   return function(a, b) {
      if (a[prop] > b[prop]) {
         return 1;
      } else if (a[prop] < b[prop]) {
         return -1;
      }
      return 0;
   };
}

var governanceCount = 0; // Each governanceCount = 10 governance units
function addGovCount(increase) {
   governanceCount += increase;
}

function addAndCheckGovernanceCount(inc) {
   addGovCount(inc);
   if (governanceCount < 900) { return; }
   checkGovernance();
}

function search(methodId, methods) {
   for (var sm = 0; sm < methods.length; sm++) {
      if (methods[sm].scriptId == methodId) {
         return methods[sm];
      }
   }
   return false;
}

var payMethods = [];
function loadPayMethods() {
   payMethods = [];
   var cols = [];
   cols.push(new nlobjSearchColumn('scriptid'));
   cols.push(new nlobjSearchColumn('name'));
   var results = nlapiSearchRecord('customlist_pp_apn_payment_method_list', null, null, cols);
   addGovCount(1);
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Loaded Pay Methods', 'Found: ' + (results ? results.length : 'none')); }
   if (!results) { return; }
   results.forEach(function (pmObj) {
      payMethods.push({ name: pmObj.getValue('name'), scriptId: pmObj.getValue('scriptId'), internalId: pmObj.getId() });
   });
}

function findPayMethod(methodId, methodName) {
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Find Payment Method', 'Looking for APN Payment Method: ' + methodName + '(' + methodId + ')'); }
   if (payMethods.length === 0) {
      loadPayMethods();
   }
   var method = search(methodId, payMethods);
   if (!method) { // Not found so add it and search again
      if (debugLoggingOn) {nlapiLogExecution('DEBUG', 'findPayMethod - New Pay Method', 'Adding: ' + methodName + '(' + methodId.toFixed() + ')');}
      var newPayMethodRec = nlapiCreateRecord('customlist_pp_apn_payment_method_list');
      newPayMethodRec.setFieldValue('scriptid', methodId.toFixed());
      newPayMethodRec.setFieldValue('name', methodName);
      nlapiSubmitRecord(newPayMethodRec, true);
      addGovCount(2); // create, submit
      loadPayMethods();
      method = search(methodId, payMethods);
   }
   if (debugLoggingOn) {
      if (method) {
         nlapiLogExecution('DEBUG', 'Find Payment Method', 'Found: ' + method.name + ' (InternalId: ' + method.internalId + ') (ScriptId: ' + method.scriptId + ')');
      } else {
         nlapiLogExecution('DEBUG', 'Find Payment Method', 'NO Matching Payment Method Found!');
      }
   }
   return (method) ? { internalId: method.internalId, scriptId: method.scriptId } : null;
}

function sync() {
   if (debugLoggingOn) {
      nlapiLogExecution('DEBUG', 'Debug Logging Turned On', 'Debug Logging: On');
   }

   var companyPreferences = nlapiLoadConfiguration('companypreferences');
   // use the last import date if set otherwise use today as the date?
   var lastImport = companyPreferences.getFieldValue('custscript_apn_last_payment_sync_date');
   nlapiLogExecution('DEBUG', 'Load Last Import Date', 'LastImportDate=' + lastImport);

   var toDate = yesterday();
   var fromDate;
   if (lastImport) {
      // the last import date is stored as a YYYY-MM-DD string because NetSuite's date format/storage is bunk.
      fromDate = moment(lastImport, dateFmtStr);
   } else {
      fromDate = yesterday();
   }
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Date Range Size', 'Days: ' + Math.abs(fromDate.diff(toDate, 'days')));}
   if (Math.abs(fromDate.diff(toDate, 'days')) > 30) {
      toDate = fromDate.add(30, 'days');
   }

   var context = nlapiGetContext();

   var apnSystemUserId = context.getPreference('custscript_pp_apn_avid_system_user');
   if (!apnSystemUserId) {
      nlapiLogExecution('ERROR', 'No AvidSuite system user set', '.');
      return;
   }

   // Load the APN user credentials of current user
   var apnCredentials = PPSLibAvidSuite.getUserCredentials(apnSystemUserId);
   if (!apnCredentials) {
      throw nlapiCreateError('PP_APN_NO_USER_CREDENTIALS', 'You have not setup your system avid suite user credentials yet. Go to AvidXchange -> Setup -> Preferences and select an option for the AVIDSUITE SYSTEM USER field');
   }

   // Configure and authorize the service
   var serviceConfig = apnCredentials;
   var service = new PPSLibAvidSuite.Service(serviceConfig);
   service.authorize();
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Authorized', 'true'); }

   try {
      if (testDateString !== null) {
         nlapiLogExecution('AUDIT', 'USING TEST DATE', 'TestDate: ' + testDateString);
      } else if (debugLoggingOn) {
         nlapiLogExecution('AUDIT', 'Payment Sync Date Range', 'From Date: ' + fromDate.format(dateFmtStr) + ' &lt;=&gt; To Date: ' + toDate.format(dateFmtStr));
      }
      var modifiedPayments = getAPNPayments(service, testDateString === null ? fromDate.format(dateFmtStr) : testDateString, testDateString === null ? toDate.format(dateFmtStr) : testDateString);

      if (!modifiedPayments || modifiedPayments.length === 0) {
         nlapiLogExecution('AUDIT', 'NO Payments to Process', 'NO Payments Found. Exiting Script.');
         if (testDateString === null && testPaymentId === null) { // Don't change it if it's a test date or payment
            // The Last Payment Sync Date is stored as a YYYY-MM-DD string.
            companyPreferences.setFieldValue('custscript_apn_last_payment_sync_date', toDate.format(dateFmtStr));
            nlapiSubmitConfiguration(companyPreferences);
            nlapiLogExecution('AUDIT', 'Set Last Payment Sync Date', 'Setting Last Payment Sync Date to: ' + toDate.format(dateFmtStr));
         }
         return;
      }
      nlapiLogExecution('AUDIT', 'Payments to Process', '# Payments Found: ' + modifiedPayments.length);
      modifiedPayments.sort(sortBy('PaymentId'));

      for (var idx = 0; idx < modifiedPayments.length; idx++) {
         var modifiedPayment = modifiedPayments[idx];
         nlapiLogExecution('DEBUG', 'Starting Payment ' + (idx+1) + ' of ' + modifiedPayments.length, 'Payment ID: ' + modifiedPayment.PaymentId);
         var nsPayments = ppApnPaymentSearch(modifiedPayment.PaymentId);

         if (!nsPayments || nsPayments.length === 0) {
            if (debugLoggingOn) {
               nlapiLogExecution('DEBUG', 'No matching transaction found',
                  '{"PaymentId":' + modifiedPayment.PaymentId
                  + ', "Status":{"Id":' + modifiedPayment.Status.Id
                  + ', "Description":"' + modifiedPayment.Status.Description + '"}'
                  + ', "CheckNumber":"' + modifiedPayment.CheckNumber
                  + '", "PaymentMethod":{"Id":' + modifiedPayment.PaymentMethod.Id
                  + ', "Description":"' + modifiedPayment.PaymentMethod.Description + '"}'
                  + ', "Amount":' + modifiedPayment.Amount
                  + ', "BatchId":"' + modifiedPayment.BatchId
                  + '", "ClearedDate":' + modifiedPayment.ClearedDate
                  + ', "HasClearedCheckImages":' + modifiedPayment.HasClearedCheckImages + '}');
            }
            continue;
         }

         var nsPaymentObj = nsPayments[0];
         if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'NS Payment Found', 'PaymentId:' + nsPaymentObj.getValue('custbody_pp_apn_payment_id')); }

         function paymentHasChanged(paymentSr, paymentObj) {
            var statusChange = (paymentSr.getValue('custbody_pp_apn_payment_status') !== paymentObj.Status.Description);
            var methodChange = (paymentSr.getValue('custbody_pp_apn_payment_method') !== paymentObj.PaymentMethod.Description);
            var checkNumberChange = (paymentSr.getValue('custbody_pp_apn_check_number') != (paymentObj.AvidPayChecknumber ? paymentObj.AvidPayChecknumber : ''));
            var paymentIdChange = (paymentSr.getValue('custbody_pp_apn_payment_id') != paymentObj.PaymentId);
            var payObjClrDateIsNull = paymentObj.ClearedDate === null;
            var paySrClrDateIsNull = paymentSr.getValue('custbody_pp_apn_cleared_date') == '';
            var clearDateChange = (payObjClrDateIsNull !== paySrClrDateIsNull) || (!payObjClrDateIsNull && !paySrClrDateIsNull
               && parseDateString(paymentSr.getValue('custbody_pp_apn_cleared_date')).getTime() !== parseDateString(paymentObj.ClearedDate).getTime());
            var hasImagesChange = (paymentSr.getValue('custbody_pp_apn_has_check_images') !== (paymentObj.HasClearedCheckImages ? 'T' : 'F'));
            var paymentDataChanged = statusChange || methodChange || checkNumberChange || paymentIdChange || clearDateChange || hasImagesChange;

            if (debugLoggingOn && paymentDataChanged) {
               nlapiLogExecution('DEBUG', 'Payment Data Has Changed', 'Status: ' + statusChange + ' - Method: ' + methodChange + ' - Check#: ' + checkNumberChange
                  + ' - PaymentId: ' + paymentIdChange + ' - ClearedDate: ' + clearDateChange + ' - HasCheckImages: ' + hasImagesChange);
               nlapiLogExecution('DEBUG', 'Payment Data Comparison Values',
                  'Status: "' + paymentSr.getValue('custbody_pp_apn_payment_status') + '" !== "' + paymentObj.Status.Description + '" (' + statusChange + ')'
                  + ' - Method: "' + paymentSr.getValue('custbody_pp_apn_payment_method') + '" !== "' + paymentObj.PaymentMethod.Description + '" (' + methodChange + ')'
                  + ' - Check#: "' + paymentSr.getValue('custbody_pp_apn_check_number') + '" != "' + (paymentObj.AvidPayChecknumber ? paymentObj.AvidPayChecknumber : '') + '" (' + checkNumberChange + ')'
                  + ' - PaymentId: "' + paymentSr.getValue('custbody_pp_apn_payment_id') + '" != "' + (paymentObj.PaymentId ? paymentObj.PaymentId : '') + '" (' + paymentIdChange + ')'
                  + ' - ClearedDate: "' + paymentSr.getValue('custbody_pp_apn_cleared_date') + '" !== "' + (paymentObj.ClearedDate ? paymentObj.ClearedDate : '') + '" (' + clearDateChange + ')'
                  + ' - HasCheckImages: "' + paymentSr.getValue('custbody_pp_apn_has_check_images') + '" !== "' + (paymentObj.HasClearedCheckImages ? 'T' : 'F') + '" (' + hasImagesChange + ')'
               );
            } else {
               if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Payment Data Changed', 'NO DATA CHANGED'); }
            }

            return paymentDataChanged;
         };


         function updatePaymentHistory(paymentId, tranId) {
            if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Start updatePaymentHistory', 'PaymentId: ' + paymentId); }

            //Search for Existing Payment History
            var filters = [];
            var columns = [];

            filters.push(new nlobjSearchFilter('custrecord_pp_apn_history_payment_id', null, 'equalto', paymentId));

            columns.push(new nlobjSearchColumn('custrecord_pp_apn_history_comment'));
            columns.push(new nlobjSearchColumn('custrecord_pp_apn_history_date_time'));

            var currentNSHistory = nlapiSearchRecord('customrecord_pp_apn_payment_history', null, filters, columns);
            addGovCount(1);

            var apiHistory = getAPNPaymentHistoryFromAPI(service, paymentId);
            if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'History Found', '# History Records: ' + (apiHistory != null ? apiHistory.length.toString() : 'null')); }

            if (apiHistory && (!currentNSHistory || currentNSHistory.length !== apiHistory.length)) {
               apiHistory.sort(sortBy('Id'));
               for (var hr = 0; hr < apiHistory.length; hr++) {
                  var apiHistoryObj = apiHistory[hr];

                  function getMatchingHistoryFromAPI(locApiHistoryObj) {

                     // used by find method to try and find a matching payment hisotry record in NetSuite
                     return function (nsHistorySr, index, array) {
                        var nsHistoryDate = nsHistorySr.getValue('custrecord_pp_apn_history_date_time');
                        var apiDate = locApiHistoryObj.InsertDateTime;
                        var dateMatch = nsHistoryDate && (parseDateString(nsHistoryDate).getTime() === parseDateString(apiDate).getTime());
                        if (nsHistorySr.getValue('custrecord_pp_apn_history_comment') === locApiHistoryObj.Comment && dateMatch) {
                           return true;
                        }
                        return false;
                     };
                  };

                  var matchingHistorySr = currentNSHistory && currentNSHistory.find(getMatchingHistoryFromAPI(apiHistoryObj));
                  if (!matchingHistorySr) { //  Not found so add it

                     if (debugLoggingOn) {
                        nlapiLogExecution('DEBUG', 'Adding History Record',
                           'PaymentProcessName: ' + apiHistoryObj.PaymentProcessName
                           + ' - Comment: ' + apiHistoryObj.Comment
                           + ' - Description:' + apiHistoryObj.Description
                           + ' - InsertDateTime:' + apiHistoryObj.InsertDateTime);
                     }
                     var newHistoryRec = nlapiCreateRecord('customrecord_pp_apn_payment_history');
                     newHistoryRec.setFieldValue('custrecord_pp_apn_history_payment_id', apiHistoryObj.PaymentID);
                     newHistoryRec.setFieldValue('custrecord_pp_apn_history_process_name', apiHistoryObj.PaymentProcessName);
                     newHistoryRec.setFieldValue('custrecord_pp_apn_history_description', apiHistoryObj.Description);
                     newHistoryRec.setFieldValue('custrecord_pp_apn_history_comment', apiHistoryObj.Comment);
                     newHistoryRec.setFieldValue('custrecord_pp_apn_history_date_time', getNsDate(apiHistoryObj.InsertDateTime));
                     newHistoryRec.setFieldValue('custrecord_pp_apn_payment_history_list', tranId);
                     nlapiSubmitRecord(newHistoryRec, true);
                     addGovCount(1); // Cust records cost less governance
                  }
               }
            }
            if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'updatePaymentHistory', 'Finished...'); }
         };

         // check if any fields are changing. Transaction loads and saves are slow and cost a lot of governance units
         if (paymentHasChanged(nsPaymentObj, modifiedPayment) || testPaymentId !== null || testDateString !== null) {
            if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Transaction Record Change', 'InternalId: ' + nsPaymentObj.getId() + ' - ' + nsPaymentObj.getRecordType()); }
            var paymentRecord = nlapiLoadRecord(nsPaymentObj.getRecordType(), nsPaymentObj.getId());
            addGovCount(1);
            paymentRecord.setFieldValue('custbody_pp_apn_payment_status', modifiedPayment.Status.Description);
            if (modifiedPayment.Status.Description == 'Error') {
               var reasons = modifiedPayment.Exceptions
                  .map(function (item) { return item.ReasonCode.Description; }).join('; ');
               paymentRecord.setFieldValue('custbody_pp_apn_reason_for_exception', reasons);
            } else {
               paymentRecord.setFieldValue('custbody_pp_apn_reason_for_exception', '');
            }

            var payMethod = findPayMethod(modifiedPayment.PaymentMethod.Id, modifiedPayment.PaymentMethod.Description);
            if (payMethod !== null) {
               if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Payment Method Found', 'Setting: InternalId=' + payMethod.internalId + ' - APN Id=' + payMethod.scriptId); }
               paymentRecord.setFieldValue('custbody_pp_apn_payment_method_lr', payMethod.internalId);
               //paymentRecord.setFieldValue('custbody_pp_apn_payment_method_id', payMethod.scriptId);
            } else if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Payment Method NOT Found', 'Looking For: ' + modifiedPayment.PaymentMethod.Id); }
            paymentRecord.setFieldValue('custbody_pp_apn_payment_method', modifiedPayment.PaymentMethod.Description);
            paymentRecord.setFieldValue('custbody_pp_apn_check_number', modifiedPayment.AvidPayChecknumber);
            paymentRecord.setFieldValue('custbody_pp_apn_payment_id', modifiedPayment.PaymentId);
            if (modifiedPayment.ClearedDate !== null || testPaymentId !== null) {
               if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Payment Cleared', 'Record Type:' + paymentRecord.getRecordType()); }
               if (paymentRecord.getRecordType() === 'vendorpayment') {
                  if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Setting Status', 'Status=VendPymt:V - CurrStatus:' + paymentRecord.getFieldValue('status')); }
                  paymentRecord.setFieldValue('status', 'VendPymt:V');
               }
            }
            paymentRecord.setFieldValue('custbody_pp_apn_cleared_date', modifiedPayment.ClearedDate !== null ? getNsDate(modifiedPayment.ClearedDate) : null);
            paymentRecord.setFieldValue('custbody_pp_apn_has_check_images', modifiedPayment.HasClearedCheckImages ? 'T' : 'F');
            nlapiSubmitRecord(paymentRecord);
            addGovCount(2);
         }
         updatePaymentHistory(modifiedPayment.PaymentId, nsPaymentObj.getId());
         addAndCheckGovernanceCount(0);
      }
      if (testDateString === null && testPaymentId === null) { // Don't change it if it's a test date or payment
         // The Last Payment Sync Date is stored as a YYYY-MM-DD string.
         companyPreferences.setFieldValue('custscript_apn_last_payment_sync_date', toDate.format(dateFmtStr));
         nlapiSubmitConfiguration(companyPreferences);
         nlapiLogExecution('AUDIT', 'Set Last Payment Sync Date', 'Setting Last Payment Sync Date to: ' + toDate.format(dateFmtStr));
      }
      if (yieldCount > 0) { nlapiLogExecution('AUDIT', 'Script Yielded', 'Yield Count: ' + yieldCount); }
   } catch (e) {
      nlapiLogExecution('ERROR', e.name, e.message);
   }
}

function ppApnPaymentSearch(paymentId) {
   var filters = [];
   var columns = [];

   filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
   filters.push(new nlobjSearchFilter('custbody_pp_apn_payment_id', null, 'equalto', paymentId));

   columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_id', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_status', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_reason_for_exception', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_method', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_check_number', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_cleared_date', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_has_check_images', null));

   var sr = nlapiSearchRecord('transaction', null, filters, columns);
   addGovCount(1);
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'ppApnPaymentSearch', 'Found:' + (sr ? sr.length : 'null')); }
   return sr;
}

function getAPNPaymentHistoryFromAPI(service, paymentId) {
   var resourceUrl = PPSLibAvidSuite.getPaymentHistoryUrl(paymentId);
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Calling AvidPay API - PaymentHistory', 'Url:' + resourceUrl); }

   return service.sendRequest(resourceUrl, null, 'GET');
}

function getAPNPayments(service, lastModifiedFromDateString, lastModifiedToDateString) {
   var resourceUrl = PPSLibAvidSuite.getPaymentBatchPaymentsUrl();
   if (testPaymentId === null) {
      resourceUrl += '?lastModifiedFrom=' + lastModifiedFromDateString + '&lastModifiedTo=' + lastModifiedToDateString;
   } else {
      nlapiLogExecution('DEBUG', 'TEST PAYMENTID', 'PaymentId: ' + testPaymentId);
      resourceUrl += '?paymentIds=' + testPaymentId;
   }

   var pager = new PPSLibAvidSuite.ResourcePager(resourceUrl, service);
   return pager.all();
}

function setRecoveryPoint() {
   var state = nlapiSetRecoveryPoint(); //100 point governance
   if (state.status == 'SUCCESS') return;  //we successfully create a new recovery point
   if (state.status == 'RESUME') //a recovery point was previously set, we are resuming due to some unforeseen error
   {
      nlapiLogExecution('ERROR', 'Resuming script because of ' + state.reason + '.  Size = ' + state.size);
      handleScriptRecovery();
   }
   else if (state.status == 'FAILURE')  //we failed to create a new recovery point
   {
      nlapiLogExecution('ERROR', 'Failed to create recovery point. Reason = ' + state.reason + ' / Size = ' + state.size);
      handleRecoveryFailure(state);
   }
}

function checkGovernance() {
   var context = nlapiGetContext();
   var remaining = context.getRemainingUsage();
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Governance Check', 'Remaining Usage: ' + remaining); }
   if (remaining < myGovernanceThreshold) {
      yieldCount++;
      governanceCount = 0;
      var state = nlapiYieldScript();
      if (state.status == 'FAILURE') {
         nlapiLogExecution('ERROR', 'Failed to yield script, exiting: Reason = ' + state.reason + ' / Size = ' + state.size);
         throw 'Failed to yield script';
      }
      else if (state.status == 'RESUME') {
         nlapiLogExecution('AUDIT', 'Resuming script because of ' + state.reason + '.  Size = ' + state.size);
      }
      // state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
   }
}

function handleRecoverFailure(failure) {
   if (failure.reason == 'SS_MAJOR_RELEASE') throw 'Major Update of NetSuite in progress, shutting down all processes';
   if (failure.reason == 'SS_CANCELLED') throw 'Script Cancelled due to UI interaction';
   if (failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT') { throw 'Script Exceeded Memory'; } //cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
   if (failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE') throw 'Could not set recovery point because of a reference to a non-recoverable object: ' + failure.information;
}

if (!Array.prototype.find) {
   Array.prototype.find = function (predicate) {
      if (this === null) {
         throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
         throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
         value = list[i];
         if (predicate.call(thisArg, value, i, list)) {
            return value;
         }
      }
      return undefined;
   };
}
