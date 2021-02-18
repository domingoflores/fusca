/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 * ATP-1582
 */

define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/url'],
    /**
     * -----------------------------------------------------------
     * SpreadsheetSubmission_UE.js
     * ___________________________________________________________
     * Spreadsheet Submission Record user event script
     *
     * Version 1.0
     * Author: Brunno Putnam
     * Date: 2020-03-04
     * ___________________________________________________________
     */

    function (record, serverWidget, runtime, url) {

        var enable_not_mandatory_all = ['custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_type_pa', 'custrecord_ss_submit_report',
            'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc', 'custrecord_ss_submit_exp_doc',
            'custrecord_ss_submit_add_doc', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor', 'custrecord_ss_submit_total', 'custrecord_ss_submit_payout'
        ]

        function beforeLoad(context) {

            log.debug("beforeload", "In!")
            var executionContext = runtime.executionContext;
            log.debug("CONTEXT", executionContext);
            var REC = context.newRecord;

            var currentRole = runtime.getCurrentUser().role;
            log.debug('the role of the current user is : ', currentRole);

            // prevent CSV imports for all roles except Administrator CSV import fields will be enabled and set to non mandatory on beforeload. 
            if (executionContext == 'CSVIMPORT' && (context.type == 'create' || context.type == 'edit')) {

                if (currentRole == 3) { // ADMIN ONLY
                    
                    log.debug('yes im admin');
                    enableFields(context, enable_not_mandatory_all);
                    notMandatory(context, enable_not_mandatory_all);
                }
                else throw 'Only an Administrator can import to this record'
            }

        } // end of beforeLoad

        //======================================================================================================================

        function notMandatory(context, array) {
            var form = context.form;
            log.debug('inside not mandtory func');
            for (var i = 0; i < array.length; i++) {
                var fieldObject = form.getField({
                    id: array[i]
                });
                fieldObject.isMandatory = false;
            }
        }

        function enableFields(context, array) {
            var form = context.form;
            log.debug('inside enable fields func');

            for (var i = 0; i < array.length; i++) {
                var fieldObject = form.getField({
                    id: array[i]
                });
                fieldObject.isDisabled = false;
            }
        }

        return {
            beforeLoad: beforeLoad,
        }

    });