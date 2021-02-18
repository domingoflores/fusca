/**
 * @NApiVersion 2.0
 * @NScriptType mapreducescript
 */

 /* Map/Reduce script called by populateAmountsSuitelet.js. Populates amounts on the Certificates based on the selected Release
  * Approval.
  */

define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'], 
    function(search, record, runtime, log, file, subsequentPaymentsLibrary){
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

                var newCert = soEntry.newCert;
                var amount = soEntry.amount;

                var id = record.submitFields({
                    type: 'customrecord_acq_lot_cert_entry',
                    id: newCert,
                    values: {
                        custrecord_acq_lotce_zzz_zzz_payment: amount,
                        custrecord_acq_lotce_zzz_zzz_grossamount: amount,
                        custrecord_act_lotce_tax_report_amount: amount
                    }
                });

                context.write(newCert, amount);
            },
            reduce: function(context) {         
                context.write(context.key, context.values);
            },
            summarize: function(summary) {
                var totalRecordsUpdated = 0,
                    amountSum = [],
                    anyCert;
                summary.output.iterator().each(function(key, value) {
                    value = value.substring(2, value.length-2);
                    log.audit('Updated Cert #' + key + ' with amount $' + value);
                    totalRecordsUpdated++;
                    amountSum += JSON.parse(value);
                    anyCert = key;
                    return true;
                });
                //log.audit('Total Certificate Records Updated: ' + totalRecordsUpdated);
                log.audit('Total Certificate Records Updated: ' + totalRecordsUpdated, 'Total amount: $' + amountSum);

                // look up this DER - find exRec and then find DER so we can redirect back to it
                var relatedExRecLookup = search.lookupFields({
                    type: 'customrecord_acq_lot_cert_entry',
                    id: anyCert,
                    columns: 'custrecord_acq_lotce_zzz_zzz_parentlot'
                });
                var relatedExRec = relatedExRecLookup.custrecord_acq_lotce_zzz_zzz_parentlot[0].value;
                var relatedDer = subsequentPaymentsLibrary.getDERbyExRec(relatedExRec);

                subsequentPaymentsLibrary.sendCompletionEmail('Certificate Amount Population Complete',
                    'Certificate Amounts have been populated for DER #' + relatedDer, 
                    [],
                    relatedDer);
            }
        }
    });