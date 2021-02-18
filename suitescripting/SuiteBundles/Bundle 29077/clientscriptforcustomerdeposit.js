var ACH = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_ach'));
var ccpayment1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_1'));
var ccpayment2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_2'));
var ccpayment3 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_3'));
var ccpayment4 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_4'));
var achid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_ach'));
var achdepid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_ach_deployment'));//  //
var ccid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_cc'));
var ccdepid = (nlapiGetContext().getSetting('SCRIPT', 'custscript_script_id_cc_deployment'));
var fx = 'checkForm';
function checkForm()
{
	nlapiLogExecution('DEBUG',fx+' Before Save','Before Save : ');
	var paymentAmount = '';
	
	
	var total = getnumber(nlapiGetFieldValue('custpage_paymentamount'));
	if(total <= 0)
	{
		alert('Payment Amount must be greater than 0.');
		return false;
	}
	var selected  = nlapiGetFieldValue('custpage_depositmethod');
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

function onFieldChange(type,name,i)
{
	if(name == 'custpage_depositmethod')
	{
		var paymentMethod = nlapiGetFieldValue('custpage_depositmethod');
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
		else if((paymentMethod == ccpayment1) || (paymentMethod == ccpayment2) || (paymentMethod == ccpayment3) || (paymentMethod == ccpayment4))
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
	//	nlapiLogExecution('DEBUG','userID','userID : '+userID+' username '+username);
		//alert('userID : '+userID+' username '+username);
		var achValue = nlapiGetFieldValue('custpage_ach');
		
		if(achValue == 'new')
		{
			//alert(achValue);
			//window.open('https://system.netsuite.com/app/site/hosting/scriptlet.nl?script='+achid+'&deploy='+achdepid+'','_self','height=700,width=700');
			window.open('/app/site/hosting/scriptlet.nl?script='+achid+'&deploy='+achdepid+'','_self','height=700,width=700');
		}
		
	}
	if(name == 'custpage_creditcard')
	{
		var ccValue = nlapiGetFieldValue('custpage_creditcard');
		if(ccValue == 'new')
		{
			//alert(achValue);
			//window.open('https://system.netsuite.com/app/site/hosting/scriptlet.nl?script='+ccid+'&deploy='+ccdepid+'','_self','height=700,width=700');
			window.open('/app/site/hosting/scriptlet.nl?script='+ccid+'&deploy='+ccdepid+'','_self','height=700,width=700');
		}
		
	}
}
function onFormLoad(type)
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

