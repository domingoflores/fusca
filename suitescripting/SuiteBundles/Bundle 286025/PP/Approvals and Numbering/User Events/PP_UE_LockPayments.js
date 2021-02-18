/**
 * This User Event script locks the edit form when approvals are turned on. It also
 * adds a void button to the payments view screen if payment is locked by approvals
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Dec 2012     Jay
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord vendorpayment
 * @appliedtorecord customerrefund
 * @appliedtorecord check
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	try{
		var enable_approvals = nlapiLoadConfiguration('companypreferences').getFieldValue('custscript_enable_approvals') == 'T' ? true : false;
		if(enable_approvals){
			var recid = nlapiGetRecordId();
			var accountingPeriodsEnabled = nlapiGetContext().getFeature('ACCOUNTINGPERIODS'); 

			if(type == "edit" && PPSLibApprovals.paymentIsApproved(recid)){
				nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), recid);
			}
			
			if(type == 'view' && (!accountingPeriodsEnabled || nlapiLookupField('transaction',recid,'accountingperiod.closed') == 'F' )){
				// NetSuite does not display a Void button on view if REVERSALVOIDING feature is not on.
				// If approvals are enabled and the payment is locked, we add a Void button to the view page
				// otherwise there is no way to void the payment.
				if(nlapiGetFieldValue('voided') == 'F' && nlapiGetContext().getPreference('REVERSALVOIDING') == 'F'){
					form.addButton('custpage_void','Void',"ppDoVoid();");
					var script = '<script type="text/javascript">function ppDoVoid(){if(confirm("Are you sure you want to void this transaction?")){try{var voidHelpURL = nlapiResolveURL("SUITELET", "customscript_pp_sl_send_void_to_pps", "customdeploy_pp_sl_send_void_to_pps"); nlapiRequestURL(voidHelpURL,{tranid : nlapiGetRecordId()})}catch(o){console.log(o);if(o.name == "INSUFFICIENT_PERMISSION"){alert(o.message + ". Please have your administrator give you access to Avid SL Send Void To PPS script deployment and try again.");}else{alert("An error occurred while trying to void this transaction. "+o.message)}}location.reload();}}</script>'
					var vs = form.addField('custpage_voidscript','inlinehtml','Void Script');
					vs.setDefaultValue(script);
				}
			}
			
		}else{
			nlapiLogExecution('debug', 'userEventBeforeLoad', 'Approvals are disabled.');
		}
	}catch(e){
		nlapiLogExecution('debug', 'userEventBeforeLoad', e.message);
	}
}
