//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 *	Receives a Script Parameter which is a JSON object/array of data to perform "submitfields" against
 *
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/format','/.bundle/132118/PRI_ServerLibrary'],

    function(runtime,record,error,search,format,priLibrary) {

        var scriptName = "SRS_MR_SubmitFields.";

        function getInputData() {

            var funcName = scriptName + "getInputData";

            var updateList = runtime.getCurrentScript().getParameter({'name':'custscript_srs_mr_submitfields'});

            if (!updateList) {
                log.error(funcName, "This script can't be executed without the parameter being passed to it.");
                return [];
            }

            var obj = JSON.parse(updateList);

            log.audit(funcName, "Request to update " + obj.length + " records.");

            return JSON.parse(updateList);
        }


        // ================================================================================================================================

        function map(context) {

            var funcName = scriptName + "map " + context.key;

            var obj = JSON.parse(context.value);

            log.debug(funcName, obj);

            record.submitFields(obj);

            context.write(obj.type, obj.id);

        }


        // ================================================================================================================================


        function summarize(summary) {
            var funcName = scriptName + "summarize";

            var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

            if (errorMsgs && errorMsgs.length > 0)
                log.error(funcName, JSON.stringify(errorMsgs));

            var recsUpdated = 0;

            summary.output.iterator().each(function (key, value) {
                recsUpdated++;
                return true;
            });

            log.debug(funcName, recsUpdated + " Record(s) updated.");

            log.debug(funcName, "Exiting");
        }

        // ================================================================================================================================
        // ================================================================================================================================


        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    }
);
