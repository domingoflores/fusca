/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * brunno
 */

define(['N/runtime', "N/ui/serverWidget", 'SuiteScripts/Pristine/libraries/toolsLibrary.js'],

    function (runtime, ui, toolslib) {

        const dept_acquiom_operations = 35;
        const dept_escrow_payment_solutions = 4;

        function beforeLoad(context) {

            // ATP-2008
            // Operations Approved to Solicit > (checkbox) custrecord_solg_ops_appr_solicit Restricted to employees in department - Acquiom Operations
            // Acquiom Approved to Solicit (checkbox) custrecord_solg_acqm_appr_solicit Restricted to employees in department - Escrow and Payment Solutions

            var currentUserDept = runtime.getCurrentUser().department;

            var acquiom_solicit_cb = context.form.getField({
                id: 'custrecord_solg_ops_appr_solicit'
            })
            var ops_solicit_cb = context.form.getField({
                id: 'custrecord_solg_acqm_appr_solicit'
            })

            if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) {

                if (currentUserDept != dept_acquiom_operations) {

                    acquiom_solicit_cb.updateDisplayType({
                        displayType: ui.FieldDisplayType.DISABLED
                    });
                }
                if (currentUserDept != dept_escrow_payment_solutions) {

                    ops_solicit_cb.updateDisplayType({
                        displayType: ui.FieldDisplayType.DISABLED
                    });
                }

            }
        }

        function beforeSubmit(context) {

            var REC = context.newRecord;
            var ops_checkbox = REC.getValue("custrecord_solg_ops_appr_solicit");
            var acq_checkbox = REC.getValue("custrecord_solg_acqm_appr_solicit");

            if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) {
                
                if (toolslib.didValuesChange(context, ["custrecord_solg_ops_appr_solicit"]) && ops_checkbox == true)
                {
                    REC.setValue("custrecord_solg_ops_approved_by", runtime.getCurrentUser().id);
                    REC.setValue("custrecord_solg_ops_approved_dttm", new Date());
                }
                if (toolslib.didValuesChange(context, ["custrecord_solg_acqm_appr_solicit"]) && acq_checkbox == true) {

                    REC.setValue("custrecord_solg_acqm_approved_by", runtime.getCurrentUser().id);
                    REC.setValue("custrecord_solg_acqm_approved_dttm", new Date());
                }

                if (toolslib.didValuesChange(context, ["custrecord_solg_ops_appr_solicit"]) && ops_checkbox == false) {

                    REC.setValue("custrecord_solg_ops_approved_by", '');
                    REC.setValue("custrecord_solg_ops_approved_dttm", '');
                }
                if (toolslib.didValuesChange(context, ["custrecord_solg_acqm_appr_solicit"]) && acq_checkbox == false) {

                    REC.setValue("custrecord_solg_acqm_approved_by", '');
                    REC.setValue("custrecord_solg_acqm_approved_dttm", '');
                }

            }

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        }
    });