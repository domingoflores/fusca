//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------
/*
 * 
 * Custom Client Script file. Has events
 * 
 * saveRecord: saveRecord,
   fieldChanged: fieldChanged,
   pageInit: pageInit
 * 
 * 
 */
define(["N/currentRecord", "N/ui/message", "N/search", "N/runtime"
    , "/.bundle/132118/PRI_AS_Engine"
    , "/SuiteScripts/Pristine/libraries/toolsLibraryClient.js"
],
	/**
	 * MyAccountClientCode.js
	 */
    function (currentRecord, message, search, runtime
        , appSettings
        , toolsClient
    ) {

        var REC = currentRecord.get();

        function showErrorMessage(msgTitle, msgText) {
            var myMsg = message.create({ title: msgTitle, message: msgText, type: message.Type.ERROR });
            myMsg.show({ duration: 9900 });
            window.scrollTo(0, 0);
        }
        function disableField(fieldid) {
            if (fieldid) {
                var fld = REC.getField({ fieldId: fieldid });
                fld.isDisabled = false;
                if (fld.type === "checkbox") {
                    REC.setValue({ fieldId: fieldid, value: false });
                }
                if (fld.type === "multiselect") {
                    REC.setValue({ fieldId: fieldid, value: null });
                }
                fld.isDisabled = true;
            }
        }
        function unlockField(fieldid) {
            if (fieldid) {
                var fld = REC.getField({ fieldId: fieldid });
                fld.isDisabled = false;
            }
        }
        function lockField(fieldid) {
            if (fieldid) {
                var fld = REC.getField({ fieldId: fieldid });
                fld.isDisabled = true;
            }
        }

        function pageInit() {
            //console.log('pageInit context: ' + JSON.stringify(context));

            //check sub-account values 
            if (!REC.getValue("parent")) {
                //If account is NOT a sub-account of 200,000 or 300,000
                disableField("custrecord_account_override_audience");
                disableField("custrecord_account_audience");

            }
        }
        function saveRecord() {
            //example of how to validate on save event
            //			if (!REC.getValue("custrecord_gl_account_bank_name"))
            //			{
            //				showErrorMessage("GL Account Bank Name is required", "GL Account must be entered. Please try again."); 
            //				return false;
            //			}
            return true;
        }

        function refresh_audience_values() {
            var overide_audience = false;
            var parent = REC.getValue({
                fieldId: "parent"
            });
            var parentAccounts = JSON.parse(appSettings.readAppSetting("General Settings", "Escrow Type Audience Parent Accounts"));
            var parentAccountsArray = parentAccounts["accounts_" + runtime.accountId];
            //			 	

            if (toolsClient.isSubAccountOf(parent, parentAccountsArray)) {
                unlockField("custrecord_account_override_audience");

                var escrow_type = REC.getValue("custrecord_escrow_account_type");
                if (escrow_type) {
                    overide_audience = REC.getValue("custrecord_account_override_audience");
                    if (overide_audience) {
                        //these are not really needed because audience array always comes back, even when empty.
                        unlockField("custrecord_account_audience");
                        //						REC.setValue({ fieldId:"custrecord_account_audience",value:null});
                        //						lockField("custrecord_account_audience");
                    }
                    else {
                        var audience = search.lookupFields({
                            type: "customrecord_escrow_type", id: escrow_type
                            , columns: ["custrecord_et_audience"]
                        });

                        if (audience && audience.custrecord_et_audience) {
                            var i = 0;
                            var audiences = [];
                            for (i = 0; i < audience.custrecord_et_audience.length; i += 1) {
                                audiences.push(audience.custrecord_et_audience[i].value);
                            }

                            unlockField("custrecord_account_audience");
                            REC.setValue({ fieldId: "custrecord_account_audience", value: audiences });
                            lockField("custrecord_account_audience");
                        }
                    }
                }
                else {
                    overide_audience = REC.getValue("custrecord_account_override_audience");
                    if (overide_audience) {
                        unlockField("custrecord_account_audience");
                    }
                    else {
                        unlockField("custrecord_account_audience");
                        REC.setValue({ fieldId: "custrecord_account_audience", value: null });
                        lockField("custrecord_account_audience");
                    }

                }
            }
            else {
                unlockField("custrecord_account_audience");
                unlockField("custrecord_account_override_audience");
                REC.setValue({ fieldId: "custrecord_account_audience", value: null });
                REC.setValue({ fieldId: "custrecord_account_override_audience", value: false });
                lockField("custrecord_account_audience");
                lockField("custrecord_account_override_audience");
            }

        }

        function fieldChanged(nlapiid) {
            try {

                switch (nlapiid) {
                    case "parent":
                    case "custrecord_escrow_account_type":
                    case "custrecord_account_override_audience":
                        refresh_audience_values();
                        break;
                }
            }
            catch (e) {
                console.log('e' + e.toString());
            }
        }

        return {
            saveRecord: saveRecord,
            fieldChanged: fieldChanged,
            pageInit: pageInit
        };
    });