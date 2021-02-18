//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
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

define(["N/search","N/record","N/runtime","N/url", "N/https", "N/currentRecord", "N/ui/dialog", "N/ui/message"
        ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
        ,"/SuiteScripts/Pristine/libraries/TaxForm_Library.js"
        ],
	function(search,record,runtime,url,https,currentRecord, dialog, message
	,srsConstants		
	,tfLibrary
	) 
	{
		var scriptName = "SRS_CL_TaxFormBatchButtonFunctions.";
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC = currentRecord.get();
		function pageInit()
		{
			console.log("pageinit")
		}
		var _func_interval = null;
		var mr_status_text = "";
		var mr_status = "";
		var mr_name = "";
		var mr_scriptid = "";
		var mr_prcent_complete = "";
		var mr_mapreduce_taskid = "";
		var mr_completed = false;
		var objMsg = null;
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
		//function showCustomMessage
		//Description: Function is intended to show message box at top of page
		//				and change message title, text, and type without 
		//				producing jump experience during standard show/hide of multiple messages.
		//				Following steps are followed
		//				- Message variable objMsg is created once and then always updated with new status
		//				- objMsg is only created when message type Information is requested to be rendered
		//				- message of type INFROMATION is the only one that can trigger creation of objMsg
		//				- once objMsg exists, CONFIRMATION or ERROR types are shown. 
		//				- user can arrive to a page and always see up to date information
		function showCustomMessage(options)
		{
			var custom_title = options.msgTitle;
			var my_message = options.msgText;
			var msgtype = options.msgType;
			if (!objMsg) 
			{
				if (msgtype === null)
				{
					//if msgtype is not provided, default it to INFORMATION
					msgtype = message.Type.INFORMATION;
				}
				else if (msgtype !== message.Type.INFORMATION)
				{
					//Initial messaging only allowed to be set up for information
					//if this is confirmation/error, and we've never displayed any 
					//messaging before, do not render
					return ;
				}
				//create message with placeholders for title and detail
				//so that we can dynamically update status without 
				//having to show/hide message boxes. 
				objMsg = message.create({
                    type: msgtype,
                    title: "<span id=\"customheader_title\">"+custom_title+"</span>",
                    message: "<span id=\"customheader_message\">"+my_message+"</span>"
                });
                objMsg.show();
			}
			else 
			{
				if (my_message)
				{
					//if message has been provided, then clear previous message
					//and update placeholder with new message
					console.log("MESSAGE 1: " + my_message);
	        		NS.jQuery("#customheader_message").html("").html(my_message);
				}
				if (custom_title)
				{
					//if title has been provided then clear previous title 
					//and update placeholder with new title 
					console.log("message 2: " + custom_title);
					NS.jQuery("#customheader_title").html("").html(custom_title);
				}
				
				console.log("msgtype", msgtype);
				console.log("message.Type.CONFIRMATION", message.Type.CONFIRMATION);
				if (parseInt(msgtype,10) === parseInt(message.Type.ERROR,10))
				{
					//if this is an error message
					//remove INFORMATION style, and add ERROR style
					NS.jQuery( "div.uir-alert-box" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box" ).addClass("error");
					
					//remove INFORMATION icon, and add ERROR icon
					NS.jQuery( "div.uir-alert-box div.icon" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box div.icon" ).addClass("error");
					
					//since processing has completed, notify user that page will be reloaded so 
					//that latest record state can be displayed 
					NS.jQuery("#customheader_message").append("<b> Refreshing page in 3 seconds...</b>");
					
					setTimeout(function(){
		                  location.reload(true);
		                }, 3000);    
				}
				else if (parseInt(msgtype,10) === parseInt(message.Type.CONFIRMATION,10))
				{
					//if this is a CONFIRMATION message
					//remove INFORMATION style, and add CONFIRMATION style
					NS.jQuery( "div.uir-alert-box" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box" ).addClass("confirmation");
					
					//remove INFORMATION icon, and add CONFIRMATION icon
					NS.jQuery( "div.uir-alert-box div.icon" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box div.icon" ).addClass("confirmation");
					
					//since processing has completed, notify user that page will be reloaded so 
					//that latest record state can be displayed 
					NS.jQuery("#customheader_message").append("<b> Refreshing page in 3 seconds...</b>");
					
					setTimeout(function(){
		                  location.reload(true);
		                }, 3000);    
				}
			}
			
			
		}
		//function processHasStarted
		//Description: This function will tell user status bar if 
		//			   processing has started, either yes or no
		//			   Is meaningful to show to user message where entire process is initializing
		function processHasStarted(batchID)
		{
			var detailSearchObj = search.create(
			{
				type: "customrecord_tax_form_batch_detail",
				filters:
 			   [
 			      ["custrecord_txfm_detail_batch_id","anyof",batchID]
 			   ],
 			   columns:
 			   [
 			      search.createColumn({name: "internalid", label: "Internal ID"})
 			   ]
        	});
			var processStarted = false;
		    if (detailSearchObj.runPaged().count>0)
			{
		    	//there are entries, process has started, and %complete can be calculated
				processStarted = true;
			}
	        return processStarted;
		}
		//function getProcessedCount
		//Description: This function will report on number of processed records
		//			   It is used to produce percentage complete
		function getProcessedCount(batchID)
		{
			var detailSearchObj = search.create(
			{
				type: "customrecord_tax_form_batch_detail",
				filters:
 			   [
 			      ["custrecord_txfm_detail_batch_id","anyof",batchID]
 			   ],
 			   columns:
 			   [
 			      search.createColumn({name: "internalid", label: "Internal ID"})
 			   ]
        	});
			var retValue = 0;
			if (detailSearchObj.runPaged().count>0)
			{
		    	//Found entries with status other than Failed/Completed. Safe to display percentage
		    	retValue = detailSearchObj.runPaged().count;
			}
	        return retValue;
		}
		//function showTaxFormBatchStatus
		//Description: This function is called only if it has been determined 
		//			   that record is currently being processed, i.e. status is "Processing Submit"
		//				. This function is intended to 
		//				run only in view mode (not edit)
		//				Once we know that there exists a process, interval is set 3/4 of a second
		//				to keep checking on status and display to user up to date information about MR status
		//				Governance is of no concern if this is a custom record; but process may 
		//				run out of governance if applied to suitelet. 
		//				General States reported are
		//				In Progress - Starting (before any detail records were created)
		//				In Progress - show percentage complete (while detail records are being created)
		//				In Progress - Finalizing (while summary portion of MR script is being executed)
		//				Failed - If process failed. Clear Interval if status is detected. 
		//				Success - if process completed successfully. Clear Interval if status is detected.
		function showTaxFormBatchStatus(metadata)
		{
			var options = {};
			try
			{
				var searchResult = search.lookupFields({						
					type: "customrecord_tax_form_batch",
					id: REC.id,
					columns: ["custrecord_txfm_batch_status", "custrecord_txfm_batch_processingmetadata"
					          ,"custrecord_txfm_batch_numberofforms"
					          ]
				});//return object with various fields from applied transaction
				var processingMetadata = searchResult.custrecord_txfm_batch_processingmetadata;
				var suiteletURL = "";
				if (processingMetadata)
				{
					processingMetadata = JSON.parse(processingMetadata);
					if (processingMetadata.taskId !== mr_mapreduce_taskid)
					{
						//new MR task; not done yet
						mr_completed = false; 
					}
					mr_mapreduce_taskid = processingMetadata.taskId;
					//since suitelet url cannot be calculated in client script, suitelet url 
					//is calculated server side and returned as part of processingMetadata for user convenience
					suiteletURL= processingMetadata.lookupurl;
				}
				
				if (mr_mapreduce_taskid && !mr_completed)
				{
					//if map reduce task id is present, use it to get map reduce status 
					suiteletURL = suiteletURL + "&action=checkTaskStatus&taskId=" + mr_mapreduce_taskid;
					https.get.promise(
      		    	{
      					url: suiteletURL
      				}).then(function(data) {
      					console.log(data);
      					if (isJSONString(data && data.body))
      					{
      					var dataObj = JSON.parse(data.body);
      					//console.log(dataObj);
      					//Retrieve the internal id of the transaction from the results
	      					mr_status = (dataObj && dataObj.status) || "";			
	      					var stage = (dataObj && dataObj.stage) || "";
      					mr_status_text = "";
      					//show detailed messages about map reduce stage and status
	      		    	if (stage)
      					{
      						mr_status_text = mr_status_text + "<br>Map Reduce Stage: " + stage;
      					}
	      		    	mr_status_text = mr_status_text+"<Br>Map Reduce Status: " + mr_status;
	      					if (mr_status === "COMPLETE" || mr_status === "FAILED")
      					{
	      						mr_completed = true;
      						mr_status_text = "";
      					}
	      		    	
	      					if (dataObj && dataObj.scriptId)
	      					{
		  						var searchResult = search.lookupFields({						
		      						type: "script",
		      						id: dataObj.scriptId,
		      						columns: ["name", "scriptid"]
		      					});
		      					
		      					mr_name = (searchResult && searchResult["name"]) || "";
		      					mr_scriptid = (searchResult && searchResult["scriptid"]) || "";
		      					if (mr_name)
		      					{
		      						mr_name = mr_name + ": ";
		      					}
	      					}
	      					mr_prcent_complete = (dataObj && dataObj.percentComplete) || "";
      					}
      					
      				}).catch(function(data) {
      					console.log("Failed:");
      					console.log(data);
      				});
				}
				
				//console.log("remaining goverance " + runtime.getCurrentScript().getRemainingUsage());
				//handle governance; only meaningful if this is a suitelet
				if (runtime.getCurrentScript().getRemainingUsage() < 50) 
       		 	{
					NS.jQuery("#customheader_message").append("<b> Execution Useage Limit Reached. Refreshing page in 3 seconds...</b>");
           		 	setTimeout(function()
           		 	{
           		 		location.reload(true);
           		 	}, 3000);   
           		 	clearInterval(_func_interval);
           		 	return null;
       		 	}
				//show if process succeeded and clear interval
				var taxbatchStatus = (searchResult.custrecord_txfm_batch_status && searchResult.custrecord_txfm_batch_status[0] && searchResult.custrecord_txfm_batch_status[0].value) || "";
				if (parseInt(taxbatchStatus,10) === parseInt(srsConstants["Tax Form Batch Status"]["Submitted"],10))
				{
      		    	options.msgTitle = "Tax Form Batch Request Success"; 
      		    	options.msgText = mr_name + "records have been successfully generated.";
      		    	options.msgType = message.Type.CONFIRMATION;
      		    	showCustomMessage(options);
					console.log("file found, and request completed, nothing to do");
      		    	console.log("clearing interval");
      		    	clearInterval(_func_interval);
      		    	return null;
      		    }
				//show if processed failed 
				if (parseInt(taxbatchStatus,10) === parseInt(srsConstants["Tax Form Batch Status"]["Submit Failed"],10) || (mr_status === "FAILED"))
	      		{
					options = {};
	      		    options.msgTitle = "Tax Form Batch Request Failed"; 
	      		    options.msgText = mr_name + "Please review Tax Form Batch Processing notes.";
	      		    options.msgType = message.Type.ERROR;
	      		    showCustomMessage(options);
 					console.log("clearing interval");
	      		    clearInterval(_func_interval);
	      		    return null;
	      		}
						
				//show this message if no detail records have been created yet
				if (!getProcessedCount(REC.id))
	      		{
					options = {};
	      		    options.msgTitle = "Tax Form Batch Request has started..."; 
	      		   	options.msgText = mr_name + " is in progress..." + mr_status_text;
	      		    options.msgType = null; //do not pass in type
	      		    showCustomMessage(options);
	      		    return null;
	      		}
	      		    
				//show percent complete message 
	      		var processed = getProcessedCount(REC.id);
	      		if (processed>0 && processed<parseInt(searchResult.custrecord_txfm_batch_numberofforms,10))
	      		{
	      			var percentComplete = (parseFloat(processed)/parseFloat(searchResult.custrecord_txfm_batch_numberofforms))*100;
	      		    options = {};
	      		    options.msgTitle = "Tax Form Batch Request is in progress..."; 
	      		    options.msgText = mr_name + "is "+parseFloat(percentComplete).toFixed(0)+"% complete. " + mr_status_text; 
	      		    options.msgType = null; //do not pass in type
	      		    showCustomMessage(options);
      		    }
      		    else if (mr_prcent_complete && mr_scriptid.toLowerCase() !== "customscript_tax_form_batch_mr") 
      		    {
      		    	// do not enter here if this is customscript_tax_form_batch_mr script
      		    	// this code handles all other MR scripts via mr_prcent_complete
      		    	options = {};
 	      		    options.msgTitle = "Tax Form Batch Request is in progress..."; 
 	      		    options.msgText = mr_name + "is "+mr_prcent_complete+"% complete. " + mr_status_text; 
 	      		    options.msgType = null; //do not pass in type
 	      		    showCustomMessage(options);
      		    }
      		    else if (mr_scriptid.toLowerCase() === "customscript_tax_form_batch_mr") 
    		    {
      		    	//this is MR summary part of the stage
      		    	options = {};
      		    	options.msgTitle = "Tax Form Batch Request is in progress..."; 
      		    	options.msgText = mr_name + "is updating summary counts... " + mr_status_text;
	      		    options.msgType = null; //do not pass in type
	      		    showCustomMessage(options);
      		    }
      		    else 
      		    {
      		    	//this is MR summary part of the stage
      		    	options = {};
    		    	options.msgTitle = "Tax Form Batch Request is in progress..."; 
    		    	options.msgText = mr_name + "is in progress... " + mr_status_text;
      		    	options.msgType = null; //do not pass in type
      		    	showCustomMessage(options);
      		    }
			}
			catch(e)
			{
				console.log("error, turning off internval " + e.toString());
				clearInterval(_func_interval);
			}
		}
		Number.prototype.numberWithCommas = function(){
			return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		};
		//function submitTaxFormBatch
		//Description: This function responds to Submit button 
		function submitTaxFormBatch(src, id)
		{
			var tfbREC = null;
			var taxyearfiled = "";
			var reportmethod = "";
			var deals = null;
			var isCovered = "";
			
			tfbREC = record.load({type: "customrecord_tax_form_batch", id: id, isDynamic: true});
			
			var submitURL = src + "&taxformbatch=" + id;
			submitURL	+="&action=submitBatch"; 
			console.log("submitURL " + submitURL);
			
			var btn = REC.getField({ fieldId:"custpage_submit"});
			if (btn)
			{
				//disable preview button
				btn.isDisabled = true;
			}
			tfbREC.setValue("custrecord_txfm_batch_status", srsConstants["Tax Form Batch Status"]["Processing Submit"]);
			tfbREC.setValue("custrecord_txfm_batch_processing_notes", ""); //clear processing notes, as they are now stale.  
			tfbREC.save();
	  	    	
			https.get.promise({
				url: submitURL
			}).then(function(data) 
			{
				_func_interval = setInterval(function() { showTaxFormBatchStatus(data.body); }, srsConstants["Tax Form Batch Status"]["Tax Form Batch Refresh Miliseconds"]);
				
			}).catch(function(data) {
				console.log("Failed:");
				console.log(data);
			});
			//console.log("response " + JSON.stringify(response));
			
		}
		//given options and a base url, 
		//append values in URL format 
		function buildDetailViewParameters(options)
		{
			var base = options.suiteletURL;
			base += "&taxyearfiled=" + options.taxyearfiled;
			base += "&reportmethod=" + options.reportmethod;
			base += "&deals=" + options.deals;
			base += "&isCovered=" + options.isCovered;
			base += "&taxformbatch=" +options.taxformbatch;
			base += "&custparam_hidenavbar=T&ifrmcntnr=T";
			return base;
		}
		function buildPreviewParameters(base, REC)
		{
			
			base += "&taxyearfiled=" + REC.getValue("custrecord_txfm_batch_yr_filed");
			base += "&reportmethod=" + REC.getValue("custrecord_txfm_batch_report_method");
			base += "&deals=" + REC.getValue("custrecord_txfm_batch_deals");
			base += "&isCovered=" + REC.getValue("custrecord_txfm_batch_iscovered");
			base += "&taxformbatch=" + REC.id;
			base += "&custparam_hidenavbar=T&ifrmcntnr=T";
			return base;
		}
		
		//when page first loads, if batch status is submitted
		//load refreshDetails Tax Form Batch Detail view  
		function refreshDetails(options)
		{
			var ifr = document.getElementsByName("custpage_tab_taxbatch_iframe")[0];
			if (ifr)
			{
				var fullurl = buildDetailViewParameters(options);
				fullurl+="&action=getDetailData";
				console.log("iframe DETAIL url " + fullurl);
				//do not use ifr.src method as URL is captured in history 
				ifr.contentWindow.location.replace(fullurl); 
				ShowTab("custpage_tab_taxbatch",false);
			}
		}
		function refreshIframe (src)
		{
			var REC = currentRecord.get();
			var btn = REC.getField({ fieldId:"custpage_preview"});
			if (btn)
			{
					//disable preview button
					btn.isDisabled = true;
					NS.jQuery("#tr_custpage_preview").addClass("tabBnt_sel");
					NS.jQuery("#tr_custpage_preview").css("box-shadow", "0 0 2px 2px rgba(24,123,242,.75)");
					
			}
			
			var ifr = document.getElementsByName("custpage_tab_taxbatch_iframe")[0];
			if (ifr)
			{
				//use promise to retrieve relevant information about this batch
				var fullurl = buildPreviewParameters(src, REC);
				console.log("refresh iframe url " + fullurl);
				//do not use ifr.src method as URL is captured in history 
				ifr.contentWindow.location.replace(fullurl); 
				ShowTab("custpage_tab_taxbatch",false);
				fullurl+="&action=getSummaryData";
				console.log("summary url " + fullurl);
				https.get.promise({
					url: fullurl
				}).then(function(data) {
					if (isJSONString(data.body))
					{
						var dataObj = JSON.parse(data.body);
						REC.setValue({ fieldId:"custrecord_txfm_batch_numberofdeals" 
							  ,value:dataObj.numOfDeals
							  ,ignoreFieldChange : true
							}); 
						REC.setValue({ fieldId:"custrecord_txfm_batch_numberofforms" 
							  ,value:dataObj.numOfForms
							  ,ignoreFieldChange : true
							}); 
						REC.setValue({ fieldId:"custrecord_txfm_batch_box1d" 
							  ,value:parseFloat(dataObj.Box1D).toFixed(2)
							  ,ignoreFieldChange : true
							}); 
						if (dataObj.Box1E && dataObj.Box1E.trim())
						{
							REC.setValue({ fieldId:"custrecord_txfm_batch_box1e" 
							  ,value:parseFloat(dataObj.Box1E).toFixed(2)
							  ,ignoreFieldChange : true
							}); 
						}
						REC.setValue({ fieldId:"custrecord_txfm_batch_box4" 
							  ,value:parseFloat(dataObj.Box4).toFixed(2)
							  ,ignoreFieldChange : true
							}); 
					}
					else 
					{
						console.log("Error occurred while processing summary counts");
						var myFrame = NS.jQuery("#custpage_iframe_taxbatchpreview").contents().find("body");
						myFrame.html("Error occurred requesting preview " + data.body);
					}
					if (btn)
					{
							//enable preview button
							btn.isDisabled = false;
							NS.jQuery("#tr_custpage_preview").removeClass("tabBnt_sel");
							NS.jQuery("#tr_custpage_preview").css("box-shadow", "");
							
					}
					
				}).catch(function(data) {
					console.log("Failed:");
					console.log(data);
				});
			}
		}

		if (REC.id)
		{
			if (window.location.href.indexOf("e=T")<0) //status checking code is only meaningful in view mode, when e=T is missing
			{
				//use promise instead to look up relevant information
				tfLibrary.getTaxFormValuesPromise(REC.id) 
				.then(function(options)
				{
					if (parseInt(options.status,10) === parseInt(srsConstants["Tax Form Batch Status"]["Processing Submit"],10))
					{
						if (!options.isinactive)
						{
							_func_interval = setInterval(showTaxFormBatchStatus, srsConstants["Tax Form Batch Status"]["Tax Form Batch Refresh Miliseconds"]);
						}
					}
					if (parseInt(options.status,10) !== parseInt(srsConstants["Tax Form Batch Status"]["Draft"],10))
					{
						refreshDetails(options);
					}
				})
				.catch(function(reason) {
	                console.log("reason " + reason);
	                //reject( reason );
	                //do something on failure
	            });
				
			}
		}
		return {
			pageInit: 			pageInit,
			refreshIframe : refreshIframe,
			submitTaxFormBatch : submitTaxFormBatch
			
		};
});

