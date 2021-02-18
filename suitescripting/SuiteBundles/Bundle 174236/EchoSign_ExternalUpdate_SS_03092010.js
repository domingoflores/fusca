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

EchoSign.ExternalUpdate = (function(){ //private members
    
	var updateFile = function(fileId, documentKey) {
		var r;
		try {
			r = nlapiLoadRecord('customrecord_echosign_agreement', fileId);
		} catch(e) {
			return; // doesn't exist
		}
		
		if (documentKey && !r.getFieldValue('custrecord_echosign_doc_key')) {
			r.setFieldValue('custrecord_echosign_doc_key', documentKey);
            r.setFieldText('custrecord_echosign_status', 'Out For Signature');
            
            var documentResults = nlapiSearchRecord('customrecord_echosign_document', null, 
            		new nlobjSearchFilter('custrecord_echosign_agreement', null, 'is', r.getId()), 
            		new nlobjSearchColumn('custrecord_echosign_file'));
            r.setFieldValue('custrecord_echosign_folder', nlapiLoadFile(documentResults[0].getValue('custrecord_echosign_file')).getFolder());
            
            r.setFieldValue('custrecord_echosign_date_sent', nlapiDateToString(new Date()));
		}
		
		r.setFieldValue('custrecord_echosign_need_update', 'T');
		
		log('Updated Agreement Record', nlapiSubmitRecord(r, false, true));
		
		log('Scheduled Ondemand Update', nlapiScheduleScript('customscript_echosign_agreement_sched', 'customdeploy_echosign_update_demand'));
    };
	
    return { //public members
        main: function(request, response){
            try {
            	var method = request.getMethod();
            	log('method', method);
            	
            	var params = request.getAllParameters();
            	for (param in params) {
            	    log('parameter = ' + param, 'value = ' + params[param]);
            	}
            	
				var fileid = request.getParameter('fileid');
            	log('fileid', fileid);
            	
            	if (!fileid)
            		return;
            	
            	var documentKey = request.getParameter('documentKey');
            	log('documentKey', documentKey);
            	
            	if (method === 'GET') {
					updateFile(fileid, documentKey);
				}
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
                Util.handleError(e, 'EchoSign_ExternalUpdate.js', ['client@client.com, client@client.com'], -5);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    };
})();

var main = function(){
	EchoSign.ExternalUpdate.main(request, response);
};