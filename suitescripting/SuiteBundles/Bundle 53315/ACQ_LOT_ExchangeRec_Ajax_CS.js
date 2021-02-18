/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.01       08 Jun 2014     smccurry		   Installed on production
 * 1.02       12 Jun 2014     smccurry		   Fixed some issues.	
 * 1.03       09 Aug 2015     sstreule		   I did more than just "Fix some issues".  Added calls to the unltraLock() 
 *                                             function in the Exchange_Record_Statuses_LIB.js script.  The function searches 
 *                                             for other Exchange records that use the same hash record and updates the
 *                                             Lockout Status to be the same for all of the Exchange records.  Also added logic in 
 *                                             unlockHash() function to update the Lockout Status and Lockout Status Image fields 
 *                                             on the current exchange record.
 * 1.04       10 Sep 2015     sstreule		   Removed logic in the unlockHash() function to set field values.  Moved that logic
 * 											   to the ACQ_Exchange_Record_Statuses_LIB.js file in the ultrLock() function. 
 * 1.04       16 Sep 2015     sstreule		   Removed commented out code from the unlock function.                                          
 */

var context = nlapiGetContext(),
	env = context.getEnvironment(),
	company = context.getCompany(),
	scriptSrc = [],
	styleSrc = [];
/*
switch( env + company ) {

	case 'PRODUCTION772390':
		// Production
		clearinghouseUrl = 'https://clearinghouse.srsacquiom.com/send/request/unlock/';
		break;
	case 'SANDBOX772390_SB3':
		// Staging Sandbox
		clearinghouseUrl = 'https://www.acquiomaccess.x042.com/send/request/unlock/';
		break;
	case 'SANDBOX772390':
	default:
		// Development Sandbox
		clearinghouseUrl = 'https://www.acquiomaccess.x042.com/send/request/unlock/';
		break;

}
*/

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

function createPageEmailHashReset() {
	var url = nlapiResolveURL('SUITELET', 'customscript_acq_lot_change_hash', 'customdeploy_acq_lot_change_hash');
	url += '&txntype=' + nlapiGetRecordType();
	url += '&txnid=' + nlapiGetRecordId();
	url += '&hashid=' + nlapiGetFieldValue('custpage_hashid');
	url += '&hashtext=' + nlapiGetFieldValue('custpage_hashtext');
	url += '&calltype=' + 'popup';
	window.location = url;
}

function unlockHash() {
	
	var url = '',
		//baseUrl = clearinghouseUrl,
		urlParts = [],
		exRec = nlapiLoadRecord('customrecord_acq_lot', nlapiGetRecordId() ),
		response, responseData, // AJAX response objects
		confirmationHeader = 'Unlock Existing Hash?',
		//confirmationMessage = 'You are about to unlock the existing Hash for this record<ul><li>Has the shareholder contacted SRS|Acquiom?</li><li>Have you verified the identity of the shareholder?</li><ul>Click continue if you can answer \'YES\' to both questions and the Hash for this Exchange Record will be unlocked.';
		confirmationMessage = 'You are about to unlock the existing Hash for this record\n• Has the shareholder contacted SRS|Acquiom?\n• Have you verified the identity of the shareholder?\nClick OK if you can answer \'YES\' to both questions and the Hash for this Exchange Record will be unlocked.';		
	nlapiLogExecution('AUDIT', 'Unlock Hash', 'The Hash unlock was contemplated');
	try{	

		//jQuery( '#confirmation' ).dialog( 'option', 'title', confirmationHeader );
		//jQuery( '#confirmation span.message ').html( confirmationMessage );
		//jQuery( '#confirmation' ).dialog( "open" );
		//jQuery( '#confirmation' ).dialog( "option", "buttons", [

		var confirmDialog = confirm( confirmationMessage );
		if (confirmDialog == true){ alert('Unlocking Exchange Records associated with Hash... Please click OK and wait a few moments.\nThe page will refresh when completed.'); }
		jQuery( '#confirmation span.message ').html( confirmationMessage );
		//jQuery( '#confirmation' ).dialog( "open" );
		if ( Boolean(confirmDialog)){
			urlParts = [ 
				nlapiGetRecordId(),                                             // Exchange Record ID
				exRec.getFieldValue( 'custpage_hashid' ),                       // Hash 12 ID
				exRec.getFieldValue( 'custpage_hashtext' ),                     // Hash 12 Text
				exRec.getFieldValue( 'custrecord_acq_loth_1_de1_shrhldemail' ),  // Shareholder Email
				exRec.getFieldValue('custrecord_qx_acq_loth_sellername').toString().replace(/[^ A-Za-z0-9]/g,'').replace(/\s/g, '_')
			];
			//This code is used to update the Lockout Status, Lockout Status Image, and blank out the LOT Recieved Timestamp field
			ultraLock(exRec, exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash'), exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_contact'), exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal'), exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas'), '3534094', 'UNLOCK');

			//Reload the page so that the changed field values are refreshed
			location.reload();
			
			//url = baseUrl + encodeURI( urlParts.join('/') );
			//console.log( url );
/*
			try{
				response = nlapiRequestURL( url );
				responseData = JSON.parse( response.body );
			} catch(err) {
				responseData = {};
				responseData.status = false;
				responseData.message = 'There was an error connecting to Clearinghouse';
			}
*/
			if( responseData.status == true ) {
				nlapiLogExecution('AUDIT', 'Unlock Hash', 'The Hash unlock was pressed');    				
				//jQuery( this ).dialog( "close" );
				alert('Hash Unlocked');
			} else {
				alert( 'error' );
				//jQuery( this ).dialog( "close" );
			}
		} else {

		}


	}catch(e){
		nlapiLogExecution('ERROR','jquery',e.message);
	}
	
}


// Even listener that grabs the button id of the button that has been clicked.
jQuery(document).ready(function(){
	jQuery(".hashBtn").click(function(){
		apiCallToRestlet(this.id);
	});
}); 

jQuery(function($) {
	jQuery('#override1, #override2').click(function() {
//        var cb1 = $('#override1').is(':checked');
        var cb2 = $('#override2').is(':checked');
//        $('#sendfrom').prop('disabled', !cb1);
        $('#sendto').prop('disabled', !cb2);    
    });
});
/*
jQuery(function($) {
	$( "#confirmation" ).dialog({
		resizable: false,
		height:"auto",
		width: 500,
		modal: true,
		autoOpen: false
	});
});
*/

/******************************************************************************
 * AJAX-HTTPRequest
 ******************************************************************************/  
function apiCallToRestlet(btnId) {
	console.log('Start of apiPOSTtoHashResetRestlet');
	// Create the data object for passing to the restlet and grab common values
	// Note some of the following values may be null or empty depending on when they
	// are collected.
	var data = {};
	data.calltype = btnId;
	data.hashchanged = document.getElementById('custpage_hash_changed').value || null;
	data.txnid = document.getElementById('custpage_txnid').value || null;
	data.txntype = document.getElementById('custpage_txntype').value || null;
	data.hashid = document.getElementById('custpage_hashid').value || null;
	data.hashtext = document.getElementById('custpage_hashtext').value || null;
	var userid = document.getElementById('custpage_userid').value;
//	console.log(userid);
	userid = parseFloat(userid);
	data.userid = userid || null;
	data.content = document.getElementById('previewEmail').value || null;
	
//	alert('JSON before xmlRequest ' + JSON.stringify(data));
//	return;  // TURN ON FOR A BREAK WHEN TESTING
	var xmlRequest = new XMLHttpRequest();
    try {
    	window.status = 'Processing... ';

    	var progressMsg = '';
        // Setup payload data if the button pushed is resethash
        if(btnId == 'resethash') {
        	progressMsg = 'Updating exchange hash.';
        	//alert(btnId);
        	//alert(JSON.stringify(data));
        }
        // Setup payload data if the button pushed is previewemail
        if(btnId == 'previewemailbeforereset') {
        	//alert(btnId);
        	progressMsg = 'Generating email preview.';
        }
        if(btnId == 'previewemailafterreset') {
        	//alert(btnId);
        	progressMsg = 'Generating email preview with existing hash.';
        }
        if(btnId == 'resetsendemail') {
        	//alert(btnId);
        	data.sendto = nlapiGetFieldValue('sendto');
        	data.sendfrom = nlapiGetFieldValue('sendfrom');
        	confirm('This will send an email to the email address\nlisted on the screen.  Press okay to continue.');
        	//PUT SHIT IN HERE
        	progressMsg = 'Reseting hash and sending email to the customer.';
        }
        // Setup payload data if the button pushed is sendemail
        if(btnId == 'sendemail') {
//        	confirm('This will send an email to the email address\nlisted on the screen.  Press okay to continue.');
//        	alert('This will send an email the email address listed in the Send To field.');
        	progressMsg = 'Sending email to the customer.';
        	// Determine if we can take the data from the preview
        	// data.hashchanged is set to T if 
        	alert('data.hashchanged: ' + data.hashchanged);
            if(data.hashchanged == 'T') {
            	data.sendto = nlapiGetFieldValue('sendto');
            	data.sendfrom = nlapiGetFieldValue('sendfrom');
            	data.body = document.getElementById('previewEmail').innerHTML;
            	alert(JSON.stringify(data));
//            	return data;
            } else if(data.hashchanged == 'F') {
            	data.sendto = nlapiGetFieldValue('sendto');
            	data.sendfrom = nlapiGetFieldValue('sendfrom');
            	data.body = content; // Need to generate content here after resetting the hash number.
//            	return data;
            } 
//            else {
//            	document.getElementById('errorMsg').innerHTML = 'data.hashchanged needs to have a value of T or F';
//            	return;
//            }
        }
        createProgressBar(progressMsg);
        
        // URL for the Restlet
        var url = '/app/site/hosting/restlet.nl?script=472&deploy=1';// https://rest.netsuite.com/app/site/hosting/restlet.nl?script=475&deploy=1'; 
        xmlRequest.onreadystatechange = function() {
//        console.log('xmlRequest.readyState=' + xmlRequest.readyState);
            if (xmlRequest.readyState == 4) {
                if (xmlRequest.status == 200) {
                    // success
                	var returnValue;
                	var exRecID = data.txnid;
                	if(btnId == 'resethash') {
                		//alert(btnId);
                		returnValue = handleResetHashResponse(xmlRequest, exRecID);
                	}
                    if(btnId == 'previewemailbeforereset') {
                    	//alert(btnId);
                    	console.log('xmlRequest: ' + JSON.stringify(xmlRequest));
                    	returnValue = handlePreviewEmailBeforeResponse(xmlRequest);
                    }
                    if(btnId == 'previewemailafterreset') {
                    	//alert(btnId);
                    	returnValue = handlePreviewEmailAfterResponse(xmlRequest);
                    }
                    if(btnId == 'resetsendemail') {
                    	//alert(btnId);
                    	returnValue = handleResetSendEmailResponse(xmlRequest, exRecID);
                    }
                    if(btnId == 'sendemail') {
                    	//alert(btnId);
                    	returnValue = handleSendEmailResponse(xmlRequest);
                    }
                } else {
                	document.getElementById('errorMsg').innerHTML = 'ERROR xmlRequest.status: ' + xmlRequest.status;
                	return;
                    }
                }
                window.status = 'Ready';
            };
        xmlRequest.open('POST', url, true);
        xmlRequest.setRequestHeader("Content-Type", "application/json");
        xmlRequest.send(JSON.stringify(data));
        
        return returnValue;
    } catch (e) {
    	var err = e;
    	console.log('ERROR xmlRequest.status: ' + xmlRequest.status + '<br>ERROR xmlRequest.readyState: ' + xmlRequest.readyState);
    	console.log(nlapiGetContext().getUser());
    	console.log(JSON.stringify(err));
    	console.log('JSON Data: ' + JSON.stringify(data));
//    	closeProgressBar();
    }
}

function handleResetHashResponse(xmlRequest, exRecID){
    try {
    	
        var returnObject = JSON.parse(xmlRequest.responseText);
        console.log('handleResponse ' + returnObject.msg.returnStatus);
        closeProgressBar();
        var status = buildStatusMessage(returnObject);
        document.getElementById('statusMsg').innerHTML = status;
        document.getElementById('custpage_hashid').value = returnObject.newHashId;
//      document.getElementById('custpage_hashid').innerHTML = returnObject.newHashId;
        document.getElementById('custpage_hashtext').innerHTML = returnObject.newHash;
        document.getElementById('custpage_subheading_val').innerHTML = '<h4>New Exchange Hash Number: ' + returnObject.newHash + '</h4>';
        document.getElementById('resetbutton').innerHTML = '';
        document.getElementById('previewbutton').innerHTML = '<button id="previewemailafterreset" type="button" onclick="apiCallToRestlet(\'previewemailafterreset\')"> Preview Email </button>';
        if(returnObject.newHashId) {
        	document.getElementById('custpage_hash_changed').value = 'T';
        	//Set all Statuses on current Exchange Record to be blank
        	console.log('This is the exchange record ID ' + exRecID);
        	//Need to reset all of the status fields on the exchange record and look for other exchange records to update
        	ultraLock(exRecID, '', '', '', '', '', 'RESET');
        }
    } 
    catch (e) {
    	closeProgressBar();
//    	removeSubmitButton();
        alert('ERROR: Problem handing response.\n\n The hash may have been changed.\n\nPlease verify by viewing the log on the hash record.');
        return false;
    }
    return returnObject;
}

function handlePreviewEmailBeforeResponse(xmlRequest) {
    try {
        var returnObject = JSON.parse(xmlRequest.responseText);
        console.log('handlePreviewEmailResponse(xmlRequest) ' + returnObject.returnStatus);
        if(returnObject != null) {
        	document.getElementById('emailaddress').style.display = ""; 
        	document.getElementById('sendfrom').defaultValue = 'support@shareholderrep.com';
//        	alert('returnObject.sholderEmail: ' + returnObject.sholderEmail);
        	document.getElementById('sendto').defaultValue = returnObject.sholderEmail;
        	document.getElementById('previewEmail').innerHTML = returnObject.emailBody;
        	document.getElementById('subject').value = returnObject.subject;
        	var hashchanged = document.getElementById('custpage_hash_changed').value;
        	if(returnObject.sholderEmail != null && returnObject.sholderEmail != '' && hashchanged == 'F') {
        		document.getElementById('previewbutton').innerHTML = '<button type="button" id="resetsendemail" onclick="apiCallToRestlet(\'resetsendemail\')" > Reset Hash & Send Email </button>';
        		document.getElementById('resetbutton').innerHTML = '';
        	}
        	if(returnObject.sholderEmail != null && returnObject.sholderEmail != '' && hashchanged == 'T') {
        		document.getElementById('previewbutton').innerHTML = '<button type="button" id="sendemail" onclick="apiCallToRestlet(\'sendemail\')" >  Send Email With This New Hash </button>';
        	}
        }
        closeProgressBar();
    } 
    catch (e) {
    	closeProgressBar();
//    	removeSubmitButton();
        alert('ERROR: Problem handing response.\n\n The hash may have been changed.\n\nPlease verify by viewing the log on the hash record.');
        return false;
    }
    return returnObject;
}

function handlePreviewEmailAfterResponse(xmlRequest) {
    try {
        var returnObject = JSON.parse(xmlRequest.responseText);
        console.log('handlePreviewEmailResponse(xmlRequest) ' + returnObject.returnStatus);
        if(returnObject != null) {
        	document.getElementById('emailaddress').style.display = ""; 
        	document.getElementById('sendfrom').defaultValue = 'support@shareholderrep.com';
//        	alert('returnObject.sholderEmail: ' + returnObject.sholderEmail);
        	document.getElementById('sendto').defaultValue = returnObject.sholderEmail;
        	document.getElementById('subject').value = returnObject.subject;
        	document.getElementById('previewEmail').innerHTML = returnObject.emailBody;
        	var hashchanged = document.getElementById('custpage_hash_changed').value;
        	if(returnObject.sholderEmail != null && returnObject.sholderEmail != '' && hashchanged == 'F') {
        		document.getElementById('previewbutton').innerHTML = '<button type="button" id="resetsendemail"> Reset Hash & Send Email </button>';
        	}
        	if(returnObject.sholderEmail != null && returnObject.sholderEmail != '' && hashchanged == 'T') {
        		document.getElementById('previewbutton').innerHTML = '<button type="button" id="sendemail" onclick="apiCallToRestlet(\'sendemail\')" >  Send Email With This New Hash </button>';
        	}
        }
        closeProgressBar();
    } 
    catch (e) {
    	closeProgressBar();
//    	removeSubmitButton();
        alert('ERROR: Problem handing response.\n\n The hash may have been changed.\n\nPlease verify by viewing the log on the hash record.');
        return false;
    }
    return returnObject;
}

function handleResetSendEmailResponse(xmlRequest, exRecID) {
    try {
    	
        var returnObject = JSON.parse(xmlRequest.responseText);
        console.log('handleSendEmailResponse()  handleResponse ' + returnObject.msg.returnStatus);
        closeProgressBar();
        removeSubmitButton();
        //alert(returnObject.msg.returnStatus);
        
        if(returnObject.msg.returnStatus == 'Success') {
        	ultraLock(exRecID, '', '', '', '', '', 'RESET');
        	var statusemail = '<h3>The email has been sent. You can view the email on the \'Mail Merge\' tab of the Exchange Record.</h3>';
        	document.getElementById('custpage_subheading_val').innerHTML = '<h4>New Exchange Hash Number: ' + returnObject.newHash + '</h4>';
        	document.getElementById('statusEmail').innerHTML = statusemail;
        	var status = buildStatusMessage(returnObject);
        	document.getElementById('statusMsg').innerHTML = status;
        	
        } else {
        	var statusemail = '<strong>ERROR: Problem sending the email.  Email may have failed. Hash reset may have worked, please check the log message on the exchange hash record.</strong>';
        	document.getElementById('errorMsg').innerHTML = statusemail;
        }
    } 
    catch (e) {
    	closeProgressBar();
    	removeSubmitButton();
        alert('ERROR: Problem handing response.\n\n The hash may have been changed.\n\nPlease verify by viewing the log on the hash record.');
        return false;
    }
    return returnObject;
}

function handleSendEmailResponse(xmlRequest) {
    try {
    	 var returnObject = JSON.parse(xmlRequest.responseText);
         console.log(' 331 handleSendEmailResponse()  handleResponse ' + returnObject.msg.returnStatus);
         closeProgressBar();
         removeSubmitButton();
         if(returnObject.msg.returnStatus == 'Success') {
         	var statusemail = '<h3>The email has been sent. You can view the email on the \'Mail Merge\' tab of the Exchange Record.</h3>';
         	document.getElementById('statusEmail').innerHTML = statusemail;
         	var status = buildStatusMessage(returnObject);
         	document.getElementById('statusMsg').innerHTML = status;
         	
         } else {
         	var statusemail = '<strong>ERROR: Problem sending the email.  Email may have failed. Hash reset may have worked, please check the log message on the exchange hash record.</strong>';
         	document.getElementById('errorMsg').innerHTML = statusemail;
         }
    } 
    catch (e) {
    	closeProgressBar();
    	removeSubmitButton();
//        alert('ERROR: Problem handing response.\n\n The hash may have been changed.\n\nPlease verify by viewing the log on the hash record.');
        return false;
    }
    return returnObject;
}

var progressbarhtml = '<progress max="100" style="height:16px; width:400px;"></progress><br><br><div style="width: 400px"><span style="text-align:center;font-size:12pt;">';
function createProgressBar(message) { document.getElementById('progressbar').innerHTML = progressbarhtml + message + '</span></div>';}
function closeProgressBar() { document.getElementById('progressbar').innerHTML = '';}
function removeSubmitButton() { document.getElementById('custpage_submit_val').innerHTML = '';}

function buildStatusMessage(responseObj) {
	var html = '';
	console.log('buildStatusMessage >> responseObj.msg.returnMessages.length >> ' + responseObj.msg.returnMessages.length);
	if(responseObj.msg.returnStatus == 'Success') {
		console.log(responseObj.oldHashId);
		if(responseObj.oldHashId != null && responseObj.oldHashId != '' && responseObj.oldHashId != 'null') {
			var recArray = responseObj.exRecords;
			for (var hLoop = 0; hLoop < recArray.length; hLoop++ ) {
				var exchangeRecord = recArray[hLoop];
				console.log(exchangeRecord);
				if(exchangeRecord == null || exchangeRecord == '') {
					exchangeRecord = recArray[hLoop].id;
					console.log(exchangeRecord);
				}
//				html += '<h3>Exchange Record: ' + '<a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_lot', exchangeRecord, 'VIEW')+'">'+ exchangeRecord +'</a></h3><br>';
				html += '<span>Hash number ';
				html += '<a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_exchange_hash', responseObj.oldHashId, 'VIEW')+'">'+responseObj.oldHash+'</a>';
				html += ' has been removed and replaced with ';
				html += '<a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_exchange_hash', responseObj.newHashId, 'VIEW')+'">'+responseObj.newHash+'</a></span>';
				html += '<br><br><br>';
			}
		} else {
			var recArray = responseObj.exRecords;
			for (var hLoop = 0; hLoop < recArray.length; hLoop++ ) {
//				html += '<h3>Exchange Record: ' + '<a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_lot', recArray[hLoop], 'VIEW')+'">'+ recArray[hLoop] +'</a></h3><br>';
				html += '<span>Hash number ';
				html += '<a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_exchange_hash', responseObj.newHashId, 'VIEW')+'">'+responseObj.newHash+'</a></span>';
				html += ' has been added to this exchange record.';
				html += '<br><br>';
			}
		}
	} else {
		html += '<p></p>';
	}
	return html;
}

function returnArrayJoinExchRecords(responseObj) {
//	var recArray = [];
	if(responseObj.oldHashId != null && responseObj.oldHashId != '' && responseObj.oldHashId != 'null') {
		var recArray = responseObj.exRecords;
//		return recArray[0];
		for (var hLoop = 0; hLoop < recArray.length; hLoop++ ) {
			var exchangeRecord = recArray[hLoop];
			if(exchangeRecord == null || exchangeRecord == '') {
				exchangeRecord = recArray[hLoop].id;
			}
		}
		if(recArray != null && recArray != '') { 
			return recArray;
		}
	} 
}