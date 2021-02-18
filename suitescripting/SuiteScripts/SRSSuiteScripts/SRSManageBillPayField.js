function onBeforeLoad(type,form,request)
{

      nlapiLogExecution('DEBUG', 'SRSManageBillPay.onBeforeLoad', 'View Type: ' + type);
	 
	
	 if(type == 'create') //only run if new
		{
		 try
		 {
		 nlapiLogExecution('AUDIT', 'SRSManageBillPay.onBeforeLoad', 'Setting BillPay = False');
		 nlapiSetFieldValue('billpay', 'F', null, true);
		 }
		 catch(e)
		 {
			  nlapiLogExecution('DEBUG', 'SRSManageBillPay.onBeforeLoad', 'Error: ' + e);
			  throw e;
		 }
		}

	 else
		 {
		 nlapiLogExecution('DEBUG', 'SRSManageBillPay.onBeforeLoad', 'View type is not create.');
		 }
	 
	 nlapiLogExecution('DEBUG', 'SRSManageBillPay.onBeforeLoad', 'Finished processing onBeforeLoad');
}

