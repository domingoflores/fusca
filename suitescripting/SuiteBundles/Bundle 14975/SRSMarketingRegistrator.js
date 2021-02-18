/**
 * @author durbano
 */

var JUNE_2011_SURVEY = 23173;	// this will need to change when going to production, since the file id will be different
var THANKYOU_PAGE = 23172;

function handleRegistrationRequest(request,response)
{
	// get the values from the request
	var inputType	 = request.getParameter("i");	// one of new or update
	
	if(inputType == "create")		handleNewRequest(request,response);
	else if(inputType == "update")	updatePreviousRequest(request,response);
	// done
}

function handleNewRequest(request,response)
{
	nlapiLogExecution('DEBUG', 'SRSMarketingRegistrator.handleNewRequest', 'request.getURL() - ' + request.getURL());
	var contactIdStr    = request.getParameter("con");
	var rankSelectedStr = request.getParameter("r");	// something from 1 to 10
	var reqUrl 		 = request.getURL()
						+ '?script=' + request.getParameter('script')
						+ '&deploy=' + request.getParameter('deploy')
						+ '&compid=' + request.getParameter('compid')
						+ '&h='		 + request.getParameter('h')
						+ '&i=update';

	if(rankSelectedStr == null || rankSelectedStr.length == 0) return; // fail nicely
	var rankSelected = parseInt(rankSelectedStr);
	if(contactIdStr == null || contactIdStr.length == 0) return; // fail nicely
	var contactId = parseInt(contactIdStr);
	if(contactId == null) return; // fail nicely
	
	nlapiLogExecution('DEBUG', 'SRSMarketingRegistrator', 'contact id = ' + contactId);
	var cont = nlapiLoadRecord('contact',contactId);

	// create the marketing registration record
	var reg = nlapiCreateRecord('customrecord_marketing_registrations');
		//reg.setFieldValue('custrecord_mr_contact', contactIdStr);
		//reg.setFieldValue('custrecord_mr_auto_matched','T');
		reg.setFieldValue('custrecord_mr_first_name',cont.getFieldValue('firstname'));
		reg.setFieldValue('custrecord_mr_last_name',cont.getFieldValue('lastname'));
		reg.setFieldValue('custrecord_mr_email',cont.getFieldValue('email'));
		reg.setFieldValue('custrecord_mr_reg_form_source','2011_JUNE_RATE_SRS');	// ?
		reg.setFieldValue('custrecord_mr_rank',rankSelected);
		
	var id = nlapiSubmitRecord(reg, false, false);
	
	nlapiLogExecution('DEBUG', 'SRSMarketingRegistrator', 'marketing_registration id = ' + id);
	
	// get the template
	var file = nlapiLoadFile(JUNE_2011_SURVEY);
	
	// serve up the template with the tokens replaced
	response.setContentType('HTMLDOC', 'surveyForm.html', 'inline');
	response.write(file.getValue().replace(/\@MR_RCD_ID@/gi, id).replace(/\@FORM_POST_URL@/gi,reqUrl));	
	// done
}

function updatePreviousRequest(request,response)
{
	var id	 		= request.getParameter("p");
	var feedback	= request.getParameter("feedback");
	
	if(id == null || id.length == 0) return;	// fail nicely

	// get the marketing registrations record
	var reg = nlapiLoadRecord('customrecord_marketing_registrations',id);
		reg.setFieldValue('custrecord_mr_feedback',feedback);
	var id = nlapiSubmitRecord(reg, false, false);
	
	// get the thank you template
	var file = nlapiLoadFile(THANKYOU_PAGE);
	
	// replace any values that need replacement
	
	// serve up the template with the tokens replaced
	response.setContentType('HTMLDOC', 'thankyou.html', 'inline');
	response.write(file.getValue());
	// done	
}
