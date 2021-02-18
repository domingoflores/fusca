/**
 * Iframe to manage subsidiaries and users in AFN self managed
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Aug 2016     Max
 *
 */


/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function suitelet(request, response){
	var hideNavBar = false;
	var title = "Subsidiary/User Administration";
	var form = nlapiCreateForm(title, hideNavBar);
	form.addPageLink('crosslink', 'Auto Subsidiary/Account Sync', nlapiResolveURL('SUITELET','customscript_pp_sl_subsidiary_acct_sync','customdeploy_pp_sl_subsidiary_acct_sync'));
	
    
    var url = $PPS.nlapiOutboundSSO();

    var content = $PPS.iframeContent('pp_iframe', url);
    
    var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
    iFrame.setDefaultValue (content);
    iFrame.setLayoutType('outsidebelow', 'startcol');
    response.writePage( form );
}