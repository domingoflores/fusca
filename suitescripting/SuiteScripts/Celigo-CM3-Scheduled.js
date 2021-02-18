/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       Scheduled
 *
 * Purpose: 
 *    update all previously undefined relationships for major shareholder
 *
 * Revisions:
 *    08/28/2009 - Initial version
 *
 */

var SRS = {};
SRS.MajorShareholderSS = (function(){ //private members
	
	function MajorShareholderSS(){

		this.processMajorShareholderContacts = function(){
			var filters = [];
			filters[0] = new nlobjSearchFilter('custrecord_to_update_ms', null, 'is', 'T', null);
			
			var searchResults = nlapiSearchRecord('customrecord12', null, filters, null);
			if(searchResults && searchResults.length > 0) {
				for(var k = 0; k < searchResults.length; k++) {
					if(nlapiGetContext().getRemainingUsage() > 20){
						var majorShareholderRecord = nlapiLoadRecord('customrecord12', searchResults[k].getId());
						var escrowCustomer = majorShareholderRecord.getFieldValue('custrecord15');
						var shareHolderContact = majorShareholderRecord.getFieldValue('custrecord_ms_contact');
						if(shareHolderContact && escrowCustomer) {
							var prams = [];
							prams['role'] = '20';
							nlapiAttachRecord('contact', shareHolderContact, 'customer', escrowCustomer, prams);
							this.processEscrowContact(shareHolderContact, escrowCustomer)
						}
						
						nlapiSubmitField('customrecord12', searchResults[k].getId(), 'custrecord_to_update_ms', 'F', null);
					}
				}
			}
		};
		
		this.processEscrowContact = function (contact, customer) {
			var filters = [];
			filters[0] = new nlobjSearchFilter('custrecord60', null , 'is', contact, null);
			filters[1] = new nlobjSearchFilter('custrecord59', null , 'is', customer, null);
			
			var columns = [];
			columns[0] = new nlobjSearchColumn('custrecord61');
			var escrowRecords = nlapiSearchRecord('customrecord16', null, filters, columns);
			if(escrowRecords != null && escrowRecords.length > 0) {
				for(var t = 0 ; t < escrowRecords.length; t++){
					var contactRole = escrowRecords[t].getValue('custrecord61');
					if(!contactRole || contactRole != '18') {
						nlapiSubmitField('customrecord16', escrowRecords[t].getId(), 'custrecord61', '18', null);
					}
				}
			}else {
				escrowNewrecord = nlapiCreateRecord('customrecord16');
				escrowNewrecord.setFieldValue('custrecord60', contact);
				escrowNewrecord.setFieldValue('custrecord59', customer);
				escrowNewrecord.setFieldValue('custrecord61', '18');
				escrowNewrecord.setFieldValue('custrecord_esc_con_roles', '18');
				var newRecordId = nlapiSubmitRecord(escrowNewrecord, true, true);
				Util.log('New Record Id = ' + newRecordId);
			}
		}
		
	}
	return { //public members
		main: function(type){

			try {
				var majorSH = new MajorShareholderSS();
				majorSH.processMajorShareholderContacts();
			} 
			catch (e) {
				Util.handleError(e, 'Celigo-CM3-Scheduled.js', ['nisansala@celigo.com'], '-5');
			}
		}
	}
})();


