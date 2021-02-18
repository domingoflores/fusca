//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

/*
 *
 * Client script for the Suitelet which lets user create an Tax Form Batch
 * 
 */

define(["N/error","N/ui/message","N/search","N/record","N/url", "N/https"
        ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
        ,"SuiteScripts/Pristine/libraries/TaxForm_Library.js"
        ,"/.bundle/132118/PRI_AS_Engine"
        ],
	function(error,message,search,record,url,https
			,srsConstants
			,tfLibrary
			,appSettings
	) 
	{
		var scriptName = "SRS_CL_TaxFormBatch.";
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC = null;
		var myMsg = null;
		function showErrorMessage(msgTitle, msgText) {
			myMsg = message.create({ title:msgTitle ,message: msgText ,type: message.Type.ERROR });
			myMsg.show();
		    window.scrollTo(0, 0);
		}
		//safe to execute on page init, or field changed custrecord_txfm_batch_payer_type
		function handlePayerEntity()
		{
			var payertype = REC.getValue("custrecord_txfm_batch_payer_type");
			
    		if (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Acquiom Financial"],10))
            {
    			unlockField("custrecord_txfm_batch_payer_entity"); //Edit ONLY available when Payer Type = Acquiom Financial
    			var payerentity = REC.getValue("custrecord_txfm_batch_payer_entity");
    			if (!payerentity)	
    			{									//Default Entity Selection : Acquiom Financial LLC.   
    				REC.setValue({ fieldId:"custrecord_txfm_batch_payer_entity" 
						  ,value:srsConstants["Default Payer Financial Entity"]
						  ,ignoreFieldChange : true
						}); 
    			}
    			//If Payer Type = Acquiom Financial, THEN Field is Mandatory
    			setMandatory("custrecord_txfm_batch_payer_entity");
            }
    		else 
    		{
    			clearFieldValue("custrecord_txfm_batch_payer_entity");
    			lockField("custrecord_txfm_batch_payer_entity");
    			setNotMandatory("custrecord_txfm_batch_payer_entity");
    		}
    		
		}
		function handlePayerNameAndTaxID()
		{
			var payertype = REC.getValue("custrecord_txfm_batch_payer_type");
			var payerEntity = REC.getValue("custrecord_txfm_batch_payer_entity");
			var classFields = null;
			
    		if (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Acquiom Financial"],10))
            {
    			classFields = search.lookupFields({						
					type: "classification",
					id: payerEntity,
					columns: ["name", "custrecord_entity_tax_id"]
				});//return object with various fields from applied transaction
            	
    			var str = classFields.name;
    			var n = str.lastIndexOf(":");
    			var result = str.substring(n + 1);
    			
            	setAndLockField("custrecord_txfm_batch_payer_name", result); // When Payer Type = Acquiom Financial, set value to Entity.NAME - cannot edit
            	setMandatory("custrecord_txfm_batch_payer_name");	// If Payer Type = {Acquiom Financial, Other}, THEN Field is Mandatory
            	
            	setAndLockField("custrecord_txfm_batch_payer_taxid", classFields.custrecord_entity_tax_id); //When Payer Type = Acquiom Financial, set value to Entity. ENTITY TAX ID #.  - cannot edit
            	setMandatory("custrecord_txfm_batch_payer_taxid"); //If Payer Type = {Acquiom Financial, Other}, THEN Field is Mandatory
            	
            }
			if (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Other"],10))
            {
				unlockField("custrecord_txfm_batch_payer_name"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_name");	// If Payer Type = {Acquiom Financial, Other}, THEN Field is Mandatory
            	
				unlockField("custrecord_txfm_batch_payer_taxid"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_taxid"); //If Payer Type = {Acquiom Financial, Other}, THEN Field is Mandatory
            }
			if ((parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Buyer"],10))
        			|| (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Seller"],10)))
            {
    			disableField("custrecord_txfm_batch_payer_name"); //When Payer Type = Buyer or Seller, keep as NULL - cannot edit
    			disableField("custrecord_txfm_batch_payer_taxid"); //When Payer Type = Buyer or Seller, keep as NULL - cannot edit
            }
		}
		function handleAddress()
		{
			var payertype = REC.getValue("custrecord_txfm_batch_payer_type");
			var address = "";
			if (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Acquiom Financial"],10))
            {
				var address1 = REC.getValue("custpage_txfm_batch_address1");
				var address2 = REC.getValue("custpage_txfm_batch_address2");
				var address3 = REC.getValue("custpage_txfm_batch_address3");
				var city = REC.getValue("custpage_txfm_batch_city");
				var state = REC.getValue("custpage_txfm_batch_state");
				var zip = REC.getValue("custpage_txfm_batch_zip");
				//var country = REC.getValue("custpage_txfm_batch_country");
				
				//Payer Street Address = COMPANY.ADDRESS.ADDRESS 1 + space + COMPANY.ADDRESS.ADDRESS 2 + space + COMPANY.ADDRESS.ADDRESS 3
            	address = (address1||"") + " " + (address2||"") + " " + (address3||"");
            	address = address.trim();
            	
            	
            	setAndLockField("custrecord_txfm_batch_payer_address", address); //When Payer Type = Acquiom Financial, cannot edit
            	setMandatory("custrecord_txfm_batch_payer_address");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
            	setAndLockField("custrecord_txfm_batch_payer_city", city); //When Payer Type = Acquiom Financial, cannot edit
            	setMandatory("custrecord_txfm_batch_payer_city");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
            	setAndLockField("custrecord_txfm_batch_payer_state", state); //When Payer Type = Acquiom Financial, cannot edit
            	setMandatory("custrecord_txfm_batch_payer_state");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
            	setAndLockField("custrecord_txfm_batch_payer_postal", zip); //When Payer Type = Acquiom Financial, cannot edit
            	setMandatory("custrecord_txfm_batch_payer_postal");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
            	//|Payer Phone|* When Payer Type = Acquiom Financial, set value to (303)222-2080
            	setAndLockField("custrecord_txfm_batch_payer_phone", srsConstants["Default Payer Phone"]); //When Payer Type = Acquiom Financial, cannot edit; 
            	setMandatory("custrecord_txfm_batch_payer_phone");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            }
			if ((parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Buyer"],10))
        			|| (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Seller"],10)))
            {
    			disableField("custrecord_txfm_batch_payer_address"); //When Payer Type = Buyer or Seller, keep as NULL - cannot edit
    			disableField("custrecord_txfm_batch_payer_city"); //When Payer Type = Buyer or Seller, keep as NULL - cannot edit
    			disableField("custrecord_txfm_batch_payer_state"); //When Payer Type = Buyer or Seller, keep as NULL - cannot edit
    			disableField("custrecord_txfm_batch_payer_postal"); //When Payer Type = Buyer or Seller, keep as NULL - cannot edit
    			disableField("custrecord_txfm_batch_payer_phone"); //When Payer Type = Buyer or Seller, keep as NULL - cannot 
            }
			if (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Other"],10))
            {
				unlockField("custrecord_txfm_batch_payer_address"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_address");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
				unlockField("custrecord_txfm_batch_payer_city"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_city");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
				unlockField("custrecord_txfm_batch_payer_state"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_state");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
				unlockField("custrecord_txfm_batch_payer_postal"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_postal");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
            	
				unlockField("custrecord_txfm_batch_payer_phone"); //When Payer Type = Other, edit is allowed.
				setMandatory("custrecord_txfm_batch_payer_phone");	// If Payer Type = {Acquiom Financial, Other}, THEN Fields are Mandatory|
          }
		}
		//function name: autoReloadIframe
		//description: if four necessary elements are present (deals, covered, method, and year filed)
		//			   as well as if the batch is in draft mode,
		//			   	then click button for the user, and trigger auto preview 
		function autoReloadIframe()
		{
			var btn = REC.getField({ fieldId:"custpage_preview"});
			if (parseInt(REC.getValue({ fieldId:"custrecord_txfm_batch_status"}),10) === parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
			{
    			//all 4 elements must be present for before request can be sent
    			if
    			(
    				(!REC.getValue("isinactive")) && 
					(REC.getValue("custrecord_txfm_batch_yr_filed")) &&
					(REC.getValue("custrecord_txfm_batch_report_method")) && 
					(REC.getValue("custrecord_txfm_batch_iscovered")) &&
					(REC.getValue("custrecord_txfm_batch_deals").toString()!=="") //toString check handles empty arrays 
    			)
    			{
    				if (btn)
    				{
    					btn.isDisabled = false;
	    				//only reload these elements if status is equal to draft
	    				//and if elements hold values 
	    				NS.jQuery("#custpage_preview").click();
    				}
    			}
    			else 
    			{
    				if (btn)
    				{
    					btn.isDisabled = true;
    				}
    			}
			}
			else 
			{
				if (btn)
				{
					btn.isDisabled = true;
				}
			}
			
		}
		function pageInit(context) 
		{		
			try
			{
				//console.log("pageInit");
				REC = context.currentRecord; 
				
				var batchstatus = REC.getValue("custrecord_txfm_batch_status");
				if (parseInt(batchstatus,10) === parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
	    		{
					handlePayerEntity();
					handlePayerNameAndTaxID();
					handleAddress();
	    		}
				if (parseInt(REC.getValue({ fieldId:"custrecord_txfm_batch_status"}),10) === parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
				{
					//only reload these elements if status is equal to draft
					autoReloadIframe();
				}
				
				
				
			}
			catch(e)
			{
				console.log(e);
			}
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		function saveRecord(context) 
		{
//			try
//			{
				REC = context.currentRecord; 
				if (myMsg)
				{
					myMsg.hide();
				}
				if (REC.getValue("isinactive"))
				{
					//if record is inactive, allow save
					return true;
				}
				
				var errormsg = tfLibrary.validateTaxForm(context);
				if (errormsg)
				{
					showErrorMessage("Following errors have been found:", errormsg); 
					return false;
				}
				
				var taxyearfiled = REC.getValue("custrecord_txfm_batch_yr_filed");
          		var taxyearfiledText = REC.getText("custrecord_txfm_batch_yr_filed");
    			var reportmethod = REC.getValue("custrecord_txfm_batch_report_method");
    			var taxform = REC.getText("custrecord_txfm_batch_report_method");
    			var iscovered = REC.getValue("custrecord_txfm_batch_iscovered"); 
    			var deals = REC.getValue("custrecord_txfm_batch_deals");  
    			
    			if
    			(
					(REC.getValue("custrecord_txfm_batch_yr_filed")) &&
					(REC.getValue("custrecord_txfm_batch_report_method")) && 
					(REC.getValue("custrecord_txfm_batch_iscovered")) &&
					(REC.getValue("custrecord_txfm_batch_deals").toString()!=="") //toString check handles empty arrays 
    			)
    			{
	        		var dealsInProgress = tfLibrary.getDealsInProgress(taxyearfiled, reportmethod, iscovered, deals, REC.id);
					console.log("dealsInProgress " + dealsInProgress.length);
	        		if (dealsInProgress && dealsInProgress.length>0)
					{
						var i = 0;
						var linkshtml = "";
						for (i=0; i<dealsInProgress.length; i+=1)
						{
							if (linkshtml)
							{
								linkshtml = linkshtml + ", ";
							}
							linkshtml = linkshtml + tfLibrary.getAnchor("customrecord_tax_form_batch", dealsInProgress[i].id,dealsInProgress[i].name);
							
						}
						showErrorMessage("Deal(s) for tax year "+taxyearfiledText+", tax form "+taxform+" included in another batch", "Following existing Tax Form Batches found:  " + linkshtml); 
						return false;
					}
    			}
				
//			}
//			catch(e)
//			{
//				showErrorMessage("Error", e.message); 
//				return false;
//			}
			
		
			return true; 
			
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		function clearFieldValue(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (fld)
				{
					if (fld.type === "checkbox")
					{
						REC.setValue({ fieldId:fieldid 
									  ,value:false
									  ,ignoreFieldChange : true
									}); 
					}
					else if (fld.type ==="multiselect")
					{
						REC.setValue({ fieldId:fieldid 
										,value:null
										,ignoreFieldChange : true
									}); 
					}
					else 
					{
						REC.setValue({ fieldId:fieldid 
									,value:""
									,ignoreFieldChange : true
							}); 
					}
				}
			}
			
		}
		function disableField(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isDisabled = false;
				fld.isMandatory = false;
				clearFieldValue(fieldid);
				fld.isDisabled = true;
			}
		}
		
		function setAndLockField(fieldid, fieldvalue)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isDisabled = false;
					REC.setValue({ fieldId:fieldid 
								,value:fieldvalue
								,ignoreFieldChange : true
						}); 
				fld.isDisabled = true;
			}
		}
		function unlockAndClearField(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isDisabled = false;
				clearFieldValue(fieldid);
			}
		}
		function unlockField(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isDisabled = false;
			}
		}
		function lockField(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isDisabled = true;
			}
		}
		function setMandatory(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isMandatory = true;
			}
		}
		function setNotMandatory(fieldid)
		{
			if (fieldid)
			{
				var fld = REC.getField({ fieldId:fieldid});
				if (!fld)
				{
					return;
				}
				fld.isMandatory = false;
			}
		}
		function fieldChanged(context) 
		{
			
			console.log("fieldChanged " + context.fieldId);
			switch (context.fieldId) 
			{
	        	case "custrecord_txfm_batch_payer_type":
	        	case "custrecord_txfm_batch_payer_entity":
	        		handlePayerEntity();
	        		handlePayerNameAndTaxID();
	        		handleAddress();
	        		break;
	        	case "custrecord_txfm_batch_yr_filed":
	        	case "custrecord_txfm_batch_report_method":
	        	case "custrecord_txfm_batch_deals":
	        	case "custrecord_txfm_batch_iscovered":
	        	case "isinactive":
	        		//all 4 elements must be present for before request can be sent
	        		autoReloadIframe();
					break;
	        		
			}
		}
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		
		return {
			pageInit: 			pageInit,
			fieldChanged:		fieldChanged,
			saveRecord:			saveRecord
		};
});

