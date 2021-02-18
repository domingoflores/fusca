//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

var CONST_FOLDER_MAIN = "CRE Output";
var CONST_FOLDER_TEMP = "CRE TEMP";

var CONST_FEATURE_MANDATORY = [];
CONST_FEATURE_MANDATORY[0] = 'CUSTOMRECORDS';
CONST_FEATURE_MANDATORY[1] = 'CUSTOMCODE';
CONST_FEATURE_MANDATORY[2] = 'SERVERSIDESCRIPTING';
CONST_FEATURE_MANDATORY[3] = 'DOCUMENTS';
CONST_FEATURE_MANDATORY[4] = 'ADVANCEDPRINTING';

//work the preference list which is multi-dimensional;
var CONST_PREFERENCE_MANDATORY = new Object();
//setup sub types
//CONST_PREFERENCE_MANDATORY.accountingpreferences = new Object();
//CONST_PREFERENCE_MANDATORY.accountingpreferences.ASSETCOGSITEMACCTS = 'T';  //expand Account Lists


/**
 * @param {Number} toversion
 * @returns {Void}
 */
function beforeInstall(toversion) {
	nlapiLogExecution('DEBUG','beforeInstall: Checking features for version ', toversion);
	verifyFeatures();
	nlapiLogExecution('DEBUG','beforeInstall: Checking preferences for version ',  toversion);
	//verifyPreferences();
	nlapiLogExecution('DEBUG','beforeInstall: complete version  ' , toversion);
}

/**
 * @param {Number} toversion
 * @returns {Void}
 */
function afterInstall(toversion) {
	postVerification('New Install');
};

/**
 * @param {Number} fromversion
 * @param {Number} toversion
 * @returns {Void}
 */
function beforeUpdate(fromversion, toversion) {
	nlapiLogExecution('DEBUG','beforeUpdate: Checking features before, after versions ', fromversion + ', ' + toversion);
	verifyFeatures();
	nlapiLogExecution('DEBUG','beforeUpdate: Checking preferences before, after versions ', fromversion + ', ' + toversion);
	//verifyPreferences();
	nlapiLogExecution('DEBUG','beforeUpdate: complete before, after versions ', fromversion + ', ' + toversion);

};

/**
 * @param {Number} fromversion
 * @param {Number} toversion
 * @returns {Void}
 */
function afterUpdate(fromversion, toversion) {
	postVerification('Perform Update');
}


function verifyPreferences(){
	
	for (pref in CONST_PREFERENCE_MANDATORY) {
		for (subpref in CONST_PREFERENCE_MANDATORY[pref]){
			checkPreferenceEnabled(pref, subpref, CONST_PREFERENCE_MANDATORY[pref][subpref]);
		};
	};
	
	function checkPreferenceEnabled(pref, subpref, subprefval)
	{
      nlapiLogExecution('DEBUG','Checking preference, sub preference, sub pref value', pref + ', ' + subpref + ', ' + subprefval);
      var config = nlapiLoadConfiguration(pref);
      if (config.getFieldValue(subpref) == subprefval){
    	  nlapiLogExecution('DEBUG','Check preference passed');
    	  return true;
      } else {
    	  throw new nlobjError('INSTALLATION_ERROR','Preference: '+ pref + ', Sub Preference: ' + subpref + ' must be enabled to ' + subprefval + ' . Please enable the preference and re-try using \'Action, Update\'.');
      };
	};
	return;
};


function verifyFeatures(){
	
	for ( var i = 0; i < CONST_FEATURE_MANDATORY.length; i++ ) {
		checkFeatureEnabled(CONST_FEATURE_MANDATORY[i]);
	};
	
	function checkFeatureEnabled(featureId)
	{
      nlapiLogExecution('DEBUG','Checking Feature',featureId);
      var objContext = nlapiGetContext();
      var feature = objContext.getFeature(featureId);
 
      if ( feature ) {
    	  nlapiLogExecution('DEBUG','Feature',featureId+' enabled');
      } else {
    	  throw new nlobjError('INSTALLATION_ERROR','Feature '+featureId+' must be enabled. Please enable the feature and re-try using \'Action, Update\'.');
      };
	};
	
	return;
};


function postVerification(mode){
	nlapiLogExecution('DEBUG', 'Starting Post Verification Install in Mode:', mode);
	try {
 		
		//read the company wide parameters if they are there.  If so, then assume we are good
		//if not, create folders and set pointers
		
		//create the folders, if we need them
		nlapiLogExecution('DEBUG', 'postVerification', 'Creating CRE Output folders, if needed');
		
		//var TEMPLATE_FOLDER_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_cre_output_folder_id');
		//var TEMP_FOLDER_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_cre_temp_folder_id');
		//var GLOBAL_JAVASCRIPT_OVERRIDE = nlapiGetContext().getSetting('SCRIPT', 'custscript_cre_global_javascript_ovrride');		//the reference to our global javascript overrides
		
		var fid = null;
		var tid = null;
		var jid = null;
		var bCreated = false;
		
		
		if (!GLOBAL_JAVASCRIPT_OVERRIDE){
			//lookup location of the global javascript file which generally is in the templates folder
			var filters = [];
			filters[0] = new nlobjSearchFilter( 'name', null, 'is', GLOBAL_JAVASCRIPT_OVERRIDE_FILE );
			var j = nlapiSearchRecord( 'file', null, filters, null, null );
			if (j){
				jid = j[0].getId();
				GLOBAL_JAVASCRIPT_OVERRIDE = jid;
			}
			bCreated = true;
		}
	    	 
		
		if (!TEMPLATE_FOLDER_ID){
			var f = nlapiCreateRecord('folder');
			f.setFieldValue('name', CONST_FOLDER_MAIN);
			fid = nlapiSubmitRecord(f);
			nlapiGetContext().setSetting('SCRIPT', 'custscript_cre_output_folder_id', fid);
			TEMPLATE_FOLDER_ID = fid;
			bCreated = true;
		};
		
		if (!TEMP_FOLDER_ID){
			var t = nlapiCreateRecord('folder');
			t.setFieldValue('name', CONST_FOLDER_TEMP);
			if (fid){
				t.setFieldValue('parent', fid);
			};
			tid = nlapiSubmitRecord(t);
			nlapiGetContext().setSetting('SCRIPT', 'custscript_cre_temp_folder_id', tid);
			TEMP_FOLDER_ID = tid;
			bCreated = true;
		};
		
		if (bCreated){
			//send an email to the administrator with information on the folder setup 
			var msg = "CRE Bundle Install has setup two folders and found global CRE JavaScript Override file: <br> CRE Output:" +  fid + "; <br> CRE TEMP:" + tid + "; <br> CRE Global JavaScript Override:" + jid + ".  <br> <br> Configure " +
				"these variables under Setup, Company, General Preferences, Custom Preferences.";
			nlapiSendEmail(nlapiGetContext().getUser(), nlapiGetContext().getEmail() , "Prolecto: CRE Setup Parameters", msg);
		};
		
		//output the names of the folders
		nlapiLogExecution('DEBUG', 'postVerification', 'Folder / Temp  created and JavaScript Override: ' + TEMPLATE_FOLDER_ID + ' / ' + TEMP_FOLDER_ID );
		
	} catch (e){
	  if (e instanceof nlobjError) {
		  nlapiLogExecution('ERROR', 'AFTER_INSTALLATION_ERROR', e.getCode() + " : " + e.getDetails());
	  } else {
		  nlapiLogExecution('ERROR', 'AFTER_INSTALLATION_ERROR', 'Unexpected  error : ' + e.toString());
	  };
	  return false;
	};
};

