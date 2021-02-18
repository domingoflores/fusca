//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the Support Case record
 * 
 */

define([ "N/search","N/runtime","N/ui/serverWidget","N/config","N/url","N/redirect",
         "./Shared/SRS_Constants",
         "/.bundle/132118/PRI_ServerLibrary",
         "/.bundle/132118/PRI_AS_Engine",
         "SuiteScripts/Pristine/libraries/TaxForm_Library.js"
         ],
				
		function( search,runtime, ui,config,url,redirect,
				srsConstants,
				priLibrary,
				appSettings,
				tfLibrary
		) {
	
			var scriptName = "SRS_UE_TaxForm.";

			/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
			function createAndHideField(form, field, value)
			{
				var fieldmetadata = {
	                    id: 	"custpage_txfm_batch_" + field,
	                    type: 	ui.FieldType.TEXT,
	                    label: 	field
	                };
	        	field = form.addField(fieldmetadata);
	        	field.defaultValue = value;
	        	field.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
			}
			function disableField(form, field)
			{
				field = form.getField(field);
	        	field.updateDisplayType({
					displayType: ui.FieldDisplayType.DISABLED
				});
			}
			function getRecordInternalIDNumber(recid) {
		        var recordurl = url.resolveRecord({
		            "recordType" : recid
		        });
		        var retValue = recordurl.split("=")[1];
		        if (retValue && retValue.indexOf("&")>0)
		        {
		            retValue = retValue.split("&")[0];
		        }
		        log.debug("Record internal id " + recid + " is " + retValue);
		        return retValue;
		    }
			function addTab(form, options)
			{
				//only show Tax Form Detail Subtab Batch has been Submitted
	    		var objDynamicTab = form.addTab({
					id : options.id,
					label : options.label
				});
				
	    		//add iframe container
				var objEmbeddedFld = form.addField({
					id : options.id+"_field",
					label : "HTML IFRAME Container",
					type : ui.FieldType.INLINEHTML,
					container : options.id
				});
				
				// create iframe without headers 
				objEmbeddedFld.defaultValue = '<iframe id="'+options.id+'_iframe" name="'+options.id+'_iframe" '
						+ 'src="about:blank" '
						+ 'width="100%" height="600" '
						+ 'frameborder="0" '
						+ 'longdesc="Tax Form Batch Detail records"></iframe>'
						+ '<script> '
						+ '   window.onmessage = (e) => { '
						+ '     if (e.data.hasOwnProperty("frameHeight")) { '
						+ '       document.getElementById("'+options.id+'_iframe").style.height = `${e.data.frameHeight + 30}px`; '
						+ '     } '
						+ '   }; '
						+ '</script> '
						
				//always Preview/Detail tabs in front of all other tabs
				//even if new tabs are added or re-arranged later 
				var tabs = 	form.getTabs();
				var insertIndex = 1;
				if (tabs && tabs[insertIndex])
				{
					//example of tabs array:
//					["main","workflow","custom368","custom365","custpage_tab_taxbatch","notes","translation"]
//					["main","custom368","custom365","custpage_tab_taxbatch","notes","translation"]
					form.insertTab({
					    tab: objDynamicTab,
					    nexttab:tabs[insertIndex]
					});
				}
				
			}
			function beforeLoad(context) 
			{
				var options = {};
		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    	log.debug("beforeLoad", funcName);
		    	var REC = context.newRecord; 
		    	var form = context.form;
		    	
		    	if (context.type === context.UserEventType.CREATE
		    	|| context.type === context.UserEventType.COPY		
		    	) 
		    	{ 
		    		if (!tfLibrary.userIsATaxAnalyst())
		    		{
		    			var recscriptid = getRecordInternalIDNumber("customrecord_tax_form_batch");
		    			var redurl = url.resolveTaskLink("LIST_CUST_"+recscriptid);
		    			redirect.redirect({
		    			    url: redurl
		    			}); 
		    			return;
		    		}
		    		
		    	}
		    	
		    	var tbStatus = REC.getValue("custrecord_txfm_batch_status"); 
		    	log.debug("tbStatus ", tbStatus);
		    	
		    	if (!tfLibrary.userIsATaxAnalyst())
		    	{
		    		priLibrary.preventEdit(context, tfLibrary.userIsATaxAnalyst(), "Only Tax Analysts may make changes to this record.");
		    	}
		    	else if (parseInt(tbStatus,10) !== parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
		    	{
		    		var canEdit = false;
		    		priLibrary.preventEdit(context, canEdit, "Batch can be only edited when status is in Draft.");
		    	}
		    	
		    		
		    	var isInactive = REC.getValue("isinactive");
		    	var processingMetadata = REC.getValue("custrecord_txfm_batch_metadata");
		    	var numberofforms = REC.getValue("custrecord_txfm_batch_numberofforms");
		    	
		    	//strInputSlURL will be used to pass suitelet URL base
	    		//to the button 
	    		var strInputSlURL = url.resolveScript({
					scriptId : "customscript_srs_tax_form_batch",
					deploymentId : "customdeploy_srs_tax_form_batch",
					returnExternalUrl: false
				});
		    	
	    		if (context.type == context.UserEventType.VIEW)
		    	{
		    		form.clientScriptModulePath = "SuiteScripts/Prolecto/SRS_CL_TaxFormBatchViewFunctions.js";
		    		if (parseInt(tbStatus,10) === parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
		    		{
			    		if (!isInactive && !processingMetadata)
				    	{
				    		var button = form.addButton({
							 	id : "custpage_submit",
							 	label : "Submit",
							 	functionName: "submitTaxFormBatch(\"" + strInputSlURL  +  "\",\"" + REC.id +  "\")"
							});
				    		if (parseInt(numberofforms,10)>0)
				    		{
				    			button.isDisabled = false;
				    		}
				    		else 
				    		{
				    			button.isDisabled = true;
				    		}
				    	}
			    		
			    	}
	    		}
	    		if (context.type == context.UserEventType.COPY)
	    		{
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_formsindraft",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_formsgenerated",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_formsdelivered",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_oriform_count",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_revform_count",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_corform_count",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_emaildelivery",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_mailcount",value:0});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_status",value:srsConstants["Tax Form Batch Status"]["Draft"]});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_processingmetadata",value:""});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_processing_notes",value:""});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_submittedon",value:null});
	    			REC.setValue({ fieldId:"custrecord_txfm_batch_submittedby",value:null});
	    			
	    			
	    		}
	    		
	    		if ((context.type == context.UserEventType.EDIT)||
		    		(context.type == context.UserEventType.COPY) ||
		    		(context.type == context.UserEventType.CREATE))
		    	{
	    			
		    		//in the edit mode only, Tax Form Detail subtab will be rendered. 
		    		//We are including common client script for supporting button function
		    		//so that we don't need to produce another script. 
		    		
    				form.clientScriptModulePath = "SuiteScripts/Prolecto/SRS_CL_TaxFormBatchViewFunctions.js";
		    		var previewButton = form.addButton({
					 	id : "custpage_preview",
					 	label : "Preview",
					 	functionName: "refreshIframe(\"" + strInputSlURL  +  "\")"
					});
		    		
		    		var taxyearfiled = REC.getValue("custrecord_txfm_batch_yr_filed");
	          		var reportmethod = REC.getValue("custrecord_txfm_batch_report_method");
	    			var iscovered = REC.getValue("custrecord_txfm_batch_iscovered"); 
	    			var deals = REC.getValue("custrecord_txfm_batch_deals");  
	    			
	    			if ((isInactive) 
		    		|| (parseInt(REC.getValue("custrecord_txfm_batch_status"),10) !== parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
		    		|| (!taxyearfiled)
		    		|| (!reportmethod)
		    		|| (!iscovered)
		    		|| (deals.toString()==="")
				    )	
			    	{
	    				//if record is inactive, preview is disabled
	    				//if record is not in draft status, preview is disabled
	    				//if any of the 4 needed fields is empty, preview is disabled
		    			previewButton.isDisabled = true;
			    	}
	    			if (parseInt(REC.getValue("custrecord_txfm_batch_status"),10) === parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
	    			{
	    				options = {};
	    				options.id = "custpage_tab_taxbatch";
		    			options.label = "Tax Form Batch Preview";
		    			addTab(form, options);
	    			}
		 	
	    			//initialize batch status value 
			    	var field = form.getField({
						id: "custrecord_txfm_batch_status"
					});
					field.updateDisplayType({
						displayType: ui.FieldDisplayType.DISABLED
					});
					field.defaultValue=srsConstants["Tax Form Batch Status"]["Draft"];
			    	
			    	
					//********************** intitialize address fields  ****************************
					var configRecObj = config.load({
					    type: config.Type.COMPANY_INFORMATION
					});
					var addrobj = configRecObj.getSubrecord("mainaddress");
					createAndHideField(form, "address1", addrobj.getValue("addr1"));
					createAndHideField(form, "address2", addrobj.getValue("addr2"));
					createAndHideField(form, "address3", addrobj.getValue("addr3"));
					createAndHideField(form, "city", addrobj.getValue("city"));
					createAndHideField(form, "state", addrobj.getValue("state"));
					createAndHideField(form, "zip", addrobj.getValue("zip"));
					createAndHideField(form, "country", addrobj.getValue("country"));
				}

				//adding sublist to work in the view mode 
	    		if (context.type == context.UserEventType.VIEW)
			    {
		    		if (parseInt(REC.getValue("custrecord_txfm_batch_status"),10) !== parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
	    			{
		    			options.id = "custpage_tab_taxbatch";
		    			options.label = "Tax Form Batch Detail";
		    			addTab(form, options);
	    			}
				 	
			    }
		    	if (context.type == context.UserEventType.EDIT) 
				{
		    		if (parseInt(REC.getValue("custrecord_txfm_batch_status"),10) !== parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
		    			
		    		{
		    			disableField(form,"name");
		    			disableField(form,"custrecord_txfm_batch_yr_filed");
		    			disableField(form,"custrecord_txfm_batch_report_method");
		    			disableField(form,"custrecord_txfm_batch_deals");
		    			disableField(form,"custrecord_txfm_batch_iscovered");
		    			disableField(form,"custrecord_txfm_batch_priority");
		    			disableField(form,"custrecord_txfm_batch_analyst");
		    			disableField(form,"custrecord_txfm_batch_payer_type");
		    			disableField(form,"custrecord_txfm_batch_payer_entity");
		    			disableField(form,"custrecord_txfm_batch_payer_name");
		    			disableField(form,"custrecord_txfm_batch_payer_taxid");
		    			disableField(form,"custrecord_txfm_batch_payer_address");
		    			disableField(form,"custrecord_txfm_batch_payer_city");
		    			disableField(form,"custrecord_txfm_batch_payer_state");
		    			disableField(form,"custrecord_txfm_batch_payer_postal");
		    			disableField(form,"custrecord_txfm_batch_payer_phone");
		    		}
				}
			}
			
			function beforeSubmit(context) 
			{
				var funcName = scriptName + "--->beforeSubmit";
				log.debug("beforeSubmit", funcName);
		    	
	            var REC = context.newRecord; 
        		if (context.type != context.UserEventType.DELETE) 
    			{
		    	    var errormsg = tfLibrary.validateTaxForm(context);
					if (errormsg)
					{
						throw errormsg;
					}
					
					if (REC.getValue("isinactive"))
					{
						//if record is inactive, allow save
						return true;
					}
					
					var taxyearfiled = REC.getValue("custrecord_txfm_batch_yr_filed");
	    			var reportmethod = REC.getValue("custrecord_txfm_batch_report_method");
	    			var iscovered = REC.getValue("custrecord_txfm_batch_iscovered"); 
	    			var deals = REC.getValue("custrecord_txfm_batch_deals");  
					var dealsInProgress = tfLibrary.getDealsInProgress(taxyearfiled, reportmethod, iscovered, deals, REC.id);
					if (dealsInProgress && dealsInProgress.length>0)
					{
						var i = 0;
						var linkshtml = "";
						for (i=0; i<dealsInProgress.length; i+=1)
						{
							if (linkshtml)
							{
								linkshtml = linkshtml + ",";
							}
							linkshtml = linkshtml + tfLibrary.getAnchor("customrecord_tax_form_batch", dealsInProgress[i].id,dealsInProgress[i].name);
						}
						throw "Deals for tax year "+taxyearfiled+", tax form included in another batch. Following existing Tax Form Batches found:  " + linkshtml; 
					}
		    	}
        		else 
        		{
        			log.debug("User is Tax Analyst Or Admin? " + tfLibrary.userIsATaxAnalyst());
        			if (!tfLibrary.userIsATaxAnalyst())
					{
        				throw "You are not permitted to delete this record";
					}
        		}
				
			}
    		return {
			beforeLoad: 	beforeLoad,
			beforeSubmit: beforeSubmit
		}
});

