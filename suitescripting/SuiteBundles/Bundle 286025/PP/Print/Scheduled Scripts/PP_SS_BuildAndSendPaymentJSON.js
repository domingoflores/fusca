/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Aug 2013     maxm
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
$PPS.debug = true;
$PPS.where = 'PP_SS_BuildAndSendPaymentJSON.js';

function scheduled(type) {
	var context = nlapiGetContext();
	// get PrintStatusList internalId from parameters
	var printStatusListId = context.getSetting('SCRIPT', 'custscript_pp_print_status_list_id');
	
	try{
		nlapiSubmitField('customrecord_pp_print_status', printStatusListId, 'custrecord_pp_ps_status', 'Executing', false);
		
		// load the PrintStatusList to get the paymentIds
		// use nlapiLoadRecord because lookupField will only return first 4000 chars of long text field
		var rec = nlapiLoadRecord('customrecord_pp_print_status', printStatusListId);
		var paymentIds = JSON.parse(rec.getFieldValue('custrecord_pp_ps_internal_ids'));
	
		// create and run PaymentBulider
		var ppsPaymentBuilder = new PPSPaymentBuilder();
		var ppsObj = ppsPaymentBuilder.getData(paymentIds, true);
		
		var printerOffsets = getPrinterOffsets(rec.getFieldValue('custrecord_pp_ps_printer_offset'));
		ppsObj.printerOffsets = printerOffsets;
		
		if(rec.getFieldValue('custrecord_pp_ss_sps') == 'T'){
			ppsObj.sps = true;
		}
		
		ppsObj.approvalsEnabled = context.getSetting('SCRIPT', 'custscript_enable_approvals') == 'T' ? true : false;
		
		// NetSuite is XML encoding < and > symbols in the data
		var jsonString = JSON.stringify(ppsObj);
		jsonString = jsonString.replace(/&lt;/g, '<');
		jsonString = jsonString.replace(/&gt;/g, '>');	
		
		// Send data to PPS
	    var data = $PPS.NSRestReq(rec.getFieldValue('custrecord_pp_ps_fileurl'), jsonString, $PPS.httpVerbs.post);	    
	    
	    var job = {
	    	    jobid: null,
	    	    jobstatus: "",
	    	    statusmsg: "",
	    	};
	    $PPS.log(data.httpbody);
	    if(data.httpcode == '401'){
	    	job.jobstatus = 'Fail';
	    	job.statusmsg = "Error: Your AvidXchange Self-Managed account has not been setup or is inactive. "+
    			"Please contact AvidXchange support at 800.621.5720 or send an email to <a href=\"mailto:supportdepartment@avidxchange.com\">supportdepartment@avidxchange.com</a>."
	    }
	    else if(data.error){
	    	$PPS.log(data.error);
	    	job.jobstatus = 'Fail';
	    	job.statusmsg = "Error: Server not responding."
	    }
	    else{
	    	var result = JSON.parse(data.httpbody);
	    	if(result.commandstatus == 'Success'){
	    		job.jobid = result.jobID;
	    		job.jobstatus = 'Processing';
	    		job.statusmsg = 'Sending data to PPS server';
	    		nlapiSubmitField('customrecord_pp_print_status',printStatusListId,'custrecord_pp_ps_jobid',result.jobID);
	    	}
	    	else{
	    		job.jobstatus = 'Fail';
	    		job.statusmsg = result.commanderrmsg;
	    		if(job.statusmsg == 'Account not found'){
	        		job.statusmsg = 'Your bank account has not been setup for self-managed payments.  Please go to AvidXchange -> Setup -> Accounts to configure the account and try again.';
	        	}
	    		else if(job.statusmsg == 'No assignments set for the account'){
	    			var actionString = 'Accounts Payable';
	    			if(ppsObj.action == 'AR'){
	    				actionString = 'Accounts Receivable';
	    			}
	    			job.statusmsg = 'Your bank account needs to be assigned a document definition. Please go to AvidXchange -> Setup -> Accounts and assign an '+ actionString +' document definition and document format for this account.';
	    		}
	    		if(result.jobID){
	    			job.jobid = result.jobID;
	    		}
	    	}
	    }
	    
	    nlapiSubmitField('customrecord_pp_print_status', printStatusListId, ['custrecord_pp_ps_status','custrecord_pp_ps_statusmsg','custrecord_pp_ps_jobid'], [job.jobstatus,job.statusmsg,job.jobid], false);
	
	    
	    // Check to see if any jobs are scheduled. Get oldest job and reschedule for execution
	    // We have to do this because NetSuite will only let us schedule the deployment if it is not scheduled.
	    var filters = [
	                   new nlobjSearchFilter('custrecord_pp_ps_status',null,'is','Scheduled'),
	                   new nlobjSearchFilter('custrecord_pp_ps_status_date', null, 'within', 'today')
	                   ];
	    var columns = [
	                   new nlobjSearchColumn('internalid').setSort(false)
	                 ];
	    var searchResults = nlapiSearchRecord('customrecord_pp_print_status', null, filters, columns);
	    if(searchResults){
	    	$PPS.log('Another job was found. ReScheduling script with status list id ' + searchResults[0].getId());
	    	 // query the customrecord_pp_print_status for Scheduled jobs, if we find one reschedule script
		    var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), 
	            	{ "custscript_pp_print_status_list_id": 		searchResults[0].getId()
	            	  });
		    $PPS.log('Status of script '+ status);
	    }

	}
	catch(e){
		$PPS.log(e);
		nlapiSubmitField('customrecord_pp_print_status', printStatusListId, ['custrecord_pp_ps_status','custrecord_pp_ps_statusmsg'], ['Fail','Job error code NS1'], false);
	}
}


function getPrinterOffsets(id) {
    var columns = [],
		filters = [],
    	offsets = {
	    		"page_offsets": {
	                "x": "",
	                "y": ""
	            },
	            "micr_offsets": {
	                "x": "",
	                "y": ""
	            },
	            "printer_name":""
	    	};
    
    $PPS.log('getPrinterOffsets');

    try{

	    columns.push(new nlobjSearchColumn('custrecord_pp_printer_name'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_horizontal_page_offest'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_vertical_page_offset'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_horizontal_micr_offset'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_vertical_micr_offset'));
	    
	    filters.push(new nlobjSearchFilter('internalid', null, 'anyof', id));
	    
	    var results = nlapiSearchRecord('customrecord_pp_printer_offsets', null, filters, columns);
	
	    /* nlapiSearchRecord returns null for empty results; return empty array instead. */
	    if (!results) {
	        $PPS.log('getPrinterOffsets reutrned no results.');
	    }else{
	    	offsets.page_offsets.x = results[0].getValue('custrecord_pp_horizontal_page_offest');
	    	offsets.page_offsets.y = results[0].getValue('custrecord_pp_vertical_page_offset');
	    	offsets.micr_offsets.x = results[0].getValue('custrecord_pp_horizontal_micr_offset');
	    	offsets.micr_offsets.y = results[0].getValue('custrecord_pp_vertical_micr_offset');
	    	offsets.printer_name = results[0].getValue('custrecord_pp_printer_name') + "_" + id;
	    }
    }catch(e){
		$PPS.log(e.message);
    }
    
    return offsets;
}
