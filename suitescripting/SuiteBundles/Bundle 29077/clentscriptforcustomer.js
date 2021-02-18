var ACH = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_ach'));
var ccpayment1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_1'));
var ccpayment2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_2'));
var ccpayment3 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_3'));
var ccpayment4 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_4'));
var achid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_ach'));
var achdepid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_ach_deployment'));//  //
var ccid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_cc'));
var ccdepid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_cc_deployment'));

var fx = 'checkApply';
function checkApply()
{
	nlapiLogExecution('DEBUG',fx+' Before Save','Before Save : ');
	var paymentAmount = '';
	var listcount = nlapiGetLineItemCount('custpage_invoice_item'); 
	var anychecked = false;
	var count = 0;
	for(var i =1; (i<=listcount); i++)
	{
		if((nlapiGetLineItemValue('custpage_invoice_item', 'custpage_apply',i) == 'T') && (nlapiGetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i)))
		{
			//count++;
			anychecked = true;
		}
	}
	if(anychecked == false)
	{
		alert('Please choose atleast one invoice');
		return false;
	}
	var total = getnumber(nlapiGetFieldValue('company_cust_payment'));
	if(total <= 0)
	{
		alert('Payment must be greater than 0.');
		return false;
	}
	var selected  = nlapiGetFieldValue('custpage_paymentmethod');
	if(selected == 0)
	{
		alert('Please select Payment Method Coastal');
		return false;
	}
	else
	{
		var ccCard  = nlapiGetFieldValue('custpage_creditcard');
		var achCard  = nlapiGetFieldValue('custpage_ach');
		if((selected == ccpayment1) || (selected == ccpayment2) || (selected == ccpayment3) || (selected == ccpayment4))
		{
			if((ccCard == 0)|| (ccCard == 'new'))
			{
				alert('Please Select Valid Credit Card');
				return false;
			}
		}
		else
		{
			if((achCard == 0)|| (achCard == 'new'))
			{
				alert('Please Select Valid ach');
				return false;
			}
		}
	}
	
	return true;
}

function insertInvoiceAmount(type,name,i)//,name,linenumber
{
//	nlapiLogExecution('DEBUG','type','type : '+type);
	if(type == 'custpage_invoice_item')
	{
		if(name == 'custpage_apply')
		{
			var total = getnumber(nlapiGetFieldValue('company_cust_payment'));
			//nlapiLogExecution('DEBUG','total','total : '+total);
			if(nlapiGetLineItemValue('custpage_invoice_item', 'custpage_apply',i) == 'T')
			{
				var amountdue = nlapiGetLineItemValue('custpage_invoice_item', 'custpage_amountdue',i);
				total = total + getnumber(amountdue);
			//	nlapiLogExecution('DEBUG','amountdue','amountdue : '+amountdue+' total '+total);
				nlapiSetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i,amountdue);
				nlapiSetFieldValue('company_cust_payment',total.toFixed(2));
				nlapiSetFieldValue('custpage_paymentamount',total.toFixed(2));
			}
			else
			{
				var amountdue = getnumber(nlapiGetLineItemValue('custpage_invoice_item', 'custpage_amountdue',i));
				var paymentamount = getnumber(nlapiGetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i));
				if(paymentamount == amountdue)
				{
					total = total - getnumber(amountdue);
				}
				else
				{
					total = total - getnumber(paymentamount);
				}
				//alert('amountdue : '+amountdue+' total '+total);
				nlapiSetFieldValue('company_cust_payment',total.toFixed(2));
				nlapiSetFieldValue('custpage_paymentamount',total.toFixed(2));
				nlapiSetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i,'');
			
			}
		}
		else if(name == 'custpage_invoicepayment')
		{
			var amountChanged = nlapiGetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i);
			
			var dueamount = nlapiGetLineItemValue('custpage_invoice_item', 'custpage_amountdue',i);
			if(amountChanged > dueamount)
			{
				nlapiSetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i,dueamount.toFixed(2));
			}
			else
			{
				var totalPrevious = nlapiGetFieldValue('company_cust_payment');
				var changedTotal = 0;
				if(getnumber(totalPrevious) >= getnumber(dueamount))
				{
					changedTotal = getnumber(totalPrevious) - getnumber(dueamount) + getnumber(amountChanged);
				}
				else
				{
					//changedTotal = getnumber(totalPrevious) + getnumber(amountChanged);
				//	nlapiLogExecution('DEBUG','else','changedTotal : '+changedTotal);
					//if(changedTotal < 0)
				//	{
						var listcount = nlapiGetLineItemCount('custpage_invoice_item'); 
						var calc = 0;
						for(var i =1; (i<=listcount); i++)
						{
							if(nlapiGetLineItemValue('custpage_invoice_item', 'custpage_apply',i) == 'T')
							{
								calc = getnumber(calc) + getnumber(nlapiGetLineItemValue('custpage_invoice_item', 'custpage_invoicepayment',i));
								
							}
						}
				//		nlapiLogExecution('DEBUG','calc','calc : '+calc);
						changedTotal = calc;
				//	}
				}
				
				nlapiSetFieldValue('custpage_paymentamount',changedTotal.toFixed(2));
				nlapiSetFieldValue('company_cust_payment',changedTotal.toFixed(2));
			}
		}
	}
	if(type == 'custpage_cutomerdeposit')
	{
		if(name == 'custpage_depositapply')
		{
			var total = getnumber(nlapiGetFieldValue('company_cust_payment'));
			if(nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositapply',i) == 'T')
			{
				var amountdue = nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositamountdue',i);//make it amount due
				//alert(amountdue);
				total = total - getnumber(amountdue);
			//	nlapiLogExecution('DEBUG','amountdue','amountdue : '+amountdue+' total '+total);
				nlapiSetLineItemValue('custpage_cutomerdeposit', 'custpage_depositpayment',i,amountdue);
				nlapiSetFieldValue('company_cust_payment',total.toFixed(2));
				nlapiSetFieldValue('custpage_paymentamount',total.toFixed(2));
			}
			else
			{
				var amountdue = nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositamountdue',i);
				var paymentamount = getnumber(nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositpayment',i));
				if(paymentamount == amountdue)
				{
					total = total + getnumber(amountdue);
				}
				else
				{
					total = total + getnumber(paymentamount);
				}
				//alert('amountdue : '+amountdue+' total '+total);
				nlapiSetFieldValue('company_cust_payment',total.toFixed(2));
				nlapiSetFieldValue('custpage_paymentamount',total.toFixed(2));
				nlapiSetLineItemValue('custpage_cutomerdeposit', 'custpage_depositpayment',i,'');
			}
		}
		else if(name == 'custpage_depositpayment')
		{
			var amountChanged = nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositpayment',i);
			var dueamount = getnumber(nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositamountdue',i));//changed to amount due
			if(amountChanged > dueamount)
			{
				nlapiSetLineItemValue('custpage_cutomerdeposit', 'custpage_depositpayment',i,dueamount.toFixed(2));
			}
			else
			{
				var totalPrevious = nlapiGetFieldValue('company_cust_payment');
				var changedTotal = 0;
				if(getnumber(totalPrevious) >= getnumber(dueamount))
				{
					changedTotal = getnumber(totalPrevious) + getnumber(dueamount) - getnumber(amountChanged);
				//	nlapiLogExecution('DEBUG','if','changedTotal : '+changedTotal.toFixed(2));
				}
				else
				{
					
						var listcount = nlapiGetLineItemCount('custpage_cutomerdeposit'); 
						var calc = 0;
						for(var i =1; (i<=listcount); i++)
						{
							if(nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositapply',i) == 'T')
							{
								calc = getnumber(calc) + getnumber(nlapiGetLineItemValue('custpage_cutomerdeposit', 'custpage_depositpayment',i));
								
							}
						}
						changedTotal = calc;
				
				}
				
				nlapiSetFieldValue('custpage_paymentamount',changedTotal.toFixed(2));
				nlapiSetFieldValue('company_cust_payment',changedTotal.toFixed(2));
			}
		}
	}
	if(type == 'custpage_creditmemo')
	{
		if(name == 'custpage_creditapply')
		{
			var total = getnumber(nlapiGetFieldValue('company_cust_payment'));
			if(nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditapply',i) == 'T')
			{
				var amountdue = nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditamountdue',i);
				total = total - getnumber(amountdue);
			//	nlapiLogExecution('DEBUG','amountdue','amountdue : '+amountdue+' total '+total);
				nlapiSetLineItemValue('custpage_creditmemo', 'custpage_creditpayment',i,amountdue);
				nlapiSetFieldValue('company_cust_payment',total.toFixed(2));
				nlapiSetFieldValue('custpage_paymentamount',total.toFixed(2));
			}
			else
			{
				var amountdue = nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditamountdue',i);
				var paymentamount = getnumber(nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditpayment',i));
				if(paymentamount == amountdue)
				{
					total = total + getnumber(amountdue);
				}
				else
				{
					total = total + getnumber(paymentamount);
				}
				//alert('amountdue : '+amountdue+' total '+total);
				nlapiSetFieldValue('company_cust_payment',total.toFixed(2));
				nlapiSetFieldValue('custpage_paymentamount',total.toFixed(2));
				nlapiSetLineItemValue('custpage_creditmemo', 'custpage_creditpayment',i,'');
			}
		}
		else if(name == 'custpage_creditpayment')
		{
			var amountChanged = nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditpayment',i);
			var dueamount = getnumber(nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditamountdue',i));//changed to amount due
			if(amountChanged > dueamount)
			{
				nlapiSetLineItemValue('custpage_creditmemo', 'custpage_creditpayment',i,dueamount.toFixed(2));
			}
			else
			{
				var totalPrevious = nlapiGetFieldValue('company_cust_payment');
				var changedTotal = 0;
				if(getnumber(totalPrevious) >= getnumber(dueamount))
				{
					changedTotal = getnumber(totalPrevious) + getnumber(dueamount) - getnumber(amountChanged);
				//	nlapiLogExecution('DEBUG','if','changedTotal : '+changedTotal.toFixed(2));
				}
				else
				{
					
						var listcount = nlapiGetLineItemCount('custpage_creditmemo'); 
						var calc = 0;
						for(var i =1; (i<=listcount); i++)
						{
							if(nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditapply',i) == 'T')
							{
								calc = getnumber(calc) + getnumber(nlapiGetLineItemValue('custpage_creditmemo', 'custpage_creditpayment',i));
								
							}
						}
						changedTotal = calc;
				}
				
				nlapiSetFieldValue('custpage_paymentamount',changedTotal.toFixed(2));
				nlapiSetFieldValue('company_cust_payment',changedTotal.toFixed(2));
			}
		}
		
	}	
	if(name == 'custpage_paymentmethod')
	{
		var paymentMethod = nlapiGetFieldValue('custpage_paymentmethod');
		nlapiLogExecution('DEBUG','paymentMethod','paymentMethod : '+paymentMethod);
		if((paymentMethod == 0) || (paymentMethod == '0'))
		{
			nlapiDisableField('custpage_creditcard',true);
			nlapiDisableField('custpage_cvvnumber',true);
			nlapiDisableField('custpage_ccapprove',true);
			nlapiDisableField('custpage_ccreject',true);
			nlapiDisableField('custpage_ccauthid',true);
			nlapiDisableField('custpage_cccharged',true);
			nlapiDisableField('custpage_ccrefund',true);
			nlapiDisableField('custpage_ccmsg',true);
			nlapiDisableField('custpage_achauthid',true);
			nlapiDisableField('custpage_ach',true);
			nlapiDisableField('custpage_achcharge',true);
			nlapiDisableField('custpage_achrefund',true);
			nlapiDisableField('custpage_achmsg',true);
			
		}
		if(paymentMethod == ACH)
		{
			nlapiDisableField('custpage_creditcard',true);
			nlapiDisableField('custpage_cvvnumber',true);
			nlapiDisableField('custpage_ccapprove',true);
			nlapiDisableField('custpage_ccreject',true);
			nlapiDisableField('custpage_ccauthid',true);
			nlapiDisableField('custpage_cccharged',true);
			nlapiDisableField('custpage_ccrefund',true);
			nlapiDisableField('custpage_ccmsg',true);
			nlapiDisableField('custpage_achauthid',true);
			nlapiDisableField('custpage_ach',false);
			nlapiDisableField('custpage_achcharge',true);
			nlapiDisableField('custpage_achrefund',true);
			nlapiDisableField('custpage_achmsg',true);
		}
		else if((paymentMethod == ccpayment1) || (paymentMethod == ccpayment2) || (paymentMethod == ccpayment1) || (paymentMethod == ccpayment1))
		{
			nlapiDisableField('custpage_creditcard',false);
			nlapiDisableField('custpage_cvvnumber',false);
			nlapiDisableField('custpage_ccapprove',true);
			nlapiDisableField('custpage_ccreject',true);
			nlapiDisableField('custpage_ccauthid',true);
			nlapiDisableField('custpage_cccharged',true);
			nlapiDisableField('custpage_ccrefund',true);
			nlapiDisableField('custpage_ccmsg',true);
			nlapiDisableField('custpage_achauthid',true);
			nlapiDisableField('custpage_ach',true);
			nlapiDisableField('custpage_achcharge',true);
			nlapiDisableField('custpage_achrefund',true);
			nlapiDisableField('custpage_achmsg',true);
		}
		else
		{
			nlapiDisableField('custpage_creditcard',true);
			nlapiDisableField('custpage_cvvnumber',true);
			nlapiDisableField('custpage_ccapprove',true);
			nlapiDisableField('custpage_ccreject',true);
			nlapiDisableField('custpage_ccauthid',true);
			nlapiDisableField('custpage_cccharged',true);
			nlapiDisableField('custpage_ccrefund',true);
			nlapiDisableField('custpage_ccmsg',true);
			nlapiDisableField('custpage_achauthid',true);
			nlapiDisableField('custpage_ach',true);
			nlapiDisableField('custpage_achcharge',true);
			nlapiDisableField('custpage_achrefund',true);
			nlapiDisableField('custpage_achmsg',true);
		}
	}
	if(name == 'custpage_ach')
	{
		var context=nlapiGetContext();
		var userID=context.getUser();
		var username=context.getName();
		var achValue = nlapiGetFieldValue('custpage_ach');
		
		if(achValue == 'new')
		{
			//alert(achValue);
			window.open('https://system.netsuite.com/app/site/hosting/scriptlet.nl?script='+achid+'&deploy='+achdepid+'','_self','height=700,width=700');
		}
		
	}
	if(name == 'custpage_creditcard')
	{
		var ccValue = nlapiGetFieldValue('custpage_creditcard');
		if(ccValue == 'new')
		{
			//alert(achValue);
			window.open('https://system.netsuite.com/app/site/hosting/scriptlet.nl?script='+ccid+'&deploy='+ccdepid+'','_self','height=700,width=700');
		}
		
	}
	
}
function onLoad(type)
{
	if(type == 'create')
	{
		nlapiDisableField('custpage_creditcard',true);
		nlapiDisableField('custpage_cvvnumber',true);
		nlapiDisableField('custpage_ccapprove',true);
		nlapiDisableField('custpage_ccreject',true);
		nlapiDisableField('custpage_ccauthid',true);
		nlapiDisableField('custpage_cccharged',true);
		nlapiDisableField('custpage_ccrefund',true);
		nlapiDisableField('custpage_ccmsg',true);
		nlapiDisableField('custpage_achauthid',true);
		nlapiDisableField('custpage_ach',true);
		nlapiDisableField('custpage_achcharge',true);
		nlapiDisableField('custpage_achrefund',true);
		nlapiDisableField('custpage_achmsg',true);
		//nlapiDisableLineItemField('custpage_cutomerdeposit','custpage_depositpayment',true);
		//nlapiDisableLineItemField('custpage_creditmemo','custpage_creditpayment',true);
	}
}

function getnumber(id)
{
	var ret;
	ret = parseFloat(id);
	if(isNaN(ret))
	{
		ret = 0;
	}
	return ret;

}// getnumber

