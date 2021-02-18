//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * automation for generating a drop down of relevant CRE documents
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/url', 'N/format', 'N/ui/serverWidget', './creLibrary20.js'],
				
		function(record, search, runtime, error, url, format, serverWidget, lib) {
	
			var scriptName = "cre_dropdown_BL";

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

				//paramertize the name of the button and profileTypes
    			var buttonLabel=runtime.getCurrentScript().getParameter({name : 'custscript_cre_button_name_20'});
    			var profileId=runtime.getCurrentScript().getParameter({name : 'custscript_cre_profile_id_button_20'});
		    	
    			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.EDIT)) {

    				//search for the CREs that meet the criteria by using the profiletype field.  Others can be imagined.
					var ss = search.create({
    					type: 'customrecord_pri_cre_profile',
						filters: [
    					         	["isinactive",search.Operator.IS,false]
    					         	,"AND",["custrecord_pri_cre_profile_type",search.Operator.IS,profileType]
    					         ],
    					columns: [search.createColumn({name: "name", sort: search.Sort.ASC})]
    				}).run().getRange(0,999);
    				
    				//create a custom drop down field going outside of NetSuite's built in control
					if (ss.length > 0) {
        				
						//create the drop down field
						var fld = context.form.addField({id: "custpage_pri_cre_profile_id", label: buttonLabel, type: serverWidget.FieldType.INLINEHTML});
        				
        				var fldHTML = "<span class='smallgraytextnolink uri-label'>" + buttonLabel + "</span><br><select id='custpage_pri_cre_profile_id'>";
        				
        				for (var i = 0; i < ss.length; i++) 
        					fldHTML += "<option value='" + ss[i].id + "'>" + ss[i].getValue("name") + "</option>";
        				
        				fldHTML += "</select><br/>&nbsp;<br/>";
        				fld.defaultValue = fldHTML;    				
        				
    					fld.updateLayoutType({layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE});
    					fld.updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL});
						
    					
    					
						//hookup the client script
						context.form.clientScriptModulePath = "/SuiteScripts/Prolecto/mts_CL_eSignControl.js";
						var echoSignScriptURL = url.resolveScript({
							'scriptId':'customscript_echosign_agreement_creater',
							'deploymentId':'customdeploy_echosign_agreement_creater', 
							'returnExternalUrl': false
						});

						var createPdfURL = url.resolveScript({
							'scriptId':'customscript_cre_profile_suitelet_exampl',
							'deploymentId':'customdeploy_test_cre', 
							'returnExternalUrl': false
						});
						
						log.debug(funcName, "echosignURL=" + echoSignScriptURL);
						log.debug(funcName, "CRE URL=" + createPdfURL);

						context.form.addButton({
							id : "custpage_create_document",
							label : buttonLabel,
							// functionName: "createDocument('" + echoSignScriptURL + "')"
							functionName: "createDocument('" + echoSignScriptURL + "','" + createPdfURL + "')"
						});    				    				

    				}
    			}
    			
					
                    
                    var echoSignScriptURL = url.resolveScript({
    	                'scriptId':'customscript_echosign_agreement_creater',
    	                'deploymentId':'customdeploy_echosign_agreement_creater', 
    	                'returnExternalUrl': false
    	            });

                    var createPdfURL = url.resolveScript({
    	                'scriptId':'customscript_cre_profile_suitelet_exampl',
    	                'deploymentId':'customdeploy_test_cre', 
    	                'returnExternalUrl': false
    	            });
                    
                    log.debug(funcName, "echosignURL=" + echoSignScriptURL);
                    log.debug(funcName, "CRE URL=" + createPdfURL);

                    context.form.addButton({
                        id : "custpage_create_document",
                        label : buttonLabel,
                        // functionName: "createDocument('" + echoSignScriptURL + "')"
                        functionName: "createDocument('" + echoSignScriptURL + "','" + createPdfURL + "')"
                    });    				    				
    			}
    			
    			
			} // beforeLoad

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		return {
			beforeLoad: beforeLoad			
		}
});
