/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSDealContactUserEvent.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2012/03/22
 *
 * Copyright (c) 2012 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

if (!this.SRS) {
	this.SRS = {};
}

//
//  beforeLoad:  This script runs prior to the loading of the deal contact record.
//

function beforeLoad(type, form) {
	nlapiLogExecution('DEBUG', 'SRSDealContactUserEvent.beforeLoad', 'Starting SRSDealContactUserEvent.beforeLoad... ');
	if(type == 'view' || type == 'edit') {
		try {
            var targetVals = new Object();
			if(nlapiGetFieldValue('custrecord60') != null && nlapiGetFieldValue('custrecord60') != 0) {
				var tempContact = nlapiLoadRecord('contact',nlapiGetFieldValue('custrecord60'));
				targetVals["contact"] = nlapiGetFieldValue('custrecord60');
				if(tempContact.getFieldValue('company') != null && tempContact.getFieldValue('company') != 0) {
					targetVals["firm"] = tempContact.getFieldValue('company');
				}
				
			}
			if(nlapiGetFieldValue('custrecord_orig_opp') != null && nlapiGetFieldValue('custrecord_orig_opp') != 0) {
				targetVals["opportunity"] = nlapiGetFieldValue('custrecord_orig_opp');
			}
			if(nlapiGetFieldValue('custrecord59') != null && nlapiGetFieldValue('custrecord59') != 0) {
				targetVals["deal"] = nlapiGetFieldValue('custrecord59');
			}
			nlapiSetFieldValue('custrecord_deal_contact_last_memo',getLastMemoFieldValue('deal',nlapiGetFieldValue('custrecord59'),targetVals));
        } catch (e) {
			SRS.Utility.processError('ERROR','SRSDealContactUserEvent.beforeLoad',e);
			nlapiLogExecution('ERROR',"SRSDealContactUserEvent.beforeLoad","Error retrieving deal contact notes.");	
        };
		
	}
	
}