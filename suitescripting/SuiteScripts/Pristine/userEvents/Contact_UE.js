/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

/* User Event code related to the CONTACT record  */

define(['/SuiteScripts/Pristine/libraries/ContactLibrary.js'],

    function (contactlib) {
        var scriptName = "Contact_UE.js--->";

        function beforeSubmit(context) {

            var e_mail = context.newRecord.getValue("email");
            var contactID = context.newRecord.id;
            var new_inactive = context.newRecord.getValue("isinactive");
            if (new_inactive) {
                return;
            }

            log.debug("new REC email field: ", e_mail);

            if(e_mail){
                
                var dupEmailSearch = contactlib.duplicateEmailSearch(e_mail, contactID);
                log.debug("return from library search: ", dupEmailSearch);
    
                if (dupEmailSearch) {
                    throw "Duplicate Email Address : There is at least one contact record already using the same email address."
                }}            

        }

        return {
            beforeSubmit: beforeSubmit
        }
    });