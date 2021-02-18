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

EchoSignUpdateBrokenLinksToBeFixed = (function(myContext) { 

	var entityStatusToStage = function(status) {
		return status.substr(0, status.indexOf('-'));
	};
	
	return {
		beforeSubmit: function(type) {
			if (type == 'edit') {
				
				nlapiLogExecution('debug', nlapiGetRecordType(), nlapiGetRecordId());
				
				var oldEntityStatus = nlapiGetOldRecord() ? nlapiGetOldRecord().getFieldText('entitystatus') : '',
					newEntityStatus = nlapiGetFieldText('entitystatus');
				nlapiLogExecution('debug', 'old entitystatus', oldEntityStatus);
				nlapiLogExecution('debug', 'new entitystatus', newEntityStatus);
				
				var oldStage = entityStatusToStage(oldEntityStatus),
					newStage = entityStatusToStage(newEntityStatus);
				nlapiLogExecution('debug', 'old stage', oldStage);
				nlapiLogExecution('debug', 'new stage', newStage);
				
				if (oldStage && newStage && oldStage !== newStage) {
					nlapiSetFieldValue('custentity_echosign_fix_link_is_processe', 'F');
				}
			}
		}
	};
	
})();

function beforeSubmit(type) {
	EchoSignUpdateBrokenLinksToBeFixed.beforeSubmit(type);
}