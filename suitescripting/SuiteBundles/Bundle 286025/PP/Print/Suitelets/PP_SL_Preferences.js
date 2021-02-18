/**
 * @author Jay
 * 11/12/2012 11:00:25 AM
 * @description 
*/
/* CHANGELOG
	Date			Author			Remarks
 	2017.04.28	John Reid		 S15089: Add a preference to show the entity name on the Approvals sublist
    2018.11.14  Serin Hale       S26864: Added a preference to standardize how bills are created for locked accounting periods
    2019.06.14  johnr            S31096: Remove "sandbox refreshed" functionality from bundle
*/

var NSFields = {
    debug: false,
    collection: [],
    form_collection: [],
    base: {// object description
        "internalid": null,
        "id": null,
        "type": null,
        "label": null,
        "src": null,
        "tab": null,
        "value": null,
        "breaktype": null,
        "alias": null,
        "size": {
            "width": null,
            "height": null
        },
        "displayType": null,
        "help": {
            "help": null,
            "inline": null
        },
        "label": null,
        "help": null,
        "layout": {
            "type": null,
            "breaktype": null
        },
        "link": null,
        "mandatory": null,
        "maxlen": null,
        "padding": null
    },
    DisplayType: {
        inline: "inline",
        hidden: "hidden",
        readonly: "readonly",
        entry: "entry",
        disabled: "disabled",
        normal: "normal"// default
    },
    LayoutType: {
        outside: "outside",
        outsidebelow: "outsidebelow",
        outsideabove: "outsideabove",
        startrow: "startrow",
        midrow: "midrow",
        endrow: "endrow",
        norma: "normal"// default
    },
    BreakType: {
        startcol: "startcol",
        startrow: "startrow",
        none: "none"// default
    },
    Types: {
        text: "text",
        radio: "radio",
        label: "label",
        email: "email",
        phone: "phone",
        date: "date",
        datetimetz: "datetimetz",
        currency: "currency",
        float: "float",
        integer: "integer",
        checkbox: "checkbox",
        select: "select",
        url: "url",
        timeofday: "timeofday",
        textarea: "textarea",
        multiselect: "multiselect",
        image: "image",
        inlinehtml: "inlinehtml",
        password: "password",
        help: "help",
        percent: "percent",
        longtext: "longtext",
        richtext: "richtext",
        file: "file"
    },
    add: function (NSFieldObj) {
        this.collection.push(NSFieldObj);
    },
    get: function () {
        return this.collection;
    },
    getNSFormFields: function () {
        return this.form_collection;
    },
    createFields: function (form) {

        var fields = this.collection;

        for (var i = 0; i < fields.length; i++) {
            var val = fields[i];
            try {

                if (val.id == null)
                    continue;

                var formObj = form.addField(val.id, val.type, val.label);

                if (val.value)
                    formObj.setDefaultValue(val.value);

                if (val.breaktype)
                    formObj.setBreakType(val.breaktype);

                if (val.alias)
                    formObj.setAlias(val.alias);

                if (val.size)
                    if (val.size.width != null && val.size.height != null)
                        formObj.setDisplaySize(val.size.width, val.size.height);

                if (val.displayType)
                    formObj.setDisplayType(val.displayType);

                if (val.help)
                    if (val.help.help != null && val.help.inline != null)
                        formObj.setHelpText(val.help.help, val.help.inline);

                if (val.label)
                    formObj.setLabel(val.label);

                if (val.layout)
                    if (val.layout.type != null && val.layout.breaktype != null)
                        formObj.setLayoutType(val.layout.type, val.layout.breaktype);

                if (val.link)
                    formObj.setLinkText(val.link);

                if (val.mandatory)
                    formObj.setMandatory(val.mandatory);

                if (val.maxlen)
                    formObj.setMaxLength(val.maxlen);

                if (val.padding)
                    formObj.setPadding(val.padding);

                this.form_collection.push(formObj);

            } catch (e) {
            }
        }

        return form;
    }
};

var hideNavBar = false;
var title = "AvidXchange Preferences";

$PPS.debug = true;
$PPS.where = "CAC_SL_Preferences";


var html = '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#DAEBD5"><tbody><tr><td><img src="/images/icons/messagebox/msgbox_corner_tl.png" alt="" width="7" height="7" border="0"></td><td width="40"><img src="/images/icons/reporting/x.gif" width="1" height="1" alt="" hspace="20"></td><td width="100%"></td><td><img src="/images/icons/messagebox/msgbox_corner_tr.png" alt="" width="7" height="7" border="0"></td></tr><tr><td></td><td align="left" valign="top"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt="" width="32" height="32" border="0"></td><td width="100%" valign="top"><table cellpadding="0" cellspacing="0" border="0" width="600" style="font-size: 11px"><tbody><tr><td><img src="/images/icons/reporting/x.gif" width="1" height="8" alt=""></td></tr><tr><td style="font-color: #000000"><b>Confirmation:</b> Preferences successfully Saved</td></tr><tr><td><img src="/images/icons/reporting/x.gif" width="1" height="8" alt=""></td></tr></tbody></table></td><td></td></tr><tr><td><img src="/images/icons/messagebox/msgbox_corner_bl.png" alt="" width="7" height="7" border="0"></td><td></td><td width="100%"></td><td><img src="/images/icons/messagebox/msgbox_corner_br.png" alt="" width="7" height="7" border="0"></td></tr></tbody></table><br />';

function PP_SL_Preferences(request, response) {
    $PPS.log("*** Start ***");
    var ctx = nlapiGetContext();
    var form = nlapiCreateForm(title, hideNavBar);
    
    var prefs = nlapiLoadConfiguration('companypreferences');

    if(request.getMethod() == 'POST'){
		
    	var approvals = request.getParameter('custpage_enable_approvals');
    	approvals = approvals || "F";
    	prefs.setFieldValue('custscript_enable_approvals', approvals);
    	
      	// << S15089 >> Add a preference to show the entity name on the Approvals sublist
    	var showName = request.getParameter('custpage_show_name');
    	showName = showName || "F";
    	prefs.setFieldValue('custscript_show_name', showName);
    	
    	var sps = request.getParameter('custpage_enable_sps');
    	sps = sps || "F";
    	prefs.setFieldValue('custscript_enable_sps', sps);
    	
    	prefs.setFieldValue('custscript_pp_enable_wach',request.getParameter('custpage_pp_enable_wach') || "F");
    	
    	prefs.setFieldValue('custscript_pp_credits_after_bills',request.getParameter('custpage_pp_credits_after_bills') || "F");
    	
    	// APN Settings
    	prefs.setFieldValue('custscript_pp_enable_apn_network',request.getParameter('custpage_pp_enable_apn_network') || "F");
    	
      	if(ctx.getFeature('SUBSIDIARIES')){
	    	prefs.setFieldValue('custscript_pp_legal_name_as_payer',request.getParameter('custpage_pp_legal_name_as_payer') || "F");
        }
    	
    	prefs.setFieldValue('custscript_pp_apn_avid_system_user',request.getParameter('custpage_pp_apn_avid_system_user'));
    	
    	
    	// AvidInvoice Settings
    	prefs.setFieldValue('custscript_pp_enable_avid_invoice',request.getParameter('custpage_pp_enable_avid_invoice') || "F");
    	
    	prefs.setFieldValue('custscript_ai_accounting_system_id',request.getParameter('custpage_ai_accounting_system_id'));
    	
    	prefs.setFieldValue('custscript_pp_ai_use_terms',request.getParameter('custpage_pp_ai_use_terms') || "F");
    	
    	prefs.setFieldValue('custscript_pp_ai_use_memo',request.getParameter('custpage_pp_ai_use_memo') || "F");

        prefs.setFieldValue('custscript_pp_disable_po_match', request.getParameter('custpage_pp_disable_po_match') || "F");

        prefs.setFieldValue('custscript_pp_enable_dist_line_map', request.getParameter('custpage_pp_enable_dist_line_map') || "F");

        prefs.setFieldValue('custscript_pp_dist_line_map_select', request.getParameter('custpage_pp_dist_line_map_select') || 1); //default to 'expense'

        prefs.setFieldValue('custscript_pp_enable_hdr_fld_map', request.getParameter('custpage_pp_enable_hdr_fld_map') || "F");

        prefs.setFieldValue('custscript_pp_enable_header_to_line_map', request.getParameter('custpage_pp_enable_header_line_map') || "F");

        prefs.setFieldValue('custscript_pp_null_value', request.getParameter('custpage_pp_null_value') || "");

        prefs.setFieldValue('custscript_pp_locked_periods', request.getParameter('custpage_pp_locked_periods') || "F");
    	
    	
    	// PayPal Settings
    	prefs.setFieldValue('custscript_pp_enable_paypal_mp',request.getParameter('custpage_pp_enable_paypal_mp'));
    	
    	prefs.setFieldValue('custscript_pp_paypal_note',request.getParameter('custpage_pp_paypal_note'));
    	
    	prefs.setFieldValue('custscript_pp_paypal_auto_fee',request.getParameter('custpage_pp_paypal_auto_fee') || "F");

    	// ACH Invite Group
    	prefs.setFieldValue('custscript_pp_ach_inv_employee_send_from',request.getParameter('custpage_pp_ach_inv_employee_send_from'));
    
    	prefs.setFieldValue('custscript_pp_ach_inv_logo',request.getParameter('custpage_pp_ach_inv_logo'));
    	
    	prefs.setFieldValue('custscript_pp_ach_inv_redeem_form_msg',request.getParameter('custpage_pp_ach_inv_redeem_form_msg'));
    	
    	prefs.setFieldValue('custscript_pp_ach_inv_prenote',request.getParameter('custpage_pp_ach_inv_prenote') || "F");
    	
    	/* S31096: Remove "sandbox refreshed" functionality from bundle
    	// Sandbox group
    	if (ctx.getEnvironment().toUpperCase() == 'SANDBOX') {
    		prefs.setFieldValue('custscript_pp_sandbox_refresh',request.getParameter('custpage_pp_sandbox_refresh') || "F");
    	}   	    	
    	*/
    	nlapiSubmitConfiguration(prefs);
    	
        var group1 = form.addFieldGroup('custpage_maingroup1', ' ');
        group1.setSingleColumn(false);
    	form.addField('custpage_confirmation', 'inlinehtml', null, null, 'custpage_maingroup1').setDefaultValue(html);
    }
    
    var group2 = form.addFieldGroup('custpage_maingroup2', ' ');
    group2.setSingleColumn(true);

	form.addField('custpage_enable_approvals', 'checkbox', 'Enable AvidXchange Approvals', null, 'custpage_maingroup2').setDefaultValue(prefs.getFieldValue('custscript_enable_approvals'));
	
  	// << S15089 >> Add a preference to show the entity name on the Approvals sublist
    var showNameField = form.addField('custpage_show_name', 'checkbox', 'Show ID and Name on the Payment Approvals Form', null, 'custpage_maingroup2');
  	showNameField.setDefaultValue(prefs.getFieldValue('custscript_show_name'));
  	showNameField.setHelpText('This option is only valid when AvidXchange Approvals are enabled. When this option is checked, the Customer/Vendor Name column on the AvidXchange Payment Approval Form will be separated into sortable ID and Name columns. The Name column will contain the name of the payee, similar to the name that would appear on a check for the payment. This option is ignored when AvidXchange Approvals are not enabled.');
	
	var insertCreditsField = form.addField('custpage_pp_credits_after_bills', 'checkbox', 'Insert Bill Credits After Associated Bills', null, 'custpage_maingroup2');
	insertCreditsField.setDefaultValue(prefs.getFieldValue('custscript_pp_credits_after_bills'));
	insertCreditsField.setHelpText('If this option is checked, bill credits will be inserted after the bills they are applied to. If this option is not checked, all bill credits will show up below all bills.');
	
	var spsField = form.addField('custpage_enable_sps', 'checkbox', 'Enable the Secure Printing Service', null, 'custpage_maingroup2');
	spsField.setDefaultValue(prefs.getFieldValue('custscript_enable_sps'));
	spsField.setHelpText('<p>With the Secure Printing Service, you can safely print checks and payroll documents for a fraction of what it would cost to do in-house. We will:</p> <ul><li>Print your checks and mail payments to vendors</li> <li>Include Positive Pay processing for checks printed through SPS</li> <li>Print and mail your 1099 and W-2 documentation for internal payroll needs</li> <li>Include any additional printed material in mailed envelopes</li> <li>Mail printed stubs for Direct Deposit transactions</li> <li>Email confirmations to recipients of ACH transactions</li></ul>');
    
	var spsJs = '<script type="text/javascript"> jQuery(function(){ var spsNSField = nlapiGetField("custpage_enable_sps"); jQuery("#custpage_enable_sps_fs").click(function(){ setTimeout(function(){ if(nlapiGetFieldValue("custpage_enable_sps") == "T"){ alert("By selecting this box and using the Piracle Secure Printing Service, you acknowledge and understand that you will be charged a fee for the items processed by Piracle.  If you are unsure about the use of this feature please contact your Piracle sales rep."); } },200); }); }); </script>';
	form.addField('custpage_enable_sps_js','inlinehtml').setDefaultValue(spsJs);
	
	var wachField = form.addField('custpage_pp_enable_wach', 'checkbox', 'Enable ACH Withdrawals', null, 'custpage_maingroup2');
	wachField.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_wach'));
	wachField.setHelpText('This option turns on accounts recievable ACH for customer payments. Right now this feature is limited to internal operations such as recuring revenue module and accepting customer payments.');
	
	// APN Group
	var apnGroup = form.addFieldGroup('custpage_apn_group','AvidPay Network Settings');
	
	var apnNetworkEnabledField = form.addField('custpage_pp_enable_apn_network', 'checkbox', 'Enable AvidPay Network', null, 'custpage_apn_group');
	apnNetworkEnabledField.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_apn_network'));
	apnNetworkEnabledField.setHelpText('Check this option to enable AvidPay Network payments');
	
    if(ctx.getFeature('SUBSIDIARIES')){
        var apnLegalNameAsPayerField = form.addField('custpage_pp_legal_name_as_payer', 'checkbox', 'Use Subsidiary Legal Name as APN Payer', null, 'custpage_apn_group');
        apnLegalNameAsPayerField.setDefaultValue(prefs.getFieldValue('custscript_pp_legal_name_as_payer'));
        apnLegalNameAsPayerField.setHelpText('For OneWorld accounts the Subsidiary name is the payer name printed on AvidPay Network checks. Check this option to use the Subsidiary Legal Name as the Payer, instead.');
    }
	
	var avidSystemUserField = form.addField('custpage_pp_apn_avid_system_user','select','AvidSuite System User',null, 'custpage_apn_group');
	var aucSrs = apnUserCredentialSearch();
	if(aucSrs){
		avidSystemUserField.addSelectOption('','');
		for(var i = 0; i < aucSrs.length; i++){
			avidSystemUserField.addSelectOption(aucSrs[i].getValue('custrecord_pp_avc_employee'),aucSrs[i].getText('custrecord_pp_avc_employee'));
		}
	}
	avidSystemUserField.setDefaultValue(prefs.getFieldValue('custscript_pp_apn_avid_system_user'));
	avidSystemUserField.setHelpText('The AvidSuite System User credentials are used to perform operations from scheduled scrips such as syncing AvidPay batch status.');
	
	// Avid Invoice Group
	var aiGroup = form.addFieldGroup('custpage_ai_group','AvidInvoice Settings');
	
	var enableAvidInvoiceField = form.addField('custpage_pp_enable_avid_invoice', 'checkbox', 'Enable AvidInvoice', null, 'custpage_ai_group');
	enableAvidInvoiceField.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_avid_invoice'));
	
	var aiAccountingApplicationField = form.addField('custpage_ai_accounting_system_id', 'text', 'Accounting System Name', null, 'custpage_ai_group');
	aiAccountingApplicationField.setDefaultValue(prefs.getFieldValue('custscript_ai_accounting_system_id'));
	
	var aiUseTermsField = form.addField('custpage_pp_ai_use_terms', 'checkbox', 'Use Terms From AvidInvoice', null, 'custpage_ai_group');
	aiUseTermsField.setDefaultValue(prefs.getFieldValue('custscript_pp_ai_use_terms'));
	aiUseTermsField.setHelpText('When this option is checked the terms set on the Avid Invoice will be set on the bill by default instead of the terms set on the vendor.');
	
	var aiUseMemoField = form.addField('custpage_pp_ai_use_memo', 'checkbox', 'Use AvidInvoice Memo', null, 'custpage_ai_group');
    aiUseMemoField.setDefaultValue(prefs.getFieldValue('custscript_pp_ai_use_memo'));
	aiUseMemoField.setHelpText('When this option is checked the bill memo will be populated with the AvidInvoice memo.');

    var aiDisablePOMatch = form.addField('custpage_pp_disable_po_match', 'checkbox', 'Disable PO Matching', null, 'custpage_ai_group');
    aiDisablePOMatch.setDefaultValue(prefs.getFieldValue('custscript_pp_disable_po_match'));
    aiDisablePOMatch.setHelpText('When this option is checked Purchase Order matching will be disabled when importing invoices from AvidInvoice.');

    var aiMapDistLineField = form.addField('custpage_pp_enable_dist_line_map', 'checkbox', 'Enable Distribution Line Mapping', null, 'custpage_ai_group');
    aiMapDistLineField.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_dist_line_map'));
    aiMapDistLineField.setHelpText('When this option is selected the distribution lines in AvidInvoice will be mapped into either the Expense or Item lines in NetSuite. Enabling this feature requires the creation of Avid Field Mapping records.');

    var aiMapDistLineFieldType = form.addField('custpage_pp_dist_line_map_select', 'select', 'Select Distribution Line Mapping Type', null, 'custpage_ai_group');

    aiMapDistLineFieldType.addSelectOption(1, 'Expense');
    aiMapDistLineFieldType.addSelectOption(2, 'Item');
    aiMapDistLineFieldType.setDefaultValue(prefs.getFieldValue('custscript_pp_dist_line_map_select'));
    aiMapDistLineFieldType.setHelpText('When this option is selected the distribution lines in AvidInvoice will be mapped into either the Expense or Item lines in NetSuite. Enabling this feature requires the creation of Avid Field Mapping records.');

    // Enable AvidInvoice Header to Bill Header/Custom Field Mapping
    var aiHeaderFieldMap = form.addField('custpage_pp_enable_hdr_fld_map', 'checkbox', 'Enable AvidInvoice Header to Bill Header/Custom Field Mapping', null, 'custpage_ai_group');
    aiHeaderFieldMap.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_hdr_fld_map'));
    aiHeaderFieldMap.setHelpText('When this option is checked the header fields in AvidInvoice will be mapped into NetSuite Bill mainline/header fields. Enabling this feature requires the creation of Avid Field Mapping records.');


    var aiMapHeaderLineField = form.addField('custpage_pp_enable_header_line_map', 'checkbox', 'Enable Header to Bill Distribution Line Mapping', null, 'custpage_ai_group');
    aiMapHeaderLineField.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_header_to_line_map'));
    aiMapHeaderLineField.setHelpText('When this option is checked header fields from AvidInvoice will be mapped onto distribution lines in NetSuite. Enabling this feature requires the creation of Avid Field Mapping records.');
    

    var aiNullValue = form.addField('custpage_pp_null_value', 'text', 'AvidInvoice Null Value', null, 'custpage_ai_group');
    aiNullValue.setDefaultValue(prefs.getFieldValue('custscript_pp_null_value'));
    aiNullValue.setHelpText('The value entered here, when coming from an AvidInvoice field, will be set as a \'null\' (blank) value in NetSuite. This is best used in custom Distribution Line fields in AvidInvoice, when you do not always wish to set a value for that field in NetSuite. Suggested values are something like \'null\' or \'No Value\'. Be sure that capitalization matches exactly with the value in Avid Invoice.');
    

    var aiLockedPeriods = form.addField('custpage_pp_locked_periods', 'checkbox', 'Allow Posting Bills to Locked Periods', null, 'custpage_ai_group');
    aiLockedPeriods.setDefaultValue(prefs.getFieldValue('custscript_pp_locked_periods'));
    aiLockedPeriods.setHelpText('Check this box if you want the scheduled script to create multiple bills to post bills to locked periods. Unchecking this box will move all bills to the next most recent unlocked period.');
	
	// PayPal Group
	var paypalMassPaymentsGroup = form.addFieldGroup('custpage_paypal_mp_group','PayPal Mass Payments');
	
	var paypalEnabledField = form.addField('custpage_pp_enable_paypal_mp', 'checkbox', 'Enable PayPal Mass Payments', null, 'custpage_paypal_mp_group');
	paypalEnabledField.setDefaultValue(prefs.getFieldValue('custscript_pp_enable_paypal_mp'));
	paypalEnabledField.setHelpText('Check this option to enable PayPal Mass Payments');
	
	var paypalCustomNoteField = form.addField('custpage_pp_paypal_note', 'text', 'PayPal Custom Note Formula', null, 'custpage_paypal_mp_group');
	paypalCustomNoteField.setDefaultValue(prefs.getFieldValue('custscript_pp_paypal_note'));
	paypalCustomNoteField.setHelpText('This preference is set by default to include the NetSuite Payment Memo field.  You can change what field is included in the custom note to your recipient by changing the field name inside the brackets {}, or set the entire field to blank to exclude custom notes.');
	
	var paypalAutoFeeField = form.addField('custpage_pp_paypal_auto_fee', 'checkbox', 'Automatically Post PayPal Fees', null, 'custpage_paypal_mp_group');
	paypalAutoFeeField.setDefaultValue(prefs.getFieldValue('custscript_pp_paypal_auto_fee'));
	paypalAutoFeeField.setHelpText('When this option is checked the PayPal mass payment fee will automatically be created as a check and posted to the NetSuite PayPal account. The fee will have a corresponding expense line item applied to the expense account that was set on the PayPal bank account.');
	
	// ACH Invite Group
	var achInviteGroup = form.addFieldGroup('custpage_achinvgroup','ACH Invite Settings');
	
	//custscript_pp_ach_inv_employee_send_from
	var achInvSendfromField = form.addField('custpage_pp_ach_inv_employee_send_from','select','Email Send From','employee','custpage_achinvgroup');
	achInvSendfromField.setDefaultValue(prefs.getFieldValue('custscript_pp_ach_inv_employee_send_from'));
	achInvSendfromField.setHelpText('The employee record to send ACH invite emails from.');
	
	var achInvLogoField = form.addField('custpage_pp_ach_inv_logo','text','Redeem Form Logo',null,'custpage_achinvgroup'); 
	achInvLogoField.setDefaultValue(prefs.getFieldValue('custscript_pp_ach_inv_logo'));
	achInvLogoField.setHelpText('The logo to display on the ACH invite redeem form. Can either be the id of a file uploaded to the NetSuite file cabinet, or the URL of an external hosted image.<br/><br/>Note: If using an image on NetSuite make sure the image\'s "Available Without Login" option is checked.');
	
	var achInvRedeemFormMessageField = form.addField('custpage_pp_ach_inv_redeem_form_msg','textarea','Redeem Form Message',null,'custpage_achinvgroup'); 
	achInvRedeemFormMessageField.setDefaultValue(prefs.getFieldValue('custscript_pp_ach_inv_redeem_form_msg'));
	achInvRedeemFormMessageField.setHelpText('Customize the message that will be displayed at the bottom of the form where the user will enter in their ACH information.');
	  
	var achInvPrenoteField = form.addField('custpage_pp_ach_inv_prenote','checkbox','Use Prenote Transaction Codes',null,'custpage_achinvgroup'); 
	achInvPrenoteField.setDefaultValue(prefs.getFieldValue('custscript_pp_ach_inv_prenote'));
	achInvPrenoteField.setHelpText('Check this box to use prenote transaction codes instead of live transaction codes when an ACH Invite is submitted. When this preference is checked, the ACH account\'s transaction code will be set to the corresponding prenote version. For example if the user chooses "Checking" the transaction code will be set to "Prenote Checking."');

	/* S31096: Remove "sandbox refreshed" functionality from bundle
	// Sandbox Group
	if (ctx.getEnvironment().toUpperCase() == 'SANDBOX') {
		var sandboxGroup = form.addFieldGroup('custpage_sandboxgroup','Sandbox Settings');
		
		var sandboxRefreshField = form.addField('custpage_pp_sandbox_refresh','checkbox','Sandbox Refreshed After January 11, 2018',null,'custpage_sandboxgroup'); 
		sandboxRefreshField.setDefaultValue(prefs.getFieldValue('custscript_pp_sandbox_refresh'));
		sandboxRefreshField.setHelpText('Sandboxes refreshed after January 11, 2018 will no longer be on the sandbox domain and will instead be on the NetSuite production domain');
	}
	*/
	
	/*var achInvRedeemFormTemplateFilename = form.addField('custpage_pp_ach_inv_redeem_form_tpl','text','Redeem Form Template Filename',null,'custpage_achinvgroup'); 
	achInvLogoField.setDefaultValue(prefs.getFieldValue('custscript_pp_ach_inv_redeem_form_tpl'));
	achInvLogoField.setHelpText('The filename of the redeem form template.');*/
	
	
	/*var achEmailTemplate = form.addField('custpage_pp_ach_inv_email_template', 'select', 'Email Template', 'emailtemplate','custpage_achinvgroup');
	form.setDefaultValue(prefs.getFieldValue('custscript_pp_ach_inv_email_template'));*/
	
	
	form.addSubmitButton();
    
    response.writePage(form);

    //response.write('{"json":1}');
    //response.setHeader('Content-Type', 'application/json');
    //response.setContentType('PDF', 'file.pdf', 'attachment');

    $PPS.log("*** End ***");
}


function apnUserCredentialSearch(){
	var columns = [];
	var filters = [];
	
	columns.push(new nlobjSearchColumn('custrecord_pp_avc_employee'));
	
	return nlapiSearchRecord('customrecord_pp_av_credentials',null,null,columns);
}

