//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 *	Attempts to send all Tax Form Deal records which are ready for distribution (via Email)
 *
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/format','N/file', '/.bundle/132118/PRI_AS_Engine','/.bundle/132118/PRI_ServerLibrary','/SuiteScripts/Pristine/libraries/TaxForm_Library'],

    function(runtime,record,error,search,format,file, appSettings, priLibrary,taxFormLibrary) {

        var scriptName = "SRS_MR_TaxFormC2MDelivery.";

        const APP_NAME = "Tax Forms";

        const DELIVERY_TYPE = {
            EMAIL:      "1",
            MAIL:       "2"
        };

        const DOCUMENT_STATUS = {
            FINAL:      "5"
        };

        const DOCUMENT_TYPE = {
            CUSTOMER_TAX_DOCUMENT:      "43"
        };

        const BATCH_DETAIL_STATUS = {
            DRAFT:          "1",
            REMOVED:        "2",
            FINAL:          "3",
            DELIVERED:      "4",
            INACTIVE:       "5",
            FAILED:         "6",
            FILED:          "7",
            GENERATED:      "8"
        };

        function getInputData() {

            var funcName = scriptName + "getInputData";

            log.debug(funcName, "### STARTING ###");


            var mapRecords = [];

            var distSearch = search.create({
                type:       "customrecord_tax_distribution",
                filters:    [
                    ["isinactive",search.Operator.IS,false]
                    ,"AND",["custrecord_td_delivery_type",search.Operator.ANYOF,DELIVERY_TYPE.MAIL]
                    ,"AND",["custrecord_td_document_type",search.Operator.ANYOF,DOCUMENT_TYPE.CUSTOMER_TAX_DOCUMENT]
                    ,"AND",["custrecord_td_completed",search.Operator.IS,false]
                ],
                columns:    ["internalid"]
            }).run().getRange(0,100);


            for (var x in distSearch) {
                var ss = getBatchDetailsForTaxDistribution(distSearch[x].id);

                // get the first detail record's year filed
                var taxYearFiledId = ss[0].getValue({name: "custrecord_txfm_batch_yr_filed", join: "custrecord_txfm_detail_batch_id"});
                var taxYear = search.lookupFields({type: "customlist_tax_year_filed", id: taxYearFiledId, columns: ["name"]}).name;

                var folderId = createDistributionFolder(distSearch[x].id, taxYear);

                for (y in ss) {
                    var result = ss[y];

                    var obj = {
                        taxDistId:      distSearch[x].id,
                        batchDetailId:  result.id,
                        batchId:        result.getValue("custrecord_txfm_detail_batch_id"),
                        dealId:         result.getValue("custrecord_txfm_detail_deal"),
                        docId:          result.getValue("custrecord_txfm_detail_document_nopwd"),
                        protectedDocId:	result.getValue("custrecord_txfm_detail_document"),
                        fileId:         result.getValue({name: "custrecord_file", join: "custrecord_txfm_detail_document_nopwd"}),
                        folderId:       folderId
                    }

                    mapRecords.push(obj);
                }

            }


            return mapRecords;

        }


        function createDistributionFolder(taxDistId, taxYear) {
            var rootFolder = appSettings.readAppSetting(APP_NAME, "Tax Distribution C2M Root Folder");

            if (!rootFolder.endsWith("/"))
                rootFolder += "/";

            var folderName = rootFolder + appSettings.readAppSetting(APP_NAME, "Tax Distribution C2M Annual Folder Format");

            folderName = folderName.replace("{taxyear}",taxYear);

            createFolder(folderName);

            folderName += "/" + appSettings.readAppSetting(APP_NAME, "Tax Distribution C2M Tax Distribution Folder Format");

            folderName = folderName.replace("{taxdistribution}",taxDistId);

            return createFolder(folderName);

        }



        // ================================================================================================================================

        function getBatchDetailsForTaxDistribution(taxDistId) {

            var dealSearch = search.create({
                type:       "customrecord_tax_form_deal",
                filters:    [
                    ["isinactive","is",false]
                    ,"AND",["custrecord_tfd_c2m_distribution",search.Operator.ANYOF,taxDistId]
                ],
                columns:    ["custrecord_tfd_batch_id","custrecord_tfd_deal"]
            }).run().getRange(0,100);

            // and find all Tax Form Batch Detail record which , which points to a Tax Document (Document/Custom), which has a LINKED FILE attached to it

            var detailFilter = [
                ["isinactive",search.Operator.IS,false]
                ,"AND",["custrecord_txfm_detail_status",search.Operator.ANYOF,BATCH_DETAIL_STATUS.GENERATED]
                ,"AND",["custrecord_txfm_detail_delivery",search.Operator.ANYOF,DELIVERY_TYPE.MAIL]
                ,"AND",["custrecord_txfm_detail_document_nopwd.custrecord_file",search.Operator.ISNOTEMPTY,null]
                // ,"AND",
            ];

            detailFilter.push("AND");

            var dealList = [];
            for (var x in dealSearch) {
                var result = dealSearch[x];
                if (dealList.length > 0)
                    dealList.push("OR");

                dealList.push([["custrecord_txfm_detail_batch_id","anyof",result.getValue("custrecord_tfd_batch_id")],"AND",["custrecord_txfm_detail_deal","anyof",result.getValue("custrecord_tfd_deal")]])
            };

            detailFilter.push(dealList);

            var ss = search.create({
                type:       "customrecord_tax_form_batch_detail",
                filters:    detailFilter,
                columns:    ["custrecord_txfm_detail_batch_id","custrecord_txfm_detail_deal","custrecord_txfm_detail_document_nopwd","custrecord_txfm_detail_document",
                             "custrecord_txfm_detail_document_nopwd.custrecord_file","custrecord_txfm_detail_batch_id.custrecord_txfm_batch_yr_filed"]
            });

            return priLibrary.searchAllRecords(ss);


        }

        // ================================================================================================================================



        function map(context) {

            var funcName = scriptName + "map " + context.key;

            var mapObj = JSON.parse(context.value);

            log.debug(funcName, mapObj);

            try {

                var F = file.load({id: mapObj.fileId});
                F.folder = mapObj.folderId;
                log.debug(funcName, "Moving file " + F.name + " to folder " + mapObj.folderId);
                F.save({ignoreMandatoryFields: true});

                log.debug(funcName, "Updating Tax Batch Detail Record " + mapObj.batchDetailId + " to Status 'Delivered' for Tax Distribution " + mapObj.taxDistId);
                record.submitFields({type: "customrecord_tax_form_batch_detail", id: mapObj.batchDetailId, values: {
                        custrecord_txfm_detail_status: BATCH_DETAIL_STATUS.DELIVERED,
                        custrecord_txfm_tax_distribution: mapObj.taxDistId
                    }
                });

                log.debug(funcName, "Updating Document (Custom) for Non-Password Protected Document " + mapObj.docId + " to Status 'Final'");
                record.submitFields({type: "customrecord_document_management", id: mapObj.docId, values: {
                        custrecord_dm_status: DOCUMENT_STATUS.FINAL
                    }
                });
                

                log.debug(funcName, "Updating Document (Custom) for Password Protected Document  " + mapObj.protectedDocId + " to Status 'Final'");
                record.submitFields({type: "customrecord_document_management", id: mapObj.protectedDocId, values: {
                        custrecord_dm_status: DOCUMENT_STATUS.FINAL
                    }
                });
                
                
                context.write(mapObj.taxDistId, mapObj);

            } catch (e) {
                log.error(funcName, e);
            }

        }


        // ================================================================================================================================


        function reduce(context) {

            var funcName = scriptName + "reduce " + context.key;

            var taxDistId = context.key;

            try {

                var batchDetailList = [];

                for (var i = 0; i < context.values.length; i++) {
                    batchDetailList.push(JSON.parse(context.values[i]));
                }

                log.debug(funcName, "Found " + batchDetailList.length + " Detail Records");

                var tfdUpdates = {}; // just holds the batch/deal keys that have been updated already

                for (var x in batchDetailList) {

                    var key = batchDetailList[x].batchId + "." + batchDetailList[x].dealId;

                    if (!tfdUpdates[key]) {
                        // now, find the Tax Form Deal for this Batch Detail, and update it's "last C2M sent" flag

                        var tfdSearch = search.create({
                            type:       "customrecord_tax_form_deal",
                            filters:    [
                                ["isinactive",search.Operator.IS,false]
                                ,"AND",["custrecord_tfd_batch_id",search.Operator.ANYOF,batchDetailList[x].batchId]
                                ,"AND",["custrecord_tfd_deal",search.Operator.ANYOF,batchDetailList[x].dealId]
                            ],
                        }).run().getRange(0,1);

                        if (tfdSearch.length > 0) {
                            try {
                                log.debug(funcName, "Updating Tax Form Deal " + tfdSearch[0].id + " with current timestamp");
                                record.submitFields({type: "customrecord_tax_form_deal", id: tfdSearch[0].id, values: {custrecord_tfd_last_c2m_timestamp: format.format({value: new Date(), type: format.Type.DATETIME})}});
                                tfdUpdates[key] = true;
                            } catch (e1) {
                                ;
                            }
                        }

                    }
                }

                context.write(context.key, context.key);

            } catch (e) {
                log.error(funcName, e);
            }

            log.debug(funcName, "Processing Complete - " + runtime.getCurrentScript().getRemainingUsage());


        }

        // ================================================================================================================================


        function summarize(summary) {
            var funcName = scriptName + "summarize ";

            log.debug(funcName, "Finalizing...");

            var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

            if (errorMsgs && errorMsgs.length > 0)
                log.error(funcName, JSON.stringify(errorMsgs));


            var recsUpdated = 0;

            summary.output.iterator().each(function (key, obj) {
                recsUpdated++;
                return true;
            });

            log.debug(funcName, recsUpdated + " Tax Distribution processed.");

            // update the statistics for every batch that was supposed to be sent
            var dealSearch = search.create({
                type:       "customrecord_tax_form_deal",
                filters:    [
                    ["isinactive","is",false]
                    ,"AND",["custrecord_tfd_c2m_distribution",search.Operator.NONEOF,["@NONE@"]]
                ],
                columns:    [search.createColumn({name: "custrecord_tfd_batch_id", summary: search.Summary.GROUP})]
            }).run().getRange(0,1000);

            log.debug(funcName, "Found " + dealSearch.length + " Batches that need to be updated.");

            // update the statistics on all processed batches
            for (x in dealSearch) {
                try {
                    log.debug(funcName, "Updating Statistics for Batch " + dealSearch[x].getValue({name: "custrecord_tfd_batch_id", summary: search.Summary.GROUP}));
                    taxFormLibrary.taxFormBatchUpdateStatistics(dealSearch[x].getValue({name: "custrecord_tfd_batch_id", summary: search.Summary.GROUP}));
                } catch (e) {
                    log.error(funcName, e);
                }
            }

            // find all Tax Form Deal records that should have been processed, and see if they are done now

            var dealSearch = search.create({
                type:       "customrecord_tax_form_deal",
                filters:    [
                    ["isinactive","is",false]
                    ,"AND",["custrecord_tfd_c2m_distribution",search.Operator.NONEOF,["@NONE@"]]
                ],
                columns:    ["custrecord_tfd_batch_id","custrecord_tfd_deal"]
            }).run().getRange(0,1000);

            log.debug(funcName, "Found " + dealSearch.length + " Tax Form Deal records that need to be verified.");

            for (x in dealSearch) {
                var result = dealSearch[x];

                var ss = search.create({
                    type:       "customrecord_tax_form_batch_detail",
                    filters:    [
                        ["isinactive","is",false]
                        ,"AND",["custrecord_txfm_detail_batch_id",search.Operator.ANYOF,result.getValue("custrecord_tfd_batch_id")]
                        ,"AND",["custrecord_txfm_detail_deal",search.Operator.ANYOF,result.getValue("custrecord_tfd_deal")]
                        ,"AND",["custrecord_txfm_detail_status",search.Operator.ANYOF,BATCH_DETAIL_STATUS.GENERATED]
                        ,"AND",["custrecord_txfm_detail_delivery",search.Operator.ANYOF,DELIVERY_TYPE.MAIL]
                    ],
                }).run().getRange(0,1);

                if (ss.length == 0) {
                    log.debug(funcName, "Tax Form Deal " + result.id + " is now complete.  Removing pointer to Tax Distribution and approval.");
                    record.submitFields({type: "customrecord_tax_form_deal", id: result.id, values: {custrecord_tfd_c2m_distribution: "", custrecord_tfd_approved_for_c2m: false}})
                } else
                    log.debug(funcName, "Tax Form Deal " + result.id + " still has active Tax Batch Detail record which need to be sent.");
            }


            // find all TAX DISTRIBUTION records which are NOT COMPLETED yet; check to see whether anything "points" to them yet; if not, mark the record as COMPLETED

            var distSearch = search.create({
                type:       "customrecord_tax_distribution",
                filters:    [
                    ["isinactive",search.Operator.IS,false]
                    ,"AND",["custrecord_td_delivery_type",search.Operator.ANYOF,DELIVERY_TYPE.MAIL]
                    ,"AND",["custrecord_td_document_type",search.Operator.ANYOF,DOCUMENT_TYPE.CUSTOMER_TAX_DOCUMENT]
                    ,"AND",["custrecord_td_completed",search.Operator.IS,false]
                ],
            }).run().getRange(0,100);

            for (x in distSearch) {
                var result = distSearch[x];

                // if this tax distribution doesn't have any more tax form deal records that point to it, then mark it "done"

                var ss = search.create({
                    type:       "customrecord_tax_form_deal",
                    filters:    [
                        ["isinactive","is",false]
                        ,"AND",["custrecord_tfd_c2m_distribution",search.Operator.ANYOF,result.id]
                    ],
                }).run().getRange(0,1);

                if (ss.length == 0) {
                    log.audit(funcName, "Tax Distribution " + result.id + " no longer has any Tax Form Deals pointing to it.  Marking it as complete.");
                    record.submitFields({type: "customrecord_tax_distribution", id: result.id, values: {custrecord_td_completed: true}});
                } else
                    log.debug(funcName, "Tax Distribution " + result.id + " still has active Tax Form Deals pointing to it.");

            }

            log.debug(funcName, "### ENDING ### - " + runtime.getCurrentScript().getRemainingUsage());
        }

        // ================================================================================================================================


        // ensures that a folder path exists (eg /Transactions/Sales Orders/1728923), and if not, creates all the elements; returns the ID of the final folder

        function createFolder(folderPath) {

            var funcName = scriptName + " createPath " + folderPath;

            if (!folderPath || folderPath.length < 1)
                return;

            folderPath = folderPath.replace(/\\/g,"/");

            if (folderPath.substring(0,1) == "/")
                folderPath = folderPath.substring(1);

            if (folderPath.substring(folderPath.length-1) == "/")
                folderPath = folderPath.substring(0,folderPath.length-1);

            var pathSegments = folderPath.split("/");

            var parentFolderId = null;

            for (var i = 0; i < pathSegments.length; i++) {
                var pathSoFar = "";
                for (var j = 0; j <= i; j++)
                    pathSoFar += (pathSoFar.length == 0) ? pathSegments[j] : "/" + pathSegments[j];

                var p = findFolderOrFile(pathSoFar);

                if (p)
                    parentFolderId = p;
                else {
                    var F = record.create({type: search.Type.FOLDER});

                    F.setValue("parent", parentFolderId);
                    F.setValue("name", pathSegments[i]);
                    parentFolderId = F.save();
                }

            }

            return parentFolderId;

        }

        // ================================================================================================================================
        // ================================================================================================================================
        // ================================================================================================================================

        // finds the ID of a file or folder using a path, (eg /SuiteScripts/Bundles/13211 OR /SuiteScripts/Bundles/13211/filenam.txt)

        function findFolderOrFile(folderPath) {

            var funcName = scriptName + " findFolderOrFile " + folderPath;

            if (!folderPath || folderPath.length < 1)
                return;

            folderPath = folderPath.replace(/\\/g,"/");

            if (folderPath.substring(0,1) == "/")
                folderPath = folderPath.substring(1);

            if (folderPath.substring(folderPath.length-1) == "/")
                folderPath = folderPath.substring(0,folderPath.length-1);

            var pathSegments = folderPath.split("/");

            var parentFolderId = null;

            var ndx = -1;

            while (++ndx < pathSegments.length) {
                var ss = search.create({
                    type: search.Type.FOLDER,
                    filters: ["name",search.Operator.IS,pathSegments[ndx]],
                    columns: ["parent"]
                });

                if (parentFolderId)
                    ss.filters.push(search.createFilter({name: "parent", operator: search.Operator.ANYOF, values: parentFolderId}));
                else
                    ss.filters.push(search.createFilter({name: "parent", operator: search.Operator.ANYOF, values: ["@NONE@"]}));

                ss = ss.run().getRange(0,5);

                if (ss.length <= 0) {

                    if (ndx == (pathSegments.length-1)) {
                        // the last element might be a filename
                        ss = search.create({
                            type: "file",
                            filters: [
                                ["name",search.Operator.IS,pathSegments[ndx]]
                                ,"AND",["folder",search.Operator.ANYOF,[parentFolderId]]
                            ],
                            columns: ["name"]
                        }).run().getRange(0,99);

                        if (ss.length > 0) {
                            return ss[0].id;
                        }
                    };

                    return null;
                }

                parentFolderId = ss[0].id;
            }

            return parentFolderId;

        }

        // ================================================================================================================================
        // ================================================================================================================================
        // ================================================================================================================================

        return {
            getInputData:   getInputData,
            map:            map,
            reduce:         reduce,
            summarize:      summarize
        };

    }
);
