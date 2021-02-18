function earnoutrec(type, name)
{

//Designed for Shareholder Representative Services - May 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Cleint Script that will associate the new Secondary Earn-out tab with the clienbt record.
if (name ==	'custentity_eo_secondaryearnouts' && nlapiGetFieldValue('custentity_eo_secondaryearnouts') )
{
	var custid = nlapiGetRecordId()
	var seceorec = nlapiGetFieldValue('custentity_eo_secondaryearnouts')
	nlapiSubmitField('customrecord_secondaryeo', seceorec, 'custrecord_seo_deal', custid)
}

}