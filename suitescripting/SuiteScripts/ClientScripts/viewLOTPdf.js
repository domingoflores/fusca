/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Nov 2014     TJTyrrell
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
		clearinghouseUrl = 'https://clearinghouse.srsacquiom.com/send/request/dealpdf/';
		break;
	case 'SANDBOX772390_SB3':
		// Staging Sandbox
		clearinghouseUrl = 'https://dev.acquiomaccess.x042.com/send/request/dealpdf/';
		break;
	case 'SANDBOX772390':
	default:
		// Development Sandbox
		clearinghouseUrl = 'https://dev.acquiomaccess.x042.com/send/request/dealpdf/';
		break;

}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function createViewLotPdf(type){
   
	var $ = jQuery,
		placement = $('#custentity_acq_deal_zzz_zzz_legal_text').parents('div.uir-field-wrapper').parent().parent(),
		button = $('#tbl__cancel').clone();
	
	button.find('input').attr({
		'onclick':          '',
		'onmousedown':      '',
		'onmouseover':      '',
		'onmouseup':        '',
		'onmouseout':       '',
		'id':               'viewLotPdf',
		'name':             'View LOT PDF'
	}).val('View LOT PDF');
	
	placement.after( "<tr></tr>" );
	placement.next().append( button );
	
}

jQuery(document).on('click','#viewLotPdf',function(){
	
	var $ = jQuery,
		baseUrl = clearinghouseUrl, // Development / Staging
		requestUrl = '',
		urlData = [],
		postData = {},
		detailWindow,
		winParams,
		htmlText,
		response, responseData;
	
	postData.legal_text = $( '#custentity_acq_deal_zzz_zzz_legal_text' ).val();
	
	urlData = [
	             nlapiGetFieldValue( 'custentity_selling_company' ), // 
	             nlapiGetFieldValue( 'custentity29' ),
	             nlapiGetRecordId()
	     ];
	
	requestUrl = baseUrl + encodeURI( urlData.join('/') );

	response = nlapiRequestURL( requestUrl, JSON.stringify(postData), null, null, 'POST' );
	
	data = "data:application/pdf;base64,"+response.body;
	
	windowParams = 'dependent=no,locationbar=yes,scrollbars=yes,menubar=yes,resizable,screenX=50,screenY=50,width=850,height=1050';
	
	window.open( data, 'View PDF', windowParams );

});