/** This script will update a Document (Custom) record with the correct Audience value based on the Document Template record's Audience
 *
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search'
          ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
          ,'/SuiteScripts/Pristine/libraries/documentLibrary.js'
          ,'/.bundle/132118/PRI_AS_Engine'
          ,'/.bundle/132118/PRI_ShowMessageInUI'
    ],

     function(record, runtime, search
            ,toolsLib
            ,docLib
            ,appSettings
            ,priMessage
        ) {
          var  scriptName = "SRS_UE_DocumentRecUpdates.js";
          const FIELDS = {
                    DOCUMENT: {
                         DOC_TYPE: {
                         ID: 'custrecord_doc_type',
                         // VALUES: ['555'] // Supposed to be Tax Form. There is no id = 555. Tax Form = 654. 
                         VALUES: ['654'] // Supposed to be Tax Form. There is no id = 555. Tax Form = 654.
                         },        
                         ID: 'customrecord_document_management',
                         TAX_FORM_TYPE: 'custrecord_doc_tax_form_type',
                         STATUS: {
                              ID: 'custrecord_dm_status',
                              VALUES: ['4', '5'] // Final & Executed and Final
                         },
                         SIGNED_STATUS: {
                              ID: 'custrecord_doc_signed_status',
                              VALUES: ['1'] // Signed
                         },
                         TEMPLATE: 'custrecord_doc_template',
                         EXC_REC: 'custrecord_acq_lot_exrec',
                         AUDIENCE: 'custrecord_doc_audience',
                         FILE: 'custrecord_file',
                         DOC_RECEIVED_METHOD: {
                              ID: 'custrecord_doc_document_recvd_method',
                              VALUES: ['2']  // Offline
                         },
                    },
                    TEMPLATE: {
                         AUDIENCE: 'custrecord_dt_audience',
                         ID: 'customrecord_doc_template'
                    },
                    ADDITIONAL_SIGNER_TAGS: 'Additional Signer Tags'
          };
     
          /**
          * Function definition to be triggered before record is submitted.
          * In the case of a create or update to a Document record via UI, inline edit or csv import,
          * where the Signed Status = Signed
          * and   the Document Status is either "Final" or "Final and Executed"
          * and   the Document is linked to an Exchange Record and a Document Template
          * then  if the Document does NOT have any additional signer tags populated with an email address:
          *       update the Document audience so that it = the Audience of the template 
          *       otherwise,  if the Document DOES have additional signer tags populated with an email address:
          *                   and the File field is populated
          *                   and the Document Received Method = "Offline"
          *                   then update the Document audience so that it = the Audience of the template 
          *
          * @param {Object} context
          */
          function beforeSubmit(context) {
               var funcName = scriptName + "==>beforeSubmit " + context.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
               log.debug(funcName);
               var allowedContextTypes = [context.UserEventType.CREATE, context.UserEventType.EDIT, context.UserEventType.XEDIT];
               var allowedRuntimeTypes = [runtime.ContextType.USEREVENT, runtime.ContextType.USER_INTERFACE,runtime.ContextType.CSV_IMPORT, runtime.ContextType.SUITELET];
               var uiMessage = '';


               uiMessage = sourceTaxFormFromExRec(context, uiMessage);

               if (allowedContextTypes.indexOf(context.type) > -1 && allowedRuntimeTypes.indexOf(runtime.executionContext) > -1) {
                    log.audit(funcName, 'The UserEventType and the runtime ContextType meet criteria for audience update');
                    var newRec = context.newRecord;

                    // Validate JSON
                    var JSONObj = toolsLib.getFieldValue(context,"custrecord_echosign_json").toString().toLowerCase();
                    var isJSONValidResult = docLib.isJSONValid(JSONObj);
                    if (!isJSONValidResult.success) {throw 'Echosign JSON object is invalid. ' + isJSONValidResult.message;}

                    var signedStatus = toolsLib.getFieldValue(context, FIELDS.DOCUMENT.SIGNED_STATUS.ID);
                    var docStatus = toolsLib.getFieldValue(context,FIELDS.DOCUMENT.STATUS.ID);
                    var exRec =  toolsLib.getFieldValue(context,FIELDS.DOCUMENT.EXC_REC);
                    var docTemplate = toolsLib.getFieldValue(context,FIELDS.DOCUMENT.TEMPLATE);
                    var docAudience = toolsLib.getFieldValue(context,FIELDS.DOCUMENT.AUDIENCE);
                    var validSignedStatus = FIELDS.DOCUMENT.SIGNED_STATUS.VALUES.indexOf(signedStatus) > -1;
                    var validDocStatus = FIELDS.DOCUMENT.STATUS.VALUES.indexOf(docStatus) > -1;
                    var hasExchangeRec = Boolean(exRec);
                    var hasTemplate = Boolean(docTemplate);
                    var additionalSignerDoc = isAdditionalSignerDoc(context);
                    var resourceDocAudience = false;
                   
                    if (validSignedStatus && validDocStatus && hasExchangeRec && hasTemplate) {
                         var templateAudience = fetchTemplateAudience(context, docTemplate);
                         log.debug(funcName,'templateAudience: ' + JSON.stringify(templateAudience));
                         if (additionalSignerDoc) {
                              var offlineAndFilePopulated = isOfflineAndFilePopulated(context);
                              if (offlineAndFilePopulated) {
                                   log.debug(funcName, 'Additional Signer doc about to be updated with template audience');
                                   resourceDocAudience = true;
                              }
                         } else {
                              log.debug(funcName, 'Non Additional Signer doc about to be updated with template audience');
                              resourceDocAudience = true;
                         }  
                         log.debug(funcName,'resourceDocAudience: ' + JSON.stringify(resourceDocAudience));
                         log.debug(funcName,'docAudience: ' + JSON.stringify(docAudience));
                         if (resourceDocAudience) {
                              if (!toolsLib.areArraysEqual(templateAudience,docAudience)) {
                                   newRec.setValue({ fieldId: FIELDS.DOCUMENT.AUDIENCE, value: templateAudience });
                                   uiMessage += 'Audience re-sourced from document template';
                                   // priMessage.prepareMessage("Saved", uiMessage, priMessage.TYPE.CONFIRMATION);
                              }
                         }
                    }
               } else { log.audit(funcName, 'Either the UserEventType or the runtime ContextType does not meet criteria for audience update');}
               if (uiMessage) {
                    priMessage.prepareMessage("Saved", uiMessage, priMessage.TYPE.CONFIRMATION);
               }
          }

          // Determine whether this document has an Additional Signer Email such as Spousal Email in the JSON field
          function isAdditionalSignerDoc(context) {
               var funcName = scriptName + "==>isAdditionalSignerDoc";
               var additionalSignerTags = JSON.parse( appSettings.readAppSetting("Documents", FIELDS.ADDITIONAL_SIGNER_TAGS) ); 
               var result = false;        
               var echosignJSON = toolsLib.getFieldValue(context,"custrecord_echosign_json").toString().toLowerCase();
               var echosignOuterObject;
               var echosignObject;
               try { echosignOuterObject = JSON.parse(echosignJSON); }
               catch(e){log.error(funcName, e.message);}
               if (echosignOuterObject) {
                    if (echosignOuterObject["0"]) { echosignObject = echosignOuterObject["0"]; }
                                         else { echosignObject = echosignOuterObject; }
                    log.debug(funcName, 'echosignObject: ' + JSON.stringify(echosignObject));  
                   
                    for (var i = 0; i < additionalSignerTags.length; i++) {
                         if (echosignObject[additionalSignerTags[i].toLowerCase()] ) {
                              // If there is any value in the additional signer tag - then its an Additional Signer Document
                              // for purposes of re-sourcing audience from template 
                              if (echosignObject[additionalSignerTags[i].toLowerCase()] > "") { 
                                   result = true;
                                   break;
                              }       
                         }
                    }                    
               }
               log.debug(funcName, 'Is this an additional signer doc? ' + result);
               return result;
          }

          function fetchTemplateAudience(context, docTemplate) {
               var funcName = scriptName + "==>fetchTemplateAudience";

               var audience = [];
               try {
                    var templateLookUp = search.lookupFields({
                                       type: FIELDS.TEMPLATE.ID,
                                       id: docTemplate,
                                       columns: [FIELDS.TEMPLATE.AUDIENCE]
                                   });
                    if (Boolean(templateLookUp[FIELDS.TEMPLATE.AUDIENCE][0])) {
                         for (var i = 0; i < templateLookUp[FIELDS.TEMPLATE.AUDIENCE].length; i++) {
                              audience.push(templateLookUp[FIELDS.TEMPLATE.AUDIENCE][i].value); 
                         }
                    }

               } catch (e){log.error(funcName, e.message);}

               return audience;
          }

          function isOfflineAndFilePopulated(context) {
               var funcName = scriptName + "==>isOfflineAndFilePopulated";
               var result = false;
               var file =  toolsLib.getFieldValue(context,FIELDS.DOCUMENT.FILE);
               var docRecMethod =  toolsLib.getFieldValue(context,FIELDS.DOCUMENT.DOC_RECEIVED_METHOD.ID);
               var offline = FIELDS.DOCUMENT.DOC_RECEIVED_METHOD.VALUES.indexOf(docRecMethod) > -1;
               if (offline && file) {
                    result = true;
               }
               log.debug(funcName, 'Is the Document Received Method = Offline and is the File field populated? ' + result);
               return result;
          }

          function sourceTaxFormFromExRec(context, uiMessage) {
               /*
                * If the Doc Type field is Tax Form and the Tax Form Type is blank then we need to source
                * in the value of the Tax Form Collected field on the Linked Exchange Record (if one is linked)
                */
               var funcName = scriptName + "==>sourceTaxFormFromExRec";
               var rcd = context.newRecord; 
               var docType = toolsLib.getFieldValue(context,FIELDS.DOCUMENT.DOC_TYPE.ID);
               var exRecId = toolsLib.getFieldValue(context,FIELDS.DOCUMENT.EXC_REC);
               var taxFormType = toolsLib.getFieldValue(context,FIELDS.DOCUMENT.TAX_FORM_TYPE);

               if (FIELDS.DOCUMENT.DOC_TYPE.VALUES.indexOf(docType) > -1) {
                    log.debug(funcName, 'Doc Type chosen = Tax Form');
                    if (Boolean(exRecId) && !Boolean(taxFormType)) {
                         var taxFormCollected = docLib.getExRecTaxForm(exRecId);
                         rcd.setValue({fieldId: FIELDS.DOCUMENT.TAX_FORM_TYPE, value: taxFormCollected});
                         uiMessage = 'Tax Form re-sourced from Exchange Record. <br>';
                    }
               }
               return uiMessage;
          }

          return {beforeSubmit: beforeSubmit
          };

     });
