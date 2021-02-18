/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       User Event(After Submit)
 *
 * Purpose:    1. User creates or updates instance of Major Shareholder CR
  			   2. System determines if the "Major Shareholder Contact" is attached to the "Escrow" Customer, and if not, attaches it, using the Contact Role "Shareholder"
   			   3. Ensure the "Major Shareholder Contact" is in some Escrow Contact CR instance as an "Escrow Contact" for the same "Escrow" Customer, with the role "Major Shareholder" 
         			1. If the Contact is found in the "Escrow Contact" CR, ensure the "Major Shareholder" role is selected.
         			2. If the Contact is not found in the "Escrow Contact" CR, add the contact with the "Major Shareholder" role
               			1. escrow_contact.role = "Major Shareholder"
               			2. escrow_contact.escrow = major_shareholder.escrow
               			3. escrow_contact.contact = major_shareholder.contact

 *    
 *
 * Revisions:
 *   25/08/2009 - Initial version
 *
 */
 var SRS = {};
SRS.MajorShareholder = (function(){ //private members

	function MajorShareholderManager(){
	
		this.managingContacts = function(){
			var shareHolderPRRecord = nlapiGetNewRecord();
			Util.log('Record Id ==> ' + shareHolderPRRecord.getId());
			var shareHolderContact = nlapiGetFieldValue('custrecord_ms_contact');
			var escrowCustomer = nlapiGetFieldValue('custrecord15');
				
			if(shareHolderContact && escrowCustomer) {
				var prams = [];
				prams['role'] = '23';
				nlapiAttachRecord('contact', shareHolderContact, 'customer', escrowCustomer, prams);
				this.processEscrowContact(shareHolderContact, escrowCustomer)
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
				if(Util.validateReferenceKey('contact', contact)){
					escrowNewrecord.setFieldValue('custrecord60', contact);
				}else{
					Util.log('Invalid value for contact');
				}
				if(Util.validateReferenceKey('customer', customer)){
					escrowNewrecord.setFieldValue('custrecord59', customer);
				}else{
					Util.log('Invalid value for Escrow Customer');
				}
				escrowNewrecord.setFieldValue('custrecord61', '18');
				escrowNewrecord.setFieldValue('custrecord_esc_con_roles', '18');
				var newRecordId = nlapiSubmitRecord(escrowNewrecord, true, true);
				Util.log('New Record Id = ' + newRecordId);
			}
		}
		
		
	}
	return { //public members
		afterSubmit: function(type, form){
			try {
				if(type.toLowerCase() === 'create' || type.toLowerCase() === 'edit') {
					var MajorSH = new MajorShareholderManager();
					MajorSH.managingContacts();
				}
			} 
			catch (e) {
				Util.handleError(e, 'Celigo-ContactManagement-3-SS-25082009.js', ['nisansala@celigo.com'], '-5');
			}
		},
	}
})();