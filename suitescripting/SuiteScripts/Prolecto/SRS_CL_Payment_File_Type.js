//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
* @NModuleScope Public
*/

define(['N/error', 'N/runtime', 'N/search', "N/ui/message"
	  ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	  ,'/.bundle/132118/PRI_AS_Engine'
	  ,"SuiteScripts/Pristine/libraries/PaymentFileCreation_Library.js"
	   ],
	function(error, runtime, search, message
			,srsConstants
			,appSettings
			,pftLibrary
			 ) {
	
		
		var scriptName = "SRS_CL_Payment_File_Type.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		function showMessage(msgTitle, msgText, msgType, duration) 
		{
			if (!duration)
			{
				duration = 0;
			}
			var myMsg = message.create({ title:msgTitle ,message: msgText ,type: msgType});
			myMsg.show({ duration:duration });
            window.scrollTo(0, 0);
		}
		function signatureNeeded(context)
		{
			var retValue = false;
			var fileformat = context.currentRecord.getValue("custrecord_pft_file_format");
			if (parseInt(fileformat,10) === parseInt(srsConstants["Payment File Type"]["Check"],10))
			{
				var objSignature = JSON.parse(appSettings.readAppSetting("Payment File Creation", "PDF Check Signature Bank Map"))
				var paymentbank = context.currentRecord.getValue("custrecord_pft_payment_bank");
				//console.log("payment bank id " + paymentbank);
				if (!(objSignature[runtime.accountId]
					&& objSignature[runtime.accountId][paymentbank]
					&& objSignature[runtime.accountId][paymentbank]["Signature File"]))
				{
					retValue = true; 
				}
			}
			return retValue;
		}
		function getAppSettingID(app, name)
		{
			var result = search.create({
				   type: "customrecord_pri_app_setting",
				   filters:
				   [
				      ["name","is",name],
				      "AND", 
				      ["custrecord_pri_as_app.name","is",app]
				   ]
				}).run().getRange(0,1);
			if (result && result.length>0)
			{
				return result[0].id;
			}
			return null;
		
		}
		function fieldChanged(context) 
		{
			var fieldId = context.fieldId;
			try
			{
				switch (fieldId) 
		        {
		            case 'custrecord_pft_file_format':
						var crefield = context.currentRecord.getField({ fieldId:'custrecord_pft_cre_profile' });
						var fileformat = context.currentRecord.getValue("custrecord_pft_file_format"); 
						
						var objPFF_Fields = search.lookupFields({type:"customrecord_payment_file_format" ,id:fileformat
				            ,columns:["custrecord_pff_cre_profile_required"]});
						
						if (objPFF_Fields.custrecord_pff_cre_profile_required)
						{
							crefield.isMandatory = true;
						}
						else 
						{
							context.currentRecord.setValue("custrecord_pft_cre_profile", "");
							crefield.isMandatory = false;
						}
						
						if (signatureNeeded(context))
						{
							var appsettingid = getAppSettingID("Payment File Creation", "PDF Check Signature Bank Map");
							var APPLink = pftLibrary.getAnchor("customrecord_pri_app_setting", appsettingid, "Payment File Creation-->PDF Check Signature Bank Map");
							var mesgText = "Signature File Internal ID not found in app setting: \""+APPLink+"\" for payment bank " + context.currentRecord.getText("custrecord_pft_payment_bank")+"."; 
	    					showMessage("Signature File Not Defined ", mesgText, message.Type.ERROR ); 
	    				}
						
						break;
		            case "custrecord_pft_payment_bank":
		            	if (signatureNeeded(context))
						{
							var appsettingid = getAppSettingID("Payment File Creation", "PDF Check Signature Bank Map");
							var APPLink = pftLibrary.getAnchor("customrecord_pri_app_setting", appsettingid, "Payment File Creation-->PDF Check Signature Bank Map");
							var mesgText = "Signature File Internal ID not found in app setting: \""+APPLink+"\" for payment bank " + context.currentRecord.getText("custrecord_pft_payment_bank")+"."; 
	    					showMessage("Signature File Not Defined ", mesgText, message.Type.ERROR ); 
	    				}
		            	break;
		            case "custrecord_pft_account_options":
						var accountoptions =  context.currentRecord.getValue("custrecord_pft_account_options");
						var omnibusname = context.currentRecord.getField({ fieldId:'custrecord_pft_omnibus_company_name' });
						var omnibusid = context.currentRecord.getField({ fieldId:'custrecord_pft_omnibus_company_id' });
						var omnibusimmediateorigin = context.currentRecord.getField({ fieldId:'custrecord_pft_omnibus_immediate_origin' });
						
						if (parseInt(accountoptions, 10) === parseInt(srsConstants["PFT Account Options"]["Uses Omnibus Account"],10))
						{
							omnibusname.isDisabled = false;
							omnibusid.isDisabled = false;
							omnibusimmediateorigin.isDisabled = false;
						}
						else 
						{
							context.currentRecord.setValue("custrecord_pft_omnibus_company_name", "");
							context.currentRecord.setValue("custrecord_pft_omnibus_company_id", "");
							context.currentRecord.setValue("custrecord_pft_omnibus_immediate_origin", "");
							omnibusname.isDisabled = true;
							omnibusid.isDisabled = true;
							omnibusimmediateorigin.isDisabled = true;
						}
						break;
		        		
				}
			}
			catch(e)
			{
				log.error ("Error occurred: ", e.toString());
				console.log("Error: " + e.toString());
			}
			
			
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	
		return {
			//pageInit: pageInit,
			 fieldChanged: fieldChanged,
			// postSourcing: postSourcing,
			// sublistChanged: sublistChanged,
			// lineInit: lineInit,
			// validateField: validateField,
			// validateLine: validateLine,
			// validateInsert: validateInsert,
			// validateDelete: validateDelete,
			//saveRecord: saveRecord
			};
});

