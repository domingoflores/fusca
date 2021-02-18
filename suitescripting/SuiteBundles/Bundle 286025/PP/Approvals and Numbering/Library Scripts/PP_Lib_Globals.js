/**
 * This library script defines global variables used by the CAC scripts.
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Sep 2012     Eric Grubaugh
 *
 */

/**
 * {string} The internal ID of the approval status custom record.
 */
var CAC_APPROVAL_STATUS_RECORD_ID = 'customrecord_pp_pmt_approval_status', /* jason changed */
	
/**
 * {string} The internal ID of the approval status custom body field.
 */
	CAC_IS_APPROVED_ID = 'custbody_pp_is_approved',
	
/**
 * {string} The internal ID of the approval status custom body field.
 */
	CAC_APPROVAL_STATUS_FIELD_ID = 'custbody_pp_approval_status', /* jason changed */

/**
 * {string} The internal ID of the custom Next Approver field.
 */
	CAC_NEXT_APPROVER_FIELD_ID = 'custrecord_pp_next_approver_grp', /* jason changed */

/**
 * {string} The internal ID of the custom Previous Approver field.
 */
	CAC_PREV_APPROVER_FIELD_ID = 'custrecord_pp_previous_approver_grp', /* jason changed */
	
/**
 * {string} The internal ID of the custom Rejection Reason field.
 */
	CAC_REJECTION_REASON_FIELD_ID = 'custbody_pp_reason_for_rejection', /* jason changed */
	
/**
 * {string} The internal ID of the custom Comment field.
 */
	CAC_COMMENT_FIELD_ID = 'custbody_pp_comment', /* jason changed */
	
/**
 * {string} The internal ID of the custom CAC ACH field.
 */
	CAC_ISACH_FIELD_ID = 'custbody_pp_ach_is_ach', /* jason changed */
	
/**
 * {string} The internal ID of the CAC Payee Account Type field.
 */
	CAC_PAYEE_ACCTTYPE_FIELD_ID = 'custrecord_pp_ach_deposit_withdrawal',
	
/**
 * {string} The internal ID of the CAC Payee Entity field.
 */
	CAC_PAYEE_ENTITY_FIELD_ID = 'custrecord_pp_entity_name',

/**
 * {string} The internal ID of the CAC Numbering Lock field.
 */
	CAC_LOCKED_FIELD_ID = 'custrecord_cac_accountlock',

/**
 * {string} The custom header name used by the CAC Processor Suitelet to pass the success or failure
 * of the processing request.
 */
	CAC_STATUS_RESPONSE_HEADER = 'Custom-Header-CAC_PROCESSOR_RESULT',

/**
 * {string} The custom header name used by the CAC Processor Suitelet to pass an error message if
 * necessary.
 */
	CAC_ERROR_MESSAGE_RESPONSE_HEADER = 'Custom-Header-CAC_PROCESSOR_ERROR_MSG',

/**
 * {number} The internal ID of the Approval Processor Suitelet script
 */
	CAC_PROCESSOR_SCRIPT_ID = 'customscript_pp_sl_approvalprocessor', /* jason changed */

/**
 * {number} The internal ID of the Approval Processor Suitelet deployment
 */
	CAC_PROCESSOR_DEPLOY_ID = 'customdeploy_pp_sl_approvalprocessor', /* jason changed */


/**
 * {number} The internal ID of the Approval Form Suitelet script
 */
	CAC_FORM_SCRIPT_ID = 'customscript_pp_sl_paymentapprovalform', /* jason changed */

/**
 * {number} The internal ID of the Approval Form Suitelet deployment
 */
	CAC_FORM_DEPLOY_ID = 'customdeploy_pp_sl_paymentapprovalform', /* jason changed */
				
/**
 * {string} The internal ID of the sublist used on the Form Suitelet
 */
	CAC_FORM_SUBLIST_ID = 'custpage_payment_list',

/**
 * {string} The internal ID of the sublist used on the Numbering Suitelet
 */
	CAC_NUMBERING_SUBLIST_ID = 'custpage_numbering_list',

/**
 * {string} The internal ID of the Client Script associated with the Form Suitelet
 */
	CAC_APPROVAL_CLIENT_SCRIPT_ID = 'customscript_pp_cl_paymentapprovalform', // jason changed

/**
 * {string} The internal ID of the Client Script associated with the Numbering Suitelet
 */
	CAC_NUMBERING_CLIENT_SCRIPT_ID = 'customscript_pp_cl_paymentnumberingform', // jason changed

/**
 * {string} The internal ID of the Client Script associated with the Rejection Reason Suitelet.
 */
	CAC_REJECTION_CLIENT_SCRIPT_ID = 'customscript_pp_cl_rejectionreasonform', // jason changed

/**
 * {boolean} Indicates whether the script should be run in development mode. This forces the search
 * to only return the latest two months of unapproved items. Should be set to true in Sandbox and
 * false in Production.
 */
	CAC_DEV_MODE = false,

/**
 * {number} The internal ID of the Deposit account type.
 */
	CAC_DEPOSIT_ID = 1,
	
/**
 * {number} The internal ID of the Withdrawal account type.
 */
	CAC_WITHDRAWAL_ID = 2,
	
/**
 * {string} The script ID of the Piracle ACH subtab used on the custom entry form. This can be found
 * by loading the custom form and inspecting the field group containing the Payee fields. Many of
 * the HTML IDs are of the form custom#_*; replace this value with the custom# prefix.
 */
	/* TODO Is there a way to set the ID of a form subtab in NetSuite? */
	CAC_PIRACLE_SUBTAB_ID = 'custom22',

/**
 * {string} The email address that receives the automatic email when payments are rejected.
 */
	CAC_REJECTION_EMAIL_RECIPIENT = '',

/**
 * {string} The email address that receives notification when payments are
 * returned to Level 1.
 */
	CAC_RETURN_EMAIL_RECIPIENT = '',
	
/**
 * {string} The email address that receives notification when payments are
 * approved to Level 2.
 */
	CAC_APPROVE_EMAIL_RECIPIENT = '',

/**
 * {string} The email address that receives notification when payments are
 * ready for numbering.
 */
	CAC_NUMBERING_EMAIL_RECIPIENT = '',
	
/**
 * {number} The internal ID of the Saved Search for Rejected payments.
 */
	CAC_REJECTION_SAVED_SEARCH_ID = 2405;



/**
 * {string} The NetSuite relative URL of the Processor Suitelet
 */
var CAC_PROCESSOR_URL = "";
try{
	CAC_PROCESSOR_URL = nlapiResolveURL('SUITELET', CAC_PROCESSOR_SCRIPT_ID, CAC_PROCESSOR_DEPLOY_ID);
}catch(e){ nlapiLogExecution('debug', 'PP Lib', e.message); }
/**
* {string} The NetSuite relative URL of the Approval Form Suitelet
*/
var CAC_FORM_URL = "";
try{
	CAC_FORM_URL = nlapiResolveURL('SUITELET', CAC_FORM_SCRIPT_ID, CAC_FORM_DEPLOY_ID);
}catch(e){ nlapiLogExecution('debug', 'PP Lib', e.message); }