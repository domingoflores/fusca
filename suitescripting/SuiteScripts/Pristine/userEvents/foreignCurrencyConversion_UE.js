/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/ui/serverWidget', '/SuiteScripts/Pristine/libraries/toolsLibrary.js'],

    function(record, runtime, serverWidget, tools) {

        // List of fields and their Internal IDs for easily getting field values off the record
        const FIELDS = {
            OG_AMOUNT: {
                ID: 'custrecord_fx_conv_orig_amount',
                VALUE: ''
            },
            CONV_AMT_CERTS: {
                ID: 'custrecord_fx_conv_amt_certs',
                VALUE: ''
            },
            FIRST_APPROVER: {
                ID: 'custrecord_fx_conv_first_approver',
                VALUE: ''
            },
            FIRST_APPROVED: {
                ID: 'custrecord_fx_conv_first_approved',
                VALUE: ''
            },
            FIRST_APPROVED_TS: {
                ID: 'custrecord_fx_conv_first_apr_ts',
                VALUE: ''
            },
            SECOND_APPROVER: {
                ID: 'custrecord_fx_conv_second_approver',
                VALUE: ''
            },
            SECOND_APPROVED: {
                ID: 'custrecord_fx_conv_second_approved',
                VALUE: ''
            },
            SECOND_APPROVED_TS: {
                ID: 'custrecord_fx_conv_second_apr_ts',
                VALUE: ''
            }
        };

        // Running list of fields to not disable
        const DO_NOT_DISABLE = [
            'isinactive',
            FIELDS.SECOND_APPROVED.ID,
            'sys_id'
        ];

        // List of roles that have access to certain fields on the record
        const ROLES = {
            OPS_ANALYST: 1032,
            OPS_MANAGER: 1025,
            CUST_ADMIN: 1050,
            ADMIN: 3
        };

        // Global variable declarations so the values can be used in various functions without passing them as params
        var user = '';
        var rec = '';
        var form = '';
        var nsValidation = '';

        /**
         * Gets the values for all necessary fields that will be used for handling logic.
         */
        function getFieldValues() {

            for (var key in FIELDS) {

                FIELDS[key].VALUE = rec.getValue({fieldId: FIELDS[key].ID});
            }
        }

        /**
         * Will go through and disable all necessary fields if certain criteria are met
         */
        function disableAllFields() {

            var allFields = rec.getFields();

            var secondApprovedIndex = DO_NOT_DISABLE.indexOf(FIELDS.SECOND_APPROVED.ID);

            // If the user is the First Approver, then allow them to access the First Approved checkbox
            if (user.id == FIELDS.FIRST_APPROVER.VALUE) {

                DO_NOT_DISABLE.push(FIELDS.FIRST_APPROVED.ID);
                DO_NOT_DISABLE.splice(secondApprovedIndex, 1);

            } else if (user.id !== FIELDS.FIRST_APPROVER.VALUE && user.role !== ROLES.OPS_MANAGER && user.role !== ROLES.CUST_ADMIN) {

                DO_NOT_DISABLE.splice(secondApprovedIndex, 1);

            } else if (user.role === ROLES.OPS_MANAGER || user.role === ROLES.CUST_ADMIN) {

                DO_NOT_DISABLE.push(FIELDS.FIRST_APPROVED.ID);
            }

            for (var i = 0; i < allFields.length; i++) {

                if (DO_NOT_DISABLE.indexOf(allFields[i]) === -1) {

                    var fieldObj = form.getField({id: allFields[i]});

                    fieldObj.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                }
            }
        }

        /**
         * Disables the necessary checkboxes depending on user and record data
         */
        function disableNecessaryFields() {

            var secondApprovedField = form.getField({id: FIELDS.SECOND_APPROVED.ID});
            var firstApprovedField = form.getField({id: FIELDS.FIRST_APPROVED.ID});
            var hasOriginalAmount = FIELDS.OG_AMOUNT.VALUE > 0;


            // Disable Both First and Second Approved fields if necessary
            if ((user.role !== ROLES.OPS_MANAGER && user.role !== ROLES.OPS_ANALYST) || !hasOriginalAmount || !nsValidation) {

                secondApprovedField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
                firstApprovedField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                return;
            }

            // Disable the Second Approved field if necessary
            if (user.role === ROLES.OPS_ANALYST || user.id == FIELDS.FIRST_APPROVER.VALUE || !FIELDS.FIRST_APPROVED.VALUE) {

                secondApprovedField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
            }

            if (user.id == FIELDS.SECOND_APPROVER.VALUE && !FIELDS.FIRST_APPROVED.VALUE) {

                firstApprovedField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
            }
        }

        /**
         * Determines if the record should be locked based on requirements
         *
         * @returns {boolean}
         */
        function determineLockedRecord() {

            return nsValidation && FIELDS.FIRST_APPROVED.VALUE && FIELDS.SECOND_APPROVED.VALUE;
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

            user = runtime.getCurrentUser();

            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {

                rec = scriptContext.newRecord;
                form = scriptContext.form;

                getFieldValues();

                nsValidation = FIELDS.OG_AMOUNT.VALUE === FIELDS.CONV_AMT_CERTS.VALUE;

                // If the record needs to be locked, do so and return out so we don't keep processing
                var lockRecord = determineLockedRecord();

                if (user.role !== ROLES.ADMIN && user.role !== ROLES.CUST_ADMIN) {

                    if (lockRecord) {

                        tools.preventEdit(scriptContext, false, 'This record is locked and cannot be edited');
                        return;
                    }

                    // Decide which fields, if any, to disable when the record loads
                    if (FIELDS.FIRST_APPROVED.VALUE && !FIELDS.SECOND_APPROVED.VALUE) {

                        disableAllFields();
                    } else {

                        disableNecessaryFields();
                    }
                }

            } else if (runtime.executionContext === runtime.ContextType.CSV_IMPORT) {

                if (user.role !== ROLES.ADMIN) {

                    throw 'You cannot create or edit a Foreign Currency Conversion Contract Record via CSV Import. Please do so through the user interface.'
                }
            }
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
        };

    });
