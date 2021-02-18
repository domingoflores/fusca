function escrowExchangeAcceptance(request,response)
{
    //File cabinet internal id of thank you to be displayed
    var THANK_YOU_FILE_ID = 138879;
    var ERROR_FILE_ID = 138880;
	var emailadd    = request.getParameter("email");
	var dealid = request.getParameter("did");
		
    nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'email parameter ' + emailadd);
	nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'deal id parameter ' + dealid);
	if (emailadd == null || emailadd.length == 0)
	try
	{
	nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'No email parameter supplied');
		// get the error file
	var file = nlapiLoadFile(ERROR_FILE_ID).getValue();
	
	// display error
	response.setContentType('HTMLDOC', 'error.html', 'inline');
	response.write(file);
	}
	catch (e)
	{
	nlapiLogExecution('ERROR', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Error ' + e);
	}
	else if (dealid == null || dealid.length == 0)
	try
	{
	nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'No deal id parameter supplied');
		// get the error file
	var file = nlapiLoadFile(ERROR_FILE_ID).getValue();
	
	// display error
	response.setContentType('HTMLDOC', 'error.html', 'inline');
	response.write(file);
	}
	catch (e)
	{
	nlapiLogExecution('ERROR', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Error ' + e);
	}
	
	else
	try
	{
	var name = 'EEOnlineResponse' + (Math.floor(Math.random()*1614));
	// create the escrow exchange record
	var reg = nlapiCreateRecord('customrecord_escrow_exchange_response');
		reg.setFieldValue('custrecord_ee_response_email',emailadd);
		reg.setFieldValue('custrecord_ee_response_deal',dealid); 
		reg.setFieldValue('name',name);
	
	nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Begin record submit');
	var id = nlapiSubmitRecord(reg, false, false);
	
	nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'End record submit');
	nlapiLogExecution('DEBUG', 'SRSEscrowExchangeID', 'escrow exchange id = ' + id);
	
	// get the thank you file
	var file = nlapiLoadFile(THANK_YOU_FILE_ID).getValue();
	
	// display thank you
	response.setContentType('HTMLDOC', 'thankyou.html', 'inline');
	response.write(file);
}
	catch (e)
	{
	nlapiLogExecution('ERROR', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Error ' + e);
	}
}
