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
EchoSign.Document = (function(){ //private members
	
	var formatSize = function(sizeInBytes){
    	var
    	units = ['B','KB','MB'],
    	tempSize = +sizeInBytes || 0;
    	
    	var c = 0;
    	while(tempSize >= 1024 && c < units.length-1){
    		tempSize /= 1024;
    		c++;
    	}
    	
    	tempSize = Math.floor(tempSize*10)/10;
    	
    	return tempSize + ' '+units[c];
    };

    return { //public members
        beforeSubmit: function(type, form, request){
        	if(type.toLowerCase()!=='delete'){
        		var doc = nlapiGetNewRecord();
    			var fileId = doc.getFieldValue('custrecord_echosign_file') || doc.getFieldValue('custpage_echosign_document_associated_files');
    			
    			if(!fileId)
    				throw new Error('A file must be attached to save the record.');
    			
    			log('File', fileId);
    			var file = nlapiLoadFile(fileId);
    			var fileSize = formatSize(file.getSize());
    			
    			log("file size", fileSize);
    			
    			nlapiSetFieldValue('custrecord_echosign_file', fileId);
    			nlapiSetFieldValue('custrecord_echosign_file_size', fileSize);
        	}
        },
        
        afterSubmit: function(type){
        },
        
        beforeLoad: function(type, form, request){
        	try {
            	
            	if(type.toLowerCase() === 'edit' || type.toLowerCase() === 'create') {
            		//add a field to show files that are attached to the transaction
                	
                	//make sure there are files that are associated with transaction
                	var agreementRecId = nlapiGetFieldValue('custrecord_echosign_agreement');
                	
                	if(agreementRecId) {
                		//lookup for actual transaction type and id
                    	var flds = nlapiLookupField('customrecord_echosign_agreement', agreementRecId, ['custrecord_echosign_parent_record', 'custrecord_echosign_parent_type']);
                    	if(flds) {
                    		var tranType = flds['custrecord_echosign_parent_type'];
                    		var tranInternalId = flds['custrecord_echosign_parent_record'];
                    		
                    		if(tranType && tranInternalId){
                    			var res = nlapiSearchRecord( tranType, null, [new nlobjSearchFilter('internalid', null, 'is', tranInternalId), new nlobjSearchFilter('mainline', null, 'is', 'T')], [new nlobjSearchColumn('internalid', 'file'), new nlobjSearchColumn('name', 'file')]);
                        		
                        		if(res && res.length){
                        			var asstFileField = form.addField('custpage_echosign_document_associated_files', 'select', 'Transaction Files');
                        			
                        			asstFileField.addSelectOption('', '', true);
                        			for(var i=0; i < res.length; i++)
                        				asstFileField.addSelectOption(res[i].getValue('internalid', 'file'), res[i].getValue('name', 'file'));
                        			
                        			form.insertField(asstFileField, 'custrecord_echosign_agreement');
                                	
                        		}
                    		}
                    	}
                	}
            	}
            } catch (e) {
                nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
				//args(Error object, script name, receipients, author Employee Id)
            	Util.handleError(e, 'TEMPLATE-UserEventManagerScript-CS.js', ['somebody@client.com'], nlapiGetUser());
            }
        }
    };
})();