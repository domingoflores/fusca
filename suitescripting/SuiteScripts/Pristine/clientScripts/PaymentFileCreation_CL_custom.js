//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

//this script will provide status during PDF Check generation 
//while Payment File Creation is in View Mode
//Page can be refreshed safly
//There is no governance in the view mode 
//Message is updated every 3/4 of a second

define(["N/currentRecord", "N/ui/message", "N/search", "N/runtime", "N/record"
        ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
        ,"SuiteScripts/Pristine/libraries/PaymentFileCreation_Library.js"
        ],
	/**
	 * PaymentFileCreation_CL_custom.js
	 */
	function(currentRecord, message, search, runtime, record
		, srsConstants
		, pftLibrary
	) {
		
		var rcd = currentRecord.get();
		var _func_interval = null;
		function showCustomMessage(options)
		{
			var custom_title = options.msgTitle;
			var my_message = options.msgText;
			var msgtype = options.msgType;
			if (!window.objMsg) 
			{
				if (msgtype === null)
				{
					msgtype = message.Type.INFORMATION;
				}
				else if (msgtype !== message.Type.INFORMATION)
				{
					//Initial messaging only allowed to be set up for information
					//if this is confirmation/error, and we've never displayed any 
					//messaging before, do not render
					return ;
				}
				var statusMssage = message.create({
                    type: msgtype,
                    title: "<span id=\"requestheader_title\">"+custom_title+"</span>",
                    message: "<span id=\"requestheader_message\">"+my_message+"</span>"
                });
                window.objMsg = statusMssage;
                window.objMsg.show();
			}
			else 
			{
				if (my_message)
				{
					console.log("MESSAGE 1: " + my_message);
	        		NS.jQuery("#requestheader_message").html("").html(my_message);
				}
				if (custom_title)
				{
					console.log("message 2: " + custom_title);
					NS.jQuery("#requestheader_title").html("").html(custom_title);
				}
				
				console.log("msgtype", msgtype);
				console.log("message.Type.CONFIRMATION", message.Type.CONFIRMATION);
				if (parseInt(msgtype,10) === parseInt(message.Type.ERROR,10))
				{
					NS.jQuery( "div.uir-alert-box" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box" ).addClass("error");
					
					NS.jQuery( "div.uir-alert-box div.icon" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box div.icon" ).addClass("error");
				}
				else if (parseInt(msgtype,10) === parseInt(message.Type.CONFIRMATION,10))
				{
					NS.jQuery( "div.uir-alert-box" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box" ).addClass("confirmation");
					
					NS.jQuery( "div.uir-alert-box div.icon" ).removeClass("info");
					NS.jQuery( "div.uir-alert-box div.icon" ).addClass("confirmation");
					
					NS.jQuery("#requestheader_message").append("<b> Refreshing page in 3 seconds...</b>");
					
					setTimeout(function(){
		                  location.reload(true);
		                }, 3000);    
				}
			}
			
			
		}
		
		function processHasStarted(requestHeader)
		{
			var detailSearchObj = search.create(
			{
				type: "customrecord_pri_cre_request_detail",
				filters:
 			   [
 			      ["custrecord_pri_cre_request_header","anyof",requestHeader]
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
		
		function getCompletedCount(requestHeader)
		{
			var detailSearchObj = search.create(
			{
				type: "customrecord_pri_cre_request_detail",
				filters:
 			   [
 			      ["custrecord_pri_cre_request_header","anyof",requestHeader],
 			     "AND", 
 			     ["custrecord_pri_cre_request_header.custrecord_pri_cre_request_header_status","noneof",srsConstants["CRE Request Status"]["Failed"],srsConstants["CRE Request Status"]["Completed"]]
 			     	        			 
 			   ],
 			   columns:
 			   [
 			      search.createColumn({name: "internalid", label: "Internal ID"})
 			   ]
        	});
			var retValue = 0;
			if (detailSearchObj.runPaged().count>0)
			{
		    	//Found entrys with status other than Failed/Completed. Safe to display percentage
		    	retValue = detailSearchObj.runPaged().count;
			}
	        return retValue;
		}
		
		function showCRERequestHeaderStatus()
		{
			var options = {};
			try
			{
				var requestHeader = rcd.getValue({ fieldId:"custrecord_pay_file_request_header" });
	        	if (requestHeader)
	        	{
	        		
	        		 if (runtime.getCurrentScript().getRemainingUsage() < 50) 
	        		 {
	        			 	 NS.jQuery("#requestheader_message").append("<b> Execution Useage Limit Reached. Refreshing page in 3 seconds...</b>");
		        			 setTimeout(function()
		        			 {
		        			      location.reload(true);
		        			 }, 3000);   
	        		 }
	        		
	        		console.log("found request " + requestHeader);
	        		var objRequestHeader = record.load({type: "customrecord_pri_cre_request_header", id: requestHeader, isDynamic: true});
        		  	var rec_extraValues = JSON.parse(objRequestHeader.getValue("custrecord_pri_cre_request_header_param1")); 
	      		    var status = objRequestHeader.getValue("custrecord_pri_cre_request_header_status");
	      		    
	      		    if ((parseInt(status,10) === parseInt(srsConstants["CRE Request Status"]["Completed"],10)))    
	      		    {
	      		    	options.msgTitle = "Payment File Creation Success"; 
	      		    	options.msgText = "Payment File Successfully generated.";
	      		    	options.msgType = message.Type.CONFIRMATION;
	      		    	showCustomMessage(options);
    					console.log("file found, and request completed, nothing to do");
	      		    	console.log("clearing interval");
	      		    	clearInterval(_func_interval);
	      		    	return null;
	      		    }
//	      		    
//	      		    console.log("found status " + status);
	      		    if (parseInt(status,10) === parseInt(srsConstants["CRE Request Status"]["Failed"],10))
	      		    {
	      		    	options = {};
	      		    	options.msgTitle = "Payment File Creation Failed"; 
	      		    	options.msgText = "Please review " + pftLibrary.getAnchor("customrecord_pri_cre_request_header", requestHeader, "Request")+  " processing notes.";
	      		    	options.msgType = message.Type.ERROR;
	      		    	showCustomMessage(options);
    					console.log("clearing interval");
	      		    	clearInterval(_func_interval);
	      		    	return null;
	      		    }
	      		    if (!processHasStarted(requestHeader))
	      		    {
	      		    	options = {};
	      		    	options.msgTitle = "Payment File Creation is in progress..."; 
	      		    	options.msgText = "Payment File Creation " + pftLibrary.getAnchor("customrecord_pri_cre_request_header", requestHeader, "Request")+  " is in progress...";
	      		    	options.msgType = null; //do not pass in type
	      		    	showCustomMessage(options);
	      		    	return null;
	      		    }
	      		    
	      		    var completed = getCompletedCount(requestHeader);
	      		    if (completed>0 && completed<rec_extraValues.RecordsToProcess)
	      		    {
	      		    	var percentComplete = (parseFloat(completed)/parseFloat(rec_extraValues.RecordsToProcess))*100;
	      		    	options = {};
	      		    	options.msgTitle = "Payment File Creation is in progress..."; 
	      		    	options.msgText = "Payment File Creation " + pftLibrary.getAnchor("customrecord_pri_cre_request_header", requestHeader, "Request")+  " is "+parseFloat(percentComplete).toFixed(0)+"% complete."; 
	      		    	options.msgType = null; //do not pass in type
	      		    	showCustomMessage(options);
	      		    }
	      		    else 
	      		    {
	      		    	options = {};
	      		    	options.msgTitle = "Payment File Creation is in progress..."; 
	      		    	options.msgText = "Payment File Creation " + pftLibrary.getAnchor("customrecord_pri_cre_request_header", requestHeader, "Request")+  " is generating final output...";
	      		    	options.msgType = null; //do not pass in type
	      		    	showCustomMessage(options);
	      		    }
	      		    
	      		    	        	}
	        	else 
	        	{
	        		console.log("no head request, turning off internval ");
	        		clearInterval(_func_interval);
	        	}
			}
			catch(e)
			{
				console.log("error, turning off internval " + e.toString());
				clearInterval(_func_interval);
			}
		}
		
		NS.jQuery(document).ready(function() 
		{
			var requestHeader = rcd.getValue({ fieldId:"custrecord_pay_file_request_header" });
			if (requestHeader)
        	{
        		console.log("setting internval");
    			_func_interval = setInterval(showCRERequestHeaderStatus, 750);
        	}
		});
		
		
	return {
		showCRERequestHeaderStatus: showCRERequestHeaderStatus
		};
	});