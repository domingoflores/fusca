/**
 * @author Jay
 * 12/3/2012 3:43:02 PM
 * @description 
*/

var show = true;
var where = "PP_SL_ACH_File_Gen";
var hideNavBar = false;
var title = "ACH File Generation";

function PP_SL_ACH_File_Gen(request, response) {
    var form = nlapiCreateForm(title, hideNavBar);
    
    form.addPageLink('crosslink', 'ACH File Generation Reset', nlapiResolveURL('SUITELET','customscript_pp_sl_ach_reset','customdeploy_pp_sl_ach_reset'));
    
    var url = $PPS.nlapiOutboundSSO();

    var content = $PPS.iframeContent('pp_iframe', url);
    
    var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
    iFrame.setDefaultValue (content);
    iFrame.setLayoutType('outsidebelow', 'startcol');
    response.writePage( form );
}