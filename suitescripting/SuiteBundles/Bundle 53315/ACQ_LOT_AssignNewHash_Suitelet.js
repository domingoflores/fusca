/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.01       08 June 2014     smccurry		   Install on production.
 * 1.02       12 June 2014     smccurry		   Fixed bugs, changed initial layout to include 'Subject'
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
/************************************************************
 *  CREATES THE ASSIGN NEW HASH PAGE & PREVIEW EMAIL
 ************************************************************/
function assignNewHash(request, response) {
	if(request.getMethod() == 'GET' && request.getParameter('callType') == null) {
		var confirmForm = nlapiCreateForm('Assign New Hash & Send Reset Email', true);
		confirmForm.setScript('customscript_acq_lot_ajax_cs');
		var txnid = request.getParameter('txnid');
		var txntype = request.getParameter('txntype');
		var hashid = request.getParameter('hashid');
		var hashtext = request.getParameter('hashtext');
		var userid = nlapiGetContext().getUser();
		// HIDDEN FIELDS - Store some data in hidden fields on the Assign New Hash preview page so that it can be retrieved and updated by ajax request response.
		var field_1 = confirmForm.addField('custpage_txnid', 'text', '').setDisplayType('hidden');
		var field_2 = confirmForm.addField('custpage_txntype', 'text', '').setDisplayType('hidden');
		var field_3 = confirmForm.addField('custpage_hashid', 'text', '').setDisplayType('hidden');
		var field_4 = confirmForm.addField('custpage_hashtext', 'text', '').setDisplayType('hidden');
		var field_5 = confirmForm.addField('custpage_userid', 'text', '').setDisplayType('hidden');
		var field_6 = confirmForm.addField('custpage_hash_changed', 'checkbox', '').setDisplayType('hidden');
		field_1.setDefaultValue(txnid);
		field_2.setDefaultValue(txntype);
		field_3.setDefaultValue(hashid);
		field_4.setDefaultValue(hashtext);
		field_5.setDefaultValue(userid);
		field_6.setDefaultValue('F');
		
		// FORM FIELDS
//		confirmForm.addButton('back_button', 'Back', "window.location = '"+nlapiResolveURL('RECORD', 'customrecord_acq_lot', txnid, 'VIEW')+"'");
		var heading = confirmForm.addField('custpage_heading', 'inlinehtml', '').setLayoutType('normal', 'startcol');
		var headhtml = '<h3>Exchange Record: <a href="'+nlapiResolveURL('RECORD', 'customrecord_acq_lot', txnid, 'VIEW')+'">'+ txnid +'</a></h3>';
		heading.setDefaultValue(headhtml);
		var subheading = confirmForm.addField('custpage_subheading', 'inlinehtml', '');
		var subheadhtml = '';
		if(hashtext != null && hashtext != '') {
			subheadhtml = '<h4>Exchange Hash Number: ' + hashtext + '</h4>';
		} else {
			subheadhtml = '<h4>Exchange Hash Number: Empty</h4>';
		}
		subheading.setDefaultValue(subheadhtml);
		// RESET HASH BUTTON
		var buttonField = confirmForm.addField('custpage_submit', 'inlinehtml', '');
		var buttonhtml = '<br><br><span id="previewbutton"><button id="previewemailbeforereset" type="button" class="hashBtn"> Preview Email </button></span>';
		buttonhtml += '&nbsp;&nbsp;&nbsp;<span id="resetbutton"><button id="resethash" type="button" class="hashBtn"> Reset Hash Only </button></span>';
		buttonField.setDefaultValue(buttonhtml);
		// STATUS AND MESSAGE DIVS - THESE ARE EMPTY UNTIL THERE AJAX UPDATES THEM
		var htmlField_2 = confirmForm.addField('custpage_progress', 'inlinehtml', '');
		var htmlprogress = '<br><span id="progressbar"></span>';
		htmlprogress += '<br><span id="errorMsg" style="color:red"></span>';
		htmlprogress += '<br><div id="statusMsg"></div>';
		htmlprogress += '<br><div id="statusFoot"</div>';
		htmlprogress += '<br><div id="statusEmail"</div>';
		htmlField_2.setDefaultValue(htmlprogress);
		// PREVIEW EMAIL HTML WILL DISPLAY HERE.
		var htmlField_3 = confirmForm.addField('custpage_emailaddr', 'inlinehtml', '');
		var htmlemailaddr = '<div id="emailaddress" style="display:none" ><p>Check this box to override the \'SEND TO\' email address.  <input type="checkbox" name="checkbox2" id="override2" value="override"></p><br>';
		htmlemailaddr += '<span><span style="font-weight:bold;">SEND FROM: </span><input type="text" id="sendfrom" name="sendfrom" value="" placeholder="" style="width:175px" disabled>&nbsp;&nbsp;&nbsp;&nbsp';
		htmlemailaddr += '&nbsp;&nbsp<span style="font-weight:bold;">SEND TO: <input type="text" id="sendto" name="sendto" placeholder="" value="" style="width:175px" disabled></span></span><br><br>';
		htmlemailaddr += '<h3>SUBJECT: <input type="text" id="subject" name="subject" placeholder="" style="width:250px" disabled></h3><br><br></div>';
		htmlField_3.setDefaultValue(htmlemailaddr);
		var htmlField_4 = confirmForm.addField('custpage_preview', 'inlinehtml', '');
		htmlpreview = '<div id="previewEmail"></div>';
		htmlField_4.setDefaultValue(htmlpreview);
		var htmlField_5 = confirmForm.addField('custpage_css', 'inlinehtml', '');
		var bootStrapcss = nlapiLoadFile(1709303);
		var htmlstyle = '<style>' + bootStrapcss + '</style>';
		htmlField_5.setDefaultValue(htmlstyle);
		response.writePage(confirmForm);
		var scriptField = confirmForm.addField('custpage_script', 'inlinehtml', '');
		var htmlscript = '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js">'
//		htmlscript += 'jQuery(document).ready(function(){';
//		htmlscript += 'jQuery("button").click(function(){';
//		htmlscript += 'alert(this.id);'
////				apiCallToRestlet(this.id);
//		htmlscript += '});';
//		htmlscript += '}); </script>';
		htmlscript += '</script>';
		scriptField.setDefaultValue(htmlscript);
	} else if (request.getMethod() == 'POST') {
		var error = nlapiCreateForm('Error', false);
		error.addField('custpage_error', 'text', '', 'Error: POST method in function assignNewHash()');
		nlapiLogExecution('ERROR', 'POST METHOD', 'Error: POST method in function assignNewHash() around line 50');
		response.writePage(form);
	}
}



