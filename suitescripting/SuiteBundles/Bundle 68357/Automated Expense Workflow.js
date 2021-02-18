function automexpenseflow(type, form, request)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//The Before Load script will first setup the bill with Related Case information if present
var rectype = nlapiGetRecordType()
var currform = nlapiGetFieldText('customform')
var context = nlapiGetContext();
var ckcontext = context.getExecutionContext();

if (type == 'create' && rectype == 'vendorbill' &&  currform == 'Client Expense Vendor Bill' && ckcontext == 'userinterface')
{
		nlapiSetFieldValue('class', 38) //Client Accounts
		nlapiSetFieldValue('department', 18) //Client Accounts
}


if (type == 'create' && rectype == 'vendorbill' && nlapiGetFieldValue('custbody_related_cases_for_po') && ckcontext == 'userinterface')
{
	nlapiSetFieldValue('account', 327) //Client Cash
	nlapiSetFieldValue('department', 18) //Client Accounts
	nlapiSetFieldValue('class', 38) //Client Accounts

	var size = nlapiGetLineItemCount('expense')
	
	for(x=1;x<=size;x++) 
	{
		nlapiSetLineItemValue('expense', 'department', x, 18)
		nlapiSetLineItemValue('expense', 'class', x, 38)
	}

}


if (type == 'create' && rectype == 'vendorpayment' && ckcontext == 'userinterface')
{
	var billid = request.getParameter('bill');
	if (billid)
	{
		var fields = ['department', 'class', 'custbody_related_cases_for_po', 'custbodyacq_deal_link']
		var columns = nlapiLookupField('vendorbill', billid, fields)
		try //Insure we have a Related Case before proceeding
		{
			var relatedcase = columns.custbody_related_cases_for_po
		}
		catch (e)
		{
			var relatedcase = null
		}

		if (relatedcase)

		{
			nlapiSetFieldValue('account', 286) //Client Cash
			nlapiSetFieldValue('department', columns.department) //Client Accounts
			nlapiSetFieldValue('class', columns.class) 
			nlapiSetFieldValue('custbody_related_cases_for_po', columns.custbody_related_cases_for_po) 
			nlapiSetFieldValue('custbodyacq_deal_link', columns.custbodyacq_deal_link) 
		}
	}		
}


if (nlapiGetFieldValue('custbody_related_cases_for_po') && (type != 'create' && type != 'delete') && ckcontext == 'userinterface') //If we have a related case - create a dynamic tab with attachments
{
	
	//Show a button that allows a AE Bill to be created
	
	if (rectype == 'vendorbill' && nlapiGetFieldValue('custbody_related_cases_for_po'))
	{
		//Make sure this is billable
		var billable = false
		var size = nlapiGetLineItemCount('expense')
		
		for(x=1;x<=size;x++) 
		{
			if (nlapiGetLineItemValue('expense', 'isbillable', x) == 'T')
			{
				billable = true
				break;
			}
		}
				
		var status = nlapiGetFieldValue('orderstatus')
		var approvalstatus = nlapiGetFieldText('approvalstatus')
		if ((status != 'B' && status != 'V') && billable && type == 'view' && approvalstatus == 'Approved') //Not Paid In Fill or Voided
		{				
			var billid = nlapiGetRecordId()
			form.setScript('customscript_autoexpclient');
			form.addButton('custpage_createinvandpay','Create/Pay AutoInvoice',"autoinvpay("+billid+");");
			}	
	}
		
	var environment = nlapiGetContext().getEnvironment()
	var environment_url
	
	if(environment == "PRODUCTION")
		environment_url = "https://system.na2.netsuite.com"
	else if(environment == "SANDBOX")
		environment_url = "https://system.sandbox.netsuite.com"
	else if(environment == "BETA")
		environment_url == "https://system.beta.netsuite.com"
	
	
	form.addTab('custpage_caseattach', 'Related Case Attachments');
	var sublist = form.addSubList('custpage_relatedcase','list','Related Case Attachments', 'custpage_caseattach');

	sublist.addField('custpage_rc_filelink','textarea','Link', null)
	sublist.addField('custpage_rc_date','text','Date/Time', null)
	sublist.addField('custpage_rc_type','text','Type', null)

	var caseid = nlapiGetFieldValue('custbody_related_cases_for_po')
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalidnumber', 'case', 'equalto', caseid);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid')
	columns[1] = new nlobjSearchColumn('formulatext').setFormula('{messagedate}');
	columns[2] = new nlobjSearchColumn('author');
	columns[3] = new nlobjSearchColumn('message');
	columns[4] = new nlobjSearchColumn('formulatext').setFormula('{case.lastmodifieddate}');
	columns[5] = new nlobjSearchColumn('formulatext').setFormula('{attachments.internalid}')
	columns[6] = new nlobjSearchColumn('formulatext').setFormula('{attachments.name}');
	columns[7] = new nlobjSearchColumn('formulatext').setFormula('{attachments.url}');
	columns[8] = new nlobjSearchColumn('formulatext').setFormula('{attachments.size}')
	columns[9] = new nlobjSearchColumn('formulatext').setFormula('{attachments.filetype}')
//	columns[5].setSort(true);

	var results = nlapiSearchRecord('message', null, filters, columns);
	for (var i = 0; results != null && i < results.length; i++ )
	{
		var columns1 = results[i].getAllColumns();
		var attachname = results[i].getValue(columns1[6]);
		var attachurl = environment_url + results[i].getValue(columns1[7]);
		var attachdate = results[i].getValue(columns1[1]);
		var attachtype = results[i].getValue(columns1[9]);
		
		sublist.setLineItemValue('custpage_rc_filelink', i+1, '<a href="#" title="Click here to view." onclick="Popup=window.open(\''+attachurl+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+attachname+'</a>');
		sublist.setLineItemValue('custpage_rc_date', i+1, attachdate)
		sublist.setLineItemValue('custpage_rc_type', i+1, attachtype)
	}
}

}


function autoexpensebill(purchid)
{

//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Now lets geneerate a Bil transaction record


//var purchid = request.getParameter('purchid')
alert ('here1 ' + purchid)
try
{
	var billrec = nlapiTransformRecord('purchaseorder', purchid, 'vendorbill')
	alert ('here2')

}
catch (e)
{
	alert ('herex ' + e.getCode() + ' ' + e.toString())
}
alert ('here3 ')
try
{
	var billid = nlapiSubmitRecord(billrec)
}
catch (e)
{
	alert ('herey ' + e.getCode() + ' ' + e.toString())
}

alert ('here3a ' + billid )
//Otherwise go back to forms
var url = nlapiResolveURL('RECORD','vendorbill',billrec,'EDIT');
alert ('here4 ' + url)
window.location= url
return;

}


function autodeposit(type, form, request)
{
//Designed for Shareholder Representative Services - Feb 2015
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//The Before Load script will setup the Auto Expense Deposit/Payment Form
try
{
	var autoinv = request.getParameter('autoinv')
		
}
catch (e)
{
	var autoinv = 'F'
}


if (autoinv == 'T') //We have an auto deposit
{
	var invid = request.getParameter('inv')
	var billid = request.getParameter('billid')
	var customer = request.getParameter('customer')
	var billrec = nlapiLoadRecord('vendorbill', billid)
	var totalbill = billrec.getFieldValue('total')
	
	nlapiSetFieldValue('department', 18, false)
	nlapiSetFieldValue('class', 38, false)
	nlapiSetFieldValue('custbodyacq_deal_link', customer, false)
	nlapiSetFieldValue('custbody_related_cases_for_po', billrec.getFieldValue('custbody_related_cases_for_po'), false)
	nlapiSetFieldValue('custbody_aeinvoiceno', billrec.getFieldValue('tranid'), false)
	nlapiSetFieldValue('memo', billrec.getFieldValue('memo'), false)
	
	var trandate = billrec.getFieldValue('trandate')
	nlapiSetFieldValue('trandate', trandate, false)
	//Go get period if open
	var startdate=new Date(trandate);
	startdate.setDate(1);
	startdate = nlapiDateToString(startdate)
	var filter_per = new Array();
	filter_per[0] = new nlobjSearchFilter('startdate', null, 'on', startdate);
	filter_per[1] = new nlobjSearchFilter('isquarter', null, 'is', 'F');
	filter_per[2] = new nlobjSearchFilter('isyear', null, 'is', 'F');
	var results_per = nlapiSearchRecord('accountingperiod', null, filter_per, null); 

	if (results_per != null)
	{
		nlapiSetFieldValue('postingperiod', results_per[0].getId(), false)
	}

	var sizedep = nlapiGetLineItemCount('deposit')
	if (sizedep == 1)
	{
		var depamount = nlapiGetLineItemValue('deposit', 'remaining', 1)
		if (Number(totalbill) <= Number(depamount))
		{
			//We're OK to process and save the payment				
			nlapiSelectLineItem('deposit', 1)
			nlapiSetCurrentLineItemValue('deposit', 'apply', 'T', false)				
			nlapiSetCurrentLineItemValue('deposit', 'amount', Number(totalbill))	
//			nlapiCommitLineItem('deposit')  //System Error for now when comitting Deposit line - NS Support lookng into
		}
	}
	else
	{
		//Open up payment screen or invoice and leave there
		if (sizedep != 0)
		{
			//Lets spread the deposit amount amounts
			var totalremaining = Number(totalbill)
			for(d=1;d<=sizedep;d++) 
			{
				var remaining = nlapiGetLineItemValue('deposit', 'remaining', d)
					
				if (Number(totalremaining) > Number(remaining))
				{
					nlapiSelectLineItem('deposit', d)
					nlapiSetCurrentLineItemValue('deposit', 'apply', 'T', false)	
					nlapiSetCurrentLineItemValue('deposit', 'amount', Number(remaining))
//					nlapiCommitLineItem('deposit')
					totalremaining = Number(totalremaining) - Number(remaining)
				}
				else
				{
					nlapiSelectLineItem('deposit', d)
					nlapiSetCurrentLineItemValue('deposit', 'apply', 'T', false)	
					nlapiSetCurrentLineItemValue('deposit', 'amount', Number(totalremaining))
//					nlapiCommitLineItem('deposit')
					break;
				}	
			}
		}
	}
}
}