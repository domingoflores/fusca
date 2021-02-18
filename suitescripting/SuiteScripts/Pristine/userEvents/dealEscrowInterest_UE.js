/**
 * User Event script to handle business requirement logic for the Deal Escrow Interest custom record.
 *
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'],

    function(runtime) {

        const FIELDS = {
            START_DATE: 'custrecord_dei_start_date',
            END_DATE: 'custrecord_dei_end_date'
        };

        // /**
        //  * Function definition to be triggered before record is loaded.
        //  *
        //  * @param {Object} scriptContext
        //  * @param {Record} scriptContext.newRecord - New record
        //  * @param {string} scriptContext.type - Trigger type
        //  * @param {Form} scriptContext.form - Current form
        //  * @Since 2015.2
        //  */
        // function beforeLoad(scriptContext) {
        //
        // }

        /**
         * Function definition to be triggered before record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

            var allowedContextTypes = [scriptContext.UserEventType.CREATE, scriptContext.UserEventType.EDIT, scriptContext.UserEventType.XEDIT];
            var allowedRuntimeTypes = [runtime.ContextType.USER_INTERFACE, runtime.ContextType.CSV_IMPORT];

            if (allowedContextTypes.indexOf(scriptContext.type) > -1 || allowedRuntimeTypes.indexOf(runtime.executionContext) > -1) {

                var newRec = scriptContext.newRecord;
                var newStartDate = newRec.getValue({fieldId: FIELDS.START_DATE});
                var newEndDate = newRec.getValue({fieldId: FIELDS.END_DATE});

                /*
                 * If the user is doing inline edits to either the Start Date or End Date and makes the
                 * End Date before the Start Date, throw an error message
                 */
                if (scriptContext.type === scriptContext.UserEventType.XEDIT) {

                    var oldRec = scriptContext.oldRecord;
                    var oldStartDate = oldRec.getValue({fieldId: FIELDS.START_DATE});
                    var oldEndDate = oldRec.getValue({fieldId: FIELDS.END_DATE});

                    if (Boolean(newEndDate) && !Boolean(newStartDate)) {

                        if (newEndDate < oldStartDate) {

                            throw "End Date cannot be before Start Date";
                        }
                    } else if (!Boolean(newEndDate) && Boolean(newStartDate)) {

                        if (oldEndDate < newStartDate) {

                            throw "End Date cannot be before Start Date";
                        }
                    }
                }

                /*
                 * Throw an error message if the End Date is before the Start Date for any other type of Editing/Creating
                 * of the record (UI or CSV)
                 */
                if (newEndDate < newStartDate) {


                    throw "End Date cannot be before Start Date";
                }
            }
        }

        // /**
        //  * Function definition to be triggered before record is loaded.
        //  *
        //  * @param {Object} scriptContext
        //  * @param {Record} scriptContext.newRecord - New record
        //  * @param {Record} scriptContext.oldRecord - Old record
        //  * @param {string} scriptContext.type - Trigger type
        //  * @Since 2015.2
        //  */
        // function afterSubmit(scriptContext) {
        //
        // }

        return {
            //beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
            //afterSubmit: afterSubmit
        };

    });
