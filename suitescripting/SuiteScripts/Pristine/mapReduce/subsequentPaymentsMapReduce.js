/**
 * @NApiVersion 2.0
 * @NScriptType mapreducescript
 */

/* Map/Reduce script called by subsequentPaymentsSuitelet.js. Creates new Exchange Records based on
 * the DER selected by the user.
 */

define(['N/search', 'N/record', 'N/runtime', 'N/task', 'N/log', 'N/file', '/SuiteScripts/Pristine/libraries/searchResultsLibrary.js', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'],
    function (search, record, runtime, task, log, file, searchResultsLibrary, subsequentPaymentsLibrary) {
        var scriptName = "subsequentPaymentsMapReduce.js->";

        function getInputData() {
            var funcName = scriptName + "getInputData";
            // grab parameters
            var derId = runtime.getCurrentScript().getParameter({ // the DER we want to copy from
                name: 'custscript_der_id'
            });
            var thisDer = runtime.getCurrentScript().getParameter({ // the DER we want to copy to
                name: 'custscript_this_der_mapreduce'
            });
            var thisDerPayoutType = runtime.getCurrentScript().getParameter({ // the Payout Type
                name: 'custscript_this_der_payouttype'
            });
            var thisDerPayDate = runtime.getCurrentScript().getParameter({ // the Payout Type
                name: 'custscript_der_pay_date'
            });

            // load and modify search to only include ExRecs attached to the chosen DER
            var srch = search.load({
                id: 'customsearch_subsequent_pmts'
            });
            var derFilter = search.createFilter({
                name: 'custrecord_acq_lot_payment_import_record',
                operator: search.Operator.ANYOF,
                values: [derId],
            });
            srch.filters.push(derFilter);
            var resultSet = srch.run();
            var all = searchResultsLibrary.getSearchResultData(resultSet);

            var combinedData = [];
            for (var i = 0; i < all.length; i++) {
                combinedData.push({
                    searchResult: all[i],
                    thisDer: thisDer,
                    payoutType: thisDerPayoutType,
                    payDate: thisDerPayDate
                });
            }

            // combinedData is array of objects that includes search results, the DER that we just pressed the Subsequent
            // Payments button on, and the Payout Type so we can copy it over.
            return combinedData;
        }
        function map(context) {            
            var funcName = scriptName + "map";
            // create an ExRec using results from the search
            var soEntry = JSON.parse(context.value),
                searchResult = soEntry.searchResult.values,
                oldExRec = soEntry.searchResult.id,
                properties = [];

            try {
                for (prop in searchResult) {
                    var temp = searchResult[prop];

                    if (typeof temp === "object") {
                        temp = subsequentPaymentsLibrary.handleObjectResults(temp);
                    }

                    temp = subsequentPaymentsLibrary.cleanSearchData(temp);

                    if (prop == 'custrecord_acq_loth_0_de1_notes') {
                        temp_custrecord_acq_loth_0_de1_notes = temp;
                        log.debug("custrecord_acq_loth_0_de1_notes", temp);
                    }
                    if (prop == 'custrecord_suspense_reason') {
                        temp_custrecord_suspense_reason = temp;
                        log.debug("temp_custrecord_suspense_reason", temp);
                    }
                    // ATP-1777 - Remove contract from copying over
                    // if (prop == 'custrecord_exrec_fx_conv_contract') {
                    //     temp_custrecord_exrec_fx_conv_contract = temp;
                    //     log.debug("custrecord_exrec_fx_conv_contract", temp);

                    // }
                    if (prop == 'custrecord_acq_lot_priority_payment') {
                        temp_custrecord_acq_lot_priority_payment = temp;
                        log.debug("custrecord_acq_lot_priority_payment", temp);
                    }
                    if (prop == 'custrecord_acq_loth_zzz_zzz_acqstatus') {
                        temp_aqm_status = temp;
                        log.debug("custrecord_acq_loth_zzz_zzz_acqstatus is", temp_aqm_status);
                    }
                    if (prop == 'custrecord_acq_loth_zzz_zzz_shrhldstat') {
                        temp_shar_status = temp;
                        log.debug("custrecord_acq_loth_zzz_zzz_shrhldstat is", temp_shar_status);
                    }

                    properties.push({
                        property: prop,
                        value: temp
                    });
                } // end of loop


                // If   Acquiom Status                  = 5. Approved for Payment 
                // and  Shareholder Status              = 5. Ready for Payment
                // and  DE-1) Review Notes              is blank
                // and  Payment Suspense Reason         is blank
                // and  Priority Payment Type           is neither "AES" nor "Foreign Currency"
                // then set the new Acquiom Status      = 5b. Upon Approval Ready for Payment
                //      and the new Shareholder Status  = 4. Ready for Approval    
                if (temp_aqm_status == 5 &&
                    temp_shar_status == 6 &&
                    !Boolean(temp_custrecord_acq_loth_0_de1_notes) &&
                    !Boolean(temp_custrecord_suspense_reason) &&
                    // !Boolean(temp_custrecord_exrec_fx_conv_contract) && // ATP-1777
                    (temp_custrecord_acq_lot_priority_payment != 4) && (temp_custrecord_acq_lot_priority_payment != 5)) {
                    properties[findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_acqstatus")].value = 7;
                    properties[findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_shrhldstat")].value = 5;
                } 
                // Otherwise 
                // If   Acquiom Status                  = 5. Approved for Payment 
                // and  Shareholder Status              = 5. Ready for Payment
                // and  DE-1) Review Notes              is populated
                // or   Payment Suspense Reason         is populated
                // or   Priority Payment Type           is either "AES" or "Foreign Currency"
                // then set the new Acquiom Status      = 4. Ready for Review
                //      and the new Shareholder Status  = 4. Ready for Approval    

                else if (temp_aqm_status == 5 &&
                    temp_shar_status == 6 &&
                    Boolean(temp_custrecord_acq_loth_0_de1_notes) ||
                    Boolean(temp_custrecord_suspense_reason) || 
                    // Boolean(temp_custrecord_exrec_fx_conv_contract) || // ATP-1777
                    (temp_custrecord_acq_lot_priority_payment = 4) || (temp_custrecord_acq_lot_priority_payment = 5)) {
                    properties[findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_acqstatus")].value = 4;
                    properties[findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_shrhldstat")].value = 5;
                }
                // If   Acquiom Status                  is not = 5. Approved for Payment 
                // and  Shareholder Status              is not = 5. Ready for Payment
                // then retain Acquiom Status value
                //      and retain Shareholder Status value    
                if (temp_aqm_status != 5 &&
                    temp_shar_status != 6) {
                    properties[findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_acqstatus")].value = temp_aqm_status;
                    properties[findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_shrhldstat")].value = temp_shar_status;
                }

                try {
                    var so = record.create({
                        type: soEntry.searchResult.recordType
                    });
                } catch (e) {
                    log.error(e.name, e.id + ': ' + e.message + ' , STACKTRACE: ' + e.trace);
                }

                for (var i = 0; i < properties.length; i++) {
                    so.setValue({
                        fieldId: properties[i].property,
                        value: properties[i].value
                    });
                }
                // ATP-1123 if original exchange was waiveFees this payment only do NOT copy that value to new exchange
                var waiveFees_ThisPaymentOnly = 1;
                if (so.getValue({
                    fieldId: 'custrecord_exrec_waive_fees'
                }) == waiveFees_ThisPaymentOnly) {
                    so.setValue({
                        fieldId: 'custrecord_exrec_waive_fees',
                        value: null
                    });
                }
                // end ATP-1123

                so.setValue({ // point ExRec to the newly created DER
                    fieldId: 'custrecord_acq_lot_payment_import_record',
                    value: soEntry.thisDer
                });
                so.setValue({ // point ExRec to its parent ExRec
                    fieldId: 'custrecord_alpha_er_record',
                    value: oldExRec
                });
                so.setValue({ // set LOT Delivery Instructions to 'Subsequent Payment'
                    fieldId: 'custrecord_acq_loth_zzz_zzz_lotdelivery',
                    value: 11
                });
                so.setValue({ // set Payout Type to  whatever was specified on the new DER
                    fieldId: 'custrecord_acq_lot_payout_type',
                    value: soEntry.payoutType
                });
                if (soEntry.payDate != '') {
                    so.setValue({ // set Instructed to Pay Date to  whatever was specified on the new DER
                        fieldId: 'custrecord_acq_loth_zzz_zzz_topaydate',
                        value: subsequentPaymentsLibrary.cleanSearchData(soEntry.payDate)
                    });
                }

                var newExRec = so.save();


                //===========================================================================================================================
                // ATO-99 TIN Check processing
                // Operations does not want a TIN Check to occur when one of these records is copied.
                // 1. Custom Search was changed to include TIN Check fields from source exchange Record
                // 2. "Exchange Record UE" user event script was changed so that TIN Check submit processing does not occur for these
                // 3. Here we are adding code to make a copy of the existing TIN Check record (if there is one) and update it to point
                //    to this exchange record and to have a Request Status of DUPLICATE
                // 4. Update the new exchange record so it points back to our newly created TIN Check record
                //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

                try {
                    var tinCheckId = so.getValue("custrecord_exrec_tinchk_src_tin");
                    if (tinCheckId > "") { // Does this exchange record have a TIN Check record associated with it?
                        var rcdTinCheck = record.copy({
                            type: 'customrecord_tin_check',
                            id: tinCheckId,
                            isDynamic: false
                        });
                        var tinCheckRequestStatus_DUPLICATE = 8;
                        rcdTinCheck.setValue("custrecord_tinchk_req_sts", tinCheckRequestStatus_DUPLICATE);
                        rcdTinCheck.setValue("custrecord_duplicated_tin_chk_record", tinCheckId);
                        rcdTinCheck.setValue("custrecord_tinchk_trg_id", newExRec.toString());
                        newTinCheckId = rcdTinCheck.save();
                        log.debug("Testing", "aft tin check save " + newTinCheckId);

                        // Now we have to update our new exchange record so it references the new TIN Check record we just created
                        var objValues = {
                            custrecord_exrec_tinchk_src_tin: newTinCheckId
                        };
                        if (so.getValue("custrecord_exrec_tinchk_src_giin") > "") {
                            objValues.custrecord_exrec_tinchk_src_giin = newTinCheckId
                        }
                        if (so.getValue("custrecord_exrec_usps_src_usps") > "") {
                            objValues.custrecord_exrec_usps_src_usps = newTinCheckId
                        }
                        record.submitFields({
                            type: 'customrecord_acq_lot',
                            id: newExRec,
                            values: objValues
                        });
                        log.debug("Testing", "aft submit fields ");
                    }

                } catch (etc) {
                    log.error("TIN Check processing error - " + etc.name, etc.message + ' : ' + etc.stack);
                }

                // END ATO-99
                //===========================================================================================================================

            } catch (e) {
                log.error(e.name, e.message + ' : ' + e.stack);
            }
            context.write(newExRec, oldExRec);
        }

        function reduce(context) {                        
            var funcName = scriptName + "reduce";
            context.write(context.key, context.values);
        }

        function summarize(summary) {
            var funcName = scriptName + "summarize";
            var totalRecordsCreated = 0,
                recordsMap = [],
                fileNumber;
            summary.output.iterator().each(function (key, value) {
                value = value.substring(2, value.length - 2);
                //log.audit('Created ExRec #' + key + ' from ExRec #' + value);
                totalRecordsCreated++;
                recordsMap.push({
                    oldId: value,
                    newId: key
                });
                fileNumber = value;
                return true;
            });

            // create Record Map that maps the old ExRec to the newly-created ExRec
            var recordsMapFile = file.create({
                name: 'recordsMapFile' + fileNumber,
                fileType: file.Type.JSON,
                contents: JSON.stringify(recordsMap),
                folder: 6622558
            });
            recordsMapFileId = recordsMapFile.save();

            log.audit('Total Exchange Records created: ' + totalRecordsCreated);

            // call subsequentPaymentsCertMapReduce.js
            var mapReduceTask = task.create({
                taskType: 'MAP_REDUCE',
                scriptId: 'customscript_subsequent_pmts_certs',
                deploymentId: 'customdeploy_subsequent_pmts_certs',
                params: {
                    custscript_records_map: recordsMapFileId
                }
            });
            var myTask = mapReduceTask.submit();
        }

        //find the index 
        function findWithAttr(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] == value) {
                    return i;
                }
            }
            return -1;
        }

        return {
            getInputData: getInputData,
            map         : map,
            reduce      : reduce,
            summarize   : summarize
        };
    });