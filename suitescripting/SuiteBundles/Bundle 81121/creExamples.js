//------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// CRE WORKFLOW ACTION SCRIPT EXAMPLE ////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------------------------------------------------------------
//Function:			creProfileMassUpdate
//Record:			(depends on deployment)
//Script Type:		Workflow Custom Action Script
//Description:		First CRE Profile Execute in a Workflow Context
//------------------------------------------------------------------------------------------------------------------------------------

function creProfileWorkFlowAction() {
	"use strict";
	var func = "creProfileWorkFlowAction ";
	//nlapiLogExecution("DEBUG", func + "Starting ", "");
	
	//get data on the record being processed (depends on the deployment)
	var rec = nlapiGetNewRecord();
	var rec_id = rec.getId();	//the key we need to drive the Content Rendering Engine
	var rec_type = rec.getRecordType();  // if needed, we can discriminate; but no need in this model
	
	//get the script deployment parameter to learn which Content Rendering Engine Profile is in play
	var context = nlapiGetContext();
	var profileid = context.getSetting('SCRIPT', 'custscript_cre_wf_profile_id');
	
	//output some diagnostics 
	nlapiLogExecution("DEBUG", "rec_type", rec_type);
	nlapiLogExecution("DEBUG", "rec_id", rec_id);
	nlapiLogExecution("DEBUG", "profileid", profileid);

	//let's go to work
	try {
		if (!profileid){
			 throw nlapiCreateError(func, "Must supply a CRE Profile ID from Script Parameters");
		}
		
		//the actual work
		var creProfile = new CREProfile(profileid);
	    creProfile.Translate(rec_id);
	    return creProfile.Execute();
		
	 } catch (e) {
	      if (e instanceof nlobjError) {
	          nlapiLogExecution("ERROR", func, e.getCode() + " : " + e.getDetails());
	      } else {
	          nlapiLogExecution("ERROR", func, e.message);
	      }
	      throw nlapiCreateError(func, e);
	  }
	//nlapiLogExecution("DEBUG", func + " End ", "");
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// CRE MASS UPDATE EXAMPLE ///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------------------------------------------------------------
//Function:			creProfileMassUpdate
//Record:			CREProfile
//Script Type:		Mass Update
//Description:		Runs mass update for CRE Profile 
//------------------------------------------------------------------------------------------------------------------------------------

function creProfileMassUpdate(rec_type, rec_id) 
{
	"use strict";
	var func = "creProfileMassUpdate";
	nlapiLogExecution("DEBUG", func + " Start ", "");
	
	nlapiLogExecution("DEBUG", "rec_type", rec_type);
	nlapiLogExecution("DEBUG", "rec_id", rec_id);
	var context = nlapiGetContext();
	var profileid = context.getSetting('SCRIPT', 'custscript_cre_profile_id');
	
	try
	{
		var creProfile = new CREProfile(profileid);
	    creProfile.Translate(rec_id);
	    creProfile.Execute();
		
	 } catch (e) {
	      if (e instanceof nlobjError) {
	          nlapiLogExecution("ERROR", func, e.getCode() + " : " + e.getDetails());
	      } else {
	          nlapiLogExecution("ERROR", func, e.message);
	      }
	      throw nlapiCreateError(func, e);
	  }
	
	
	
	nlapiLogExecution("DEBUG", func + " End ", "");
	
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// CRE RESTLET EXAMPLE  //////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function restletError(status, msg) {
	  "use strict";
	  var e = {};
	  e.status = status;
	  e.message = msg;
	  return e;
	}
//------------------------------------------------------------------
//Function:         creProfileExecuteRestlet
//Description:      -- Executes CRE Profile
//Script Type:         Restlet
//Example of Restlet call via CURL: 
//  curl -k -G  -H "Content-Type: application/json" -H 'Authorization: NLAuth nlauth_account=account_id, nlauth_email=email, nlauth_signature=url_encoded_password, nlauth_role=3' -d "script=264&deploy=1&profileId=7&Id=192" https://rest.na1.netsuite.com/app/site/hosting/restlet.nl
//------------------------------------------------------------------
function creProfileExecuteRestlet(datain) {
  "use strict";
  var func = "creProfileExecuteRestlet",
  profileId = datain.profileId,
  id = datain.Id;
  
  try {
      nlapiLogExecution("DEBUG", func, "profileid " + profileId);
      nlapiLogExecution("DEBUG", func, "id " + id);
      if (!profileId) {
          return restletError("failed", "Missing profileId");
      }
      if (!id) {
          return restletError("failed", "Missing Id");
      }
      
      var creProfile = new CREProfile(profileId);
      creProfile.Translate(id);
      return creProfile.Execute();

  } catch (e) {
      nlapiLogExecution("ERROR", func, e.message);
      return restletError("failed", e.message);
  }
}





///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// CRE USER EVENT EXAMPLE ////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//------------------------------------------------------------------
//Function:         CRE_SalesOrder_AfterSubmit
//Description:      -- Executes CRE Profile
//Script Type:         User Event
//------------------------------------------------------------------
function CRE_SalesOrder_AfterSubmit(type)
{
	"use strict";
	if ((String(type)==='delete')||(String(type)==='xedit'))
	{	
		return;
	}
	var func = 'CRE_SalesOrder_AfterSubmit';
	var id = nlapiGetRecordId();
	nlapiLogExecution('AUDIT', func + 'starting', type + '|' + id);
	if ( String(type) === 'create')
	{
		var context = nlapiGetContext();
		var profileid = context.getSetting('SCRIPT', 'custscript_cre_profile');
		
		 var creProfile = new CREProfile(profileid);
	     creProfile.Translate(id);
	     var result = creProfile.Execute();
	     nlapiLogExecution('AUDIT', func + 'execution result', result);
	}
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// CRE PARAMERTIZED SCRIPT EXAMPLE ///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//------------------------------------------------------------------
//Function: ExecuteCREProfile
//Description:  Illustrates firing a CRE from a script parameter
//Date:  2015, MO;
//Suggest clean up; 20160327, MZ;
//------------------------------------------------------------------


function ExecuteCREProfile(type) 
{
	
	"use strict";
	var func = 'ExecuteCREProfile';
	var profileid = nlapiGetContext().getSetting('SCRIPT', 'custscript_scheduled_cre_profile'),
	id = null,
	creProfile = null
	, i = 0;
	
	
	nlapiLogExecution("AUDIT","test", type);
	nlapiLogExecution("AUDIT","scheduledParameter", profileid);
	
	
    
  //only execute when run from the scheduler 
    //if ( type != 'scheduled' && type != 'skipped' ) return; 
   
     var filters = [];
     filters[0] = new nlobjSearchFilter( 'mainline', null, 'is', 'T' );
     filters[1] = new nlobjSearchFilter( 'trandate', null, 'equalTo', 'today' );
   
     var searchresults = nlapiSearchRecord( 'salesorder', null, filters, null, null );
     
     if (searchresults)
     {
	     for (i = 0; i < searchresults.length; i+=1 )
	     {
	        id = searchresults[i].getId();
			try
	       	{
		        creProfile = new CREProfile(profileid);
		        creProfile.Translate(id);
		        creProfile.Execute();
	       	}
	       	catch(e) 
	   		{
	            nlapiLogExecution("ERROR", func, e.message);
	   		}

	        
	     }
     }
	nlapiLogExecution("DEBUG","finished", 'finished');
	
}




//------------------------------------------------------------------------------------------------------------------------------------
//Function:			executeCREProfileSuitelet
//Script Type:		Suitelet
//Description:		Execute CRE via Suitelet
//Example URL: 		https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=134&deploy=1&profileid=13&id=7256
//Date:				20150819, MO
//------------------------------------------------------------------------------------------------------------------------------------
function executeCREProfileSuitelet(request, response)
{
	"use strict";
	var profileid = request.getParameter('profileid')
	, id = request.getParameter('id')
	, doNotSend = (request.getParameter('doNotSend') == 'T')
	, msg = "";
	
	if ( String(request.getMethod()) === 'GET' )
	{
		if (!profileid)
        {
			msg = "CRE Profile ID parameter 'profileid' is required.<br>";
          	response.writePage( '');
        }
		if (!id)
        {
			msg = msg + "Record ID parameter 'id' is required.<br>";
        }
        if (msg)
        {
        	response.write(msg);
        	return;
        }
          	
        var creProfile = new CREProfile(profileid);
        creProfile.Translate(id);
        creProfile.Execute(doNotSend);
               
        var foldername = cre_getFolderName(TEMPLATE_FOLDER_ID);
        
    	if (creProfile.fields.DocumentName.translatedValue)
    	{
    		try
           	{
	            var f = nlapiLoadFile(foldername +'/' + creProfile.fields.DocumentName.translatedValue);
	            var url = f.getURL();
	            var html = '<html><body><br><br><a href="'+url+'">' + (creProfile.fields.DocumentName.translatedValue||'') + '</A>' + "<hr><br>";
	            if (creProfile.fields.DocumentName.translatedValue.toLowerCase().endsWith('pdf'))
        	    {
	       	  		html = html + '<object data="'+url+'" type="application/pdf" width="75%" height="900">alt : <a href="'+url+'">'+creProfile.fields.DocumentName.translatedValue+'</a></object></body></html>';
        	    }
	            else
	            {
	            	html = html + '<object data="'+url+'" width="75%" height="900">alt : <a href="'+url+'">'+creProfile.fields.DocumentName.translatedValue+'</a></object></body></html>';
	            }
	       	  	response.write(html);
           	}
	       	catch(e) 
	   		{
	       		var str = "Document Name not defined correctly " + creProfile.fields.DocumentName.Value + '-->' + creProfile.fields.DocumentName.translatedValue;
	   			nlapiLogExecution("ERROR", 'could not create document', str);
	           	//	syntax template does not exist. Return this one.
	           	response.write(str);
	   		}
    	}
    	else
    	{
    		response.write ("Profile "+profileid+" executed successfully.");
    	}
            
	}
  		
}

//------------------------------------------------------------------------------------------------------------------------------------
//Function:			executeCREProfileHTTPRequestSuitelet
//Script Type:		Suitelet
//Description:		Leverage CRE to draw full complete HTML input pages using the CRE Request Input HTTP object
//Example URL: 		
//Date:				2018010, MO / MZ
//------------------------------------------------------------------------------------------------------------------------------------
function executeCREProfileHTTPRequestSuitelet(request, response)
{
	"use strict";
	var profileid = request.getParameter('profileid')
	, httprequestid = request.getParameter('httprequestid')
	, businessid = request.getParameter('businessid')
	, msg = "";
	
	var ExtraJSONData = {'today': new Date()};
	var BusRecordSearchTypeID = -30; // NetSuite's internal ID for searching all Transactions (for reference only)
	
	if (!profileid) {
		msg = "CRE Profile ID parameter 'profileid' is required.<br>";
    }
    
	if (msg) {
		response.write(msg);
		return;
	}
	
	//if we have an http request id of a previous request, use it.  Else it will be null
	//and we will get an insert operation
	var creHTTPRequest = new CREHTTPRequest(httprequestid);
	
	//now prepare related data (assumes nothing) and get back a request ID
	httprequestid = creHTTPRequest.writeHTTPRequest(profileid, BusRecordSearchTypeID, businessid, ExtraJSONData);
	  
	var creProfile = new CREProfile(profileid);
	creProfile.Translate(httprequestid);
	creProfile.Execute(true); // execute with the 'do not send' parameter
	         
	//get the content that was generated.  Assumes we got good html in complete form
	var html = creProfile.fields.BodyTemplate.translatedValue;
	
	if (!html) {
		html = "No content returned.";
	}
	
	response.write(html);
}




//------------------------------------------------------------------------------------------------------------------------------------
//Function:			creWebPageGeneratorSuitelet
//Script Type:		Suitelet
//Description:		Generates a Suitelet form where the user can select among CRE profiles which match a certain criteria. Once the user selects one, 
//					it executes the profile and sends the full results back to user
//					this is useful for CRE profiles which generate entire HTML pages
//Example URL: 		https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=134&deploy=1&profileid=13&id=7256
//Date:				20150929, BD
//------------------------------------------------------------------------------------------------------------------------------------

function creWebPageGeneratorSuitelet(request, response) {
	
	var funcName = "pri_creWebPageGeneratorSuitelet"; 
	
	var formPosted = false;
	
	var form = nlapiCreateForm("Generate Form", false);
	
    var group = form.addFieldGroup("custpage_group1", "Select the Profile, and click 'Generate' to view the results.", "custpage_inputtab");
    group.setShowBorder(true);
    group.setSingleColumn(true);

	var fld = form.addField("custpage_profile_id", "select", "Profile",null,"custpage_group1");
	

	var context = nlapiGetContext();

	var profileType = context.getSetting("SCRIPT", "custscript_cre_webpage_profile_type");
	
	var filters = [];		
	var columns = [];
	filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));
	filters.push(new nlobjSearchFilter("custrecord_pri_cre_profile_type",null,"is",profileType));
	
	columns.push(new nlobjSearchColumn("name").setSort());
		
	var searchResults = nlapiSearchRecord("customrecord_pri_cre_profile", null, filters, columns) || [];
		
	for (i = 0; i < searchResults.length; i++) {
		fld.addSelectOption(searchResults[i].getId(),searchResults[i].getValue("name"));
		nlapiLogExecution("AUDIT", funcName, "adding a row to DDL");
	}
	 
	
	if (request.getMethod() != "GET") {

		var profileId = request.getParameter("custpage_profile_id");
    	
		var creProfile = new CREProfile(profileId);
		creProfile.Translate(profileId);	
	    creProfile.Execute();

	    var htmlString = "";
	    
	    if (creProfile.fields.DocumentName.file) {
		    var f = creProfile.fields.DocumentName.file // nlapiLoadFile(creProfile.fields.DocumentName.file);
			if (f && f.getType()) {
				htmlString = f.getValue();
			}
	    	
	    } else {
	    	htmlString = creProfile.fields.BodyTemplate.translatedValue;
	    }

	    var group = form.addFieldGroup("custpage_group2", "Result", "custpage_outputtab");
	    group.setShowBorder(true);
	    group.setSingleColumn(true);

    	var fld = form.addField("custpage_html", "inlinehtml", "Result",null,"custpage_group1");
    	fld.setDefaultValue(htmlString);
    	// fld.setDisplayType("inline");
	}

	if (searchResults.length)
		form.addSubmitButton("Generate");
	response.writePage(form);
	
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// CRE ENHANCE NATIVE NETSUITE ELEMENTS //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//------------------------------------------------------------------
//Function: beforeLoad_createCREbutton
//Description:  Creates button on record specified in deployment.  
//On button press the CRE profile, set as parameter, is executed 
//and the output is shown in a new window using example SuiteLet.
//Date:  02/01/2016, MM; 20160327 Error Handling, MZ          
//------------------------------------------------------------------
function beforeLoad_createCREbutton(type, form, request){
	var func = 'beforeLoad_createCREbutton;';
	if(type=='view'){
		try
       	{
			var buttonName = nlapiGetContext().getSetting('SCRIPT','custscript_cre_button_name');
			var profileid = nlapiGetContext().getSetting('SCRIPT','custscript_cre_profile_id_button');
			var recordId=nlapiGetRecordId();
			var url = nlapiResolveURL('suitelet','customscript_cre_profile_suitelet_exampl','customdeploy_test_cre') + '&profileid=' + profileid + '&id=' + recordId + '&doNotSend=T';
			
			var html = '<SCRIPT language="JavaScript" type="text/javascript">';
			html += "function bindEvent(element, type, handler) {if(element.addEventListener) {element.addEventListener(type, handler, false);} else {element.attachEvent('on'+type, handler);}} "; 
			html += 'bindEvent(custpage_callcrebutton, "click", function(){';
			html += 'window.open("'+url+'","_blank");';
			html += '});';
			html += '</SCRIPT>';
			
			var hookPoint = Math.floor(Math.random()*90000) + 10000;
			
			var field0 = form.addField('custpage_cre_hookpoint' + hookPoint, 'inlinehtml', '',null,null);
			
			field0.setDefaultValue(html);
			
			form.addButton('custpage_callcrebutton',buttonName,'function()');
       	}
       	catch(e) 
   		{
            nlapiLogExecution("ERROR", func, e.message);
   		}
	};
};


//------------------------------------------------------------------------------
//Function: 		cre_EmailTemplate_BeforeLoad
//Record: 			message
//Type:				BeforeLoad
//Description:  	Open the related transaction and generate the cre attachment 
//					Add as attachments to current message
//
//Date:				20160421 SG; 20160424 MZ
//------------------------------------------------------------------------------
function cre_EmailTemplate_MsgBeforeLoad(type, form, request)
{
	if (type !='create') return;
	var context = nlapiGetContext();
	if (context.getExecutionContext() != 'userinterface') return;
	if (!request) return;
	
	//watch values being passed
	var params = request.getAllParameters();
	for ( param in params ) {
	    nlapiLogExecution('DEBUG', 'parameter: '+ param + '; value: ', params[param]);
	} 
	
	// get the query string parameters; this message example only works with transactions
	var recid = noempty(request.getParameter("transaction"),'');
	if (recid.length == 0) return;
	
	var rectype = nlapiLookupField('transaction', recid, 'type', false);
	nlapiLogExecution('DEBUG', 'Transaction ID: '+ recid+ '; type: ', rectype);
	
	//see script parameter default definition for JSON structure
	var cre_trx_binding = JSON.parse(noempty(context.getSetting('SCRIPT', 'custscript_cre_transaction_binding'),'{}'));
	var cre_profileid = cre_trx_binding[rectype];
  	if (!cre_profileid) return;
	if (cre_profileid.length == 0) return;
	
	//prepare to do work
	var error_list = [];
	var file_obj = null;
	var attachment_list = [];
	
	//produce CRE output
	try
	{
	    var creProfile = new CREProfile(cre_profileid);
	    creProfile.Translate(recid);
      creProfile.Execute(true);		// always execute it in a "non-sending" mode (parameter: true)
	}
	catch(e) 
	{
		var str = "There was trouble generating the CRE file: " + recid + '-->' + cre_profileid; + '; error: ' + e.getCode();
			nlapiLogExecution("ERROR", 'could not create cre ouput', str);
			error_list.push("There was an error creating the CRE file. " + str);
	}
	     
	var foldername = cre_getFolderName(TEMPLATE_FOLDER_ID);
  
	if (creProfile.fields.DocumentName.translatedValue) {
		try
     	{
          file_obj = nlapiLoadFile(foldername +'/' + creProfile.fields.DocumentName.translatedValue);
     	}
     	catch(e) 
 		{
     		var str = "There was trouble looking up CRE output file: " + creProfile.fields.DocumentName.Value + '-->' + creProfile.fields.DocumentName.translatedValue; + '; error: ' + e.getCode();
 			nlapiLogExecution("ERROR", 'could not create document', str);
         	//	syntax template does not exist. Return this one.
 			error_list.push("There was an error creating the CRE attachment. " + str);
 		}
	}
	
	if (file_obj){
		nlapiLogExecution('DEBUG', 'fetched file' + file_obj.getName() + '; id:' +  file_obj.getId() + '; type:' + file_obj.getType() );
		attachment_list.push(file_obj.getId());
	} else {
		nlapiLogExecution('DEBUG', 'Missing fetchd file; return');
		error_list.push("There was an error attaching the CRE file.");
	}		
	
	if (attachment_list.length > 0){
		var att_list_str = JSON.stringify(attachment_list);
		nlapiLogExecution('DEBUG', 'attachment_list', att_list_str);
		
		for (var m=0; m<attachment_list.length; m++){
			nlapiSelectNewLineItem('mediaitem');
			nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', attachment_list[m]);
			nlapiCommitLineItem('mediaitem');
		}
	} else {
		nlapiLogExecution('DEBUG', 'attachment_list is empty');
		error_list.push("Expected an attachment and found none.");
	}

	// now enhance the default CRE message system to remove the default transaction checkbox so they don't send
	// netsuite's default message.
	var html = "";
	html += '<SCRIPT language="JavaScript" type="text/javascript">\r\n';
	html += "function bindEvent(element, type, handler) {if(element.addEventListener) {element.addEventListener(type, handler, false);} else {element.attachEvent('on'+type, handler);}} \r\n";
	html += "</SCRIPT>\r\n";
	html += '<SCRIPT language="JavaScript" type="text/javascript">\r\n';
	html += "function wload() \r\n{\r\n";
	html += "nlapiSetFieldValue('includetransaction', 'F');\r\n";
	html += "var fld = nlapiGetField('includetransaction');\r\n";
	html += "if (fld){fld.setDisplayType('hidden');};\r\n";
	html += "var fld = nlapiGetField('emailpreference');\r\n";
	html += "if (fld){fld.setDisplayType('hidden');};\r\n";
	if (error_list.length > 0){
		html += "alert('Warning: there appears to be an error fetching attachments. Please review the attachment list before sending.\\n\\n"+error_list.join('\\n')+"');\r\n";
		nlapiLogExecution('ERROR', 'Error fetching attachments', JSON.stringify(error_list));
	}
	html += "}\r\n";
	html += "</SCRIPT>\r\n";
	html += '<SCRIPT language="JavaScript" type="text/javascript">\r\n';
	html += 'bindEvent(window, "load", wload);\r\n';            
	html += "</SCRIPT>\r\n";
	var field0 = form.addField('custpage_client_html', 'inlinehtml', '',null, null);
	field0.setDefaultValue(html);     
}


/*
Author: HTTP
Type: Suitelet
*/

//------------------------------------------------------------------------------
//Function: 		ExecuteCreProfile
//Record: 			None
//Type:				SuiteLet
//Description:  	Allows an adminstrator to run a profile in production mode
//
//Date:				NP 20161027; MZ 20161028
//------------------------------------------------------------------------------
const EXECUTE_SERVER_SCRIPT = "_pri_cre_profile_execute";
const EXECUTE_CLIENT_SCRIPT = "customscript_pri_cre_profile_execute_cs";

function ExecuteCreProfile(request, response) {
	this.request 			= request;
	this.response 			= response;
	this.profile 			= null;
	this.record 			= null;
	this.message 			= "";
	this.nav 				= "";
	
	
	this.processRequest = function() {
		if(this.request.getMethod() == "GET") {
			this.response.writePage(this.generateForm());
		} else {
			this.processProfileRequest();
		}
	};

	this.generateForm = function() {
		this.profile 	= this.request.getParameter('custpage_profile');
		this.record 	= this.request.getParameter('custpage_record');
		this.nav 		= this.request.getParameter('custpage_nav');

		
		var form 	= nlapiCreateForm("Trigger CRE Profile", (this.nav == 'F') ? true : false );
		form.setScript(EXECUTE_CLIENT_SCRIPT);
	
		//general usage field group
		form.addFieldGroup('fields', 'Select a Content Renderer Engine (CRE) Profile and Related Record to Execute').setShowBorder(true).setSingleColumn(false);
		
		//include a validation message field
		if(this.isNotEmpty(this.message)) {			
			form.addFieldGroup("message", "Message");
			var msg = form.addField('custpage_message', "inlinehtml", "Message");
			msg.setDefaultValue(this.message);
			msg.setLayoutType("outside", "startrow");
		}
		
		//submission
		var b = form.addField("custpage_profile", "select", "Profile", "customrecord_pri_cre_profile", "fields");
		var oNav = form.addField("custpage_nav", "text", "Nav");
		oNav.setDefaultValue((this.nav == 'F') ? 'F' : 'T');
		oNav.setDisplayType('hidden');
		
		var button = form.addSubmitButton("Execute");
		button.setDisabled(true);
		
		/*
		nlapiLogExecution("Debug", "test", this.request.getParameter('profile'));
		nlapiLogExecution("Debug", "try", this.isNotEmpty(this.request.getParameter('profile')));*/
	
		
		//setup record reference
		if(this.isNotEmpty(this.profile)) {
			b.setDefaultValue(this.profile);
	
			var transactionType = nlapiLookupField("customrecord_pri_cre_profile", this.profile, "custrecord_pri_cre_profile_rectype", true);
			var intTransactionTypeId = nlapiLookupField("customrecord_pri_cre_profile", this.profile, "custrecord_pri_cre_profile_rectype", false);
			var transactionName = nlapiLookupField("customrecord_pri_cre_profile", this.profile, "custrecord_pri_cre_profile_rec_name", false);
			if(this.isNotEmpty(transactionType)) {
				try {					
					var tr = form.addField('custpage_record', "select", "Select a " + transactionType + " (referenced as " + transactionName + ")", intTransactionTypeId, "fields");
					if(this.isNotEmpty(this.record)) {
						tr.setDefaultValue(this.record);
					}
					button.setDisabled(false);
				} catch(e) {
					nlapiLogExecution("Debug", "ERROR", "Record type is not valid.");
				};
			};
		}
		return form;
	};


	this.processProfileRequest = function() {
		this.profile 		= this.request.getParameter('custpage_profile');
		this.record 		= this.request.getParameter('custpage_record'); 
	
		//execute the profile if we have data
		if(this.isNotEmpty(this.profile) && this.isNotEmpty(this.record)) {
			try {
				var creProfile = new CREProfile(this.profile);
				creProfile.Translate(this.record);
				creProfile.Execute();
	
				this.message = "<div style = 'padding: 10px; font-size: 15px; color: #3c763d; background-color: #dff0d8; border-color: #d6e9c6; margin-bottom: 10px; width: 100vw; font-weight: bold;'>Execution Successful!</div>";
			} catch (e) {
				if (e instanceof nlobjError) {
					this.message = "<div style = 'padding: 10px; font-size: 15px; color: #a94442; background-color: #f2dede; border-color: #ebccd1; margin-bottom: 10px; width: 100vw; font-weight: bold;'>" + e.getCode() + " : " + e.getDetails() + "</div>";
				} else {
					this.message = "<div style = 'padding: 10px; font-size: 15px; color: #a94442; background-color: #f2dede; border-color: #ebccd1; margin-bottom: 10px; width: 100vw; font-weight: bold;'>" + e.message + "</div>";
				};
			};
		} else {
			nlapiLogExecution("Debug", "ERROR", "Empty fields detected!");
			this.message = "<div style = 'padding: 10px; font-size: 15px; color: #a94442; background-color: #f2dede; border-color: #ebccd1; margin-bottom: 10px; width: 100vw; font-weight: bold;'>Empty fields detected!</div>";
		}
	
		this.response.writePage(this.generateForm());
	};

	this.isNotEmpty = function(value) {
		if(value == "" || value == null || value == undefined) {
			return false;
		} else {
			return true;
		}
	};
	
	//launch the suitelet
	this.processRequest();
}

//related client side code to script to go with execute utility
function onFieldChange(type, name, linenum) {
	if(name == "custpage_profile") {
		var value = nlapiGetFieldValue(name);
		if(value != "") {
	        //avoid the standard NetSuite warning message when navigating away
			if (window.onbeforeunload){
	            window.onbeforeunload=function() { null;};
	        };
	        var nav = ( window.location.href.indexOf('custpage_nav=F', 1) > 0 ) ? 'F' : 'T';
	        var url = nlapiResolveURL("SUITELET", "customscript" + EXECUTE_SERVER_SCRIPT, "customdeploy" + EXECUTE_SERVER_SCRIPT);
			window.location.href = url+"&custpage_profile=" + value + "&custpage_nav=" +  nav;
		};
	};
};

//------------------------------------------------------------------
//Function: _noempty
//Output: return the input_value if it has a value else the default value
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function noempty(input_value, default_value) {
	if (!input_value) {
	  return default_value;
	}
	if (input_value.length==0) {
	  return default_value;
	}
	return input_value;
};
