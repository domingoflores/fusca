/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jan 2013     Jay
 *
 */

$PPS.debug = true;
$PPS.where = "PP_SL_AccountSetup";
var hideNavBar = false;
var title = "Account Setup";

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var form = nlapiCreateForm(title, hideNavBar);
var bAccount = null;
function PP_SL_AccountSetup(request, response){
	var context = nlapiGetContext();
	try{
		bAccount = request.getParameter("custpage_account_select");
		form.setScript("customscript_pp_cs_jumpmenu");
		createAccountSelect();

		if (bAccount != null){
			var account = nlapiLoadRecord('account', bAccount);
			var acctName = account.getFieldValue('acctname');
			if(context.getPreference('ACCOUNTNUMBERS') == 'T'){
				acctName = account.getFieldValue('acctnumber') + " " + acctName;
			}
		    
	        var url = $PPS.nlapiOutboundSSO();
	        url = url + '&id=' + bAccount + '&name=' + acctName;
	        
	        if(context.getFeature('SUBSIDIARIES')){
	        	var subsidiaryId = nlapiLookupField('account',bAccount,'subsidiary');
	        	url += '&subsidiary_external_id=' + subsidiaryId;
	        }
	        
	        var content = $PPS.iframeContent('pp_iframe', url);
	        
	        var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
	        iFrame.setDefaultValue (content);
	        iFrame.setLayoutType('outsidebelow', 'startcol');
	    }

	    response.writePage( form );
	}
	catch(e){
		response.write('An error occurred');
		nlapiLogExecution('ERROR', 'error', e);
	}
	
}

/**
 * Searches for all Bank Accounts.
 * 
 * @returns {nlobjSearchResult[]} Results obtained from Account Record search or an empty array if
 * 		there are no results.
 * @private
 */

/**
 * Searches for all Bank Accounts.
 * 
 * @returns {nlobjSearchResult[]} Results obtained from Account Record search or an empty array if
 * 		there are no results.
 * @private
 */
function createAccountSelect() {

    //form.addFieldGroup('custpage_firstgroup', 'Bank Account Selection');
	var accountSelect = form.addField('custpage_account_select', 'select', 'Bank Account', null, null);//'custpage_maingroup'
    accountSelect.addSelectOption(-1, '');

    $PPS.buildAccountSelectOptions(accountSelect,bAccount);

    return accountSelect;
}