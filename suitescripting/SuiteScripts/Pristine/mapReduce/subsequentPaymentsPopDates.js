/**
 * @NApiVersion 2.0
 * @NScriptType mapreducescript
 */

 /* Map/Reduce script called by subsequentPaymentsPopAmtsMapReduce.js. Pulls Last Modified Date from Release Record and populates 
  * Instructed to Pay Dates on the DER/ERs after Cert amounts are populated.
  */

define(['N/search', 'N/record', 'N/runtime', 'N/log', '/SuiteScripts/Pristine/libraries/searchResultsLibrary.js', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'], 
    function(search, record, runtime, log, searchResultsLibrary, subsequentPaymentsLibrary){
        return {
            getInputData: function(context) {
                // grab parameter
                var thisDER = runtime.getCurrentScript().getParameter({
                    name: 'custscript_pop_date_der'
                });
                
                // find the Exchange Records that these Certs are attached to
                var filters = [];
                filters.push(search.createFilter({
                    name: 'custrecord_acq_lot_payment_import_record',
                    operator: 'is',
                    values: thisDER
                }));

                var columns = [];
                columns.push(search.createColumn({
                    name: 'internalid'
                }));

                var mySearch = search.create({
                    type: 'customrecord_acq_lot',
                    filters: filters,
                    columns: columns
                }).run();
                var mySearchResults = searchResultsLibrary.getSearchResultData(mySearch);

                // find the Release Record that was used for this DER
                // and grab the Last Modified date from that Release Record
                var thisReleaseApproval = search.lookupFields({
                    type: 'customrecord_payment_import_record',
                    id: thisDER,
                    columns: 'custrecord_release_approval_record'
                }).custrecord_release_approval_record[0].value;
                var thisDate = search.lookupFields({
                    type: 'customrecord_escrow_payment_approvals',
                    id: thisReleaseApproval,
                    columns: 'lastmodified'
                }).lastmodified;

                // thisDate returns as 11/27/2017 1:33 pm
                // It needs to be in 11/27/2017 1:33:00 pm format in order to upload
                var formattedDate = thisDate.slice(0, -3) + ':00' + thisDate.slice(-3);

                // mark the DER with the date
                record.submitFields({
                    type: 'customrecord_payment_import_record',
                    id: thisDER,
                    values: {
                        custrecord_pay_import_pay_date: formattedDate
                    }
                });

                var combinedData = [];
                for(var i = 0; i < mySearchResults.length; i++) {
                    var temp = mySearchResults[i].id;
                    combinedData.push({
                        exrec: temp,
                        lastmoddate: formattedDate
                    });
                }

                return combinedData;
            },
            map: function(context) {
                var soEntry = JSON.parse(context.value),
                    exRecId = soEntry.exrec,
                    modDate = soEntry.lastmoddate;
                    // log.error('exRecId', exRecId);
                    // log.error('modDate', modDate);

                record.submitFields({
                    type: 'customrecord_acq_lot',
                    id: exRecId,
                    values: {
                        custrecord_acq_loth_zzz_zzz_topaydate: modDate
                    }
                });

                context.write(exRecId, 'SUCCESS');
            },
            reduce: function(context) {         
                context.write(context.key, context.values);
            },
            summarize: function(summary) {
                var totalRecordsUpdated = 0,
                    anyExRec;
                summary.output.iterator().each(function(key, value) {
                    totalRecordsUpdated++;
                    anyExRec = key;
                    return true;
                });
                log.audit('Total Exchange Records Updated with Instructed to Pay Dates: ' + totalRecordsUpdated);

                // look up this DER so we can redirect back to it in the email
                var relatedDer = subsequentPaymentsLibrary.getDERbyExRec(anyExRec);
                var relatedDeal = subsequentPaymentsLibrary.getDealbyDER(relatedDer)[0].text;

                subsequentPaymentsLibrary.sendAmountCompletionEmail(
                    relatedDeal + ' Certificate Amount Population Complete',        
                    'Certificate Amounts have been populated for ' + relatedDeal + ' DER #' + relatedDer, 
                    [],
                    relatedDer);
            }
        }

        function grabExRecSearchResult(searchResult) {
        return searchResult.getValue({
            name: 'custrecord_acq_lotce_zzz_zzz_parentlot',
            summary: search.Summary.GROUP
        });
    }
    });