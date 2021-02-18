/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       13 Apr 2016     petergail
 * 1.00       17 Jan 2018     Scott Streule    Removed the [newCase.setFieldValue('inboundemail', 'support@shareholderrep.com');] command
 * 												per JIRA Ticket NS-1268.
 *
 */

// Helper module to creat a NetSuite Case with the given credentials for Portal
var portalSupportCaseCreator = (function portalSupportCaseCreator() {


	/**
	 * Create a Portal Support Case for initial portal setup
	 * for a particular contact record
	 * @param  {Object} caseObj An object containing the contact credentials
	 * @return {null}         void
	 */
	function setupAccess(caseObj) {

		// Get case fields
		var contact = caseObj.contact;
		var email = caseObj.email;
		var company = caseObj.company;
		var uuid = caseObj.uuid;
		var environment = caseObj.environment;
		var portalURL = null;

		if (environment === 'PRODUCTION') {
			portalURL = 'https://www.srscomport.com/';
		}
		else {
			portalURL = 'https://dev.srscomport.com/';
		}

		var setupURL = portalURL + 'verify/' + uuid;

		try {

			// Create new case
			var newCase = nlapiCreateRecord('supportcase');
			newCase.setFieldValue('customform', '56');
			newCase.setFieldValue('title', 'Sent Setup Email');
			newCase.setFieldValue('status', 2);
			newCase.setFieldValue('custevent_case_department', 12);
			newCase.setFieldValue('custevent_case_queue', 25);
			newCase.setFieldValue('custevent_case_category', 115);
			//newCase.setFieldValue('inboundemail', 'support@shareholderrep.com');
			newCase.setFieldValue('company', company);
			newCase.setFieldValue('contact', contact);
			newCase.setFieldValue('email', email);
			newCase.setFieldValue('custevent_richtextmessagebody', setupURL);

			if (newCase && newCase !== '') {
				nlapiLogExecution('DEBUG', 'Portal Support Case Created', 'Portal Access Setup');
			}

			// Save case record
			var recordID = nlapiSubmitRecord(newCase);
		}
		catch (error) {
			nlapiLogExecution('ERROR', 'Portal Support Case Created', JSON.stringify(error));
			return error;
		}
		return null;
	}

	/**
	 * Create a Portal Support Case for portal password reset
	 * for a particular contact record. Send data to Portal to send
	 * a reset email to the contact
	 * @param  {Object} caseObj An object containing the contact credentials
	 * @return {Bool}         Whether or not the post to Portal was successful
	 */
	function systemResetPassword(caseObj, clientCallback) {

		// Get case fields
		var contact = caseObj.contact;
		var email = caseObj.email;
		var company = caseObj.company;
		var uuid = caseObj.uuid;
		var environment = caseObj.environment;
		var portalURL = null;

		if (environment === 'PRODUCTION') {
			portalURL = 'https://www.srscomport.com/';
		}
		else {
			portalURL = 'https://dev.srscomport.com/';
		}

		var resetURL = portalURL + 'password/email';

		try {

			// Create new case
			var newCase = nlapiCreateRecord('supportcase');
			newCase.setFieldValue('customform', '56');
			newCase.setFieldValue('title', 'Sent Password Reset Email');
			newCase.setFieldValue('status', 2);
			newCase.setFieldValue('custevent_case_department', 12);
			newCase.setFieldValue('custevent_case_queue', 25);
			newCase.setFieldValue('custevent_case_category', 116);
			newCase.setFieldValue('company', company);
			newCase.setFieldValue('contact', contact);
			newCase.setFieldValue('email', email);

			if (newCase && newCase !== '') {
				nlapiLogExecution('DEBUG', 'Portal Support Case Created', 'Portal System Password Reset');
			}
		}
		catch (error) {
			nlapiLogExecution('ERROR', 'Portal Support Case Created', JSON.stringify(error));
			return error;
		}

		// POST to Portal to send a password reset email
		var header = {'content-type': 'application/json'};
		var body = {
			email: email
		};

		var portalResetResponse = nlapiRequestURL(resetURL, JSON.stringify(body), header, function(response) {

			var responseCode = response.getCode();

			if (parseInt(responseCode) === 204) {
				// Save case record
				var recordID = nlapiSubmitRecord(newCase);
			}
			clientCallback(response.getCode());
		});

		return portalResetResponse;
	}

	/**
	 * Generates a new Portal UUID/Hash WITHOUT creating a NetSuite case
	 * and generates a URL for an Operation team member to access a user's Portal account
	 * @param  {Object} requestObj The request object with credentials for generating a uuid/hash
	 * @return {String}           Portal URL for adminstering as a user
	 */
	function getPortalAdminURL_noCase(requestObj) {

		// Get environment
		var environment = requestObj.environment;

		var PORTAL_URL_BASE = null;

		if (environment === 'PRODUCTION') {
			PORTAL_URL_BASE = 'https://www.srscomport.com/';
		}
		else {
			PORTAL_URL_BASE = 'https://dev.srscomport.com/';
		}

		// Generate a new Portal UUID (Hash)
		var uuidHash = getNewUUIDHash(requestObj);

		var portalURL = PORTAL_URL_BASE + 'api/administer/verify/' + uuidHash;

		return portalURL;
	}

	/**
	 * Generates a new Portal UUID/Hash WITHOUT creating a NetSuite case
	 * @param  {Object} requestObj The request object with credentials for generating a uuid/hash
	 * @return {String}           Portal UUID/Hash
	 */
	function generateUUIDHash_noCase(requestObj) {

		// Generate a new Portal UUID (Hash)
		var uuidHash = getNewUUIDHash(requestObj);
		return uuidHash;
	}



/*--------------------------------------
			HELPER FUNCTIONS
--------------------------------------*/
	/**
	 * Generates a new Portal UUID/Hash and assigns it to the Contact Record
	 * @param  {Object} requestObj The request object with credentials for generating a uuid/hash
	 * @return {String}           Portal UUID/Hash
	 */
	function getNewUUIDHash(requestObj) {

		// Get case fields
		var environment = requestObj.environment;
		var contactId = requestObj.contactId;
		var ioSuiteURL = null;


		if (environment === 'PRODUCTION') {
			ioSuiteURL = 'https://iosuite.srsacquiom.com/api/v1/';
		}
		else {
			ioSuiteURL = 'https://dev.iosuite.srsacquiom.com/api/v1/';
		}

		/*
		 * Since an SDA already exists, we need to add the UUID to the contact record
		 * Peter Gail 6/16/16 --> adapted from (code/notes in PortalAccessUtil.js TJ Tyrrell - September 28, 2015)
		 */
		var iosuiteApi = ioSuiteURL + 'uuid',
			uuidContents = nlapiRequestURL(iosuiteApi),
			uuid = uuidContents.getBody();

		nlapiLogExecution('DEBUG', 'PortalSupportCaseCreator.generateUUIDHash_noCase uuid URL', iosuiteApi );
		nlapiLogExecution('DEBUG', 'PortalSupportCaseCreator.generateUUIDHash_noCase uuid', uuid );

		var nsContact = nlapiLoadRecord('contact', contactId);
		nsContact.setFieldValue('custentity_portal_hash', uuid);
		nlapiSubmitRecord(nsContact, true);
		var uuidHash = nsContact.getFieldValue('custentity_portal_hash');

		return uuidHash;
	}



/*++++++++++++++++++++++++++++++++++++++
			EXTERNAL MODULE
++++++++++++++++++++++++++++++++++++++*/
	var module = {
		setupAccess: setupAccess,
		systemResetPassword: systemResetPassword,
		getPortalAdminURL_noCase: getPortalAdminURL_noCase,
		generateUUIDHash_noCase: generateUUIDHash_noCase
	};

	return module;
})();