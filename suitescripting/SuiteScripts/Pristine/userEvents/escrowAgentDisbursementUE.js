//-----------------------------------------------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

/*
 * Code related to the Escrow Agent Disbursement Record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/ui/message', 'N/redirect', 'N/url',
        'N/ui/serverWidget',
        '/SuiteScripts/Prolecto/Shared/SRS_Constants',
        '/SuiteScripts/Prolecto/Shared/SRS_Functions',
        '/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js',
        '/.bundle/132118/PRI_ServerLibrary',
        '/.bundle/132118/PRI_ShowMessageInUI'
    ],

    function (record, search, runtime, error, format, message, redirect, url, serverWidget, srsConstants, srsFunctions, dealEscrowLib, priLibrary, priMessage) {

        var scriptName = "escrowAgentDisbursementUE ";

        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

        function beforeLoad(context) {

            var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
            var REC = context.newRecord;
            var thisRec = {};
            thisRec.status = REC.getValue('custrecord_ead_status');
            thisRec.overridePendingClaims = REC.getValue('custrecord_ead_pend_claim_override');
            thisRec.dealescrow = REC.getValue('custrecord_ead_deal_escrow');
            thisRec.glaccount = REC.getValue('custrecord_ead_gl_account');
            thisRec.amount = REC.getValue('custrecord_ead_disbursement_amt');
            thisRec.internalid = REC.getValue('id');
            thisRec.callbackReq = REC.getValue('custrecord_ead_callback_required');
            thisRec.callbackComments = REC.getValue('custrecord_ead_callback_comments');

            log.debug(funcName, 'thisRec: ' + JSON.stringify(thisRec));

            var eadStatus = Number(dealEscrowLib.getFieldValue(context, 'custrecord_ead_status'));

            // Prevent unauthorized users from editing
            if (!dealEscrowLib.userIsAuthorizedToDisburse()) {
                priLibrary.preventEdit(context, false, "You are not permitted to edit this record.");
            } else {
                // Only allow editing if record is in Initiated status  
                if (eadStatus !== srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"]) {
                    priLibrary.preventEdit(context, false, "You are not permitted to edit this record in this status.");
                }
            }

            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY)
                if (REC.getValue("custrecord_ead_callback_required") != "1") { // 1 = yes
                    var fld = context.form.getField("custrecord_ead_callback_contacts");
                    if (fld)
                        fld.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                    var fld = context.form.getField("custrecord_ead_callback_completed");
                    if (fld)
                        fld.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                }

            switch (context.type) {
                case context.UserEventType.VIEW:
                    priMessage.showPreparedMessage(context);
                    addCancelButton(context);
                    addCreateTxnsButton(context, thisRec);
                    break;
                case context.UserEventType.EDIT:
                    break;
                case context.UserEventType.CREATE:
                case context.UserEventType.COPY:
                case context.UserEventType.DELETE:
                    // Prevent unauthorized users from creating, copying and deleting
                    if (!dealEscrowLib.userIsAuthorizedToDisburse()) {
                        throw "This action is not permitted on this record.";
                    }
                    break;
            }
        }

        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function beforeSubmit(context) {
            var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " +
                context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

            var REC = context.newRecord;
            log.debug(funcName, 'thisRec: ' + JSON.stringify(REC));
            // Validate before saving
            var thisRec = {};
            thisRec.status = REC.getValue('custrecord_ead_status');
            thisRec.overridePendingClaims = REC.getValue('custrecord_ead_pend_claim_override');
            thisRec.dealescrow = REC.getValue('custrecord_ead_deal_escrow');
            thisRec.glaccount = REC.getValue('custrecord_ead_gl_account');
            thisRec.amount = REC.getValue('custrecord_ead_disbursement_amt');
            thisRec.internalid = REC.getValue('id');
            thisRec.callbackReq = REC.getValue('custrecord_ead_callback_required');
            thisRec.callbackComments = REC.getValue('custrecord_ead_callback_comments');

            log.debug(funcName, 'thisRec: ' + JSON.stringify(thisRec));
            // When the suitelet tries to update the EAD after creating transactions,
            // no validation needs to be done. Same goes for any attempt to set to Completed, Failed or Cancelled
            if (thisRec.status == srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"]) {
                var validationResponse = dealEscrowLib.validateDisbursement(thisRec);
                log.debug(funcName, 'Validation Response: ' + JSON.stringify(validationResponse));
                if (!validationResponse.success) {
                    priMessage.prepareMessage('Validation Errors', validationResponse.message, priMessage.TYPE.ERROR);
                    throw validationResponse.message;
                }
            }
            if (priLibrary.fieldChanged(context, "custrecord_ead_callback_completed")) {
                // if the field now has a value, record who/when
                if (REC.getValue("custrecord_ead_callback_completed")) {
                    REC.setValue("custrecord_ead_callback_completed_by", runtime.getCurrentUser().id);
                    REC.setValue("custrecord_ead_callback_completed_date", new Date());
                } else {
                    REC.setValue("custrecord_ead_callback_completed_by", "");
                    REC.setValue("custrecord_ead_callback_completed_date", "");
                }
            }
            if (runtime.executionContext == "CSVIMPORT") {
                if (priLibrary.fieldChanged(context, "custrecord_ead_accrued_int_amnt")) {
                    var includeAccruedInterest = REC.getValue('custrecord_ead_include_accrued_int');
                    if (includeAccruedInterest == false) {
                        throw "Cannot update Accrued Interest Amount when Include Accrued Interest checkbox is unchecked."
                    }
                }
            }
        }

        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function addCancelButton(context) {
            if (dealEscrowLib.userIsAuthorizedToDisburse()) {
                var eadStatus = Number(dealEscrowLib.getFieldValue(context, 'custrecord_ead_status'));
                if (eadStatus === srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"]) {
                    context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/escrowAgentDisbursementClient.js';
                    context.form.addButton({
                        id: 'custpage_cancel_disbursement_button',
                        label: 'Cancel Disbursement',
                        functionName: 'cancelDisbursement()'
                    });
                }
            }
        }

        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function addCreateTxnsButton(context, thisRec) {
            var funcName = scriptName + '==>addCreateTxnsButton';
            var includeAccruedInterest = context.newRecord.getValue('custrecord_ead_include_accrued_int');

            if (dealEscrowLib.userIsAuthorizedToDisburse()) {
                var eadStatus = Number(dealEscrowLib.getFieldValue(context, 'custrecord_ead_status'));
                if (context.newRecord.getValue('custrecord_ead_gl_account') &&
                    context.newRecord.getValue('custrecord_ead_disbursement_dt') &&
                    context.newRecord.getValue('custrecord_ead_disbursement_type') &&
                    context.newRecord.getValue('custrecord_ead_disbursement_amt') > 0 &&
                    context.newRecord.getValue('custrecord_ead_statement_memo') &&
                    eadStatus === srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"]) {


                    // ATP-1116: if we were going to show it, then only show if callback not required (!= 1), or callback was already completed
                    if (context.newRecord.getValue("custrecord_ead_callback_required") != "1" || context.newRecord.getValue("custrecord_ead_callback_completed")) {
                        var validationResponse = dealEscrowLib.validateDisbursement(thisRec);
                        log.debug(funcName, 'validationResponse: ' + JSON.stringify(validationResponse));
                        if (validationResponse.success) {
                            context.form.addButton({
                                id: 'custpage_create_disbursement_txns_button',
                                label: 'Create Disbursement Transactions',
                                functionName: 'createDisbursementTxns(' + includeAccruedInterest + ')'
                            });
                        }

                    }

                }
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        }
    });