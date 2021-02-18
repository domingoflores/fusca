/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       Scheduled
 *
 * Purpose: 
 *    update all previously undefined relationships for Shareholder Pro Rata 
 *
 * Revisions:
 *    08/28/2009 - Initial version
 *
 */

var SRS = {};
SRS.ShareholderProRataSS = (function(){ //private members
	
	function ShareholderProRataSS(){

		this.processShareholderProRataContacts = function(){
			var filters = [];
			filters[0] = new nlobjSearchFilter('internalid', null, 'is', nlapiGetContext().getSetting('SCRIPT', 'custscript_record_id'), null);
			
			var searchResultsPR = nlapiSearchRecord('customrecordespr', null, filters, null);
			if(searchResultsPR && searchResultsPR.length > 0) {
				for(var k = 0; k < searchResultsPR.length; k++) {
					if(nlapiGetContext().getRemainingUsage() > 90){
						var shareholderPRRecord = nlapiLoadRecord('customrecordespr', searchResultsPR[k].getId());
						var shareHolderPRRecordCustomer = shareholderPRRecord.getFieldValue('custrecordshareholder');
						var escrowCustomer = shareholderPRRecord.getFieldValue('custrecordescrow');
					
						if(shareHolderPRRecordCustomer && escrowCustomer) {
							var searchresults = nlapiSearchRecord('contact', null, new nlobjSearchFilter('company', null, 'is', shareHolderPRRecordCustomer), null);
							if(searchresults != null && searchresults.length > 0){
								for(var r = 0; r < searchresults.length; r++){
									var prams = [];
									prams['role'] = '24';
									nlapiAttachRecord('contact', searchresults[r].getId(), 'customer', escrowCustomer, prams);
									this.processEscrowContact(searchresults[r].getId(), escrowCustomer);
								}
							}
							
							var parentCustomer = nlapiLookupField('customer', shareHolderPRRecordCustomer, 'parent', null);
							if(parentCustomer) {
								var searchresultsParent = nlapiSearchRecord('contact', null, new nlobjSearchFilter('company', null, 'is', parentCustomer), null);
								if(searchresultsParent != null && searchresultsParent.length > 0){
									for(var p = 0; p < searchresultsParent.length; p++){
										var prams = [];
										prams['role'] = '24';
										nlapiAttachRecord('contact', searchresultsParent[p].getId(), 'customer', escrowCustomer, prams);
										this.processEscrowContact(searchresultsParent[p].getId(), escrowCustomer);
									}
								}
							}
						}
						
						nlapiSubmitField('customrecordespr', searchResultsPR[k].getId(), 'custrecord_to_update_pr', 'F', null);
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
					if(!contactRole || contactRole != '22') {
						nlapiSubmitField('customrecord16', escrowRecords[t].getId(), 'custrecord61', '22', null);
					}
				}
			}else {
				escrowNewrecord = nlapiCreateRecord('customrecord16');
				if(Util.validateReferenceKey('contact', contact)){
					escrowNewrecord.setFieldValue('custrecord60', contact);
				}else{
					util.log('Invalid Contact record id '+ contact);
				}
				if(Util.validateReferenceKey('customer', customer)){
					escrowNewrecord.setFieldValue('custrecord59', customer);
				}else{
					util.log('Invalid Customer record id '+ customer);
				}
				escrowNewrecord.setFieldValue('custrecord61', '22');
				escrowNewrecord.setFieldValue('custrecord_esc_con_roles', '22');
				var newRecordId = nlapiSubmitRecord(escrowNewrecord, true, true);
				Util.log('New Record Id = ' + newRecordId);
			}
		}
		
	}
	return { //public members
		main: function(type){

			try {
				var shareholderPR = new ShareholderProRataSS();
				shareholderPR.processShareholderProRataContacts();
			} 
			catch (e) {
				Util.handleError(e, 'Celigo-CM2-Scheduled.js', ['nisansala@celigo.com'], '-5');
			}
		}
	}
})();


