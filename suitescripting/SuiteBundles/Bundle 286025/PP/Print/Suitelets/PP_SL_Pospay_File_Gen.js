/**
 * @author Jay
 * 12/3/2012 3:49:36 PM
 * @description 
*/

var show = true;
var where = "PP_SL_Pospay_File_Gen";
var hideNavBar = false;
var title = "Pospay File Generation";

function PP_SL_Pospay_File_Gen(request, response) {
    var form = nlapiCreateForm(title, hideNavBar);

    var url = $PPS.nlapiOutboundSSO();
    
    var content = $PPS.iframeContent('pp_iframe', url);
    var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
    iFrame.setDefaultValue (content);
    iFrame.setLayoutType('outsidebelow', 'startcol');
    response.writePage( form );
}
