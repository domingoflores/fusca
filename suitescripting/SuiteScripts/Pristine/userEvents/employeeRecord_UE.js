/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 * ATP-1449
 */

define(['N/runtime', 'N/search',
        '/SuiteScripts/Pristine/libraries/toolsLibrary.js'
    ],
    /**
     * -----------------------------------------------------------
     * employeeRecord_UE.js
     * ___________________________________________________________
     * Employee Record UserEvent script
     *
     * Version 1.0
     * Author: Brunno Putnam
     * Date: 2020-02-20
     * ___________________________________________________________
     */
    function (runtime, search, toolsLib) {

        function beforeSubmit(context) {

            log.debug("beforeSubmit", "In!")
            var executionContext = runtime.executionContext;
            log.debug("CONTEXT", executionContext);
            log.debug('beforeSubmit', 'context.type: ' + context.type);
            var is_support_rep_checked;

            if (executionContext != 'USERINTERFACE') {
                if (context.type == context.UserEventType.CREATE ||
                    context.type == context.UserEventType.EDIT ||
                    context.type == context.UserEventType.XEDIT) {

                    var department_id = toolsLib.getFieldValue(context, 'department');

                    if (Boolean(department_id)) {

                        if (context.type == context.UserEventType.CREATE || didFieldChange(context)) {

                            is_support_rep_checked = search.lookupFields({
                                type: "department",
                                id: department_id,
                                columns: ['custrecord_is_support_rep_req']
                            }).custrecord_is_support_rep_req;

                            if (Boolean(is_support_rep_checked)) {
                                context.newRecord.setValue({
                                    fieldId: 'issupportrep',
                                    value: is_support_rep_checked,
                                })
                            } else {
                                context.newRecord.setValue({
                                    fieldId: 'issupportrep',
                                    value: false,
                                })
                            }
                        }
                    }
                }
             }
            
        }

        //====================================helper function===============================

        function didFieldChange(context) {
            var newDepartment_id = toolsLib.getFieldValue(context, 'department');
            var result = false;
            if (newDepartment_id != context.oldRecord.getValue('department')) {
                result = true;
            }
            return result;
        }

        //====================================return========================================

        return {
            beforeSubmit: beforeSubmit
        }

    });