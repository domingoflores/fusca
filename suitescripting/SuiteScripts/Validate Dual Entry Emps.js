function rolecheck(type,name)
{

//Designed for Shareholder Representative Services - May 2014
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

// 07/15/2014 - smccurry modified this script to add in the new field custrecord_edc_admin
	
//This is a Client Script that will insure proper entry of Dual entry Employees

var morethanone = false;

if (name == 'custrecord_edc_de1' && nlapiGetFieldValue('custrecord_edc_de1') == 'T')
{
	if (nlapiGetFieldValue('custrecord_edc_de2') == 'T')
	{
		morethanone = true;
		nlapiSetFieldValue('custrecord_edc_de1', "", false);
	}
}
if (name == 'custrecord_edc_de2' && nlapiGetFieldValue('custrecord_edc_de2') == 'T')
{
	if (nlapiGetFieldValue('custrecord_edc_de1') == 'T')
	{
		morethanone = true;
		nlapiSetFieldValue('custrecord_edc_de2', "", false);
	}
}
if (name == 'custrecord_edc_admin' && nlapiGetFieldValue('custrecord_edc_admin') == 'T')
{
	if (nlapiGetFieldValue('custrecord_edc_de1') == 'T' || nlapiGetFieldValue('custrecord_edc_de2') == 'T')
	{
		morethanone = true;
		nlapiSetFieldValue('custrecord_edc_admin', "", false);
	}
}


if (morethanone)
{
	alert ("Can Only Have One (1) Dual Entry Role");
	nlapiSetFieldValue('custrecord_edc_de1', "", false);
	nlapiSetFieldValue('custrecord_edc_de2', "", false);
	nlapiSetFieldValue('custrecord_edc_admin', "", false);
	return false;
}

return true;

}


//var primCheck = document.forms[0].firmPrim;
//var backCheck = document.forms[1].firmBackup;
//primCheck.onclick = checkClick;
//backCheck.onclick = checkClick;
//
//function checkClick(e) {
//    var otherCheckbox = this === primCheck ? backCheck : primCheck;
//    if (this.checked) {
//        otherCheckbox.checked = false;
//    }
//}
	