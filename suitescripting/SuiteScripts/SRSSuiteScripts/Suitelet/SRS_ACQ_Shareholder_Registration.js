/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.01       27 May 2014     smccurry
 * 
 * This replaces the old form which was generated using client script and
 * a suitelet called 'SRS Shareholder Registrator' with script id
 * 'customscript_srs_shareholder_registrator'
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function srsAcquiomRegistration(request, response) {
		if(request.getMethod() == 'GET') {
			
			var initialForm = buildForm('Shareholder Registration', null, null);
	        response.writePage(initialForm);
	        
		} else if(request.getMethod() == 'POST') { // && request.getParameter&form=First
			
			// LOAD SUBMITTED FIELD VALUES
			var contactFirstName = request.getParameter('CUSTPAGE_CONTACTFNAME');
			var contactLastName = request.getParameter('CUSTPAGE_CONTACTLNAME');
			var contactEmail = request.getParameter('CUSTPAGE_EMAIL');
			var shareholderOfRecord = request.getParameter('CUSTPAGE_NAME_RECORD');
			var secQuestion = request.getParameter('SECURITY_QUESTION_ANSWER_TYPE');
			var secAnswer = request.getParameter('SECURITY_QUESTION_ANSWER');
			var dealCode = request.getParameter('CUSTPAGE_DEAL_CODE');
			var dealCodeCheck = request.getParameter('CUSTPAGE_DEAL_CODE_CHECKBOX');
          
			if ((contactEmail != null) && (contactEmail != '')) { // CHECK IF CUSTOMER EMAIL IS ENTERED
                       if (((contactFirstName != null) && (contactFirstName != '')) || ((contactLastName != null) && (contactLastName != ''))) {
                              var regContact = nlapiCreateRecord('customrecord13');
                              regContact.setFieldValue('custrecord19', contactFirstName);
                              regContact.setFieldValue('custrecord20', contactLastName);
                              regContact.setFieldValue('custrecord28', contactEmail);
                              regContact.setFieldValue('custrecord58', shareholderOfRecord);
                              if(dealCodeCheck == 'T') {
                            	  regContact.setFieldValue('custrecord_temp_deal_name', dealCode);
                              }
                              if(secQuestion == 'ANSWER_TYPE_SHARES_HELD_AT_CLOSING') {
									regContact.setFieldValue('custrecord_shares_at_closing', secAnswer);
                              }
                              else if(secQuestion == 'ANSWER_TYPE_SHARES_HELD_AT_CLOSING') {
									regContact.setFieldValue('custrecord_cash_paid_at_closing', secAnswer);
								}
								try {
									var regConID = nlapiSubmitRecord(regContact);
								} catch (e) {
									var err = e;
									nlapiLogExecution('DEBUG', 'name', JSON.stringify(err));
									var message = 'There was a major error.';
									var majorError = buildMajorError('Error Message', null, message, JSON.stringify(err));
									response.writePage(majorError);
								}
								response.writePage(buildPostResponse());
                       }
			} else {
				var message = 'There was a problem with your submission, please enter all required fields and try again.';
//				var errorForm = buildForm('Shareholder Registration', null, message);
				var form = nlapiCreateForm('Shareholder Registration Form', true);
			    var htmlSection = form.addField('custpage_htmlsection', 'inlinehtml', '');
//			    htmlSection.setLayoutType('outsidebelow');
			    var bootStrapcss = nlapiLoadFile(1709303); // TODO: Change this id on production;
			    var pageCSS = nlapiLoadFile(1709504);// TODO: Change this id on production;
			    var bodyHtml = nlapiLoadFile(1709304);// TODO: Change this id on production;
			    var html = '<!DOCTYPE html>';
			    html += '<html lang="en">';
			    html += '<head>';
			    html += '<script>';
			    html += '</script>';
			    html += '</head>';
			    html += '<body>';
			    html += bodyHtml.getValue();
			    if(message) {
			    	html += '<h4 style="color: red;">' + message + '</h4>';
			    }
			    html += '</body>';
			    html += '<style>';
			    //bootstrap.min.css grid only container width 880px
			    html += bootStrapcss.getValue();
			    html += pageCSS.getValue();
			    html += 'h3 { font-family: franklin-gothic-urw,sans-serif;}';
			    html += 'input { background-color: #000000; border-color: #BBBBBB; color: #FFFFFF; } input[type="submit"] { background-color: #000000; }';
			    html += 'style="body, td, select, textarea, input { color: #FFFFFF; font-family: franklin-gothic-urw, sans-serif; }"';
			    html += '</style>';
			    htmlSection.setDefaultValue(html);
			    form.setScript('customscript_srs_acq_portal_reg_page_cs');
			    response.writePage(form);
//				response.writePage(errorForm);
			}

		}
}
		

function buildPostResponse() {
	var form = nlapiCreateForm('Thank You', false);
	var htmlSection = form.addField('custpage_htmlsection', 'inlinehtml', '');
//	form.setScript('customscript_si_cs_sidemark_sif_importui'); /* adds all the client-side JS scripts to page */
	var html = nlapiLoadFile(25587);
	htmlSection.setDefaultValue(html.getValue());//
	response.writePage(form);
};

function buildForm(formTitle, heading, message) {
	var form = nlapiCreateForm(formTitle, true);
    var htmlSection = form.addField('custpage_htmlsection', 'inlinehtml', '');
//    htmlSection.setLayoutType('outsidebelow');
    var bootStrapcss = nlapiLoadFile(1709303); // this id will change on production;
    var pageCSS = nlapiLoadFile(1709504);// this id will change on production;
    var bodyHtml = nlapiLoadFile(1709304);// this id will change on production;
    var html = '<!DOCTYPE html>';
    html += '<html lang="en">';
    html += '<head>';
    html += '<script>';
    html += '</script>';
//    html += '<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>';
    html += '</head>';
    html += bodyHtml.getValue();
    if(message) {
    	html += '<p class="textboldnolink" style="font-color: red;"' + message + '</p>';
    }
    html += '</body>';
//    html += '<script>';
//    html += '$("#main_form").validate()';
//    html += '</script>';
//    html += '<link rel="stylesheet" type="text/css" href="https://system.sandbox.netsuite.com/core/media/media.nl?id=1623766&c=772390_SB3&h=5ef43785fa39f0c0f22c&_xt=.css">';
//    html += '<link rel="stylesheet" type="text/css" href="https://system.sandbox.netsuite.com/core/media/media.nl?id=1623765&c=772390_SB3&h=c55399be1f349d39332c&_xt=.css">';
    html += '<style>';
    html += bootStrapcss.getValue();
    html += pageCSS.getValue();
    html += 'h3 { font-family: franklin-gothic-urw,sans-serif;}';
    html += '</style>';
    htmlSection.setDefaultValue(html);
    form.setScript('customscript_srs_acq_portal_reg_page_cs');
//    style += bootStrapcss.getValue();
//    style += pageCSS.getValue();
//    style += '</style>';
//    form.addField('custpage_style', 'inlinehtml', style);
//    var jsField = form.addField('custpage_script', 'inlinehtml', '');
//    jsField.setDefaultValue(scriptText);
    return form;
}

function buildMajorError(formTitle, heading, message, errorString) {
	var form = nlapiCreateForm(formTitle, true);
    var htmlSection = form.addField('custpage_htmlsection', 'inlinehtml', '');
    var bootStrapcss = nlapiLoadFile(1709303); // this id will change on production;
    var pageCSS = nlapiLoadFile(1709504);// this id will change on production;
    var html = '<!DOCTYPE html>';
    html += '<html lang="en">';
    html += '<head>';
    html += '<script>';
    html += '</script>';
    html += '</head>';
    html += '<h3>Error</h3>';
    html += '<p class="textboldnolink" style="font-color: red;"' + message + '</p>';
    html += '</body>';
    html += '<style>';
    html += bootStrapcss.getValue();
    html += pageCSS.getValue();
    html += 'h3 { font-family: franklin-gothic-urw,sans-serif;}';
    html += '</style>';
    htmlSection.setDefaultValue(html);
    var hidden = form.addField('custpage_hidden_error', 'text', '').setDisplayType('hidden');
    hidden.setDefaultValue(errorString);
    form.setScript('customscript_srs_acq_portal_reg_page_cs');
    return form;
}

