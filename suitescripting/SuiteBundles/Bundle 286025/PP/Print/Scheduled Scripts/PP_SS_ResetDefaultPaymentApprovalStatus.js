/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Feb 2013     Jason Foglia
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * 
 * @scriptParam {String} custscript_paymentids json encoded object mapping numeric transaction internalIds to their types {111: 'VendorPayment', 1231: 'Check'}
 * @scriptParam {String} custscript_changeapproval *required '@none@' or internalId of a custbody_pp_approval_status
 * @scriptParam {String} custscript_set_approver  '@none@' or internalId of a custbody_pp_approval_status
 * @returns {Void}
 * 
 *  Set all payments that do not have an approval status to have an approval status with internalId of 1
 *  nlapiScheduleScript("customscript_pp_ss_resetdefaultpaymentas", "customdeploy_pp_ss_resetdefaultpaymentas",
	    				{ "custscript_paymentids": 		null, 
	    		      	  "custscript_changeapproval": 	'@NONE@',
	    		      	  'custscript_set_approver': 	1
	    		      	  }
	    			);
	    			
	Reset all payments to not have an approval status
 *  nlapiScheduleScript("customscript_pp_ss_resetdefaultpaymentas", "customdeploy_pp_ss_resetdefaultpaymentas",
	    				{ "custscript_paymentids": 		null, 
	    		      	  "custscript_changeapproval": 	null,
	    		      	  'custscript_set_approver': 	'@NONE@'
	    		      	  }
	    			);
 */

$PPS.where = "runProcess";
$PPS.debug = true;

function runProcess(type) {
    $PPS.log("*** Start ***");
    $PPS.log("type: " + type);
    //only execute when run from the scheduler 
    //if (type != 'scheduled' && type != 'skipped') return;

    var context = nlapiGetContext();
    var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');

    // Get the payment id to process all internal ids that correspond
    var paymentids = context.getSetting('SCRIPT', 'custscript_paymentids');
    // Update payments that have an approval status of this type
    var recordtoChange = context.getSetting('SCRIPT', 'custscript_changeapproval');
    // Set payments approval status to this type
    var set_approver = context.getSetting('SCRIPT', 'custscript_set_approver');
    
    if (!set_approver) {
    	throw("Script parameter custscript_set_approver is required.");
    }
    
   
    if ($PPS.isNull(recordtoChange) || $PPS.isUndefined(recordtoChange)) {
    	$PPS.log("Change Approval are empty");
    }

    if ($PPS.IsEmpty(paymentids)) {
        $PPS.log("Payment Ids are empty");

        var filters = [ 
       	    new nlobjSearchFilter("mainline", null, 'is', 'T'),
    	    new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']),
    	    new nlobjSearchFilter('memorized', null, 'is', 'F') // memorized payments will trigger a write exception
    	];
        
        if(accountingPeriodsEnabled){
        	filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
        }
        
        if(recordtoChange){
        	$PPS.log(["custbody_pp_approval_status", null, 'anyof', recordtoChange]);
        	filters.push( new nlobjSearchFilter("custbody_pp_approval_status", null, 'anyof', recordtoChange) );
        }
        
        // Get all results
        var column = new nlobjSearchColumn("internalid");
        column.setSort();
    	var transactionSearch = getAllResults('transaction', filters, [column, new nlobjSearchColumn("memorized")]);
    	
    	// Extract payment ids and recordType
    	if(transactionSearch){
    		paymentids = {};
    		for(var i = 0; i < transactionSearch.length; i++){
    			if(transactionSearch[i]){
    				paymentids[transactionSearch[i].getId()] = transactionSearch[i].getRecordType();
    			}
    		}
    	}
    }else{
    	paymentids = JSON.parse(paymentids);
    }

	if(paymentids){
		
	    $PPS.log({"paymentids":paymentids});
	    $PPS.log("Set Approver: " + set_approver);
	    
	    var fields = ['custbody_pp_approval_status'];
	    var fieldValues = [set_approver];
	    
	    if(set_approver != '@NONE@' && PPSLibApprovals.isApprovedStatus(set_approver)){
	    	fields.push(CAC_IS_APPROVED_ID);
	    	fieldValues.push('T');
	    }
	    
	    var numItems = Object.keys(paymentids).length;
	    for (var l in paymentids) {
	    	
	        //Get the proper record type that corresponds to the internal id expressed as a single character
	        try {
    			
	            var currentUnits = context.getRemainingUsage();
        		try{
        			nlapiSubmitField(paymentids[l], l, fields, fieldValues);
        		}catch(e){
                    $PPS.log("Write record Exception: " + parseError(e).message + " - " + paymentids[l] + " : " + l);
        		}
        		delete paymentids[l];
        		numItems--;
        		
	            var remainingUnits = context.getRemainingUsage();

    			//$PPS.log(remainingUnits);
	            // Check remaining units and re-schedule script if needed. Update record with un-processed internal ids
	            if (remainingUnits <= 100 && numItems > 0) {
	                $PPS.log("Rescheduled");
	                var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), 
	                	{ "custscript_paymentids": 		JSON.stringify(paymentids), 
	                	  "custscript_changeapproval": 	recordtoChange, 
	                	  'custscript_set_approver': 	set_approver});// 20 units
	                if (status == 'QUEUED'){
	                    break;
	                }
	            }
	        } catch (ex) {
	            $PPS.log("Forloop Exception: " + parseError(ex).message);
	        }
	    }
	}else{
	    $PPS.log("Payment ids: " + paymentids);
	}
    $PPS.log("*** End ***");
}

function parseError(e){
	if( e instanceof nlobjError ){
		return {
			'message':e.getDetails(),
			'stack':e.getStackTrace()
		};
	}else{
		return {
			'message':e.message,
			//'stack': (e.stack || e.stacktrace).split("at").join("<br />")
		};
	}
}

function getAllResults(recordType,filters,columns){
	var returnObj =[],
	resultLength = 1000,
	maxID =0,
	loop=0,
	filters = (!filters) ? [] : filters,
	filterLength = filters.length,
	resultObj = [];

	while (resultLength >= 1000){
		loop++;
	
		resultObj = nlapiSearchRecord(recordType,null,filters,columns) || [];
		for (var i in resultObj){
			if(resultObj[i]){
				maxID = resultObj[i].getId();
				returnObj.push( resultObj[i] );
			}
		}
		filters[filterLength] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(maxID));
		resultLength = (resultObj) ? resultObj.length :0;
	}
	return returnObj;
}