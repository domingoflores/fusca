/**
 * This scheduled script pulls APN batch and payment status from the AvidPay server and syncs the status up with records in NetSuite.
 *
 * This script is designed to be run as both a scheduled and ondemand script.
 * The ondemand deployment syncs all batches with the Sync checkbox set to T.
 * The scheduled deployment searches for all incomplete batches that were created in the last 30 days
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2015     mmenlove
 * 2.18.0.11  16 Jul 2019     dwhetten         S54250 - added code to pull payment history and set values for new fields
 * 2.18.0.19  1  Aug 2019     dwhetten         S60539 - Normalize the APN Payment Method stored in NetSuite by looking for the value and creating it if it doesn't previously exist
 * 2.18.0.32  3  Sep 2019     dwhetten         Fixed recordHaschanged function to correct change checks for the ClearedDate and HasClearedCheckImages fields.
 *
 */

var myGovernanceThreshold = 200;
var debugLoggingOn = false; // Set to true to turn on all debug logging
var yieldCount = 0;  // # times the script had to yield during execution; Logged on script completion

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
   var context = nlapiGetContext();
   var onDemandSync = context.getSetting('SCRIPT', 'custscript_pp_ss_apn_on_demand_sync') === 'T' ? true : false;
   nlapiLogExecution('AUDIT', 'PP_SS_APNBatchSyn', 'Executed v2.18');
   sync(onDemandSync);
   nlapiLogExecution('AUDIT', 'scheduled', 'Sync Complete');
   //scheduling PP_SS_APNPaymentSync. That is a new (as of 2.18) script that we don't want to schedule all of our customers to run at once, so as to not overload the APN servers
   //As such, we'll use this script (which has varied deployment times, set up during implementation) to piggyback off of its varied deployment time.
   var sched = nlapiScheduleScript('customscript_pp_ss_apn_payment_sync', 'customdeploy_pp_ss_apn_payment_sync_sche');
   nlapiLogExecution('DEBUG', 'Scheduled PP_SS_APNPaymentSync', sched);
}

//NetSuite does not understand our datetime string so parse and reassemble; it returns good date
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

var governanceCount = 0; // Each governanceCount = 10 governance units
function addGovCount(increase) {
   governanceCount += increase;
}

function addAndCheckGovernanceCount(inc) {
   addGovCount(inc);
   if (governanceCount < 900) { return; }
   var context = nlapiGetContext();
   var remaining = context.getRemainingUsage();
   if (debugLoggingOn) {nlapiLogExecution('DEBUG', 'Governance Check', 'Remaining Usage: ' + remaining);}
   if (remaining < myGovernanceThreshold) { yieldScript(); }
}

function search(methodId, methods) {
   for (var sm = 0; sm < methods.length; sm++) {
      if (methods[sm].scriptId == methodId) {
         return methods[sm];
      }
   }
   return null;
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
   for (var pmo = 0; pmo < results.length; pmo++) {
      var pmObj = results[pmo];
      payMethods.push({ name: pmObj.getValue('name'), scriptId: pmObj.getValue('scriptId'), internalId: pmObj.getId() });
   }
}

function findPayMethod(methodId, methodName) {
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Find Payment Method', 'Looking for APN Payment Method: ' + methodName + '(' + methodId + ')'); }
   if (payMethods.length === 0) {
      loadPayMethods();
   }
   var method = search(methodId, payMethods);
   if (!method) { // Not found so add it and search again
      nlapiLogExecution('DEBUG', 'findPayMethod - New Pay Method', 'Adding: ' + methodName + '(' + methodId.toFixed() + ')');
      var newPayMethodRec = nlapiCreateRecord('customlist_pp_apn_payment_method_list');
      newPayMethodRec.setFieldValue('scriptid', methodId.toFixed());
      newPayMethodRec.setFieldValue('name', methodName);
      nlapiSubmitRecord(newPayMethodRec, true);
      addGovCount(1);
      loadPayMethods();
      method = search(methodId, payMethods);
   }
   if (debugLoggingOn) {
      if (!method) {
         nlapiLogExecution('DEBUG', 'Find Payment Method', 'NO Matching Payment Method Found!');
      }
   }
   return (method) ? { internalId: method.internalId, scriptId: method.scriptId } : null;
}

function sync(onDemandSync) {
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Debug Logging Turned On', 'Debug Logging: On'); }
   var context = nlapiGetContext();

   var apnSystemUserId = context.getPreference('custscript_pp_apn_avid_system_user');
   if (!apnSystemUserId) {
      nlapiLogExecution('ERROR', 'No AvidSuite system user set', '.');
      return;
   }

   // Search and find all batches that need a sync and collect the batch numbers for each batch
   var ppApnBatches = ppApnBatchesNeedingSyncSearch(onDemandSync);
   var batchNumbers = [];
   var ppApnBatchStatusList = $PPS.nlapiGetList('customlist_pp_apn_pb_status');
   if (ppApnBatches) {
      for (var ab = 0; ab < ppApnBatches.length; ab++) {
         batchNumbers.push(ppApnBatches[ab].getValue('custrecord_pp_apn_batch_number'));
      }
      nlapiLogExecution('AUDIT', 'Batches To Sync', 'Count: ' + batchNumbers.length);
   }
   else {
      nlapiLogExecution('AUDIT', 'Batches To Sync', 'No batches found');
      return; //nothing to sync, lets get out of here
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

   // Get all batch details from server
   var externalAPNBatches = getAPNBatchObjects(service, batchNumbers);
   if (externalAPNBatches.length === 0) {
      throw nlapiCreateError('PP_NO_EXTERNAL_APN_BATCHES_FOUND', 'No external batches found');
   }

   for (var bn = 0; bn < ppApnBatches.length; bn++) {
      var internalBatchId = ppApnBatches[bn].getId();
      var batchNumber = ppApnBatches[bn].getValue('custrecord_pp_apn_batch_number');
      nlapiLogExecution('DEBUG', 'Processing Batch ' + (bn + 1) + ' of ' + ppApnBatches.length, 'Batch Number: ' + batchNumber);

      // extract the prefix that was used when the batch was created since the system prefix can change
      // batch externalids looks like 
      //	  v1: ppsqa-12345 3/4/2015 00.00.00 000
      // or v0: ppsqa12345
      // and payment externalids look like
      // 	  v1: ppsqa-88888
      // or v0: 88888
      var batchRegex = new RegExp(internalBatchId + '$');
      var batchPrefix = batchNumber.split(' ')[0].replace(batchRegex, '').replace(/-$/, '');
      var ppAPNBatchRec = nlapiLoadRecord('customrecord_pp_apn_payment_batch', internalBatchId);
      addGovCount(1);
      var batchHasChangeableException = false;

      try {
         // get all payments from APN server for current batch
         var externalApnBatchPayments = getAPNBatchPayments(service, batchNumber);
         if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Processing Batch', 'Batch#: ' + batchNumber + ' | #Payments: ' + externalApnBatchPayments.length.toString()); }

         // get search result of all payments in the current batch
         var paymentIdsObj = JSON.parse(ppAPNBatchRec.getFieldValue('custrecord_pp_apn_pb_payments'));
         var ids = Object.keys(paymentIdsObj);
         var paymentSrs = ppApnBatchesPaymentsSearch(ids);

         function createMatchingTransaction(lExternalPaymentObj, lBatchPrefix) {
            // convert externalIds to internalids. Convert to strings so that array indexOf method can match because it does a strict comparison
            var convertedExternalIds = lExternalPaymentObj.ExternalPaymentIds.map(function (item) { return item.Value.toString().replace(new RegExp('^' + lBatchPrefix + '-'), ''); });
            var accountExternalIds = lExternalPaymentObj.BankAccount.ClientIds.map(function (item) { return item.toString(); });

            // used by find method to try and find a matching transaction in NetSuite
            return function (paymentSr, index, array) {
               if (paymentSr.getValue('tranid') == lExternalPaymentObj.CheckNumber) {
                  if (convertedExternalIds.indexOf(paymentSr.getId()) > -1) {
                     return true;
                  } else if (accountExternalIds.indexOf(paymentSr.getValue('account')) > -1) {
                     return true;
                  }
               }
               return false;
            };
         };

         // match up external payments to internal payments and update status if necessary
         for (var idx = 0; idx < externalApnBatchPayments.length; idx++) {
            var externalPaymentObj = externalApnBatchPayments[idx];
            nlapiLogExecution('DEBUG', 'Processing Payment ' + (idx + 1) + ' of ' + externalApnBatchPayments.length, 'Payment ID: ' + externalPaymentObj.PaymentId);
            var matchingSr;

            matchingSr = paymentSrs.find(createMatchingTransaction(externalPaymentObj, batchPrefix));
            if (matchingSr) {

               function recordHasChanged(pMatchingSr, pExternalPaymentObj) {
                  var payObjClrDateIsNull = pExternalPaymentObj.ClearedDate === null;
                  var paySrClrDateIsNull = pMatchingSr.getValue('custbody_pp_apn_cleared_date') == '';
                  return (pMatchingSr.getValue('custbody_pp_apn_payment_status') !== pExternalPaymentObj.Status.Description)
                     || (pMatchingSr.getValue('custbody_pp_apn_payment_method') !== pExternalPaymentObj.PaymentMethod.Description)
                     || (pMatchingSr.getValue('custbody_pp_apn_check_number') != pExternalPaymentObj.AvidPayChecknumber ? pExternalPaymentObj.AvidPayChecknumber : '')
                     || (pMatchingSr.getValue('custbody_pp_apn_payment_id') != pExternalPaymentObj.PaymentId)
                     || ((payObjClrDateIsNull !== paySrClrDateIsNull) || (!payObjClrDateIsNull && !paySrClrDateIsNull
                        && parseDateString(pMatchingSr.getValue('custbody_pp_apn_cleared_date')).getTime() !== parseDateString(pExternalPaymentObj.ClearedDate).getTime()))
                     || (pMatchingSr.getValue('custbody_pp_apn_has_check_images') !== (pExternalPaymentObj.HasClearedCheckImages ? 'T' : 'F'));
               };

               function sortBy(prop, desc) {
                  return function(a, b) {
                     if (a[prop] > b[prop]) {
                        return desc ? -1 : 1;
                     } else if (a[prop] < b[prop]) {
                        return desc ? 1 : -1;
                     }
                     return 0;
                  };
               };

               function updatePaymentHistory(paymentId, tranId) {
                  if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Start updatePaymentHistory', 'PaymentId: ' + paymentId); }

                  //Search for Existing Payment History
                  var filters = [];
                  var columns = [];

                  filters.push(new nlobjSearchFilter('custrecord_pp_apn_history_payment_id', null, 'equalto', paymentId));
                  columns.push(new nlobjSearchColumn('custrecord_pp_apn_payment_history_id'));

                  var currentNSHistory = nlapiSearchRecord('customrecord_pp_apn_payment_history', null, filters, columns);
                  addGovCount(1);
                  if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Searched for history records', 'PaymentId: ' + paymentId + '  Records found: ' + (currentNSHistory != null ? currentNSHistory.length.toString() : 'null')); }

                  var apiHistory = getAPNPaymentHistoryFromAPI(service, paymentId);
                  if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'History Found', '# History Records: ' + (apiHistory != null ? apiHistory.length.toString() : 'null')); }

                  if (apiHistory && (!currentNSHistory || currentNSHistory.length !== apiHistory.length)) {
                     apiHistory.sort(sortBy('Id', true)); // Sort Desc
                     for (var hr = 0; hr < apiHistory.length; hr++) {
                        var apiHistoryObj = apiHistory[hr];

                        function getMatchingHistoryFromAPI(apiHistoryId) {

                           // used by find method to try and find a matching payment hisotry record in NetSuite
                           return function (nsHistorySr, index, array) {
                              return nsHistorySr.getValue('custrecord_pp_apn_payment_history_id') == apiHistoryId;
                           };
                        };

                        var matchingHistorySr = currentNSHistory && currentNSHistory.find(getMatchingHistoryFromAPI(apiHistoryObj.Id));
                        if (!matchingHistorySr) { //  Not found so add it

                           if (debugLoggingOn) {
                              nlapiLogExecution('DEBUG', 'Adding History Record',
                                 'PaymentProcessName: ' + apiHistoryObj.PaymentProcessName
                                 + ' - Comment: ' + apiHistoryObj.Comment
                                 + ' - Description:' + apiHistoryObj.Description
                                 + ' - InsertDateTime:' + apiHistoryObj.InsertDateTime);
                           }
                           var newHistoryRec = nlapiCreateRecord('customrecord_pp_apn_payment_history');
                           newHistoryRec.setFieldValue('custrecord_pp_apn_payment_history_id', apiHistoryObj.Id);
                           newHistoryRec.setFieldValue('custrecord_pp_apn_history_payment_id', apiHistoryObj.PaymentID);
                           newHistoryRec.setFieldValue('custrecord_pp_apn_history_process_name', apiHistoryObj.PaymentProcessName);
                           newHistoryRec.setFieldValue('custrecord_pp_apn_history_description', apiHistoryObj.Description);
                           newHistoryRec.setFieldValue('custrecord_pp_apn_history_comment', apiHistoryObj.Comment);
                           newHistoryRec.setFieldValue('custrecord_pp_apn_history_date_time', getNsDate(apiHistoryObj.InsertDateTime));
                           newHistoryRec.setFieldValue('custrecord_pp_apn_payment_history_list', tranId);
                           nlapiSubmitRecord(newHistoryRec, true);
                           addGovCount(1);
                        }
                     }
                  }
                  if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'updatePaymentHistory', 'Finished...'); }
               };

               // check if any fields are changing. Transaction loads and saves are slow and cost a lot of governance units
               if (recordHasChanged(matchingSr, externalPaymentObj)) {
                  if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Transaction Record Change', matchingSr.getId()); }
                  var paymentRecord = nlapiLoadRecord(matchingSr.getRecordType(), matchingSr.getId());
                  addGovCount(1);
                  paymentRecord.setFieldValue('custbody_pp_apn_payment_status', externalPaymentObj.Status.Description);
                  if (externalPaymentObj.Status.Description == 'Error') {
                     var reasons = externalPaymentObj.Exceptions.map(function (item) { return item.ReasonCode.Description; }).join('; ');
                     paymentRecord.setFieldValue('custbody_pp_apn_reason_for_exception', reasons);
                  } else {
                     paymentRecord.setFieldValue('custbody_pp_apn_reason_for_exception', '');
                  }

                  var payMethod = findPayMethod(externalPaymentObj.PaymentMethod.Id, externalPaymentObj.PaymentMethod.Description);
                  if (payMethod !== null) {
                     if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Payment Method Found', 'Setting: InternalId=' + payMethod.internalId + ' - APN Id=' + payMethod.scriptId);}
                     paymentRecord.setFieldValue('custbody_pp_apn_payment_method_lr', payMethod.internalId);
                     //paymentRecord.setFieldValue('custbody_pp_apn_payment_method_id', payMethod.scriptId);
                  } else if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Payment Method NOT Found', 'Looking For: ' + externalPaymentObj.PaymentMethod.Id); }
                  paymentRecord.setFieldValue('custbody_pp_apn_payment_method', externalPaymentObj.PaymentMethod.Description);
                  paymentRecord.setFieldValue('custbody_pp_apn_check_number', externalPaymentObj.AvidPayChecknumber);
                  paymentRecord.setFieldValue('custbody_pp_apn_payment_id', externalPaymentObj.PaymentId);
                  paymentRecord.setFieldValue('custbody_pp_apn_cleared_date', externalPaymentObj.ClearedDate !== null ? getNsDate(externalPaymentObj.ClearedDate) : null);
                  paymentRecord.setFieldValue('custbody_pp_apn_has_check_images', externalPaymentObj.HasClearedCheckImages ? 'T' : 'F');
                  nlapiSubmitRecord(paymentRecord);
                  addGovCount(2);
               }
               updatePaymentHistory(externalPaymentObj.PaymentId, matchingSr.getId());

               function hasChangeableException(exceptionsArr) {
                  for (var ex = 0; ex < exceptionsArr.length; ex++) {
                     // 4 = Missing bank account, 5 = Testing bank account, 6 = Inactive bank account, 9 - New Bank Account Imported
                     if ([4, 5, 6, 9].indexOf(exceptionsArr[ex].ReasonCode.Id) > -1) { return true; }
                  }
                  return false;
               };

               if (!batchHasChangeableException && externalPaymentObj.Status.Description == 'Error' && hasChangeableException(externalPaymentObj.Exceptions)) {
                  batchHasChangeableException = true;
               }
            }
            else {
               nlapiLogExecution('ERROR', 'No matching transaction found', JSON.stringify(externalPaymentObj));
            }
            addAndCheckGovernanceCount(0); // Check after every payment
         }

         // sync up the external batch status
         for (var j = 0; j < externalAPNBatches.length; j++) {
            if (externalAPNBatches[j].ExternalIdentifier.Value == batchNumber) {
               var externalBatchStatus = externalAPNBatches[j].Status.Description;
               if (ppAPNBatchRec.getFieldValue('custrecord_pp_apn_external_batch_status') != externalBatchStatus || onDemandSync) {
                  ppAPNBatchRec.setFieldValue('custrecord_pp_apn_external_batch_status', externalBatchStatus);
                  if (externalBatchStatus == 'Closed' || (externalBatchStatus == 'Processing with Exceptions' && !batchHasChangeableException)) {
                     // mark the batch as complete
                     ppAPNBatchRec.setFieldValue('custrecord_pp_apn_pb_status', ppApnBatchStatusList.getKey('Complete'));
                     if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Marking batch# ' + batchNumber + ' as complete', 'true'); }

                  }
               }
            }
         }

         if (onDemandSync) {
            ppAPNBatchRec.setFieldValue('custrecord_pp_apn_pb_sync', 'F');
         }

         ppAPNBatchRec.setFieldValue('custrecord_pp_apn_batch_last_synced', nlapiDateToString(new Date(), 'datetimetz'));
         nlapiSubmitRecord(ppAPNBatchRec);
         addAndCheckGovernanceCount(2);
      }
      catch (e) {
         nlapiLogExecution('ERROR', e.name, e.message);
         // make sure to set custrecord_pp_apn_pb_sync to false to prevent infinite scheduled script loop
         if (onDemandSync) {
            ppAPNBatchRec.setFieldValue('custrecord_pp_apn_pb_sync', 'F');
            nlapiSubmitRecord(ppAPNBatchRec);
            addGovCount(2);
         }
      }
      addAndCheckGovernanceCount(0); // check after every batch
   }

   if (yieldCount > 0) { nlapiLogExecution('AUDIT', 'Script Yielded', 'Yield Count: ' + yieldCount); }
   if (onDemandSync) {
      sync(onDemandSync);
   }
}

//Search and find all batches that need a sync
// if manual is false
//created in last 30 days
//PP APN status is not Complete(This way we can mark complete when processing with exceptions and payment has error state not related to account not setup)
// if manual is true, find all batches with sync checkbox set to T
function ppApnBatchesNeedingSyncSearch(manual) {

   var ppApnStatusList = $PPS.nlapiGetList('customlist_pp_apn_pb_status');
   var filters = [];
   var columns = [];

   if (!manual) {
      filters.push(new nlobjSearchFilter('created', null, 'onOrAfter', 'thirtyDaysAgo'));
      filters.push(new nlobjSearchFilter('custrecord_pp_apn_pb_status', null, 'noneof', [ppApnStatusList.getKey('Complete'), ppApnStatusList.getKey('Fail')]));
   }
   else {
      filters.push(new nlobjSearchFilter('custrecord_pp_apn_pb_sync', null, 'is', 'T'));
      filters.push(new nlobjSearchFilter('custrecord_pp_apn_pb_status', null, 'noneof', [ppApnStatusList.getKey('Fail')]));
   }

   columns.push(new nlobjSearchColumn('custrecord_pp_apn_pb_status'));
   columns.push(new nlobjSearchColumn('custrecord_pp_apn_batch_number'));
   var createdCol = new nlobjSearchColumn('created');
   createdCol.setSort(true);
   columns.push(createdCol);

   addGovCount(1);
   return nlapiSearchRecord('customrecord_pp_apn_payment_batch', null, filters, columns);
}


function ppApnBatchesPaymentsSearch(paymentIds) {

   var filters = [];
   var columns = [];

   filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
   filters.push(new nlobjSearchFilter('internalid', null, 'anyof', paymentIds));

   columns.push(new nlobjSearchColumn('tranid', null));
   columns.push(new nlobjSearchColumn('account', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_status', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_reason_for_exception', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_method', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_check_number', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_cleared_date', null));
   columns.push(new nlobjSearchColumn('custbody_pp_apn_has_check_images', null));

   addGovCount(1);
   return nlapiSearchRecord('transaction', null, filters, columns);
}


function getAPNBatchObjects(service, batchNumbers) {
   var resourceUrl = PPSLibAvidSuite.getPaymentBatchStatusUrl();
   resourceUrl += '?batchIds=' + encodeURIComponent(batchNumbers.join(','));

   // Retrieve all of the results
   var pager = new PPSLibAvidSuite.ResourcePager(resourceUrl, service);
   return pager.all();
}


function getAPNPaymentHistoryFromAPI(service, paymentId) {
   var resourceUrl = PPSLibAvidSuite.getPaymentHistoryUrl(paymentId);
   if (debugLoggingOn) { nlapiLogExecution('DEBUG', 'Calling AvidPay API - PaymentHistory', 'Url:' + resourceUrl); }

   return service.sendRequest(resourceUrl, null, 'GET');
}


function getAPNBatchPayments(service, batchNumber) {

   var resourceUrl = PPSLibAvidSuite.getPaymentBatchPaymentsUrl();
   resourceUrl += '?batchId=' + encodeURIComponent(batchNumber);

   // Retrieve all of the results
   var pager = new PPSLibAvidSuite.ResourcePager(resourceUrl, service);
   return pager.all();
}

function setRecoveryPoint() {
   var state = nlapiSetRecoveryPoint(); //100 point governance
   addGovCount(10);
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

function yieldScript() {
   yieldCount++;
   governanceCount = 0;
   if (debugLoggingOn) {nlapiLogExecution('DEBUG', 'Yielding Script', 'Yield Count: ' + yieldCount);}
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

function handleRecoverFailure(failure) {
   if (failure.reason == 'SS_MAJOR_RELEASE') throw 'Major Update of NetSuite in progress, shutting down all processes';
   if (failure.reason == 'SS_CANCELLED') throw 'Script Cancelled due to UI interaction';
   if (failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT') { throw 'Script Exceeded Memory'; } //cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
   if (failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE') throw 'Could not set recovery point because of a reference to a non-serializable object: ' + failure.information;
}

if (!Array.prototype.find) {
   Array.prototype.find = function(predicate) {
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
   }
};
