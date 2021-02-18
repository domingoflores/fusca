/**
 * Displays a list of links to the many process and reprocess payments screens
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Dec 2014     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
		var context = nlapiGetContext();
		
		var list = nlapiCreateList('AvidXchange Payment Processing', false);
		list.addColumn('link', 'text', 'Link');
		
		var action = context.getSetting('SCRIPT','custscript_pp_process_action');
		var ppEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp');
		var apnEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_apn_network');
		var wachEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_wach');
		
		if(action == 'process'){
			if(ppEnabled == 'F' && wachEnabled == 'F' && apnEnabled == 'F'){
				// redirect user to regular process payments screen 
				return response.sendRedirect('SUITELET', 'customscript_pp_sl_processpayments','customdeploy_pp_sl_processpayments');
			}
			else{
				list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_processpayments')+'">Process Payments</a>'});
				if(apnEnabled == 'T'){
					list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_process_apn_payments','customdeploy_pp_sl_process_apn_payments')+'">AvidPay Network Payments</a>'});
				}
				if(ppEnabled == 'T'){
					list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_process_paypal_payments','customdeploy_pp_process_paypal_payments')+'">PayPal Payments</a>'});
				}
				if(wachEnabled == 'T'){
					list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_wach')+'">Process Withdrawal ACH</a>'});
				}
				
			}
			
		}
		else if(action == 'reprocess'){
			if(wachEnabled == 'F'){
				// redirect user to regular process payments screen 
				return response.sendRedirect('SUITELET', 'customscript_pp_sl_processpayments','customdeploy_pp_sl_reprocesspayments');
			}
			else{
				list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_reprocesspayments')+'">Reprocess Payments</a>'});
				
				if(wachEnabled == 'T'){
					list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_rwach')+'">Reprocess Withdrawal ACH</a>'});
				}
			}
		}
		else{
			throw "Invalid process action";
		}
		response.writePage(list);
}
