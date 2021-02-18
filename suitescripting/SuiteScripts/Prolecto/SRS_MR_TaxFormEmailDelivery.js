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

define(['N/runtime','N/record','N/error','N/search','N/format', '/.bundle/132118/PRI_AS_Engine','/.bundle/132118/PRI_ServerLibrary','/SuiteScripts/Pristine/libraries/TaxForm_Library'],

    function(runtime,record,error,search,format,appSettings, priLibrary,taxFormLibrary) {

        var scriptName = "SRS_MR_TaxFormEmailDelivery.";

        const APP_NAME = "Tax Forms";

        const DELIVERY_TYPE = {
            EMAIL:      "1",
            MAIL:       "2"
        };

        const DOCUMENT_STATUS = {
            FINAL:      "5"
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
                    ,"AND",["custrecord_td_delivery_type",search.Operator.ANYOF,DELIVERY_TYPE.EMAIL]
                    ,"AND",["custrecord_td_completed",search.Operator.IS,false]
                ]
            }).run().getRange(0,100);

            log.debug(funcName, "There are " + distSearch.length + " Tax Distribution Records ready for Email");

            for (var x in distSearch) {

                var detailFilter = generateBatchDetailFilterForEmail(distSearch[x].id);

                var detailSearch = search.create({
                    type:       "customrecord_tax_form_batch_detail",
                    filters:    detailFilter,
                    columns:    [
                        search.createColumn({name: "custrecord_txfm_detail_shareholder", summary: search.Summary.GROUP})
                    ]
                });

                detailSearch = priLibrary.searchAllRecords(detailSearch);

                log.debug(funcName, "Tax Distribution " + distSearch[x].id + " had " + detailSearch.length + " shareholders");

                for (y in detailSearch)
                    mapRecords.push({taxDistId: distSearch[x].id, shareholderId: detailSearch[y].getValue({name: "custrecord_txfm_detail_shareholder", summary: search.Summary.GROUP})})

            }

            return mapRecords;

        }


        // ================================================================================================================================

        function map(context) {

            var funcName = scriptName + "map " + context.key;

            var mapObj = JSON.parse(context.value);

            log.debug(funcName, mapObj);

            funcName += (" " + mapObj.shareholderId);

            try {

                // call CRE to process this record; it will also process all other batch detail records for same batch/deal/shareholder

                var CRE_PROXY = record.create({type: "customrecord_srs_cre_proxy"});

                CRE_PROXY.setValue("custrecord_scre_profile",appSettings.readAppSetting(APP_NAME, "Tax Distribution CRE Profile for Email"));
                CRE_PROXY.setValue("custrecord_scre_record_id", mapObj.taxDistId);

                CRE_PROXY.setValue("custrecord_scre_request_overrides", JSON.stringify({Param1: mapObj.shareholderId}));

                var id = CRE_PROXY.save();

                CRE_PROXY = record.load({type: CRE_PROXY.type, id: id});

                // if successful, update all of the Tax Form Batch Detail records to show that they are completed

                var tfdUpdates = {}; // just holds the batch/deal keys that have been updated already

                if (CRE_PROXY.getValue("custrecord_scre_success")) {
                    var ss = search.create({
                        type:       "customrecord_tax_form_batch_detail",
                        filters:    generateBatchDetailFilterForEmail(mapObj.taxDistId, mapObj.shareholderId),
                        columns:    ["custrecord_txfm_detail_batch_id","custrecord_txfm_detail_deal","custrecord_txfm_detail_document"]
                    }).run().getRange(0,1000);

                    log.debug(funcName, "Email Sent.  Updating " + ss.length + " Tax Batch Detail records for Shareholder " + mapObj.shareholderId);

                    for (var x in ss) {
                        log.debug(funcName, "  - Updating Tax Batch Detail Record " + ss[x].id + " for Shareholder " + mapObj.shareholderId);
                        record.submitFields({type: "customrecord_tax_form_batch_detail", id: ss[x].id, values: {
                                custrecord_txfm_detail_status: BATCH_DETAIL_STATUS.DELIVERED,
                                custrecord_txfm_tax_distribution: mapObj.taxDistId
                            }
                        });

                        if (ss[x].getValue("custrecord_txfm_detail_document")) {
                            log.debug(funcName, "  - Updating Document (Custom)  " + ss[x].getValue("custrecord_txfm_detail_document") + " for Shareholder " + mapObj.shareholderId);
                            record.submitFields({type: "customrecord_document_management", id: ss[x].getValue("custrecord_txfm_detail_document"), values: {
                                    custrecord_dm_status: DOCUMENT_STATUS.FINAL
                                }
                            });
                        }

                        var key = ss[x].getValue("custrecord_txfm_detail_batch_id") + "." + ss[x].getValue("custrecord_txfm_detail_deal");

                        if (!tfdUpdates[key]) {
                            // now, find the Tax Form Deal for this Batch Detail, and update it's "last email sent" flag
                            var tfdSearch = search.create({
                                type:       "customrecord_tax_form_deal",
                                filters:    [
                                    ["isinactive",search.Operator.IS,false]
                                    ,"AND",["custrecord_tfd_batch_id",search.Operator.ANYOF,ss[x].getValue("custrecord_txfm_detail_batch_id")]
                                    ,"AND",["custrecord_tfd_deal",search.Operator.ANYOF,ss[x].getValue("custrecord_txfm_detail_deal")]
                                ],
                            }).run().getRange(0,1);

                            if (tfdSearch.length > 0) {
                                try {
                                    log.debug(funcName, "Updating Tax Form Deal " + tfdSearch[0].id + " with current timestamp");
                                    record.submitFields({type: "customrecord_tax_form_deal", id: tfdSearch[0].id, values: {custrecord_tfd_last_email_timestamp: format.format({value: new Date(), type: format.Type.DATETIME})}});
                                    tfdUpdates[key] = true;
                                } catch (e1) {
                                    ;
                                }
                            }

                        }


                    }

                    // delete the proxy record as it is no longer needed
                    record.delete({type: CRE_PROXY.type, id: CRE_PROXY.id});

                    context.write(context.key, mapObj);
                } else
                    log.error(funcName, "Something went wrong with processing " + JSON.stringify(mapObj) + " ... results are in CRE Proxy record " + id + " ... " + CRE_PROXY.getValue("custrecord_scre_error_msg"));


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

            log.debug(funcName, recsUpdated + " Email(s) Sent.");

            // update the statistics for every batch that was supposed to be sent
            var dealSearch = search.create({
                type:       "customrecord_tax_form_deal",
                filters:    [
                    ["isinactive","is",false]
                    ,"AND",["custrecord_tfd_email_distribution",search.Operator.NONEOF,["@NONE@"]]
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
                    ,"AND",["custrecord_tfd_email_distribution",search.Operator.NONEOF,["@NONE@"]]
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
                        ,"AND",["custrecord_txfm_detail_delivery",search.Operator.ANYOF,DELIVERY_TYPE.EMAIL]
                    ],
                }).run().getRange(0,1);

                if (ss.length == 0) {
                    log.debug(funcName, "Tax Form Deal " + result.id + " is now complete.  Removing pointer to Tax Distribution and approval.");
                    record.submitFields({type: "customrecord_tax_form_deal", id: result.id, values: {custrecord_tfd_email_distribution: "", custrecord_tfd_approved_for_email: false}})
                } else
                    log.debug(funcName, "Tax Form Deal " + result.id + " still has active Tax Batch Detail record which need to be sent.");
            }


            // find all TAX DISTRIBUTION records which are NOT COMPLETED yet; check to see whether anything "points" to them yet; if not, mark the record as COMPLETED

            var distSearch = search.create({
                type:       "customrecord_tax_distribution",
                filters:    [
                    ["isinactive",search.Operator.IS,false]
                    ,"AND",["custrecord_td_delivery_type",search.Operator.ANYOF,DELIVERY_TYPE.EMAIL]
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
                        ,"AND",["custrecord_tfd_email_distribution",search.Operator.ANYOF,result.id]
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

        // given a Tax Distribution record, create a filter to find all Tax Form Bath Detail records that need to be EMAILED for that Distribution record

        function generateBatchDetailFilterForEmail(taxDistId, shareholderId) {

            var funcName = scriptName + "generateBatchDetailFilterForEmail " + taxDistId;

            var dealSearch = search.create({
                type:       "customrecord_tax_form_deal",
                filters:    [
                    ["isinactive","is",false]
                    ,"AND",["custrecord_tfd_email_distribution",search.Operator.ANYOF,taxDistId]
                ],
                columns:    ["custrecord_tfd_batch_id","custrecord_tfd_deal"]
            }).run().getRange(0,1000);

            // and find all Tax Form Batch Detail record which , which points to a Tax Document (Document/Custom), which has a LINKED FILE attached to it

            var detailFilter = [
                ["isinactive",search.Operator.IS,false]
                ,"AND",["custrecord_txfm_detail_status",search.Operator.ANYOF,BATCH_DETAIL_STATUS.GENERATED]
                ,"AND",["custrecord_txfm_detail_delivery",search.Operator.ANYOF,DELIVERY_TYPE.EMAIL]
                ,"AND",["custrecord_txfm_detail_document.custrecord_file",search.Operator.ISNOTEMPTY,null]
                // ,"AND",
            ];

            if (shareholderId) {
                detailFilter.push("AND");
                detailFilter.push(["custrecord_txfm_detail_shareholder",search.Operator.ANYOF,shareholderId])
            }

            detailFilter.push("AND");

            var dealList = [];
            for (var x in dealSearch) {
                var result = dealSearch[x];
                if (dealList.length > 0)
                    dealList.push("OR");

                dealList.push([["custrecord_txfm_detail_batch_id","anyof",result.getValue("custrecord_tfd_batch_id")],"AND",["custrecord_txfm_detail_deal","anyof",result.getValue("custrecord_tfd_deal")]])
            };

            detailFilter.push(dealList);

            return detailFilter;
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    }
);
