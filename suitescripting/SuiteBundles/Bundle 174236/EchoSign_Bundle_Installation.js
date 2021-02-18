/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2015 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property 
* laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/


function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

function getBaseUris(apiKey){

	var baseURL = null;
	var soap = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >' +
            '<soap:Body>' +
			'<ns1:getBaseUris xmlns:ns1="http://api.echosign">'+
			'<ns1:apiKey>'+
			apiKey+
			'</ns1:apiKey>'+
			'</ns1:getBaseUris>'+
			'</soap:Body>'+
			'</soap:Envelope>';
			
    var headers = [];
	headers['SOAPAction'] = "";
	headers['Content-Type'] = 'text\/xml;charset=UTF-8';
	
	var url = EchoSign.OAuthUtil.getEchoSignHost() + "/services/EchoSignDocumentService22";
	
	nlapiLogExecution('DEBUG','SOAP Action', 'getBaseUris');
	
	var echoResponse = nlapiRequestURL(url, soap, headers);
	
	var responseXML = nlapiStringToXML(echoResponse.getBody());     
	if (echoResponse.getCode() === 200) {        
		baseURL = nlapiSelectValue(responseXML, "//*[local-name()='apiBaseUri']");
	}		
	return baseURL;
}

function getDocumentInfo(apiKey, documentKey, url){
            
            var soap = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<soapenv:Body>' +
            '<tns:getDocumentInfo xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tns="http://api.echosign">' +
            '<tns:apiKey>' +
            apiKey +
            '</tns:apiKey>' +
            '<tns:documentKey>' +
            documentKey +
            '</tns:documentKey>' +
            '</tns:getDocumentInfo>' +
            '</soapenv:Body>' +
            '</soapenv:Envelope>';
            
            soap = soap.replace(/&/g, '&amp;');
           
            var headers = [];
            headers['SOAPAction'] = "";
            headers['Content-Type'] = 'text\/xml;charset=UTF-8';
            
            var echoResponse = nlapiRequestURL(url, soap, headers);
             
            var responseXML = nlapiStringToXML(echoResponse.getBody());
            
            if (echoResponse.getCode() === 200) {
            
				var curKey = nlapiSelectValue(responseXML, "//*[local-name()='documentKey']");
                return {
                    success: true,
                    newKey: curKey,
                };
            }
            else {
                var errMsg = nlapiSelectValue(responseXML, "//*[local-name()='faultstring']");
                return {
                    success: false,
                    msg: errMsg
                };
            }
}

function afterUpdate(fromversion, toversion)
{	
	nlapiLogExecution('DEBUG','In afterUpdate from version ' + fromversion.toString() + " toversion " + toversion.toString());

	if(strStartsWith(fromversion.toString() , "3.") || strStartsWith(fromversion.toString() , "2.") || strStartsWith(fromversion.toString() , "1.")) {
		nlapiLogExecution('DEBUG','Start Upgrade');
		var apiKey = nlapiGetContext().getSetting('SCRIPT', 'custscript_echosign_api_key');
		var agreementColumns = [];
		agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_status'));
		agreementColumns.push(new nlobjSearchColumn('custrecord_echosign_doc_key'));
		var results = nlapiSearchRecord('customrecord_echosign_agreement', null, new nlobjSearchFilter('custrecord_echosign_status', null, 'anyof', [2,9 ]), agreementColumns) || [];
		nlapiLogExecution('DEBUG', 'Total eSign Services Agreements to update' ,'Count = ' + results.length);
		var baseURL = getBaseUris(apiKey);
		if(baseURL) {
			var url = baseURL + "/services/EchoSignDocumentService22";
			for (var i = 0; i < results.length; i++) {
				try {
					var result= getDocumentInfo(apiKey ,  results[i].getValue('custrecord_echosign_doc_key'), url);
					if(result.success == true) {
						nlapiSubmitField('customrecord_echosign_agreement', results[i].getId(), 'custrecord_echosign_doc_key', result.newKey);
						nlapiLogExecution('DEBUG','eSign Service Agreement id ' + results[i].getId() + ' is updated');
					}
					else{
						nlapiLogExecution('ERROR','eSign Service Agreement id ' + results[i].getId() + ' is not updated');
					}	
					nlapiLogExecution('DEBUG', 'Total eSign Services Agreements updated so far' , ''+ (i + 1) + ' out of ' +results.length + ' are updated');

				} catch(e) {
					nlapiLogExecution('ERROR','eSign Service Agreement ' + results[i].getId() + ' Errored', (e.name || e.getCode()) + ' | ' + (e.message || e.getDetails()));
				} 
			}
		}
		else{
			nlapiLogExecution('ERROR','getBaseUris Failed');
		}
	}
}