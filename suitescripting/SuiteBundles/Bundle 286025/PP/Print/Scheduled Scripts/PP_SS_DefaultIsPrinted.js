/**
 * Set custbody_pp_is_printed to true and custbody_pp_payment_method to 'Check' for all payments that have been printed by native NetSuite.
 * A check is assumed printed in native NetSuite if the tobeprinted flag is false.
 * 
 * Note: To be run on bundle install.
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Mar 2013     maxm
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */

$PPS.where = "runProcess";
$PPS.debug = true;

function runProcess(type) {
    $PPS.log("*** Start ***");
    $PPS.log("type: " + type);

    var context = nlapiGetContext();
    var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');

    // Get the payment id to process all internal ids that correspond
    var paymentids = context.getSetting('SCRIPT', 'custscript_paymentids2');
    
    if (!paymentids) {
        $PPS.log("Payment Ids are empty");

        var filters = [ 
       	    new nlobjSearchFilter("mainline", null, 'is', 'T'),
    	    new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']),
    	    new nlobjSearchFilter('tobeprinted', null, 'is', "F"),
    	    new nlobjSearchFilter('memorized', null, 'is', "F")
    	];
        
        if(accountingPeriodsEnabled){
        	filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
        }
        
        var column = new nlobjSearchColumn("internalid");
        column.setSort();
    	var transactionSearch = getAllResults('transaction', filters, [column]);
    	$PPS.log("Num Transactions: " + transactionSearch.length);
    	if(transactionSearch){
    		paymentids = {};
    		for(var i = transactionSearch.length; i >= 0; i--){
    			if(transactionSearch[i]){
    				paymentids[transactionSearch[i].getId()] = transactionSearch[i].getRecordType();
    			}
    		}
    	}
    }else{
    	paymentids = JSON.parse(paymentids);
    }
    
    var paymentMethodList = $PPS.nlapiGetList('customrecord_pp_payment_methods');
    var defaultPaymentMethod = paymentMethodList.getKey('Check');
    
	if(paymentids){
		
		var numItems = Object.keys(paymentids).length;
	    // loop through the internal ids 
	    for (var l in paymentids) {
	    	if(parseInt(l) == 2){
	    		$PPS.log("Writing payment id = 2, type = " + paymentids[l]);
	    	}
	        //Get the proper record type that corresponds to the internal id expressed as a single character
	        try {
    			
        		try{
        			nlapiSubmitField(paymentids[l], l, ['custbody_pp_is_printed','custbody_pp_payment_method'], ['T',defaultPaymentMethod]);
        		}catch(e){
                    $PPS.log("Write record Exception: " + parseError(e).message + " - " + paymentids[l] + " : " + l);
        		}
        		delete paymentids[l];
        		numItems--;
        		
	            var remainingUnits = context.getRemainingUsage();

    			//$PPS.log(remainingUnits);
    			//$PPS.log("numItems " + numItems);
	            // Check remaining units and re-schedule script if needed. Update record with un-processed internal ids
	            if (remainingUnits <= 100 && numItems > 0) {
	                $PPS.log("Rescheduled");
	                var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), 
	                	{ "custscript_paymentids2": 		JSON.stringify(paymentids)
	                	  });// 20 units
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

/*
 * Get around 1000 max results per search.
 */
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
