function autoinvpay(billid)
{

//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Client Script - Now lets generate an Invoice and Pay it as well

//First create the Invoice
alert('Begin AutoInvoice')
//console.log("Ken 1")

var billrec = nlapiLoadRecord('vendorbill', billid)
var vendor = billrec.getFieldValue('entity')
var totalbill = 0
var size = billrec.getLineItemCount('expense')

var update = false
//alert('BillId ' + billid)

for(x=1;x<=size;x++)
{
//	var tranrec = nlapiCreateRecord('invoice', {recordmode: 'dynamic'})
//alert('Here3 ' + billrec.getLineItemValue('expense', 'customer', x))

	var tranrec = nlapiTransformRecord('customer', billrec.getLineItemValue('expense', 'customer', x), 'invoice', {recordmode: 'dynamic'});

	tranrec.setFieldValue('entity', billrec.getLineItemValue('expense', 'customer', x) )

       //alert('Here3a ' + size + ' ' +  tranrec)

	var size_exp = tranrec.getLineItemCount('expcost')
	for(y=1;y<=size_exp;y++)
	{
		if (tranrec.getLineItemValue('expcost', 'doc', y) == billid)
		{
			//alert('Line Check ' + y)

			tranrec.selectLineItem('expcost', y)
			tranrec.setCurrentLineItemValue('expcost', 'apply', 'T')
			tranrec.setCurrentLineItemValue('expcost', 'amount', billrec.getLineItemValue('expense', 'amount', x))
			totalbill = Number(totalbill) + billrec.getLineItemValue('expense', 'amount', x)
			var department = billrec.getLineItemValue('expense', 'department', x)
			tranrec.setFieldValue('department', billrec.getLineItemValue('expense', 'department', x))

                        // **** The following couple of lines was commented out and replaced by Ken Crossman 2016-09-14
                        // The reason is because we recently hid the Class field in all transaction lines so that it inherits its value from the Class in the body
                        // But that means that the Class has a null value in the lines and cannot be used

			//var entity = billrec.getLineItemValue('expense', 'class', x)
			//tranrec.setFieldValue('class', billrec.getLineItemValue('expense', 'class', x))
			tranrec.setFieldValue('class',billrec.getFieldValue('class'))

			nlapiCommitLineItem('expcost')
			update = true

		}
	}
        //alert('OK To Create Invoice? ' + update)

     // Get the Class used in the bill and load it. Check to see that it has an AR account associated with it.   
    var classid = billrec.getFieldValue('class');
    var classrec = nlapiLoadRecord('classification', classid);
    if (classrec.getFieldValue('custrecord_ar_account') == null)
    {	
    	alert ('Entity(Class) from Bill has no AR Account. \n \n Entity(Class) = ' + classid)
		update = false
	} 

	var depbal = nlapiLookupField('customer', billrec.getLineItemValue('expense', 'customer', x), 'depositbalance')
	if (Number(depbal) < Number(totalbill) )
	{
		alert ('Insufficient Funds On Deposit To Apply Payment \n \n Current Deposits= ' + depbal)
		update = false

	}

	if (update == true)
	{
      // The following line was commented out by Ken Crossman 2016-09-16 in order to derive the AR Account from the Entity         // (Class) table instead of hardcoding the AR Account here.

      //tranrec.setFieldValue('account', 336) //Accounts Receivable - Due from Client Cash
       
        tranrec.setFieldValue('account', classrec.getFieldValue('custrecord_ar_account'));

		tranrec.setFieldValue('custbody_related_cases_for_po', billrec.getFieldValue('custbody_related_cases_for_po'))
		tranrec.setFieldValue('custbody_aeinvoiceno', billrec.getFieldValue('tranid'))
		tranrec.setFieldValue('memo', billrec.getFieldValue('memo'))

		var trandate = billrec.getFieldValue('trandate')
		tranrec.setFieldValue('trandate', trandate, false)

		//Go get period if open
		//This code has been modified by Ken Crossman to set the Invoice period to the period of the Bill unlesss that period is AR Locked
		// In which case the first non-AR Locked Period is used
		var startdate=new Date(trandate);
		startdate.setDate(1);
		startdate = nlapiDateToString(startdate)
		var filter_per = new Array();
		//filter_per[0] = new nlobjSearchFilter('startdate', null, 'on', startdate);
		filter_per[0] = new nlobjSearchFilter('startdate', null, 'onOrAfter', startdate);
		filter_per[1] = new nlobjSearchFilter('isquarter', null, 'is', 'F');
		filter_per[2] = new nlobjSearchFilter('isyear', null, 'is', 'F');
		filter_per[3] = new nlobjSearchFilter('arLocked', null, 'is', 'F');

		// Sorting the search results by ascending Start Date
		var column_per = new Array();
		column_per[0] = new nlobjSearchColumn('startdate');
		column_per[1] = column_per[0].setSort();

		//var results_per = nlapiSearchRecord('accountingperiod', null, filter_per, null);
		var results_per = nlapiSearchRecord('accountingperiod', null, filter_per, column_per);

		if (results_per != null)
		{
			tranrec.setFieldValue('postingperiod', results_per[0].getId(), false)
		}


		var invid = nlapiSubmitRecord(tranrec, true)


		var newtran = nlapiLookupField('invoice', invid, 'tranid')
		alert('New Invoice Created - ' + newtran)

		//Create the Open Payment URL in case we need it
		var environment = nlapiGetContext().getEnvironment()
		var environment_url
		if(environment == "PRODUCTION")
			environment_url = "https://system.na2.netsuite.com"
		else if(environment == "SANDBOX")
			// Next line replaced by Ken 2016-11-10
			//environment_url = "https://debugger.sandbox.netsuite.com"
			environment_url = "https://system.sandbox.netsuite.com"
		else if(environment == "BETA")
			environment_url == "https://system.beta.netsuite.com"
		var customer = billrec.getLineItemValue('expense', 'customer', x)

		var paymenturl = environment_url + '/app/accounting/transactions/custpymt.nl?entity=' + customer + '&inv=' + invid +
			'&currency=1&billid=' + billid + '&customer=' + customer + '&autoinv=T'
		//alert ('Url88=' + paymenturl)
		window.location = paymenturl


// This next chunk of code is commented out
//************************************************************************************************************************************

/*		//Let's see if there are any Deposits waiting
		var paymentrec = nlapiTransformRecord('invoice', invid, 'customerpayment', {recordmode: 'dynamic'});
		//payment.setFieldValue('aracct', 336)
		paymentrec.setFieldValue('department', 18)
		paymentrec.setFieldValue('class', 38)
		paymentrec.setFieldValue('custbodyacq_deal_link', customer)
		paymentrec.setFieldValue('custbody_related_cases_for_po', billrec.getFieldValue('custbody_related_cases_for_po'))
		paymentrec.setFieldValue('custbody_aeinvoiceno', billrec.getFieldValue('tranid'))
		paymentrec.setFieldValue('memo', billrec.getFieldValue('memo'))
		paymentrec.setFieldValue('trandate', billrec.getFieldValue('trandate'))

		var sizedep = paymentrec.getLineItemCount('deposit')
			//alert('Next1 ' + sizedep )
		if (sizedep == 1)
		{
			var depamount = paymentrec.getLineItemValue('deposit', 'remaining', 1)
			alert ('herex ' + Number(totalbill) + ' ' + Number(depamount))
			if (Number(totalbill) <= Number(depamount))
			{
				//We're OK to process and save the payment
				paymentrec.setLineItemValue('deposit', 'apply', 1, 'T')
				paymentrec.setLineItemValue('deposit', 'amount', 1, Number(totalbill) )
				var payid = nlapiSubmitRecord(paymentrec)

				//OK, transfer and leave open the bill payment screen
				var billpaymenturl = environment_url + '/app/accounting/transactions/vendpymt.nl?entity=' + vendor + '&bill=' + billid
				alert ('Invoice and Payment Applied \n \n Transferring To Bill Payment')
				window.location = billpaymenturl
				return true;
			}
			else
			{
				//Open up payment screen and leave there
				alert ('Not Enough On Deposit for Invoice Payment \n \n Transferring To Invoice')
				var invoiceurl = environment_url +  '/app/accounting/transactions/custinvc.nl?id=' + invid
				window.location = invoiceurl
				return true;
			}
		}
		else
		{
						alert('Next2 ' + sizedep )

			//Open up payment screen or invoice and leave there
			if (sizedep == 0)
			{
				alert ('No Deposits Available for Invoice Payment \n \n Transferring to Invoice')
				var invoiceurl = environment_url +  '/app/accounting/transactions/custinvc.nl?id=' + invid
				window.location = invoiceurl
			}
			else
			{
				alert ('Multiple Deposits Avalable for Invoice Payment')
				//Lets spread the deposit amount amounts
				var totalremaining = Number(totalbill)
				alert ('here4a ' + sizedep)
				for(d=1;d<=sizedep;d++)
				{
					var remaining = paymentrec.getLineItemValue('deposit', 'remaining', d)
					alert ('here4 ' + totalremaining + ' ' +  remaining)
					paymentrec.setLineItemValue('deposit', 'apply', d, 'T')

					if (Number(totalremaining) > Number(remaining))
					{
													alert ('here4b ' + totalremaining)

						paymentrec.setLineItemValue('deposit', 'apply', d, 'T')
						paymentrec.setLineItemValue('deposit', 'amount', d, Number(remaining))
						totalremaining = Number(totalremaining) - Number(remaining)
							alert ('here5 ' + totalremaining)
					}
					else
					{
													alert ('here7 ' + totalremaining)

						paymentrec.setLineItemValue('deposit', 'apply', d, 'T')
						paymentrec.setLineItemValue('deposit', 'amount', d, Number(totalremaining))
						break;
					}


				}
				var payid = nlapiSubmitRecord(paymentrec)
				alert ('here7 ' + paymenturl)

				window.location = paymenturl
			}
			return true;
		}*/
//************************************************************************************************************************************
// End of Commented out code.


	}

}
			//alert('Next3 ' + sizedep )

return true;

}


function automexpensefield(type, name)
{
//Designed for Shareholder Representative Services - Feb 2014
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078
//
// Modified by Ken Crossman 2015-11-19 to only fill the memo field in the expense lines if it is blank
// Also this script will be invoked on save and not on field changed
//Client script to set Expense fields

    var currform = nlapiGetFieldText('customform')
    if (currform == 'Client Expense Vendor Bill')
    {
//	   if (name == 'memo')
//	  {
		var memo = nlapiGetFieldValue('memo')
		var size = nlapiGetLineItemCount('expense')

		for(x=1;x<=size;x++)
		{
                       var expensememo = nlapiGetLineItemValue('expense', 'memo', x);         // Get the value of the memo in the expense line
                        if  (expensememo == '')                                                                                    //Only if the memo in the expense line is blank is it overwritten
                        {
			      nlapiSetLineItemValue('expense', 'memo', x, memo)
                         }
//		}
	  }
    }
    return true;         //Added by Ken so that this function can be invoked upon saving
}
function copymemobutton(type, name)
{

//Client script to copy the memo field from the body of the transaction into the memo column of the expense lines
//It overwrites the memo in every line whether blank or not
//This is designed to be invoked by the press of a button
// Ken Crossman 2015-11-19

    var currform = nlapiGetFieldText('customform')
    if (currform == 'Client Expense Vendor Bill')
    {
		var memo = nlapiGetFieldValue('memo')
		var size = nlapiGetLineItemCount('expense')

		for(x=1;x<=size;x++)
		{
			nlapiSetLineItemValue('expense', 'memo', x, memo)
		}

    }
}
