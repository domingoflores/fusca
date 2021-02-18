/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [first year code created] Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

EchoSign.Util = (function() {
    
    var logLongString = function(k, v) {
        for (var i = 0; i < v.length; i = i + 4000) {
            log(k + ' | ' + i, v.substring(i, i+4000));
        }
    };
    
    return {
        logError: function(scriptName, errorMessage, errorData) {
            
            if (!_.isString(errorMessage)) {
                errorMessage = (errorMessage.name || errorMessage.getCode()) + ' | ' + (errorMessage.message || errorMessage.getDetails());
            }
            
            var r = nlapiCreateRecord('customrecord_echosign_script_errors');
            r.setFieldValue('custrecord_echosign_script_name', scriptName);
            r.setFieldValue('custrecord_echosign_error', errorMessage);
            r.setFieldValue('custrecord_echosign_error_data', errorData ? JSON.stringify(errorData) : '');
            return nlapiSubmitRecord(r);
            
        },
        
        searchError: function(scriptName) {
            
            if (!scriptName)
                throw nlapiCreateError('CELIGO_INVALID_PARAM', 'scriptName cannot be empty');
            
            var rs = nlapiSearchRecord('customrecord_echosign_script_errors', null,
                    [new nlobjSearchFilter('custrecord_echosign_script_name', null, 'is', scriptName),
                     new nlobjSearchFilter('custrecord_echosign_is_resolved', null, 'is', 'F')],
                    [new nlobjSearchColumn('custrecord_echosign_error_data')]) || [];
            
            rs = _.map(rs, function(row) {
                var data = row.getValue('custrecord_echosign_error_data');
                if (data) {
                    return JSON.parse(data);
                } else {
                    return null;
                }
            });
            
            return _.compact(rs);
        },
        
        getDocumentInfo : function (echoApiUrl, apiKey, documentKey) {
            
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
            
            logLongString('SOAP Action', 'getDocumentInfo');
            logLongString('SOAP Body', nlapiEscapeXML(soap));
            
            var headers = [];
            headers['SOAPAction'] = "";
            headers['Content-Type'] = 'text\/xml;charset=UTF-8';
            
            var echoResponse = nlapiRequestURL(echoApiUrl, soap, headers);
            logLongString('SOAP Response', nlapiEscapeXML(echoResponse.getBody()));
            log('echo res code', echoResponse.getCode());
            log('echo res error', echoResponse.getError());
            
            var responseXML = nlapiStringToXML(echoResponse.getBody());
            
            if (echoResponse.getCode() === 200) {
            
                var statusNode = nlapiSelectNode(responseXML, '//*[local-name()="documentInfo"]/*[local-name()="status"]');
                var curStatus = statusNode.firstChild.getNodeValue();
                
                log('curStatus', curStatus);
                var curKey = nlapiSelectValue(responseXML, "//*[local-name()='latestDocumentKey']");
                log('curKey', curKey);
                
                var locale = nlapiSelectValue(responseXML, "//*[local-name()='locale']");
                var expiration = nlapiSelectValue(responseXML, "//*[local-name()='expiration']");
                
                var eventList = [];
                var dateStrings = nlapiSelectValues(responseXML, "//*[local-name()='date']");
                var descStrings = nlapiSelectValues(responseXML, "//*[local-name()='description']");
                
                for (var k = 0; k < dateStrings.length; k++) {
                    var tempDate = dateStrings[k];
                    var tempDesc = descStrings[k];
                    var tempEvent = {
                        date: tempDate,
                        event: tempDesc
                    };
                    eventList[k] = tempEvent;
                }
                return {
                    success: true,
                    status: curStatus,
                    events: eventList,
                    newKey: curKey,
                    locale: locale,
                    expiration: expiration
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
    };
    
})();