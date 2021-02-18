/**
* @NApiVersion 2.x
* @NScriptType MapReduceScript
* @NModuleScope SameAccount
*/

define(['N/runtime' ,'N/record' ,'N/error' ,'N/search' ,'N/file' ,'N/task'
,'/.bundle/132118/PRI_ServerLibrary'
,'/SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
],
            
    function(runtime ,record ,error ,search ,file ,task ,priLibrary ,ExRecAlphaPI) {

        var scriptName = "ad_hoc_RandW_mr.js-->";


        function getInputData() {

            var funcName = scriptName + "getInputData";

            log.debug(funcName, "Process is starting");

            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["category","anyof","1"]
                    ],
                columns:
                    [
                        search.createColumn({name: "entityid", label: "Name"}),
                        search.createColumn({
                            name: "custentity_qx_rwinsurance",
                            sort: search.Sort.ASC,
                            label: "R&W Insurance"
                        }),
                        search.createColumn({name: "custentity_deal_rw_insur_spec", label: "R&W INSURANCE SPECIFIED"}),
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
            });
                                
            return customerSearchObj;        
        }
      
      
        //================================================================================================================================
        //================================================================================================================================
        function map(context) {
            var funcName = scriptName + "map ";
            var success = "success";

            try {
                
                log.debug("map-"+funcName, context );
                log.debug("JSON.parse(context.value)", JSON.parse(context.value) )

                var obj = JSON.parse(context.value);
                
                
                customerRecordId = obj.id;
                var currDatetime = new Date();
                funcName = funcName + "id:" + customerRecordId + " time:" + currDatetime.getTime();
                
                var row           = obj.values["custentity_qx_rwinsurance"];
                row = row.toLowerCase();

                log.debug(funcName, "customerRecordId: " + customerRecordId + ",   row: " + row + ""); 


                try {

                    if ( row != 'n/a' && row != ''  ){
                        log.debug('YES - '+customerRecordId);
                        var id = record.submitFields({
                            type: record.Type.CUSTOMER, 
                            id: customerRecordId,
                            values: {
                                custentity_deal_rw_insur_spec: 2    // YES
                                },
                            options: {
                                enableSourcing: false, 
                                ignoreMandatoryFields : true
                            }
                        });
                    }

                    if ( row == 'n/a' ){
                        log.debug('NO - '+customerRecordId);
                        var id = record.submitFields({
                            type: record.Type.CUSTOMER, 
                            id: customerRecordId,
                            values: {
                                custentity_deal_rw_insur_spec: 3    // NO
                                },
                            options: {
                                enableSourcing: false, 
                                ignoreMandatoryFields : true
                            }
                        });
                    }

                    if ( row == '' ){
                        log.debug('UNKNOWN - '+customerRecordId);
                        var id = record.submitFields({
                            type: record.Type.CUSTOMER, 
                            id: customerRecordId,
                            values: {
                                custentity_deal_rw_insur_spec: 1    // UNKNOWN
                                },
                            options: {
                                enableSourcing: false, 
                                ignoreMandatoryFields : true
                            }
                        });
                    }

                }
                catch(e) {
                    log.error(funcName, "ERR exception: " + e);
                }
            
            }
            catch (e) { log.error(funcName, e); success = "Failed"; }
                
            context.write(customerID, success);                   
        }

      
        //================================================================================================================================
        //================================================================================================================================
        function summarize(summary) {
            var funcName = scriptName + "summarize";

            log.debug(funcName, "summary="+ JSON.stringify(summary) );    
        }


        //================================================================================================================================
        //================================================================================================================================
        return { getInputData: getInputData
                        ,map: map
                ,summarize: summarize
        };

});