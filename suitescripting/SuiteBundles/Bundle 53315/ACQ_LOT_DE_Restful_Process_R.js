/**
 * Module Description
 * 
 * Version    Date            Author           	Remarks
 * 1.00       30 Jul 2014     smccurry			This is a new start on Dual Entry using the DataTables jQuery plugin as the basis.
 * 1.01		  01 Aug 2014	  smccurry		    Installed the initial working version on Production.
 * 1.02		  04 Aug 2014	  smccurry			Downgraded the function to return an object with an Array of rows instead of the object
 * 1.03		  19 Aug 2014	  smccurry			Moved the current version from Production to Development
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postRESTlet(dataIn) {
	try {
		var msg = new ERROR_MESSAGES();
		msg.setStatusSuccess();
		
		var responseData = {};
	//	responseData.data = [];
		try {
			var dualEntryUsers = createDualEntryUsersObject();
			var curUser = nlapiGetContext().getUser();
			curUser = '_' + curUser;
			var userRole = dualEntryUsers[curUser].role;
		} catch (e) {
			nlapiLogExecution('ERROR', 'Dual Entry User Error', 'ACQ_LOT_DE_Restful_Process_R.js Line 21.  Most likely this is caused by a user having more than one (or wrong) user role set in the record \'Exchange Data Collection Reps\'');
		}

		var dataArray = [];
		try {
			var deResults = searchExchangeRecordsDualEntry(null, userRole);
	    	if(deResults != null && deResults.length > 0) {
	    		nlapiLogExecution('DEBUG', 'deResults.length', deResults.length);
	    		for(var a = 0; a < deResults.length; a++) {
	    			var oneResult = deResults[a];
	    			dataArray.push(buildUserDataTableRow(oneResult, userRole, dualEntryUsers, a));
	    		}
	    	}
	    } catch (e) {
	    	var err = e;
			msg.addMessage('Problem with the search searchExchangeRecords(exRecID) Script: ACQ_LOT_DE_DualEntry_R.js' + JSON.stringify(err));
			msg.setStatusError();
			nlapiLogExecution('ERROR', 'Line 49 Failed on search row: ' + oneResult.getId(), JSON.stringify(err));
	    }
	    responseData.draw = 1;
	    responseData.recordsTotal = deResults.length;
	    responseData.data = dataArray;
	    try {
	    	return JSON.stringify(responseData);
	    } catch (err) {
	    	nlapiLogExecution('ERROR', 'Problem returning the JSON data.', JSON.stringify(err));
	    }
	} catch (err) {
		nlapiLogExecution('ERROR', postRESTlet(dataIn), 'JSON dataIn: ' + JSON.stringify(err));
	}
}

function buildUserDataTableRow(row, userRole, dualEntryUsers, a) {
	var rowObj = {};
	
	// DO NOT CONFUSE FIELDS FROM THE 'ROW' OF THE EXCHANGE RECORD SEARCH WITH THE STATUS RECORD FIELDS.  BOTH ARE USED TO BUILD THIS TABLE
	var exRecID = row.getId();
	if(userRole == 'admin' || userRole == 'review') {
		rowObj.exrec = '<a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_lot', exRecID, 'VIEW')+'" target="_blank">'+ exRecID +'</a>';
	} else if (userRole == 'de1' || userRole == 'de2'){
		rowObj.exrec = exRecID;
	}
	var statusRecSrch = null;
	
	//Allow Off-Site Data Entry Column (custrecord_acq_lot_allow_offsite_de)
	var allowOffSiteDataEntryValue = row.getValue('custrecord_acq_lot_allow_offsite_de');
	
	/*
	 * If the NetSuite role is NS_ROLE_OFFSITE_DUALENTRY_ONLY (reference to ACQ_LOT_DE_Library.js), or
	 * the custom Exchange Dual Entry User Type is Admin, then don't create the checkboxes, just put Yes/No text.
	 */
	if(nlapiGetRole() == NS_ROLE_OFFSITE_DUALENTRY_ONLY || userRole != 'admin'){
		if(allowOffSiteDataEntryValue == 'T'){
			rowObj.allowOffSiteDataEntry = 'Yes';
		} else {
			rowObj.allowOffSiteDataEntry = 'No';
		}
	} else {
		/*
		 * Default checkbox to checked if it's checked on the Dual Entry Record.
		 */
		var classValue = ' notChecked';
		var checkedValue = '';
		if(allowOffSiteDataEntryValue == 'T'){
			var classValue = ' isChecked';
			checkedValue = "checked=''";
		}
		
		rowObj.allowOffSiteDataEntry = '<input type="checkbox" class="offsitede'+classValue+'" name="allowOffSiteDataEntry" value="'+exRecID+'" '+checkedValue+'>';
	}
	
	// DEAL COLUMN - TODO: CHANGE THIS TO BE TRUNCATED IN THE BROWSER ONLY SO THAT IF WE NEED THE FULL NAME HERE WE HAVE IT
	var dealText = row.getText('custrecord_acq_loth_zzz_zzz_deal');

	if(userRole == 'admin' || userRole == 'review') {
		rowObj.deal = dealText;
	} else if (userRole == 'de1' || userRole == 'de2'){
		rowObj.deal = dealText;
	}
	// SHAREHOLDER / CONTACT COLUMN
	var sholderText = row.getValue('custrecord_acq_loth_1_src_shrhldname');
	if(sholderText != null && sholderText.length > 25) {
		sholderText = sholderText.slice(0,25);
	}
	if(userRole == 'admin' || userRole == 'review') {
		rowObj.sholder = sholderText;
		} else if (userRole == 'de1' || userRole == 'de2'){
			rowObj.sholder = sholderText;
		}

	// CERTIFICATE DOLLAR AMOUNT
	var total = addTotalofCerts(exRecID);
	total = total.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	rowObj.certamt = total;
	
	/*************************************
	 * STATUS SECTION
	 *************************************/
	try {
		statusRecSrch = searchDualEntryStatusRecord(exRecID);
	} catch(err) {
		nlapiLogExecution('DEBUG', 'Code DE_114 Failed on exRecID: ' + exRecID, JSON.stringify(err));
	}
	var statusRec;
	if(statusRecSrch != null && statusRecSrch.length > 0) {
		try {
			statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', statusRecSrch[0].getId());
		} catch (err) {
			nlapiLogExecution('DEBUG', 'Code DE_122. Failed on exRecID: ' + exRecID, JSON.stringify(err));
		}

	} else {
		try {
			var statusRecID = createDefaultStatusRecord(exRecID);
			statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', statusRecID);
		} catch (err) {
			nlapiLogExecution('DEBUG', 'Code DE_133. Failed on exRecID: ' + exRecID, JSON.stringify(err));
		}
	}

	var stage1status = statusRec.getFieldText('custrecord_acq_lot_de_de1_status');
	var stage1statusID = statusRec.getFieldValue('custrecord_acq_lot_de_de1_status');
	var stage2status = statusRec.getFieldText('custrecord_acq_lot_de_de2_status');
	var stage2statusID = statusRec.getFieldValue('custrecord_acq_lot_de_de2_status');
	var reviewNotesDE1 = statusRec.getFieldValue('custrecord_acq_lot_de_de1_notes');
	var reviewNotesDE2 = statusRec.getFieldValue('custrecord_acq_lot_de_de2_notes');
	var reviewNotesReviewer1 = statusRec.getFieldValue('custrecord_acq_lot_de_review1_notes');
	var reviewNotesReviewer2 = statusRec.getFieldValue('custrecord_acq_lot_de_review2_notes');
	var reviewStatus = statusRec.getFieldValue('custrecord_acq_lot_de_reviewcomplete');
	var lastReviewedByID = statusRec.getFieldValue('custrecord_acq_lot_de_last_reviewer');
	var reviewComplete = statusRec.getFieldValue('custrecord_acq_lot_de_reviewcomplete');
	var de1JSON = statusRec.getFieldValue('custrecord_acq_lot_de_de1_json');
	var rowID = row.getId();
	
	// Create a JSON object from the JSON data so that we can check the payment type.
	// NEW PAYMENT TYPE
	var de1Obj = {};
	if(de1JSON != null && de1JSON != '') {
		de1Obj = JSON.parse(de1JSON);
		var erFields = de1Obj.erfields;
		if(erFields) {
			if(erFields.lpm1_paymethod) {
				rowObj.paytype = erFields.lpm1_paymethod;
			} else {
				rowObj.paytype = '&nbsp;';
			}
		} else {
			rowObj.paytype = '&nbsp;';
		}
	} else {
		rowObj.paytype = '&nbsp;';
	}

	if(stage1statusID == 3 && stage2statusID == 3) {
		rowObj.DT_RowClass = "success";
	}
	
	if (stage1statusID == 3  && stage2statusID == 3) {
		rowObj.DT_RowClass = "success";
	} else if (stage1statusID == 2  && stage2statusID == 1 || stage2statusID == 2 || stage2statusID == 3) {
		rowObj.DT_RowClass = "warning";
	} else if (stage2statusID == 2  && stage1statusID == 1 || stage1statusID == 2 || stage1statusID == 3) {
		rowObj.DT_RowClass = "warning";
	} else if (stage1statusID == 3  && stage2statusID == 3 && reviewComplete == 'T') {
		rowObj.DT_RowClass = "info";
	} else {
		rowObj.DT_RowClass = "info";
	}
	
	// DE1 USER STATUS
	rowObj.de1statusid = stage1statusID || null;
	// DE1 USER NAME
	var curde1UsrID = statusRec.getFieldValue('custrecord_acq_lot_de_de1_user');
	var de1user = null;
	if(curde1UsrID != null && curde1UsrID != '') {
		de1user = dualEntryUsers['_' + curde1UsrID].name; 
	} else {
		de1user = null;
	}
	if(de1user != null) {
		rowObj.de1statususer = de1user;
	} else {
		rowObj.de1statususer = null;
	}

	// DE2 USER STATUS
	rowObj.de2statusid = stage2statusID || '';
	// DE2 USER NAME
	var curde2UsrID = statusRec.getFieldValue('custrecord_acq_lot_de_de2_user');
	var de2user = '';
	if(curde2UsrID != null && curde2UsrID != '') {
		de2user = dualEntryUsers['_' + curde2UsrID].name; 
	} else {
		de2user = null;
	}
	if(de2user != null) {
		rowObj.de2statususer = de2user;
	} else {
		rowObj.de2statususer = null;
	}

	// COMMENTS COLUMN
	// Added this version to PRODUCTION on 09/15/14 - smccurry
	if(reviewNotesDE1 != null && reviewNotesDE1 != '' || reviewNotesDE2 != null && reviewNotesDE2 != '') {
		// BUILD THE NOTES SECTIONS
		var combinedNotes = '<strong>DE1:</strong> ';
		if(reviewNotesDE1 != null && reviewNotesDE1 != '') {
			reviewNotesDE1 = reviewNotesDE1.replace(/'/, '\'');
			combinedNotes += reviewNotesDE1;
		}
		combinedNotes += '<br><br>';
		combinedNotes += '<strong>DE2:</strong> ';
		if(reviewNotesDE2 != null && reviewNotesDE2 != '') {
			reviewNotesDE2 = reviewNotesDE2.replace(/'/, '\'');
			combinedNotes += reviewNotesDE2;
		}
		combinedNotes += '<br><br>';
		combinedNotes += '<strong>REVIEW 1:</strong> ';
		if(reviewNotesReviewer1 != null && reviewNotesReviewer1 != '') {
			reviewNotesReviewer1 = reviewNotesReviewer1.replace(/'/, '\'');
			combinedNotes += reviewNotesReviewer1;
		}
		combinedNotes += '<br><br>';
		if(reviewNotesReviewer2 != null && reviewNotesReviewer2 != '') {
			reviewNotesReviewer2 = reviewNotesReviewer2.replace(/'/, '\'');
			combinedNotes += '<strong>REVIEW 2:</strong> ';
			combinedNotes += reviewNotesReviewer2 + '<br><br>';
		}
		var comments = '<button id="'+ rowID +'_com" type="button" class="btn btn-default commentsPopover" data-placement="right" data-content="'+ combinedNotes +'"><span class="glyphicon glyphicon-comment"></span></button>';
		rowObj.comments = comments;
	} else {
		rowObj.comments = '&nbsp;';
	}
	
	// LOT PDF COLUMN
	var lotPDFurl = null;
	var docResults = searchRelatedDocuments(exRecID);
	if(docResults != null && docResults.length > 0) {
		for(var p = 0; p < docResults.length; p++) {
			var oneDoc = docResults[p];
			var mediaID = oneDoc.getValue('custrecord_file');
			var dType = oneDoc.getValue('custrecord_doc_type');
			var deReq = oneDoc.getValue('custrecord_acq_lot_de_required');
			// Now use a new search of the native
			var nativeDoc = searchDocumentURL(mediaID);
			var nDoc = nativeDoc[0];
			var dURL = nDoc.getValue('url');
			if(deReq == 'T' && dType == '29') {
				lotPDFurl = dURL;
			}
		}
	}
	
	// Alternate DOC icon for faster loading.
	if(lotPDFurl != null && lotPDFurl != '') {
		rowObj.docurl = '<a href="'+ lotPDFurl +'" target="_blank"><span class="glyphicon glyphicon-file"></span></a>';
	} else {
		rowObj.docurl = null;
	}
	
	// VIEW BUTTONS COLUMN
	rowObj.viewbtn = '<button id="'+ row.getId() + '_view" type="button" class="btn btn-xs btn-success viewBtn" style="margin:1px;"">VIEW</button>';
	rowObj.viewbtn += '<!-- Modal -->';
	rowObj.viewbtn += '<div class="modal fade" id="modal_'+ row.getId() +'_view" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">';
	rowObj.viewbtn += '<div class="modal-dialog">';
	rowObj.viewbtn += '<div class="modal-content">';
	rowObj.viewbtn += '<div class="modal-header">';
	rowObj.viewbtn += '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>';
	rowObj.viewbtn += '<h4 class="modal-title" id="modalLabel_'+ row.getId() +'">Choose DE1 or DE2</h4>';
	rowObj.viewbtn += '</div>';
	rowObj.viewbtn += '<div class="modal-footer">';
	rowObj.viewbtn += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
	rowObj.viewbtn += '<button type="button" onclick="handleButton(\'' + row.getId() +'_view_de1\', \'#modal_'+ row.getId() +'_view\');" class="btn btn-primary">DE1</button>';
	rowObj.viewbtn += '<button type="button" onclick="handleButton(\'' + row.getId() +'_view_de2\', \'#modal_'+ row.getId() +'_view\');" class="btn btn-primary">DE2</button>';
	rowObj.viewbtn += '</div>';
	rowObj.viewbtn += '</div>';
	rowObj.viewbtn += '</div>';
	rowObj.viewbtn += '</div>';
		
	// EDIT BUTTONS COLUMN
	rowObj.editbtn = '<button id="'+ row.getId() + '_edit" type="button" class="btn btn-xs btn-warning editBtn" style="margin:1px;"">EDIT</button>';
	rowObj.editbtn += '<!-- Modal -->';
	rowObj.editbtn += '<div class="modal fade" id="modal_'+ row.getId() +'_edit" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">';
	rowObj.editbtn += '<div class="modal-dialog">';
	rowObj.editbtn += '<div class="modal-content">';
	rowObj.editbtn += '<div class="modal-header">';
	rowObj.editbtn += '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>';
	rowObj.editbtn += '<h4 class="modal-title" id="modalLabel_'+ row.getId() +'">Choose DE1 or DE2</h4>';
	rowObj.editbtn += '</div>';
	rowObj.editbtn += '<div class="modal-footer">';
	rowObj.editbtn += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
	rowObj.editbtn += '<button type="button" onclick="handleButton(\'' + row.getId() +'_edit_de1\', \'#modal_'+ row.getId() +'_edit\');" class="btn btn-primary">DE1</button>';
	rowObj.editbtn += '<button type="button" onclick="handleButton(\'' + row.getId() +'_edit_de2\', \'#modal_'+ row.getId() +'_edit\');" class="btn btn-primary">DE2</button>';
	rowObj.editbtn += '</div>';
	rowObj.editbtn += '</div>';
	rowObj.editbtn += '</div>';
	rowObj.editbtn += '</div>';
	
	// REVIEW SECTION FOR ADMIN VIEW
	if(userRole == 'admin' || userRole == 'review' || userRole == 'de1' || userRole == 'de2') {
		if(lastReviewedByID != null && lastReviewedByID != '') {
			rowObj.reviewuser = dualEntryUsers['_' + lastReviewedByID].name ;
		} else {
			rowObj.reviewuser = null;
		}
		if(stage1statusID == '3' && stage2statusID == '3') {
			rowObj.reviewbtn = '<button id="'+ row.getId() +'_review" type="button" class="btn btn-xs btn-primary reviewBtn">REVIEW</button>';
		} else {
			rowObj.reviewbtn = null;
		}
		if(reviewComplete == 'T') {
			rowObj.reviewcomplete = 'Yes';
		} else {
			rowObj.reviewcomplete = 'No';
		}
		
	}
	return rowObj;
}


function addTotalofCerts(exRecID) {
	var certTotals = 0;
	certTotals = parseFloat(certTotals);
	var results = searchRelatedCerts(exRecID);
	if(results != null && results.length > 0) {
		for(var r = 0; r < results.length; r++) {
			var oneResult = results[r];
			var payAmt = oneResult.getValue('custrecord_acq_lotce_zzz_zzz_payment');
			if(payAmt != null && payAmt != '') {
				certTotals += parseFloat(payAmt);
			}
		}
	}
	var total = certTotals.toFixed(2);
	return total;
}

function getUserName(userID) {
	var userName = nlapiLookupField('employee', userID, 'entityid'); 
	return userName;
}

function createDefaultStatusRecord(exRecID) {
	var stRec = nlapiCreateRecord('customrecord_acq_lot_de_dualentry_status');
	stRec.setFieldValue('name', exRecID);
	stRec.setFieldValue('custrecord_acq_lot_de', exRecID);
	stRec.setFieldValue('custrecord_acq_lot_de_de1_status', 1);
	stRec.setFieldValue('custrecord_acq_lot_de_de2_status', 1);
	return nlapiSubmitRecord(stRec);
}
