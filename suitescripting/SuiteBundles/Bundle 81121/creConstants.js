//------------------------------------------------------------------
// Copyright 2015-2017, All rights reserved, Prolecto Resources, Inc.
//
// Constants are required to support CRUD operations
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

// user configurable parameters 
var TEMPLATE_FOLDER_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_cre_output_folder_id');		// the root template folder dev
var TEMP_FOLDER_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_cre_temp_folder_id');		// the temp folder. ok to delete containing files.
var GLOBAL_JAVASCRIPT_OVERRIDE = nlapiGetContext().getSetting('SCRIPT', 'custscript_cre_global_javascript_ovrride');		//the reference to our global javascript overrides
var GLOBAL_JAVASCRIPT_OVERRIDE_FILE = "creJavaScriptOverrides.js"; //distributed in templates folder



var syntheticCompanyFields = ["logoUrl", "adminEmail", "loginURL"];
var syntheticUserFields = ["email", "altemail", "firstname", "middlename", "lastname", "phone", "isSystem"]; 
//var syntheticPreferenceFields = ["message_signature", "message_nickname", "timezone", "naming_customer", "naming_lead", "issue_multiple_versions"];
var syntheticPreferenceFields = ["message_signature", "message_nickname", "timezone", "naming_customer", "naming_lead"];

//FIELD names and other constants
var CONST_RADIX_BASE10 = 10;
var creJSON = '{"Records":{"CREProfile":{"internalid":"","recordid":"customrecord_pri_cre_profile","recordname":"CREProfile","fields":{"Name":{"value":"","text":"","fieldid":"name","fieldtype":"FreeFormText"},"DataRecordType":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_rectype","fieldtype":"ListRecord","isrelatedrecord":"F","listrecord":"RecordType"},"TemplateEngine":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_tmpt_engine","fieldtype":"ListRecord","isrelatedrecord":"F","listrecord":"CRETemplateEngines"},"RecordName":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_rec_name","fieldtype":"FreeFormText"},"BodyTemplate":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_body_template","fieldtype":"Document"},"JavascriptOverrideFileID":{"value":"","text":"","translate":"F","fieldid":"custrecord_pri_cre_javascript_overrid","fieldtype":"Document"},"Sender":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_sender","fieldtype":"TextArea"},"CC":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_cc","fieldtype":"TextArea"},"BCC":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_bcc","fieldtype":"TextArea"},"ReplyTo":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_reply_to","fieldtype":"TextArea"},"Recipient":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_recipient","fieldtype":"TextArea"},"Subject":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_subject","fieldtype":"TextArea"},"BodyMessageIntroduction":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_introduction","fieldtype":"LongText"},"LocaleId":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_locale_field","fieldtype":"FreeFormText"},"CurrencyId":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_curncy_field","fieldtype":"FreeFormText"},"DefaultLocale":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_dflt_locale","fieldtype":"ListRecord","isrelatedrecord":"F","listrecord":"customrecord_pri_cre_locales_available"},"ShowMissingTranslations":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_show_msng_loc","fieldtype":"checkbox"},"IgnoreBouncedEmails":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_ignore_bounce","fieldtype":"checkbox"},"CustomParam1":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_custom1","fieldtype":"FreeFormText"},"CustomParam2":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_custom2","fieldtype":"FreeFormText"},"FormID":{"value":"","text":"","translate":"F","fieldid":"custrecord_pri_cre_form_id","fieldtype":"TextArea"},"DocumentName":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_doc_name","fieldtype":"TextArea"},"FileAttachment":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_profile_attachment","fieldtype":"TextArea"},"AssociateTransaction":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_assoc_tran","fieldtype":"TextArea"},"AssociateEntity":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_assoc_entity","fieldtype":"TextArea"},"AssociateCustomRecordType":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_assoc_cust_rec_type","fieldtype":"TextArea"},"AssociateCustomRecordId":{"value":"","text":"","translate":"T","fieldid":"custrecord_pri_cre_assoc_cust_rec_id","fieldtype":"TextArea"},"CompletionURL":{"value":"","text":"","translate":"F","fieldid":"custrecord_pri_cre_completion_url_call","fieldtype":"FreeFormText"}}},"CREProfileLine":{"internalid":"","recordid":"customrecord_pri_cre_profile_line","recordname":"CREProfileLine","fields":{"CREProfileID":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_id","fieldtype":"RecordType","isrelatedrecord":"T","listrecord":"CREProfile"},"SavedSearchID":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_line_search","fieldtype":"ListRecord","isrelatedrecord":"F","listrecord":"SavedSearch"},"RecordName":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_line_name","fieldtype":"FreeFormText"},"ParentRecordName":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_p_name","fieldtype":"Document"},"ChildKeyField":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_line_c_key","fieldtype":"FreeFormText"},"ParentKeyField":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_line_p_key","fieldtype":"FreeFormText"},"Link":{"value":"","text":"","fieldid":"custrecord_pri_cre_profile_line_link","fieldtype":"LongText"}}}},"customLists":{"CREProfileType":{"customListOrRecordID":"customlist_pri_cre_profile_type","keys":{"Email":1,"NativeNospecificprocessing":"3","PDFstoredinTemplatefolder":"2","TransactionPDF":"4"}},"CRETemplateEngines":{"customListOrRecordID":"customlist_cre_template_engine","keys":{"FreeMarker":"1","HandleBars":"3","TrimPath":"2"}}},"DefaultFields":{"Created":{"value":"","text":"","fieldid":"created","fieldtype":"Internal"},"LastModified":{"value":"","text":"","fieldid":"lastmodified","fieldtype":"Internal"},"InternalID":{"value":"","text":"","fieldid":"id","fieldtype":"Internal"}}}';


var HTTP_REQUEST_RECORD_INTERNAL_ID = "customrecord_pri_cre_request_http";

var CRE_PROFILE_LINE_ITEM_COLLECTION = "recmachcustrecord_pri_cre_profile_id";

var CRE_PROFILE_USER_EVENT_SCRIPT_ID = "customscript_pri_cre_profile_user_event";
var CRE_PROFILE_USER_EVENT_SCRIPT_DEPLOYMENT = "customdeploy_pri_cre_profile_event";

var CRE_PROFILE_TEST_SUITELET_ID = "customscript_pri_cre_profile_test";
var CRE_PROFILE_COPY_SUITELET_ID = "customscript_cre_copy_profile";

var CRE_PROFILE_EXECUTE_SUITELET_ID = "customscript_pri_cre_profile_execute";

var CRE_SENDEMAIL_NOTIFY_SENDER_ON_BOUNCE = true;
var CRE_SENDEMAIL_INTERNAL_ONLY = false;

var MAX_CHILD_RECORDS_TO_DISPLAY = 3;

var global_alt_row = false;

var GET_REMAINING_USAGE_LESS_THAN_GOVERNANCE_ERROR = 100;
var global_usageStart = nlapiGetContext().getRemainingUsage();

var CRE_STATUS = {
		"COMPLETED" : "COMPLETED",
		"FAILED" : "FAILED"
}