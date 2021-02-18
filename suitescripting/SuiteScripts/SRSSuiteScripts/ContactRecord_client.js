/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       28 Mar 2016     petergail
 *
 */
jQuery(function() {

	// Send Account Setup Email
    jQuery('#send-setup').on('click', function(e) {
		e.preventDefault();
		if (!confirm('Are you sure you want to send a ComPort Portal Setup email?')) {
		    return false;
		}
		else {
		    return createPortalSetupCase(jQuery);
		}
    });

    // Send Password Reset Email
    jQuery('#send-reset').on('click', function(e) {
		e.preventDefault();
		if (!confirm('Are you sure you want to send a ComPort Portal Password Reset email?')) {
		    return false;
		}
		else {
		    return createSystemPwdResetCase(jQuery);
		}
    });

    // Take the operations member to Portal to administer this contact
    jQuery('#view-portal').on('click', function(e) {
    	e.preventDefault();
    	if(!confirm("Are you sure you want to log-in to Comport Portal as this user?")) {
    		return false;
    	}
    	else {
    		return administerAsPortalUser(jQuery);
    	}
    });

    // Generate a new Portal UUID (Hash) without creating a case
    jQuery('#generate-uuidhash').on('click', function(e) {
    	e.preventDefault();
    	if(!confirm("Are you sure you want to generate a new Comport Portal UUID/Hash for this contact?")) {
    		return false;
    	}
    	else {
    		return generatePortalUUIDHash(jQuery);
    	}
    });
});

/**
 * Create a new Portal Support Case to trigger the
 * workflow for account setup
 * @param  {Object} $  jQuery
 * @return {null}          void
 */
function createPortalSetupCase($) {

	// Extract credentials
    var formVals = $('#form-vals-setup');

	// Create case fields object
	var caseObj = {

		contact: formVals.attr('data-contact'),
		email: formVals.attr('data-email'),
		company: formVals.attr('data-company'),
		uuid: formVals.attr('data-uuid'),
		environment: formVals.attr('data-env')
	};

	// Create new account setup case
	portalSupportCaseCreator.setupAccess(caseObj);
	alert('An email has been sent to ' + caseObj.email);

	return false;
}

/**
 * Create a new Portal Support Case to trigger the
 * workflow for system password reset
 * @param  {Object} $  jQuery
 * @return {Bool}          False
 */
function createSystemPwdResetCase($) {

	// Extract credentials
    var formVals = $('#form-vals-reset');

	// Create case fields object
	var caseObj = {

		contact: formVals.attr('data-contact'),
		email: formVals.attr('data-email'),
		company: formVals.attr('data-company'),
		uuid: formVals.attr('data-uuid'),
		environment: formVals.attr('data-env')
	};

	// Create new system password reset case
	alert('Please wait for an confirmation alert...');
	var portalResetPassword = portalSupportCaseCreator.systemResetPassword(caseObj, function(response) {
		response = parseInt(response);

		if (response === 204) {
			nlapiLogExecution('DEBUG', 'PORTAL SYSTEM PASSWORD RESET RESPONSE', JSON.stringify(response));
			alert('An email has been sent to ' + caseObj.email);
		}
		else {
			nlapiLogExecution('ERROR', 'PORTAL SYSTEM PASSWORD RESET RESPONSE', JSON.stringify(response));
			alert('ERROR: Something went wrong trying to send an email to ' + caseObj.email);
		}
		return false;
	});
	return portalResetPassword;
}


/**
 * Request to administer Portal as the contact user
 * @param  {Object} $ jQuery
 * @return {null}   void
 */
function administerAsPortalUser($) {

	// Extract credentials
    var formVals = $('#form-vals-view-portal');
	var contactId = formVals.attr('data-contact');
	var environment = formVals.attr('data-env');

	// Create case fields object
	var requestObj = {
		contactId: contactId,
		environment: environment
	};

	if (!contactId || contactId.length == 0) {
		alert('ERROR: Something went wrong retrieving this contact\'s Portal UUID/Hash');
	}
	else {
		var portalAdminURL = portalSupportCaseCreator.getPortalAdminURL_noCase(requestObj);

		// Open a new tab to Portal
		window.open(portalAdminURL, '_blank');
	}
}


/**
 * Request a new Portal UUID/Hash for the contact
 * @param  {Object} $ jQuery
 * @return {null}   void
 */
function generatePortalUUIDHash($) {

	// Extract credentials
	var formVals = $('#form-vals-uuidhash');
	var contactId = formVals.attr('data-contact');
	var environment = formVals.attr('data-env');

	// Create case fields object
	var requestObj = {
		contactId: contactId,
		environment: environment
	};

	if (!contactId || contactId.length == 0) {
		alert('ERROR: Something went wrong retrieving this contact\'s Portal UUID/Hash');
	}
	else {
		var uuidHash = portalSupportCaseCreator.generateUUIDHash_noCase(requestObj);
		alert('Contact Portal UUID/Hash: ' + uuidHash);

		// Reload the page to force all other buttons to update their UUID/Hash info
		location.reload();
	}
}