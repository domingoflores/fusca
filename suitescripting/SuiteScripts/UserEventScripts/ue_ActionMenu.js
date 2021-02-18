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
	scriptSrc = '';

switch( env ) {

	case 'PRODUCTION':
		scriptSrc = '/core/media/media.nl?id=2691878&c=772390&h=30131020f7dff3df3d51&id=2691878&_xt=.js';
		break;
	case 'SANDBOX':
		if( company == 772390 ) {
			// Development Sandbox
			scriptSrc = '/core/media/media.nl?id=1939004&c=772390&h=cda5be19cb6b4533b232&mv=i2bcl1xc&_xt=.js';
		} else if( company == '772390_SB3' ) {
			// Staging Sandbox
			scriptSrc = '/core/media/media.nl?id=2518327&c=772390_SB3&h=f01cc98112ac04f9f078&mv=i2noyb5s&_xt=.js&whence=';
		}
		break;
	default:
		scriptSrc = '/core/media/media.nl?id=2518327&c=772390_SB3&h=f01cc98112ac04f9f078&mv=i2noyb5s&_xt=.js&whence=';
		break;

}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
 
	// push a dynamic field into the environment
	var html = '<script type="text/javascript" src="' + scriptSrc + '"></script>',
		field0 = form.addField('custpage_alertmode', 'inlinehtml', '',null,null);
	
	field0.setDefaultValue(html);
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
 
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
  
}
