 function setupmem(type, form)
{

//Designed for Shareholder Representative Services - May 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a client init script that will isure the Memo deal is populated on new Memos

if (type == 'create')
{
	if ( (nlapiGetFieldValue('custevent_memo_deal') == null || nlapiGetFieldValue('custevent_memo_deal') == "") &&
		 nlapiGetFieldValue('company') )
	{
		nlapiSetFieldValue('custevent_memo_deal', nlapiGetFieldValue('company'), false)
	}
	if ( (nlapiGetFieldValue('custevent_memodeal') == null || nlapiGetFieldValue('custevent_memodeal') == "") &&
		 nlapiGetFieldValue('company') )
	{
		nlapiSetFieldValue('custevent_memodeal', nlapiGetFieldValue('company'), false)
	}
}

}
