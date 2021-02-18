//===========================================================================================================================
// CHANGE HISTORY
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Developer   Story        Date       Description
// AFodor      ATP-254   2018.07.19    Changes to prevent duplicate payments when an exchnage record is submitted twice
//===========================================================================================================================
var wasSuccessful;
function main(type){
	var startDate = new Date();
	var startTime = startDate.getTime();
	var context = nlapiGetContext();
	var batchNumber = context.getSetting('SCRIPT', 'custscript_process_batch_number');

	var governanceRemaining = context.getRemainingUsage();
	var governanceLimit = 500,
	processPayment = null,
	output = null,
	approvalType = '',
	exRecsProcessed = [];

	processPayment = getProcessPaymentRecord(batchNumber);
	//Check that we have enough governance points left to process the approval and there are approvals
	while(governanceRemaining > governanceLimit && processPayment){
		approvalType = processPayment.getValue('custrecord_process_type');
		exRecsProcessed.push(processPayment.getValue('custrecord_processpayment_exrecid'));
		
		//=============================================================================================
		// AFodor - ATP-254 - changes to prevent duplicate payments 
		// Change exchange record status from Payment Processing Queued to Payment Processing
		var exchgId = processPayment.getValue('custrecord_processpayment_exrecid');
    	nlapiSubmitField('customrecord_acq_lot', exchgId, 'custrecord_acq_loth_zzz_zzz_acqstatus', 16, true);
    	var _data = processPayment.getValue('custrecord_process_data');
        wasSuccessful = false;
        nlapiLogExecution('DEBUG', 'Processing Exchange Rcd: ' + exchgId + ',   approvalType:' + approvalType + ',  Data:' + _data);
		var data = { acqStatus:5 };
		if (_data) { data = JSON.parse(_data); }
		var originalExchangeRcdStatus = data.acqStatus;
        if (!originalExchangeRcdStatus) { originalExchangeRcdStatus = 5; nlapiLogExecution('DEBUG', 'Had to default originalExchangeRcdStatus '); }
	    //==============================================================================================

		if(approvalType){
			try{
				//Set to processing since have successfully retrieved the record
				updateProcessPaymentStatus(processPayment, PROCESSSATUS.PROCESSING);
				nlapiLogExecution('DEBUG','SS Line 45 approvalType:' + approvalType);
				switch(approvalType.toLowerCase()){
					case PROCESSTYPE.SINGLE.toLowerCase():
						output = processSingleApproval(processPayment);
						break;
					case PROCESSTYPE.GROUP.toLowerCase():
						output = processSingleApproval(processPayment);
						break;
				}
				
				if(output && output.msg){
					setProcessPaymentError(processPayment, output.msg);
				}
			}
			catch(err){
				nlapiLogExecution('DEBUG','SS Line 60 err.msg:' + err.message);
				//nlapiLogExecution('ERROR', 'Error attempting to retrieve/deserialize the approval data.', '');
				setProcessPaymentError(processPayment, err.toString());
				updateProcessPaymentStatus(processPayment, PROCESSSATUS.FAILED);
			}
		}

	    //=============================================================================================
	    // AFodor - ATP-254 - changes to prevent duplicate payments 
	    // Processing failed, set exchange record status to what it was before Payment Processing
	    nlapiLogExecution('DEBUG','SS Line 70 wasSuccessful:' + wasSuccessful);
        if (!wasSuccessful) {
    	    nlapiSubmitField('customrecord_acq_lot', exchgId, 'custrecord_acq_loth_zzz_zzz_acqstatus', originalExchangeRcdStatus, true);
        }
        else {
            // For now even when the process is successful we will move the status back to what it was, which should be 5
            // There is a desire to eventually move the status on to 6 after successful processing so I am leaving the logic here
            // and adding this else condition. When the processing is modified to move the record to status 6 this else can be removed
    	    nlapiSubmitField('customrecord_acq_lot', exchgId, 'custrecord_acq_loth_zzz_zzz_acqstatus', originalExchangeRcdStatus, true);        
        }
        
	    //=============================================================================================
	    nlapiLogExecution('DEBUG','SS Line 82');
		processPayment = getProcessPaymentRecord(batchNumber);
		nlapiLogExecution('DEBUG','SS Line 84 - processPayment: ' + JSON.stringify(processPayment));
		governanceRemaining = context.getRemainingUsage();
	}
	
	//Reschedule script if we have approvals left.
	if(governanceRemaining <= governanceLimit && processPayment){
		nlapiLogExecution('DEBUG', 'Uh-oh, we have to schedule for batch ' + batchNumber + '!', 'Rescheduling ' + context.getDeploymentId());
		var sched = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), {custscript_process_batch_number: (batchNumber)}); 
	}
	
	processPayment = null;
	approvalType = null;
	context = null;

	checkForDupes();

	var endDate = new Date();
	var endTime = endDate.getTime();
  	nlapiLogExecution('DEBUG', 'SS Process Time for batch number ' + batchNumber, endTime-startTime);
	return output;
	
	//TODO: Handle returning information/clean up
}

function checkForDupes() {
	var mySearch = nlapiLoadSearch('transaction', 'customsearch14610');
	var mySearchRan = mySearch.runSearch();
	var exRecEmail = '',
		resultCount = 0;
	var myColumns = mySearchRan.getColumns();
	if(myColumns != null) {
		for(var i = 0; i < myColumns.length; i++) { // create header in csv
			var endChar = ',';
			if(i == myColumns.length-1) {
				endChar = '\n'
			}
			exRecEmail += myColumns[i].label + endChar;
		}
		mySearchRan.forEachResult(function(searchResult) {
			resultCount++;
			for(var i = 0; i < myColumns.length; i++) { // add data to csv
				var endChar = ',';
				if(i == myColumns.length-1) {
					endChar = '\n'
				}
				var result = searchResult.getText(myColumns[i]) || searchResult.getValue(myColumns[i]);
				exRecEmail += result + endChar;
			}
			return true;
		});
		if(resultCount > 0) {
			var exRecFile = nlapiCreateFile('duplicateRefunds.csv', 'CSV', exRecEmail)
			nlapiSendEmail(747289, nlapiGetUser(), 
				'Alert - Duplicate Acquiom Refund Detected', 
				'See attached file for Exchange Records which have Duplicate Refunds.',
				['analysts@srsacquiom.com', 'meckberg@srsacquiom.com'], null, null,
				exRecFile
			);
			nlapiLogExecution('AUDIT', 'There are duplicates. Sending email.');
		}
	}
}

function processSingleApproval(approval){	
	var _data = approval.getValue('custrecord_process_data'),
		data = {},
		output = {};
	
	if(_data){
		try{
			data = JSON.parse(_data);
			//Short-circuit logic to handle reprocess workflow; this is for voided approvals that are are being approved again
			nlapiLogExecution('DEBUG','SS Line 152 before if(data.reprocess) ');
			if(data.reprocess){
				output = reprocessPaymentApproval(data.id, data.fee || 'false');
			}
			else {
				output = processPaymentApproval(data.id, data.fee || 'false');
			}
			nlapiLogExecution('DEBUG','SS Line 159 after if(data.reprocess) ');
			if(output && output.error){
				if(output.duplicate){
					nlapiLogExecution('DEBUG','SS Line 162 before updateProcessPaymentStatus - Duplicate');
					updateProcessPaymentStatus(approval, PROCESSSATUS.DUPLICATE);
				}
				else{		
					nlapiLogExecution('ERROR', 'ERROR PROCESSING IN processSingleApproval:', JSON.stringify(output.msg));
					updateProcessPaymentStatus(approval, PROCESSSATUS.FAILED);
				}
			}
			else{
				nlapiLogExecution('DEBUG','SS Line 171 before updateProcessPaymentStatus - Success');
				updateProcessPaymentStatus(approval, PROCESSSATUS.SUCCESS);
				wasSuccessful = true; // AFodor - ATP-254 ======================================
			}
			
		}
		catch(err){
			var vDebug = ""; 
		    for(var prop in err) {
		       vDebug += "property: "+ prop+ " value: ["+ err[prop]+ "]\n"; 
		    }
		    vDebug += "toString(): " + " value: [" + err.toString() + "]"; 

			//TODO: Handle error
			nlapiLogExecution('ERROR', 'ERROR PROCESSING IN processSingleApproval GENERAL', vDebug);
			nlapiLogExecution('ERROR', 'ERROR PROCESSING IN processSingleApproval toString', JSON.stringify(err));
			updateProcessPaymentStatus(approval, PROCESSSATUS.FAILED);
		}
	}
	nlapiLogExecution('DEBUG','SS Line 190 before return - output: ' + JSON.stringify(output));
	return output;
}

function processGroupApprovals(approvals){

	var _data = approval.getValue('custrecord_process_data'),
		data = {};
	
	if(_data){
		try{
			data = JSON.parse(_data);
		}
		catch(err){
			//TODO: Handle error
		}
	}
	
	//var output = processPaymentApproval(_data.id);
	
	return {};
}

function processMassApproval(filters){
	nlapiLogExecution('DEBUG', 'Successfully parsed data and now in processing code for mass approval', '');
	//TODO: Process approval here.
}