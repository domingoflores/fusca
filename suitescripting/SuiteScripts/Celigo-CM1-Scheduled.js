/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       Scheduled
 *
 * Purpose: 
 *    update all previously undefined relationships
 *
 * Revisions:
 *    08/25/2009 - Initial version
 *
 */

var SRS = {};
SRS.EscrowContactSS = (function(){ //private members
	
	function EscrowContactSS(){

		this.processEscrowContacts = function(){
			var filters = [];
			filters[0] = new nlobjSearchFilter('custrecord_to_update_ec', null, 'is', 'T', null);
			
			var searchResults = nlapiSearchRecord('customrecord16', null, filters, null);
			if(searchResults && searchResults.length > 0) {
				for(var k = 0; k < searchResults.length; k++) 
					if(nlapiGetContext().getRemainingUsage() > 20){
						var escrowContactRecord = nlapiLoadRecord('customrecord16', searchResults[k].getId());
						var escrowCustomer = escrowContactRecord.getFieldValue('custrecord59');
						if(escrowCustomer) {
							var escrowContact = escrowContactRecord.getFieldValue('custrecord60');
							var isExist = false;
							if(escrowContact) {
								var companyId = nlapiLookupField('contact',escrowContact, 'company', null);
								var isExist = false;
								if(companyId === escrowCustomer){
									isExist = true;
								}
						
								if(!isExist){
									var prams = [];
									prams['role'] = '22';
									nlapiAttachRecord('contact', escrowContact, 'customer', escrowCustomer, prams);
								}
							}
						}
						nlapiSubmitField('customrecord16', searchResults[k].getId(), 'custrecord_to_update_ec', 'F', null)
					}
				}
			}
		};
		
	}
	return { //public members
		main: function(type){

			try {
				var ecSS = new EscrowContactSS();
				ecSS.processEscrowContacts();
			} 
			catch (e) {
				Util.handleError(e, 'Celigo-CM1-Scheduled.js', ['nisansala@celigo.com'], '-5');
			}
		}
	}
})();


