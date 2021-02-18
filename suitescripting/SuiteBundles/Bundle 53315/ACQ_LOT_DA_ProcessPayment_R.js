//TODO: Code to process post data for payment approvals.

function post(data){
	if(!data || !data.type){
		return { status: 'error', message: 'No data or no data.type field' };
	}
	var _output = createProcessPayment(data);
	nlapiLogExecution('DEBUG', 'Completed RESTlet');
	return { output: _output, inputs: data };
}

function get(data){
	
	/*if(data['type']){
		switch(type.toLowerCase()){
			case 'single':
				return getApproval(data['id']);
				break;
			case 'group':
				return getApprovals();
				break;
			case 'mass':
				return getAllApprovals();
		}
	}*/
	
	return {};
}

function createProcessPayment(data){
	var output = [],
		processid = -1,
		process = null;

	//var QUEUES = [1,2,3,4,5,6,7,8,9,10]; // A CONSTANT - all the queues dedicated to payments processing
	var QUEUES = 10;
	var batchNumber;

	if(data && data.data){
		if(data.type == 'SINGLE') {
			var dataArray = [data.data];
			data.data = dataArray;
			batchNumber = Math.floor(Math.random() * 10 + 1);
		} else {
			batchNumber = 1;
		}
		for(var i = 0; i < data.data.length; i++) {
			try {
				process = nlapiCreateRecord('customrecord_paymentprocess');

				process.setFieldValue('custrecord_process_status', PROCESSSATUS.QUEUED);
				process.setFieldValue('custrecord_processpayment_exrecid', data.data[i].id);
				process.setFieldValue('custrecord_process_batch_number', batchNumber);
				process.setFieldValue('custrecord_process_type', data.type || PROCESSSATUS.NOTSUPPLIED);
				process.setFieldValue('custrecord_process_uid', data.userid || -4);//-4 because that is what NetSuite returns if no user.
				process.setFieldValue('custrecord_process_data', JSON.stringify(data.data[i]));

				processid = nlapiSubmitRecord(process);

				output.push({processid: processid, success: 'success'});
				
				processid = -1;
				process = null;
				batchNumber++;
				if(batchNumber > QUEUES) {
					batchNumber = 1;
				}
			}
			catch(err){
				nlapiLogExecution('ERROR', 'ERROR CREATING PROCESSPAYMENT RECORD (IGNORE)', JSON.stringify(err));
				output.push({processid: processid, fail: 'fail'});
			}
		}
		return output;
	}
}

// //DEPRECATED: NO LONGER VALID FOR WORKFLOW
// function scheduleApproval(output, processpaymentID){
// 	//Init to -1 to indicate failure to schedule task; override if successful in create schedule.
// 	output.scheduleid = -1;
	
// 	var scheduleScriptID = 'customscript_process_payment_sched';
	
// 	//Schedule our script if we have valid ProcessPayment object
// 	if(output && output.success){
// 		var sched = nlapiScheduleScript(scheduleScriptID, null, {custscript_process_payment_id: processpaymentID});
// 		output.scheduleid = sched;
// 	}
// }


// //Creates a ProcessPayment based on the type of approval submitted.
// function createProcessPayment(data){
// 	var status = {};
	
// 	switch(data.type.toLowerCase()){
// 		case PROCESSTYPE.SINGLE.toLowerCase():
// 			status = createSingleProcessPayment(data);
// 			break;
// 		case PROCESSTYPE.GROUP.toLowerCase():
// 			status = createGroupProcessPayment(data);
// 			break;
// 	}
// 	return status;
// }

// //Creates a ProcessPayment object for an individual approval
// function createSingleProcessPayment(data){
// 	var output = {},
// 		processid = -1;
	
// 	try{
// 		var process = nlapiCreateRecord('customrecord_paymentprocess');
		
// 		process.setFieldValue('custrecord_process_type', data.type || PROCESSSATUS.NOTSUPPLIED);
// 		process.setFieldValue('custrecord_process_uid', data.userid || -4);//-4 because that is what NetSuite returns if no user.
// 		process.setFieldValue('custrecord_processpayment_exrecid', data.data.id);
// 		process.setFieldValue('custrecord_process_data', JSON.stringify(data.data) || '{}');
// 		process.setFieldValue('custrecord_process_status', PROCESSSATUS.QUEUED);
		
// 		processid = nlapiSubmitRecord(process);
		
// 		output.processid = processid;
// 		output.success = 'success';
// 	}
// 	catch(err){
// 		nlapiLogExecution('ERROR', 'Error creating/submitting record', err);
// 		output.processid = processid;
// 		output.fail = 'fail';
// 	}
	
// 	return output;
// }

// function createGroupProcessPayment(data){
// 	var output = [],
// 		processid = -1,
// 		process = null;
	
// 	//nlapiLogExecution('DEBUG', 'data is: ', JSON.stringify(data));
	
// 	if(data && data.data && data.data.length){
// 		nlapiLogExecution('ERROR', data.data.length, data.data.length);
// 		for(var i=0; i<data.data.length; i++){
// 			try{
// 				process = nlapiCreateRecord('customrecord_paymentprocess');

// 				process.setFieldValue('custrecord_process_type', data.type || PROCESSSATUS.NOTSUPPLIED);
// 				process.setFieldValue('custrecord_process_uid', data.userid || -4);//-4 because that is what NetSuite returns if no user.
// 				process.setFieldValue('custrecord_processpayment_exrecid', data.data[i].id);
// 				process.setFieldValue('custrecord_process_data', JSON.stringify(data.data[i]));
// 				process.setFieldValue('custrecord_process_status', PROCESSSATUS.QUEUED);
				
// 				processid = nlapiSubmitRecord(process);

// 				output.push({processid: processid, success: 'success'});
				
// 				processid = -1;
// 				process = null
// 			}
// 			catch(err){
// 				nlapiLogExecution('ERROR', 'ERROR CREATING PROCESSPAYMENT RECORD (IGNORE)', JSON.stringify(err));
// 				output.push({processid: processid, fail: 'fail'});
// 			}
// 		}
// 	}
	
// 	return output;
// }


/*
 * Get methods
 */

function getApproval(exrecid){
	//TODO: Return the paymentprocess for a given exchange record if it exists.
	return [{ type: PROCESSTYPE.SINGLE, exrec: exrecid, status: PROCESSTYPE.QUEUED}];
}

function getApprovals(){
	//TODO: Return all paymentprocesses for grouped payments
	return [{ type: PROCESSTYPE.GROUP, status: PROCESSSATUS.QUEUED, data: 'somestring of data1'}, { status: PROCESSSATUS.QUEUED, data: 'somestring of data2'}]
}

function getAllApprovals(){
	//TODO: Return all mass paymentprocess records
	return [{ type: PROCESSTYPE.MASS, status: 'PROCESSING', data: 'some filter data or soemthing'}];
}

function getProcessPaymentFilters(){
	return [['custrecord_processpayment_status', 'is', PROCESSSATUS.QUEUED], 'or', ['custrecord_processpayment_status', 'is', PROCESSSATUS.PROCESSING]];
}

//ProcessPayment retrieval code
function getProcessPaymentColumns(){
	var columns = [];
	
	columns.push(new nlobjSearchColumn('custrecord_processpayment_status'));
	columns.push(new nlobjSearchColumn('custrecord_processpayment_modify'));
	columns.push(new nlobjSearchColumn('custrecord_processpayment_create'));
	columns.push(new nlobjSearchColumn('custrecord_processpayment_data'));
	columns.push(new nlobjSearchColumn('custrecord_processpayment_uid'));
	
	return columns;
}

function getActiveQueuedPaymentProcesses(){
	var paymentProcesses = nlapiSearchRecord('customrecord_acq_lot_processpayment', null, getProcessPaymentFilters(), getProcessPaymentColumns());
	
	if(!paymentProcesses || paymentProcesses.length == 0){ return null; }
	
	return paymentProcesses;
}

function mapPostToJSON(post){
	if(!post){ return {}; }
	
	var data = {};
	
	//TODO: Map POST data to JSON object for easier consumption;
	
	return data; 
}