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

define(["N/https" ,"N/runtime" ,'N/currentRecord' ,'N/ui/dialog' ,'N/ui/message' ,'N/url', "N/search"
        ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
        ],
	function(https ,runtime ,currentRecord ,dialog ,msg ,url, search
			,srsConstants
	) 
	{
		var scriptName = "SRS_SL_TaxFormBatch_CL.";
		var _func_interval = null;
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		function pageInit(context)
		{ 
			
			var recreateBtnContainer = NS.jQuery("#tr_custpage_button_recreate");
			if (recreateBtnContainer) { 
				var currentStyle = recreateBtnContainer.css('cssText');
				var updatedStyle = currentStyle + "margin-left:100px !important;";
				recreateBtnContainer.css('cssText', updatedStyle);
			}

			var REC = context.currentRecord;         
			console.log("pageinit");
			var queryString = window.location.search;
			var urlParams = new URLSearchParams(queryString);
			var action = window.location.pathname + "?" + urlParams.toString(); 
			
			//this action fixes problem of submitting the form on the source window
			//and preserves parameters in the URL, so that form could be refreshed
			if (document.getElementById("main_form"))
			{
				document.getElementById("main_form").action = action; 
			}
			var isinactive= REC.getValue("custpage_filter_isinactive");
			if (isinactive) {
				//disable all checkboxes that start with custpage_select_checkbox
				NS.jQuery("input[id^=custpage_select_checkbox_]").prop( "disabled", true );

            	stateChangeProcessDetailButton('disabled' ,"revise");
            	stateChangeProcessDetailButton('disabled' ,"correct");
            	stateChangeProcessDetailButton('disabled' ,"generate");
            	stateChangeProcessDetailButton('disabled' ,"recreate");
                var keepMarkAllShowing = evaluateRecreateButton(context);
				
            	if (!keepMarkAllShowing) {
    				//1. remove button enabled class
    				NS.jQuery("#tdbody_custpage_sublist_batch_detailunmarkall").removeClass("tabBnt");
    				
    				//2. add disabled style to same table row; the one that contains sublist button 
    				NS.jQuery("#tdbody_custpage_sublist_batch_detailunmarkall").addClass("pgBntGDis");
    				
    				//3. disable mark all 
    				NS.jQuery("#custpage_sublist_batch_detailunmarkall").prop( "disabled", true );
    				
    				//1. remove button enabled class
    				NS.jQuery("#tdbody_custpage_sublist_batch_detailmarkall").removeClass("tabBnt");
    				
    				//2. add disabled style to same table row; the one that contains sublist button 
    				NS.jQuery("#tdbody_custpage_sublist_batch_detailmarkall").addClass("pgBntGDis");
    				
    				//3. disable Unmark all 
    				NS.jQuery("#custpage_sublist_batch_detailmarkall").prop( "disabled", true );
            		
            	} 
            }
			else
			    renderProcessDetailButtons(context ,REC);
			
			var buttonMarkAll = document.getElementById("custpage_sublist_batch_detailmarkall");
			if (buttonMarkAll) { buttonMarkAll.addEventListener("click" ,buttonMarkAllClick ,true); }
			
			var buttonUnMarkAll = document.getElementById("custpage_sublist_batch_detailunmarkall");
			if (buttonUnMarkAll) { buttonUnMarkAll.addEventListener("click" ,buttonUnMarkAllClick ,true); }
			
		}
		
		
		//===============================================================================================================================================================
		// Are there lines available where the recreate button can be used
		//===============================================================================================================================================================		
		function evaluateRecreateButton() {
			
			var inactiveList = {};
            var rec = currentRecord.get();
            var count = rec.getLineCount({ sublistId:"custpage_sublist_batch_detail" });
            
            for (var ix = 0; ix < count; ix++) {
                isInactive = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_isinactive" ,line:ix });
    			if (isInactive == "Yes") { 
                    deal         = getInternalId(rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_custrecord_txfm_detail_deal"        ,line:ix }) ,ix);
                    shareholder  = getInternalId(rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_custrecord_txfm_detail_shareholder" ,line:ix }) ,ix);
                    propertyName = deal + "/" + shareholder;
    				inactiveList[propertyName] = ix + 1; 
    			}
            }				
            
            if (JSON.stringify(inactiveList) == "{}") { return false; }
            
            for (var ix = 0; ix < count; ix++) {
                isInactive = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_isinactive" ,line:ix });
    			if (isInactive == "No") { 
                    deal         = getInternalId(rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_custrecord_txfm_detail_deal"        ,line:ix }) ,ix);
                    shareholder  = getInternalId(rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_custrecord_txfm_detail_shareholder" ,line:ix }) ,ix);
                    propertyName = deal + "/" + shareholder;
    				if (inactiveList[propertyName]) { delete inactiveList[propertyName]; } 
    			}
            }

            if (JSON.stringify(inactiveList) == "{}") { return false; }

        	stateChangeProcessDetailButton('available' ,"recreate");
            
			for (propertyName in inactiveList) {
				var checkboxId = "#custpage_select_checkbox_" + inactiveList[propertyName];
				NS.jQuery(checkboxId).prop( "disabled", false );
			}
			
			return true;
		}

		
		//===============================================================================================================================================================		
		//===============================================================================================================================================================		
		function getInternalId(anchor ,ix) {
			var array1 = anchor.split("id=");
			var array2 = array1[1].split("&");
			return array2[0];
		}
		
		
		//===============================================================================================================================================================
		//===============================================================================================================================================================
		function buttonUnMarkAllClick(){
			detailArray = [];
			dealArray = [];
			shareholderArray = [];
			allDetailRecordsRequested = false;
			if (NS.jQuery("#custpage_button_revise").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"revise"); }
			if (NS.jQuery("#custpage_button_recreate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"recreate"); }
			if (NS.jQuery("#custpage_button_correct").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"correct"); }
            if (NS.jQuery("#custpage_button_generate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"generate"); }
		}
		
		
		//===============================================================================================================================================================
		//===============================================================================================================================================================
		function buttonMarkAllClick(){
			setTimeout(function(){
                                  detailArray = [];
                                  dealArray = [];
								  shareholderArray = [];
								  allDetailRecordsRequested = true;
                                  var rec = currentRecord.get();
                                  var count = rec.getLineCount({ sublistId:"custpage_sublist_batch_detail" });
                                  for (var ix = 0; ix < count; ix++) {
                                      selected = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_select_checkbox_" ,line:ix });
                                      if (selected) {
                                          var anchor = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_internalid" ,line:ix });
                                          var splitResult = anchor.split(">");
                                          var internalId = splitResult[1].split("<")[0];
                                          detailArray.push(internalId);
                                      }
                                  }				
			                      if (NS.jQuery("#custpage_button_revise").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"revise"); }
			                      if (NS.jQuery("#custpage_button_recreate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"recreate"); }
			                      if (NS.jQuery("#custpage_button_correct").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"correct"); }
			                      if (NS.jQuery("#custpage_button_generate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"generate"); }
			                     }, 600);
		}
		
		
		//===============================================================================================================================================================
		//===============================================================================================================================================================
		function renderProcessDetailButtons(context ,rec){ // 
			var objTaxFormBatchString   = rec.getValue("custpage_object_tax_form_batch");
			if (!objTaxFormBatchString) { return; }
			var objTaxFormBatch         = JSON.stringify(objTaxFormBatchString);
			var taxFormBatchStatus      = objTaxFormBatch["custrecord_txfm_batch_status"];
			
			var recreateAvailable = 'disabled';
			var reviseAvailable   = 'available';
			var correctAvailable  = 'available';
			
			var objSublist = rec.getSublist({				sublistId: 'custpage_sublist_batch_detail'				});
			
			var count = rec.getLineCount({ sublistId:"custpage_sublist_batch_detail" });
			
			if (count == 0) {
				reviseAvailable  = 'disabled';
				correctAvailable = 'disabled';
			}
			
			var status;
			var formVersion;
		    for (var ix = 0; ix < count; ix++) {
				status       = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_custrecord_txfm_detail_status"  ,line:ix });
				formVersion  = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_custrecord_txfm_detail_version" ,line:ix });
				
				if (status == 'Draft' || status == 'Generated' || status == 'Delivered' ) {
					if (formVersion == 'Original' || formVersion == 'Revised') {
						correctAvailable = 'disabled';
					}
					else 
					if (formVersion == 'Corrected' ) {
						reviseAvailable  = 'disabled';
					}
					else {
						reviseAvailable  = 'disabled';
						correctAvailable = 'disabled';
					}
				}
				else
				if (status == 'Filed') {
					reviseAvailable  = 'disabled';
				}
				else {
					reviseAvailable  = 'disabled';
					correctAvailable = 'disabled';
				}
				
		    }
		    
			var taxFormBatchStatus_Submitted               = "2";
			var taxFormBatchStatus_FiledWithIRS            = "4";
			var taxFormBatchStatus_CorrectionPending       = "5";
			var objTaxFormBatch                            = JSON.parse(rec.getValue("custpage_object_tax_form_batch"));
			var taxFormBatchStatus                         = objTaxFormBatch["custrecord_txfm_batch_status"];
			
     	    var obj_TFB_Status_Fields                      = search.lookupFields({type:"customrecord_txfm_batch_statuses" ,id:taxFormBatchStatus   
                                                                              ,columns:["custrecord_detail_level_buttons" ]});

        	var objDetailLevelButtons = JSON.parse(obj_TFB_Status_Fields["custrecord_detail_level_buttons"]);
			
			if (!buttonIsAvailable("recreate" ,objDetailLevelButtons))   { recreateAvailable = 'disabled'; }
			if (!buttonIsAvailable("revise"   ,objDetailLevelButtons))   { reviseAvailable   = 'disabled'; }
			if (!buttonIsAvailable("correct"  ,objDetailLevelButtons))   { correctAvailable  = 'disabled'; }
			if (!buttonIsAvailable("generate" ,objDetailLevelButtons))   { generateAvailable = 'disabled'; }
			
			
			if (objTaxFormBatch["isinactive"]) { 
				recreateAvailable  = 'disabled';
				reviseAvailable    = 'disabled';
				correctAvailable   = 'disabled';
			}
			
			var taxFormDetailStatus_Draft = 1;
			var generateAvailable    = "disabled";
			var filterDetailStatus   = rec.getValue("custpage_filter_custrecord_txfm_detail_status");
			if (filterDetailStatus == taxFormDetailStatus_Draft) { generateAvailable = "available"; }
		    
        	stateChangeProcessDetailButton(recreateAvailable ,"recreate");
        	stateChangeProcessDetailButton(reviseAvailable   ,"revise");
        	stateChangeProcessDetailButton(correctAvailable  ,"correct");
        	stateChangeProcessDetailButton(generateAvailable ,"generate");
        	
		}
		
		
		//===============================================================================================================================================================
		//===============================================================================================================================================================
		function buttonIsAvailable(buttonName ,objDetailLevelButtons) {
			var isAvailable = false;
			if (objDetailLevelButtons[buttonName]) {
				if (objDetailLevelButtons[buttonName]["available"]) { isAvailable = true; }
			}
			return isAvailable;
		}
		
		
		var detailArray = [];
		var dealArray = [];
		var shareholderArray = [];
		var allDetailRecordsRequested = false;
		//===============================================================================================================================================================
		//===============================================================================================================================================================
		function fieldChanged(context)
		{
			
			var fieldId = context.fieldId;
	        
	        // ATP-2036
			var rec = context.currentRecord;
			var shareholderid = "";
			var dealid = "";
			switch (context.fieldId) {
			case 'custpage_filter_isinactive': 
				if (rec.getValue({ fieldId:fieldId}) ) {
					rec.setValue({ fieldId:"custpage_filter_correct" ,value:false ,ignoreFieldChange:true });
					rec.setValue({ fieldId:"custpage_filter_revise"  ,value:false ,ignoreFieldChange:true });
				}
				break;
			case 'custpage_filter_revise': 
				if (rec.getValue({ fieldId:fieldId})) { 
					if (rec.getValue({ fieldId:fieldId}) == true) { rec.setValue({ fieldId:"custpage_filter_correct" ,value:false ,ignoreFieldChange:true }) }  
				}
				window.onbeforeunload = null;
				NS.jQuery("#submitter").trigger("click");
				break;
			case 'custpage_filter_correct': 
				if (rec.getValue({ fieldId:fieldId})) { 
					if (rec.getValue({ fieldId:fieldId}) == true) { rec.setValue({ fieldId:"custpage_filter_revise" ,value:false ,ignoreFieldChange:true }) }  
				}
				window.onbeforeunload = null;
				NS.jQuery("#submitter").trigger("click");
				break;
			case 'custpage_select_checkbox_': 
				var fieldId = context.fieldId;
				allDetailRecordsRequested = false;
				detailArray = [];
				dealArray = [];
				shareholderArray = [];
				var count = context.currentRecord.getLineCount({ sublistId:"custpage_sublist_batch_detail" });
			    for (var ix = 0; ix < count; ix++) {
					selected = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_select_checkbox_" ,line:ix });
					if (selected) {
						var anchor = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_internalid" ,line:ix });
						var splitResult = anchor.split(">");
						var internalId = splitResult[1].split("<")[0];
						detailArray.push(internalId);
						
						dealid = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_hidden_custrecord_txfm_detail_deal" ,line:ix });
						if (dealArray.indexOf(dealid)===-1)
						{
							//deals will be duplicate
							dealArray.push(dealid);
						}
						shareholderid = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_hidden_custrecord_txfm_detail_shareholder" ,line:ix });
						//shareholders are unique 
						shareholderArray.push(shareholderid);
						
					}
			    }				
				
				if (detailArray.length > 0) {
					if (NS.jQuery("#custpage_button_revise").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"revise"); }
					if (NS.jQuery("#custpage_button_recreate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"recreate"); }
					if (NS.jQuery("#custpage_button_correct").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"correct"); }
					if (NS.jQuery("#custpage_button_generate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('clickable' ,"generate"); }
				}
				else {
					if (NS.jQuery("#custpage_button_revise").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"revise"); }
					if (NS.jQuery("#custpage_button_recreate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"recreate"); }
					if (NS.jQuery("#custpage_button_correct").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"correct"); }
					if (NS.jQuery("#custpage_button_generate").css( "background-color" ).toString() != "rgb(115, 115, 115)") { stateChangeProcessDetailButton('available' ,"generate"); }
				}
				
				break;
			} // switch (context.fieldId)
	        // end ATP-2036
			

			
			var fields_to_render = srsConstants["Tax Form Batch Detail Columns"];
			
			var i = 0;
		    try 
		    {
		    	for (i = 0; i < fields_to_render.length; i+=1) 
        		{
        			if (fields_to_render[i].isAvailableFilter)
        			{
        				//hide processing notes when status is submitted
        				if (fieldId === "custpage_filter_"+fields_to_render[i].id)
        				{
        					window.onbeforeunload = null;
        					NS.jQuery("#submitter").trigger("click");
        					break;
        				}
        			}
        		}
            }
	        catch (e)
	        {
	        	log.error("PaymentFileCreation_SL_CL field changed error ", e.toString());
	        	//console.log(e);
	        }
		}
		
		// ATP-2036 ========================================================
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function stateChangeProcessDetailButton(state ,buttonName) {
			var buttonId          = "#custpage_button_" + buttonName;
			var buttonIdSecondary = "#secondarycustpage_button_" + buttonName;
			switch (state) {
			case 'disabled': 
				NS.jQuery(buttonId).prop( "disabled", true );
				NS.jQuery(buttonId).css( { "cssText":"background-color:#737373 !important; text-decoration:line-through;" } );
				NS.jQuery(buttonIdSecondary).prop( "disabled", true );
				NS.jQuery(buttonIdSecondary).css( { "cssText":"background-color:#737373 !important; text-decoration:line-through;" } );
				break;
			case 'available': 
				NS.jQuery(buttonId).prop( "disabled", true );
				NS.jQuery(buttonId).css( { "cssText":"background-color:#ffffb3 !important; text-decoration:none;" } );
				NS.jQuery(buttonIdSecondary).prop( "disabled", true );
				NS.jQuery(buttonIdSecondary).css( { "cssText":"background-color:#ffffb3 !important; text-decoration:none;" } );
				break;
			case 'clickable': 
				NS.jQuery(buttonId).prop( "disabled", false );
				NS.jQuery(buttonId).css( { "cssText":"background-color:#00cc44 !important; text-decoration:none;" } );
				NS.jQuery(buttonIdSecondary).prop( "disabled", false );
				NS.jQuery(buttonIdSecondary).css( { "cssText":"background-color:#00cc44 !important; text-decoration:none;" } );
				break;
			} // switch (context.fieldId)
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function alertAlex(text) {
			if (runtime.getCurrentUser().id == 1047697) { alert(text); }
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function getSelectedCount(rec) {
			var countSelected = 0;
			var count = rec.getLineCount({ sublistId:"custpage_sublist_batch_detail" });
		    for (var ix = 0; ix < count; ix++) {
				selected = rec.getSublistValue({ sublistId:"custpage_sublist_batch_detail" ,fieldId:"custpage_select_checkbox_" ,line:ix });
				if (selected) { countSelected = countSelected + 1; }
		    }
		    return countSelected;
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function processTaxBatchDetail(action) {
			if (action == "correct") { correctPopup(); }			
			else                     { confirmPopup(action); }
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function confirmPopup(action){
            var rec = currentRecord.get();
            var buttons = [];
            buttons.push({ label: 'Proceed',value: action });
            buttons.push({ label: 'Cancel' ,value: "0" });            
			var options      = { title: 'Confirm your request' ,message:'You have selected {0} forms for "{1}", please click the "Proceed" button to submit this request.'.replace("{0}",getSelectedCount(rec)).replace("{1}",action) ,buttons:buttons };
			dialog.create(options).then(actionConfirmed).catch();
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function correctPopup(){
            var rec = currentRecord.get();
            var buttons = [];
            var popupOptions = rec.getValue({"fieldId":"custpage_html_correct_popup_options" } );
            var objPopupOptions = JSON.parse(popupOptions);
            
            for (ix in objPopupOptions) {
            	buttons.push({ label:objPopupOptions[ix].buttonText ,value:objPopupOptions[ix].buttonValue });
            }
            
            buttons.push({ label: 'Cancel',value: "0" });
            
			var options      = { title: 'Select Correction Type' ,message:'You have selected {0} forms for Correction, please click on a "Correction Type" button to submit this request.'.replace("{0}",getSelectedCount(rec)) ,buttons:buttons };
			dialog.create(options).then(correctConfirmed).catch();
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function actionConfirmed(confirmResponse) {
			if (confirmResponse != "0") { submitRequestToMapReduce(confirmResponse); }
		}
		
		
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function correctConfirmed(correctType){
			if (correctType != "0") { submitRequestToMapReduce("correct" ,correctType); }
		}
		
		function isStatusSubmitted(taxformBatchID)
		{
			var retValue = false;
			if (taxformBatchID)
			{
				var searchResult = search.lookupFields({						
					type: "customrecord_tax_form_batch",
					id:taxformBatchID,
					columns: ["custrecord_txfm_batch_status"]
				});//return object with various fields from applied transaction
				var taxbatchStatus = (searchResult.custrecord_txfm_batch_status && searchResult.custrecord_txfm_batch_status[0] && searchResult.custrecord_txfm_batch_status[0].value) || "";
				if (parseInt(taxbatchStatus,10) === parseInt(srsConstants["Tax Form Batch Status"]["Submitted"],10))
				{
					retValue = true;
				}
			}
			return retValue;
		}
		//=========================================================================================================================================================
		//=========================================================================================================================================================
		function submitRequestToMapReduce(action ,correctType) {
			stateChangeProcessDetailButton("disabled" ,"recreate");
			stateChangeProcessDetailButton("disabled" ,"revise");
			stateChangeProcessDetailButton("disabled" ,"correct");
			stateChangeProcessDetailButton("disabled" ,"generate");
			
            var rec = currentRecord.get();
			
			var detailList = [];
			var id;
			var selected;

			var objTaxFormBatch = JSON.parse(rec.getValue("custpage_object_tax_form_batch"));
		
			var objAction                   = {};
			objAction["action"]             = action;
			objAction["detailArray"]        = detailArray;
			objAction["dealArray"]        = dealArray;
			objAction["shareholderArray"]        = shareholderArray;
			objAction["allDetailRecordsRequested"] = allDetailRecordsRequested;
			objAction["taxFormBatchId"]     = objTaxFormBatch["id"];
			objAction["taxFormBatchStatus"] = objTaxFormBatch["custrecord_txfm_batch_status"];
			if (correctType) { objAction["correctType"] = correctType }
			
    		var objParms = {};
    		objParms["action"]        = "mapReduceUtilityFunctionsStart";
    		objParms["objRequest"]    = "objRequestInBody";
    		objParms["functionName"]  = "taxFormBatchDetailRequest";
    		objParms["scriptName"]    = scriptName;
    		objParms["recordType"]    = "customrecord_tax_form_batch_detail";
    					
    		var suitletURL         = url.resolveScript({ scriptId:'customscript_utility_sl' ,deploymentId:'customdeploy_utility_sl' ,params:objParms ,returnExternalUrl:false});

    		var objHeader          = {};
    		var body               = JSON.stringify(objAction);
    		var response           = https.post({ url:suitletURL ,headers:objHeader ,body:body });				

    		var body = response.body;
    		var objResponse = JSON.parse(response.body);

			NS.jQuery("#submittedDiv").show(); 
				try { var top = NS.jQuery("#submitter").offset().top; top = top - 100;
			NS.jQuery('html, body').animate({ scrollTop:top}, 2000);
				} catch(e) {}
        	intervalTaskChecker = setInterval(taskChecker, 6000);

			var i = 0;
        	function taskChecker() {
	    		var objParms = {};
	    		objParms["action"]     = "mapReduceTaskStatus";
	    		objParms["taskID"]     = objResponse.mapReduceTaskId;
	    		var suitletURL         = url.resolveScript({ scriptId:'customscript_utility_sl' ,deploymentId:'customdeploy_utility_sl' ,params:objParms ,returnExternalUrl:false});

	    		var objHeader          = {};
	    		var body               = JSON.stringify({});
	    		var response           = https.post({ url:suitletURL ,headers:objHeader ,body:body });	
	    		i = i + 1;
	    		if (i > 120) { 
	    			clearInterval(intervalTaskChecker); 
	    			//NS.jQuery("#submittedMsg").html("Your request has finished processing with status: " + status); 
	    		}
	    		var statusIsSubmitted = isStatusSubmitted(objAction["taxFormBatchId"]);
	    		if ((response.body == "COMPLETE" || response.body == "FAILED" ) && statusIsSubmitted) { 
	    			clearInterval(intervalTaskChecker); 
	    			NS.jQuery("#submittedTitle").html("Request Processing FINISHED"); 
	    			NS.jQuery("#submittedMsg").html("Your request has finished processing with status: " + response.body); 
	    			//dialog.alert({ title:'Request Processing Ended' ,message:"Your request has finished processing with status: " + response.body }).then().catch();
	    		}
        	}
    		
//			window.onbeforeunload = null;
//			NS.jQuery("#submitter").trigger("click");
		}

		// end ATP-2036 ========================================================


		//isJSONString returns true if JSON is successfully parsed
		//otherwise it is assumed sting is not in JSON format
		function isJSONString (str) 
		{
			var retvalue = false; 
			try
			{
			   var json = JSON.parse(str);
			   retvalue = true; 
			}
			catch(e)
			{
			   //invalid json 
			}
			return retvalue; 
		}
		//expects that saved search export to have been alredy requested
		//keeps checking for task status = completed
		//expects parameters action, taskId, fileId, and searchId
		//downloads exported file 
		function downloadFile(_url)
		{
			var responseObj = null; 
			var dataObj = null;
			
			try
			{
				//since we are in a setInterval mode,
				//we are not using get promise. 
				responseObj = https.get({url: _url}); 
				if (isJSONString(responseObj && responseObj.body))
				{
					dataObj = JSON.parse(responseObj.body);
					//since we are passing taskId, suitelet knows that 
					//we want to check status of the task. 
					//fielId and searchId are just carried along to be used 
					//in the next step
					if (dataObj.status === "COMPLETE")
			     	{
						//saved search has exported to file cabinet. 
						//now we can request contents of that file. 
						var params = new URLSearchParams(_url);
						params.delete("taskId");	//delete taskId from URL
						params.set("action", "downloadFile");
						//create and simulate click of a button with 
						//a new link that has fileId, searchId, but does not have taskId
						var link = document.createElement("a");
						_url = decodeURIComponent(params.toString());
						link.href = _url;
						document.body.appendChild(link);
						window.onbeforeunload = null;
						link.click();   
						
						//now that we requested download file via click
						//we can submit request to delete temporary searchId and 
						//temporary fileId that were created 
						params.set("action", "deleteTempfiles");
						_url = decodeURIComponent(params.toString());
						console.log("deleting temp files", _url);
						https.get({url: _url});
						
						//we can clear interval as work has been completed 
						clearInterval(_func_interval);
						//clear button shadow and restore classes 
						
						//1. add back removed tr style
						NS.jQuery("#tr_custpage_downloadss" ).addClass("tabBnt");
						
						//2. remove disabled style 
						NS.jQuery("#tr_custpage_downloadss").removeClass("pgBntGDis");
						
						//3. enable button 
						NS.jQuery("#custpage_downloadss").prop( "disabled", false);
						
						//4. remove border style to table row 
						NS.jQuery("#tr_custpage_downloadss" ).removeClass("tabBnt_sel");
						
						//5. clear box shadow
						NS.jQuery("#tr_custpage_downloadss").css("box-shadow", "");
						
						
			     	}
				}
				
			}
			catch (e)
			{
				console.log(e);
			}
			
		}
		//exportSS button - 
		//This is a function that will export Saved Search if requested
		//it adds Export Button shadows to indicate process has started
		//and will turn off shadows after process is completed. 
		//there are 4 stages in this request
		//#1 is requestBatchPreviewSavedSearchExport requests asynchronous export of 
		//	saved search to file cabinet	
		//#2 is checkTaskStatus
		//	lets us know if requested export has completed
		//  it will keep checking if status is COMPLETED
		//  every 'numberOfMillisecondsBeforeNextCheck' to find out 
		//	if saved search export request has been completed 
		//#3 is downloadFile
		//		will download file up to 10 MB in size
		//#4 is deleteTempfiles
		//	will remove temporary saved search and temporary file 
		function exportSS(action)
		{ 
			//before export disable button and show border via 5 steps
			//1. remove default button style on table row that contains sublist button
			NS.jQuery("#tr_custpage_downloadss").removeClass("tabBnt");
			
			//2. add disabled style to same table row; the one that contains sublist button 
			NS.jQuery("#tr_custpage_downloadss").addClass("pgBntGDis");
			
			//3. disable button 
			NS.jQuery("#custpage_downloadss").prop( "disabled", true );
			
			//4. add button selected style to table row 
			NS.jQuery("#tr_custpage_downloadss" ).addClass("tabBnt_sel");
			
			//5. add border style to table row 
			NS.jQuery("#tr_custpage_downloadss").css("box-shadow", "0 0 2px 2px rgba(24,123,242,.75)");
			
			var numberOfMillisecondsBeforeNextCheck = 2000;
			var _url = window.location.href;    
			var params = new URLSearchParams(_url);
			if (action)
			{
				params.set("action", action);
				_url = decodeURIComponent(params.toString());
			}
			console.log("exportSS: " + _url);
			https.get.promise({
				url: _url
			}).then(function(data) {
				var dataObj = JSON.parse(data.body);	
				//we anticipate back taskId, fileId, and searchId. 
				//extract that information and keep checking 
				//if taskId status has 'COMPLETED' and if 
				//file can be downloaded. 
				params.set("action", "checkTaskStatus");	//delete taskId from URL
				_url = decodeURIComponent(params.toString());
				_url += "&taskId="+dataObj.taskId+"&fileId="+dataObj.fileId+"&searchId="+dataObj.searchId;
				_func_interval = setInterval( function() { downloadFile(_url); }, numberOfMillisecondsBeforeNextCheck);
				
			}).catch(function(data) {
				console.log("Failed:");
				console.log(data);
			});
			
			
			
		}
		//openinwindow since this suitelet was intended to be in a sublist
		//we can open up the URL into new window so it's easier to work with 
		function openinwindow()
		{
			var _url = window.location.href;    
			var params = new URLSearchParams(_url);
			params.delete("custparam_hidenavbar");
			params.delete("ifrmcntnr");
			_url = decodeURIComponent(params.toString());
			window.open(_url, "_new");
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		
		return {
			pageInit: 			pageInit,
			fieldChanged: fieldChanged,
			exportSS: exportSS,
			openinwindow: openinwindow,
			processTaxBatchDetail: processTaxBatchDetail   // ATP-2036
		};
});

