/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       User Event(After Submit)
 *
 * Purpose: User creates or updates instance of Escrow Contact CR
 			System looks up the Customer present in the "Escrow" fiel
 			System determines if the Contact in the "Escrow Contact" field is attached to that Customer, 
 				and if not, will attach it, using the Contact Role "Escrow Contact" (internal id 22)
 *    
 *
 * Revisions:
 *   18/08/2009 - Initial version
 *
 */
 var SRS = {};
SRS.EscrowContact = (function(){ //private members

	function EscrowContactManager(){
	
		this.managingContacts = function(){
			var escrowRecord = nlapiGetNewRecord();
			Util.log("Escrow record Id = " + escrowRecord.getId());
			var escrowCustomer = nlapiGetFieldValue('custrecord59');
			if(escrowCustomer) {
				var escrowContact = nlapiGetFieldValue('custrecord60');
				var isExist = false;
				if(escrowContact) {
					var customerRecord = nlapiLoadRecord('customer',escrowCustomer);
					var contactRecord = nlapiLoadRecord('contact',escrowContact);
					var companyId = contactRecord.getFieldValue('company');
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
			
		};
		
		
	}
	return { //public members
		afterSubmit: function(type, form){
			try {
				if(type.toLowerCase() === 'create' || type.toLowerCase() === 'edit') {
					var escrow = new EscrowContactManager();
					escrow.managingContacts();
				}
			} 
			catch (e) {
				Util.handleError(e, 'Celigo-ContactManagement-1-SS-18082009.js', ['nisansala@celigo.com'], '-5');
			}
		},
	}
})();