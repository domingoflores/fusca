/**
 * Module Description
 * This Script is used to replace the Documents associated with a Release Approval Record
 * once the associated echoSign Record has been completed and the Documents have been signed.
 * The original documents will still exist, but the signed documents will now replace them so
 * the send email script on a Release Record will send the signed documents.
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Nov 2016     Scott			   It's Tricky to Rock around...
 * 1.01       08 Dec 2016     Scott			   Added the sendEmailToReleaseAnalyst function to send emails to the Release Analyst when a document is eSigned
 *
 */

function updateEchoSignDocs(type){
	// Lets set some variables.  YEAH!!!
	// Log Type for nlapiLogExecution
	var logType = 'DEBUG';
	
	//Adobe eSign Services Agreement
	var eSignRec = nlapiGetNewRecord();
	var eSignRecID = eSignRec.getId();
	var echoSignRecordStatus = eSignRec.getFieldValue('custrecord_echosign_status');

	// LOG
	nlapiLogExecution(logType, 'FIRST LOG', 'eSignRec is ' + eSignRec);

	// Check to see if the echoSign Record is in Status 3 (Signed)
	if(echoSignRecordStatus == '3'){
		// LOG
		nlapiLogExecution(logType, 'The echoSign Record with ID ' + eSignRecID + ' is in status 3 (Signed).', 'Now we look for a document ID match.');
 
		var echoSignParentRecord = eSignRec.getFieldValue('custrecord_echosign_parent_record');
		// This is a work-a-round because the "SIGNED DOCUMENT" field on the eSign Agreement record is not populated
		// Get the Signed Document URL then call a function to split the URL and get the Signed Document ID
		var signedDocURL = eSignRec.getFieldValue('custrecord_echosign_signed_url');
		
		if(signedDocURL != ''){
			// LOG
			nlapiLogExecution(logType, 'Signed Doc URL LOG', 'Signed Doc URL value is ' + signedDocURL);

			var signedDocID = getSignedDocID(signedDocURL, logType);
		}else{
			// LOG
			nlapiLogExecution(logType, 'There is no Signed Document URL on the echoSign Agreement Record ' + eSignRecID, '')
		}

		//var signedDocID = eSignRec.getFieldValue('custrecord_echosign_signed_doc');  // CANNOT USE THIS YET 11/16/16
		var unsignedDoc = eSignRec.getFieldValue('custrecord_echosign_unsigned_doc');
		var echoSignRecordName = eSignRec.getFieldValue('name');
		var releaseRec = nlapiLoadRecord('customrecord_escrow_payment_approvals', echoSignParentRecord);
		var releaseRecName = releaseRec.getFieldValue('name');
		var releaseAnaylyst = releaseRec.getFieldValue('owner');
		

		// Documents on the Release Approval Record
		var document1ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc1');
		var document2ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc2');
		var document3ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc3');
		var document4ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc4');
		var document5ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc5');
		var document6ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc6');


		// Lets have some fun here and compare the unsignedDoc on the echoSign Record to each of the documents on the Release Approval Record
		// If there is a match, replace the document on the Release Approval Record with the signedDoc from the echoSign Record
		var fieldToBeUpdated = '',
			submitRecord = true;

		switch(unsignedDoc){
			case document1ID:
				// Update Signature Required dropdown to be eSigned (2)
				fieldToBeUpdated = 'custrecord_escrow_payment_doc1_esign';
				releaseRec.setFieldValue('custrecord_escrow_payment_doc1_esign', '2');
				releaseRec.setFieldValue('custrecord_escrow_payment_doc1', signedDocID);
				break;

			case document2ID:
				// Update Signature Required dropdown to be eSigned (2)
				fieldToBeUpdated = 'custrecord_escrow_payment_doc2_esign';
				releaseRec.setFieldValue('custrecord_escrow_payment_doc2_esign', '2');
				releaseRec.setFieldValue('custrecord_escrow_payment_doc2', signedDocID);
				break;

			case document3ID:
				// Update Signature Required dropdown to be eSigned (2)
				fieldToBeUpdated = 'custrecord_escrow_payment_doc3_esign';
				releaseRec.setFieldValue('custrecord_escrow_payment_doc3_esign', '2');
				releaseRec.setFieldValue('custrecord_escrow_payment_doc3', signedDocID);
				break;

			case document4ID:
				// Update Signature Required dropdown to be eSigned (2)
				fieldToBeUpdated = 'custrecord_escrow_payment_doc4_esign';
				releaseRec.setFieldValue('custrecord_escrow_payment_doc4_esign', '2');
				releaseRec.setFieldValue('custrecord_escrow_payment_doc4', signedDocID);
				break;

			case document5ID:
				// Update Signature Required dropdown to be eSigned (2)
				fieldToBeUpdated = 'custrecord_escrow_payment_doc5_esign';
				releaseRec.setFieldValue('custrecord_escrow_payment_doc5_esign', '2');
				releaseRec.setFieldValue('custrecord_escrow_payment_doc5', signedDocID);
				break;

			case document6ID:
				// Update Signature Required dropdown to be eSigned (2)
				fieldToBeUpdated = 'custrecord_escrow_payment_doc6_esign';
				releaseRec.setFieldValue('custrecord_escrow_payment_doc6_esign', '2');
				releaseRec.setFieldValue('custrecord_escrow_payment_doc6', signedDocID);
				break;

			default:
				submitRecord = false;
		}

		if(submitRecord) {
			releaseRec = checkALLeSignedDocStatuses(releaseRec, fieldToBeUpdated, logType);
			// LOG
			nlapiLogExecution(logType, 'Record Submit', 'The release record has now been submitted');
			nlapiSubmitRecord(releaseRec);

			// LOG
			nlapiLogExecution(logType, 'sendEmailToReleaseAnalyst', 'Calling the function');
			// Call a function that sends an email to the Release Approval Analyst when a document is eSigned
			sendEmailToReleaseAnalyst(releaseAnaylyst, echoSignRecordName, releaseRecName, logType);			
		}

	}else{
		// LOG
		nlapiLogExecution(logType, 'The echoSign Record with ID ' + eSignRecID + ' is not in status 3 (Signed)', 'The actual status of this echoSign Record is ' + echoSignRecordStatus);
	}

}

// Function to get the Signed Document ID from the Signed Document URL
function getSignedDocID(signedDocURL, logType){

	// LOG
	nlapiLogExecution(logType, 'Start function getSignedDocID', 'We are in the getSignedDocID function')
	
	var shortUrl = signedDocURL.split('id=');
	var shorterUrl = shortUrl[1].split(/\D/g);
	var signedDocID = shorterUrl[0];

	return signedDocID;
}

// Function
function checkALLeSignedDocStatuses(releaseRec, fieldToBeUpdated, logType){
	// Need to cycle through all of the fields... and exclude the field that i am currently updating
	var doc1eSignStatus = releaseRec.getFieldValue('custrecord_escrow_payment_doc1_esign');
	var doc2eSignStatus = releaseRec.getFieldValue('custrecord_escrow_payment_doc2_esign');
	var doc3eSignStatus = releaseRec.getFieldValue('custrecord_escrow_payment_doc3_esign');
	var doc4eSignStatus = releaseRec.getFieldValue('custrecord_escrow_payment_doc4_esign');
	var doc5eSignStatus = releaseRec.getFieldValue('custrecord_escrow_payment_doc5_esign');
	var doc6eSignStatus = releaseRec.getFieldValue('custrecord_escrow_payment_doc6_esign');

	var fieldName = '';

	// Build an array of the eSign Checkboxes but first check to see if the fields have values
	// 1 = Needs Signature , 2 = eSigned
	var eSignStatusArray = [];
	
		if(doc1eSignStatus != ''){
			eSignStatusArray.push(doc1eSignStatus);
			if(doc1eSignStatus == '1'){
				fieldName = 'custrecord_escrow_payment_doc1_esign';
			}
		}
		if(doc2eSignStatus != ''){
			eSignStatusArray.push(doc2eSignStatus);
			if(doc2eSignStatus == '1'){
				fieldName = 'custrecord_escrow_payment_doc2_esign';
			}
		}
		if(doc3eSignStatus != ''){
			eSignStatusArray.push(doc3eSignStatus);
			if(doc3eSignStatus == '1'){
				fieldName = 'custrecord_escrow_payment_doc3_esign';
			}
		}
		if(doc4eSignStatus != ''){
			eSignStatusArray.push(doc4eSignStatus);
			if(doc4eSignStatus == '1'){
				fieldName = 'custrecord_escrow_payment_doc4_esign';
			}
		}
		if(doc5eSignStatus != ''){
			eSignStatusArray.push(doc5eSignStatus);
			if(doc5eSignStatus == '1'){
				fieldName = 'custrecord_escrow_payment_doc5_esign';
			}
		}
		if(doc6eSignStatus != ''){
			eSignStatusArray.push(doc6eSignStatus);
			if(doc6eSignStatus == '1'){
				fieldName = 'custrecord_escrow_payment_doc6_esign';
			}
		}
	
	// MIGHT NEED an if around here to check and see if fieldName is not blank.  If it is blank then set needsigcount to 'NOT NEEDED'.  
	// That would cause the Status of the record to never be set to eSigned if there aren't any documents being updated to eSigned
	// Lets loop through the array of eSign Status fields and see which values are not equal to 1
	var needSigCount = 0;

	// Loop Through Stuff Here
	for (var i = 0; i < eSignStatusArray.length; i++) {
		if(eSignStatusArray[i] == '1'){
			(needSigCount++);
		}
	}

	// LOG
	nlapiLogExecution(logType, 'After the for loop', 'needSigCount = ' + needSigCount);

	// if the sigCount is greater than 1... do not update the status, and we dont care which field is being updated because there is more than 1 field in the Needs Signature Status
	// if the sigCount is = to 1... compare to see if the field we need to update is the field that is holding back our status for the entire record
	// if the sigCount is less than 1... Throw an error?
	if(needSigCount == '0'){
		//if(fieldToBeUpdated == fieldName){
			// Set the Approval Record Status to eSigned (7)
			releaseRec.setFieldValue('custrecord_escrow_payment_status', '7');
			// LOG
			nlapiLogExecution(logType, 'Setting the Release Approval Record to Status 7', 'Set to Status 7');
		//}
	}
	return releaseRec;
}

// Send email confirmation that the document was eSigned to the Release Approval Process record Owner
// aka the Release Analyst, after the Adobe eSign record has had the associated document eSigned
function sendEmailToReleaseAnalyst(releaseAnaylyst, echoSignRecordName, releaseRecName, logType){

	// LOG
	nlapiLogExecution(logType, 'sendEmailToReleaseAnalyst', 'Entered the function');

	var employeeRec = nlapiLoadRecord('employee', releaseAnaylyst);
	var emailAddress = employeeRec.getFieldValue('email');
	var employeeName = employeeRec.getFieldValue('firstname');
	var subject = 'eSign Document Signed - ' + echoSignRecordName;
	var body = employeeName + '<br><br>This message is to alert you that the eSign Document titled <b>' + echoSignRecordName + '</b> which is associated with Release Approval Process record of <b>' + releaseRecName + '</b> has been eSigned.';

	nlapiSendEmail('742128', emailAddress, subject, body, null, null, null, null);

}