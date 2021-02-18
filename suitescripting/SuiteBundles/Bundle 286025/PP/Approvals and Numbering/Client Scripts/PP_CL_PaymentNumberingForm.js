/**
 * This client script is linked to the Payment Numbering Suitelet.
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Sep 2012     Eric Grubaugh
 *
 */

/**
 * Activated whenever a field changes on the Payment Numbering form. When the Bank Account field
 * is changed, the form POSTs to itself.
 * 
 * @param {String} type - Sublist internal id
 * @param {String} name - Field internal id
 * @param {Number} linenum - Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum) {
	var latestNumber = 0,
		startingNumber = 0,
		isIncrement = true,
		show = true,
		where = 'clientFieldChanged';
	
	/* When the bank account field changes, POST form to itself */
	if (name === 'custpage_account_select') {
		if (document.forms['main_form']) {
		    try {
		        setWindowChanged(window, false);
				document.forms['main_form'].submit();
			} catch (ex) {
				afnLog(show, where, 'Caught exception when submitting form: ' + ex);
			}
		}
	/* When the status field changes, update the last payment number
	 * accordingly
	 */
	} else if (name === 'status') {
		/* Modify the ending check number if it has been assigned */
		if (nlapiGetFieldValue('custpage_endcheck_text')) {
			isIncrement = (nlapiGetLineItemValue(CAC_NUMBERING_SUBLIST_ID, 'status', linenum) === 'T');
			
			startingNumber = parseInt(nlapiGetFieldValue('custpage_startcheck_text'), 10);
			latestNumber = parseInt(nlapiGetFieldValue('custpage_endcheck_text'), 10);
			
			if (latestNumber) {
				isIncrement ? latestNumber++ : latestNumber--;
				
				/* When the last payment is unchecked, latestNumber will be
				 * less than startingNumber, so set the field to empty instead
				 */
				if (latestNumber < startingNumber) {
					nlapiSetFieldValue('custpage_endcheck_text', '');
				} else {
					nlapiSetFieldValue('custpage_endcheck_text',
							latestNumber.toString());
				}
			}
		/* Otherwise if the ending number has not been assigned, set it equal
		 * to the starting number
		 */
		} else {
			nlapiSetFieldValue('custpage_endcheck_text',
					nlapiGetFieldValue('custpage_startcheck_text'));
		}
	}
}

/**
 * Click handler for the SubList's Submit button. Sends the selected payments' internal IDs to
 * the Numbering Processor Suitelet via a paymentIds POST parameter.
 * 
 * @private
 */
function submitBtn_click() {
	var selectedIds = getSelectedItems(),
		postData = {
			'paymentIds' : selectedIds,
			'startingCheck' : nlapiGetFieldValue('custpage_startcheck_text')
		};
	
	/* Send request to processor suitelet */
	nlapiRequestURL(CAC_NUM_PROCESSOR_URL, postData, null, processor_callback);
}

/**
 * Click handler for the custom Mark and Unmark All buttons. Marks all Status checkboxes in the
 * sublist according to the <code>isMark</code> parameter.
 * 
 * @param {boolean} isMark - Indicates whether the checkboxes should be enabled (true) or disabled
 * 		(false)
 */
function markBtn_click(isMark) {
	var itemCount = nlapiGetLineItemCount(CAC_NUMBERING_SUBLIST_ID),
		markValue = isMark ? 'T' : 'F';

	for (; itemCount > 0; itemCount--) {
		/* This guard prevents consecutive clicks of the same button from firing
		 * the change handler
		 */
		if (nlapiGetLineItemValue(CAC_NUMBERING_SUBLIST_ID, 'status', itemCount) !== markValue) {
			nlapiSetLineItemValue(CAC_NUMBERING_SUBLIST_ID, 'status', itemCount, markValue);
			
			/* Explicitly execute event handler */
			clientFieldChanged(CAC_NUMBERING_SUBLIST_ID, 'status', itemCount);
		}
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
function processor_callback(response) {
	/* Re-load Form Suitelet to number payment items */
	window.location.href = window.location.protocol + '//' + window.location.host +
		CAC_NUMBERING_URL;
}

/**
 * Retrieves the Internal IDs of selected line items.
 * 
 * @returns {string[]} An array of the internal IDs of line items that have the Select
 * 		column checked.
 * @private
 */
function getSelectedItems() {
	var itemCount = nlapiGetLineItemCount(CAC_NUMBERING_SUBLIST_ID),
		selectedIds = [];

	for (; itemCount > 0; itemCount--) {
		if (nlapiGetLineItemValue(CAC_NUMBERING_SUBLIST_ID, 'status', itemCount) === 'T') {
			selectedIds.push(nlapiGetLineItemValue(CAC_NUMBERING_SUBLIST_ID, 'internalid', itemCount));
		}
	}

	return selectedIds;
}

