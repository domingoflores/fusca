/**
 * ExRecAlphaPIClientLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * Centralized library of functions used in the Payment Dashboard Alpha PI Aware project
 *
 */
define(['N/search', 'N/record', 'N/runtime'
	   ],
	function(search, record, runtime
			) {
		
		var objValidation = {
				
				  FIELDS: {
						 PAYMENT_METHOD:            'custrecord_acq_loth_4_de1_lotpaymethod'
						,ACH_NUMBER:                'custrecord_acq_loth_5a_de1_abaswiftnum'
						,ABA_ROUTING_VERIFICATION:  'custrecord_acq_loth_5a_de1_achverify'
						,ACH_BANK:                  'custrecord_acq_lot_aba_ach_bank_name'
						,ACH_STATUS:                'custrecord_acq_lot_aba_ach_status'
						,WIRE_NUMBER:               'custrecord_acq_loth_5b_de1_abaswiftnum'
						,WIRE_ROUTING_VERIFICATION: 'custrecord_acq_loth_5b_de1_wireverify'
						,WIRE_BANK:                 'custrecord_acq_lot_aba_wire_bank_name'
						,WIRE_STATUS:               'custrecord_acq_lot_wire_aba_status'
						,WIRE_SWIFT_STATUS:         'custrecord_exrec_swift_status_wire'
						,INTMED_ABA_NUMBER:         'custrecord_exch_de1_imb_abarouting'
						,INTMED_ABA_VERIFICATION:   'custrecord_exch_de1_imb_aba_verify'
						,INTMED_ABA_BANK:           'custrecord_exch_de1_imb_aba_bankname'
						,INTMED_ABA_STATUS:         'custrecord_exch_de1_imb_aba_status'
						,INTMED_SWIFT_BIC:          'custrecord_exch_de1_imb_swiftbic'
						,INTMED_SWIFT_BIC_STATUS:   'custrecord_exch_de1_imb_swift_status'
						,FX_CURRENCY: 				'custrecord_exrec_shrhldr_settle_curr'
						// changed the field above to shareholder settlement currency field for it is now the source
						// commented out the line below for it is no longer being created
						//,CUSTOM_FX_CONTRACT:        'custpage_fx_conv_contract'
						,FX_CONTRACT:               'custrecord_exrec_fx_conv_contract'
						}	
		    	,messages: {
		    		 msg_RoutingNumberInvalid_ACH    : '"DE1-E3) ABA Routing Number" is invalid'
		    		,msg_RoutingNumberInvalid_Wire   : '"DE1-E3) WIRE ABA/SWIFT NUMBER" is not a valid ABA Routing'
		    		,msg_RoutingNumberInvalid_Swift  : '"DE1-E3) WIRE ABA/SWIFT NUMBER"'
		    		,msg_RoutingNumberInvalid_Intmed : '"DE1 INTMED ABA NUMBER WIRE" is invalid'
		    		,msg_SwiftInvalid_Intmed         : '"DE1 INTMED SWIFT/BIC"'
		    		
		    				}
				
		}
		

		return {
			objValidation: objValidation
		};
	});