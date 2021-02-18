/**
 * This client script is linked to the Payment Approval Form Suitelet.
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Sep 2012     Eric Grubaugh
 *
 */

/**
 * Click handler for the Form's Reset button. Clears all search filters and resubmits the form.
 */
function resetbtn_click() {
	nlapiSetFieldValue('custpage_type_select', '');
	nlapiSetFieldValue('custpage_customer_select', '');
	nlapiSetFieldValue('custpage_vendor_select', '');

    setWindowChanged(window, false);
	document.forms['main_form'].submit();
}

/**
 * Click handler for the SubList's Reject button. Sends a request to the Processor
 * Suitelet to process the selected rejections.
 * 
 * @private
 */
function rejectbtn_click(id) {
	rejectKickbackWindow('REJECT',id);
}


/**
 * Click handler for the SubList's Approve button. Sends a request to the Processor
 * Suitelet to process the selected approvals.
 * 
 * @private
 */
function approvebtn_click() {
	var selectedIds = getSelectedItems();
	
	
	if (selectedIds.length > 0) {
		// Send request to processor suitelet
		var title = 'Approving payments';
		
		t = '<div style="padding: 3px;" id="ppcounter">Approved 0 of '+selectedIds.length+' payments</div>';
		var win = new Ext.Window({
			html: t,
	        layout:'fit',
	        title: title,
	        width:500,
	        height:200,
	        modal: true,
	        plain: true,
	        closable: false
	    });
		
		win.show();
		var error = false;
		var i,j,temparray,chunk = 40;
		for (i=0,j=selectedIds.length; i<j; i+=chunk) {
		    temparray = selectedIds.slice(i,i+chunk);
		    var postData = {'paymentIds' : temparray, 'action' : 'APPROVE'};
		    try{
		    	var response = nlapiRequestURL(CAC_PROCESSOR_URL, postData, null);
		    	if(response.getCode() == '206'){
					var errObj = response.getError();
					throw("There was an error completing your request.\n" + errObj.getCode() + ": "  + errObj.getDetails());
				}
			    else{
			    	jQuery('#ppcounter').html('Approved ' + (i + chunk) + ' of ' + selectedIds.length + ' payments');
			    }
		    }
		    catch(e){
		    	if(e.code == 'INSUFFICIENT_PERMISSION'){
		    		error = "Error: You do not have permissions to approve payments. You need to be given access to the Avid SL Payment Approval Processor script deployment.";
		    	}
		    	else{
		    		error = 'There was an error completing your request.';
		    	}
		    	
		    	continue;
		    }
		}
		
		if(!error){
			jQuery('#ppcounter').html('Update complete. Refreshing page.');
			setWindowChanged(window, false);
			// Re-load Form Suitelet to remove approved/rejected list items
			window.location.href = window.location.protocol + '//' + window.location.host + CAC_FORM_URL;
		}
		else{
			var b = jQuery('<button>Close</button>').click(function(){
				setWindowChanged(window, false);
				window.location.href = window.location.protocol + '//' + window.location.host + CAC_FORM_URL;
			});
			jQuery('#ppcounter').html(error + '<br/>').append(b);
		}
		
	} else {
		alert('You have not selected any items to approve.');
	}
}

/**
 * Click handler for the SubList's Kick Back button. Sends a request to the Processor
 * Suitelet to process the selected kick backs.
 * 
 * @private
 */
function kickbtn_click(id) {
	rejectKickbackWindow('KICKBACK',id);
}

/**
 * Displays a rejection/kickback reason form to the user. The form is displayed in a modal window.
 * 
 * @param {string} action - KICKBACK, REJECT
 * @private
 */
function rejectKickbackWindow(action,paymentId){
	var title = '';
	if(action == 'KICKBACK'){
		title = 'Reason for Payment Return'
	}
	else if(action == 'REJECT'){
		title = 'Reason for Payment Rejection';
	}
	else{
		return;
	}
	
	t = '<div style="padding: 3px;"><textarea name="reason" style="width: 100%; height: 110px;"></textarea></div>';
	var win = new Ext.Window({
		html: t,
        layout:'fit',
        title: title,
        width:500,
        height:200,
        modal: true,
        plain: true,
        listeners: {
        	show: function(w){
        		//auto focus on reason textarea
        		setTimeout(function(){
        			jQuery('textarea[name=reason]')[0].focus();
        		},100);
            }
        },
        buttons: [
	        {
	            text: 'Submit',
	            handler: function(){
	            	var reason = jQuery('textarea[name=reason]').val();
	            	var postData = {'paymentIds' : [paymentId], 'action' : action, 'reason' : reason};
	            	nlapiRequestURL(CAC_PROCESSOR_URL, postData, null, processor_callback_reject_return);
	                win.close();
	            }
	        },
	        {
	            text: 'Cancel',
	            handler: function(){
	                win.close();
	            }
	        }
        ]
    });
	
	win.show();
}

/**
 * Callback function executed after the Processor suitelet returns a response. The result of
 * the request is returned in the header CAC_PROCESSOR_RESULT.<br><br>
 * 
 * Possible values are:
 * <ul>
 * <li>SUCCESS - the request processed successfully.</li>
 * <li>ERROR - the request failed to process correctly.</li>
 * </ul>
 * 
 * If there is an error, an associated message is provided in the CAC_PROCESSOR_ERROR_MSG header.
 * <br><br>
 * @param {nlobjResponse} response - The response object sent by NetSuite.
 * @private
 */
function processor_callback(response) {
	if(response.getCode() == '206'){
		var errObj = response.getError();
		alert("There was an error completing your request.\n" + errObj.getCode() + ": "  + errObj.getDetails());
	}
	else{
		alert('Your request to approve the selected items was submitted.');
		setWindowChanged(window, false);
		// Re-load Form Suitelet to remove approved/rejected list items
		window.location.href = window.location.protocol + '//' + window.location.host + CAC_FORM_URL;
	}
}

/**
 * Callback function executed after the Processor suitelet returns a response. The result of
 * the request is returned in the header CAC_PROCESSOR_RESULT.<br><br>
 * 
 * Possible values are:
 * <ul>
 * <li>SUCCESS - the request processed successfully.</li>
 * <li>ERROR - the request failed to process correctly.</li>
 * </ul>
 * 
 * If there is an error, an associated message is provided in the CAC_PROCESSOR_ERROR_MSG header.
 * <br><br>
 * @param {nlobjResponse} response - The response object sent by NetSuite.
 * @private
 */
function processor_callback_reject_return(response) {
	if(response.getCode() == '206'){
		var errObj = response.getError();
		alert("There was an error completing your request.\n" + errObj.getCode() + ": "  + errObj.getDetails());
	}
	else{
		alert('Your request to reject or return was submitted.');
		setWindowChanged(window, false);
		// Re-load Form Suitelet to remove approved/rejected list items
		window.location.href = window.location.protocol + '//' + window.location.host + CAC_FORM_URL;
	}
}

/**
 * Retrieves the Internal IDs of selected line items.
 * 
 * @returns {string[]} An array of the internal IDs of line items that have the Approve/Reject
 * 		column checked.
 * @private
 */
function getSelectedItems() {
	var itemCount = nlapiGetLineItemCount(CAC_FORM_SUBLIST_ID),
		selectedIds = [];

	for (; itemCount > 0; itemCount--) {
		if (nlapiGetLineItemValue(CAC_FORM_SUBLIST_ID, 'status', itemCount) === 'T') {
			selectedIds.push(nlapiGetLineItemValue(CAC_FORM_SUBLIST_ID, 'internalid', itemCount));
		}
	}

	return selectedIds;
}

function redirectToEntity(entityId){
	var recordType = nlapiLookupField('entity', entityId, 'recordtype');
	var url = nlapiResolveURL('record', recordType, entityId);	
	window.location.href = url;
}


var sublistTotaler = new SublistTotaler([CAC_FORM_SUBLIST_ID],{sublistAmountField: 'amount'});

function fieldChanged(type, name, linenum) {
	sublistTotaler.callbacks.fire(type, name, linenum);
}