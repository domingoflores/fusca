function afterSubmitCreate(type, form, request){

	if(type == 'create'){
		var paymentProcessRecord = nlapiGetNewRecord();
		var batchNumber = paymentProcessRecord.getFieldValue('custrecord_process_batch_number');
		var deploymentID = 'customdeploy_acq_lot_processpayment_dp' + batchNumber;

		try{
			var sched = nlapiScheduleScript('customscript_process_payment_sched', deploymentID, {custscript_process_batch_number: batchNumber});
          	
			sched = (!sched) ? 'scheduled' : sched;
			// nlapiScheduleScript call can return false negative (null value)

			if(sched.toUpperCase() != "SCHEDULED"){
				//The call to schedule failed because it was already scheduled in the queue or is executing
				nlapiLogExecution('DEBUG', 'nlapiScheduleScript() in Process Payment UE returned with: ', sched);
			}
		}
		catch(err){
			nlapiLogExecution('ERROR', 'Error attempting to schedule the Process Payment script in the User Event script', JSON.stringify(err));
		}
	}
}