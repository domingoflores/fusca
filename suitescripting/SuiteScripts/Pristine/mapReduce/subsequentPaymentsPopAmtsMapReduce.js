/**
 * @NApiVersion 2.0
 * @NScriptType mapreducescript
 */

 /* Map/Reduce script called by populateAmountsSuitelet.js. Populates amounts on the Certificates based on the selected Release
  * Approval.
  */

define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'], 
    function(search, record, runtime, log, file, task, subsequentPaymentsLibrary){
        return {
            getInputData: function(context) {
                // grab parameter
                var amountMapFile = runtime.getCurrentScript().getParameter({
                    name: 'custscript_amt_map_file'
                });
                var amountMap = file.load({
                    id: amountMapFile
                }).getContents();
                amountMap = JSON.parse(amountMap);
                // contents is array of objects {newCert: xxx, amount: xxx}
                file.delete({
                    id: amountMapFile
                });

                return amountMap;
            },
            map: function(context) {
                var soEntry = JSON.parse(context.value);

                var newCert = soEntry.newCert,
                    amount = soEntry.amount,
                    priorityPaymentType = soEntry.priorityPaymentType;

                if(priorityPaymentType != 4) { // PPE-165: if the Priority Payment Type on the ExRec is NOT 'AES'
                    // we can add the amount to Payment Amount, Tax Reportable Amount, and Gross Proceeds
                    record.submitFields({
                        type: 'customrecord_acq_lot_cert_entry',
                        id: newCert,
                        values: {
                            custrecord_acq_lotce_zzz_zzz_payment: amount,
                            custrecord_acq_lotce_zzz_zzz_grossamount: amount,
                            custrecord_act_lotce_tax_report_amount: amount
                        }
                    });
                } else { // otherwise, only change Gross Proceeds to the amount
                    record.submitFields({
                        type: 'customrecord_acq_lot_cert_entry',
                        id: newCert,
                        values: {
                            custrecord_acq_lotce_zzz_zzz_grossamount: amount,
                            custrecord_act_lotce_tax_report_amount: amount
                        }
                    });
                }

                context.write(newCert, amount);
            },
            reduce: function(context) {         
                context.write(context.key, context.values);
            },
            summarize: function(summary) {
                var totalRecordsUpdated = 0,
                    amountSum = 0,
                    anyCert;
                summary.output.iterator().each(function(key, value) {
                    anyCert = key;
                    value = value.substring(2, value.length-2);
                    //log.audit('Updated Cert #' + key + ' with amount $' + value);
                    totalRecordsUpdated++;
                    amountSum += value;
                    return true;
                });
                log.audit('Total Certificate Records Updated: ' + totalRecordsUpdated);
                // TODO: Get the stupid sum to work
                //log.audit('Total Certificate Records Updated: ' + totalRecordsUpdated, 'Total amount: $' + amountSum);

                // look up this DER - find exRec and then find DER so we can pass it to the next step
                var relatedExRecLookup = search.lookupFields({
                    type: 'customrecord_acq_lot_cert_entry',
                    id: anyCert,
                    columns: 'custrecord_acq_lotce_zzz_zzz_parentlot'
                });
                var relatedExRec = relatedExRecLookup.custrecord_acq_lotce_zzz_zzz_parentlot[0].value;
                var relatedDer = subsequentPaymentsLibrary.getDERbyExRec(relatedExRec);

                // call subsequentPaymentsPopDates.js
                var mapReduceTask = task.create({
                    taskType: 'MAP_REDUCE',
                    scriptId: 'customscript_subsequent_pmts_pop_date_mr',
                    deploymentId: 'customdeploy_subsequent_pmts_pop_date_mr',
                    params: {
                        custscript_pop_date_der: relatedDer
                    }
                });
                var myTask = mapReduceTask.submit();
            }
        }
    });