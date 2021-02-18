/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 * @NModuleScope Public
 */

//------------------------------------------------------------------------------------------------------------------------------------
//Description:  This scheduled script will run on a schedule to find all record (see app setting for record type list) rows modified since 
//              the last time the script ran.   
//Developer:    Ken C
//Date:         Sep 2019
//Comments:     
//              
//------------------------------------------------------------------------------------------------------------------------------------

define(['N/search', 'N/record', 'N/runtime','N/task','N/format'
    ,'/.bundle/132118/PRI_AS_Engine' 
    ,'/.bundle/132118/PRI_QM_Engine' 
    ,'/SuiteScripts/Pristine/libraries/odsSyncLibrary.js' 
    ],
    function(search, record, runtime, task, format
        ,appSettings
        ,qmEngine
        ,odsSyncLib
        ) {

       
        // Global constants and variables
        var scriptName = "odsSyncSS.js";
        const   ods_sync_requested = 1
                ods_sync_successful = 2
                ods_sync_no_records = 4
                RECORD_SYNC_SUCEEDED = 1;
                RECORD_SYNC_FAILED = 2;
              
        // --------------------------------------------------------------------------------------------------------------------------------

        function execute(context) {
        
            var funcName = scriptName + ".execute";
            var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            var MIN_USAGE_THRESHOLD = 500;                      // when governance usage falls below this threshold, script will terminate
            var QUEUE_NAME = "ODS Sync";                          // the name of the queue
            var SCRIPT_ID = "customscript_ods_sync_ss";      // id for this script

            log.debug(funcName, "Starting");
            
            // First get list of record types to sync
            var nextSyncDT = new Date();
            var tablesToSync = odsSyncLib.getTablesToSync();
            log.debug(funcName, 'tablesToSync: ' + JSON.stringify(tablesToSync));

            // Sync each record type
            var syncTableResult;
            var now;
            var syncTableId;
            var lastSyncDTObj = {};
            var syncStatus = ' ';
            var recList = '';

            for each (result in tablesToSync) {    

                try {
                   // Check to see if remaining usage is low
                    log.debug(funcName, "RemainingUsage: " + runtime.getCurrentScript().getRemainingUsage() );
                    if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
                        log.debug(funcName, 'Ran out of governance. Abandoning.')                      
                        break;                          
                    }
                    // log.debug(funcName, 'result: ' + JSON.stringify(result) + ' typeof: ' + typeof result);
                    // log.debug(funcName, 'result.id: ' + result.id + ' typeof: ' + typeof result.id);
                    syncTableId = result.id;
                    lastSyncDTObj = getLastSyncDT(result); 
                    syncTableResult = syncTable(context, result, lastSyncDTObj);
                    log.debug(funcName, 'syncTableResult: ' + JSON.stringify(syncTableResult));
                    log.debug(funcName, 'syncTableResult.recSyncsRequestedCnt: ' + syncTableResult.recSyncsRequestedCnt);

                    // Update ODS Sync Record Type with results

                    if (Number(syncTableResult.recSyncsRequestedCnt) > 0) {
                        syncStatus = ods_sync_requested;
                        recList = syncTableResult.recSyncsRequested

                    } else {
                        syncStatus = ods_sync_no_records;
                        recList = '';
                    }
                    // log.debug(funcName, 'syncStatus: ' + syncStatus);
                    try {
                        record.submitFields({
                            type: "customrecord_ods_sync_rectype", 
                            id: syncTableId, 
                            values: {   "custrecord_osr_last_sync_datetime": nextSyncDT
                                        ,"custrecord_osr_last_sync_status" : syncStatus
                                        ,"custrecord_osr_list_of_recs_requested": recList
                                        ,"custrecord_osr_nbr_records_requested": syncTableResult.recSyncsRequestedCnt 
                                        ,"custrecord_osr_nbr_records_processed": 0
                                        ,"custrecord_osr_nbr_records_successful": 0
                                    }
                        });
                    }
                    catch(e) {
                        log.error(funcName, 'ODS SYNC ERROR updating ODS Sync Record Type with id=' + syncTableId + '. Error: '  + JSON.stringify(e) );                                
                    }
                }
                catch(e) {
                    log.error(funcName,'ODS SYNC ERROR processing ODS Sync Record Type with id=' + syncTableId + '. Error: '  + JSON.stringify(e) ); 
                }   
            }
            log.debug(funcName, "RemainingUsage: " + runtime.getCurrentScript().getRemainingUsage() );
            log.debug(funcName, "Finishing");

        }
        // --------------------------------------------------------------------------------------------------------------------------------
        function syncTable(context, tableToSync, lastSyncDTObj) {
            var funcName = scriptName + ".syncTable - " + tableToSync.getValue('custrecord_osr_search_type');
            log.debug(funcName, 'tableToSync: ' + JSON.stringify(tableToSync));
            
            
            var syncmodifiedRecsResult;
            var result = {};
            result.success = true;
            result.intQid = null;
            result.recSyncsRequestedCnt = 0;
            result.recSyncsRequested = 0;

            try {
                // Search each table for a list of rows modified since the last cycle    
                var modifiedRecs = getModifiedRecs(tableToSync, lastSyncDTObj);
                log.debug(funcName, 'modifiedRecs: ' + JSON.stringify(modifiedRecs));

                // The following steps are only performed for periods going back less than 16 minutes
                if (lastSyncDTObj.periodmins && lastSyncDTObj.periodmins < 16) {
                    // Now find any failed syncs since last sync
                    var failedSyncs = getFailedSyncs(tableToSync,lastSyncDTObj);
                    log.debug(funcName, 'failedSyncs: ' + JSON.stringify(failedSyncs));
                    // Add them to the list of records to modify and then remove duplicates
                    modifiedRecs = modifiedRecs.concat(failedSyncs);
                    log.debug(funcName, 'modifiedRecs after addding failures: ' + JSON.stringify(modifiedRecs));
                    
                    // log.debug(funcName, 'modifiedRecs after dedup: ' + JSON.stringify(modifiedRecs));
                    // Now lets find all the rows successfully synced via UE script in the same period
                    var UESyncedRecs = getUESyncedRecs(tableToSync,lastSyncDTObj);
                    log.debug(funcName, 'UESyncedRecs: ' + JSON.stringify(UESyncedRecs));

                    // Now go through the records modified since the last sync and remove any which have already been synced via the 
                    // User Event script
                    // Then remove dupes
                    var recsToSync = removeUESyncedRecs(modifiedRecs,UESyncedRecs);
                    log.debug(funcName, 'recsToSync: ' + JSON.stringify(recsToSync));
                    recsToSync = odsSyncLib.removeDuplicatesFromArray(recsToSync);
                } else {
                    log.debug(funcName, 'Period to sync is greater than 16 minutes therefore all rows modfied during period will be re-synced');
                    // recsToSync = modifiedRecs;
                    recsToSync =  copyToFinalArray(modifiedRecs);
                }
             
                if (recsToSync.length > 0) {
                    syncmodifiedRecsResult = syncmodifiedRecs(context, tableToSync, recsToSync);
                    success = syncmodifiedRecsResult.success;
                    result.intQid = syncmodifiedRecsResult.intQid;
                    result.recSyncsRequestedCnt = syncmodifiedRecsResult.recSyncsRequestedCnt;
                    result.recSyncsRequested = syncmodifiedRecsResult.recSyncsRequested;
                }           
            } catch(e) {
                log.error(funcName, 'ODS SYNC ERROR: ' +  JSON.stringify(e) );                                
            }
            return result;
        }
        // --------------------------------------------------------------------------------------------------------------------------------
        function copyToFinalArray(modifiedRecs) {
            var funcName = scriptName + ".copyToFinalArray";
            var recsToSync = [];
            var thisRecId;
            for each (result in modifiedRecs) {   
                // log.debug(funcName, 'modified rec: ' + JSON.stringify(result)); 
                thisRecId = result.recId;
                recsToSync.push(thisRecId);     
            }
            return recsToSync;
        }
        // --------------------------------------------------------------------------------------------------------------------------------

        function getUESyncedRecs(tableToSync,lastSyncDTObj) {
            var funcName = scriptName + ".getUESyncedRecs";

            var recTypeIntId = tableToSync.getValue('custrecord_osr_rectype');
            var searchType = tableToSync.getValue('custrecord_osr_search_type');

            var auditRecs = [];
            var filters = [];
            var columns = [];
            var recId;
            var syncDatetime;

            filters.push(search.createFilter({
                name: 'custrecord_osat_calling_script',
                operator: search.Operator.ISNOT,
                values: scriptName
            }));
            filters.push(search.createFilter({
                name: 'custrecord_osat_sync_datetime',
                operator: search.Operator.ONORAFTER,
                values: lastSyncDTObj.lastSyncDT
            }));
            filters.push(search.createFilter({
                name: 'custrecord_osat_record_type',
                operator: search.Operator.IS,
                values: searchType  
            }));
            filters.push(search.createFilter({
                name: 'custrecord_osat_sync_result',
                operator: search.Operator.ANYOF,
                values: RECORD_SYNC_SUCEEDED  
            }));
            columns.push(search.createColumn({
                name: 'custrecord_osat_record_id',
                summary: search.Summary.GROUP
            }));
             columns.push(search.createColumn({
                name: 'custrecord_osat_sync_datetime',
                summary: search.Summary.MAX
            }));

            var ss = search.create({type: 'customrecord_ods_sync_audit_trail',
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                recId = result.getValue({
                    name: 'custrecord_osat_record_id',
                    summary: search.Summary.GROUP
                    });
                syncDatetime = result.getValue({
                    name: 'custrecord_osat_sync_datetime',
                    summary: search.Summary.MAX
                    });
             
                auditRecs.push({'recId': recId, 'syncDatetime': syncDatetime}); 
                return true;
            });

            return auditRecs;
        }
        // --------------------------------------------------------------------------------------------------------------------------------
        function removeUESyncedRecs(modifiedRecs,UESyncedRecs) {
            var funcName = scriptName + ".removeUESyncedRecs";
            var recsToSync = [];
            var syncedRec = {};
            var syncedRecParsedDT;
            var lastModifiedDatetimeMs
            var lastModifiedDatetime;
            var syncDatetime;
            var syncDatetimeMs;
            var thisRecId;
            for each (result in modifiedRecs) {   
                log.debug(funcName, 'modified rec: ' + JSON.stringify(result)); 
                thisRecId = result.recId;
                lastModifiedDatetime = result.lastModifiedDatetime;
                // log.debug(funcName, 'lastModifiedDatetime: ' + JSON.stringify(lastModifiedDatetime)); 
              
                lastModifiedDatetimeMs = format.parse(lastModifiedDatetime,format.Type.DATETIME).getTime();
                // log.debug(funcName, 'lastModifiedDatetimeMs: ' + JSON.stringify(lastModifiedDatetimeMs) + '-' + typeof lastModifiedDatetimeMs);

                syncedRec = searchArray(thisRecId, UESyncedRecs); 
                if (syncedRec) {
                    // log.debug(funcName, 'syncedRec: ' + JSON.stringify(syncedRec)); 
                    syncDatetime = syncedRec.syncDatetime;
                    // log.debug(funcName, 'syncDatetime: ' + syncDatetime + '-' + typeof syncDatetime);
                    syncDatetimeMs = format.parse(syncDatetime,format.Type.DATETIME).getTime();
                    // log.debug(funcName, 'syncDatetimeMs: ' + JSON.stringify(syncDatetimeMs) + '-' + typeof syncDatetimeMs);                   
                  
                    // If the record was modified after the last successful sync then it needs re-syncing
                    if (lastModifiedDatetimeMs > syncDatetimeMs){
                        recsToSync.push(thisRecId);
                        // log.debug(funcName, 'rec modified after last sync - needs to be synced' + JSON.stringify(recsToSync));     
                    } else {
                        // The record has been synced on or after it was last modifed and therefore do not re-sync
                        // log.debug(funcName, 'rec synced after last modified  - no further sync required'); 
                    }
                } else {
                    // If we cannot find a sync audit for a record then we must sync it
                    // log.debug(funcName, 'result: ' + JSON.stringify(result)); 
                    // log.debug(funcName, 'thisRecId: ' + JSON.stringify(thisRecId)); 
                    recsToSync.push(thisRecId);
                    log.debug(funcName, 'Record needs to be synced' + JSON.stringify(recsToSync));  
                }
            }
            return recsToSync;
        }
  
        // --------------------------------------------------------------------------------------------------------------------------------
        function searchArray(recIdKey, myArray){
            for each (result in myArray) {    
                if (result.recId === recIdKey) {
                    return result;
                }
            }
        }
        // --------------------------------------------------------------------------------------------------------------------------------    
        function getLastSyncDT(syncRecType) {
            var funcName = scriptName + ".getLastSyncDT";
           
            var lastSyncDT = syncRecType.getValue('custrecord_osr_last_sync_datetime');
            // log.debug(funcName, 'lastSyncDT: ' + JSON.stringify(lastSyncDT) + '-' + typeof lastSyncDT); 
            var nowms = Date.now(); 
            var lastSyncDTObj = {};   
            if (lastSyncDT) {
                var parsedLastSyncDT = format.parse({
                    value: lastSyncDT,
                    type: format.Type.DATETIME
                });
                // log.debug(funcName, 'parsedLastSyncDT: ' + parsedLastSyncDT + '-' + typeof parsedLastSyncDT);
                lastSyncDTObj.lastSyncDTms = parsedLastSyncDT.getTime();
                lastSyncDTObj.periodmins = (nowms - lastSyncDTObj.lastSyncDTms)/60000;
                lastSyncDTObj.lastSyncDT = lastSyncDT.slice(0, -6) + lastSyncDT.slice(-3); 
            }

            log.debug(funcName, 'lastSyncDTObj: ' + JSON.stringify(lastSyncDTObj)); 
            return lastSyncDTObj;               
        }

        // --------------------------------------------------------------------------------------------------------------------------------

        function getModifiedRecs(tableToSync, lastSyncDTObj) {
            var funcName = scriptName + ".getModifiedRecs";
            var recTypeIntId = tableToSync.getValue('custrecord_osr_rectype');
            var searchType = tableToSync.getValue('custrecord_osr_search_type');
            var syncCondition = tableToSync.getValue('custrecord_osr_sync_condition');
            log.debug(funcName,'syncCondition: ' + syncCondition);
            var lastmodified = 'lastmodified';
            // If table is native then it has a negative recTypeIntId and a different field for last modified date
            if (Number(recTypeIntId) < 0) {
                lastmodified = 'lastmodifieddate';
            }
            var modifiedRecs = [];
            var filters = [];
            var columns = [];
            var recId;
            var lastModifiedDatetime;

            if (lastSyncDTObj.lastSyncDT) {
                filters.push(search.createFilter({
                    name: lastmodified,
                    operator: search.Operator.AFTER,
                    values: lastSyncDTObj.lastSyncDT
                }));
            }
           
            if (syncCondition) {
                filters = odsSyncLib.addConditions(filters, syncCondition);
            }

            columns.push(search.createColumn({
                name: 'internalid',
                summary: search.Summary.GROUP
            }));

            columns.push(search.createColumn({
                name: lastmodified,
                summary: search.Summary.MAX
            }));

            var ss = search.create({type: searchType,
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                recId = result.getValue({
                    name: 'internalid',
                    summary: search.Summary.GROUP
                    });
                lastModifiedDatetime = result.getValue({
                    name: lastmodified,
                    summary: search.Summary.MAX
                    });
             
                modifiedRecs.push({'recId': recId, 'lastModifiedDatetime': lastModifiedDatetime}); 
               
                return true;
            });

            return modifiedRecs;
        }

        // --------------------------------------------------------------------------------------------------------------------------------
        function getFailedSyncs(tableToSync, lastSyncDTObj) {
            var funcName = scriptName + ".getFailedSyncs";
            var recTypeIntId = tableToSync.getValue('custrecord_osr_rectype');
            var searchType = tableToSync.getValue('custrecord_osr_search_type');

            var failedSyncs = [];
            var filters = [];
            var columns = [];
            var recId;

            filters.push(search.createFilter({
                name: 'custrecord_osat_calling_script',
                operator: search.Operator.IS,
                values: scriptName
            }));
            filters.push(search.createFilter({
                name: 'created',
                operator: search.Operator.ONORAFTER,
                values: lastSyncDTObj.lastSyncDT
            }));
            filters.push(search.createFilter({
                name: 'custrecord_osat_record_type',
                operator: search.Operator.IS,
                values: searchType  
            }));
            filters.push(search.createFilter({
                name: 'custrecord_osat_sync_result',
                operator: search.Operator.ANYOF,
                values: RECORD_SYNC_FAILED  
            }));
            columns.push(search.createColumn({
                name: 'custrecord_osat_record_id',
                summary: search.Summary.GROUP
            }));

            var ss = search.create({type: 'customrecord_ods_sync_audit_trail',
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                recId = result.getValue({
                    name: 'custrecord_osat_record_id',
                    summary: search.Summary.GROUP
                    });
             
                failedSyncs.push({'recId': recId, 'lastModifiedDatetime': lastSyncDTObj.lastSyncDT}); 
                return true;
            });

            return failedSyncs;
        }

        // --------------------------------------------------------------------------------------------------------------------------------
        function syncmodifiedRecs(context, tableToSync, recsToSync) {
                
            var funcName = scriptName + ".syncmodifiedRecs";
            var syncPriority = tableToSync.getValue('custrecord_osr_sync_priority');
            var searchType = tableToSync.getValue('custrecord_osr_search_type');
            var success = true;
            var eventType;

            if(runtime.executionContext == 'SCHEDULED'){
                eventType = 'SCHEDULED'
            }
            else(eventType = context.type);

            log.audit(funcName,"eventType: " + eventType);

            var QManagerParm = { "ODSSyncRecordTypeId": tableToSync.id
                                ,"recordIdList": recsToSync
                                ,"startingIndex": 0
                                ,"recType": searchType
                                ,"envType": runtime.envType
                                ,"eventType": eventType
                                ,"executionContext": runtime.executionContext
                                ,"callingScript": scriptName };
              
            var intQid = qmEngine.addQueueEntry( "ODSSyncRecord" ,QManagerParm ,null ,true ,'customscript_ods_sync_record_qm', syncPriority);
            if (intQid) {
            } else {
                success = false;
            }
            var result = {};
            result.success = success;
            result.intQid = intQid;
            result.recSyncsRequestedCnt = recsToSync.length;
            result.recSyncsRequested = JSON.stringify(recsToSync);

            return result;
        }
        // --------------------------------------------------------------------------------------------------------------------------------        
        return {
            execute: execute
        };
    }
);