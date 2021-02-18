/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Nov 2014     TJTyrrell
 *
 */


var context = nlapiGetContext(),
	env = context.getEnvironment(),
	company = context.getCompany(),
	scriptSrc = [],
	styleSrc = [];

switch( env + company ) {

	case 'PRODUCTION772390':
		// Production
		clearinghouseUrlPdf = 'https://clearinghouse.srsacquiom.com/send/request/updatedPDF/';
		break;
	case 'SANDBOX772390_SB3':
		// Staging Sandbox
		clearinghouseUrlPdf = 'https://www.acquiomaccess.x042.com/send/request/updatedPDF/';
		break;
	case 'SANDBOX772390':
	default:
		// Development Sandbox
		clearinghouseUrlPdf = 'https://dev.acquiomaccess.x042.com/send/request/updatedPDF/';
		break;

}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function viewPdf( $ ){
   
	var recordType = $('h1.uir-record-type').text(),
		html,
		elementCopy,
		placement;
	
	switch( recordType ) {
		case 'Exchange Record':
			
			placement = $( '#tbl_custpageworkflow1765' ).parent();
			elementCopy = $('#tbl__back').parent().clone();
			elementCopy.find('input').attr({
				'onclick':        '',
				'onmousedown':    '',
				'onmouseup':      '',
				'onmouseover':    '',
				'onmouseout':     '',
				'id':             'viewPdf',
				'name':           'View PDF'
			}).val('View PDF');
			
			placement.after( elementCopy );
			
			break;
		case 'Customer':
			
			
			break;
		default:
			break;
	}
	
}

function searchExchangeRecord(exRecID) {
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'is', exRecID));
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_exchangehash'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldemail'));
	return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns );
}

jQuery( '#div_ACTIONMENU_d1 table.ac_table' ).ready( function( $ ){
	viewPdf( $ );
});

jQuery(document).on('click', '#viewPdf', function(){
	
	var baseUrl = clearinghouseUrlPdf,
		requestUrl = '',
		urlParts = [],
		exRecId = nlapiGetRecordId(),
		exRec = nlapiLoadRecord('customrecord_acq_lot', exRecId ),
		windowData,
		windowParams,
		data = '',
		response,
		pdfTypes = ['lot_esign','w9_esign'],
		screenLoc = 50;

	urlParts = [
	        exRecId,                                                        // Deal ID
	        exRec.getFieldValue( 'custpage_hashid' ),                       // Hash 12 ID
            exRec.getFieldValue( 'custpage_hashtext' ),                     // Hash 12 Text
            exRec.getFieldValue( 'custrecord_acq_loth_1_de1_shrhldemail' )  // Shareholder Email
	    ];
	
	
	for( var type in pdfTypes ) {
		requestUrl = baseUrl + pdfTypes[type] + '/' + urlParts.join('/');
		windowParams = 'dependent=no,locationbar=yes,scrollbars=yes,menubar=yes,resizable,screenX=' + screenLoc + ',screenY=' + screenLoc + ',width=850,height=1050';
		window.open( requestUrl, 'view_' + type, windowParams );
		screenLoc += 50;
	}
	
});