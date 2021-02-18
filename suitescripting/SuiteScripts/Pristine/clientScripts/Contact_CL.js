/**
* @NApiVersion 2.x
* @NScriptType ClientScript
* @NModuleScope Public
*/


define(['N/ui/message', '/SuiteScripts/Pristine/libraries/ContactLibrary.js'],
    function (msg, contactlib) {

        var scriptName = "Contact_CL.";
        var REC;
        var myMsg;
        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

        function fieldChanged(context) {
            var REC = context.currentRecord;
            var fieldId = context.fieldId;
            var contactID = context.currentRecord.id;

            var is_inactive = REC.getValue('isinactive');


            try {
                switch (fieldId) {
                    case 'email':
                        var e_mail = REC.getValue('email');

                        if (e_mail && !is_inactive) {
                            var dupEmailSearch = contactlib.duplicateEmailSearch(e_mail, contactID);

                            if (!dupEmailSearch) {
                                if (myMsg) { 
                                    myMsg.hide();
                                }
                            }
                        }                        
                        break;
                }
            }
            catch (e) {
                log.error("Field Changed Error", e.toString());
            }
        }

        function saveRecord(context) {
            REC = context.currentRecord;
            var is_inactive = REC.getValue('isinactive');
            var contactID = context.currentRecord.id;
            console.log("saveRecord: contact record id: " + contactID);


            var e_mail = REC.getValue('email');

            if (e_mail && !is_inactive) {
                var dupEmailSearch = contactlib.duplicateEmailSearch(e_mail, contactID);

                if (dupEmailSearch) {
                    showErrorMessage("Duplicate Email Detected", "This email already exists on another contact, please update the email and try saving it again");
                    return false;
                }
            }
            return true;
        }


        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function showErrorMessage(title, msgText) {
            if (myMsg) { 
                myMsg.hide();
            }
            myMsg = msg.create({
                title: title,
                message: msgText,
                type: msg.Type.ERROR
            });
            myMsg.show();
            window.scrollTo(0, 0);
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });

