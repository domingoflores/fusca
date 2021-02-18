//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/record' ,'N/url' ,'N/runtime', 'N/search' ,'N/ui/serverWidget'
	],   
	function (record ,url ,runtime, search ,serverWidget 
		  ) {
 
		var scriptName = "PFC_Sandbox_SwapApprover_Owner_SL.js";
		
 //==========================================================================================================================================================
 //==========================================================================================================================================================
 //==========================================================================================================================================================
 //==========================================================================================================================================================
   function swap(rcdId) {

	    try {
			var payFileCreationRecord = record.load({ type:'customrecord_payment_file' ,id:rcdId });
	    }
	    catch(e) {
	    	return "Error: " + e.message;
	    }
		
		if (!payFileCreationRecord) { return "record not found"; }
		
		var owner    = payFileCreationRecord.getValue("owner");
		var approver = payFileCreationRecord.getValue("custrecord_pay_file_final_approver");
		
		payFileCreationRecord.setValue("custrecord_pay_file_final_approver" , owner);
		payFileCreationRecord.setValue("owner" , approver);
		payFileCreationRecord.setValue("custrecord_pay_file_approved_by" , null);
		payFileCreationRecord.setValue("custrecord_pay_file_approved_date" , null);
		
		try {
			payFileCreationRecord.save();
			return "Record has been changed"
		}
		catch(e) {
			return "Error: " + e.message;
		}
	   
   }
		
		
   function onRequest(context) {
	    var funcName = scriptName + "--->onRequest";
	    //============================================== 
	    if (runtime.accountId == '772390') { throw "Error: This suitelet is for sandbox use only"; }
	    
		var form = serverWidget.createForm({ title: 'PFC Swap Approver/Owner' });
		//form.clientScriptModulePath = "SuiteScripts/Prolecto/Alex_Test_Client.js";

		var submitButton = form.addSubmitButton({ label:'Submit' });

		form.addField({ id: 'custpage_pfc' ,type:serverWidget.FieldType.TEXT ,label:'PFC Record Id ' });			
		
		
		if (context.request.method === 'GET') { 
		}
		else {
			var message = "failed";
			
			var rcdId = context.request.parameters.custpage_pfc;
			
			message = swap(rcdId);
			
			//message = JSON.stringify(context.request.parameters) 
			
	        var result = form.addField({ id: 'custpage_result' ,type:serverWidget.FieldType.INLINEHTML ,label:'RESULT ' });
	        result.defaultValue = "<span style='font-size:20px'>{0}<span>".replace("{0}" ,message);
			
		}
		
		
		
		
		
		context.response.writePage(form);
	    return;//==================================================================================================================
	    
	    


  } // onRequest function
   


    
  return {
   onRequest : onRequest
  };
});