var show = true;
var where = "PP_SL_Activity";
var hideNavBar = false;
var title = "AvidXchange Activity";

function PP_SL_Activity(request, response) {
    var form = nlapiCreateForm(title, hideNavBar);
    
    var url = $PPS.nlapiOutboundSSO();

    var content = $PPS.iframeContent('pp_iframe', url);
    
    var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
    iFrame.setDefaultValue (content);
    iFrame.setLayoutType('outsidebelow', 'startcol');
    response.writePage( form );
}