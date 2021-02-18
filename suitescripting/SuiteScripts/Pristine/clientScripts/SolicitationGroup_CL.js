/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@brunno //ATP-2008
 */

define(['N/runtime', '/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'],

    function(runtime, toolsLibraryClient) {

        var checkboxFields = [];
        var tsFields = [];
        var userFields = [];
        const dept_acquiom_operations = 35;
        const dept_escrow_payment_solutions = 4;

        function pageInit(context) {
            console.log('pageInit');
            currentUserDept = runtime.getCurrentUser().department;
            console.log('pageInit', 'currentUserDept: ' + currentUserDept);

            if(currentUserDept != dept_acquiom_operations){
                toolsLibraryClient.disableFields(context, ['custrecord_solg_ops_appr_solicit'])
            }
            if(currentUserDept != dept_escrow_payment_solutions){
                toolsLibraryClient.disableFields(context, ['custrecord_solg_acqm_appr_solicit'])
            }
        }

        function fieldChanged(context) {
            console.log('fieldChanged');
            //console.log('fieldChanged', 'context: ' + JSON.stringify(context));

            // READ Operations Approved to Solicit CHECKBOX - SETS USER AND TIMESTAMP
            if (context.fieldId === 'custrecord_solg_ops_appr_solicit') {
                checkboxFields = ['custrecord_solg_ops_appr_solicit'];
                tsFields = ['custrecord_solg_ops_approved_dttm'];
                userFields = ['custrecord_solg_ops_approved_by'];

                toolsLibraryClient.setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields);
            }

            // READ Acquiom Approved to Solicit CHECKBOX - SETS USER AND TIMESTAMP
            if (context.fieldId === 'custrecord_solg_acqm_appr_solicit') {
                checkboxFields = ['custrecord_solg_acqm_appr_solicit'];
                tsFields = ['custrecord_solg_acqm_approved_dttm'];
                userFields = ['custrecord_solg_acqm_approved_by'];

                toolsLibraryClient.setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields);
            }
        }

        function saveRecord(context) {
            console.log('saveRecord');
            return true;
        }

        return {
            fieldChanged: fieldChanged,
            pageInit: pageInit,
            saveRecord: saveRecord
        };
    });