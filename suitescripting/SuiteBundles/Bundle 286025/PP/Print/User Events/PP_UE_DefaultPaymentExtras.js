/**
 * NetSuite does not trigger a user event script or workflow when a check is created from a cash refund.
 * This script caclulates and sets the check's default payment method and approval settings
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Jan 2015     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord refundcheck
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	nlapiLogExecution('DEBUG','userEventAfterSubmit','start');
	try{
		// Check can be created from a cash refund both on create and edit
		if(type == 'create' || type == 'edit'){ 
			var recordId = nlapiGetRecordId();
			var refundCheck = nlapiGetFieldValue('refundcheck');
			if(refundCheck == 'T'){
				var filters = [];
				var columns = [];
				
				// Note: The record with the createdfrom field set is not the mainline record
				filters.push(new nlobjSearchFilter('createdfrom', null, 'anyof',recordId));
				filters.push(new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof','@NONE@'));
				
				var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
				if(searchResults){
					var sr = searchResults[0];
					var rec = nlapiLoadRecord(sr.getRecordType(),sr.getId());
					
					// Calc and set default approval status and flag
					var defaultApprovalStatus = PPSLibApprovals.findDefaultApprovalStatus(rec.getFieldValue('total'),rec.getFieldValue('account'));
					var deafaultApprovalStatusId = null;
					var isApprovedFlag = 'F';
					if(defaultApprovalStatus){
						deafaultApprovalStatusId = defaultApprovalStatus.getId();
						if(PPSLibApprovals.isApprovedStatus(deafaultApprovalStatusId)){
							isApprovedFlag = 'T';
						}
					}
					
					rec.setFieldValue('custbody_pp_approval_status',deafaultApprovalStatusId);
					rec.setFieldValue(CAC_IS_APPROVED_ID,isApprovedFlag);
					
					// Set default payment method
					var paymentMethodSettings = $PPS.Transaction.getEntityPaymentMethodSettings(rec.getFieldValue('entity'),rec.getFieldValue('account'));
					
					rec.setFieldText('custbody_pp_payment_method', paymentMethodSettings.defaultPaymentMethod);
					if(paymentMethodSettings.defaultPaymentMethod == 'ACH'){
						rec.setFieldValue('custbody_pp_ach_account', paymentMethodSettings.primACHAcctId);
					}
					
					// save record with isDoSourcing false and ignoreManditory true because we are trying to do like NetSuite do
					// and cause the fewest ripples possible
					nlapiSubmitRecord(rec,false,true);
				}
			}
		}
	}
	catch(e){
		nlapiLogExecution('ERROR', 'Error setting default payment method for check', e.toString());
	}
	
	nlapiLogExecution('DEBUG','userEventAfterSubmit','end');
}