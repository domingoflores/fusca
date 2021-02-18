/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSEmployee.js 
* @ AUTHOR        : Steven C. Buttgereit
* @ DATE          : 2011/12/01
*
* Copyright (c) 2011 Shareholder Representative Services LLC
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function processCustomerSupportEmail() {
	nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Starting processCustomerSupportEmail...');
	// Get a list of the unprocessed emails.
	var filters = new Array(); 
	var columns = new Array();
	var result = null;
	var currentDate = new Date();
	currentDate.setTime(currentDate.getTime()-(65*60*1000));

	filters[0] = new nlobjSearchFilter('recipient',null,'anyof',["21345","268072"]);
	filters[1] = new nlobjSearchFilter('messagedate',null,'onorafter',nlapiDateToString(currentDate));

	columns[0] = new nlobjSearchColumn('internalid');
	columns[1] = new nlobjSearchColumn('cc');
	columns[2] = new nlobjSearchColumn('subject');
	columns[3] = new nlobjSearchColumn('message');
	columns[4] = new nlobjSearchColumn('messagedate');
	columns[5] = new nlobjSearchColumn('authoremail');
	columns[6] = new nlobjSearchColumn('formulanumeric').setFormula("case when length({externalid}) is null or length({externalid}) < 1 then 0 else 1 end");

	result = nlapiSearchRecord('message',null,filters,columns);
    
    if(result != null) {
    	nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Found '+result.length+' messages to process.');
		for(var i = 0; i < result.length; i++) {
			// First, get the message in full.
			var currEmailMessage = result[i];
			var currEmailRecord = nlapiLoadRecord('message',currEmailMessage.getId());
			var currContactId = getContactByEmail(currEmailMessage.getValue('authoremail')); //Call to SRSContactCustomerUtis.js
			var currContactCompanyId = null;
			nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Processing message: '+i+'/message internalid: '+currEmailMessage.getId());
			if (currContactId != null) {
				currContactCompanyId = getPrimaryCompanyByContact(currContactId); //Call to SRSContactCustomerUtis.js
			}
			
			if(currContactCompanyId == null || currContactCompanyId == '') {
				nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Current Contact Value: '+currContactCompanyId);
				currContactCompanyId = 1;
			}
			
			// Create new case object from the unprocessed email
			nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Create new case.');
			var targetCase = new nlapiCreateRecord('supportcase');
			targetCase.setFieldValue('company',currContactCompanyId);
			targetCase.setFieldValue('customform','56');
			targetCase.setFieldValue('inboundemail','support@shareholderrep.com');
			
			// Code in a reference to the prior message.
			var targetCaseMessage = currEmailMessage.getValue('message');
			targetCase.setFieldValue('incomingmessage',targetCaseMessage);
			nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Before Case Incident Date');
	        //Try to handle the date stuff within the tolerances of the system.
			var tempMessageDate = nlapiStringToDate(currEmailMessage.getValue('messagedate'));
			var disMonth = tempMessageDate.getMonth();
			disMonth++;
			var targetCaseDate = disMonth + '/' + tempMessageDate.getDate() + '/' + tempMessageDate.getFullYear();
			//Handle case creation if no subject is entered
                       var targetCaseSubject = currEmailMessage.getValue('subject');
                       if (currEmailMessage.getValue('subject') == null || currEmailMessage.getValue('subject') == '') {
		                targetCaseSubject = 'No Subject Line';
		            }
                        nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Case Subject = ' + targetCaseSubject);
			nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Parsed date, now try to set the case accordingly.');
			targetCase.setFieldValue('startdate',targetCaseDate);
			nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','After Case Incident Date');

			targetCase.setFieldValue('title', targetCaseSubject);
			targetCase.setFieldValue('email',currEmailMessage.getValue('authoremail'));
			var newCaseId = nlapiSubmitRecord(targetCase);	
		}
    }
    nlapiLogExecution('DEBUG','SRSEmployee.processCustomerSupportEmail','Finished Processing.');
}
