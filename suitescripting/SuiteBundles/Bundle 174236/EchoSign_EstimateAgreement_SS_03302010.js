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

var EchoSign = {};

EchoSign.Estimate = (function(){ //private members
    
	return { //public members
        beforeLoad: function(type, form, request){
            try {
            	var estimate = nlapiGetNewRecord();
				var url = nlapiResolveURL('SUITELET', 'customscript_echosign_agreement_creater', 'customdeploy_echosign_agreement_creater', false);
	            url += '&recordtype=' +estimate.getRecordType() + '&recordid=' + estimate.getId();
		        form.addButton('custpage_send_button', 'Send For Signature', "window.location.href= '" + url + "'");
            }
            catch (e) {
                nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
				//args(Error object, script name, receipients, author Employee Id)
				Util.handleError(e, 'EchoSign_EstimateAgreement.js', ['client@client.com'], nlapiGetUser());
            }
        }
    };
})();

function beforeLoad(type, form, request){
	EchoSign.Estimate.beforeLoad(type, form, request);
}