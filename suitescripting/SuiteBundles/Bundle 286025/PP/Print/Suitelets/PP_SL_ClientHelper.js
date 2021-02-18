/**
 * Module Description
 * 
 * Version    Date            Author      Remarks
 * 2.14.0     28 Jun 2018     johnr       S23663: Add getEntitySubsidiaryIds() to support client scripts
 * 1.00       25 Jun 2013     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
$PPS.debug = true;
$PPS.where = 'PP_SL_ClientHelper.js';
function suitelet(request, response){

	response.setContentType('JAVASCRIPT')
	try{
		var action = request.getParameter('action');
		if(nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_ch_is_public') == 'T'){
			switch(action){
			case 'getACHAccountList':
				var data = JSON.parse(request.getBody());
				getACHAccountList(data);
				break;
			case 'getEntityPaymentMethodSettings':
				var data = JSON.parse(request.getBody());
				getEntityPaymentMethodSettings(data);
				break;
			case 'getRolesSubsidiaryIds':
				var data = JSON.parse(request.getBody());
				getRolesSubsidiaryIds(data);
				break;
			case 'getEntitiesPrimaryACHAccount':
				var data = JSON.parse(request.getBody());
				getEntitiesPrimaryACHAccount(data);
				break;
			case 'getEntitySubsidiaryIds':
				// [S23663] Add getEntitySubsidiaryIds() to support client scripts
				var data = JSON.parse(request.getBody());
				getEntitySubsidiaryIds(data);
				break;
			default:
				throw('Unknown action');
				break;
			}
		}
		else{
			
			//get action
			switch(action){
			case 'setChecksAsPrinted':
				var data = JSON.parse(request.getBody());
				setChecksAsPrinted(data);
				break;
			case 'buildAndSendPaymentJSON':
				var data = JSON.parse(request.getBody());
				buildAndSendPaymentJSON(data);
				break;
			case 'buildAndSendPaymentJSONNow':
				var data = JSON.parse(request.getBody());
				buildAndSendPaymentJSONNow(data);
			default:
				throw('Unknown action');
				break;
			}
		}
		
	}
	catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message}));
	}
}

/*
 * Fires off a scheduled script to set checks and printed
 */
function setChecksAsPrinted(data){
	nlapiSubmitField('customrecord_pp_print_status', data.printStatusListId, 'custrecord_pp_ps_status', 'Pending Set As Printed');
	nlapiScheduleScript("customscript_pp_ss_print_status_update", "customdeploy_pp_ss_print_status_update",{"custscript_jobid": data.printStatusListId});
	response.write(JSON.stringify({success: 'true'}));
}


/*
 * Fires off a scheduled script to buildAndSendPaymentJSON
 */
function buildAndSendPaymentJSON(data){
	//Fire off scheduled script to build payments and write to file
    var status = nlapiScheduleScript("customscript_pp_ss_buildandsendpayment", "customdeploy_pp_ss_buildandsendpayment",
			{ "custscript_pp_print_status_list_id": 		data.printStatusListId
	      	  }
	);
	response.write(JSON.stringify({success: 'true'}));
}



function buildAndSendPaymentJSONNow(requestData){
	/**
	 * Module Description
	 * 
	 * Version    Date            Author           Remarks
	 * 1.00       13 Aug 2013     maxm
	 *
	 */
	var context = nlapiGetContext();
	// get PrintStatusList internalId from parameters
	var printStatusListId = requestData.printStatusListId;
	
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
		
		ppsObj.action =  rec.getFieldValue('custrecord_pp_ps_action') || 'AP';
		
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
	    $PPS.log(data);
	    $PPS.log(data.httpbody);
	    if(data.httpcode == '401'){
	    	job.jobstatus = 'Fail';
	    	job.statusmsg =  "Error: Your AvidXchange Self-Managed account has not been setup or is inactive. "+
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
	}
	catch(e){
		$PPS.log(e);
		nlapiSubmitField('customrecord_pp_print_status', printStatusListId, ['custrecord_pp_ps_status','custrecord_pp_ps_statusmsg'], ['Fail','Job error code NS1'], false);
	}
	
	response.write(JSON.stringify({success: 'true'}));
	return;
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

function getACHAccountList(data){
	var resArr = [];
	var searchResults = $PPS.ACH.getEntitiesACHAccounts(data.entityId,data.depositOrWithdrawal);
	
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var sr =  searchResults[i];
			resArr.push({id: sr.getId(),name: sr.getValue('name'),custrecord_pp_ach_is_primary: sr.getValue('custrecord_pp_ach_is_primary')});
		}
	}
	response.write(JSON.stringify(resArr));
}


function getEntityPaymentMethodSettings(data){
	
	var paymentMethodSettings = $PPS.Transaction.getEntityPaymentMethodSettings(data.entityId,data.accountId,data.depositOrWithdrawal);
	response.write(JSON.stringify(paymentMethodSettings));
	
}


function getRolesSubsidiaryIds(data){
	
	var subsidiaryIds = [];
	var filters = [['internalid','is',data.roleId]];
	var columns = [new nlobjSearchColumn('subsidiaries')];
	var searchResults = nlapiSearchRecord('Role',null,filters,columns);
	
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var subId = searchResults[i].getValue('subsidiaries');
			if(subId || subId === 0){
				subsidiaryIds.push(subId);
			}
		}
	}
	
	response.write(JSON.stringify({subsidiaryIds: subsidiaryIds}));
	
	
}

function getEntitiesPrimaryACHAccount(data){
	var primaryAChAccountId = $PPS.ACH.getEntitiesPrimaryACHAccount(data.entityId,data.depositOrWithdrawal);
	response.write(JSON.stringify(primaryAChAccountId));
}


function getEntitySubsidiaryIds(data){
	// [S23663] Add getEntitySubsidiaryIds() to support client scripts
	// Get an array of the entity's subsidiaries, filtered by subsidiaries available to the user/role
	nlapiLogExecution('DEBUG', 'getEntitySubsidiaryIds','Get an array of the entity\'s subsidiaries');
	var subsidiaryIds = [];
	var entitySubsidiaries = $PPS.Server.getEntitySubsidiaries(data.entityId);
	response.write(JSON.stringify(entitySubsidiaries));
}

