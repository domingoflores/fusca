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
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_excalated', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_excalated', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custevent_excalated'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_excalated', z)
		update = true
	}		

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
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_pareleasecontact1', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_pareleasecontact1', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleasecontactpa'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_pareleasecontact1', z)
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
	
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_expire', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_expire', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custevent_release_expire_date'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_expire', z)
		update = true
	}
	
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseamount', z) != nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_releaseamount', z))
	{
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custeventreleaseamount'
		submitdata[nosubs] = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseamount', z)
		update = true
	}	
	if (update)
	{
		var caseid = nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_internalid', z)

		//Release Case
		nosubs = nosubs + 1
		submitfld[nosubs] = 'custevent_openrellock'
		submitdata[nosubs] = ""
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


function listmanage(incontrol)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Here we will update the Cases with Open Release information gathered from our custom form

var size = nlapiGetLineItemCount('custpage_releaselist'); 
var user = nlapiGetUser()

//Lets loop thru all the line to see if we can find updates
for(z=1;z<=size;z++)
{
	if (nlapiGetLineItemValue('custpage_releaselist', 'custpage_locked', z) == 'T')
	{
		var caseid = nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_internalid', z)
		var lock = nlapiLookupField('supportcase', caseid, 'custevent_openrellock')
		
		//OK to open if owned or open
		if (lock == user || lock == null || lock == "")
		{
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_excalated', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_expire', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseamount', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releasecontact', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_pareleasecontact1', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseexpensefundsdue', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_release', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releasescheduled', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releasepayoutmechanics', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releasemoveverified', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseallocated', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releasequietletter', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseexpirationletter', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseinstructionletter', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseshareholderletter', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaselegalapproval', false, z)
			nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_releaseescrowstatementnews', false, z)
		
			//Lock the case for update
			nlapiSubmitField('supportcase', caseid, 'custevent_openrellock', user)
		}
		else
		{
			var caseno = nlapiLookupField('supportcase', caseid, 'casenumber')
			var username = nlapiLookupField('supportcase', caseid, 'custevent_openrellock', true)
			alert ('Case #' + caseno + ' already locked by ' + username)
			nlapiSetLineItemValue('custpage_releaselist', 'custpage_locked', z, 'F')
		}

	}
}
return;
}


function ckinit(incontrol)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Here we will keep thos line disabled that belong to someone else

var size = nlapiGetLineItemCount('custpage_releaselist');	
var user = nlapiGetUser()

for(z=1;z<=size;z++)
{
	var locked = nlapiGetLineItemValue('custpage_releaselist', 'custpage_hid_locked', z)
	if (locked != user && locked != null && locked != "")
	{
		nlapiSetLineItemDisabled('custpage_releaselist', 'custpage_locked', true, z)
		var lockname = nlapiGetLineItemText('custpage_releaselist', 'custpage_hid_locked', z)
//		nlapiSetLineItemValue('custpage_releaselist', 'custpage_lockedind', z, 'Frank')			
	}
		
}
	
			
}



function exportrelease(incontrol)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Here we will create an export of the OPen Reakease Dashboard

alert('here1')
/*file attachment params*/
var headerRow = "Deal,Case,Subject,Assigned,Last Note,Expire,To, Amount, Imp Note, \n";
var filteredresults = headerRow;
var fileType='CSV';

var size = nlapiGetLineItemCount('custpage_releaselist'); 

//Lets loop thru all the line to see if we can find updates
for(z=1;z<=size;z++)
{
	var deal = nlapiGetLineItemValue('custpage_releaselist', 'custpage_deal', z) 
	var casenm = nlapiGetLineItemValue('custpage_releaselist', 'custpage_number', z) 
	var subject = nlapiGetLineItemValue('custpage_releaselist', 'custpage_subject', z) 
	var assigned = nlapiGetLineItemValue('custpage_releaselist', 'custpage_assignedto', z) 
	var lastnote = nlapiGetLineItemValue('custpage_releaselist', 'custpage_lastnotedate', z) 
	var expire = nlapiGetLineItemValue('custpage_releaselist', 'custpage_expire', z) 
	var to = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasetowho', z) 
	var amt = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseamount', z) 
	var impnote = nlapiGetLineItemValue('custpage_releaselist', 'custpage_importantnotes', z) 
	var eapa1 =	nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasecontact', z) 
	var eapa2 =	nlapiGetLineItemValue('custpage_releaselist', 'custpage_pareleasecontact1', z) 
	var ee1 = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseexpensefundsdue', z) 
	var exp = nlapiGetLineItemValue('custpage_releaselist', 'custpage_release', z) 
	var sch = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasescheduled', z) 
	var pm = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasepayoutmechanics', z) 
	var v1 = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasemoveverified', z) 
	var all = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseallocated', z) 
	var ql = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releasequietletter', z) 
	var el = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseexpirationletter', z) 
	var il = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseinstructionletter', z) 
	var sl1 = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseshareholderletter', z) 
	var lgl = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaselegalapproval', z) 
	var esn = nlapiGetLineItemValue('custpage_releaselist', 'custpage_releaseescrowstatementnews', z) 

	filteredresults += deal + "," + casenm + "," + subject + "," + assigned + "," + lastnote +  "," + expire + "," + to + "," + amt + "," + impnote +
	"," + eapa1 + "," + eapa2 + "," + ee1 + "," + exp + "," + sch +  "," + pm + "," + v1 + "," + all + "," + ql + "," + el + "," + il +
	"," + sl1 + ","  + lgl +  "," + esn + "\n";

	//Call a suitelet to open create and open the fiel for the user
//	var params = new Array();
//	params['results'] = filteredresults
//	var linkURL = nlapiResolveURL('SUITELET','customscript_urlemailsend','customdeploy1',false)
//	nlapiRequestURL(linkURL, params, null, null)
//	alert('URL Email Sent!')

//	var emailbody = nlapiMergeRecord(emailtemp,'customer', custid, null, null, external_fields).getValue();   //Merge with template
//	nlapiSendEmail(81913, 'ffoster@grace-solutions.com', 'Weekly Overview Report -' + repname, emailbody , null, null, null, newAttachment);


}
	alert('here2')
	var nameofFile='Open Release Export' + '.csv';
	var releasecsv = nlapiCreateFile(nameofFile,"CSV",filteredresults);
	var folder = 623363
	alert('here3')
	releasecsv.setFolder(folder)
	var fileid = nlapiSubmitFile(releasecsv)
	alert('here4')
	return;

}