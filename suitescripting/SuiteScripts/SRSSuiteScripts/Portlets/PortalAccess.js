/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="..\Utils\PortalAccessUtil.js" />
/**
 * @author durbano
 */
function loadPortlet(portlet, column) {
	nlapiLogExecution("DEBUG", "PortalAccessPortlet.loadPortlet", "START");

	// likely this is only called once
	portlet.setTitle('Customer Portal Access');

	var portletUrl = nlapiResolveURL('SUITELET', 'customscript_srs_portal_access_suitelet', 'customdeploy_srs_portal_access_suitelet', 'FALSE');

	var wrapperPage = 'wrapper';
	var wrapperUrl = portletUrl + '&page=' + wrapperPage + '&frame=search';

	var content = '<td><iframe name="SRSCustomerPortalAccessWrapper" src="' + wrapperUrl + '" frameborder="0" width="100%" height="380" scrolling="no"></iframe>';
	portlet.setHtml(content);
	nlapiLogExecution("DEBUG", "PortalAccessPortlet.loadPortlet", "END");
}

function handleRequest(request, response) {
	nlapiLogExecution("DEBUG", "PortalAccessPortlet.handleRequest", "START");

	// process request
	var page = request.getParameter('page');

	if (page == null) {
		response.write('Request parameter page is null');
		return;
	}

	nlapiLogExecution("DEBUG", "PortalAccessPortlet.handleRequest", "page = " + page);

	if (page == 'wrapper') {
		writeWrapper(request, response);
		return;
	}

	var content = null;

	// get the list of recently closed deals (3 months) with open tasks
	switch(page) {

		case 'search':
			content = renderSearch(request);
			break;

		case 'addRemoveContact':

			var action = request.getParameter('srs_action');

			if (action != null) {

				switch(action) {
					case 'REMOVE':
						removeCompanyAccess(request);
						break;

					case 'ADD':
						addCompanyAccess(request);
						break;


					case 'REMOVE_ACCESS':
						takethAccess(request);
						break;

					case 'ADD_ACCESS':
						givethAccess(request);
						break;

					case 'SEND_PASSWORD_EMAILS':
						sendPasswordEmails(request, false);
						break;

					case 'FORCE_NEW_PASS_SEND_PASSWORD_EMAILS':
						sendPasswordEmails(request, true);
						break;

					case 'RECEIVE_STMTS_SET_TO_YES':
						changeEmailStatmentReceiptStatus('F', request.getParameter('sdaInternalId'));
						break;

					case 'RECEIVE_STMTS_SET_TO_NO':
						changeEmailStatmentReceiptStatus('T', request.getParameter('sdaInternalId'));
						break;

				}
			}
			render(request, response);
			return; // underlying function performs the rendering

		case 'searchResults':
			render(request, response);
			return; // underlying function performs the rendering

		// filter down the default list to show only those deals with tasks assigned to me
		case 'contactInfo':
			content = renderContactInfo(request);
			break;

		case 'duplicate':
			content = renderDuplicate(request);
			break;

		case 'errors':
			content = renderErrors(request);
			break;

		case 'emailReportAccess':

			var action = request.getParameter('srs_action');

			if (action == 'FORCESYNC') {
				doForceSync(request);
			}
			render(request,response);
			return; // underlying function performs the rendering

		case 'pendingRegistrations':
			content = renderPendingRegistrations(request);
			response.writePage(content);
			return;

		case 'pendingRegistration':
			content = renderPendingRegistration(request);
			break;

		case 'approveRegistration':
			approveRegistration(request);
			content = renderPendingRegistration(request);
			break;

		case 'sendRequestForCorrectSecurityAnswersEmail':
			var regId = request.getParameter('registrationid')
			sendRequestForCorrectSecurityAnswersEmail(regId, PORTAL_ACCESS_INCORRECT_ANSWER_FIRST_ATTEMP);
			content = renderPendingRegistration(request);
			break;

		case 'completeRegistration':
			completeRegistration(request);
			content = renderPendingRegistration(request);
			break;

		case 'ignoreRegistration':
			ignoreRegistration(request);
			content = renderPendingRegistration(request);
			break;

		case 'postShareholderMatch':
			postShareholderMatch(request);
			content = renderPendingRegistration(request);
			break;

		case 'postDealMatch':
			postDealMatch(request);
			content = renderPendingRegistration(request);
			break;

		case 'matchShareholderRegistration':
			content = matchShareholderRegistration(request);
			break;

		case 'matchDealRegistration':
			content = matchDealRegistration(request);
			break;

		case 'copyShareholderRegistration':
			content = copyShareholderRegistration(request);
			break;

		case 'copyOlrData':
			copyOlrData(request);
			content = renderPendingRegistration(request);
			break;

		case 'createNewContactFromRegistration':
			createNewContactFromRegistration(request);
			content = copyShareholderRegistration(request);
			break;

		case 'pendingIdConfirm':
			content = renderPendingIdConfirm(request);
			response.writePage(content);
			return;

		case 'shareholderResponse':
			content = renderShareholderResponse(request);
			response.writePage(content);
			return;

		default:
			response.write('Page ' + page + ' not found.');
			return;
	}

	//response.writePage(content);
	response.write(content);
	nlapiLogExecution("DEBUG", "PortalAccessPortlet.handleRequest", "END");
}

//4 = Dormant
//5 = First Request For Security Answers Made
//6 = Second Request For Security Answers Made
//7 = Final Request For Security Answers Made
function scheduledHandler() {
	// get list of OLR in status 5 for more than 10 days, send email, put in status 6: Second Request for Security Answers Made
	// get list of OLR in status 6 for more than 10 days, send email, put in status 7: Final Request for Security Answers Made
	// get list of OLR in status 7 for more than 10 days, send email, put in status 4: Dormant

	var searchResults = nlapiSearchRecord('customrecord13', 'customsearch_olr_follow_up_emails');
	if (searchResults == null || searchResults.length == 0) {
		nlapiLogExecution("DEBUG", "SRSAllocationPortlet.scheduledHandler", "No results found");
		return;
	}

	for (var i = 0; i < searchResults.length; i++) {

		var result = searchResults[i];
		var olrId = result.getValue('internalid');
		nlapiLogExecution("DEBUG", "scheduledHandler", "olrId = " + olrId);

		var currentStatus = result.getValue('custrecord_registration_status');
		nlapiLogExecution("DEBUG", "scheduledHandler", "currentStatus = " + currentStatus);

		var FILE_ID = PORTAL_ACCESS_INCORRECT_ANSWER_SECOND_ATTEMP;

		if (currentStatus == 6) {
			FILE_ID = PORTAL_ACCESS_INCORRECT_ANSWER_THIRD_ATTEMP;
		}
		else if (currentStatus == 7) {
			var rcd = nlapiLoadRecord('customrecord13', olrId);
			var nxtSts = getNextStatus(parseInt(currentStatus));
			rcd.setFieldValue('custrecord_registration_status', nxtSts);
			nlapiSubmitRecord(rcd, true, false);
			continue;
		}

		sendRequestForCorrectSecurityAnswersEmail(olrId, FILE_ID);
	}
}

function writeWrapper(request, response) {
	var portletUrl = nlapiResolveURL('SUITELET', 'customscript_srs_portal_access_suitelet', 'customdeploy_srs_portal_access_suitelet', 'FALSE');

	var frame = request.getParameter('frame');
	var searchPage = 'search';
	var errorsPage = 'errors';
	var duplicateContactsPage = 'duplicate';
	var pendingRegistrationPage = 'pendingRegistrations';
	var pendingIdConfirmPage = 'pendingIdConfirm';
	var shareholderResponsePage = 'shareholderResponse';

	// pull out any email address and pass it along in the default URL
	var contactemail = request.getParameter('contactemail');

	var defaultUrl = portletUrl + '&page=' + frame + '&contactemail=' + contactemail;
	var searchUrl = portletUrl + '&page=wrapper&frame=' + searchPage;
	var errorsUrl = portletUrl + '&page=' + errorsPage;
	var duplicateUrl = portletUrl + '&page=wrapper&frame=' + duplicateContactsPage;
	var pendingRegUrl = portletUrl + '&page=wrapper&frame=' + pendingRegistrationPage;
	var idConfirmUrl = portletUrl + '&page=wrapper&frame=' + pendingIdConfirmPage;
	var shResponseUrl = portletUrl + '&page=wrapper&frame=' + shareholderResponsePage;

	var headerContent = '<font size="1"> &nbsp; <a href="' + searchUrl + '">Search</a> &nbsp; | &nbsp; '
						+ '<a href="' + errorsUrl + '">Errors</a>  &nbsp; | &nbsp; '
						+ '<a href="' + pendingRegUrl + '">Pending Registrations</a>  &nbsp; | &nbsp; '
						+ '<a href="' + idConfirmUrl + '">Registrations Pending ID Confirmation</a>  &nbsp; | &nbsp; '
						+ '<a href="' + shResponseUrl + '">Shareholder Responses</a>  &nbsp; | &nbsp; '
						+ '<a href="' + duplicateUrl + '">Duplicates</a> </font>';
	var iFrameContent = '<iframe frameborder="0" name="SRSCustomerPortalAccessBody" width="100%" height="380" src="' + defaultUrl + '" scrolling="auto"></iframe>';

	response.write(headerContent);
	response.write(iFrameContent);
}

function beforeLoad(type, form, request) {
	nlapiLogExecution("DEBUG", "PortalAccess.beforeLoad", "Entering function");

	if (!request || request == null) {
		return;
	}

	nlapiLogExecution("DEBUG", "PortalAccess.beforeLoad", "request object exists");

	var action = request.getParameter('srs_action');

	if (!action || action == null) {
		return;
	}

	nlapiLogExecution("DEBUG", "PortalAccess.beforeLoad", "srs_action object exists");

	var contactid = request.getParameter('srs_contact');

	if (!contactid || contactid == null) {
		return;
	}

	nlapiLogExecution("DEBUG", "PortalAccess.beforeLoad", "srs_contactid object exists");

	nlapiLogExecution("DEBUG", "PortalAccess.beforeLoad", "action = " + action);

	if (action == 'REMOVE_ACCESS') {
		takethPortalAccess(contactid);
	}
	else if (action == 'ADD_ACCESS') {
		givethPortalAccess(contactid);
	}
	else if (action == 'ADD_ACCESS_TO_ALL') {
		givethPortalAccess(null);
	}
}