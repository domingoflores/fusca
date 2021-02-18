/**
 * If the Audience field value on a Document Template is updated, this script will call a Map/Reduce script that will go through all
 * of the Document (Custom) records associated with that particular Document Template record and update them with the new Audience field
 * value
 *
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/message', 'N/url', 'N/https'
        ,'./Shared/SRS_Functions'
        ,'./Shared/SRS_Constants'
 	   ,'/.bundle/132118/PRI_ServerLibrary'
        ],

    function (record, redirect, runtime, search, message, url, https
    		,srsFunctions
    		,srsConstants
    		, priLibrary		
    ) {

        const SCRIPT_ID = 'customscript_srs_sl_deploy_mr';

        const FIELDS = {
            DOCUMENT: {
                ID: 'customrecord_document_management',
                STATUS: {
                    ID: 'custrecord_dm_status',
                    VALUES: ['4', '5']
                },
                SIGNED_STATUS: {
                    ID: 'custrecord_doc_signed_status',
                    VALUES: ['1']
                },
                TEMPLATE: 'custrecord_doc_template',
                EXC_REC: 'custrecord_acq_lot_exrec',
                AUDIENCE: 'custrecord_doc_audience'
            },
            TEMPLATE: {
                AUDIENCE: 'custrecord_dt_audience',
                ID: 'customrecord_doc_template',
                JOIN: 'custrec_doc_template',
                FAILED_UPDATE: 'custrecord_failed_bulk_update'
            }
        };

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE && scriptContext.type === scriptContext.UserEventType.EDIT) {

                if (scriptContext.request.parameters.failedUpdate) {

                    scriptContext.form.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: "Error Triggering Bulk Updates",
                        message: "Error Triggering Document (Custom) Bulk Updates. The changes to this record were not saved. Please make them again and save the record"
                    });
                }
            }
        }

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

            var allowedContextTypes = [scriptContext.UserEventType.EDIT, scriptContext.UserEventType.XEDIT];
            var allowedRuntimeTypes = [runtime.ContextType.USEREVENT, runtime.ContextType.CSV_IMPORT];

            if (allowedContextTypes.indexOf(scriptContext.type) > -1 || allowedRuntimeTypes.indexOf(runtime.executionContext) > -1) {

                var newRec = scriptContext.newRecord;
                var oldRec = scriptContext.oldRecord;

                var oldAudience = oldRec.getValue({ fieldId: FIELDS.TEMPLATE.AUDIENCE });
                var newAudience = newRec.getValue({ fieldId: FIELDS.TEMPLATE.AUDIENCE });
                var failedUpdate = newRec.getValue({fieldId: FIELDS.TEMPLATE.FAILED_UPDATE});

                if (newAudience !== oldAudience) {
                	var href = url.resolveScript({
                        scriptId: SCRIPT_ID,
                        deploymentId: 'customdeploy_srs_sl_deploy_mr',
                        params: { recid: newRec.id, newaudience: JSON.stringify(newAudience) },
                        returnExternalUrl: true
                    });

                    var responseObj = https.post({
                        url: href
                    });

                    var responseMssg = responseObj.body;
                	
                    if (responseMssg === 'failed') {

                        if (runtime.executionContext === runtime.ContextType.CSV_IMPORT) {

                            throw "Error Triggering Document (Custom) Bulk Updates. The changes to this record were not saved. Please re-upload this CSV with the only the failed records."

                        } else {

                            // If the Map/Reduce couldn't be kicked off, set it up to redirect the user and set
                            // the Audience field back to what it was before
                            newRec.setValue({fieldId: FIELDS.TEMPLATE.FAILED_UPDATE, value: true});
                            newRec.setValue({fieldId: FIELDS.TEMPLATE.AUDIENCE, value: oldAudience});
                        }

                    } else {

                        if (failedUpdate && responseMssg !== 'failed') {

                            newRec.setValue({fieldId: FIELDS.TEMPLATE.FAILED_UPDATE, value: false});
                        }
                    }
                }
            }
        }


        /**
         * Function definition to be triggered after record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) 
        {
        	
        	log.debug("scriptContext.type", scriptContext.type);
        	if (scriptContext.type === scriptContext.UserEventType.EDIT
        			|| scriptContext.type === scriptContext.UserEventType.XEDIT		
        	)
        	{
        		if (priLibrary.fieldChanged(scriptContext, "custrecord_dt_json_required")
        			|| priLibrary.fieldChanged(scriptContext, "custrecord_dt_sh_req_action")
        		)
            	{
            		
            		var records = [];
            		records.push(scriptContext.newRecord.id);
            		log.debug("Adding Doc Custom to re-evaluate", JSON.stringify(records));
            		srsFunctions.writeDocumentCustomsToRSMQueue(
            		
            				[
            			      ["custrecord_doc_template","anyof",records], 
            			      "AND", 
            			      ["isinactive","is","F"], 
            			      "AND", 
            			      ["custrecord_acq_lot_exrec","noneof","@NONE@"], 
            			      "AND", 
            			      ["custrecord_acq_lot_exrec.isinactive","is","F"], 
            			      "AND", 
            			      ["custrecord_acq_lot_exrec.custrecord_acq_loth_related_trans","anyof","@NONE@"], 
            			      "AND", 
            			      ["custrecord_acq_lot_exrec.custrecord_ch_completed_datetime","isnotempty",""],
            			      "AND", 
            			      ["custrecord_acq_lot_exrec.custrecord_acq_loth_zzz_zzz_acqstatus","noneof",srsConstants["Acquiom LOT Status"]["5f. Payment Processing"]]
            			   ]
            		
            		); 	
    			}
        	}
        	if (runtime.executionContext === runtime.ContextType.USER_INTERFACE && scriptContext.type === scriptContext.UserEventType.EDIT) {

                var newRec = scriptContext.newRecord;
                
                var failedUpdate = newRec.getValue({fieldId: FIELDS.TEMPLATE.FAILED_UPDATE});

                if (failedUpdate) {

                    redirect.toRecord({
                        type: newRec.type,
                        id: newRec.id,
                        isEditMode: true,
                        parameters: {
                            failedUpdate: true
                        }
                    });
                }
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
