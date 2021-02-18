function escrowExchangeAcceptance(request,response)
{
    //File cabinet internal id of thank you to be displayed
    var THANK_YOU_FILE_ID = 138879;  //36971  sandbox  - 138879 PROD
    var ERROR_FILE_ID = 138880;  //37173  sandbox - 138880 PROD
	var emailadd    = request.getParameter("email");
	var dealid = request.getParameter("did");
		
    nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'email parameter ' + emailadd);
	nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'deal id parameter ' + dealid);
	try
	{
	if (emailadd == null || emailadd.length == 0)
		{
			nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'No email parameter supplied');
			// get the error file
			var file = nlapiLoadFile(ERROR_FILE_ID).getValue();
			
			// display error
			response.setContentType('HTMLDOC', 'error.html', 'inline');
			response.write(file);
		}
		
	else
		{
			var name = 'EEOnlineResponse' + (Math.floor(Math.random()*1614));
	
			var reg = nlapiCreateRecord('customrecord_escrow_exchange_response');
			reg.setFieldValue('custrecord_ee_response_email',emailadd);
			reg.setFieldValue('name',name);
	
			// check the dealid
			if(dealid != null && dealid.length >= 1)
				{	
					if (!isActualDeal(dealid)) //make sure deal exists
						{
						nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Incorrect deal ID');
						}
					else
						{
						reg.setFieldValue('custrecord_ee_response_deal',dealid); 
						}
				}
				
			else
				{
				nlapiLogExecution('DEBUG', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Null Deal ID');
				}
	
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
	}
		catch (e)
		{
			nlapiLogExecution('ERROR', 'SRSEscrowExchange.escrowExchangeAcceptance', 'Error ' + e);
		}
}


//deal could be an internalid or the name of the deal
function isActualDeal(dealID)
{
	nlapiLogExecution("DEBUG", "SRSEscrowExchangeResponseCapture.isActualDeal", "DealID = " + dealID);
	
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('internalid',null,'anyof',dealID));
	filters.push(new nlobjSearchFilter('category',null,'is',1));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1) return true;		// In this case we should just return what was passed in
	
	if(results == null)
	{
		nlapiLogExecution("DEBUG", "SRSEscrowExchangeResponseCapture.isActualDeal", "results are NULL");
	}
	else
	{
		nlapiLogExecution("DEBUG", "SRSEscrowExchangeResponseCapture.isActualDeal", "results are of length " + results.length);
	}
	
	return false;
}
