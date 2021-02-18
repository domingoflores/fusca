//------------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//------------------------------------------------------------------------------------------------------------

/*
    this record and script act as a proxy for executing CRE profiles from within a 1.0 script.  the 2.0 script just needs to create a record of type "proxy" and then load the results
 */

const scriptName = "SRS_UE_CRE_Proxy.";

function creProxy_beforeSubmit(type) {
    "use strict";

    var funcName = scriptName + "creProxy_beforeSubmit";


    if(type=="create") {

        var response={};

        try {

            nlapiLogExecution("DEBUG", funcName, '### STARTING ###');

            var profileId = nlapiGetFieldValue("custrecord_scre_profile");
            var recordId = nlapiGetFieldValue("custrecord_scre_record_id");

            nlapiLogExecution("AUDIT",funcName, "profile=" + profileId + "; record=" + recordId );

            var creProfile = new CREProfile(profileId);

            if (nlapiGetFieldValue("custrecord_scre_request_overrides")) {
                var overrideObj = JSON.parse(nlapiGetFieldValue("custrecord_scre_request_overrides"));
                for (var fieldName in overrideObj)  {
                    nlapiLogExecution("AUDIT", funcName, "Overriding field " + fieldName + " with " + overrideObj[fieldName]);

                    if (fieldName == "Param1")
                        creProfile["CustomParam1"] = overrideObj[fieldName].toString();
                    else if (fieldName == "Param2")
                        creProfile["CustomParam2"] = overrideObj[fieldName].toString();
                    else
                        creProfile.fields[fieldName].value = overrideObj[fieldName]
                }
            }


            creProfile.Translate(recordId);
            var result = creProfile.Execute();

            nlapiLogExecution("DEBUG", funcName, "Success...");

            nlapiSetFieldValue("custrecord_scre_success","T");

            if (creProfile.fields.DocumentName && creProfile.fields.DocumentName.file) {
                nlapiLogExecution("DEBUG", funcName, "We have a file: " + creProfile.fields.DocumentName.file.id);
                nlapiSetFieldValue("custrecord_scre_output_file", creProfile.fields.DocumentName.file.id);
            }

            var resultObj = {
                result: result
            };

            var fieldValue = "";

            for (var fieldName in creProfile.fields) {
                if (fieldName == "DocumentName") {
                    if (creProfile.fields.DocumentName.file)
                        fieldValue = creProfile.fields[fieldName].file.name;
                } else
                    fieldValue = creProfile.fields[fieldName].translatedValue;

                if (fieldValue)
                    resultObj[fieldName] = fieldValue;
            };

            var s = JSON.stringify(resultObj);

            if (s.length > 100000)
                s = s.substring(0,100000);

            nlapiSetFieldValue("custrecord_scre_result", s);

        } catch(e) {
            nlapiLogExecution("ERROR", funcName, JSON.stringify(e));
            nlapiSetFieldValue("custrecord_scre_error_msg", JSON.stringify(e));
        }

        nlapiLogExecution("DEBUG", funcName, '### EXITING ###');

    }
}