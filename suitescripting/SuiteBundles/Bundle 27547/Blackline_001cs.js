//------------------------------------------------------------------
//------------------------------------------------------------------
// Copyright 2013-2014, All rights reserved, Blackline Systems, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Blackline Systems, Inc.
//------------------------------------------------------------------
//------------------------------------------------------------------
//Client scripts
//------------------------------------------------------------------
//Function:         BL001_PageInit
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      Client Script - Page Init
//Script ID:
//Deployment ID:
//Description:		When the record is copied, clear out the current status information
//
//Task:
//Date:             SG 20121108
//------------------------------------------------------------------
function BL001_PageInit(type)
{
	if (type=='copy'){
		nlapiSetFieldValue('custrecord_bl001_entity_export_status', '');
		nlapiSetFieldValue('custrecord_bl001_entitytype_download', '');
		nlapiSetFieldValue('custrecord_bl001_entity_download', '');
		nlapiSetFieldValue('custrecord_bl001_account_export_status', '');
		nlapiSetFieldValue('custrecord_bl001_account_download', '');		
		nlapiSetFieldValue('custrecord_bl001_bankrec_export_status', '');
		nlapiSetFieldValue('custrecord_bl001_bankrec_download', '');	
		nlapiSetFieldValue('custrecord_bl001_multicurr_export_status', '');	
		nlapiSetFieldValue('custrecord_bl001_multicurr_download', '');
		
		nlapiSetFieldValue('custrecord_bl001_profile_file_api_key', '');
	}
	if (type=='view' || type=='edit'){
		var filen = nlapiGetFieldValue('custrecord_bl001_account_filename');
		if (filen){
			if ( filen.length>5){
				if (filen.substring(0,4)=='DND_'){
					filen = filen.substring(4);
					nlapiSetFieldValue('custrecord_bl001_account_filename', filen);
				}
			}
		}
	}
	if (type=='view' || type=='edit' || type=='create' || type=='copy'){
		// check if the account filter needs to be replaced
		var old_filt = bl_noempty(nlapiGetFieldValue('custrecord_bl001_account_incl_or_excl'),0);
		var new_filt = bl_noempty(nlapiGetFieldValue('custrecord_bl001_account_filter_options'),0);
		if (parseInt(new_filt)==0 && parseInt(old_filt)>0){
			nlapiSetFieldValue('custrecord_bl001_account_filter_options', old_filt);
		}
	}
}


//------------------------------------------------------------------
//Function:         BL001_CreateConsolExchRate
//Record:			           
//Subtab:
//Script Type:      Client Script - Button handler
//Script ID:
//Deployment ID:
//Description:		When the "Create Exch Rate" button is pressed
//
//Task:
//Date:             SG 20140510
//------------------------------------------------------------------
function BL001_CreateConsolExchRate()
{
	var sQs = "createexchrate=1";
    document.location = bl001_cleanurl(sQs);
}

//------------------------------------------------------------------
//Function:         BL001_SetupConsolExchRate
//Record:			           
//Subtab:
//Script Type:      Client Script - Button handler
//Script ID:
//Deployment ID:
//Description:		When the "Setup Exch Rate" button is pressed, go to the form
//
//Task:
//Date:             SG 20140510
//------------------------------------------------------------------
function BL001_SetupConsolExchRate()
{
	var exch_link = nlapiResolveURL( 'RECORD', 'customrecord_bl001_exchange_rates').replace('custrecordentry','custrecordentrylist');
	document.location = exch_link;
}

//------------------------------------------------------------------
//Function:         BL001_StartExport
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      Client Script - Button handler
//Script ID:
//Deployment ID:
//Description:		When the "Run Export" buttons are clicked, redirect back to this page with &start= in URL
//
//Task:
//Date:             SG 20121108
//------------------------------------------------------------------
function BL001_StartExport(export_type)
{
	var sQs = "start=" + export_type;
    document.location = bl001_cleanurl(sQs);
}
//------------------------------------------------------------------
//Function:         BL001_Refresh
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      Client Script - Button handler
//Script ID:
//Deployment ID:
//Description:		When the "Refresh" button is clicked, reload the page
//
//Task:
//Date:             SG 20121108
//------------------------------------------------------------------
function BL001_Refresh()
{
	document.location = bl001_cleanurl("");
}
//------------------------------------------------------------------
//Function:         BL001_New_API_Key
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      Client Script - Button handler
//Script ID:
//Deployment ID:
//Description:		When the "New API Key" button is clicked, go back to the server to regenerate
//
//Task:
//Date:             SG 20130315
//------------------------------------------------------------------
function BL001_New_API_Key()
{
	if (confirm("Are you sure you want to generate a new File API Key? The existing key will be invalid. Any dependencies will break.\r\n\r\nPress Yes or OK to proceed.")){
		var sQs = "newkey=T";
		document.location = bl001_cleanurl(sQs);
	}
	
}
//------------------------------------------------------------------
//Function:         BL001_Reset
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      Client Script - Button handler
//Script ID:
//Deployment ID:
//Description:		When the "Reset" button is clicked, clear out the read-only fields; this is only avail for admins
//
//Task:
//Date:             SG 20121108
//------------------------------------------------------------------
function BL001_Reset()
{
	nlapiSetFieldValue('custrecord_bl001_entity_export_status', '');
	nlapiSetFieldValue('custrecord_bl001_entitytype_download', '');
	nlapiSetFieldValue('custrecord_bl001_entity_download', '');
	nlapiSetFieldValue('custrecord_bl001_account_export_status', '');
	nlapiSetFieldValue('custrecord_bl001_account_download', '');		
	nlapiSetFieldValue('custrecord_bl001_bankrec_export_status', '');
	nlapiSetFieldValue('custrecord_bl001_bankrec_download', '');	
	nlapiSetFieldValue('custrecord_bl001_multicurr_export_status', '');	
	nlapiSetFieldValue('custrecord_bl001_multicurr_download', '');
	
}
function bl001_cleanurl(sQs)
{
	var curr_loc = document.location.toString();
	if (!sQs)sQs='';
	// remove the QS from the current URL
	if (sQs.length>0){
		curr_loc = curr_loc.replace('&'+sQs,'');
		curr_loc = curr_loc.replace('?'+sQs,'');
	}
	if (curr_loc){
		var ipos = curr_loc.indexOf('start=');
		if (ipos){
			if (ipos > 3) {
				curr_loc = curr_loc.substring(0, ipos-1);
			};
		}
		var sep = '&';
		if (curr_loc.indexOf('?')<0){
			sep = "?";
		}
	    var url = curr_loc;
	    if (sQs){
	    	if (sQs.length>0){
	    		url += sep + sQs;
	    	};
	    }
	    return url;
		
	}else{
		return "";
	};
}
//------------------------------------------------------------------
//Function:         BL001_FieldChanged
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      Client Script - Field Change handler
//Script ID:
//Deployment ID:
//Description:		When the reporting period dropdown is selected, enable/disable the custom date fields
//
//Task:
//Date:             SG 20121122
//------------------------------------------------------------------
function BL001_FieldChanged(type, name, linenum)
{
	if (name=='custrecord_bl001_account_reportingperiod')
		{
			var fld_val = nlapiGetFieldValue(name);
			// if fld is 'Custom Date' we need to enable the fields
			if (fld_val == '1'){
				nlapiDisableField('custrecord_bl001_period_start_date', false);
				nlapiDisableField('custrecord_bl001_period_end_date', false);
			} else {
				nlapiSetFieldValue('custrecord_bl001_period_start_date','');
				nlapiSetFieldValue('custrecord_bl001_period_end_date','');
				nlapiDisableField('custrecord_bl001_period_start_date', true);
				nlapiDisableField('custrecord_bl001_period_end_date', true);
			};
		};
		
	if (name=='custrecord_bl001_schedule_runtime'){
		nlapiSetFieldValue('custrecord_bl001_schedule_next_run', '');
	}
};

//------------------------------------------------------------------
//Function: _noempty
//Output: return the input_value if it has a value else the default value
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function bl_noempty(input_value, default_value)
{
  if (!input_value)
  {
      return default_value;
  }
  if (input_value.length==0)
  {
      return default_value;
  }
  return input_value;
};
//------------------------------------------------------------------
