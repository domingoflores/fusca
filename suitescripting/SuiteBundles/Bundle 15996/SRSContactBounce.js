function updateBouncedContacts() {
	var context = nlapiGetContext();
	
	var targetResults = null;
	nlapiLogExecution('DEBUG','SRSContactBounce.updateBouncedContacts','Starting...');
	targetResults = nlapiSearchRecord('contact','customsearch_bounced_contacts');
	
	if(targetResults != null && targetResults.length > 0) {
		for(var bn1 = 0; bn1 < targetResults.length; bn1++) {
			var currRecord = nlapiLoadRecord('contact',targetResults[bn1].getValue('internalid',null,'group'));
			nlapiLogExecution('DEBUG','SRSContactBounce.updateBouncedContacts','Setting contact: '+currRecord.getFieldValue('name')+' current status: '+currRecord.getFieldValue('custentity58'));
			currRecord.setFieldValue('custentity58', 3);
			nlapiSubmitRecord(currRecord);
			nlapiLogExecution('DEBUG','SRSContactBounce.updateBouncedContacts','Remaining usage: '+context.getRemainingUsage());
			if ( context.getRemainingUsage() <= 50 ) {
				nlapiLogExecution('DEBUG','SRSContactBounce.updateBouncedContacts','Getting close on remaining usage.  Rescheduling.');
				var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId())
				if ( status == 'QUEUED' )
					break;     
			  }
		}
	} else {
		nlapiLogExecution('DEBUG','SRSContactBounce.updateBouncedContacts','No search results... abort! abort! abort!');
	}
}

