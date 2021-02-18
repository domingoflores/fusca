//-----------------------------------------------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------


function SRS01_generateRequestForm(request, response) {

    "use strict";
    
    var funcName = "SRS01_generateRequestForm";
    
    try {

	    var context = nlapiGetContext()
	    , form = nlapiCreateForm('Detailed Tax Report Request Form')
	    , d = new Date()
	    , creProfile = null
	    , message= ""
	    , field = null
	    , result = null;
	
	
	    //nlapiLogExecution("DEBUG", "test","test");
	
	    // field = form.addField('custpage_instructions','text',"", null, null);
	    // field.setDisplayType("inline");
	    // field.setDefaultValue("To Generate a New Report, select the Taxable Year, and optionally select a Shareholder and/or Deal.  Or, switch to the 'Manage Previous Reports' tab to view the output of previous reports.");
	    // field.setPadding(1);

		// var group = form.addFieldGroup('custpage_run_group', 'Selection Criteria', null);
		// group.setSingleColumn(true);
		// group.setShowBorder(true);

		
		var group = form.addFieldGroup('custpage_manage_group', 'Report Selection Criteria',null);
		group.setSingleColumn(true);
		group.setShowBorder(true);
		
		
	    field = form.addField('custpage_tax_year', 'select', "TAX YEAR", null, "custpage_manage_group");
	    for (var year = 2010; year <= new Date().getFullYear(); year++)
	    	field.addSelectOption(year, year);	    
	    if (request.getParameter("custpage_tax_year"))
	    	field.setDefaultValue(request.getParameter("custpage_tax_year"));
	    else
	    	field.setDefaultValue((new Date().getFullYear()).toString());
	    

	    field = form.addField('custpage_shareholder', 'select', "SHAREHOLDER", "customer", "custpage_manage_group");
	    if (request.getParameter('custpage_shareholder')) 
	    	field.setDefaultValue(request.getParameter('custpage_shareholder'));
	
	
	    field = form.addField('custpage_deal', 'select', "DEAL", "customer", "custpage_manage_group");
	    if (request.getParameter('custpage_deal')) 
	    	field.setDefaultValue(request.getParameter('custpage_deal'));

	    field = form.addField('custpage_only_this_deal', 'checkbox', "ONLY ACTIVITY FROM THIS DEAL?",null, "custpage_manage_group");
	    if (request.getParameter('custpage_only_this_deal')) 
	    	field.setDefaultValue(request.getParameter('custpage_only_this_deal'));


	    field = form.addField('custpage_encrypt_pdf', 'checkbox', "ENCRYPT PDF?",null, "custpage_manage_group");
	    if (request.getParameter('custpage_encrypt_pdf')) 
	    	field.setDefaultValue(request.getParameter('custpage_encrypt_pdf'));
	    field.setPadding(1);
		    

	    if (request.getParameter("submitter") == "Submit") {
    		var okToContinue = true;
    		
    		if (request.getParameter("custpage_shareholder")) 
    			if (nlapiLookupField("customer", request.getParameter("custpage_shareholder"), "category") != CUSTOMER_CATEGORY_IS_SHAREHOLDER) {
    		    	message = "<font color='red'>Selected record is not of category 'Shareholder'.</font>";
    				okToContinue = false;
    			}
    		if (request.getParameter("custpage_deal")) 
    			if (nlapiLookupField("customer", request.getParameter("custpage_deal"), "category") != CUSTOMER_CATEGORY_IS_DEAL) {
    		    	message = "<font color='red'>Selected record is not of category 'Deal'.</font>";
    				okToContinue = false;
    			}
    		
    		/* == changed their mind on this.  BD 2015-12-03
    		if (request.getParameter("custpage_deal") && request.getParameter("custpage_shareholder")) {
		    	message = "<font color='red'>You may not select BOTH a Shareholder AND a Deal.</font>";
				okToContinue = false;
			}
    		*/
    		
    		
    		
    		var shareholderId = request.getParameter("custpage_shareholder");
    		var dealId = request.getParameter("custpage_deal");
    		var shareholderList = srs00_findShareholdersWithActivity(request.getParameter("custpage_tax_year"), shareholderId, dealId);
    		
    		if (shareholderList.length == 0) {
		    	message = "<font color='red'>No records found for this selection criteria.  Nothing to report.</font>";
				okToContinue = false;	    			
    		}
    		
    		if (okToContinue) {
                var REC = nlapiCreateRecord(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID);
                REC.setFieldValue('custrecord_srs_dtr_hdr_shareholder', request.getParameter("custpage_shareholder"));
                REC.setFieldValue('custrecord_srs_dtr_hdr_deal', request.getParameter("custpage_deal"));
                REC.setFieldValue('custrecord_srs_dtr_hdr_tax_year', request.getParameter("custpage_tax_year"));
                REC.setFieldValue("custrecord_srs_dtr_hdr_only_this_deal", request.getParameter("custpage_only_this_deal"))
                
                REC.setFieldValue('custrecord_srs_dtr_hdr_encrypt_pdf', request.getParameter("custpage_encrypt_pdf"));
                REC.setFieldValue('custrecord_srs_dtr_hdr_status', TAX_REPORT_BATCH_STATUS_SUBMITTED);
                REC.setFieldValue('custrecord_srs_dtr_hdr_state', JSON.stringify({}));
                
                var recId = nlapiSubmitRecord(REC);
	    		
                var parms = {custscript_batch_id: recId};
                
                nlapiScheduleScript(GENERATE_DETAILED_TAX_REPORT_SCHEDULED_SCRIPT_ID, null, parms);
             
                var url = nlapiResolveURL("RECORD", DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, recId, "VIEW");
                
		    	message = "<font color='blue'>Detailed Tax Report Batch " + recId + " has been submitted.  Click <a href='" + url + "'>here</a> to view it.</font>";	    			

		    	nlapiLogExecution("DEBUG", funcName, "Batch " + recId + " created.");
		    	
		    	
		    	// message = "encrypt=[" + request.getParameter("custpage_encrypt_pdf") + "]";
		    	
    		}

	    }
	    
	    
	    field = form.addField('custpage_instructions','longtext',null, null, "custpage_manage_group");
	    field.setDisplayType("inline");
	    field.setDefaultValue("Select the applicable Tax Year, and then optionally select a Shareholder AND/OR a Deal.<p><ul><li>If you select only a Shareholder, you will get all the activity for that shareholder.</li><li>If you select only a Deal, you will get a report for ALL Shareholders who were part of that Deal, but you will see ALL their activity (including other Deals) unless you check the box 'ONLY ACTIVITY FROM THIS DEAL?'<li>If you select both a Shareholder AND a Deal, you will get a report for the selected Shareholder, but only for the selected Deal.</li></ul>");
	    field.setPadding(1);
	    
	    if (message) {
		    field = form.addField('custpage_message','text',null, null, "custpage_manage_group");
		    field.setDisplayType("inline");
		    field.setDefaultValue("<b>" + message + "</b><br>&nbsp;<br>");
		    field.setPadding(1);	    	
	    }

	    form.addField("custpage_dtr_link", "url", "", null, "custpage_manage_group").setPadding(1).setDisplayType("inline").setLinkText( "Click Here to View Existing Batches").setDefaultValue("/app/common/custom/custrecordentrylist.nl?rectype=621");
	    

	    form.addSubmitButton('Submit');


	    response.writePage(form);
    	

	} catch (e) {
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		return;
	}

}

