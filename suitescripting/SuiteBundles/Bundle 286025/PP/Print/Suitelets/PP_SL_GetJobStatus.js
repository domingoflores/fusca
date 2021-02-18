/**
 * @author Jay
 * 10/1/2012 9:21:58 AM
*/
$PPS.debug = true;
var recType = 'customrecord_pp_print_status';
var date = nlapiDateToString(new Date(), 'datetimetz');

function setData(_rec, job) {
    try {
        //_rec.setFieldValue("custrecord_pp_ps_jobid", job.jobid);
        //_rec.setFieldValue("custrecord_pp_ps_status_date", date);
        _rec.setFieldValue("custrecord_pp_ps_status", job.jobstatus.toString());
        //_rec.setFieldValue("custrecord_pp_ps_itemsprinted", job.itemsprinted);
        //_rec.setFieldValue("custrecord_pp_ps_itemcount", job.itemcount);
        //_rec.setFieldValue("custrecord_pp_ps_fileurl", job.fileurl.toString());
        //_rec.setFieldValue("custrecord_pp_ps_internal_ids", JSON.stringify(job.internal_ids));
        //_rec.setFieldValue("custrecord_pp_ps_internal_ids_processing", JSON.stringify(job.internal_ids));
        nlapiSubmitRecord(_rec);
    } catch (e) {
        $PPS.log(e);
    }
}

var o = 1;
function PP_SL_GetJobStatus(request, response) {
    $PPS.where = "PP_SL_GetJobStatus";
    $PPS.log("*** Start ***");
    
    response.setContentType('JAVASCRIPT');
    try {
    	var jobid = request.getParameter("jobid");
    	var printStatusListId = request.getParameter("printStatusListId");
    	var output = {};
    	
    	if(jobid != ""){
    		output = getStatusFromPPS(jobid);
        }
    	else if(printStatusListId != ""){
    		output = getStatusFromNS(printStatusListId);
    	}
    	else{
    	    output = { error: "Missing Job Id or Print Status List ID!" };
    	    return false;
    	}
    	$PPS.log("*** Output response as JSON ***");
    	response.write(JSON.stringify(output));

    } catch (e) {
        $PPS.log(e);
    }
    $PPS.log("*** End ***");
}


function getStatusFromNS(printStatusListId){
	var job = {
	    jobid: null,
	    jobstatus: "",
	    statusmsg: "",
	};
	
	// get status and fileId
	var fields = nlapiLookupField('customrecord_pp_print_status',printStatusListId,['custrecord_pp_ps_status','custrecord_pp_ps_statusmsg','custrecord_pp_ps_jobid']);
	
	job.jobstatus = fields.custrecord_pp_ps_status;
	job.jobid = fields.custrecord_pp_ps_jobid;
	switch(fields.custrecord_pp_ps_status){
	case 'Fail':
		job.statusmsg = fields.custrecord_pp_ps_statusmsg;
		break;
	case 'Scheduled':
		job.statusmsg = 'Waiting for scheduled script to execute.';
		break;
	case 'Executing':
		job.statusmsg = 'Collecting payment information from NetSuite';
		break;
	}
	
	return job;
}

function getStatusFromPPS(jobid){
	//Setup default status object
    var job = {
        jobid: request.getParameter("jobid"),
        achcount: 0,
        itemcount: 0,
        jobstatus: "",
        statusmsg: "",
        warning_msg: "",
        fileurl: "",
        overflowcount: 0,
        voidcount: 0,
        totalamount: "0",
        internal_ids: [],
        file_download: 1,
        
    };

    //Setup PP SSO URL 
    var url = $PPS.nlapiOutboundSSO() + "&jobID=" + job.jobid;

    // Request status
    var data = $PPS.NSRestReq(url, null, $PPS.httpVerbs.get);

    var body, printjobstatus;
    var body = JSON.parse(data.httpbody);
    
    if(body.commandstatus != "Success"){
    	return { error: body.errmsg };
    }
    
    $PPS.log("*** Input from PPS ***");
    $PPS.log(body);

    printjobstatus = body.printjobstatus;

    var reqFileUrl = nlapiResolveURL('SUITELET', 'customscript_pp_sl_filedownloadproxy', 'customdeploy_pp_sl_filedownloadproxy');
    
    try {
        // Parse request data
        job.achcount = isNaN(printjobstatus.ach_count) ? 0 : Number(printjobstatus.ach_count);
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.itemcount = isNaN(printjobstatus.item_count) ? 0 : Number(printjobstatus.item_count);
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.jobstatus = printjobstatus.status;
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.statusmsg = printjobstatus.status_msg;  
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.warning_msg = printjobstatus.warning_msg;  
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.fileurl = reqFileUrl + "&id=" + job.jobid;//printjobstatus.fileurl;
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.overflowcount = isNaN(printjobstatus.overflow_count) ? 0 : Number(printjobstatus.overflow_count);
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.voidcount = isNaN(printjobstatus.void_count) ? 0 : Number(printjobstatus.void_count);
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.file_download = isNaN(printjobstatus.file_download) ? 1 : Number(printjobstatus.file_download);
    } catch (e) {
        $PPS.log(e);
    }
    try {
        job.totalamount = isNaN(printjobstatus.total_amount) ? 0 : Number(printjobstatus.total_amount);
    } catch (e) {
        $PPS.log(e);
    }
    
    try {
        if ($PPS.isObject(printjobstatus.internal_ids))
            job.internal_ids = printjobstatus.internal_ids;
    } catch (e) {
        $PPS.log(e);
    }
    
    // Log our parsed data
    $PPS.log("<pre>" + JSON.stringify(job, null, "\t") + "</pre>");

    // **** Search our status record to make sure we're not doubling our records 
    // update job status
    var rec = nlapiSearchRecord(
        recType,
        null,
        [
            new nlobjSearchFilter("custrecord_pp_ps_jobid", null, "equalto", job.jobid)
        ],
        null);

    if (rec) {
    	$PPS.log('Found record with jobid ' + job.jobid + ' Setting status to ' + job.jobstatus + ". Rec Id = " + rec[0].getId());
        var nrec = nlapiLoadRecord(recType, rec[0].getId());
        setData(nrec, job);
    }
    
    return job;
}