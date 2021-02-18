/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Apr 2013     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customer
 * @appliedtorecord vendor
 * @appliedtorecord employee
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
$PPS.debug = true;
$PPS.where = "PP_UE_entity";
var customFields = ['custentity_pp_ach_account_number','custentity_pp_ach_payee_email',
                    //'custentity_pp_ach_deposit_withdrawal',
                    'custentity_pp_ach_routing_number','custentity_pp_ach_sec_code',
                    'custentity_pp_ach_transaction_code', 'custentity_pp_gl_account_number','custentity_pp_comment',
                    'custentity_pp_custom_line_1','custentity_pp_custom_line_2','custentity_pp_custom_line_3',
                    'custentity_pp_iso_dest_curr_code','custentity_pp_iso_dest_ctry_code','custentity_pp_receiving_dfi_name',
                    'custentity_pp_receiving_dfi_id_qualifier','custentity_pp_receiving_dfi_id_number','custentity_pp_receiving_dfi_br_ctry_code',
                    'custentity_pp_trans_type_code'
                    ];

function userEventBeforeLoad(type, form, request){
	$PPS.log(type);
	if(type == 'edit' || type == 'view' || type == 'create'){
		try{
			
			forceRebrandEntityForm(form);
			
			// Hide deprecated custom fields
			for(var i = 0; i < customFields.length; i++){
				$PPS.setDisplayType(form.getField(customFields[i]),'hidden');
			}
			
			// Hide our custom printoncheckas field for customers
			var recordType = nlapiGetRecordType();
			if(recordType.toLowerCase() == 'customer'){
				$PPS.setDisplayType(form.getField('custentity_pp_printoncheckas'),'hidden');
			}
			
			// disable "ACH Enabled" checkbox if no ACH Account records exist
			var numACHAccounts = nlapiGetLineItemCount('recmachcustrecord_pp_ach_entity');
			if(numACHAccounts <= 0 && nlapiGetContext().getExecutionContext() != 'webservices'){
				$PPS.setDisplayType(form.getField('custentity_pp_ach_enabled'),'disabled');
			}
			
			// hide paypal fields if not enabled
			var paypalEnabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp') == 'T';
			if(!paypalEnabled){
				$PPS.setDisplayType(form.getField('custentity_pp_paypal_enabled'),'hidden');
				$PPS.setDisplayType(form.getField('custentity_pp_paypal_email'),'hidden');
			}
			
			// hide apn enabled checkbox if apn company preference is not enabled
			var apnEnabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_apn_network') == 'T';
			if(!apnEnabled){
				$PPS.setDisplayType(form.getField('custentity_pp_apn_enabled'),'hidden');
			}
			
			
			// hide AVIDINVOICE VENDOR ACCOUNT NUMBER OVERRIDE checkbox if avidinvoice is not enabled
			var aiEnabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'T';
			if(!aiEnabled){
				$PPS.setDisplayType(form.getField('custentity_pp_ai_acct_num_override'),'hidden');
			}
		}
		catch(e){
			nlapiLogExecution('ERROR', e.name, e.toString());
		}
	}
}

function userEventBeforeSubmit(type){
	try{
		if(type == 'edit' || type == 'create'){
			var recordType = nlapiGetRecordType();
			if(recordType.toLowerCase() == 'customer'){
				var poca = nlapiGetFieldValue('printoncheckas');

				if(poca != null){
					nlapiSetFieldValue('custentity_pp_printoncheckas',poca);
				}
			}
		}
	}
	catch(e){
		nlapiLogExecution('ERROR', e.name, e.toString());
	}
	
}


/**
 * Rebrand Piracle Pay to AvidXchange since bundle update will not force label updates on custom forms
 */
function forceRebrandEntityForm(form){
	var tabs = form.getTabs();
	for(var i = 0; i < tabs.length; i++){
		var tab = form.getTab(tabs[i]);
		if(tab.getLabel().toLowerCase() == "piracle pay"){
			tab.setLabel('AvidXchange');
			break;
		}
	}
	
	var excludeField = form.getField('custentity_pp_exclude_from_pp');
	if(excludeField && excludeField.getLabel().match(/^exclude from piracle pay/i)){
		excludeField.setLabel('Exclude From AvidXchange Payments');
	}
	
	var achSublist = form.getSubList('recmachcustrecord_pp_ach_entity');
	if(achSublist && achSublist.getLabel().match(/^piracle pay ach account/i)){
		achSublist.setLabel('Avid ACH Accounts');
	}
}