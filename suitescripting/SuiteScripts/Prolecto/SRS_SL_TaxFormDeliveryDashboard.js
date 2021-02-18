//------------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//------------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

/*
 *
 * Allows user to select Tax Form Delivery actions
 *
 */


define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/ui/message', 'N/task', 'N/url','/.bundle/132118/PRI_QM_Engine', '/.bundle/132118/PRI_ServerLibrary','/.bundle/132118/PRI_BackgroundJobMonitor'],

    function(record, runtime, search, format, ui, message, task, url, qmEngine, priLibrary, priBackgroundJob) {

        var scriptName = "SRS_SL_TaxFormDeliveryDashboard.";

        const PAGE_FUNCTIONS = {
            INITIAL_VIEW: 		0,
            CHANGE_CRITERIA:	1,
            SUBMIT_FORM:		2
        };

        const YES_NO_OPTIONS = {
            YES:            "1",
            NO:             "2",
            EITHER:         "",
        };

        const REQUESTED_ACTION = {
            QUEUE_FOR_EMAIL:            "1",
            REMOVE_FROM_EMAIL_QUEUE:    "2",
            QUEUE_FOR_C2M:              "3",
            REMOVE_FROM_C2M_QUEUE:      "4",
            APPROVE_FOR_EMAIL:          "5",
            APPROVE_FOR_C2M:            "6",
            UNAPPROVE_FOR_EMAIL:        "7",
            UNAPPROVE_FOR_C2M:          "8",
        };

        const BATCH_DETAIL_STATUS = {
            DRAFT:              1,
            DELIVERED:          4,
            FILED:              7,
            GENERATED:          8
        };

        const DELIVERY_TYPE = {
            MAIL:           "2",
            EMAIL:          "1"
        };


        const DOCUMENT_TYPE = {
            CUSTOMER_TAX_DOCUMENT:      "43",

        }

        function onRequest(context) {

            var funcName = scriptName + "onRequest";

            try {

                var msg = {title: "", text: "", type: message.Type.INFORMATION};

                var selectionCriteria = {
                    name:                   "",
                    taxYear:                "",
                    taxFormMethod:          "",
                    isCovered:              YES_NO_OPTIONS.EITHER,
                    dealId:                 "",
                    requestedAction:        REQUESTED_ACTION.QUEUE_FOR_EMAIL,
                    relationshipManager:    "",
                    approvedForEmail:       YES_NO_OPTIONS.EITHER,
                    approvedForC2M:         YES_NO_OPTIONS.EITHER,
                    customText:             "",
                };

                var pageFunction = (context.request.method == "GET") ? PAGE_FUNCTIONS.INITIAL_VIEW : ((context.request.parameters.custpage_refresh_action == "REFRESH") ? PAGE_FUNCTIONS.CHANGE_CRITERIA : PAGE_FUNCTIONS.SUBMIT_FORM );

                log.debug(funcName, "FUNC=" + pageFunction);

                var form = ui.createForm({title: "Tax Form Delivery Dashboard"});

                loadParameters(context, selectionCriteria);

                addSelectionFields(form, selectionCriteria);

                priLibrary.addFormRefreshFields(form, "custpage_name,custpage_taxyear,custpage_taxformmethod,custpage_iscovered,custpage_deal,custpage_rel_manager,custpage_approved_email,custpage_approved_c2m");


                var theData = loadData(selectionCriteria);

                var restoreSelections = false;

                if (pageFunction == PAGE_FUNCTIONS.SUBMIT_FORM) {
                    if (processFormPost(context, selectionCriteria, theData, msg))
                        theData = loadData(selectionCriteria);
                    else
                        restoreSelections = true;
                }

                populateSublist(form, theData, selectionCriteria, msg, restoreSelections, context);

                form.addSubmitButton('Process');

            } catch (e) {
                log.error(funcName, e);

                msg.text = e.message || JSON.stringify(e);
                msg.title = e.code || "Error";
                msg.type = message.Type.ERROR;
            }

            if (msg.text) {
                form.addPageInitMessage({type: msg.type, title: msg.title, message: msg.text});
            }

            context.response.writePage(form);

            log.debug(funcName, "Usage Remaining: " + runtime.getCurrentScript().getRemainingUsage());


        }

        //-------------------------------------------------------------------------------------------------------------


        function processFormPost(context, selectionCriteria, theData, msg) {

            var funcName = scriptName + "processFormPost";

            const SUBMIT_FIELDS_QUEUE_SCRIPT = "customscript_srs_sc_submitfields_qm";

            const MAX_UPDATES_IN_THIS_SCRIPT = 300;

            var selCount = 0;

            var reqAction = selectionCriteria.requestedAction;

            for (var i = 0; i < context.request.getLineCount({group: "custpage_list"}); i++) {

                if (context.request.getSublistValue({group: "custpage_list", line: i, name: "select"}) != "T")
                    continue;

                var batchId = context.request.getSublistValue({group: "custpage_list", line: i, name: "hdn_batchid"});
                var dealId = context.request.getSublistValue({group: "custpage_list", line: i, name: "hdn_dealid"});
                var key = batchId + "." + dealId;

                // log.debug(funcName, "action=" + reqAction + "; key=" + key + "; obj=" + JSON.stringify(theData[key]));

                var actionOk = true;

                if ((reqAction == REQUESTED_ACTION.QUEUE_FOR_C2M && theData[key].c2mDistribution)
                    || (reqAction == REQUESTED_ACTION.QUEUE_FOR_EMAIL && theData[key].emailDistribution)
                    || (reqAction == REQUESTED_ACTION.REMOVE_FROM_EMAIL_QUEUE && !theData[key].emailDistribution)
                    || (reqAction == REQUESTED_ACTION.REMOVE_FROM_C2M_QUEUE && !theData[key].c2mDistribution)
                )
                    actionOk = false;

                if (reqAction == REQUESTED_ACTION.APPROVE_FOR_EMAIL && theData[key].approvedForEmail)
                    actionOk = false;

                if (reqAction == REQUESTED_ACTION.UNAPPROVE_FOR_EMAIL && !theData[key].approvedForEmail)
                    actionOk = false;

                if (reqAction == REQUESTED_ACTION.APPROVE_FOR_C2M && theData[key].approvedForC2M)
                    actionOk = false;

                if (reqAction == REQUESTED_ACTION.UNAPPROVE_FOR_C2M && !theData[key].approvedForC2M)
                    actionOk = false;

                if (!actionOk) {
                    msg.title = "Invalid Request.";
                    msg.text = "The Requested Action can't be performed on Batch '" + context.request.getSublistValue({group: "custpage_list", line: i, name: "batchname"}) + "', Deal '" + context.request.getSublistValue({group: "custpage_list", line: i, name: "deal"}) + "'";
                    msg.type = message.Type.ERROR;
                    return false;
                }

                selCount++;

            }

            if (selCount == 0) {
                msg.text = "You did not select any records to process.";
                msg.title = "No Records Selected";
                msg.type = message.Type.WARNING;
                return false;
            }

            var processInBackground = (selCount > MAX_UPDATES_IN_THIS_SCRIPT);

            //
            // if (selCount > 80) {
            //     msg.title = "Too many records selected";
            //     msg.text = "You may not select more than 80 records at a time for processing.";
            //     msg.type = message.Type.ERROR;
            //     return false;
            // }


            // validation was performed, and all was good; now do the actual work
            // if the action is a "queeing" action, then create the distribution record, and link all the selected records to it
            //  if the action is an "unqueing" action, then remove the link to them
            // at the end we will clean up

            if (reqAction == REQUESTED_ACTION.QUEUE_FOR_EMAIL || reqAction == REQUESTED_ACTION.QUEUE_FOR_C2M) {
                var DIST = record.create({type: "customrecord_tax_distribution"});
                DIST.setValue("custrecord_td_delivery_type", reqAction == REQUESTED_ACTION.QUEUE_FOR_EMAIL ? DELIVERY_TYPE.EMAIL : DELIVERY_TYPE.MAIL);
                DIST.setValue("custrecord_td_document_type", DOCUMENT_TYPE.CUSTOMER_TAX_DOCUMENT);
                DIST.setValue("custrecord_td_custom_text", selectionCriteria.customText);
                var distId = DIST.save({ignoreMandatoryFields: true});
            }

            var distributionList = [];

            var qEntries = [];

            for (var i = 0; i < context.request.getLineCount({group: "custpage_list"}); i++) {

                if (context.request.getSublistValue({group: "custpage_list", line: i, name: "select"}) != "T")
                    continue;

                batchId = context.request.getSublistValue({group: "custpage_list", line: i, name: "hdn_batchid"});
                dealId = context.request.getSublistValue({group: "custpage_list", line: i, name: "hdn_dealid"});
                key = batchId + "." + dealId;

                // log.debug(funcName, "action=" + reqAction + "; key=" + key + "; obj=" + JSON.stringify(theData[key]));

                var backgroundTask;

                if (reqAction == REQUESTED_ACTION.QUEUE_FOR_C2M) {
                    if (processInBackground) {
                         backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_c2m_distribution: distId}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_c2m_distribution: distId}});
                        theData[key].c2mDistribution = distId;
                    }
                }

                if (reqAction == REQUESTED_ACTION.QUEUE_FOR_EMAIL) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_email_distribution: distId}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_email_distribution: distId}});
                        theData[key].emailDistribution = distId;
                    }
                }

                if (reqAction == REQUESTED_ACTION.APPROVE_FOR_EMAIL) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_email: true}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_email: true}});
                        theData[key].approvedForEmail = true;
                    }
                }

                if (reqAction == REQUESTED_ACTION.UNAPPROVE_FOR_EMAIL) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_email: false}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_email: false}});
                        theData[key].approvedForEmail = false;
                    }
                }

                if (reqAction == REQUESTED_ACTION.APPROVE_FOR_C2M) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_c2m: true}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_c2m: true}});
                        theData[key].approvedForC2M = true;
                    }
                }

                if (reqAction == REQUESTED_ACTION.UNAPPROVE_FOR_C2M) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_c2m: false}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_approved_for_c2m: false}});
                        theData[key].approvedForC2M = false;
                    }
                }

                if (reqAction == REQUESTED_ACTION.REMOVE_FROM_C2M_QUEUE) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_c2m_distribution: ""}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_c2m_distribution: ""}});
                        if (distributionList.indexOf(theData[key].c2mDistribution) < 0)
                            distributionList.push(theData[key].c2mDistribution);
                        theData[key].c2mDistribution = "";
                    }
                }

                if (reqAction == REQUESTED_ACTION.REMOVE_FROM_EMAIL_QUEUE) {
                    if (processInBackground) {
                        backgroundTask = {type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_email_distribution: ""}};
                    } else {
                        record.submitFields({type: "customrecord_tax_form_deal", id: theData[key].id, values: {custrecord_tfd_email_distribution: ""}});
                        if (distributionList.indexOf(theData[key].emailDistribution) < 0)
                            distributionList.push(theData[key].emailDistribution);
                        theData[key].emailDistribution = "";
                    }
                }

                if (processInBackground)
                    qEntries.push(backgroundTask);
            }

            // finally, find any distribution records which were "unlinked" and see if they now have 0 tax form deal records pointing to them; if so, get rid of them

            log.debug(funcName, "The following distribution records were 'unlinked from': " + JSON.stringify(distributionList));

            if (distributionList.length > 0) {
                var ss = search.create({
                    type:       "customrecord_tax_form_deal",
                    filters:    [
                        ["isinactive",search.Operator.IS,false]
                        ,"AND",[
                            ["custrecord_tfd_email_distribution",search.Operator.ANYOF,distributionList]
                            ,"OR",["custrecord_tfd_c2m_distribution",search.Operator.ANYOF,distributionList]
                        ]
                    ],
                    columns:    [
                        search.createColumn({name: "custrecord_tfd_c2m_distribution",summary: "GROUP"}),
                        search.createColumn({name: "custrecord_tfd_email_distribution",summary: "GROUP"})
                    ]
                });
                ss = priLibrary.searchAllRecords(ss);

                for (var x in ss) {
                    var result = ss[x];

                    var id = result.getValue({name: "custrecord_tfd_c2m_distribution",summary: "GROUP"});
                    if (id && distributionList.indexOf(id) >= 0)
                        distributionList.splice(distributionList.indexOf(id),1);

                    var id = result.getValue({name: "custrecord_tfd_email_distribution",summary: "GROUP"});
                    if (id && distributionList.indexOf(id) >= 0)
                        distributionList.splice(distributionList.indexOf(id),1);
                }

                log.debug(funcName, "The following distribution records are no longer referenced, and need to be removed: " + JSON.stringify(distributionList));

                for (x in distributionList) {
                    record.delete({type: "customrecord_tax_distribution", id: distributionList[x]});
                }

            } // we unlinked distributions

            if (processInBackground) {
                log.debug(funcName, qEntries);

                priBackgroundJob.scheduleJob({
                    scriptId:		"customscript_srs_mr_submitfields",
                    taskType:		task.TaskType.MAP_REDUCE,
                    params:         {custscript_srs_mr_submitfields: qEntries},
                    processingMsg:	"A script is now processing your requests.  When the script is complete, this message will change to indicate the result.",
                    completeMsg:	"Processing Complete.  You may now navigate back to the Dashboard to see the results.",
                    failedMsg:		"There was an error while trying to process your requests.  Please ask an Administrator to investigate."
                });

                return;
                //
                // qmEngine.addQueueEntries(qEntries, SUBMIT_FIELDS_QUEUE_SCRIPT , Math.max(10,qEntries.length));
                // msg.title = "Updates Scheduled";
                // msg.text = "The requested updates have been submitted to a background script for processing.  Please navigate back to this Dashboard from the menu, and refresh the page periodically until you confirm that the updates are finished.";
                // msg.type = message.Type.WARNING;

            } else {
                msg.title = "Updates Completed";
                msg.text = "The requested updates have been completed successfully.";
                msg.type = message.Type.CONFIRMATION;
            }

            return true;
        }

        // ================================================================================================================================

        function populateSublist(form, theData, selectionCriteria, msg, restoreSelections, context) {

            var funcName = scriptName + "populateSublist";

            var subList = form.addSublist({
                id: "custpage_list",
                label: "Tax Form Deals",
                type: ui.SublistType.LIST
            });

            subList.addMarkAllButtons();

            subList.addField({id: "select", type: ui.FieldType.CHECKBOX, label: "Select"}); // .updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

            subList.addField({id: "batchname", type: ui.FieldType.TEXT, label: "Batch Name"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "taxyear", type: ui.FieldType.TEXT, label: "Tax Year Filed"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "taxreportmethod", type: ui.FieldType.TEXT, label: "Tax Form Method"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

            subList.addField({id: "iscovered", type: ui.FieldType.CHECKBOX, label: "Is Covered"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "status", type: ui.FieldType.TEXT, label: "Status"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "deal", type: ui.FieldType.TEXT, label: "Tax Form Deal"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

            subList.addField({id: "relationshipmanager", type: ui.FieldType.TEXT, label: "Relationship Manager"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "approvedemail", type: ui.FieldType.CHECKBOX, label: "Approved Email"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "approvedc2m", type: ui.FieldType.CHECKBOX, label: "Approved C2M"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

            subList.addField({id: "emailrequest", type: ui.FieldType.TEXT, label: "Queue for Email"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "c2mrequest", type: ui.FieldType.TEXT, label: "Queued for C2M Mail"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            // subList.addField({id: "emailtimestamp", type: ui.FieldType.DATETIMETZ, label: "Last Deliver (email) Timestamp"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            // subList.addField({id: "c2mtimestamp", type: ui.FieldType.DATETIMETZ, label: "Last Deliver (C2M) Timestamp"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

            subList.addField({id: "draft", type: ui.FieldType.INTEGER, label: "In Draft"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "generated_email", type: ui.FieldType.INTEGER, label: "Generated (Email)"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "generated_c2m", type: ui.FieldType.INTEGER, label: "Generated (C2M)"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "delivered", type: ui.FieldType.INTEGER, label: "Delivered"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
            subList.addField({id: "filed", type: ui.FieldType.INTEGER, label: "Filed"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

            subList.addField({id: "hdn_id", type: ui.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});
            subList.addField({id: "hdn_batchid", type: ui.FieldType.TEXT, label: "Batch ID"}).updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});
            subList.addField({id: "hdn_dealid", type: ui.FieldType.TEXT, label: "Deal ID"}).updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});

            var lineNbr = 0;

            for (var x in theData)  {

                var data = theData[x];

                subList.setSublistValue({id: "batchname", line: lineNbr, value: makeLink("customrecord_tax_form_batch", data.batchId, data.batchName)});
                subList.setSublistValue({id: "taxyear", line: lineNbr, value: data.yearFiled});
                subList.setSublistValue({id: "taxreportmethod", line: lineNbr, value: data.taxReportMethod});
                subList.setSublistValue({id: "iscovered", line: lineNbr, value: data.isCovered ? "T" : "F"});
                subList.setSublistValue({id: "status", line: lineNbr, value: data.batchStatus});
                subList.setSublistValue({id: "deal", line: lineNbr, value: makeLink("customrecord_tax_form_deal", data.id, data.dealName)});

                subList.setSublistValue({id: "relationshipmanager", line: lineNbr, value: data.relationshipManager || " "});
                subList.setSublistValue({id: "approvedemail", line: lineNbr, value: data.approvedForEmail ? "T" : "F"});
                subList.setSublistValue({id: "approvedc2m", line: lineNbr, value: data.approvedForC2M ? "T" : "F"});

                if (data.emailDistribution)
                    subList.setSublistValue({id: "emailrequest", line: lineNbr, value: makeLink("customrecord_tax_distribution", data.emailDistribution, "Tax Distribution " + data.emailDistribution)});
                if (data.c2mDistribution)
                    subList.setSublistValue({id: "c2mrequest", line: lineNbr, value: makeLink("customrecord_tax_distribution", data.c2mDistribution, "Tax Distribution " + data.c2mDistribution)});

                // if (data.emailTimestamp)
                //     subList.setSublistValue({id: "emailtimestamp", line: lineNbr, value: data.emailTimestamp});
                // if (data.c2mTimestamp)
                //     subList.setSublistValue({id: "c2mtimestamp", line: lineNbr, value: data.c2mTimestamp});

                subList.setSublistValue({id: "draft", line: lineNbr, value: data.draftCount.toString()});
                subList.setSublistValue({id: "generated_email", line: lineNbr, value: data.generatedEmailCount.toString()});
                subList.setSublistValue({id: "generated_c2m", line: lineNbr, value: data.generatedC2MCount.toString()});
                subList.setSublistValue({id: "delivered", line: lineNbr, value: data.deliveredCount.toString()});
                subList.setSublistValue({id: "filed", line: lineNbr, value: data.filedCount.toString()});

                subList.setSublistValue({id: "hdn_id", line: lineNbr, value: data.id});
                subList.setSublistValue({id: "hdn_batchid", line: lineNbr, value: data.batchId});
                subList.setSublistValue({id: "hdn_dealid", line: lineNbr, value: data.dealId});

                if (restoreSelections) {
                    for (var i = 0; i < context.request.getLineCount({group: "custpage_list"}); i++) {
                        if (context.request.getSublistValue({group: "custpage_list", line: i, name: "hdn_id"}) == data.id) {
                            if (context.request.getSublistValue({group: "custpage_list", line: i, name: "select"}) == "T")
                                subList.setSublistValue({id: "select", line: lineNbr, value: "T"});
                        }
                    }
                }


                lineNbr++;
            }

            subList.label += " (" + lineNbr + ")";

        }

        function makeLink(recordType, recordId, linkName) {
            return "<a href=\"" +url.resolveRecord({recordType: recordType, recordId: recordId})+ "\" target=\"_blank\" style=\"\">"+linkName+"</a>";
        }

        //-------------------------------------------------------------------------------------------------------------

        function loadData(selectionCriteria) {

            var funcName = scriptName + "loadData";

            log.debug(funcName, selectionCriteria);

            var searchFilters  = [
                ["isinactive",search.Operator.IS,false]
            ];

            if (selectionCriteria.name) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_batch_id.name",search.Operator.CONTAINS,selectionCriteria.name]);
            }
            if (selectionCriteria.taxYear) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_batch_id.custrecord_txfm_batch_yr_filed",search.Operator.ANYOF,[selectionCriteria.taxYear]]);
            }
            if (selectionCriteria.dealId) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_deal",search.Operator.ANYOF,[selectionCriteria.dealId]]);
            }
            if (selectionCriteria.taxFormMethod) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_batch_id.custrecord_txfm_batch_report_method",search.Operator.ANYOF,[selectionCriteria.taxFormMethod]]);
            }
            if (selectionCriteria.isCovered != YES_NO_OPTIONS.EITHER) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_batch_id.custrecord_txfm_batch_iscovered",search.Operator.ANYOF,[selectionCriteria.isCovered]]);
            }
            if (selectionCriteria.relationshipManager) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_relationship_associate",search.Operator.ANYOF,[selectionCriteria.relationshipManager]]);
            }
            if (selectionCriteria.approvedForEmail != YES_NO_OPTIONS.EITHER) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_approved_for_email",search.Operator.IS,[(selectionCriteria.approvedForEmail == YES_NO_OPTIONS.YES ? "T" : "F")]]);
            }
            if (selectionCriteria.approvedForC2M != YES_NO_OPTIONS.EITHER) {
                searchFilters.push("AND");
                searchFilters.push(["custrecord_tfd_approved_for_c2m",search.Operator.IS,[(selectionCriteria.approvedForC2M == YES_NO_OPTIONS.YES ? "T" : "F")]]);
            }

            log.debug(funcName, searchFilters);


            var ss = search.create({
                type:       "customrecord_tax_form_deal",
                filters:    searchFilters,
                columns:    ["custrecord_tfd_deal","custrecord_tfd_batch_id.name","custrecord_tfd_batch_id.custrecord_txfm_batch_yr_filed","custrecord_tfd_batch_id.custrecord_txfm_batch_report_method",
                    "custrecord_tfd_batch_id.custrecord_txfm_batch_iscovered","custrecord_tfd_batch_id.custrecord_txfm_batch_status","custrecord_tfd_batch_id",
                    "custrecord_tfd_email_distribution","custrecord_tfd_c2m_distribution","custrecord_tfd_last_email_timestamp","custrecord_tfd_last_c2m_timestamp",
                    "custrecord_tfd_relationship_associate","custrecord_tfd_approved_for_email","custrecord_tfd_approved_for_c2m"]
            });


            ss = priLibrary.searchAllRecords(ss);

            log.debug(funcName, "Found " + ss.length + " rows.");

            var data = {}; // [];

            for (var x in ss) {
                var result = ss[x];

                var obj = {
                    id:                 result.id,
                    batchName:          result.getValue({name: "name",join: "custrecord_tfd_batch_id"}),
                    batchId:            result.getValue("custrecord_tfd_batch_id"),
                    dealId:             result.getValue("custrecord_tfd_deal"),
                    dealName:           result.getText("custrecord_tfd_deal"),
                    emailDistribution:  result.getText("custrecord_tfd_email_distribution"),
                    c2mDistribution:    result.getText("custrecord_tfd_c2m_distribution"),
                    emailTimestamp:     result.getValue("custrecord_tfd_last_email_timestamp"),
                    c2mTimestamp:       result.getValue("custrecord_tfd_last_c2m_timestamp"),
                    yearFiled:          result.getText({name: "custrecord_txfm_batch_yr_filed",join: "custrecord_tfd_batch_id"}),
                    taxReportMethod:    result.getText({name: "custrecord_txfm_batch_report_method",join: "custrecord_tfd_batch_id"}),
                    isCovered:          result.getValue({name: "custrecord_txfm_batch_iscovered",join: "custrecord_tfd_batch_id"}) == YES_NO_OPTIONS.YES,
                    batchStatus:        result.getText({name: "custrecord_txfm_batch_status", join: "custrecord_tfd_batch_id"}),
                    relationshipManager:result.getText("custrecord_tfd_relationship_associate"),
                    approvedForEmail:   result.getValue("custrecord_tfd_approved_for_email"),
                    approvedForC2M:     result.getValue("custrecord_tfd_approved_for_c2m"),
                    draftCount:         0,
                    generatedEmailCount:  0,
                    generatedC2MCount:  0,
                    deliveredCount:     0,
                    filedCount:         0
                }

                // log.debug(funcName, obj);
                var key = obj.batchId + "." + obj.dealId;

                data[key] = obj;
            }

            // get total details, by batch/deal, and update this table

            var ss = search.create({
                type:       "customrecord_tax_form_batch_detail",
                filters:    ["isinactive",search.Operator.IS,false],
                columns:    [
                                search.createColumn({name: "custrecord_txfm_detail_deal",summary: "GROUP"}),
                                search.createColumn({name: "custrecord_txfm_detail_batch_id",summary: "GROUP"}),
                                search.createColumn({name: "custrecord_txfm_detail_status",summary: "GROUP"}),
                                search.createColumn({name: "custrecord_txfm_detail_delivery",summary: "GROUP"}),
                                search.createColumn({name: "internalid",summary: "COUNT"})
                    ]
            });
            ss = priLibrary.searchAllRecords(ss);

            for (x in ss) {
                var result = ss[x];

                var key = result.getValue({name: "custrecord_txfm_detail_batch_id",summary: "GROUP"}) + "." + result.getValue({name: "custrecord_txfm_detail_deal",summary: "GROUP"});

                log.debug(funcName, result);

                if (data[key]) {
                    var count = parseInt(result.getValue({name: "internalid",summary: "COUNT"}));

                    var status = result.getValue({name: "custrecord_txfm_detail_status",summary: "GROUP"});

                    if (status == BATCH_DETAIL_STATUS.DRAFT)
                        data[key].draftCount += count;
                    else if (status == BATCH_DETAIL_STATUS.DELIVERED)
                        data[key].deliveredCount += count;
                    else if (status == BATCH_DETAIL_STATUS.FILED)
                        data[key].filedCount += count;
                    else if (status == BATCH_DETAIL_STATUS.GENERATED)
                        if (result.getValue({name: "custrecord_txfm_detail_delivery",summary: "GROUP"}) == DELIVERY_TYPE.EMAIL)
                            data[key].generatedEmailCount += count;
                        else if (result.getValue({name: "custrecord_txfm_detail_delivery",summary: "GROUP"}) == DELIVERY_TYPE.MAIL)
                            data[key].generatedC2MCount += count;
                }

            }

            return data;
        }

        //-------------------------------------------------------------------------------------------------------------

        function addSelectionFields(form, selectionCriteria) {

            const ACTION_GROUP = "Action";
            const FILTER_GROUP = "Filter";

            log.debug("addSelect", selectionCriteria);

            var fld;

            form.addFieldGroup({id: FILTER_GROUP, label: "Filters"});

            form.addField({id: "custpage_name",type: ui.FieldType.TEXT,label: "Tax Form Batch Name", container: FILTER_GROUP}).defaultValue = selectionCriteria.name;
            form.addField({id: "custpage_taxyear",type: ui.FieldType.SELECT,label: "Tax Year", source: "customlist_tax_year_filed", container: FILTER_GROUP}).defaultValue = selectionCriteria.taxYear;
            form.addField({id: "custpage_taxformmethod",type: ui.FieldType.SELECT,label: "Tax Form Method", source: "customrecord_tax_rpt_method", container: FILTER_GROUP}).defaultValue = selectionCriteria.taxFormMethod;
            form.addField({id: "custpage_deal",type: ui.FieldType.SELECT,label: "Deal", source: record.Type.CUSTOMER, container: FILTER_GROUP}).defaultValue = selectionCriteria.dealId;

            addYesNoField(form,"custpage_iscovered","Is Covered",FILTER_GROUP,selectionCriteria.isCovered);

            form.addField({id: "custpage_rel_manager",type: ui.FieldType.SELECT,label: "Relationship Manager?", source: record.Type.EMPLOYEE, container: FILTER_GROUP}).defaultValue = selectionCriteria.relationshipManager;

            addYesNoField(form,"custpage_approved_email","Approved For Email",FILTER_GROUP,selectionCriteria.approvedForEmail);
            addYesNoField(form,"custpage_approved_c2m","Approved For C2M",FILTER_GROUP,selectionCriteria.approvedForC2M);


            form.addFieldGroup({id: ACTION_GROUP, label: "Action"});

            fld = form.addField({id: "custpage_action",type: ui.FieldType.SELECT,label: "Requested Action?", container: ACTION_GROUP});
            fld.addSelectOption({value: REQUESTED_ACTION.QUEUE_FOR_EMAIL, text: "Queue For Email"});
            fld.addSelectOption({value: REQUESTED_ACTION.QUEUE_FOR_C2M, text: "Queue For C2M"});
            fld.addSelectOption({value: REQUESTED_ACTION.REMOVE_FROM_EMAIL_QUEUE, text: "Remove from Email Queue"});
            fld.addSelectOption({value: REQUESTED_ACTION.REMOVE_FROM_C2M_QUEUE, text: "Remove from C2M Queue"});
            fld.addSelectOption({value: REQUESTED_ACTION.APPROVE_FOR_EMAIL, text: "Approve For Email"});
            fld.addSelectOption({value: REQUESTED_ACTION.APPROVE_FOR_C2M, text: "Approve For C2M"});
            fld.addSelectOption({value: REQUESTED_ACTION.UNAPPROVE_FOR_EMAIL, text: "Remove Approval For Email"});
            fld.addSelectOption({value: REQUESTED_ACTION.UNAPPROVE_FOR_C2M, text: "Remove Approval For C2M"});
            fld.defaultValue = selectionCriteria.requestedAction;

            form.addField({id: "custpage_customtext",type: ui.FieldType.TEXTAREA,label: "Custom Text", container: ACTION_GROUP}).defaultValue = selectionCriteria.customText;

        }

        function addYesNoField(form, fieldId, fieldLabel, groupName, defaultValue) {
            fld = form.addField({id: fieldId,type: ui.FieldType.SELECT,label: fieldLabel, container: groupName});
            fld.addSelectOption({value: YES_NO_OPTIONS.YES, text: "Yes"});
            fld.addSelectOption({value: YES_NO_OPTIONS.NO, text: "No"});
            fld.addSelectOption({value: YES_NO_OPTIONS.EITHER, text: "Either"});
            fld.defaultValue = defaultValue;
        }

        //-------------------------------------------------------------------------------------------------------------

        function loadParameters(context, selectionCriteria) {
            if (context.request.parameters.custpage_name)
                selectionCriteria.name = context.request.parameters.custpage_name;

            if (context.request.parameters.custpage_taxyear)
                selectionCriteria.taxYear = context.request.parameters.custpage_taxyear;

            if (context.request.parameters.custpage_taxformmethod)
                selectionCriteria.taxFormMethod = context.request.parameters.custpage_taxformmethod;

            if (context.request.parameters.custpage_iscovered)
                selectionCriteria.isCovered = context.request.parameters.custpage_iscovered;

            if (context.request.parameters.custpage_deal)
                selectionCriteria.dealId = context.request.parameters.custpage_deal;

            if (context.request.parameters.custpage_rel_manager)
                selectionCriteria.relationshipManager = context.request.parameters.custpage_rel_manager;

            if (context.request.parameters.custpage_approved_email)
                selectionCriteria.approvedForEmail = context.request.parameters.custpage_approved_email;

            if (context.request.parameters.custpage_approved_c2m)
                selectionCriteria.approvedForC2M = context.request.parameters.custpage_approved_c2m;

            if (context.request.parameters.custpage_action)
                selectionCriteria.requestedAction = context.request.parameters.custpage_action;

            if (context.request.parameters.custpage_customtext)
                selectionCriteria.customText = context.request.parameters.custpage_customtext;
        }


        return {
            onRequest : onRequest
        };
    });