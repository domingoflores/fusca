/**
 * paymtInstrListLibrary.js
 * @NApiVersion 2.x
 * @NModuleScopt public
 * Centralized library of all lists used in Alpha Payment Instruction project, so if internal IDs
 * are altered, only one location has to be changed.
 *
 * include '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
 * Version    Date            Author           Remarks
 *	1.0		  				  Alana Thomas	   Initial version 
 *  		  4/24/2018       Ken Crossman     ATP-133 Payment Method determines Country
 *            7/10/2018       AFodor           ATP-253 Added Import Status ENUM
 *            08/10/2018      Ken Crossman     ATP-242 Added recordType and fieldId
 *            11/26/2018      Ken Crossman     ATP-343 Adding roles
 *            12/12/2018      Ken Crossman     ATP-456 Adding ER Payroll Paymethod
 * 			  05/06/2019	  Robert Bender	   ATP-856 Adding duplicate hold reason
 */

define(['/SuiteScripts/Pristine/libraries/Enum.js'],

	function(Enum) {

		var piEnum = {
			exchgAcqSts: Enum.Enum("zero", "ExchgRcdCreated", "LotSent", "ReadyForDataEntry", "ReadyForReview", "ApprovedForPayment", "ReviewedChangesMade", "NotApprovedForPayment", "PaidRefundIssued", "AwaitingDocuments", "ExNeedCopyOfCertificates", "ExNeedW8", "ExNeedW9", "ExNeedSignedLot", "LotRequiresFollowup", "QueuedForPaymentProcessing", "PaymentProcessing"),
			subSts: Enum.Enum("zero", "Entered", "DualEntry", "Validate", "Failed", "Review", "DECompare", "DEReject", "Canceled", "Approved", "Promoting", "Promoted"),
			billApprovalSts: Enum.Enum("zero", "PendingRequestForApproval", "PendingApproval", "Approved", "RejectedPendingRequestForReApproval"),
			nativeBillApprovalSts: Enum.Enum("zero", "PendingApproval", "Approved", "Rejected"),
			subSource: Enum.Enum("zero", '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', "Import", "DualEntry", "CopyEditAs", "PIUserInterface", "ClearingHouse", "ExchangeRecord"),
			dfltsSource: Enum.Enum("zero", '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', "Submission", "Instruction", "History", "Case", "Exchange"),
			medSts: Enum.Enum("zero", '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', "NotRequired", "Pending", "Review", "Accepted", "Waived", "Rejected"),
			importSts: Enum.Enum('zero', 'NotStarted', 'InProgress', 'Completed', 'DocsNotYetFinalized', 'ReadyForGuidelines', 'ImportFileNotYetPrepared', 'ReadyToImport', 'ReadyForTab1', 'Tab1PendingApproval', 'MjrShareholderLettersReadyToCreate', 'MjrShareholderLettersToBeReviewed', 'WelcomeLetterNotYetSent', 'DealContactsToBeUpdated', 'OnHold'),
			piType: Enum.Enum("zero", '1', '2', '3', '4', '5', '6', '7', '8', "Default", "AcquiomDeal", "ExchangeRecord", "SRSDeal"),
			payMeth: Enum.Enum("zero", "ACH", "DomesticCheck", "InternationalCheck", "DomesticWire", "InternationalWire"),
			payMethCls: Enum.Enum("zero", "Check", "ACH", "Wire"),
			payInstrHoldSts: Enum.Enum('zero', 'Open', 'Canceled', 'Cleared'),
			paymtInstrHoldSrc: Enum.Enum('zero', 'Import', 'StaffEntry', 'Submission', 'Script'),
			paymtInstrHoldReason: Enum.Enum('zero', 'PendingSubmission', 'Legal', 'ShareholderRequest', 'StaffAction', 'Other', 'PaymentReturned', 'Duplicate'),
			paymtSuspenseReason: Enum.Enum('zero' //grouped in fives on each line so 1-5, 6-10, 11-15 and so on
					, 'Legalhold', 'PaymentBelowFee', 'PendingDistribution', 'InvalidTaxDocument', 'FutureDatedPayment'
					, 'Misc', 'DissentingSH', 'ShareholderReqNoPayment', 'Transferred',	'FundsReturnedToBuyer'
					, 'IRSBNotice', 'PendingAESPayrollCalculations', 'PendingESOPApproval', 'PendingTransfer','ForeignWithholding'
					,'PendingEscheat', 'PIOnHold', 'OutstandingPISubm', 'DuplicatePI', 'DuplicatePISubm'
					,'Escheated' ,'NoContactInfo' ,'NonSrsaDocsRequired' ,'MultipleSignatureRequired' ,'CounselApprovalRequired'
					,'PartiallyTransferred' ,'PendingValidIsraeliTaxCert' ,'PmtInstrApplyRemoveIncomplete' 
			)
		};
		var countries = {
			unitedStates: 232,
			mexico: 142,
			canada: 38
		};

		var recordType = {
			pi: 'customrecord_paymt_instr',
			piSub: 'customrecord_paymt_instr_submission',
			piSubId: 874,   //Same in Prod
			exRec: 'customrecord_acq_lot',
			piHold: 'customrecord_paymt_instr_hold'
		};

		var fieldId = {
			piPIType: 'custrecord_pi_paymt_instr_type',
			piShareholder: 'custrecord_pi_shareholder',
			piDeal: 'custrecord_pi_deal',
			piExRec: 'custrecord_pi_exchange',
			piOnHold: 'custrecord_pi_onhold',
			piSub: 'custscript_pi_submission_id',
			piSubStatus: 'custrecord_pisb_submission_status', 
			piSubPIType: 'custrecord_pisb_paymt_instr_type',
			piSubShareholder: 'custrecord_pisb_shareholder',
			piSubDeal: 'custrecord_pisb_deal',
			piSubExRec: 'custrecord_pisb_exchange',
			piSubUpdatingPI: 'custrecord_pisb_updating_paymt_instr',
			piSubInactivatePI: 'custrecord_pisb_inactivate_pi',
			piSubChangeExisting: 'custrecord_pisb_changing_existing',
			piHoldSub: 'custrecord_pihd_submission',
			piHoldPI: 'custrecord_pihd_paymt_instr',
			piHoldReason: 'custrecord_pihd_hold_reason',
			piHoldStatus: 'custrecord_pihd_hold_status',
			piHoldSrc: 'custrecord_pihd_hold_src',
			piHoldOffBy: 'custrecord_pihd_offhold_by',
			piHoldOffTs: 'custrecord_pihd_offhold_ts',
			piHoldOffComment: 'custrecord_pihd_offhold_comment',
			piHoldOffCase: 'custrecord_pihd_offhold_case',
			piHoldOffDoc: 'custrecord_pihd_offhold_doc',
			exRecShareholder: 'custrecord_acq_loth_zzz_zzz_shareholder',
			exRecPI: 'custrecord_exrec_payment_instruction',
			exRecPISub: 'custrecord_exrec_paymt_instr_sub',
			exRecDeal: 'custrecord_acq_loth_zzz_zzz_deal',
			exRecSuspReason: 'custrecord_suspense_reason',
			exRecCreditMemo: 'custrecord_acq_loth_related_trans',
			exRecPayMethod: 'custrecord_acq_loth_4_de1_lotpaymethod'
			
		};
		var role = {
			opsManager: 'customrole1025',
			opsAnalyst: 'customrole1032'
		};
		var department = {
			acquiomOperations: '35'
		};
		var employeeFunction = {
			importPISubRecords: '4'
		};
		var exRecPayMethod = {
			payroll: 6
		};
		
		// These two objects list Statuses that are less than 5 and are used by Exchange record processing
		// to determine if fields on the exchange record should be protected because it has been paid or is ready to be paid
		var objExRecAcqStatusLessThan5 = {"1":1 ,"2":1 ,"3":1 ,"9":1 ,"4":1 ,"6":1 };
		var objExRecShrStatusLessThan5 = {"1":1 ,"2":1 ,"3":1 ,"4":1 ,"5":1 };
		
		// this is hear because .getFields() cannot get ALL the fields for some unknown reason.
		var PISB_fieldIds = [
			'custrecord_pisb_original_source',
			'custrecord_pisb_autotest_last_result',
			'custrecord_pisb_autotest_last_ts',
			'custrecord_pisb_buyer_case',
			'custrecord_pisb_buyer_confirm_ts',
			'custrecord_pisb_buyer_confirm',
			'custrecord_pisb_buyer_confirmed_by',
			'custrecord_pisb_changing_existing',
			'custrecord_pisb_chk_addr1',
			'custrecord_pisb_chk_addr2',
			'custrecord_pisb_chk_addr3',
			'custrecord_pisb_chk_city',
			'custrecord_pisb_chk_comment',
			'custrecord_pisb_chk_country',
			'custrecord_pisb_chk_mailto',
			'custrecord_pisb_chk_payto',
			'custrecord_pisb_chk_state',
			'custrecord_pisb_chk_validation_msg',
			'custrecord_pisb_chk_zip',
			'custrecord_pisb_created_by',
			'custrecord_pisb_de_by',
			'custrecord_pisb_de_err_fld_list',
			'custrecord_pisb_de_err',
			'custrecord_pisb_deal',
			'custrecord_pisb_dflt_fld_list',
			'custrecord_pisb_dflts_src_name',
			'custrecord_pisb_ep_abarouting_in',
			'custrecord_pisb_ep_abarouting',
			'custrecord_pisb_ep_achaccttype',
			'custrecord_pisb_ep_addlinst',
			'custrecord_pisb_ep_bankacctnum',
			'custrecord_pisb_ep_bankaddr',
			'custrecord_pisb_ep_bankcity',
			'custrecord_pisb_ep_bankcontact',
			'custrecord_pisb_ep_bankcountry',
			'custrecord_pisb_ep_bankcountryname',
			'custrecord_pisb_ep_bankname_in',
			'custrecord_pisb_ep_bankname_lkup',
			'custrecord_pisb_ep_bankname',
			'custrecord_pisb_ep_bankphone',
			'custrecord_pisb_ep_bankpostal',
			'custrecord_pisb_ep_bankstate',
			'custrecord_pisb_ep_ffcacctnum',
			'custrecord_pisb_ep_ffcname',
			'custrecord_pisb_ep_iban_in',
			'custrecord_pisb_ep_iban_sortcode',
			'custrecord_pisb_ep_iban',
			'custrecord_pisb_ep_imb_abarouting_in',
			'custrecord_pisb_ep_imb_abarouting',
			'custrecord_pisb_ep_imb_bankacctnum',
			'custrecord_pisb_ep_imb_bankname_in',
			'custrecord_pisb_ep_imb_bankname_lkup',
			'custrecord_pisb_ep_imb_bankname',
			'custrecord_pisb_ep_imb_nameonbnkacct',
			'custrecord_pisb_ep_imb_swiftbic_in',
			'custrecord_pisb_ep_imb_swiftbic',
			'custrecord_pisb_ep_imb_use_bankname_in',
			'custrecord_pisb_ep_imb_validation_msg',
			'custrecord_pisb_ep_nameonbnkacct',
			'custrecord_pisb_ep_requirements',
			'custrecord_pisb_ep_swiftbic_in',
			'custrecord_pisb_ep_swiftbic',
			'custrecord_pisb_ep_use_bankname_in',
			'custrecord_pisb_ep_validation_msg',
			'custrecord_pisb_error_detail',
			'custrecord_pisb_escrow_case',
			'custrecord_pisb_escrow_confirm_ts',
			'custrecord_pisb_escrow_confirm',
			'custrecord_pisb_escrow_confirmed_by',
			'custrecord_pisb_exchange',
			'custrecord_pisb_import_id',
			'custrecord_pisb_inactivate_pi',
			'custrecord_pisb_med_accepted_by',
			'custrecord_pisb_med_accepted_ts',
			'custrecord_pisb_med_case',
			'custrecord_pisb_med_comment',
			'custrecord_pisb_med_image',
			'custrecord_pisb_med_number',
			'custrecord_pisb_med_received_ts',
			'custrecord_pisb_med_rejected_by',
			'custrecord_pisb_med_rejected_ts',
			'custrecord_pisb_med_required',
			'custrecord_pisb_med_sigpresent',
			'custrecord_pisb_med_status',
			'custrecord_pisb_med_waived_by',
			'custrecord_pisb_med_waived_ts',
			'custrecord_pisb_payagnt_case',
			'custrecord_pisb_payagnt_confirm_ts',
			'custrecord_pisb_payagnt_confirm',
			'custrecord_pisb_payagnt_confirmed_by',
			'custrecord_pisb_payclass',
			'custrecord_pisb_payment_region',
			'custrecord_pisb_paymethod',
			'custrecord_pisb_paymt_instr_type',
			'custrecord_pisb_pi_comment',
			'custrecord_pisb_requested_state',
			'custrecord_pisb_run_autotest',
			'custrecord_pisb_rvw_last_action_by',
			'custrecord_pisb_rvw_last_action',
			'custrecord_pisb_rvw_last_comment',
			'custrecord_pisb_shareholder',
			'custrecord_pisb_source_case',
			'custrecord_pisb_source',
			'custrecord_pisb_src_internal_id',
			'custrecord_pisb_srs_trk_comment',
			'custrecord_pisb_status_err_summary',
			'custrecord_pisb_status_ts',
			'custrecord_pisb_submission_status',
			'custrecord_pisb_submission_ts',
			'custrecord_pisb_updating_paymt_instr'];
		
		arrayPiToExchangeRecord = [
		 { piField:"custrecord_pi_paymethod"            ,exField:"custrecord_acq_loth_4_de1_lotpaymethod"   ,pmtMethods:[]      ,func:"" ,clearFieldValue:null }
		,{ piField:"custrecord_pi_currency"             ,exField:"custrecord_exrec_shrhldr_settle_curr"     ,pmtMethods:[]      ,func:"" ,clearFieldValue:null }
		 
		 // ACH
		,{ piField:"custrecord_pi_ep_abarouting_ach"    ,exField:"custrecord_acq_loth_5a_de1_abaswiftnum"   ,pmtMethods:['1']   ,func:"" ,getText:true ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_abarouting_ach"    ,exField:"custrecord_acq_loth_5a_de1_achverify"     ,pmtMethods:['1']   ,func:"" ,clearFieldValue:null }
		,{ piField:"custrecord_pi_ep_achaccttype"       ,exField:"custrecord_acq_loth_5a_de1_bankaccttype"  ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankname"          ,exField:"custrecord_acq_loth_5a_de1_bankname"      ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_nameonbnkacct"     ,exField:"custrecord_acq_loth_5a_de1_nameonbnkacct" ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankacctnum"       ,exField:"custrecord_acq_loth_5a_de1_bankacctnum"   ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankaddr"          ,exField:"custrecord_acq_loth_5a_de1_bankaddr"      ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcity"          ,exField:"custrecord_acq_loth_5a_de1_bankcity"      ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankstate"         ,exField:"custrecord_acq_loth_5a_de1_bankstate"     ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankpostal"        ,exField:"custrecord_acq_loth_5a_de1_bankzip"       ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcontact"       ,exField:"custrecord_acq_loth_5a_de1_bankcontact"   ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankphone"         ,exField:"custrecord_acq_loth_5a_de1_bankphone"     ,pmtMethods:['1']   ,func:"" ,clearFieldValue:"" }
		
		
		// DOM Check, INT Check
		,{ piField:"custrecord_pi_chk_payto"            ,exField:"custrecord_acq_loth_5c_de1_checkspayto"   ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_mailto"           ,exField:"custrecord_acq_loth_5c_de1_checksmailto"  ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_addr1"            ,exField:"custrecord_acq_loth_5c_de1_checksaddr1"   ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_addr2"            ,exField:"custrecord_acq_loth_5c_de1_checksaddr2"   ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_addr3"            ,exField:"custrecord_acq_loth_5c_de1_checksaddr3"   ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_city"             ,exField:"custrecord_acq_loth_5c_de1_checkscity"    ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_comment"          ,exField:"custrecord_acq_loth_5c_de1_checkcomment"  ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_state"            ,exField:"custrecord_acq_loth_5c_de1_checksstate"   ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_zip"              ,exField:"custrecord_acq_loth_5c_de1_checkszip"     ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_chk_country"          ,exField:"custrecord_acq_loth_5c_de1_checkscountry" ,pmtMethods:['2','3'] ,func:"" ,clearFieldValue:"" }
		
		// DOM Wire
		,{ piField:"custrecord_pi_ep_abarouting_wire"   ,exField:"custrecord_acq_loth_5b_de1_abaswiftnum"   ,pmtMethods:['4'] ,func:"" ,getText:true ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_abarouting_wire"   ,exField:"custrecord_acq_loth_5b_de1_wireverify"    ,pmtMethods:['4'] ,func:"" ,clearFieldValue:null }
		,{ piField:"custrecord_pi_ep_ffcname"           ,exField:"custrecord_acq_loth_5b_de1_frthrcrdtname" ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_ffcacctnum"        ,exField:"custrecord_acq_loth_5b_de1_frthrcrdtacct" ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_addlinst"          ,exField:"custrecord_acq_loth_5b_de1_addlinstrct"   ,pmtMethods:['4'] ,func:"addlInstructions" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankname"          ,exField:"custrecord_acq_loth_5b_de1_bankname"      ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_nameonbnkacct"     ,exField:"custrecord_acq_loth_5b_de1_nameonbnkacct" ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankacctnum"       ,exField:"custrecord_acq_loth_5b_de1_bankacctnum"   ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankaddr"          ,exField:"custrecord_acq_loth_5b_de1_bankaddr"      ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcity"          ,exField:"custrecord_acq_loth_5b_de1_bankcity"      ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankstate"         ,exField:"custrecord_acq_loth_5b_de1_bankstate"     ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankpostal"        ,exField:"custrecord_acq_loth_5b_de1_bankzip"       ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcountryname"   ,exField:"custrecord_acq_loth_5b_de1_bankcountry"   ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcontact"       ,exField:"custrecord_acq_loth_5b_de1_bankcontact"   ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankphone"         ,exField:"custrecord_acq_loth_5b_de1_bankphone"     ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_abaroutg_wire" ,exField:"custrecord_exch_de1_imb_abarouting"       ,pmtMethods:['4'] ,func:"" ,getText:true ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_abaroutg_wire" ,exField:"custrecord_exch_de1_imb_aba_verify"       ,pmtMethods:['4'] ,func:"" ,clearFieldValue:null }
		,{ piField:"custrecord_pi_ep_imb_swiftbic"      ,exField:"custrecord_exch_de1_imb_swiftbic"         ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_bankname"      ,exField:"custrecord_exch_de1_imb_bankname"         ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_nameonbnkacct" ,exField:"custrecord_exch_de1_imb_nameonbnkacct"    ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_bankacctnum"   ,exField:"custrecord_exch_de1_imb_bankacctnum"      ,pmtMethods:['4'] ,func:"" ,clearFieldValue:"" }
		
		
		// INT Wire 
		,{ piField:"custrecord_pi_ep_ffcname"           ,exField:"custrecord_acq_loth_5b_de1_frthrcrdtname" ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_ffcacctnum"        ,exField:"custrecord_acq_loth_5b_de1_frthrcrdtacct" ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_swiftbic"          ,exField:"custrecord_acq_loth_5b_de1_abaswiftnum"   ,pmtMethods:['5'] ,func:"wireSwiftOrAba" ,clearFieldValue:"" }
		,{ piField:""                                   ,exField:"custrecord_acq_loth_5b_de1_wireverify"    ,pmtMethods:['5'] ,func:"" ,clearFieldValue:null }
		,{ piField:""                                   ,exField:"custrecord_exrec_swift_status_wire"       ,pmtMethods:['5'] ,func:"" ,clearFieldValue:null }
		,{ piField:["custrecord_pi_ep_iban","custrecord_pi_ep_bankacctnum"] ,exField:"custrecord_acq_loth_5b_de1_bankacctnum" ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_iban_sortcode"     ,exField:"custrecord_acq_loth_5b_de1_sortcode"      ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_addlinst"          ,exField:"custrecord_acq_loth_5b_de1_addlinstrct"   ,pmtMethods:['5'] ,func:"addlInstructions" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankname"          ,exField:"custrecord_acq_loth_5b_de1_bankname"      ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_nameonbnkacct"     ,exField:"custrecord_acq_loth_5b_de1_nameonbnkacct" ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankaddr"          ,exField:"custrecord_acq_loth_5b_de1_bankaddr"      ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcity"          ,exField:"custrecord_acq_loth_5b_de1_bankcity"      ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankstate"         ,exField:"custrecord_acq_loth_5b_de1_bankstate"     ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankpostal"        ,exField:"custrecord_acq_loth_5b_de1_bankzip"       ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcountryname"   ,exField:"custrecord_acq_loth_5b_de1_bankcountry"   ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankcontact"       ,exField:"custrecord_acq_loth_5b_de1_bankcontact"   ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_bankphone"         ,exField:"custrecord_acq_loth_5b_de1_bankphone"     ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_abaroutg_wire" ,exField:"custrecord_exch_de1_imb_abarouting"       ,pmtMethods:['5'] ,func:"" ,getText:true ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_abaroutg_wire" ,exField:"custrecord_exch_de1_imb_aba_verify"       ,pmtMethods:['5'] ,func:"" ,clearFieldValue:null }
		,{ piField:"custrecord_pi_ep_imb_swiftbic"      ,exField:"custrecord_exch_de1_imb_swiftbic"         ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_bankname"      ,exField:"custrecord_exch_de1_imb_bankname"         ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_nameonbnkacct" ,exField:"custrecord_exch_de1_imb_nameonbnkacct"    ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_ep_imb_bankacctnum"   ,exField:"custrecord_exch_de1_imb_bankacctnum"      ,pmtMethods:['5'] ,func:"" ,clearFieldValue:"" }
		
		,{ piField:"custrecord_pi_med_status"           ,exField:"custrecord_acq_loth_zzz_zzz_mdlin_status" ,pmtMethods:[] ,func:"medallionStatus" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_med_required"         ,exField:"custrecord_acq_loth_6_de1_medallion"      ,pmtMethods:[] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_med_number"           ,exField:"custrecord_acq_loth_6_de1_medallionnum"   ,pmtMethods:[] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_med_sigpresent"       ,exField:"custrecord_acq_loth_6_de1_medshrhldsig"   ,pmtMethods:[] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_med_received_ts"      ,exField:"custrecord_acq_loth_zzz_zzz_medalliontim" ,pmtMethods:[] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_med_image"            ,exField:"custrecord_acq_loth_zzz_zzz_medallnimage" ,pmtMethods:[] ,func:"" ,clearFieldValue:"" }
		,{ piField:"custrecord_pi_med_case"             ,exField:"custrecord_acq_loth_zzz_zzz_medallioncas" ,pmtMethods:[] ,func:"" ,clearFieldValue:"" }

		,{ piField:""                                   ,exField:"custrecord_exrec_paymt_instr_hist"        ,pmtMethods:[] ,func:"paymtInstrHist" ,clearFieldValue:"" }
		
		
		];
		

		return {
			piEnum: piEnum,
			countries: countries,
			recordType: recordType,
			fieldId: fieldId,
			role: role,
			department: department,
			employeeFunction: employeeFunction,
			exRecPayMethod: exRecPayMethod,
			PISB_fieldIds : PISB_fieldIds
			,arrayPiToExchangeRecord: arrayPiToExchangeRecord
			,objExRecAcqStatusLessThan5: objExRecAcqStatusLessThan5
			,objExRecShrStatusLessThan5: objExRecShrStatusLessThan5
		};
	});