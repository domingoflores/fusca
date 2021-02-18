/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/dialog', '/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js'],

    function(dialog, dealEscrowLib) {

        // Global constants and variables
        const FIELDS = {
            TAX_RECIPIENT: 'custrecord_dei_tax_reporting_recipient',
            DEAL_ESCROW_RECORD: 'custrecord_dei_deal_escrow_record',
            GL_ACCOUNT: 'custrecord_dei_gl_account',
            GL_ACCOUNT_BALANCE: 'custrecord_dei_gl_account_balance',
            START_DATE: 'custrecord_dei_start_date',
            END_DATE: 'custrecord_dei_end_date',
        };

        var rec = '';

        // Helper functions
        /**
         * Sets the GL Account Balance field based on the Balance of the GL Account selected.
         *
         * @param account - Internal ID of the GL Account selected
         */
        function setAccountBalance(account) {

            var balance = dealEscrowLib.getAccountBalance(account);
            rec.setValue({fieldId: FIELDS.GL_ACCOUNT_BALANCE, value: balance});
        }

        /**
         * If the End Date is before the Start Date an Alert will be displayed. Otherwise, nothing.
         */
        function validateDates() {

            var startDate = rec.getValue({fieldId: FIELDS.START_DATE});
            var endDate = rec.getValue({fieldId: FIELDS.END_DATE});

            if (Boolean(startDate) && Boolean(endDate)) {

                if (endDate < startDate) {

                    dialog.alert({
                        title: 'End Date cannot be before Start Date',
                        message: 'The End Date you have selected is before the Start Date. Please update to ensure the End Date is after the Start Date.'
                    })
                }
            }
        }

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            rec = scriptContext.currentRecord;
            var field = scriptContext.fieldId;

            if (field === FIELDS.GL_ACCOUNT) {

                var glAccount = rec.getValue({fieldId: FIELDS.GL_ACCOUNT});
                setAccountBalance(glAccount);
            }

            if (field === FIELDS.END_DATE) {

                validateDates();
            }

            if (field === FIELDS.START_DATE) {

                validateDates()
            }

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

        }

        return {
            //pageInit: pageInit,
            fieldChanged: fieldChanged
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            //validateField: validateField
            //validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            //saveRecord: saveRecord
        };

    });
