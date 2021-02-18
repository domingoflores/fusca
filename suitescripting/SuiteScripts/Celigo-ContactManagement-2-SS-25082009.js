/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       User Event(After Submit)
 *
 * Purpose: User creates or updates instance of Shareholder Pro Rata CR
			# System determines if all Contacts, which are children of the "Shareholder" Customer are attached to the "Escrow" Customer, 
				and if not, attaches each one, using the Contact Role "Shareholder"
			# If the "Child Of" field on the "Shareholder" Customer contains a reference to another Customer, 
				the Contacts of that Customer are also attached in the same manner described above
			# For all of the Contacts identified in step 2 and step 3, ensure the same Contacts are in the Escrow Contact 
				CR for the same "Escrow" Customer, with the role "Shareholder" where the "Escrow" Customer record is identified in the "Shareholder Pro Rata" CR in the "Escrow" field
				   1. If the Contact is found in the "Escrow Contact" CR, ensure the "Shareholder" role is selected.
				   2. If the Contact is not found in the "Escrow Contact" CR, add the contact with the "Shareholder" role
				         1. escrow_contact.role = "Shareholder"
				         2. escrow_contact.escrow = shareholder_pro_rata.escrow
				         3. escrow_contact.contact = shareholder_pro_rata.shareholder[].contact[i]
 *    
 *
 * Revisions:
 *   25/08/2009 - Initial version
 *   11/09/2009 - updated requirments - changed contact roles
 *
 */
 var SRS = {};
SRS.ShareholderProRata = (function(){ //private members

	function ShareholderProRataManager(){
		var recordId;
		
		this.getRecordId = function() {
			return recordId;
		};
		
		this.setRecordId = function(mutator){
			(mutator) ? recordId = mutator : recordId = null;
		};
		
		
		this.managingContacts = function(){
			var shareHolderPRRecord = nlapiGetNewRecord();
			Util.log('Record Id ==> ' + shareHolderPRRecord.getId());
			this.setRecordId(shareHolderPRRecord.getId());
			var shareHolderPRRecordCustomer = nlapiGetFieldValue('custrecordshareholder');
			var escrowCustomer = nlapiGetFieldValue('custrecordescrow');
			if(shareHolderPRRecordCustomer && escrowCustomer) {
				var searchresults = nlapiSearchRecord('contact', null, new nlobjSearchFilter('company', null, 'is', shareHolderPRRecordCustomer), null);
				
				if(searchresults != null && searchresults.length > 0){
					if(nlapiGetContext().getRemainingUsage() > (50 * searchresults.length)){
						for(var r = 0; r < searchresults.length; r++){
							var prams = [];
							prams['role'] = '24';
							nlapiAttachRecord('contact', searchresults[r].getId(), 'customer', escrowCustomer, prams);
							this.processEscrowContact(searchresults[r].getId(), escrowCustomer);
						}
					}else {
						this.calledSheduledscript();
					}
				}
				var parentCustomer = nlapiLookupField('customer', shareHolderPRRecordCustomer, 'parent', null);
				if(parentCustomer) {
					var searchresultsParent = nlapiSearchRecord('contact', null, new nlobjSearchFilter('company', null, 'is', parentCustomer), null);
					if(searchresultsParent != null && searchresultsParent.length > 0){
						if(nlapiGetContext().getRemainingUsage() > (50 * searchresultsParent.length)){
							for(var p = 0; p < searchresultsParent.length; p++){
								var prams = [];
								prams['role'] = '24';
								nlapiAttachRecord('contact', searchresultsParent[p].getId(), 'customer', escrowCustomer, prams);
								this.processEscrowContact(searchresultsParent[p].getId(), escrowCustomer);
							}
						}else {
							this.calledSheduledscript();
						}
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
				if(nlapiGetContext().getRemainingUsage() > (10 * escrowRecords.length)){
					for(var t = 0 ; t < escrowRecords.length; t++){
							var contactRole = escrowRecords[t].getValue('custrecord61');
							if(!contactRole || contactRole != '22') {
								nlapiSubmitField('customrecord16', escrowRecords[t].getId(), 'custrecord61', '22', null);
							}
					}
				}else {
					this.calledSheduledscript();
				}
			}else {
				escrowNewrecord = nlapiCreateRecord('customrecord16');
				
				if(Util.validateReferenceKey('customer', customer)){
					escrowNewrecord.setFieldValue('custrecord59', customer);
				}else{
					Util.log('Invalid value for Escrow Customer');
				}
				if(Util.validateReferenceKey('contact', contact)){
					escrowNewrecord.setFieldValue('custrecord60', contact);
				}else{
					Util.log('Invalid value for contact');
				}
				escrowNewrecord.setFieldValue('custrecord61', '22');
				escrowNewrecord.setFieldValue('custrecord_esc_con_roles', '22');
				var newRecordId = nlapiSubmitRecord(escrowNewrecord, true, true);
				Util.log('New Record Id ' + newRecordId);
			}
		};
		
		this.calledSheduledscript = function () {
			Util.log('Sheduled script called');
			var param = [];
			param['custscript_record_id'] = this.getRecordId();
			nlapiScheduleScript('35', '1', param);
		}
		
		
	}
	return { //public members
		afterSubmit: function(type, form){
			try {
				Util.log('type = '+ type.toLowerCase() );
				if(type.toLowerCase() === 'create' || type.toLowerCase() === 'edit') {
					var shareholderPR = new ShareholderProRataManager();
					shareholderPR.managingContacts();
				}
			} 
			catch (e) {
				Util.handleError(e, 'Celigo-ContactManagement-2-SS-25082009.js', ['nisansala@celigo.com'], '-5');
			}
		},
	}
})();