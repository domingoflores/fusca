/**
 * @author Jay
 * 12/3/2012 9:05:50 PM
 *
 * Script outside of the loop takes 40 units to execute and inside the loop takes x units / inside the loop there is 9960 units allowed 
*/

$PPS.where = "processPrintedChecks";
$PPS.debug = true;

function processPrintedChecks(type) {
    $PPS.log("*** Start ***");
    $PPS.log("type: " + type);
    //only execute when run from the scheduler 
    //if (type != 'scheduled' && type != 'skipped') return;

    var context = nlapiGetContext();

    // Get the job id to process all internal ids that corresponde to checks/vendorpayment/customerrefund
    var jobid = context.getSetting('SCRIPT', 'custscript_jobid');
    if ($PPS.IsEmpty(jobid)) {
        $PPS.log("Job ID is empty");
        return;
    }
    
    nlapiSubmitField('customrecord_pp_print_status', jobid, 'custrecord_pp_ps_status', 'Setting As Printed');

    var jobStatusRec;
    try{
    	jobStatusRec = nlapiLoadRecord('customrecord_pp_print_status',jobid);
    }
    catch(e){
    	$PPS.log(e);
        return;
    }
  

    try {
        // get the internal ids
    	var internalIds = jobStatusRec.getFieldValue('custrecord_pp_ps_internal_ids_processing');
        if ($PPS.IsEmpty(internalIds)) {
            $PPS.log("Internal Ids empty");
            return;
        }

        $PPS.log(internalIds);
        var internal = {};
        try{
            internal = JSON.parse(internalIds);
            if ($PPS.IsEmpty(internal))
                return;
        } catch (e) {
            $PPS.log(e);
            return;
        }

        // loop through the internal ids and mark a check box that says we printed this transaction
        $PPS.log(internal);
        var keys = Object.keys(internal);
        var numItems = keys.length;
        for(var i = 0; i < keys.length; i++ ){
        	var l = keys[i];
        	$PPS.log("type " + internal[l]);
            //Get the proper record type that correspondes to the internal id expressed as a single character
            var _type = $PPS.Transaction.convertToType(internal[l]);
            try {

                nlapiSubmitField(_type, l, 'custbody_pp_is_printed', 'T');// 10 units // Should be able to handle 996 executions 10/9960
                /*var r = nlapiLoadRecord(_type, l);
                r.setFieldValue('custbody_pp_is_printed', 'T');
                nlapiSubmitRecord(r);*/
            	
            	delete internal[l];// Reduce internal ids
                numItems--;

                var remainingUnits = context.getRemainingUsage();

                if (remainingUnits < 100 && remainingUnits > 80) {
                    $PPS.log("Units are below 100 ");
                }

                // Check remaining units and re-schedule script if needed. Update record with un-processed internal ids
                if (remainingUnits <= 80 && numItems > 0) {
                    try{
                        setField(jobid, internal);// 10
                    } catch (e) {
                        $PPS.log(e);
                        break;
                    } finally {
                        var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), { "custscript_jobid": jobid });// 20 units // 20
                        if (status == 'QUEUED')
                            break;
                    }
                }
            } catch (e) {
                // if for some reason we run into an issue lets record the internal ids that have not been processed yet
                setField(jobid, internal);// 10
                $PPS.log(e);
            }
        }
        
        $PPS.log('Setting jobid ' + jobid + ' as complete');
        nlapiSubmitField('customrecord_pp_print_status', jobid, ['custrecord_pp_ps_status'],['Complete']);
        
        // Check to see if any jobs are scheduled. Get oldest job and reschedule for execution
	    // We have to do this because NetSuite will only let us schedule the deployment if it is not scheduled.
	    var filters = [
	                   new nlobjSearchFilter('custrecord_pp_ps_status',null,'is','Pending Set As Printed'),
	                   new nlobjSearchFilter('custrecord_pp_ps_status_date', null, 'within', 'today'),
	                   new nlobjSearchFilter('internalid', null, 'noneof', [jobid])
	                   ];
	    var columns = [
	                   new nlobjSearchColumn('internalid').setSort(false)
	                 ];
	    var searchResults = nlapiSearchRecord('customrecord_pp_print_status', null, filters, columns);
	    if(searchResults){
	    	$PPS.log('Another job was found. ReScheduling script with status list id ' + searchResults[0].getId());
	    	 // query the customrecord_pp_print_status for Scheduled jobs, if we find one reschedule script
		    var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), 
	            	{ "custscript_jobid": 		searchResults[0].getId()
	            	  });
		    $PPS.log('Status of script '+ status);
	    }
	    
    } catch (e) {
        $PPS.log(e);
        return;
    }
    $PPS.log("*** End ***");
}

function setField(id, ids) {
    nlapiSubmitField('customrecord_pp_print_status', id, 'custrecord_pp_ps_internal_ids_processing', JSON.stringify(ids));// 10 units 
}