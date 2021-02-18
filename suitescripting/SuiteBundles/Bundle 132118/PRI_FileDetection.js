//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: Record File Detection
//Description: Detects when a file attachments exists and if so inserts indicator in the main section of the form.
//Original Author: Matthew Marchant             
//Date: 11/13/2015
//
//Revised By: Vanessa Sampang
//Date Revised: 07/16/2016
//------------------------------------------------------------------

//------------------------------------------------------------------
//Function: ID001_transactionFileDetection  
//Record: All Record types
//Description: Detects when a file attachments exists and if so inserts indicator in inline html field in the main section of the form.
//Developer:  Matthew Marchant             
//Task:  File Detection
//Date:  11/13/2015   
//
//Revised By: Vanessa Sampang
//Date Revised: 07/16/2016    
//------------------------------------------------------------------
function ID001_transactionFileDetection(type, form, request){
	if(type=='view' || type=='edit'){
		try{
			var recordType = nlapiGetRecordType();
			var recordId = nlapiGetRecordId();
			if(fileAttachmentExists(recordType,recordId)){
				var fileExistsField = form.addField('custpage_fileexists','inlinehtml','');
				fileExistsField.setLayoutType('outsideabove', 'startcol');
				fileExistsField.setDefaultValue(
					'<table>\
						<tbody>\
							<tr>\
								<td>\
									<div class="uir-page-title">\
										<div class="uir-record-status" style="background-color:#D7FCCF">File attachments detected</div>\
									</div>\
								</td>\
							</tr>\
						</tbody>\
					</table>');
			}
		}catch(e){
			nlapiLogExecution('Debug','ID001_transactionFileDetection',e.toString());
		}
	}
}
//------------------------------------------------------------------
//Function: fileAttachmentExists 
//Description: Searches records for any attachments.
//Parameter:  recordType, recordId
//Returns:  bool: true (there are attachments), false (no attachments exist)
//Developer: Matthew Marchant             
//Date: 11/13/2015       
//
//Revised By: Vanessa Sampang
//Date Revised: 07/16/2016
//------------------------------------------------------------------
function fileAttachmentExists(recordType,recordId){
	var filters = [];
	var columns = [];
	filters.push(new nlobjSearchFilter('internalid', null,'anyof',recordId));
	filters.push(new nlobjSearchFilter('formulatext', null,'isnotempty',null).setFormula('{file.internalid}'));
	var searchResults = nlapiSearchRecord(recordType,null, filters, columns);
	if(!isEmpty(searchResults)) return true;
	else return false;
}
function isEmpty(val) {
	return (val == null || val == '');	
}