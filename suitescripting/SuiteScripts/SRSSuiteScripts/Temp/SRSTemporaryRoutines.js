/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSTemporaryRoutintes.js 
* @ AUTHOR        : Steven C. Buttgereit
* @ DATE          : 2010/12/03
*
* Copyright (c) 2012 Shareholder Representative Services LLC
* 
* This file contains routines that are workflow triggered and really intended for single use.
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function migrateNotes() {
//Do some startup initialization.
	var oppSearchResults = nlapiSearchRecord('opportunity','customsearch862');
	
	//Get opportunities w/note data that have notes that we'll want to migrate.
	
	//Next loop through the opportunity records and extract the notes.
	if(oppSearchResults != null) {
		for(var i = 0; i < oppSearchResults.length ;i++) {
                        var oppSearchRow = oppSearchResults[i];
			//map the note data from the opportunity search results to the new call record.
			var targetMemo = nlapiCreateRecord('phonecall');
			//save/create the call record.
			targetMemo.setFieldValue('assigned', oppSearchRow.getValue('author','usernotes',null));
			targetMemo.setFieldValue('customform', '35');
			targetMemo.setFieldValue('owner', oppSearchRow.getValue('author','usernotes',null));
			targetMemo.setFieldValue('startdate', nlapiDateToString(new Date(oppSearchRow.getValue('notedate','usernotes',null))));
			targetMemo.setFieldValue('starttime', oppSearchRow.getValue('time','usernotes',null));
			targetMemo.setFieldValue('status', 'COMPLETE');
			targetMemo.setFieldValue('completeddate', nlapiDateToString(new Date(oppSearchRow.getValue('notedate','usernotes',null))));
			if(oppSearchRow.getValue('title','usernotes',null) != null && oppSearchRow.getValue('title','usernotes',null) != "") {
				targetMemo.setFieldValue('title', oppSearchRow.getValue('title','usernotes',null));
			} else {
				targetMemo.setFieldValue('title', 'Note from '+oppSearchRow.getText('author','usernotes',null)+' on '+nlapiDateToString(new Date(oppSearchRow.getValue('notedate','usernotes',null))));
			}
			
			targetMemo.setFieldValue('message', oppSearchRow.getValue('note','usernotes',null));
			targetMemo.setFieldValue('company', oppSearchRow.getValue('entity',null,null));
			targetMemo.setFieldValue('transaction', oppSearchRow.getId());
			targetMemo.setFieldValue('externalid', oppSearchRow.getValue('internalid','usernotes',null));
			nlapiSubmitRecord(targetMemo,true,false);
		}
	}
}
