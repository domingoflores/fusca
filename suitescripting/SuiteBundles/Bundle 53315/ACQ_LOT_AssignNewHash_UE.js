/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.01       08 June 2014    smccurry			Install on production
 * 1.02       12 June 2014    smccurry			Updated button name to 'Reset Hash Page'
 * 1.03       15 Dec  2016    Ken Crossman      Added button for Returned Payment processing
 * 1.04		  01 June 2017	  Scott Streule		Added an if statement to check to see the acquiom status of the record
 * 												If the status is 5 or 8, DO NOT add the Hash buttons
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
		scriptSrc = ['/core/media/media.nl?id=2692178&c=772390&h=79babc7a7a58ebeb7cbf&_xt=.js']; // jquery-ui.min.js
		styleSrc = [
		        '/core/media/media.nl?id=2692180&c=772390&h=13060850792e1cf9f14e&_xt=.css', // jquery-ui.min.css
		        '/core/media/media.nl?id=2692182&c=772390&h=5dee5e883c540f9d1d80&_xt=.css'  // jquery-ui.theme.min.css
		   ];
		break;
	case 'SANDBOX772390_SB3':
		// Staging Sandbox
		scriptSrc = ['/core/media/media.nl?id=2692178&c=772390&h=79babc7a7a58ebeb7cbf&_xt=.js']; // jquery-ui.min.js
		styleSrc = [
		        '/core/media/media.nl?id=2692180&c=772390&h=13060850792e1cf9f14e&_xt=.css', // jquery-ui.min.css
		        '/core/media/media.nl?id=2692182&c=772390&h=5dee5e883c540f9d1d80&_xt=.css'  // jquery-ui.theme.min.css
		   ];
		break;
	case 'SANDBOX772390':
	default:
		// Development Sandbox
		scriptSrc = ['/core/media/media.nl?id=1940106&c=772390&h=6eba35dee99f220fab14&_xt=.js']; // jquery-ui.min.js
		styleSrc = [
		      '/core/media/media.nl?id=1940108&c=772390&h=786a417ddd9c2944ab9e&_xt=.css', // jquery-ui.min.css
		      '/core/media/media.nl?id=1940110&c=772390&h=f809290295116a24ca04&_xt=.css'  // jquery-ui.theme.min.css
		   ];
		break;

}
*/

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function assignNewHashButton(type, form, request) {
	var currentContext = nlapiGetContext();
	if((type == 'view' || type == 'edit') && currentContext.getExecutionContext() != 'csvimport') {
		
		var rec = nlapiGetNewRecord();
		// Create a custom hidden field with the hash id because nlapiGetFieldValue is not working on fields on the exchange record in the next client side script in ACQ_LOT_AssignNewHash_Suitelet.js
		var hashid = rec.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash');
		var tempField1 = form.addField('custpage_hashid', 'text').setDisplayType('hidden');
		tempField1.setDefaultValue(hashid);
		
		var hashtext = rec.getFieldText('custrecord_acq_loth_zzz_zzz_exchangehash');
		var tempField2 = form.addField('custpage_hashtext', 'text').setDisplayType('hidden');
		tempField2.setDefaultValue(hashtext);

		//Get the Value of the Acquiom Status field to determine if Hash buttons should be on the record
		var acqStatus = rec.getFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus');
		
//		var contact = rec.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');
//		var tempField3 = form.addField('custpage_contact', 'text').setDisplayType('hidden');
//		tempField3.setDefaultValue(contact);
//		
//		var contactemail = rec.getFieldText('custrecord_acq_loth_1_src_shrhldemail');
//		var tempField4 = form.addField('custpage_contactemail', 'text').setDisplayType('hidden');
//		tempField4.setDefaultValue(contactemail);
//		
//		var dealemail = rec.getFieldText('custrecord_qx_acq_loth_dealemail');
//		var tempField5 = form.addField('custpage_dealemail', 'text').setDisplayType('hidden');
//		tempField5.setDefaultValue(dealemail);
		
		form.setScript('customscript_acq_lot_exch_rec_client');
		form.setScript('customscript_acq_lot_ajax_cs');
		//Check to see the status and display the Hash buttons if the Acquiom Status is not 5 or 8
		if(acqStatus != 5 && acqStatus != 8 && acqStatus != 7 && acqStatus != 15 && acqStatus != 16){
			nlapiLogExecution('DEBUG', 'Add The Buttons', 'acqStatus is ' + acqStatus);
			form.addButton('custpage_assignhash_button', 'Reset Hash Page', 'createPageEmailHashReset();');
			form.addButton('custpage_assignhash_button', 'Unlock Hash', 'unlockHash();');
		}
		//form.addButton('custpage_returned_payment', 'Returned Payment', 'returnedPayment();');
		
/*
		// Add the jQuery UI library
		var html = '';
		
		for( var script in scriptSrc ) {
			html += '<script type="text/javascript" src="' + scriptSrc[script] + '"></script>';
		}
		for( var style in styleSrc ) {
			html += '<link rel="stylesheet" type="text/css" href="' + styleSrc[style] + '" />';
		}
		
		// Modal HTML
		html += '<div id="confirmation" title="{title}"><p><span class="ui-icon ui-icon-alert"></span><span class="message"></span></p></div>';
		
		var libraries = form.addField('custpage_libraries', 'inlinehtml', '', null, null);
		
		libraries.setDefaultValue(html);
*/

	}
}
