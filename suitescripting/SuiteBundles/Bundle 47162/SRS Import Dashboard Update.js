 function updateimport(incontrol)
{
//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//Here we will update the Cases with Import information gathered from our custom form

var size = nlapiGetLineItemCount('custpage_importlist'); 
var submitfld = new Array();
var submitdata = new Array();
var update = false;
var nosubs = -1
var today = nlapiDateToString( new Date() );

//Lets loop thru all the line to see if we can find updates
for(z=1;z<=size;z++)
{
	if (nlapiGetLineItemValue('custpage_importlist', 'custpage_locked', z) == 'T' ) //Line Ready For Update
	{
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_datestarted', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_datestarted', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_qadate'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_datestarted', z)
			update = true
		}		

		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_datecompleted', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_datecompleted', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_datecomp'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_datecompleted', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_dateapproved', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_dateapproved', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_dateapp'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_dateapproved', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_datesendrrd', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_datesendrrd', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_datesentrrd'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_datesendrrd', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_s2sanalyst', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_s2sanalyst', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_s2sanalyst'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_s2sanalyst', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_s2sdatecomp', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_s2sdatecomp', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_s2sdatecomp'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_s2sdatecomp', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_compreviewer', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_compreviewer', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_compreviewer'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_compreviewer', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_compreviewerdt', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_compreviewerdt', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_compreviewdate'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_compreviewerdt', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_impdonedate', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_impdonedate', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_impdonedate'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_impdonedate', z)
			update = true
		}
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_impbank', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_impbank', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_bank'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_impbank', z)
			update = true
		}
			
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_glset', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_glset', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_glsetup'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_glset', z)
			update = true
		}		
/*		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_imprt', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_imprt', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_import'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_imprt', z)
			update = true
		}*/
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_analyst', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_analyst', z))
		{
			//If this is the first time for a Analyst - set the date started to today
			
			var caseid = nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_internalid', z)
			var ckanalyst = nlapiLookupField('supportcase', caseid, 'custevent_imp_analyst')
			if (ckanalyst == null || ckanalyst == "")
			{
				nosubs = nosubs + 1
				submitfld[nosubs] = 'custevent_imp_qadate'
				submitdata[nosubs] = today
				update = true
			}

			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_analyst'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_analyst', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_who', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_who', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_who'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_who', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_acquiom', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_acquiom', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_acquiom'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_acquiom', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_ssource', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_ssource', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_systemtosource'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_ssource', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_majorsh', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_majorsh', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_majorsh'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_majorsh', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_welcome', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_welcome', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_welcome'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_welcome', z)
			update = true
		}	
			
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_banklt', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_banklt', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_banklet'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_banklt', z)
			update = true
		}		
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_deplt', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_deplt', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_depverification'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_deplt', z)
			update = true
		}		
/*		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_eventlt', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_eventlt', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_eventgl'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_eventlt', z)
			update = true
		}*/
		if (nlapiGetLineItemValue('custpage_importlist', 'custpage_notes1', z) != nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_notes1', z))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_memo'
			submitdata[nosubs] = nlapiGetLineItemValue('custpage_importlist', 'custpage_notes1', z)
			update = true
		}		
		if (update)
		{
			var caseid = nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_internalid', z)
			
			//Import Case
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custevent_imp_openrellock'
			submitdata[nosubs] = ""
			nlapiSubmitField('supportcase', caseid, submitfld, submitdata)
			update = false
			nosubs = -1	
		}
	}
}

//Otherwise go back to forms
var url = nlapiResolveURL('SUITELET','customscript_importdashsuitelet','customdeploy_importdashsuitelet',null);
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

var size = nlapiGetLineItemCount('custpage_importlist'); 
var user = nlapiGetUser()

//Lets loop thru all the line to see if we can find updates
for(z=1;z<=size;z++)
{
	if (nlapiGetLineItemValue('custpage_importlist', 'custpage_locked', z) == 'T')
	{
		var caseid = nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_internalid', z)
		var lock = nlapiLookupField('supportcase', caseid, 'custevent_imp_openrellock')
		
		//OK to open if owned or open
		if (lock == user || lock == null || lock == "")
		{
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_analyst', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_acquiom', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_datestarted',false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_datecompleted', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_dateapproved', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_glset', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_imprt', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_ssource', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_majorsh', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_welcome', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_banklt', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_deplt', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_eventlt', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_notes1', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_impbank', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_who', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_s2sanalyst', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_compreviewer', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_datesendrrd', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_s2sdatecomp', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_compreviewerdt', false, z)
			nlapiSetLineItemDisabled('custpage_importlist', 'custpage_impdonedate', false, z)
		
			//Lock the case for update
			nlapiSubmitField('supportcase', caseid, 'custevent_imp_openrellock', user)
		}
		else
		{
			var caseno = nlapiLookupField('supportcase', caseid, 'casenumber')
			var username = nlapiLookupField('supportcase', caseid, 'custevent_imp_openrellock', true)
			alert ('Case #' + caseno + ' already locked by ' + username)
			nlapiSetLineItemValue('custpage_importlist', 'custpage_locked', z, 'F')
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

var size = nlapiGetLineItemCount('custpage_importlist');	
var user = nlapiGetUser()

for(z=1;z<=size;z++)
{
	var locked = nlapiGetLineItemValue('custpage_importlist', 'custpage_hid_locked', z)
	if (locked != user && locked != null && locked != "")
	{
		nlapiSetLineItemDisabled('custpage_importlist', 'custpage_locked', true, z)
		var lockname = nlapiGetLineItemText('custpage_importlist', 'custpage_hid_locked', z)
//		nlapiSetLineItemValue('custpage_importlist', 'custpage_lockedind', z, 'Frank')			
	}
		
}
	
			
}


