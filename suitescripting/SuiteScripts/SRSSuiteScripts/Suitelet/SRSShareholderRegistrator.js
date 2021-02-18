/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />

/**
 * @author durbano
 */
//var INPUT_FILE_ID = 25588;// Original
var INPUT_FILE_ID = 1582057;// Version 2
var THANK_YOU_FILE_ID = 1582055;// Version 2
//var PERSONAL_PIN_FILE_ID = 1582054;// Version 2
var PERSONAL_PIN_FILE_ID = 25586;// Original
var UPDATE_FILE_ID = 1582056;//26638;

var MAX_ALLOWED_ATTEMPTS = 1;

var ERRS = {
	 FIELD_MISSING : 1
	,SHAREHOLDER_NOT_FOUND : 2
};

var FIRST_PAGE_FIELDS = [
	 'SECURITY_QUESTION_ANSWER'				// security question answer
	,'NLCUSTRECORD28'						// email address
	,'SHAREHOLDER_PIN'						// shareholder pin
	,'UNKNOWN_PIN'							// unknown pin checkbox
	,'TERMS_OF_USE_ACCEPTANCE'				// acceptance to terms of use policy
];

var FIRST_PAGE_REQUIRED_FIELDS = [
	 'SECURITY_QUESTION_ANSWER'				// security question answer
	,'NLCUSTRECORD28'						// email address
	,'SHAREHOLDER_PIN'						// shareholder pin
	,'TERMS_OF_USE_ACCEPTANCE'				// acceptance to terms of use policy
];

var MATCHING_ERRORS = [
	 'SHAREHOLDER_PIN_ERROR'
	,'SECURITY_QUESTION_MISMATCH'
];

var SECOND_PAGE_FIELDS = [
	 'NLCUSTRECORD19'	// first name
	,'NLCUSTRECORD58'	// shareholder name of record
	,'NLCUSTRECORD20'	// last name
	,'NLCUSTRECORD18'	// name of investment
	//,'NLCUSTRECORD21'	// company name
	//,'NLCUSTRECORD_CASH_PAID_AT_CLOSING'
	//,'NLCUSTRECORD22'	// address 1
	//,'NLCUSTRECORD23'	// address 2
	//,'NLCUSTRECORD_SHARES_AT_CLOSING'
	//,'NLCUSTRECORD24'	// city
	//,'NLCUSTRECORD25'	// state
	//,'NLCUSTRECORD26'	// zip code
	//,'NLCUSTRECORD32'	// check to enable communications for your account
	//,'NLCUSTRECORD33'	// check to enable online access for your account
	,'NLCUSTRECORD28'	// email
	//,'NLCUSTRECORD29'	// phone number
	//,'NLCUSTRECORD31'	// fax
	//,'NLCUSTRECORD30'	// alternate phone number
	,'SECURITY_QUESTION_ANSWER'
	,'TERMS_OF_USE_ACCEPTANCE'				// acceptance to terms of use policy
];

var SECOND_PAGE_REQUIRED_FIELDS = [
	 ['NLCUSTRECORD19','First Name is missing']
	,['NLCUSTRECORD20','Last Name is missing']
	,['NLCUSTRECORD58','Shareholder Name of Record is missing']
	,['NLCUSTRECORD18','PIN or Name of Investment not entered']
	,['NLCUSTRECORD28','Email is missing']
	,['SECURITY_QUESTION_ANSWER','Security Question Answer is missing']
	,['TERMS_OF_USE_ACCEPTANCE','Terms of Use Policy is not checked']
	];

var UPDATE_PAGE_FIELDS = [
  	 'SECURITY_QUESTION_ANSWER'
	,'TERMS_OF_USE_ACCEPTANCE'				// acceptance to terms of use policy
    ];

var UPDATE_PAGE_REQUIRED_FIELDS = [
   	 ['SECURITY_QUESTION_ANSWER','Security Question Answer is missing']
	,['TERMS_OF_USE_ACCEPTANCE','Terms of Use Policy is not checked']
	];

var COUNTRIES = [
		['US','United States'], // first one in the list is the default
		['AF','Afghanistan'], 
		['AL','Albania'], 
		['DZ','Algeria'], 
		['AS','American Samoa'], 
		['AD','Andorra'], 
		['AO','Angola'], 
		['AI','Anguilla'], 
		['AQ','Antarctica'], 
		['AG','Antigua and Barbuda'], 
		['AR','Argentina'], 
		['AM','Armenia'], 
		['AW','Aruba'], 
		['AU','Australia'], 
		['AT','Austria'], 
		['AZ','Azerbaijan'], 
		['BS','Bahamas'], 
		['BH','Bahrain'], 
		['BD','Bangladesh'], 
		['BB','Barbados'], 
		['BY','Belarus'], 
		['BE','Belgium'], 
		['BZ','Belize'], 
		['BJ','Benin'], 
		['BM','Bermuda'], 
		['BT','Bhutan'], 
		['BO','Bolivia'], 
		['BA','Bosnia and Herzegovina'], 
		['BW','Botswana'], 
		['BV','Bouvet Island'], 
		['BR','Brazil'], 
		['IO','British Indian Ocean Territory'], 
		['BN','Brunei Darussalam'], 
		['BG','Bulgaria'], 
		['BF','Burkina Faso'], 
		['BI','Burundi'], 
		['KH','Cambodia'], 
		['CM','Cameroon'], 
		['CA','Canada'], 
		['CV','Cap Verde'], 
		['KY','Cayman Islands'], 
		['CF','Central African Republic'], 
		['TD','Chad'], 
		['CL','Chile'], 
		['CN','China'], 
		['CX','Christmas Island'], 
		['CC','Cocos (Keeling) Islands'], 
		['CO','Colombia'], 
		['KM','Comoros'], 
		['CD',"Congo, Democratic People's Republic"], 
		['CG','Congo, Republic of'], 
		['CK','Cook Islands'], 
		['CR','Costa Rica'], 
		['CI',"Cote d'Ivoire"], 
		['HR','Croatia/Hrvatska'], 
		['CU','Cuba'], 
		['CY','Cyprus'], 
		['CZ','Czech Republic'], 
		['DK','Denmark'], 
		['DJ','Djibouti'], 
		['DM','Dominica'], 
		['DO','Dominican Republic'], 
		['TP','East Timor'], 
		['EC','Ecuador'], 
		['EG','Egypt'], 
		['SV','El Salvador'], 
		['GQ','Equatorial Guinea'], 
		['ER','Eritrea'], 
		['EE','Estonia'], 
		['ET','Ethiopia'], 
		['FK','Falkland Islands (Malvina)'], 
		['FO','Faroe Islands'], 
		['FJ','Fiji'], 
		['FI','Finland'], 
		['FR','France'], 
		['GF','French Guiana'], 
		['PF','French Polynesia'], 
		['TF','French Southern Territories'], 
		['GA','Gabon'], 
		['GM','Gambia'], 
		['GE','Georgia'], 
		['DE','Germany'], 
		['GH','Ghana'], 
		['GI','Gibraltar'], 
		['GR','Greece'], 
		['GL','Greenland'], 
		['GD','Grenada'], 
		['GP','Guadeloupe'], 
		['GU','Guam'], 
		['GT','Guatemala'], 
		['GG','Guernsey'], 
		['GN','Guinea'], 
		['GW','Guinea-Bissau'], 
		['GY','Guyana'], 
		['HT','Haiti'], 
		['HM','Heard and McDonald Islands'], 
		['VA','Holy See (City Vatican State)'], 
		['HN','Honduras'], 
		['HK','Hong Kong'], 
		['HU','Hungary'], 
		['IS','Iceland'], 
		['IN','India'], 
		['ID','Indonesia'], 
		['IR','Iran (Islamic Republic of)'], 
		['IQ','Iraq'], 
		['IE','Ireland'], 
		['IM','Isle of Man'], 
		['IL','Israel'], 
		['IT','Italy'], 
		['JM','Jamaica'], 
		['JP','Japan'], 
		['JE','Jersey'], 
		['JO','Jordan'], 
		['KZ','Kazakhstan'], 
		['KE','Kenya'], 
		['KI','Kiribati'], 
		['KP',"Korea, Democratic People's Republic"], 
		['KR','Korea, Republic of'], 
		['KW','Kuwait'], 
		['KG','Kyrgyzstan'], 
		['LA',"Lao People's Democratic Republic"], 
		['LV','Latvia'], 
		['LB','Lebanon'], 
		['LS','Lesotho'], 
		['LR','Liberia'], 
		['LY','Libyan Arab Jamahiriya'], 
		['LI','Liechtenstein'], 
		['LT','Lithuania'], 
		['LU','Luxembourg'], 
		['MO','Macau'], 
		['MK','Macedonia'], 
		['MG','Madagascar'], 
		['MW','Malawi'], 
		['MY','Malaysia'], 
		['MV','Maldives'], 
		['ML','Mali'], 
		['MT','Malta'], 
		['MH','Marshall Islands'], 
		['MQ','Martinique'], 
		['MR','Mauritania'], 
		['MU','Mauritius'], 
		['YT','Mayotte'], 
		['MX','Mexico'], 
		['FM','Micronesia, Federal State of'], 
		['MD','Moldova, Republic of'], 
		['MC','Monaco'], 
		['MN','Mongolia'], 
		['ME','Montenegro'], 
		['MS','Montserrat'], 
		['MA','Morocco'], 
		['MZ','Mozambique'], 
		['MM','Myanmar'], 
		['NA','Namibia'], 
		['NR','Nauru'], 
		['NP','Nepal'], 
		['NL','Netherlands'], 
		['AN','Netherlands Antilles'], 
		['NC','New Caledonia'], 
		['NZ','New Zealand'], 
		['NI','Nicaragua'], 
		['NE','Niger'], 
		['NG','Nigeria'], 
		['NU','Niue'], 
		['NF','Norfolk Island'], 
		['MP','Northern Mariana Islands'], 
		['NO','Norway'], 
		['OM','Oman'], 
		['PK','Pakistan'], 
		['PW','Palau'], 
		['PS','Palestinian Territories'], 
		['PA','Panama'], 
		['PG','Papua New Guinea'], 
		['PY','Paraguay'], 
		['PE','Peru'], 
		['PH','Philippines'], 
		['PN','Pitcairn Island'], 
		['PL','Poland'], 
		['PT','Portugal'], 
		['PR','Puerto Rico'], 
		['QA','Qatar'], 
		['RE','Reunion Island'], 
		['RO','Romania'], 
		['RU','Russian Federation'], 
		['RW','Rwanda'], 
		['BL','Saint Barth�lemy'], 
		['KN','Saint Kitts and Nevis'], 
		['LC','Saint Lucia'], 
		['MF','Saint Martin'], 
		['VC','Saint Vincent and the Grenadines'], 
		['SM','San Marino'], 
		['ST','Sao Tome and Principe'], 
		['SA','Saudi Arabia'], 
		['SN','Senegal'], 
		['RS','Serbia'], 
		['CS','Serbia'], 
		['SC','Seychelles'], 
		['SL','Sierra Leone'], 
		['SG','Singapore'], 
		['SK','Slovak Republic'], 
		['SI','Slovenia'], 
		['SB','Solomon Islands'], 
		['SO','Somalia'], 
		['ZA','South Africa'], 
		['GS','South Georgia'], 
		['ES','Spain'], 
		['LK','Sri Lanka'], 
		['SH','St. Helena'], 
		['PM','St. Pierre and Miquelon'], 
		['SD','Sudan'], 
		['SR','Suriname'], 
		['SJ','Svalbard and Jan Mayen Islands'], 
		['SZ','Swaziland'], 
		['SE','Sweden'], 
		['CH','Switzerland'], 
		['SY','Syrian Arab Republic'], 
		['TW','Taiwan'], 
		['TJ','Tajikistan'], 
		['TZ','Tanzania'], 
		['TH','Thailand'], 
		['TG','Togo'], 
		['TK','Tokelau'], 
		['TO','Tonga'], 
		['TT','Trinidad and Tobago'], 
		['TN','Tunisia'], 
		['TR','Turkey'], 
		['TM','Turkmenistan'], 
		['TC','Turks and Caicos Islands'], 
		['TV','Tuvalu'], 
		['UM','US Minor Outlying Islands'], 
		['UG','Uganda'], 
		['UA','Ukraine'], 
		['AE','United Arab Emirates'], 
		['GB','United Kingdom (GB)'], 
		['UY','Uruguay'], 
		['UZ','Uzbekistan'], 
		['VU','Vanuatu'], 
		['VE','Venezuela'], 
		['VN','Vietnam'], 
		['VG','Virgin Islands (British)'], 
		['VI','Virgin Islands (USA)'], 
		['WF','Wallis and Futuna Islands'], 
		['EH','Western Sahara'], 
		['WS','Western Samoa'], 
		['YE','Yemen'], 
		['ZM','Zambia'], 
		['ZW','Zimbabwe']];

function handleRegistrationRequest(request,response)
{
	var action = request.getParameter('ACTION');
	
	if(action == null || action.length == 0)
	{
		handleFirstStepReturnInput(request,response);
		return;	
	}
	else if(action == 'UPDATE')
	{
		handleUpdateRegistration(request,response);
		return;
	}
	else if(action == 'SUBMIT_UPDATE')
	{
		handleUpdateSubmissionRegistration(request,response);
		return;
	}	
	if(action != 'FIRST_STEP_SUBMISSION' && action != 'SECOND_STEP_SUBMISSION') return;
	
	var shareholdermatch = false;
	var shareholderId = null;
	var THE_FIELDS = FIRST_PAGE_FIELDS;
	var RETURN_FILE = PERSONAL_PIN_FILE_ID;
	try
	{
		var unknownPin = (request.getParameter('UNKNOWN_PIN') != null);	// boolean - if not null, then the unknown pin field is checked
		if(unknownPin) action = 'SECOND_STEP_SUBMISSION';

		if(action == 'FIRST_STEP_SUBMISSION')
		{
			shareholdermatch = 	handleFirstStepRegistration(request);
			if(shareholdermatch == null)	// deal-only was passed in
			{
				THE_FIELDS = SECOND_PAGE_FIELDS;
				RETURN_FILE = INPUT_FILE_ID; 
				shareholdermatch = handleSecondStepRegistration(request);
			}
		}
		else if(action == 'SECOND_STEP_SUBMISSION')
		{
			THE_FIELDS = SECOND_PAGE_FIELDS;
			RETURN_FILE = INPUT_FILE_ID; 
			shareholdermatch = handleSecondStepRegistration(request);
		}
	}
	catch(e)
	{
		var attempts = request.getParameter('NUMBER_OF_ATTEMPTS');
		if(attempts == null || attempts.length == 0) attempts = 0;
		else attempts = parseInt(attempts) + 1;

		if(attempts <= MAX_ALLOWED_ATTEMPTS)
		{
			handleReturnError(request,response,e,THE_FIELDS,RETURN_FILE);
			return;
		}
	}

	var orRcdId = handleStoreData(request,response,shareholdermatch);  // store data
	
	handleSendEmail(request,shareholderId,orRcdId);			// send email
	
	// return the 'Thank You' page
	var file = nlapiLoadFile(THANK_YOU_FILE_ID).getValue();
	//if(shareholdermatch)	file = file.replace('<!--IDENTITY_CONFIRMATION-->','<p>Your identity matches our records.</p>');

	response.setContentType('HTMLDOC', 'thankyou.html', 'inline');
	response.write(file);
}

function handleFirstStepRegistration(request)
{
	var errs = new Array();
	
	var unknownPin = (request.getParameter('UNKNOWN_PIN') != null);	// boolean - if not null, then the unknown pin field is checked
	
	// check required fields
	for(var i = 0; i < FIRST_PAGE_REQUIRED_FIELDS.length; i++)
	{
		var field = FIRST_PAGE_REQUIRED_FIELDS[i];
		
		if(field == 'SHAREHOLDER_PIN' && unknownPin) continue; // skip
		
		var val = request.getParameter(field);
		if(val == null || val.length == 0) errs.push(field);
	}
	if(errs.length > 0) throwError('MISSING_FIELDS',errs);

	var thePIN = request.getParameter('SHAREHOLDER_PIN');
	nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.handleFirstStepRegistration", "thePIN = " + thePIN);

	var theIds = getShareholderPIN(thePIN);
	nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.handleFirstStepRegistration", "theIds = " + theIds);
	nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.handleFirstStepRegistration", "theIds.length = " + theIds.length);
	if(theIds.length == 1) return null;	// this means the user only passed in a valid dealId. An error is thrown if the user did not.
	
	return matchingParticipatingShareholderData(theIds[0],[theIds[1]],request);	
}

function handleSecondStepRegistration(request)
{
	var errs = new Array();
	
	// check to make sure the required fields are filled in
	for(var i = 0; i < SECOND_PAGE_REQUIRED_FIELDS.length; i++)
	{
		var field = SECOND_PAGE_REQUIRED_FIELDS[i][0];
		var val = request.getParameter(field);
		if(val != null && val.length > 0) continue;
		
		errs.push(SECOND_PAGE_REQUIRED_FIELDS[i][0]);
	}

	// if any errors found to this point, there is not point in continuing, otherwise, continue...
	if(errs.length > 0) throwError('MISSING_FIELDS',errs);
		
	// get the Deal Name
	var deal = request.getParameter('NLCUSTRECORD18');
		deal = deal.replace(/LP/g,'').replace(/L\.P\./g,'').replace(/LLC/g,'').replace(/Inc\./g,'').replace(/ Inc/g,'');

	var dealPIN = getDealByName(deal);
	if(dealPIN == null)
	{
		return false;	// can't on a deal that is not recognized
	}
	
	// try and match up the deal to a record in the system
	var shareholderIds = findShareholder(request);
	if(shareholderIds == null || shareholderIds.length == 0) return errs;	// this should mean zero errors found since no matching shareholder

	// for each shareholder, figure out if there is a match
	// check to see if the security questions are answered correctly
	return matchingParticipatingShareholderData(dealPIN,shareholderIds,request);
}

function handleUpdateRegistration(request,response)
{
	var olrId = request.getParameter('olr');
	if(olrId == null || olrId.length == 0) return;
	
	var olr	  = nlapiLoadRecord('customrecord13',olrId);
	var sts   = olr.getFieldValue('custrecord_registration_status');
	
	// make sure the status of the OLR is in an update-able state, ... e.g. phishing prevention
	if(sts != 4 && sts != 5 && sts != 6 && sts != 7) return;		// 4 = dormant, 5 = First Request, 6 = Second Request, 7 = Final Request
	
	// get the template
	var file = nlapiLoadFile(UPDATE_FILE_ID).getValue();
	var css =
	file 
	file = file.replace(/OLR_ID/g,olrId);
	
	// serve up the template with the tokens replaced
	response.setContentType('HTMLDOC', 'registration.html', 'inline');
	response.write(replaceTokens(request,file,FIRST_PAGE_FIELDS));	
}

function handleUpdateSubmissionRegistration(request,response)
{
	var olrId = request.getParameter('olr');
	if(olrId == null || olrId.length == 0) return;
	var olr	  = nlapiLoadRecord('customrecord13',olrId);

	try
	{
		var errs = new Array();											// check for required fields
		for(var i = 0; i < UPDATE_PAGE_REQUIRED_FIELDS.length; i++)		// check to make sure the required fields are filled in
		{
			var field = UPDATE_PAGE_REQUIRED_FIELDS[i][0];
			var val = request.getParameter(field);
			if(val != null && val.length > 0) continue;
			
			errs.push(UPDATE_PAGE_REQUIRED_FIELDS[i][0]);
		}
		
		// if any errors found to this point, there is no point continuing
		if(errs.length > 0) throwError('MISSING_FIELDS', errs);

		var dealId = olr.getFieldValue('custrecord18');
		var sharId = olr.getFieldValue('custrecord17');
		
		if(!matchingParticipatingShareholderData(dealId,sharId,request))
		{
			errs.push('SECURITY_QUESTION_MISMATCH');
			throwError('MATCHING_ERROR',errs);
		}
		
		//olr.setFieldValue('custrecord34', 'T'); // Identifies that the shareholder entered the correct information WRT shares held at close or cash received at close
		olr.setFieldValue('custrecord_registration_status',8);	// Shareholder Response
	}
	catch (e)
	{
		var attempts = request.getParameter('NUMBER_OF_ATTEMPTS');
		if(attempts == null || attempts.length == 0) attempts = 0;
		else attempts = parseInt(attempts) + 1;

		if(attempts <= (MAX_ALLOWED_ATTEMPTS + 2))
		{
			handleReturnError(request,response,e,UPDATE_PAGE_FIELDS,UPDATE_FILE_ID);
			return;
		}
		olr.setFieldValue('custrecord_registration_status',8);	// Shareholder Response
	}
	
	// store the new answer and set the status accordingly
	var answer = request.getParameter('SECURITY_QUESTION_ANSWER');
	var ansTyp = request.getParameter('SECURITY_QUESTION_ANSWER_TYPE');
	
	var cashAtClose = '';
	var sharesAtClose = '';
	if(ansTyp == 'ANSWER_TYPE_SHARES_HELD_AT_CLOSING') sharesAtClose = answer;
	else cashAtClose = answer;

	olr.setFieldValue('custrecord_cash_paid_at_closing',cashAtClose);
	olr.setFieldValue('custrecord_shares_at_closing',sharesAtClose);

	var termsOfUse = request.getParameter('TERMS_OF_USE_ACCEPTANCE');
	if(termsOfUse != null && termsOfUse.length > 0)	olr.setFieldValue('custrecord_terms_of_use','T');
	
	nlapiSubmitRecord(olr, true, false);

	// done
	var file = nlapiLoadFile(THANK_YOU_FILE_ID).getValue();
	response.setContentType('HTMLDOC', 'thankyou.html', 'inline');
	response.write(file);
}

function getShareholderPIN(thePIN)
{
	nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.getShareholderPIN", "thePIN = " + thePIN);
	if(thePIN.indexOf('-') == -1)	return getDealPIN(thePIN);	// try as deal PIN only
	if(thePIN.split('-').length != 2) throwError('MALFORMED_PIN',['MALFORMED_PIN']);
	
	// convert the pins from HEXDECIMAL to INT
	var pins = thePIN.split('-');
	var dealId = hexToNum(pins[0]);
	var shareholderId = hexToNum(pins[1]);
	
	// verify the PIN - need to break it up (deal and shareholder id), example 11-2849
	if(!isDealById(dealId))					throwError('INCORRECT_PIN',['UNKNOWN_DEAL_IN_PIN']);
	if(!isShareholderById(shareholderId))	throwError('INCORRECT_PIN',['UNKNOWN_SHAREHOLDER_IN_PIN']);

	var ids = new Array();
	ids.push(dealId);
	ids.push(shareholderId);
	
	return ids;
}

function getDealPIN(thePIN)
{
	if(thePIN.indexOf('-') > -1) throwError('MALFORMED_DEAL_PIN',['MALFORMED_DEAL_PIN']);
	
	// convert the pin from HEXDECIMAL to INT
	var dealId = hexToNum(thePIN);
	
	// verify the PIN - need to break it up (deal), example 11-2849
	if(!isDealById(dealId))					throwError('INCORRECT_DEAL_PIN',['UNKNOWN_DEAL_IN_PIN']);
	
	var ids = new Array();
	ids.push(dealId);
	
	return ids;
}

function handleReturnError(request,response,error,fields,returnFile)
{
	// get the template
	var file = nlapiLoadFile(returnFile).getValue();
	
	if(error.name == 'MISSING_FIELDS')
	{
		file = file.replace('HEADER_REQUIRED_FIELDS','required_field_missing');
		for(var i = 0; i < error.errors.length; i++)
		{
			var field = error.errors[i];
			file = file.replace(field + '_CLASS_REQUIRED' , 'required_field_missing');
		}
	}
	else if(error.name == 'MALFORMED_PIN')
	{
		file = file.replace('<!--PERSONAL_PIN_NOT_VALID-->' , '<p><strong>Error:</strong> The shareholder PIN is not in the proper format.</p>');
		file = file.replace('SHAREHOLDER_PIN_CLASS_REQUIRED' , 'required_field_missing');
	}
	else if(error.name == 'MALFORMED_DEAL_PIN')
	{
		file = file.replace('<!--PERSONAL_PIN_NOT_VALID-->' , '<p><strong>Error:</strong> The Deal PIN is not in the proper format.</p>');
		file = file.replace('SHAREHOLDER_PIN_CLASS_REQUIRED' , 'required_field_missing');
	}
	else if(error.name == 'INCORRECT_PIN')
	{
		file = file.replace('<!--PERSONAL_PIN_NOT_VALID-->' , '<p><strong>Error:</strong> The shareholder PIN does not match our records.</p>');
		file = file.replace('SHAREHOLDER_PIN_CLASS_REQUIRED' , 'required_field_missing');
	}
	else if(error.name == 'INCORRECT_DEAL_PIN')
	{
		file = file.replace('<!--PERSONAL_PIN_NOT_VALID-->' , '<p><strong>Error:</strong> The Deal PIN does not match our records.</p>');
		file = file.replace('SHAREHOLDER_PIN_CLASS_REQUIRED' , 'required_field_missing');
	}
	else if(error.name == 'MATCHING_ERROR')
	{
		for(var j = 0; j < error.errors.length; j++)
		{
			var problem = error.errors[j];
			if(problem == 'SHAREHOLDER_PIN_ERROR')
			{
				file = file.replace('<!--PERSONAL_PIN_NOT_VALID-->' , '<p><strong>Error:</strong> The shareholder PIN is not in the proper format.</p>');
				file = file.replace('SHAREHOLDER_PIN_CLASS_REQUIRED' , 'required_field_missing');
			}
			else if(problem == 'SECURITY_QUESTION_MISMATCH')
			{
				file = file.replace('<!--PERSONAL_PIN_NOT_VALID-->' , '<p><strong>Error:</strong> Incorrect answer to the security question answered. Please try one more time. If it is still not correct, the form will submit and will be reviewed internally.');
				file = file.replace('SECURITY_QUESTION_ANSWER_CLASS_REQUIRED' , 'required_field_missing');
			}
		}

		var attempts = request.getParameter('NUMBER_OF_ATTEMPTS');
		if(attempts == null) attempts = 0;
		attempts = parseInt(attempts) + 1;
		file = file.replace('NUMBER_OF_ATTEMPTS_COUNT', attempts);
	}
	
	// update parameters
	var olrId = request.getParameter('olr');
	if(olrId != null && olrId.length > 0)
		file = file.replace(/OLR_ID/g,olrId);
	
	// serve up the template with the tokens replaced
	response.setContentType('HTMLDOC', 'registration.html', 'inline');
	response.write(replaceTokens(request,file,fields));
}

function handleFirstStepReturnInput(request,response)
{
	// get the template
	var file = nlapiLoadFile(PERSONAL_PIN_FILE_ID);
	
	// serve up the template with the tokens replaced
	response.setContentType('HTMLDOC', 'registration.html', 'inline');
	response.write(replaceTokens(request,file.getValue(),FIRST_PAGE_FIELDS));	
}

function handleReturnInput(request,response)
{
	// get the template
	var file = nlapiLoadFile(INPUT_FILE_ID);
	
	// serve up the template with the tokens replaced
	response.setContentType('HTMLDOC', 'registration.html', 'inline');
	response.write(replaceTokens(request,file.getValue(),FIELDS));	
}

function handleStoreData(request,response,inputMatched)
{
	// store the data
	var rcd = nlapiCreateRecord('customrecord13');
	
	var answer = request.getParameter('SECURITY_QUESTION_ANSWER');
	var ansTyp = request.getParameter('SECURITY_QUESTION_ANSWER_TYPE');
	
	var cashAtClose = '';
	var sharesAtClose = '';
	if(ansTyp == 'ANSWER_TYPE_SHARES_HELD_AT_CLOSING') sharesAtClose = answer;
	else cashAtClose = answer;

	rcd.setFieldValue('custrecord_cash_paid_at_closing',cashAtClose);
	rcd.setFieldValue('custrecord_shares_at_closing',sharesAtClose);
	rcd.setFieldValue('custrecord19',request.getParameter('NLCUSTRECORD19'));		// first name
	rcd.setFieldValue('custrecord20',request.getParameter('NLCUSTRECORD20'));		// last name
	rcd.setFieldValue('custrecord28',request.getParameter('NLCUSTRECORD28'));		// email
	
	var shareholderPin = request.getParameter('SHAREHOLDER_PIN');
	if(shareholderPin != null && shareholderPin.length > 0)
	{	// first step page
		try
		{
			rcd.setFieldValue('custrecord58',shareholderPin);
			
			var theIds = getShareholderPIN(shareholderPin);
			
			rcd.setFieldValue('custrecord18',theIds[0]);							// deal
			if(theIds.length > 1) rcd.setFieldValue('custrecord17',theIds[1]);		// shareholder
		}
		catch(e){ /** NOTHING TO DO HERE?**/ }
	}
	else
	{	// second step page
		var dealName = request.getParameter('NLCUSTRECORD18');
		var shareholderName = request.getParameter('NLCUSTRECORD58');
		rcd.setFieldValue('custrecord58',shareholderName);
		rcd.setFieldValue('custrecord_temp_deal_name',dealName);

		var shareholderId = getShareholderByName(shareholderName);
		if(shareholderId != null)	rcd.setFieldValue('custrecord17',shareholderId);				// shareholder name of record
		
		var dealId = getDealByName(dealName);
		if(dealId != null)	rcd.setFieldValue('custrecord18',dealId);		// name of investment
	}

	var termsOfUse = request.getParameter('TERMS_OF_USE_ACCEPTANCE');
	if(termsOfUse != null && termsOfUse.length > 0)	rcd.setFieldValue('custrecord_terms_of_use','T');
	
	nlapiLogExecution("DEBUG", "handleStoreData", "termsOfUse = " + termsOfUse);
	
	//var enableOnlineAccess = request.getParameter('NLCUSTRECORD33');
	//if(enableOnlineAccess != null && enableOnlineAccess.length == 0)
	//	rcd.setFieldValue('custrecord33','T');		// check to enable communications for your account
	
	//var enableEmailComm = request.getParameter('NLCUSTRECORD32');
	//if(enableEmailComm != null && enableEmailComm.length == 0)
	//	rcd.setFieldValue('custrecord32','T');		// check to enable online access for your account

	if (inputMatched)
	{
		//rcd.setFieldValue('custrecord34', 'T'); // Identifies that the shareholder entered the correct information WRT shares held at close or cash received at close
		rcd.setFieldValue('custrecord_registration_status',2);	// Approved, but Password Needed
	}
	else
	{
		rcd.setFieldValue('custrecord_registration_status',1);	// Pending Review
	}
	
	nlapiSubmitRecord(rcd, true, false);	
}

function handleSendEmail(request,shareholderId,onlineRegistrationRecord)
{
	var email = request.getParameter('NLCUSTRECORD28');
	if(email == null || email.length == 0) return;		// can't send without some email address

	var from  = 21345;	// support employee
	var subj  = 'SRS ComPort(TM) Online Registration: Thank you for your registration';
	var body  = "<b>SRS ComPort(TM) Online Registration</b>";
		
		body += "<p>Thank you for registering for SRS ComPort, Shareholder Representative Services' online information resource for shareholders. To finish the registration process, we will send you a setup link for access to SRS ComPort to the email address you entered on the registration page as soon as your transaction has been reviewed and loaded into our system. This process can take up to 60-days from the closing date of your transaction. In the interim, please visit our Live Demo on <a href='http:\\www.srscomport.com' target='_blank'>srscomport.com</a> to see what information is available, as well as many frequently asked questions from security holders.";
body += "<p></p>";
body += "Please contact <a href='mailto:support@shareholderep.com'>support@shareholderrep.com</a> if you have any questions or concerns.</p>";
		body += "<p>Shareholder Representative Services LLC</p>";

	var records = new Object();
	if(shareholderId != null) 				records['entity'] 	  = shareholderId;
	if(onlineRegistrationRecord != null) 	records['customrecord13'] = onlineRegistrationRecord;
	
	nlapiSendEmail(from,email,subj,body,null,null,records,null); 
}

function replaceTokens(request,file,fields)
{
	// header
	file = file.replace('HEADER_REQUIRED_FIELDS','required_field');
	file = file.replace('<!--DEAL_PIN_NOT_VALID-->', '');
	
	// deal with individual fields
	for(var j = 0; j < fields.length; j++)
	{
		var field = fields[j];
		var val = request.getParameter(field);
		if(val == null) val = '';
		
		file = file.replace('' + field + '_VALUE', val);
		file = file.replace(field + '_CLASS_REQUIRED', 'required_field')
	}
	
	var unknownPin = (request.getParameter('UNKNOWN_PIN') != null);	// boolean - if not null, then the unknown pin field is checked
	if(unknownPin)
	{
		file = file.replace('UNKNOWN_PIN_CHECKED','CHECKED');
	}
	
	var termsOfUse = (request.getParameter('TERMS_OF_USE_ACCEPTANCE') != null);	// boolean - if not null, then the unknown pin field is checked
	if(termsOfUse)
	{
		file = file.replace('TERMS_OF_USE_ACCEPTANCE_CHECKED','CHECKED');
	}

	var securityQuestionAnswer = request.getParameter('SECURITY_QUESTION_ANSWER_TYPE');
	file = file.replace(securityQuestionAnswer + '_CHECKED','selected="selected"');
	
	// deal with the country drop-down
	/*for(var k = 0; k < COUNTRIES.length; k++)
	{
		var country_code = COUNTRIES[k][0];
		var val = request.getParameter('custrecord27');
		var op_sel = '';
		
		if(val != null && val == country_code) op_sel = 'SELECTED';
		else if(country_code == COUNTRIES[0][0]) op_sel = 'SELECTED'
		
		file = file.replace('CUSTRECORD27_' + country_code,op_sel);
	}*/
	
	// handle the number of attempts
	file = file.replace('NUMBER_OF_ATTEMPTS_COUNT','0');	// this is the default number until all required fields are filled in
	
	return file;
}

// deal could be an internalid or the name of the deal
function isDealById(dealPIN)
{
	nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.isDealById", "dealPIN = " + dealPIN);
	
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('internalid',null,'anyof',dealPIN));
	filters.push(new nlobjSearchFilter('category',null,'is',1));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1) return true;		// In this case we should just return what was passed in
	
	if(results == null)
	{
		nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.isDealById", "results are NULL");
	}
	else
	{
		nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.isDealById", "results are of length " + results.length);
	}
	
	return false;
}

function isShareholderById(shareholderPIN)
{
	nlapiLogExecution("DEBUG", "SRSShareholderRegistrator.isDealById", "shareholderPIN = " + shareholderPIN);
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('internalid',null,'is',shareholderPIN));
	filters.push(new nlobjSearchFilter('category',null,'is',2));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1) return true;		// In this case we should just return what was passed in
	
	return false;
}

function getDealByName(dealName)
{
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('category',null,'is',1));
	filters.push(new nlobjSearchFilter('companyname',null,'contains',dealName));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1)
	{
		var result = results[0];
		return result.getValue('internalid',null,null);
	}

	filters[1] = new nlobjSearchFilter('companyname',null,'contains',dealName);
	results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1)
	{
		var result = results[0];
		return result.getValue('internalid',null,null);
	}

	// now test to see if the user re-entered the Deal code
	var dealId = hexToNum(dealName);
	if(isDealById(dealId))
	{
		return dealId;
	}
	
	return null;		// In this case we should just return null
}

function getShareholderByName(shareholderName)
{
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('category',null,'anyof',[2,7]));
	filters.push(new nlobjSearchFilter('companyname',null,'is',shareholderName));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1)
	{
		var result = results[0];
		return result.getValue('internalid',null,null);
	}

	filters[1] = new nlobjSearchFilter('companyname',null,'contains',shareholderName);
	var results = nlapiSearchRecord('customer',null,filters,columns);
	if(results != null && results.length == 1)
	{
		var result = results[0];
		return result.getValue('internalid',null,null);
	}

	return null;		// In this case we should just return what was passed in
}

function findShareholder(request)
{
	var email = request.getParameter('NLCUSTRECORD28');
	var shareholder = request.getParameter('NLCUSTRECORD58');
	var phone = request.getParameter('NLCUSTRECORD29');
	var lastname = request.getParameter('NLCUSTRECORD20');
	var firstname = request.getParameter('NLCUSTRECORD19');
	
	// try and match up the shareholder to a record in the system
	var customer = null;
	var contact  = null;
	var ids      = null;

	// shareholder
	customer = findRecord('companyname',shareholder,'customer');
	if(customer != null) return [customer];
	
	// email
	customer = findRecord('email',email,'customer');
	if(customer != null) return [customer];
	
	contact = findRecord('email',email,'contact');
	if(contact != null)
	{
		// get the contact's list of associated shareholders
		ids = findAllShareholders(contact);
		if(ids != null) return ids;
	}
		
	return null;
}

function recordExists(fieldName,enteredField,recordType)
{
	return findRecord(fieldName,enteredField,recordType) != null;
}

function findRecord(fieldName,enteredField,recordType)
{
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter(fieldName,null,'is',enteredField));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord(recordType,null,filters,columns);
	if(results == null || results.length > 1) return null;
	
	var result = results[0];
	
	return result.getValue('internalid',null,null);
}

function findAllShareholders(contactId)
{
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('internalid','contact','is',contactId));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	
	var results = nlapiSearchRecord('customer',null,filters,columns);

	if(results == null || results.length == 0) return null;
	
	var ids = new Array();
	for(var i = 0; i < results.length; i++)
	{
		var result = results[i];
		ids.push(result.getValue('internalid',null,null));
	}
	return ids;
}

function matchingParticipatingShareholderData(dealPIN, shareholderIds, request)
{
	if(shareholderIds == null || shareholderIds.length == 0) return false;

	// get the list of participating shareholder data based on the list of shareholder ids
	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('custrecord_participating_escrow',null,'is',dealPIN));
	filters.push(new nlobjSearchFilter('custrecord_participating_shareholder',null,'anyof',shareholderIds));
	columns.push(new nlobjSearchColumn('internalid',null,null));
	columns.push(new nlobjSearchColumn('custrecord64',null,null));	// cash at close
	columns.push(new nlobjSearchColumn('custrecord73',null,null));	// shares at closing
	columns.push(new nlobjSearchColumn('custrecord_participating_shareholder',null,null));	// shareholder
	
	var results = nlapiSearchRecord('customrecord2',null,filters,columns);
	if(results == null || results.length == 0) throwError('MATCHING_ERROR',['SHAREHOLDER_PIN_ERROR']);
	
	var answer = request.getParameter('SECURITY_QUESTION_ANSWER');
	var ansTyp = request.getParameter('SECURITY_QUESTION_ANSWER_TYPE');
	
	var cashAtClose = -99999992932392817392;
	var sharesAtClose = -99999992932392817392;
	if(ansTyp == 'ANSWER_TYPE_SHARES_HELD_AT_CLOSING') sharesAtClose = answer;
	else cashAtClose = answer;
	
	if(cashAtClose != null && cashAtClose.length > 0) cashAtClose = parseFloat(cashAtClose.replace(',',''));
	if(sharesAtClose != null && sharesAtClose.length > 0) sharesAtClose = parseFloat(sharesAtClose.replace(',',''));
	
	var cashAtCloseAccum 	= 0.0;
	var sharesAtCloseAccum 	= 0.0;
	
	var cashAtCloseArry = new Array();
	var sharesAtCloseArry = new Array();
	
	// compare the shares held at closing and cash paid at closing fields to the data, if a match is found, return true
	for(var i = 0; i < results.length; i++)
	{
		var result = results[i];
		
		var cashAtCloseRst = result.getValue('custrecord64',null,null);
		var sharesAtCloseRst = result.getValue('custrecord73',null,null);
		var shareholder = result.getValue('custrecord_participating_shareholder',null,null);
		
		if(cashAtClose == cashAtCloseRst) return true;
		if(sharesAtClose == sharesAtCloseRst) return true;
		
		cashAtCloseFlt = parseFloat(cashAtCloseRst);
		sharesAtCloseFlt = parseFloat(sharesAtCloseRst);
		
		cashAtCloseAccum   += cashAtCloseFlt;
		sharesAtCloseAccum += sharesAtCloseFlt;
		
		if(cashAtCloseFlt > 0.0)	cashAtCloseArry.push(parseFloat(cashAtCloseRst));
		if(sharesAtCloseFlt > 0.0)	sharesAtCloseArry.push(parseFloat(sharesAtCloseRst));
	}
	
	if(cashAtCloseAccum 	== cashAtClose) 	return true;
	if(sharesAtCloseAccum 	== sharesAtClose) 	return true;
	
	if(cashAtCloseArry.length > 10)	throwError('MATCHING_ERROR',['SECURITY_QUESTION_MISMATCH']);		// we will need to find the limit to the number of combinations we are willing to try
	
	// now try every conceivable combination for each
	if(cashAtClose != 0 && combinations(0,cashAtCloseArry,cashAtClose))			return true;
	if(sharesAtClose != 0 && combinations(0,sharesAtCloseArry,sharesAtClose))	return true;
	
	throwError('MATCHING_ERROR',['SECURITY_QUESTION_MISMATCH']);
}

// helper functions
function throwError(name,errs)
{
	throw{
		 name: name
		,errors: errs
	};
}


function combinations(runningSum,theArray,toMatch)
{
	if(runningSum == toMatch) return true;
	for (var i = 0; i < theArray.length; i++)
	{
		if(combinations(runningSum + theArray[i], theArray.slice(i + 1),toMatch)) return true;
	}
	return false;
}

function numToHex(theNumber)
{
	return theNumber.toString(16);
}

function hexToNum(hexNumber)
{
	return parseInt(hexNumber,16);
}















