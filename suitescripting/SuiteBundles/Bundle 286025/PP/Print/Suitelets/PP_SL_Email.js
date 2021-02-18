/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jan 2013     Jay
 *
 */
var hideNavBar = false;
var title = "Email";

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var form = nlapiCreateForm(title, hideNavBar);
function PP_SL_Email(request, response){
    

    response.writePage( form );
    var url = $PPS.nlapiOutboundSSO();

    var content = $PPS.iframeContent('pp_iframe', url);
    
    var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
    iFrame.setDefaultValue (content);
    iFrame.setLayoutType('outsidebelow', 'startcol');
}
