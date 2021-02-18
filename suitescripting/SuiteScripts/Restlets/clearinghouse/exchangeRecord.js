/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Dec 2014     TJTyrrell
 *
 */

(function() {

	var restlet = {};
	
	restlet.createCall = function( dataIn ) {
		
	};
	
	restlet.readCall = function( dataIn ) {
		
		var returnPayload = {},
			exchangeRecordSearchFilters,
			exchangeRecordSearchColumns,
			exchangeRecords,
			exchangeRecordId,
			exchangeRecordColumns = {
				    'lot_identifier_code':                     'custrecord_acq_loth_zzz_zzz_identcode',
				    'deal_uuid':                               'custrecord_acq_loth_zzz_zzz_deal',
				    'shareholder_uuid':                        'custrecord_acq_loth_zzz_zzz_shareholder',
				    'contact_uuid':                            'custrecord_acq_loth_zzz_zzz_contact',
				    'buyer_name':                              'custrecord_qx_acq_loth_buyername',
				    'seller_name':                             'custrecord_qx_acq_loth_sellername',
				    'enum_acq_lot_sent_status':                'custrecord_acq_loth_zzz_zzz_lotdelivery',
				    'lot_received_from_shareholder_date':      'custrecord_acq_loth_zzz_zzz_rcvdtimestmp',
				    'w9_esign_document_link':                  'custrecord_acq_loth_zzz_w9esigndoc',
				    'lot_shareholder_name':                    'custrecord_acq_loth_1_de1_shrhldname',
				    'lot_shareholder_address1':                'custrecord_acq_loth_1_de1_shrhldaddr1',
				    'lot_shareholder_address2':                'custrecord_acq_loth_1_de1_shrhldaddr2',
				    'lot_shareholder_address3':                'custrecord_acq_loth_1_de1_shrhldaddr3',
				    'lot_shareholder_city':                    'custrecord_acq_loth_1_de1_shrhldcity',
				    'lot_shareholder_state':                   'custrecord_acq_loth_1_de1_shrhldstate',
				    'lot_shareholder_postal_code':             'custrecord_acq_loth_1_de1_shrhldpostalcd',
				    'lot_shareholder_country':                 'custrecord_acq_loth_1_de1_shrhldcountry',
				    'lot_shareholder_email_address':           'custrecord_acq_loth_1_src_shrhldname',
				    'lot_shareholder_phone':                   'custrecord_acq_loth_1_src_shrhldphone',
				    'lot_shareholder_tax_ident':               'custrecord_acq_loth_2_de1_ssnein',
				    'lot_shareholder_tax_signature_present':   'custrecord_acq_loth_2_de1_taxsigpresent',
				    'lot_shareholder_backup_witholding':       'custrecord_acq_loth_2_de1_bckupwholding',
				    'medallion_required':                      'custrecord_acq_loth_6_de1_medallion',
				    'lot_esign_document_link':                 'custrecord_acq_loth_zzz_zzz_esigndoc',
				    'lot_signature_present':                   'custrecord_acq_loth_2_de1_taxsigpresent',
				    'enum_tax_classification':                 'custrecord_acq_loth_2_de1_taxclass',
				    'lot_shareholder_authorized_signer':       'custrecord_acq_loth_1_de1_shrhldauth',
				    'lot_shareholder_authorized_signer_title': 'custrecord_acq_loth_1_de1_shrhldtitle',
				    'lot_shareholder_tax_name':                'custrecord_acq_loth_2_de1_irsname',
				    'enum_tax_identification_method_id':       'custrecordacq_loth_2_de1_taxidmethod',
				    'tax_identification_method':               'custrecordacq_loth_2_de1_taxidmethod'
//				    'recordid', // Not accessable
//				    'custrecord_acq_loth_1_de1_shrhldaddr4', // doesn't exist
//				    'lot_shareholder_verified_email_address',
//				    'lot_shareholder_verified_callerid',
//				    'lot_total_share_count',
//				    'is_lost_shares_included',
//				    'medallion_signature_present',
//				    'cover_letter_text',
//				    'cover_letter_text',
				},
			lotCertificatePaymentColumns = [
			        /*
			         * Payment Method
			         */
					'custrecord_acq_loth_4_de1_lotpaymethod',
					
					/*
					 * ACH Payment Method
					 */
					'custrecord_acq_loth_5a_de1_nameonbnkacct',
					'custrecord_acq_loth_5a_de1_bankacctnum',
					'custrecord_acq_loth_5a_de1_abaswiftnum', // ABA Routing Number
//					'custrecord_acq_loth_5a_de1_achverify', // ACH Routing Number
					'custrecord_acq_loth_5a_de1_bankname',
					'custrecord_acq_loth_5a_de1_bankaccttype',
					'custrecord_acq_loth_5a_de1_bankaddr',
					'custrecord_acq_loth_5a_de1_bankcity',
					'custrecord_acq_loth_5a_de1_bankstate',
					'custrecord_acq_loth_5a_de1_bankzip',
					'custrecord_acq_loth_5a_de1_bankcontact',
					'custrecord_acq_loth_5a_de1_bankphone',
					
					/*
					 * Wire Payment Method
					 */
					'custrecord_acq_loth_5b_de1_nameonbnkacct',
					'custrecord_acq_loth_5b_de1_bankacctnum',
					'custrecord_acq_loth_5b_de1_abaswiftnum', // ABA / Swift Number
//					'custrecord_acq_loth_5b_de1_wireverify',
					'custrecord_acq_loth_5b_de1_sortcode',
					'custrecord_acq_loth_5b_de1_bankname',
					'custrecord_acq_loth_5b_de1_bankaddr',
					'custrecord_acq_loth_5b_de1_bankcity',
					'custrecord_acq_loth_5b_de1_bankstate',
					'custrecord_acq_loth_5b_de1_bankcountry',
					'custrecord_acq_loth_5b_de1_bankzip',
					'custrecord_acq_loth_5b_de1_bankcontact',
					'custrecord_acq_loth_5b_de1_bankphone',
					'custrecord_acq_loth_5b_de1_frthrcrdtacct', // For further credit account number
					'custrecord_acq_loth_5b_de1_frthrcrdtname', // For further credit account name
					'custrecord_acq_loth_5b_de1_addlinstrct',
					
					/*
					 * Check Payment Method
					 */
					'custrecord_acq_loth_5c_de1_checkspayto',
					'custrecord_acq_loth_5c_de1_checksmailto',
					'custrecord_acq_loth_5c_de1_checksaddr1',
					'custrecord_acq_loth_5c_de1_checksaddr2',
					'custrecord_acq_loth_5c_de1_checkscity',
					'custrecord_acq_loth_5c_de1_checksstate',
					'custrecord_acq_loth_5c_de1_checkszip',
					'custrecord_acq_loth_5c_de1_checkscountry'
				],
			lotCertificateSearchFilters,
			lotCertificateSearchColumns,
			
			exchangeRecordPaymentColumns = [
			        'payment_payable_to_name',
			        'payment_mail_to_name',
			        'payment_mail_to_method_uuid',
			        'payment_mail_to_method',
			        'payment_bank_acct_number_iban',
			        'payment_bank_acct_aba_swift_number',
			        'payment_bank_acct_type_uuid',
			        'payment_bank_acct_type',
			        'payment_bank_acct_bank_name',
			        'payment_address1',
			        'payment_address2',
			        'payment_address3',
			        'payment_address4',
			        'payment_city',
			        'payment_state_uuid',
			        'payment_state',
			        'payment_country_uuid',
			        'payment_country',
			        'payment_postal_code',
			        'payment_bank_acct_bank_contact_name',
			        'payment_bank_acct_bank_contact_phone',
			        'payment_bank_acct_further_credit_account_number',
			        'payment_bank_acct_further_credit_account_name',
			        'final_payment_amount',
			        'final_payment_denomination_uuid',
			        'final_payment_denomination',
			        'instructions',
			        'bank_sort_number'
			    ],
			
			lotCertificates,
			lotCertificateColumns = {
			        'letter_of_transmittal_certificates_uuid': 'custrecord_acq_lotce_zzz_zzz_rowhash',
			        'enum_acq_lot_cert_detail_status':         'custrecord_acq_lotce_zzz_zzz_lotcestatus',
			        'certificate_number':                      'custrecord_acq_lotce_3_de1_certnumber',
			        'certificate_description':                 'custrecord_acq_lotce_3_de1_certdesc',
			        'number_of_shares':                        'custrecord_acq_lotce_3_de1_numbershares',
			        'is_certificate_lost':                     'custrecord_acq_lotce_3_de1_lostcert',
			        'isinactive':                              'isinactive'
		         };
		
		
		public.addExecutionTime( 'startReadRecord' );
		nlapiLogExecution('DEBUG','readRecord','readRecord start');
	
		try {
			
			exchangeRecordSearchFilters = [
			        new nlobjSearchFilter( 'custrecord_acq_loth_zzz_zzz_identcode', null, 'is', dataIn.exchangeHash )
			   ];
			
			exchangeRecordSearchColumns = [];
			
			for( var columnName in exchangeRecordColumns ) {
				exchangeRecordSearchColumns.push( new nlobjSearchColumn( exchangeRecordColumns[ columnName ] ) );
			}
			
			for( var column in lotCertificatePaymentColumns ) {
				exchangeRecordSearchColumns.push( new nlobjSearchColumn( lotCertificatePaymentColumns[column] ) );
			}
			
			exchangeRecords = nlapiSearchRecord('customrecord_acq_lot', null, exchangeRecordSearchFilters, exchangeRecordSearchColumns );

			if( exchangeRecords != null ) {
				returnPayload.lot_identifier_code = exchangeRecords[0].getValue('custrecord_acq_loth_zzz_zzz_identcode');
				returnPayload.letter_of_transmittals = [];
				
				for( var i = 0; i < exchangeRecords.length; i++ ) {
					
					exchangeRecordId = exchangeRecords[i].getId();
					
					returnPayload.letter_of_transmittals[i] = {};
					
					for( var columnName in exchangeRecordColumns ) {
						returnPayload.letter_of_transmittals[i][ columnName ] = exchangeRecords[i].getValue( exchangeRecordColumns[columnName] );
					}
					
					returnPayload.letter_of_transmittals[i][ 'lot_uuid' ] = exchangeRecordId;
					
					returnPayload.letter_of_transmittals[i][ 'letter_of_transmittal_certificates' ] = [];
					returnPayload.letter_of_transmittals[i][ 'letter_of_transmittal_payments' ] = [];
					
					lotCertificateSearchFilters = [
					        new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot', null, 'is', exchangeRecordId),
					        new nlobjSearchFilter('isinactive', null, 'is', 'F')
					   ];
					
					lotCertificateSearchColumns = [];
					
					for( var columnName in lotCertificateColumns ) {
						lotCertificateSearchColumns.push( new nlobjSearchColumn( lotCertificateColumns[ columnName ] ) );
					}
					
					lotCertificates = nlapiSearchRecord('customrecord_acq_lot_cert_entry', null, lotCertificateSearchFilters, lotCertificateSearchColumns );
					
					for( var j = 0; j < lotCertificates.length; j++ ) {
						returnPayload.letter_of_transmittals[i].letter_of_transmittal_certificates[j] = {};
						for( var columnName in lotCertificateColumns ) {
							if( columnName == 'enum_acq_lot_cert_detail_status' ) {
								returnPayload.letter_of_transmittals[i].letter_of_transmittal_certificates[j][ columnName ] = lotCertificates[j].getText( lotCertificateColumns[ columnName ] );
							} else {
								returnPayload.letter_of_transmittals[i].letter_of_transmittal_certificates[j][ columnName ] = lotCertificates[j].getValue( lotCertificateColumns[ columnName ] );
							}
						}
						returnPayload.letter_of_transmittals[i].letter_of_transmittal_certificates[j][ 'letter_of_transmittal_certificates_uuid' ] = lotCertificates[j].getId();
						
					}
					
					/*
					 * SETUP EXCHANGE RECORD PAYMENT INFO
					 */
					var payMethod = exchangeRecords[i].getText( 'custrecord_acq_loth_4_de1_lotpaymethod' ),
						payMethodId = exchangeRecords[i].getValue( 'custrecord_acq_loth_4_de1_lotpaymethod' );
					
					payMethod = payMethod.toString().toLowerCase().replace(' ', '_');
					
					//ACH, Domestic Check, International Check, Domestic Wire, International Wire, Payroll
					returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0] = {};
					returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].enum_acq_lot_payment_method_type_uuid = payMethodId;
					returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].enum_acq_lot_payment_method_type = payMethod;
					
					for( var j = 0; j < exchangeRecordPaymentColumns.length; j++ ) {
						returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0][ exchangeRecordPaymentColumns[j] ] = '';
					}
					
					switch( payMethod ) {
						
						case 'ach':
						case 'aes_ach':
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_payable_to_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_nameonbnkacct' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_number_iban = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankacctnum' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_aba_swift_number = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_abaswiftnum' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankname' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_type = exchangeRecords[i].getText( 'custrecord_acq_loth_5a_de1_bankaccttype' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_type_uuid = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankaccttype' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_address1 = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankaddr' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_city = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankcity' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_state = exchangeRecords[i].getText( 'custrecord_acq_loth_5a_de1_bankstate' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_postal_code = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankzip' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_contact_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankcontact' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_contact_phone = exchangeRecords[i].getValue( 'custrecord_acq_loth_5a_de1_bankphone' );
							break;
						
						case 'domestic_check':
						case 'international_check':
						case 'aes_domestic_check':
						case 'aes_international_check':
							
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_payable_to_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5c_de1_checkspayto' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_mail_to_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5c_de1_checksmailto' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_address1 = exchangeRecords[i].getValue( 'custrecord_acq_loth_5c_de1_checksaddr1' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_address2 = exchangeRecords[i].getValue( 'custrecord_acq_loth_5c_de1_checksaddr2' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_city = exchangeRecords[i].getValue( 'custrecord_acq_loth_5c_de1_checkscity' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_state = exchangeRecords[i].getText( 'custrecord_acq_loth_5c_de1_checksstate' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_postal_code = exchangeRecords[i].getValue( 'custrecord_acq_loth_5c_de1_checkszip' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_country = exchangeRecords[i].getText( 'custrecord_acq_loth_5c_de1_checkscountry' );

							break;
						
						case 'domestic_wire':
						case 'international_wire':
						case 'aes_domestic_wire':
						case 'aes_international_wire':
							
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_nameonbnkacct' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_number_iban = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_bankacctnum' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_aba_swift_number = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_abaswiftnum' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].bank_sort_number = exchangeRecords[i].getText( 'custrecord_acq_loth_5b_de1_sortcode' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_bankname' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_address1 = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_bankaddr' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_city = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_bankcity' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_state = exchangeRecords[i].getText( 'custrecord_acq_loth_5b_de1_bankstate' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_country = exchangeRecords[i].getText( 'custrecord_acq_loth_5b_de1_bankcountry' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_postal_code = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_bankzip' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_contact_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_bankcontact' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_bank_contact_phone = exchangeRecords[i].getText( 'custrecord_acq_loth_5b_de1_bankphone' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_further_credit_account_number = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_frthrcrdtacct' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].payment_bank_acct_further_credit_account_name = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_frthrcrdtname' );
							returnPayload.letter_of_transmittals[i].letter_of_transmittal_payments[0].instructions = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_addlinstrct' );
							
							/* 2015-01-15 Doesn't seem to be needed, save for potential future need */
//							returnPayload.letter_of_transmittals[i].letter_of_transmittal_certificates[0]. = exchangeRecords[i].getValue( 'custrecord_acq_loth_5b_de1_wireverify' );
							
							break;
					}
					
				}
				
				public.addExecutionTime( 'finishReadRecord' );
				
				public.setStatus( 'SUCCESS' );
			
				nlapiLogExecution( 'DEBUG', 'readRecord', 'PARAMS: ' + dataIn.id );
				
				//returnPayload.letter_of_transmittal_payments = [];
				//returnPayload = exchangeRecords;
			
				public.setReturnPayload( returnPayload );
			} else {
				
				public.setStatus('ERROR');
				public.addMessage( 'rhino', 'Invalid Exchange Hash' );
				nlapiLogExecution( 'ERROR', 'readRecord', 'Invalid Exchange Hash' );

			}
			
		
			
			
		} catch(e) {
			
			var msg = '';
			
			if(e instanceof nlobjError ) {
				
				msg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
				
			} else {
				
				for( var prop in e ) {
					msg += "Property: " + prop + ", Value: [" + e[prop] + "] -- ";
				}
				nlapiLogExecution('DEBUG', 'unexpected error', e);
				
			}
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1999, "System Error: " + msg );
			
		}
		
	};
	
	restlet.updateCall = function( dataIn ) {
		
	};

	restlet.deleteCall = function( dataIn ) {
		
	};
	
	return restlet;
	
}());
