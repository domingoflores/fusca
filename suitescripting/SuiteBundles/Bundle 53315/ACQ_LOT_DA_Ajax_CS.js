/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.03       16 Jun 2014     smccurry		   Handles the RESTLET call when the 'Approve and Create DA' button is pressed.
 * 1.04		  03 Sept 2014    smccurry		   Updated from Staging.  Many changes made this client script.
 * 1.05		  12 Sept 2014    smccurry   	   Moved current version to Production
 * 
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

function apiCreditMemoRefund() {
}

jQuery(document).ready(function(){
	loadButton();
	// Turn on this line to automatically call the Approve button, which may be hidden currently if this is on.
//	document.getElementById('errormsg').innerHTML = '<progress max="100" style="height:16px; width:300px;"></progress>';
//	apiCallToCreditMemoRefundRestlet('startapproval', null);

});

function loadButton() {
	jQuery(".approveBtn").unbind("click");
	jQuery(".approveBtn").click(function(){
		
		if(window.DAFeeValidator.validateFee()){
//			alert(this.id);
			document.getElementById('errormsg').innerHTML = '<progress max="100" style="height:16px; width:300px;"></progress>';
//			var dataJSON = jQuery('#dataIn').text();
			var data = {},
				defaultFee = window.DAFeeValidator.getDefaultFee().toString(),
				fee = window.DAFeeValidator.getFee().toString();
			
			//Set data values and submit to NetSuite to approve/save.
			data.calltype = this.id;
			data.txnid = document.getElementById('custpage_txnid').value || null;
			data.txntype = document.getElementById('custpage_txntype').value || null;
//			data.piracleid = document.getElementById('custpage_piracle').value || null;  // ATP-1981
			data.piracleid = null;                                                       // ATP-1981
			data.cmemoid = document.getElementById('custpage_cmemo').value || null;
			data.crefundid = document.getElementById('custpage_crefund').value || null;
			
			if(defaultFee != fee){
				data.feeOverride = fee || 0;
			}
			else { data.feeOverride = 'false'; }

			postAjaxData(JSON.stringify(data));
		}
		else{
			window.DAFeeValidator.alertFee();
		}
	});
}

/**********************************************************************
 * AJAX-HTTPRequest
 **********************************************************************/ 
function postAjaxData(data) {
    jQuery.ajax({
    	headers: {
    		'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        type: "POST",
        url: '/app/site/hosting/restlet.nl?script=customscript_acq_lot_da_cmemo_refund_r&deploy=1',
        data: data,
        dataType: 'JSON',
        success: function(response) {
			console.log('RESPONSE: ' + JSON.stringify(response));
//			alert(JSON.stringify(response));
        	var returnObject = response;
        	var msg = returnObject.msg;
        	var msgs = returnObject.msg.returnMessages;
//        	if(msgs != null & msgs != '') {
//        		document.getElementById('errormsg').innerHTML = JSON.stringify(msgs);
//        	}
			
			if(msg.returnStatus == 'Success') {
				if(returnObject.callbacktype == 'piraclecomplete') {
					console.log('updatePiracleStatus'); // Turn on for testing break point before another ajax call.
					updatePiracleStatus(returnObject);
				} else if(returnObject.callbacktype == 'creditmemocomplete') {
					console.log('updateCreditMemoStatus - callbacktype');// Turn on for testing break point before another ajax call.
					updateCreditMemoStatus(returnObject);
				} else if(returnObject.callbacktype == 'refundcomplete') {
					console.log('updateCustomerRefundStatus');// Turn on for testing break point before another ajax call.	
					updateCustomerRefundStatus(returnObject); 
				} else if(returnObject.callbacktype == 'paymentcomplete') {
					console.log('updateCustomerRefundStatus');	// Turn on for testing break point before another ajax call.
					updatePaymentCompleteStatus(returnObject); 
				} else if(returnObject.callbacktype == 'exrecupdatefailed') {
					console.log('A Credit Memo and Customer Refund may have been created but\nthe related record fields on the Exchange Record were not set.\nPlease check the Exchange Record.');	
				} else if(returnObject.callbacktype == 'deleted') {
					updateDeleteStatus(returnObject);
				}
				
			} else {
				var msgs = returnObject.msg.returnMessages;
				var errorTD = document.getElementById('errormsg');
				var errlog = document.createElement("DIV");
				for(var eLoop = 0; eLoop < msgs.length; eLoop++) {
					var t = document.createElement("P");
					t.innerHTML = '<strong>ERROR: </strong>' + msgs[eLoop].message;
					errlog.appendChild(t);
//					console.log('ERROR' + msgs[eLoop].message);
//					response.write('<div>' + msgs[errorLoop].code + ' ' + msgs[errorLoop].message + '</div>');
				}
				document.getElementById('approvebutton').innerHTML = '';
				document.getElementById('errormsg').innerHTML = '';
				errorTD.appendChild(errlog);
			}
        },
        error: function(response) {
        	alert('There was a problem.');
		},
    });
}

function updatePiracleStatus(returnObject) {
	console.log('line 99');
	var msg = returnObject.msg;
	var lotFields = returnObject.lotFields;
	var piracle = returnObject.piracle;
	piracle = null;     // ATP-1981
//	jQuery('#dataIn').text(JSON.stringify(returnObject));
	console.log('line 102');
	if(msg.returnStatus == 'Success') {
		try {
			if(piracle != null && piracle != '') {
				console.log('line 106');
				console.log('line 108');
				if(piracle.id != null && piracle.id != '') {
					console.log('line 110');
					document.getElementById('piracle').innerHTML = '<a href="'+nlapiResolveURL('RECORD', 'customrecord_pp_ach_account', piracle.id, 'VIEW')+'">Piracle '+ piracle.id +'</a>';
					jQuery('#custpage_piracle').val(piracle.id);
					jQuery('#piracle').css('background-color', '#CCFFCC');
					document.getElementById('errormsg').innerHTML = '<progress max="100" value="25" style="height:16px; width:400px;"></progress>';
				} else {
					var checkPayType = jQuery('#paytype').val();
					if(checkPayType != 'ACH') {
						document.getElementById('piracle').innerHTML = 'Not ACH';
					}
				}
				console.log('line 115');
				if(lotFields.bankabaVerified != null && lotFields.bankabaVerified != '') {
					console.log('line 117');
					if(lotFields.bankabaVerified == true) {
						document.getElementById('aba').innerHTML = 'Verified!';
						jQuery('#aba').css('background-color', '#CCFFCC');
						document.getElementById('errormsg').innerHTML = '<progress max="100" value="40" style="height:16px; width:400px;"></progress>';
					} else {
						document.getElementById('aba').innerHTML = 'NOT Verified!';
						jQuery('#aba').css('background-color', 'red');
					}
				} else {
					document.getElementById('aba').innerHTML = 'N/A';
				}
				console.log('line 131');
//				document.getElementById('approvebutton').innerHTML = '<button id="createcreditmemo" class="btn btn-xs btn-info approveBtn" type="button"> Create CM </button>';
				document.getElementById('approvebutton').innerHTML = '';
				document.getElementById('errormsg').innerHTML = '<progress max="100" value="25" style="height:16px; width:400px;"></progress>';
			} else {
				console.log('line 135');
				console.log('responseObj.piracle was null or empty');
			}
			// Build data for the next call to the restlet, based off the existing object so we keep data needed, but replace calltype
			var data = returnObject;
			console.log('line 139');
			data.calltype = 'createcreditmemo';
			data.txnid = document.getElementById('custpage_txnid').value || null;
			data.txntype = document.getElementById('custpage_txntype').value || null;
			console.log('line 141');
			postAjaxData(JSON.stringify(data));
		} catch (e) {
			closeProgressBar();
			alert('ERROR: Problem handing response.\n\n \'startapproval\' was checking to see if there was a Piracle record.(Client Side Script)');
			return false;
		}
	}
}

function updateCreditMemoStatus(returnObject) {
	var msg = returnObject.msg;
	var cMemo = returnObject.cmemo;
//	jQuery('#dataIn').text(JSON.stringify(returnObject));
//	console.log(JSON.stringify(cMemo));
//	console.log(JSON.stringify(returnObject.msg.returnStatus));
	console.log('about to check return status in updateCreditMemoStatus()')
	if(returnObject.msg.returnStatus == 'Success') {
		console.log('cMemo: ' + cMemo.id);
		try {
			if(cMemo.id != null && cMemo.id != '') {
				document.getElementById('creditmemo').innerHTML = '<a href="'+nlapiResolveURL('RECORD', 'creditmemo', cMemo.id, 'VIEW')+'">Credit Memo '+ cMemo.tranid +'</a>';
				jQuery('#custpage_cmemo').val(cMemo.id);
//				document.getElementById('approvebutton').innerHTML = '<button id="createrefund" class="btn btn-xs btn-success approveBtn" type="button"> Refund </button>';
				document.getElementById('approvebutton').innerHTML = '';
//				document.getElementById('creditmemo').innerHTML = 'Credit Memo ';
				jQuery('#creditmemo').css('background-color', '#CCFFCC');
				document.getElementById('errormsg').innerHTML = '<progress max="100" value="66" style="height:16px; width:400px;"></progress>';
//				alert('About to create the refund');
				var data = returnObject;
				data.calltype = 'createrefund';
				data.txnid = document.getElementById('custpage_txnid').value || null;
				data.txntype = document.getElementById('custpage_txntype').value || null;
				postAjaxData(JSON.stringify(data));
			} else {
				document.getElementById('creditmemo').innerHTML = 'Error creating Credit Memo.';
			}
		} catch (e) {
			closeProgressBar();
//			console.log('Problems processing credit memo complete');
//			return false;
		}
	}
}

function updateCustomerRefundStatus(returnObject) {
	var msg = returnObject.msg;
	var lotFields = returnObject.lotFields;
	var data = returnObject; // Return object
	
//	jQuery('#dataIn').text(JSON.stringify(returnObject));
	
	
	if( returnObject.skip == true ) {
		document.getElementById('refund').innerHTML = 'Skipped';
		jQuery('#refund').css('background-color', '#CCFFCC');
		
	} else if(msg.returnStatus == 'Success') {
		try {
			var custRefund = returnObject.custRefund;
			if(custRefund.id != 'null' || custRefund.id != '') {
				document.getElementById('refund').innerHTML = '<a href="'+nlapiResolveURL('RECORD', 'customerrefund', custRefund.id, 'VIEW')+'">Refund: '+ custRefund.tranid +'</a>';
				jQuery('#custpage_crefund').val(custRefund.id);
				document.getElementById('approvebutton').innerHTML = '<button id="deleteRefund" type="button" class="btn btn-xs btn-warning approveBtn"> Delete </button>';
//				document.getElementById('approvebutton').innerHTML = '';
				jQuery('#refund').css('background-color', '#CCFFCC');
				document.getElementById('approvebutton').innerHTML = '';
				
//				closeProgressBar();
//				var refundURL = nlapiResolveURL('RECORD', 'customerrefund', custRefund.id, 'VIEW');
//				window.location = refundURL;
////				window.open(refundURL, '_blank');
//				window.focus();
			} else {
				document.getElementById('refund').innerHTML = 'Problems creating Refund';
//				jQuery('#refund').css('background-color', '#CCFFCC');
				closeProgressBar();
			}
	
		} catch (e) {
			closeProgressBar();
			console.log('Problems processing Customer Refund or receiving Customer Refund Internal ID');
			return false;
		}
	}
	
	
	data.calltype = 'updateexchangerec';
	data.txnid = document.getElementById('custpage_txnid').value || null;
	data.txntype = document.getElementById('custpage_txntype').value || null;
	postAjaxData(JSON.stringify(data));
	
}

function updatePaymentCompleteStatus(returnObject) {
	var msg = returnObject.msg;
	var lotFields = returnObject.lotFields;
	var paymentComplete = returnObject.paymentComplete;
//	jQuery('#dataIn').text(JSON.stringify(returnObject));
	if(paymentComplete) {
		console.log(paymentComplete);
	}
	if(msg.returnStatus == 'Success' && paymentComplete == true) {
		document.getElementById('erlinks').innerHTML = 'Updated';
		document.getElementById('approvebutton').innerHTML = '<button id="deleteRefund" type="button" class="btn btn-xs btn-warning approveBtn"> Delete </button>';
		jQuery('#erlinks').css('background-color', '#CCFFCC');
		jQuery('#approvebutton').css('background-color', '#CCFFCC');
		loadButton();
		closeProgressBar();
		try {
//			var custRefund = returnObject.custRefund;
//			if(custRefund != null & custRefund != '') {
//				alert(JSON.stringify(custRefund));
//			}
//			if(custRefund.id != 'null' || custRefund.id != '') {
//				jQuery('#erlinks').css('background-color', '#CCFFCC');
//				closeProgressBar();
//				var refundURL = nlapiResolveURL('RECORD', 'customerrefund', custRefund.id, 'VIEW');
//				window.location = refundURL;
//				window.focus();
//			} else {
//				document.getElementById('erlinks').innerHTML = 'Problems opening the Refund';
////				jQuery('#refund').css('background-color', '#CCFFCC');
//				closeProgressBar();
//			}
	
		} catch (e) {
			closeProgressBar();
			console.log('Problems updating the Exchange Record links to the Credit Memo and/or the Customer Refund.');
			return false;
		}
	}
}

function updateDeleteStatus(returnObject) {
	console.log(JSON.stringify(returnObject));
	var msg = returnObject.msg;
	var deletedRecords = returnObject.deletedRecords;
	if(msg.returnStatus == 'Success') {
		try {
			var cmemoid = deletedRecords.cmemo;
			if(cmemoid != 'null' || cmemoid != '') {
				document.getElementById('creditmemo').innerHTML = 'Deleted: ' + cmemoid;
				document.getElementById('approvebutton').innerHTML = '';
//				jQuery('#refund').css('background-color', '#CCFFCC');
				document.getElementById('approvebutton').innerHTML = '';
			} else {
				document.getElementById('refund').innerHTML = 'Error';
//				jQuery('#refund').css('background-color', '#CCFFCC');
			}
			var custRefunds = deletedRecords.crefunds;
			document.getElementById('refund').innerHTML = '';
			for(refund in custRefunds) {
				if(refund != null && refund != '') {
					jQuery('#refund').append('Deleted: ' + custRefunds[refund]);
				} else {
					jQuery('#refund').append('Error');
				}
			}
			closeProgressBar();
	
		} catch (e) {
			closeProgressBar();
			console.log('Problems updating the status of the Deleted records in function updateDeleteStatus()');
			return false;
		}
	}
}


var progressbarhtml = '<progress max="100" style="height:16px; width:200px;"></progress><br><br><div style="width: 400px"><span style="text-align:center;font-size:12pt;">';
function createProgressBar(message) { document.getElementById('progressbar').innerHTML = progressbarhtml + message + '</span></div>';};
function closeProgressBar() { document.getElementById('errormsg').innerHTML = '';};
//function removeSubmitButton() { document.getElementById('custpage_submit_val').innerHTML = '';}
