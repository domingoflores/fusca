/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSContactClient.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2012/02/08
 *
 * Copyright (c) 2012 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Before Load script runs prior to loading of the contact record
 * @param  {String} type The current viewing/editing type of the form
 * @param  {Object} form NetSuite form object
 * @return {null}      void
 */
function beforeLoad(type, form) {

	nlapiLogExecution('DEBUG', 'SRSContactClient.beforeLoad', 'Starting SRSContactClient.beforeLoad...');
	if (type == 'view' || type == 'edit') {
		var targetVals = new Object();
		targetVals["contact"] = nlapiGetRecordId();

		if (nlapiGetFieldValue('company') != null && nlapiGetFieldValue('company') != 0) {
			targetVals["firm"] = nlapiGetFieldValue('company');
		}

		nlapiSetFieldValue('custentity_memo_log_html', getLastMemoFieldValue('contact', nlapiGetRecordId(), targetVals));

		// Include the script with event listensers
		form.setScript('customscript_contactrecord_client');

		createPortalSupportButtons();
	}

	return null;
}

/**
 * This function will create Portal Support Buttons and links on the contact record.
 *  This function populates the inline HTML field custentity_portal_buttons.
 * @return {null} void
 */
function createPortalSupportButtons() {

	// Assign the base Portal url based on the current environment
	var PORTAL_BASE_URL = null;
	var	PORTAL_ENV = null;
	if (nlapiGetContext().getEnvironment() == 'PRODUCTION') {
		PORTAL_ENV = 'PRODUCTION';
		PORTAL_BASE_URL = 'https://www.srscomport.com/';
	}
	else {
		PORTAL_ENV = 'DEV';
		PORTAL_BASE_URL = 'https://local.srscomport.com/';
	}

	// Get contact record values
	var title = "<b>Portal Support</b><br />";
	var email = nlapiGetFieldValue('email');
	var portalHash = nlapiGetFieldValue('custentity_portal_hash');
	var contactID = nlapiGetFieldValue('id');
	var portalUUID = portalHash;
	var company = nlapiGetFieldValue('company');
	var noAccess = "No Portal Access. Please add an email address to create a Portal user account.";

	nlapiLogExecution('DEBUG', 'Portal Support', portalUUID);


	/* ---------------- VIEW PORTAL BUTTON ---------------- */
	var viewPortalButton = '<div><div style="display: none" id="form-vals-view-portal" data-env="' + PORTAL_ENV + '" data-contact="' + contactID + '"></div>';
	viewPortalButton += '<button id="view-portal">View Portal</button></div>';


	/* ---------------- REGISTRATION EMAIL BUTTON ---------------- */
	var regPortalURL = PORTAL_BASE_URL + "send/register/";
	var regButton = "<button onclick=\"window.open('"+ regPortalURL + contactID +"', 'hidden_response');return false;\">Send Registration Email</button><iframe src=\"about:blank\" name=\"hidden_response\" style=\"display:none\"></iframe><br />";


	/* ---------------- SETUP BUTTON ---------------- */
	var setupButton = '<div><div style="display: none" id="form-vals-setup" data-env="' + PORTAL_ENV + '" data-uuid="' + portalUUID + '" data-email="' + email +'" data-contact="' + contactID + '" data-company="' + company + '"></div>';
	setupButton += '<button id="send-setup">Send Setup Email</button></div>';

	// TODO: Remove hidden iframe for form


	/* ---------------- SYSTEM RESET PASSWORD BUTTON ---------------- */
	var resetPwURL = PORTAL_BASE_URL + "send/reset/";
	var resetPwButton = '<div><div style="display: none" id="form-vals-reset" data-env="' + PORTAL_ENV + '" data-uuid="' + portalUUID + '" data-email="' + email +'" data-contact="' + contactID + '" data-company="' + company + '"></div>';
	resetPwButton += '<button id="send-reset">Send System Password Reset Email</button></div>';


	/* ---------------- SYNC PORTAL BUTTON ---------------- */
	var syncURL = PORTAL_BASE_URL + "send/sync/";
	var syncButton = "<button style='display: none' onclick=\"window.open('"+ syncURL + contactID +"', 'hidden_response');return false;\">Sync Virtual Binder</button><iframe src=\"about:blank\" name=\"hidden_response\" style=\"display:none\"></iframe>";


	/* ---------------- GENERATE MAJOR SHAREHOLDER UUID (HASH) BUTTON ---------------- */
	var setupButton = '<div><div style="display: none" id="form-vals-uuidhash" data-env="' + PORTAL_ENV + '" data-contact="' + contactID + '"></div>';
	setupButton += '<button id="generate-uuidhash">Generate Portal Hash</button></div>';


	if (((email) == null) && (((portalHash) == null) || ((portalHash) != null))) {
		var portalButtons = title + '<br />' + noAccess;
		var portalSendEmailButtons = '<br />';
	}
	else if (((email) != null) && ((portalHash) == null)) {
		var portalButtons = title + setupButton;
		var portalSendEmailButtons = '<br />';
	}
	else if (((email) != null) && ((portalHash) != null)) {
		/* __________ Temporarily removed as of 6/22/16 __________ */
		// var portalButtons = title + viewPortalButton + syncButton;
		var portalButtons = title + syncButton;
		var portalSendEmailButtons = resetPwButton + setupButton + viewPortalButton;
		//Hide the send email buttons until the button fields are split into two + resetPwButton + setupButton;
		//Put the registration button back in once the process for registration is finalized  + regButton
	}
	nlapiSetFieldValue('custentity_portal_buttons', portalButtons);
	nlapiSetFieldValue('custentity_portal_send_email_buttons', portalSendEmailButtons);

	return null;
}