//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 		Generic Email Capture Plugin
 *  
 */


if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(suffix) {
		return this.match(suffix+"$")==suffix;		
	}
}

var scriptName = "PRI_RIEM_PL_EmailCapture.";

function process(email) {
	
	var funcName = scriptName + "process";

	try {
	
		nlapiLogExecution("DEBUG", funcName, "Starting");
					

		var emailObj = {};

		emailObj.senderName = email.getFrom().getName();
		emailObj.senderEmailAddress = email.getFrom().getEmail();
		emailObj.emailSubject = email.getSubject();
		emailObj.emailBody = email.getTextBody();			
		if (email.getReplyTo())
			emailObj.replyTo = email.getReplyTo().getEmail();
		
		if (email.getTo())
			emailObj.inboundAddress = email.getTo()[0].getEmail();
							
		var attachments = email.getAttachments();
		
		nlapiLogExecution("DEBUG", funcName, attachments.length + " attachment(s) found");

		var importedFiles = 0;
		
		for (var indexAtt in attachments) {
			
			var importFile = attachments[indexAtt];

			if (importFile.getName().toLowerCase().endsWith(".csv")) {
				
				nlapiLogExecution("DEBUG", funcName, "TYPE=" + importFile.getType());
				
				var folderId = findAttachmentFolder(importFile.getName());
				
				if (folderId) {
					// var F = nlapiCreateFile(importFile.getName(), "CSV", importFile.getValue());
					
					var fileDesc = JSON.stringify(emailObj);
					
					if (fileDesc.length > 999)
						fileDesc = fileDesc.substring(0,999);
					
					importFile.setName(importFile.getName());
					importFile.setFolder(folderId);
					importFile.setDescription(fileDesc);
					var fileId = nlapiSubmitFile(importFile);
					
					// nlapiLogExecution("DEBUG", funcName, importFile.getValue());
					// F.setFolder(folderId);
					// F.setEncoding("windows-1252");
					// F.setDescription(JSON.stringify(emailObj));
				
					// var fileId = nlapiSubmitFile(F);

					importedFiles++;
					nlapiLogExecution("DEBUG", funcName, "Attachment [" + importFile.getName() + "] saved to folder " + folderId + " as ID " + fileId + " and script scheduled.");					
				} else
					nlapiLogExecution("DEBUG", funcName, "Could not determine folder for attachment [" + importFile.getName() + "].  Attachment ignored.");					
				
			} else
				nlapiLogExecution("DEBUG", funcName, "Attachment [" + importFile.getName() + "] was not a .CSV file and was ignored.");
		}

		// kick off the file importer scheduled script
		if (importedFiles > 0)
			nlapiScheduleScript("customscript_pri_riem_sc_file_importer", null, null);

		nlapiLogExecution("DEBUG", funcName, "Exiting");

		
	} catch (e) {
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}
	
};

function findAttachmentFolder(fileName) {
	
	var funcName = scriptName + "findAttachmentFolder " + fileName;
	
	// finds an import job type whose file pattern matches this file name
	
	var filters = [];		
	filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));
	filters.push(new nlobjSearchFilter("custrecord_pri_riem_jobt_process_type",null,"anyof",[1]));

	var columns = [];
	columns.push(new nlobjSearchColumn("custrecord_pri_riem_jobt_folder_id"));
	columns.push(new nlobjSearchColumn("custrecord_pri_riem_jobt_imp_file_ptrn"));
	columns.push(new nlobjSearchColumn("name"));
	

	var searchResults = nlapiSearchRecord("customrecord_pri_riem_job_type", null, filters, columns) || [];
	
	for (var i = 0; i < searchResults.length; i++) {

		var filePattern = searchResults[i].getValue("custrecord_pri_riem_jobt_imp_file_ptrn");
		if (fileName.match(new RegExp(filePattern,'i'))) {
			nlapiLogExecution("DEBUG", funcName, "File matched to Job Type " + searchResults[i].getValue("name") + " (" + searchResults[i].getId() + ") using pattern " + filePattern);
			return searchResults[i].getValue("custrecord_pri_riem_jobt_folder_id");	
		}
	}
	
}


// fileName.match(new RegExp(filePattern,'i'))) {
