/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Jun 2013     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

$PPS.debug = true;
$PPS.where = 'PP_SL_SetJobStatus';
function suitelet(request, response){
	try{
		var jobId = request.getParameter("jobid");
		var status = request.getParameter("status");
		
		if(!status){
			response.write(JSON.stringify({'success':'false', 'error':'No status parameter was passed'}));
			return;
		}
		
		if(!jobId){
			response.write(JSON.stringify({'success':'false', 'error':'No jobid parameter was passed'}));
		}
		
		//Setup PP SSO URL 
	    var url = $PPS.nlapiOutboundSSO() + "&jobID=" + request.getParameter("jobid");
	    
	    // Request status
	    var data = $PPS.NSRestReq(url, JSON.stringify({status: status}), $PPS.httpVerbs.post);

	    $PPS.log(data.httpbody);
	    var result = JSON.parse(data.httpbody);
	
	    if(result.commandstatus == 'Success'){
	    	if(status == 'Rejected'){
	    		$PPS.log("Setting jobId " + jobId + " status to " + "Rejected");
	    		// update job status
		        var rec = nlapiSearchRecord(
		            'customrecord_pp_print_status',
		            null,
		            [
		                new nlobjSearchFilter("custrecord_pp_ps_jobid", null, "equalto", jobId)
		            ],
		            null);

		        if (rec) {
		            var nrec = nlapiLoadRecord('customrecord_pp_print_status', rec[0].getId());
		            nrec.setFieldValue('custrecord_pp_ps_status', 'Fail');
		            nrec.setFieldValue('custrecord_pp_ps_statusmsg', 'User rejected SPS job');
		            nlapiSubmitRecord(nrec);
		        }
	    	}
	    	response.write(JSON.stringify({'success' : 'true'}));
	    }
	    else{
	    	response.write(JSON.stringify({'success' : 'false', 'error': result.errmsg}));
	    }
	}
	catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message}));
	}
}
