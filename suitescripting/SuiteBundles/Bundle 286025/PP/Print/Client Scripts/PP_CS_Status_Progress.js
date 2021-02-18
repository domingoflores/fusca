/**
 * @author Max
 * 5/09/2013 2:13:50 PM
 *
 * This script handles retrieving the results of Avid process status
*/

// Yes this is kind of crazy to do but it works well. Lets use this directive to supply the src with a base64 encoded image.
var loadingImg = "data:image/gif;base64,R0lGODlhKwALAPEAAP///5nDQczhoZnDQSH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAKwALAAACMoSOCMuW2diD88UKG95W88uF4DaGWFmhZid93pq+pwxnLUnXh8ou+sSz+T64oCAyTBUAACH5BAAKAAEALAAAAAArAAsAAAI9xI4IyyAPYWOxmoTHrHzzmGHe94xkmJifyqFKQ0pwLLgHa82xrekkDrIBZRQab1jyfY7KTtPimixiUsevAAAh+QQACgACACwAAAAAKwALAAACPYSOCMswD2FjqZpqW9xv4g8KE7d54XmMpNSgqLoOpgvC60xjNonnyc7p+VKamKw1zDCMR8rp8pksYlKorgAAIfkEAAoAAwAsAAAAACsACwAAAkCEjgjLltnYmJS6Bxt+sfq5ZUyoNJ9HHlEqdCfFrqn7DrE2m7Wdj/2y45FkQ13t5itKdshFExC8YCLOEBX6AhQAADsAAAAAAAAAAAA=";
// lets remove any doubt and spawn our own instance of jQuery
if (jq == null)
    var jq = jQuery.noConflict();
// Help variables 
var br = "<br />";
var second = 1000;
var interval = 3;

function unloadMessage(e){
	return 'The job has not finished yet. If you leave now the job will not complete. Are you sure you want to leave?';
}

jq(run);

function run() {
	
    var jobid = jq('#jobid').val() || "";
    var printStatusListId = jq('#printStatusListId').val() || "";
    var useScheduledScript = jq('#useScheduledScript').val() || "";
    
    //console.log('printStatusListId ' + printStatusListId);
    
    if(jobid != "" || printStatusListId != ""){
	    var defaultStatus,defaultStatusMsg;
    	if(jobid != ""){
    		defaultStatus = 'Connecting';
    		defaultStatusMsg = 'Connecting to AvidXchange';
    	}
    	else if(useScheduledScript == 'T'){
    		defaultStatus = 'Scheduled';
    		defaultStatusMsg = 'Waiting for scheduled script to execute.';
    		buildAndSendPaymentJSON(printStatusListId,true);
    	}
    	else{
    		defaultStatus = 'Connecting';
    		defaultStatusMsg = 'Waiting for script to execute.';
    		buildAndSendPaymentJSON(printStatusListId,false);
    	}
    	// Build the initial markup for the status box
	    var statusBoxEl = jq("<div />").addClass('statusBox').css({border: '1px solid #666666', width: '600px'});
	    var titleEl = jq('<div class="title"></div>').text('AvidXchange is processing your request, please wait.').css({backgroundColor: '#666666', padding: '5px', color: '#ffffff', fontSize: '13px'});
	    statusBoxEl.append(titleEl);
	    var statusContainer = jq('<div id="statusContainer"></div>').css({padding: '20px 10px' });
	    statusContainer.append('<div id="jobId"><strong>Job ID: </strong> <span class="value">'+jobid+'</span></div>');
	    var stepEl = jq('<div id="step"></div>').html('<div id="step"><strong>Current step: </strong> <span class="value">'+defaultStatusMsg+'</span></div>').appendTo(statusContainer);
	    var intervalEl = jq('<div id="interval"><strong>Interval: </strong> <span class="value">1</span></div>').appendTo(statusContainer);
	    statusBoxEl.append(statusContainer);
	    var progressEl = jq('<div id="progress"></div>').appendTo(statusBoxEl).css({borderTop: '1px solid #666666', padding: '5px'});
	    progressEl.append('<img alt="" src="'+loadingImg+'" />');
	    var statusEl = jq('<span id="status" style="font-style:italic; font-size: 12px;">'+defaultStatus+'</span>');
	    progressEl.append(' ');
	    progressEl.append(statusEl);
	    var content = jq('#custcontent_val').html(statusBoxEl);
	    
	    jq('head').append('<style type="text/css"> #summarytable tr:nth-child(2n+1) td{background-color: #eee;}</style>');
	      
	    var statusUrl = nlapiResolveURL("SUITELET",
                "customscript_pp_sl_getjobstatus",
                "customdeploy_pp_sl_getjobstatus",
                false);
	    
	    // prevent duplicate file downloads due to asynchronous ajax call taking longer than 3 seconds and getStatus getting run before ajax call returns.
	    var inAjaxCall = false;
	    
	    // get status of job from pps and update the status box display 
	    function getStatus(){
	    	if(inAjaxCall){
	    		return;
	    	}
	    	
	    	inAjaxCall = true;
	    	try {
	            var _url = statusUrl + "&jobid=" + jobid + "&printStatusListId=" + printStatusListId
	             + "&timestamp=" + (new Date().getTime()).toString();
	    
		            jq.ajax({
						  type: "GET",
						  url: _url,
						  dataType: 'json',
						  error: function(){
							  inAjaxCall = false;
						  },
						  success: function(b){
							  // attach onbeforeunload here because doing it before was not working
							  window.onbeforeunload = unloadMessage;
							  var __T = "";
							 // b = JSON.parse(b);
							  if(jobid == '' && b.jobid){
								  jobid = b.jobid;
								  jq('#jobId .value').text(jobid);
							  }
							  //if (b.jobstatus != "Complete") { // update status display if we don't have a file yet 
							switch(b.jobstatus.toLowerCase()){
							case 'fail':
								statusContainer.empty();
								var errMsg = b.statusmsg;
								if(errMsg == 'Bank account not found'){
									errMsg = 'The bank account you tried to print from has not been configured. Please go to AvidXchange -> Setup -> Accounts and setup the account.';
								}
	                            statusContainer.append(jq('<p style="color: red"></p>').html('JobID:'+jobid+'<br/>'+ 'Error Message: ' + errMsg));
	                            titleEl.html('Error. There was a problem creating your file.');
	                            progressEl.find('img').remove();
	                            clearInterval(si);
	                            window.onbeforeunload = null;
								break;
							case 'complete':
			                    	titleEl.html('Success!');
			                    	if(b.file_download){
			                    		statusContainer.html('<p style="margin-bottom: 15px">Your file should start downloading in a few seconds. If the downloading doesn\'t start automatically <a href="'+b.fileurl+'">click here to get your file.</a></p>');
			                    		window.onbeforeunload = null;
			                    		window.location.href = b.fileurl + "&timestamp=" + (new Date().getTime()).toString();
			                    		// reattach to onbeforeunload in timeout for chrome
			                    		setTimeout(function(){window.onbeforeunload = unloadMessage;},0);
			                    	}
			                    	else{
			                    		statusContainer.html('<p style="margin-bottom: 15px">Your job completed successfully. There is no file to download.</p>');
			                    	}
			                    	
			                    	statusContainer.append('<h3>Print Summary</h3><table style="font-size: 100%; width: 99%" id="summarytable"><tbody>' + 
					                        '<tr><td>Job ID</td><td>'+jobid+'</td></tr>' +
					                        '<tr><td>Item Count</td><td>'+b.itemcount+'</td></tr>' +
					                        '<tr><td>ACH Count</td><td>'+b.achcount+'</td></tr>' + 
					                        '<tr><td>Over Flow Count</td><td>'+b.overflowcount+'</td></tr>' + 
					                        '<tr><td>Void Count</td><td>'+b.voidcount+'</td></tr>' + 
					                        '<tr><td>Total Amount</td><td>$'+ (new Number(b.totalamount)).toFixed(2) +'</td></tr>' +
					                        '</tbody></table>');
			                    	
			                    	if(b.warning_msg){
			                    		statusContainer.append('<div style="padding-top: 13px"><span style="color: orange;font-weight: bold;">Warning: ' + b.warning_msg +'</span></div>');
			                    	}
			                    	
			                    	progressEl.find('img').remove();
			                    	// clear/stop our loop
			                    	clearInterval(si);
			                    	
			                    	if(typeof printTest == 'undefined'){
			                    		setChecksAsPrinted(printStatusListId);
			                    	}
			                    	else{
			                    		setTimeout(function(){window.onbeforeunload = null;});
			                    	}
			                    	break;
							case 'pending user approval':
								titleEl.html('Success!');
								if(b.file_download){
									statusContainer.empty();
									statusContainer.append('<p style="margin-bottom: 15px;">Please download and review the copy of the Secure Printing Service job and press the approve or reject button.</p>');
		                    		statusContainer.append('<p style="margin-bottom: 15px;"><button type="button" onclick="setJobStatus.call(this,\'User Approved\','+jobid+','+printStatusListId+')">Approve</button> <button type="button" onclick="setJobStatus.call(this,\'Rejected\','+jobid+','+printStatusListId+')">Reject</button></p>');
		                    		
		                    		statusContainer.append('<p style="margin-bottom: 15px">Your file should start downloading in a few seconds. If the downloading doesn\'t start automatically <a href="'+b.fileurl+'">click here to get your file.</a></p>');
		                    		statusContainer.append('<h3>Print Summary</h3><table style="font-size: 100%; width: 99%" id="summarytable"><tbody>' + 
					                        '<tr><td>Job ID</td><td>'+jobid+'</td></tr>' +
					                        '<tr><td>Item Count</td><td>'+b.itemcount+'</td></tr>' +
					                        '<tr><td>Over Flow Count</td><td>'+b.overflowcount+'</td></tr>' + 
					                        '<tr><td>Void Count</td><td>'+b.voidcount+'</td></tr>' + 
					                        '<tr><td>Total Amount</td><td>$'+ (new Number(b.totalamount)).toFixed(2) +'</td></tr>' +
					                        '</tbody></table>');
		                    		
		                    		if(b.warning_msg){
			                    		statusContainer.append('<div style="padding-top: 13px"><span style="color: orange;font-weight: bold;">Warning: ' + b.warning_msg +'</span></div>');
			                    	}
		                    		window.onbeforeunload = null;
		                    		window.location.href = b.fileurl + "&timestamp=" + (new Date().getTime()).toString();
		                    		// reattach to onbeforeunload in timeout for chrome
		                    		setTimeout(function(){window.onbeforeunload = unloadMessage},0);
		                    	}
		                    	else{
		                    		titleEl.html('Error!');
		                    		statusContainer.html('<p style="margin-bottom: 15px">Something went wrong. There is no file to download for the Secure Printing Service job.<br/><br/>jobid: '+jobid+'</p>');
		                    	}
								progressEl.find('img').remove();
		                    	clearInterval(si);
								break;
							default:
								stepEl.find('.value').html(b.statusmsg);
								intervalEl.find('.value').text(i);
								break;
			                    	
			                    }
							statusEl.html(b.jobstatus);
							inAjaxCall = false;
						  }
						});
	        } catch (e) { console.error(e); clearInterval(si); inAjaxCall= false;}
	    	
	    }
	    
	    // Create a timed loop to check status of job
	    var i = 0;
	    var si = setInterval(function () {
	    	getStatus();
	        i++;
	    }, second * interval);
	    
	    // get first status
	    getStatus();
	    
    }else if(typeof printTest != 'undefined' && printTest == null){
    		alert('Error here?');
    }
}

/**
 * Sends an ajax request to the customscript_pp_sl_setjobstatus script which acts as a proxy script
 * to the PPS server for setting status
 * 
 * 
 * @param {string} status The status to set the job as
 * @param {string} jobid
 * @returns {Void}
 */
function setJobStatus(status,jobid,printStatusListId){
	var button = jq(this);
	var siblingButton = button.siblings(); 
	button.attr("disabled","disabled");
	siblingButton.attr("disabled","disabled");
	try{
		var statusUrl = nlapiResolveURL("SUITELET",
		        "customscript_pp_sl_setjobstatus",
		        "customdeploy_pp_sl_setjobstatus",
		        false);
	}
	catch(e){
		// chrome is having ajax timing issue here when approve or reject is being clicked before file is downloaded
		// calling setJobStatus in a setTimeout fixes this
		setTimeout(function(){setJobStatus(status,jobid,printStatusListId);},1000);
	}
	
	    var _url = statusUrl + "&jobid=" + jobid + "&status=" + status
	     + "&timestamp=" + (new Date().getTime()).toString();
	    
	    jq.ajax({
			  type: "GET",
			  url: _url,
			  dataType: 'json',
			  success: function(b){
				  // update status container with success or error message
				  if(b.success == 'true'){
					  if(status == 'User Approved'){
						  jQuery('#statusContainer').html('Your SPS print job was approved and your SPS clerk has been notified.');
						  jQuery('#status').html('Approved');
						  setChecksAsPrinted(printStatusListId);
					  }
					  else if(status == 'Rejected'){
						  jQuery('#statusContainer').html('Your SPS print job was rejected.');
						  jQuery('#status').html('Rejected');
						  window.onbeforeunload = null;
					  }
				  }
				  else{
					  jQuery('#statusContainer').append('<p style="color: red;">There was an error processing your request. Please try again.<br/><br/>' + b.error + '</p>')
					  button.removeAttr("disabled");
					  siblingButton.removeAttr("disabled","disabled");
				  }
			  },
			  error: function(jqXHR,textStatus,errorThrown){
				  setJobStatus(status,jobid,printStatusListId);
			  }
	    });
}

// fire off request to set checks as printed
function setChecksAsPrinted(printStatusListId){
	var clientHelperUrl = nlapiResolveURL("SUITELET",
            "customscript_pp_sl_clienthelper",
            "customdeploy_pp_sl_clienthelper",
            false);
	clientHelperUrl += "&action=setChecksAsPrinted";
    jq.ajax(clientHelperUrl,{
    	type: 'POST',
    	contentType: 'application/json; charset=utf-8',
    	dataType: 'json',
    	processData: false,
    	data: JSON.stringify({printStatusListId : printStatusListId}),
    	async: false //chrome needs this for some reason
    });
    setTimeout(function(){window.onbeforeunload = null;});
}

//fire off request to set checks as printed
function buildAndSendPaymentJSON(printStatusListId,useScheduledScript){
	var clientHelperUrl = nlapiResolveURL("SUITELET",
            "customscript_pp_sl_clienthelper",
            "customdeploy_pp_sl_clienthelper",
            false);
	if(useScheduledScript){
		clientHelperUrl += "&action=buildAndSendPaymentJSON";
	}
	else{
		clientHelperUrl += "&action=buildAndSendPaymentJSONNow";
	}
    jq.ajax(clientHelperUrl,{
    	type: 'POST',
    	contentType: 'application/json; charset=utf-8',
    	dataType: 'json',
    	processData: false,
    	data: JSON.stringify({printStatusListId : printStatusListId})
    	//,async: false //chrome needs this for some reason
    });
}
