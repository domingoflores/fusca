function updatecases(incontrol)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Here we will update the Cases with Open Release information gathered from our custom form

var size = nlapiGetLineItemCount('custpage_releaselist'); 
var submitfld = new Array();
var submitdata = new Array();
var update = false;
var nosubs = -1

//Lets loop thru all the line to see if we can find updates
for(z=1;z<=size;z++)
{
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_release', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_release', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventrelease'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_release', z)
		update = true
	}		

	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseexpensefundsdue', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseexpensefundsdue', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseexpensefundsdue'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseexpensefundsdue', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseallocated', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseallocated', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseallocated'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseallocated', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasescheduled', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releasescheduled', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasescheduled'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasescheduled', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasecontact', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releasecontact', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasecontact'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasecontact', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasepayoutmechanics', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releasepayoutmechanics', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasepayoutmechanics'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasepayoutmechanics', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasemoveverified', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releasemoveverified', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasemoveverified'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasemoveverified', z)
		update = true
	}	
		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasequietletter', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releasequietletter', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasequietletter'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasequietletter', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseexpirationletter', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseexpirationletter', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseexpirationletter'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseexpirationletter', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseinstructionletter', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseinstructionletter', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseinstructionletter'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseinstructionletter', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseshareholderletter', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseshareholderletter', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseshareholderletter'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseshareholderletter', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaselegalapproval', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaselegalapproval', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaselegalapproval'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaselegalapproval', z)
		update = true
	}		
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasetoportal', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releasetoportal', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasetoportal'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasetoportal', z)
		update = true
	}		

	
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseescrowstatementnews', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseescrowstatementnews', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseescrowstatementnews'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseescrowstatementnews', z)
		update = true
	}		
	if (update)
	{
		var caseid = nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_internalid', z)
		nlapiSubmitField('supportcase', caseid, submitfld, submitdata)
		update = false
		nosubs = -1	
	}
}

//Otherwise go back to forms
var url = nlapiResolveURL('SUITELET','customscript_srsopenreleases','customdeploy_srsopenrelease',null);
window.onbeforeunload = null //Gets rid of leave this page message
window.location= url
return;
}

