//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

var CC_CONSTS = JSON.parse(readAppSetting('PRI Accept CC Payment','System Constants'));
//------------------------------------------------------------------------------------------------------------------------------------
//Function:			executeCREProfileHTTPRequestSuitelet
//Script Type:		Suitelet
//Description:		Leverage CRE to draw full complete HTML input pages using the CRE Request Input HTTP object
//Example URL: 		
//Date:				20180502
//------------------------------------------------------------------------------------------------------------------------------------
function executeCREProfileHTTPRequestSuitelet(request, response)
{
	"use strict";
	logTitle='processManager';
	nlapiLogExecution('audit',logTitle,'request: '+request.getMethod());
	var profileid = request.getParameter('profileid')
	, httprequestid = request.getParameter('httprequestid')
	, businessid = request.getParameter('businessid')
	, page_cre_id = request.getParameter('page_cre_id')
	, cur = request.getParameter('cur')
	, k = request.getParameter('k')
	, msg = "";
	nlapiLogExecution('error',logTitle,'profileid, httprequestid, businessid, page_cre_id: '+profileid+', '+httprequestid+', '+businessid+', '+page_cre_id);
	var ExtraJSONData;
	var BusRecordSearchTypeID = -30; // NetSuite's internal ID for searching all Transactions (for reference only)
	if(request.getMethod() == 'GET'){
		var logTitle='processManagerGET';
		if (isEmpty(profileid)) msg += "CRE Profile ID parameter 'profileid' is required.<br>";
		if (isEmpty(businessid)) msg += "businessid is required.<br>";
		if (isEmpty(k)) msg += "key is required.<br>";
		
		if(!isEmpty(cur)) ExtraJSONData = {currency:cur};
	    
		if (!isEmpty(msg)) {
			response.write(msg);
			return;
		}
		
		var securityKeyObj = new securityKey();
		var result = securityKeyObj.validateKey({key:k,refValue:businessid});
		if(!result){
			nlapiLogExecution('emergency',logTitle,'Invalid security key');
			response.write('');
			return;
		}
		
		//if we have an http request id of a previous request, use it.  Else it will be null
		//and we will get an insert operation
		var creHTTPRequest = new CREHTTPRequest(httprequestid);
		//now prepare related data (assumes nothing) and get back a request ID
		
		httprequestid = creHTTPRequest.writeHTTPRequest(profileid, BusRecordSearchTypeID, businessid, ExtraJSONData);
		
		var creProfile = new CREProfile(profileid);
		creProfile.Translate(httprequestid);
		creProfile.Execute(true); // execute with the 'do not send' parameter
		
		//return form for user to enter info get the content that was generated.  Assumes we got good html in complete form
		var html = creProfile.fields.BodyTemplate.translatedValue;
		if (!html) {
			html = "No content returned.";
		}
		response.write(html);
	}
	//If in POST, stamp Opportunity record and redirect to page indicate submit was successful
	else if(request.getMethod() == 'POST'){
		var logTitle='processManagerPOST';
		try{
			
			if (!isEmpty(msg)) {
				response.write(msg);
				return;
			}
			
			var creHTTPRequest = new CREHTTPRequest(httprequestid);
			//nlapiLogExecution('error',logTitle,'creHTTPRequest: '+JSON.stringify(creHTTPRequest));
			var creProfileId;
			var current_page;
			var fromFailurePage=false;
			switch(page_cre_id){
			case 'STMT_PAGE':
				//case 'FAILURE_PAGE':
				//Build JSON for trans to Pay/Apply
				httprequestid = creHTTPRequest.writeHTTPRequest(profileid, BusRecordSearchTypeID, businessid, ExtraJSONData);
				nlapiLogExecution('error',logTitle,'Loading Review Page.');
				creProfileId=CC_CONSTS.CRE_PROF_IDS.CRE2_REV_PAY;
				current_page='REVIEW_PAGE';
			break;
			case 'REVIEW_PAGE':
				//Next 2 lines added to prevent payment resubmits on refresh of the failure or success pages
				var jsonExtraData = JSON.parse(nlapiLookupField('customrecord_pri_cre_request_http',httprequestid,'custrecord_pri_cre_request_http_extradat'));
				if(jsonExtraData.current_page=='REVIEW_PAGE'){
					
					var requestsParamsJSON = creHTTPRequest.objectToJSON(request.getAllParameters());
					//nlapiLogExecution('error',logTitle,'JSON.stringify(requestsParamsJSON): '+JSON.stringify(requestsParamsJSON));
					
					var paymentResponse = submitPayment(requestsParamsJSON,httprequestid);
					nlapiLogExecution('error',logTitle,'paymentResponse: '+JSON.stringify(paymentResponse));
					
					//We need to stamp the JSON extra data with the payment response for it to be available for the failure page
					jsonExtraData.paymentResponse=paymentResponse;
					//nlapiLogExecution('error',logTitle,'updating JSON extra data with: '+JSON.stringify(jsonExtraData));
					
					var regExMap={
							'ccnum':'this.obscureCreditCardNumbers = function concealCC(key, value){value = value.replace(/[^0-9]/g, "");value = value.replace(/.(?=.{4,}$)/g,"*");return value;}',
							'cczip':'this.obscureText = function obscureText(key, value){value = value.replace(/./g, "*");return value;}',
							'cccvv':'this.obscureText = function obscureText(key, value){value = value.replace(/./g, "*");return value;}',
							'ccaddr':'this.obscureText = function obscureText(key, value){value = value.replace(/./g, "*");return value;}'
						};
					
					httprequestid = creHTTPRequest.writeHTTPRequest(profileid, BusRecordSearchTypeID, businessid, jsonExtraData, regExMap);
					
					if(paymentResponse.result=='success'){
						nlapiLogExecution('error',logTitle,'Loading Success Page.');
						creProfileId=CC_CONSTS.CRE_PROF_IDS.CRE3_SUCC;
						current_page='SUCCESS_PAGE';
					}
					else{
						nlapiLogExecution('error',logTitle,'Loading Failure Page.');
						creProfileId=CC_CONSTS.CRE_PROF_IDS.CRE4_FAIL;
						current_page='FAILURE_PAGE';
					}
				}
				else if(jsonExtraData.current_page=='FAILURE_PAGE'){//case when user clicks refresh from failure page
					nlapiLogExecution('error',logTitle,'Loading Failure Page.');
					creProfileId=creProfileId=CC_CONSTS.CRE_PROF_IDS.CRE4_FAIL;
					current_page='FAILURE_PAGE';
				}
				else if(jsonExtraData.current_page=='SUCCESS_PAGE'){//case when user clicks refresh from failure page
					nlapiLogExecution('error',logTitle,'Loading Success Page.');
					creProfileId=CC_CONSTS.CRE_PROF_IDS.CRE3_SUCC;;
					current_page='SUCCESS_PAGE';
				}
				else{
					throw('Unexpected system error.  Please contact: AR@ring.com');
				}
			break;
			case 'FAILURE_PAGE':
				//We will not do a creHTTPRequest.write as we do not want to overwrite what the user selected on the Review and Page page.
				//But we need to remember that we're on the failure page, so we update this in the JSON extra data:
				
				creProfileId=CC_CONSTS.CRE_PROF_IDS.CRE2_REV_PAY;
				current_page='REVIEW_PAGE';
				fromFailurePage=true;
				
				break;
				
			default:
				throw nlapiCreateError('UNEXPECTED ERROR','Unexpected CRE Page ID: '+page_cre_id, true);
			}
			//Update JSON extra data with session info
			var jsonExtraDataString = nlapiLookupField('customrecord_pri_cre_request_http',httprequestid,'custrecord_pri_cre_request_http_extradat');
			nlapiLogExecution('error',logTitle,'current jsonExtraDataString: '+jsonExtraDataString);
			var jsonExtraData = {};
			if(!isEmpty(jsonExtraDataString)) jsonExtraData = JSON.parse(jsonExtraDataString);
			
			if(!isEmpty(current_page)) jsonExtraData.current_page=current_page;
			if(!isEmpty(fromFailurePage)) jsonExtraData.fromFailurePage=fromFailurePage;
			if(!isEmpty(paymentResponse)) jsonExtraData.paymentResponse = paymentResponse;
			nlapiLogExecution('error',logTitle,'new jsonExtraDataString: '+JSON.stringify(jsonExtraData));
			
			nlapiSubmitField('customrecord_pri_cre_request_http',httprequestid,'custrecord_pri_cre_request_http_extradat',JSON.stringify(jsonExtraData));
			
			//return form for user to enter info get the content that was generated.  Assumes we got good html in complete form
			nlapiLogExecution('error',logTitle,'creProfileId: '+creProfileId);
			var creProfile = new CREProfile(creProfileId);
			creProfile.Translate(httprequestid);
			creProfile.Execute(true); // execute with the 'do not send' parameter
		
			var html = creProfile.fields.BodyTemplate.translatedValue;
			if (!html) {
				html = "No content returned.";
			}
			nlapiLogExecution('audit',logTitle,'html: '+html);
			response.write(html);
			return;
		}
		catch(e){
			var outputObj={};
			var stErrMsg = '';
			if (e.getDetails != undefined) stErrMsg = 'Script Error: '+e.getCode() + ', ' + e.getDetails()+', '+e.getStackTrace();    
			else stErrMsg = 'Script Error: '+e.toString();     
			nlapiLogExecution('error',logTitle,'Process manager error.  Details: '+stErrMsg);
			outputObj.result = stErrMsg;
			outputObj.errorType = 'script';
			ExtraJSONData = {paymentResponse:outputObj};
			httprequestid = creHTTPRequest.writeHTTPRequest(profileid, BusRecordSearchTypeID, businessid, ExtraJSONData);
			nlapiLogExecution('error',logTitle,'Loading Failure Page after process manager script error.');
			var creProfile = new CREProfile(CC_CONSTS.CRE_PROF_IDS.CRE4_FAIL);
			creProfile.Translate(httprequestid);
			creProfile.Execute(true); // execute with the 'do not send' parameter
			var html = creProfile.fields.BodyTemplate.translatedValue;
			if (!html) {
				html = "No content returned.";
			}
			nlapiLogExecution('audit',logTitle,'html: '+html);
			response.write(html);
			return;
		}
	}
}
function submitPayment(requestsParamsJSON,httprequestid){
	var logTitle='submitPayment';
	
	var outputObj={};
	
	var url = nlapiResolveURL('suitelet','customscript_pri_cc_accept_pay','customdeploy_pri_cc_accept_pay',true)+ '&httprequestid=' + httprequestid + '&requestsParamsJSONstring=' + encodeURIComponent(JSON.stringify(requestsParamsJSON));
	nlapiLogExecution('audit',logTitle,'url: '+url);
	nlapiLogExecution('audit',logTitle,'encodeURI(url): '+encodeURI(url));
	try{
		var response = nlapiRequestURL(encodeURI(url));
		var outputString = response.getBody();
		nlapiLogExecution('error',logTitle,'outputString: '+outputString);
		outputObj = JSON.parse(outputString);
		if(outputObj.result=='success') {
			nlapiLogExecution('error',logTitle,'Payment successfully processed.');
		}
		else {
			nlapiLogExecution('error',logTitle,'Failure processing payment.  Details: '+outputObj.result);
		}
		return outputObj;
	}
	catch(e){
		var stErrMsg = '';
		if (e.getDetails != undefined) stErrMsg = 'Script Error: '+e.getCode() + ', ' + e.getDetails()+', '+e.getStackTrace();    
		else stErrMsg = 'Script Error: '+e.toString();     
		nlapiLogExecution('error',logTitle,'Error processing payment.  Details: '+stErrMsg);
		outputObj.result = stErrMsg;
		outputObj.errorType = 'script';
		return outputObj;
	}	
}

function isEmpty(val) {
	return (val == undefined || val == null || val == '' || val == 'null');	
}