/**
 * @NApiVersion 2.0
 * @NScriptType mapreducescript
 */

/* Map/Reduce script called by subsequentPaymentsMapReduce.js. Creates the corresponding Certificates for
 * each of the newly created Exchange Records.
 */

define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/email'
	   ,'/SuiteScripts/Pristine/libraries/searchResultsLibrary.js'
	   ,'/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'
	   ], 
    function(search, record, runtime, log, file ,email 
    		,searchResultsLibrary
    		,subsequentPaymentsLibrary
    		){

        return {
            getInputData: function(context) {
                // grab Records Map parameter - the file ID of the file containing our Records Map
                // Made this a file in case of size limitations with very large numbers
                var recordsMapId = JSON.parse(runtime.getCurrentScript().getParameter({
                    name: 'custscript_records_map'
                }));

                var recordsMap = file.load({
                    id: recordsMapId
                }).getContents();
                
                recordsMap = JSON.parse(recordsMap);

                // contents is array of objects {oldId:xxx, newId:xxx} where oldId is the ExRec that was cloned and newId is the newly-created exRec.
                file.delete({ id:recordsMapId });
                
                if (recordsMap.length == 0) {
                    log.debug("getInputData" ,"recordsMap: " + JSON.stringify(recordsMap) );
                	throw "ERROR: The incoming recordsMap is empty. The recordsMap must contain at least one exchange record. User may have selected a DER to copy that had ZERO exchange records.";
                }

                // grab the list of old IDs to create a search with
                var oldIds = [];
                for(var i = 0; i < recordsMap.length; i++) {
                    oldIds.push(recordsMap[i].oldId);
                }

                // load and modify search to only include certificates attached to the old ExRecs
                var srch =  search.load({ id: 'customsearch_scr_certs_for_subseq_pmts' });
                var exRecFilter = search.createFilter({ 
                    name: 'custrecord_acq_lotce_zzz_zzz_parentlot',
                    operator: search.Operator.ANYOF,
                    values: oldIds,
                });
                srch.filters.push(exRecFilter);
                var resultSet = srch.run();
                var all = searchResultsLibrary.getSearchResultData(resultSet);

                // combine the datasets - need to map the new ExRec ID to the old one for each cert
                var combinedData = [];
                for(var i = 0; i < all.length; i++) {
                    var thisCert = {};
                    thisCert.searchResult = all[i];
                    var oldId = all[i].getValue({
                        name: 'custrecord_acq_lotce_zzz_zzz_parentlot'
                    });
                    thisCert.newId = mapNewId(recordsMap, oldId);
                    combinedData.push(thisCert);
                }

                // combinedData is array of objects that includes search results, and the parent Exchange Record ID of the
                // Exchange Record we will be attached Certs to (the newly Exchange Record)
                return combinedData;
            },
            map: function(context) {
                // create a Cert using results from the search
                var soEntry = JSON.parse(context.value),
                    newId = soEntry.newId,
                    oldId = soEntry.searchResult.values['custrecord_acq_lotce_zzz_zzz_parentlot'][0].value,
                    oldCertId = soEntry.searchResult.id,
                    searchResult = soEntry.searchResult.values,
                    properties = [];

                try { 
                    for(prop in searchResult) {
                        var temp = searchResult[prop];

                        if(typeof temp === "object") {
                            temp = subsequentPaymentsLibrary.handleObjectResults(temp);
                        }
                        temp = subsequentPaymentsLibrary.cleanSearchData(temp);

                        if(prop == 'custrecord_created_from_cert_id' && temp == '') {
                            // the Certificate that was used to create _this_ certificate has no parent, so it is the parent
                            temp = oldCertId;
                        }
                        if(prop == 'custrecord_acq_lotce_taxreporting_status' && temp != '1') {
                            // from Tax Reporting Status List
                            // if the Tax Reporting Status is 'Not SRS Responsibility' (1), don't change it
                            // otherwise, it should be 'Pending' (6)
                            temp = '6';
                        }

                        properties.push({ property:prop ,value:temp});  
                    }
                    
                    // set amounts to 0 (PPE-120)
                    var amountFields = [
                        'custrecord_acq_lotce_zzz_zzz_payment'
                        , 'custrecord_acq_lotce_zzz_zzz_grossamount'
                        , 'custrecord_act_lotce_tax_report_amount'
                        , 'custrecord_acq_lotce_orig_pmt_amt'           // ATP-1990
                    ];
                    for(var i = 0; i < amountFields.length; i++) {
                        properties.push({
                            property: amountFields[i],
                            value: 0.00
                        });
                    }
                    
                    // ATP-1990 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    var objCertFields = search.lookupFields({ type:'customrecord_acq_lot_cert_entry' ,id:oldCertId
                        ,columns:["custrecord_acq_lotce_zzz_zzz_currencytyp"
                      	         ,"custrecord_acq_lotce_orig_currency"
                                 ]});

                    properties.push({ property:'custrecord_acq_lotce_orig_currency'       ,value:null });
                    
                    var currencyType = null; // Initialize to null in case both fields are empty
                    if (objCertFields["custrecord_acq_lotce_orig_currency"].length > 0)       { currencyType = objCertFields["custrecord_acq_lotce_orig_currency"][0].value  }
                    else
                    if (objCertFields["custrecord_acq_lotce_zzz_zzz_currencytyp"].length > 0) { currencyType = objCertFields["custrecord_acq_lotce_zzz_zzz_currencytyp"][0].value }
                    properties.push({ property:'custrecord_acq_lotce_zzz_zzz_currencytyp' ,value:currencyType });
                    // ATP-1990 end +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

                    
                    properties.push({ // point this Cert to the new exRec
                        property: 'custrecord_acq_lotce_zzz_zzz_parentlot',
                        value: newId
                    });


                    var so = record.create({
                        type: soEntry.searchResult.recordType
                    });

                    for(var i = 0; i < properties.length; i++) {
                        so.setValue({
                            fieldId: properties[i].property,
                            value: properties[i].value
                        });
                    }

                    var newCertId = so.save(); 

                } catch(e) {
                    log.error(e.name, e.message + ' : ' + e.stack);
                }
                context.write(newCertId, {
                                        newId: newId, // new exrec ID
                                        oldCertId: oldCertId,
                                        oldExRecId: oldId
                                        });
            },
            reduce: function(context) {         
                context.write(context.key, context.values);
            },
            summarize: function(summary) {
                var totalRecordsCreated = 0;
                var newCertId,
                    oldCertId,
                    newId,
                    oldExRecId,
                    fileContents = 'New Exchange Record ID,New Certificate ID,Old Exchange Record ID,Old Certificate ID\n';
                    // create a csv file of the old and new ExRecs with their old and new Certificates
                summary.output.iterator().each(function(key, value) {
                    newCertId = key;
                    value = value.substring(3, value.length-3);
                    value = value.replace(/\\/g,"");
                    value = value.replace(/\"/g,"");
                    value = value.split(/[:,]/);
                    newId = value[1];
                    oldCertId = value[3];
                    oldExRecId = value[5];

                    fileContents += newId + ',' + newCertId + ',' + oldExRecId + ',' + oldCertId + '\n'; 

                    //log.audit('Created Cert #' + newCertId + ' for ExRec #' + newId);
                    totalRecordsCreated++;

                    return true;
                });
                log.audit('Total LOT Certificate Records created: ' + totalRecordsCreated);

                if (totalRecordsCreated > 0) {
                    var relatedDer  = subsequentPaymentsLibrary.getDERbyExRec(newId);
                    var relatedDeal = subsequentPaymentsLibrary.getDealbyDER(relatedDer)[0].text;
                    var sentFile = file.create({ name:'SubsequentPayments' + relatedDer + '.csv' ,fileType:file.Type.CSV ,contents:fileContents });
                    subsequentPaymentsLibrary.sendCertCompletionEmail(relatedDeal + ' Subsequent Payments Creation Complete',
                                'Subsequent Payments have been created for ' + relatedDeal + ' DER #' + relatedDer, 
                                [sentFile],
                                relatedDer);
                }
                else { 
                	sendFailureEmail('Subsequent Payments Creation Failed' ,'Subsequent Payments have NOT been created for your request'); 
                	throw "ZERO Certs were created"; 
                }
            }
        }

        function mapNewId(recordsMap, oldId) {
            for(var i = 0; i < recordsMap.length; i++) {
                if(recordsMap[i].oldId == oldId) {
                    return recordsMap[i].newId;
                }
            }
            return false;
        }
        
        
        function sendFailureEmail(subject, body) {
            //clicker = getButtonClicker();
            var filters = [];
            filters.push(search.createFilter({ name:'date'       ,operator: 'within' ,values:['today'] }));
            filters.push(search.createFilter({ name:'scripttype' ,operator: 'anyof'  ,values:[runtime.getCurrentScript().id] }));
            var columns = [];
            columns.push(search.createColumn({ name:'internalid' ,sort:search.Sort.DESC }));
            columns.push(search.createColumn({ name:'internalid' ,join:'user'           }));
            var clickerSearch = search.create({ type:'scriptexecutionlog' 
            	                            ,filters:filters
                                            ,columns:columns      }).run();
            var clickerResults = clickerSearch.getRange({ start:0 ,end:1 });
            var clicker        = clickerResults[0].getValue({ name:'internalid' ,join:'user' });
            email.send({author:28154  // 'Operations Group' operations@shareholderrep.com
                   ,recipients:[clicker]
                      ,subject:subject
                         ,body:body         });          
        }
        
        
        
    });