var show = true;
var where = "PP_SL_Log";
var hideNavBar = false;
var title = "AvidXchange Self-Managed Print Log";

function PP_SL_Log(request, response) {
    var form = nlapiCreateForm(title, hideNavBar);
    /*
     * 2019.Q1.3 Add banner to print log indicating it will be deprecated 
     */
    var htmlBanner = form.addField('custpage_htmlbanner', 'inlinehtml').setLayoutType('outsideabove', 'startrow');
    htmlBanner.setDefaultValue('<p style="clear: both;display: block;"><span id="dyn_help_script:SS1" dynid="SS1"><br></span></p><div class="uir-alert-box info" width="page" role="status"><div class="icon info"><img src="https://system.netsuite.com/images/icons/messagebox/icon_msgbox_info.png" alt=""></div><div class="content"><div class="title">AvidXchange For Netsuite 2.18</div><div class="desc"><p style="font-size:16px">We are deprecating this screen in an upcoming AFN release. Please use <a class="dottedlink" href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_paymentlog','customdeploy_pp_sl_paymentlog')+'">this screen</a> instead.</p></div></div></div></span></p>');

    var url = $PPS.nlapiOutboundSSO();

    var content = $PPS.iframeContent('pp_iframe', url);
    
    var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
    iFrame.setDefaultValue (content);
    iFrame.setLayoutType('outsidebelow', 'startcol');
    response.writePage( form );
}