/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : coastal_cc_validation.js 
* @ AUTHOR        : Upaya - The Solution
* @ DATE          : 2011/07/18
*
* Copyright (c) 2007 Upaya - The Solution Inc.
* 10530 N. Portal Avenue, Cupertino CA 95014
* All Rights Reserved.
*
* This software is the confidential and proprietary information of 
* Upaya - The Solution Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with Upaya.
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


var fx = 'chooseCardType';
function chooseCardType(type, name)
{
	try
	{
		var customercenter = nlapiGetContext().getExecutionContext();
		var cust = nlapiGetDepartment();
		var role = nlapiGetRole();
		var custid = nlapiGetUser();
		var email = '';
		var accessrole = '';
		nlapiLogExecution('DEBUG','customercenter',' customercenter '+customercenter+' cust '+cust+' role '+role+' custid '+custid+' accessrole '+accessrole+' email '+email);
		var ACH = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_ach'));
		var ccpayment1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_1'));
		var ccpayment2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_2'));
		var ccpayment3 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_3'));
		var ccpayment4 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_4'));
		
			if(name == 'paymentmethod'){
				if(((nlapiGetFieldValue('paymentmethod') == ccpayment1)&&(ccpayment1)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment2)&&(ccpayment2)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment3)&&(ccpayment3)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment4)&&(ccpayment4))){
					nlapiDisableField('custbody_upaya_select_cc', false);
					nlapiDisableField('custbody_upaya_ach_usa', true);
					nlapiDisableField('custbody_upaya_ach_order_id', true);
					nlapiDisableField('custbody_upaya_ach_refund', true);
					nlapiDisableField('custbody_upaya_ach_charged', true);
					nlapiDisableField('custbody_upaya_ach_message', true);
					nlapiDisableField('custbody_upaya_ach_usa_cp', true);
					nlapiDisableField('custbody_upaya_select_cc_2', false);
					
					nlapiDisableField('custbody_upaya_cvv_number', false);
					nlapiDisableField('custbody_upaya_cc_approved', true);
					nlapiDisableField('custbody_upaya_cc_rejected', true);
					nlapiDisableField('custbody_upaya_cc_order_id', true);
					nlapiDisableField('custbody_upaya_cc_voided', true);
					nlapiDisableField('custbody_upaya_cc_charged', true);
					nlapiDisableField('custbody_upaya_cc_refund', true);
					nlapiDisableField('custbody_upaya_cc_message', true);
					
					
				}
				else if((nlapiGetFieldValue('paymentmethod') == ACH) && (ACH))	
				{
					nlapiDisableField('custbody_upaya_ach_usa', false);
					nlapiDisableField('custbody_upaya_select_cc', true);
					nlapiDisableField('custbody_upaya_cvv_number', true);
					nlapiDisableField('custbody_upaya_cc_approved', true);
					nlapiDisableField('custbody_upaya_cc_rejected', true);
					nlapiDisableField('custbody_upaya_cc_order_id', true);
					nlapiDisableField('custbody_upaya_cc_voided', true);
					nlapiDisableField('custbody_upaya_cc_charged', true);
					nlapiDisableField('custbody_upaya_cc_refund', true);
					nlapiDisableField('custbody_upaya_cc_message', true);
					nlapiDisableField('custbody_upaya_select_cc_2', true);
					nlapiDisableField('custbody_upaya_ach_usa_cp', false);
					nlapiDisableField('custbody_upaya_ach_order_id', true);
					nlapiDisableField('custbody_upaya_ach_refund', true);
					nlapiDisableField('custbody_upaya_ach_charged', true);
					nlapiDisableField('custbody_upaya_ach_message', true);
				}
				else
				{
					nlapiDisableField('custbody_upaya_ach_usa', true);
					nlapiDisableField('custbody_upaya_select_cc', true);
					nlapiDisableField('custbody_upaya_cvv_number', true);
					nlapiDisableField('custbody_upaya_cc_approved', true);
					nlapiDisableField('custbody_upaya_cc_rejected', true);
					nlapiDisableField('custbody_upaya_cc_order_id', true);
					nlapiDisableField('custbody_upaya_cc_voided', true);
					nlapiDisableField('custbody_upaya_cc_charged', true);
					nlapiDisableField('custbody_upaya_cc_refund', true);
					nlapiDisableField('custbody_upaya_cc_message', true);
					nlapiDisableField('custbody_upaya_ach_usa_cp', true);
					nlapiDisableField('custbody_upaya_ach_order_id', true);
					nlapiDisableField('custbody_upaya_ach_refund', true);
					nlapiDisableField('custbody_upaya_ach_charged', true);
					nlapiDisableField('custbody_upaya_ach_message', true);
					nlapiDisableField('custbody_upaya_select_cc_2', true);
				}
			}
		//}// else 
	}//try
	catch(e){
		var errmsg = '';
		var err = '';
		if ( e instanceof nlobjError ){
			err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
		}
		else{
			err = 'Unexpected error: ' + e.toString();
		}
		errmsg += '\n' + err;
		nlapiLogExecution( 'ERROR',  fx + ' 999 Error', errmsg);
		return false;
	}
}


function defaultCardType(type)
{
	try
	{
		nlapiLogExecution('DEBUG','type',' type '+type);	
		if((type == 'create') || type == 'copy'){
				
				
			
				if(((nlapiGetFieldValue('paymentmethod') == ccpayment1)&&(ccpayment1)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment2)&&(ccpayment2)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment3)&&(ccpayment3)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment4)&&(ccpayment4))){
							nlapiDisableField('custbody_upaya_select_cc', false);
							nlapiDisableField('custbody_upaya_ach_usa', true);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', true);
							nlapiDisableField('custbody_upaya_select_cc_2', false);
							
							nlapiDisableField('custbody_upaya_cvv_number', false);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							
							
						}
						else if((nlapiGetFieldValue('paymentmethod') == ACH) && (ACH))	
						{
							nlapiDisableField('custbody_upaya_ach_usa', false);
							nlapiDisableField('custbody_upaya_select_cc', true);
							nlapiDisableField('custbody_upaya_cvv_number', true);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							nlapiDisableField('custbody_upaya_select_cc_2', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', false);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
						}
						else
						{
							nlapiDisableField('custbody_upaya_ach_usa', true);
							nlapiDisableField('custbody_upaya_select_cc', true);
							nlapiDisableField('custbody_upaya_cvv_number', true);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', true);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
							nlapiDisableField('custbody_upaya_select_cc_2', true);
						}
			}
			else if(type == 'edit')
			{
				var customercenter = nlapiGetContext().getExecutionContext();
				var cust = nlapiGetDepartment();
				var role = nlapiGetRole();
				var custid = nlapiGetUser();
				var email = '';
				var accessrole = '';
				nlapiLogExecution('DEBUG','customercenter',' customercenter '+customercenter+' cust '+cust+' role '+role+' custid '+custid+' accessrole '+accessrole+' email '+email);
				var ACH = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_ach'));
				var ccpayment1 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_1'));
				var ccpayment2 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_2'));
				var ccpayment3 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_3'));
				var ccpayment4 = nlapiEscapeXML(nlapiGetContext().getSetting('SCRIPT', 'custscript_cc_payment_4'));
				nlapiLogExecution('DEBUG','ACH',' ACH '+ACH+' ccpayment1 '+ccpayment1+' ccpayment2 '+ccpayment2+' ccpayment3 '+ccpayment3+' ccpayment4 '+ccpayment4+' payment method '+nlapiGetFieldValue('paymentmethod'));	
				
				if((role == 14) || (role == 1015) || (role == 1016))
				{
					//if(name == 'custbody_upaya_payment_method'){
						var paymenttype = nlapiGetFieldValue('custbody_upaya_payment_method');
						nlapiLogExecution('DEBUG','paymenttype',' paymenttype '+paymenttype);
						if(((nlapiGetFieldValue('custbody_upaya_payment_method') == ccpayment1)) || (nlapiGetFieldValue('custbody_upaya_payment_method') == ccpayment2) || (nlapiGetFieldValue('custbody_upaya_payment_method') == ccpayment3) || (nlapiGetFieldValue('custbody_upaya_payment_method') == ccpayment4)){
							nlapiDisableField('custbody_upaya_select_cc', false);
							nlapiDisableField('custbody_upaya_ach_usa', true);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', true);
							nlapiDisableField('custbody_upaya_select_cc_2', false);
							
							nlapiDisableField('custbody_upaya_cvv_number', false);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							
							
						}
						else if(nlapiGetFieldValue('custbody_upaya_payment_method') == ACH) 	
						{
							nlapiDisableField('custbody_upaya_ach_usa', false);
							nlapiDisableField('custbody_upaya_select_cc', true);
							nlapiDisableField('custbody_upaya_cvv_number', true);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							nlapiDisableField('custbody_upaya_select_cc_2', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', false);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
						}
						else
						{
							nlapiDisableField('custbody_upaya_ach_usa', true);
							nlapiDisableField('custbody_upaya_select_cc', true);
							nlapiDisableField('custbody_upaya_cvv_number', true);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', true);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
							nlapiDisableField('custbody_upaya_select_cc_2', true);
						}
					//}
				}
				else
				{
					//if(name == 'paymentmethod'){
					var paymentmethod = nlapiGetFieldValue('paymentmethod');
					nlapiLogExecution('DEBUG','paymentmethod',' paymentmethod '+paymentmethod);
						if(((nlapiGetFieldValue('paymentmethod') == ccpayment1)&&(ccpayment1)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment2)&&(ccpayment2)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment3)&&(ccpayment3)) || ((nlapiGetFieldValue('paymentmethod') == ccpayment4)&&(ccpayment4))){
							nlapiDisableField('custbody_upaya_select_cc', false);
							nlapiDisableField('custbody_upaya_ach_usa', true);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', true);
							nlapiDisableField('custbody_upaya_select_cc_2', false);
							
							nlapiDisableField('custbody_upaya_cvv_number', false);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							
							
						}
						else if((nlapiGetFieldValue('paymentmethod') == ACH) && (ACH))	
						{
							nlapiDisableField('custbody_upaya_ach_usa', false);
							nlapiDisableField('custbody_upaya_select_cc', true);
							nlapiDisableField('custbody_upaya_cvv_number', true);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							nlapiDisableField('custbody_upaya_select_cc_2', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', false);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
						}
						else
						{
							nlapiDisableField('custbody_upaya_ach_usa', true);
							nlapiDisableField('custbody_upaya_select_cc', true);
							nlapiDisableField('custbody_upaya_cvv_number', true);
							nlapiDisableField('custbody_upaya_cc_approved', true);
							nlapiDisableField('custbody_upaya_cc_rejected', true);
							nlapiDisableField('custbody_upaya_cc_order_id', true);
							nlapiDisableField('custbody_upaya_cc_voided', true);
							nlapiDisableField('custbody_upaya_cc_charged', true);
							nlapiDisableField('custbody_upaya_cc_refund', true);
							nlapiDisableField('custbody_upaya_cc_message', true);
							nlapiDisableField('custbody_upaya_ach_usa_cp', true);
							nlapiDisableField('custbody_upaya_ach_order_id', true);
							nlapiDisableField('custbody_upaya_ach_refund', true);
							nlapiDisableField('custbody_upaya_ach_charged', true);
							nlapiDisableField('custbody_upaya_ach_message', true);
							nlapiDisableField('custbody_upaya_select_cc_2', true);
						}
				//	}
				}
			}
		
	}//try
	catch(e){
		var errmsg = '';
		var err = '';
		if ( e instanceof nlobjError ){
			err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
		}
		else{
			err = 'Unexpected error: ' + e.toString();
		}
		errmsg += '\n' + err;
		nlapiLogExecution( 'ERROR',  fx + ' 999 Error', errmsg);
		return false;
	}
}
