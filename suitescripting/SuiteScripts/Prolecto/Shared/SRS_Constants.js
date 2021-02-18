//------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/*
 * 
 * constants used by various Prolecto Scripts for SRS 
 * 
 */

define([], function() {
    
	return {
		// disableFields is an Array object containing fields from the ExchangeRecord FieldsGroups: 
		// Form 4, Form 5A, Form 5B, Intermediary Wire Info, Form 5C, Form 6
		EXREC: {
			disableFields:
				["custrecord_acq_loth_4_de1_lotpaymethod",
					"custrecord_exrec_payment_instruction",
					"custrecord_exrec_paymt_instr_sub",
					"custrecord_exrec_paymt_instr_hist",
					"custrecord_acq_loth_5a_de1_nameonbnkacct",
					"custrecord_acq_loth_5a_de1_bankacctnum",
					"custrecord_acq_loth_5a_de1_abaswiftnum",
					"custrecord_acq_loth_5a_de1_bankname",
					"custrecord_acq_loth_5a_de1_bankaccttype",
					"custrecord_acq_loth_5a_de1_bankaddr",
					"custrecord_acq_loth_5a_de1_bankcity",
					"custrecord_acq_loth_5a_de1_bankstate",
					"custrecord_acq_loth_5a_de1_bankzip",
					"custrecord_acq_loth_5a_de1_bankcontact",
					"custrecord_acq_loth_5a_de1_bankphone",
					"custrecord_exrec_ach_state_cd",
					"custrecord_acq_loth_5a_de1_achverify",
					"custrecord_acq_lot_aba_ach_bank_name",
					"custrecord_acq_lot_aba_ach_status",
					"custrecord_acq_loth_5b_de1_nameonbnkacct",
					"custrecord_acq_loth_5b_de1_bankacctnum",
					"custrecord_acq_loth_5b_de1_abaswiftnum",
					"custrecord_acq_loth_5b_de1_sortcode",
					"custrecord_acq_loth_5b_de1_bankname",
					"custrecord_acq_loth_5b_de1_bankaddr",
					"custrecord_acq_loth_5b_de1_bankcity",
					"custrecord_acq_loth_5b_de1_bankstate",
					"custrecord_acq_loth_5b_de1_bankcountry",
					"custrecord_acq_loth_5b_de1_bankzip",
					"custrecord_acq_loth_5b_de1_bankcontact",
					"custrecord_acq_loth_5b_de1_bankphone",
					"custrecord_acq_loth_5b_de1_frthrcrdtacct",
					"custrecord_acq_loth_5b_de1_frthrcrdtname",
					"custrecord_acq_loth_5b_de1_addlinstrct",
					"custrecord_exrec_wire_cntry_iso3",
					"custrecord_exrec_wire_citizen_cntry_nm",
					"custrecord_exrec_wire_state_cd",
					"custrecord_acq_loth_5b_de1_wireverify",
					"custrecord_acq_lot_aba_wire_bank_name",
					"custrecord_acq_lot_wire_aba_status",
					"custrecord_exch_de1_imb_nameonbnkacct",
					"custrecord_exch_de1_imb_bankacctnum",
					"custrecord_exch_de1_imb_abarouting",
					"custrecord_exch_de1_imb_swiftbic",
					"custrecord_exch_de1_imb_bankname",
					"custrecord_acq_loth_5c_de2_checkspayto",
					"custrecord_acq_loth_5c_de2_checksmailto",
					"custrecord_acq_loth_5c_de2_checksaddr1",
					"custrecord_acq_loth_5c_de2_checksaddr2",
					"custrecord_acq_loth_5c_de2_checksaddr3",
					"custrecord_acq_loth_5c_de2_checkscity",
					"custrecord_acq_loth_5c_de2_checksstate",
					"custrecord_acq_loth_5c_de2_checkszip",
					"custrecord_acq_loth_5c_de2_checkscountry",
					"custrecord_acq_loth_5c_mch_checkspayto",
					"custrecord_acq_loth_5c_mch_checksmailto",
					"custrecord_acq_loth_5c_mch_checksaddr1",
					"custrecord_acq_loth_5c_mch_checksaddr2",
					"custrecord_acq_loth_5c_mch_checksaddr3",
					"custrecord_acq_loth_5c_mch_checkscity",
					"custrecord_acq_loth_5c_mch_checksstate",
					"custrecord_acq_loth_5c_mch_checkszip",
					"custrecord_acq_loth_5c_mch_checkscountry",
					"custrecord_acq_loth_6_de1_medallion",
					"custrecord_acq_loth_6_de1_medshrhldsig",
					"custrecord_acq_loth_6_de1_medallionnum",
					"custrecord_acq_loth_zzz_zzz_medalliontim",
					"custrecord_acq_loth_zzz_zzz_medallnimage",
					"custrecord_acq_loth_6_de1_medallion",
					"custrecord_acq_loth_6_de1_medshrhldsig",
					"custrecord_acq_loth_6_de1_medallionnum",
					"custrecord_acq_loth_zzz_zzz_medalliontim",
					"custrecord_acq_loth_zzz_zzz_medallnimage",
					"custrecord_acq_loth_5c_de1_checkspayto",
					"custrecord_acq_loth_5c_de1_checksmailto",
					"custrecord_acq_loth_5c_de1_checksaddr1",
					"custrecord_acq_loth_5c_de1_checksaddr2",
					"custrecord_acq_loth_5c_de1_checksaddr3",
					"custrecord_acq_loth_5c_de1_checkscity",
					"custrecord_acq_loth_5c_de1_checksstate",
					"custrecord_acq_loth_5c_de1_checkszip",
					"custrecord_acq_loth_5c_de1_checkscountry",
					"custrecord_exrec_chk_cntry_iso3",
					"custrecord_exrec_chk_citizen_cntry_nm",
					"custrecord_exrec_chk_state_cd"
					,"custrecord_exrec_shrhldr_settle_curr"
					]
		},    
    	
    	CHROME_RIVER_APP_NAME: "Chrome River Integration",

    	LUNA_APP_NAME: "LUNA",

    	SRS_GENERAL_APP_NAME: "General Settings",
    
    	MAX_ENTRIES_TO_SEND: 	25,		// Chrome River can only accept this many entries at a time via their REST API
    	
    	DEFAULT_LOCALE: "en",
    	
        SCRIPT_IDS: {
        	FIRST_SCRIPT:					"?"
        },

        DEPLOYMENT_IDS: {
        	FIRST_SCRIPT:					"?"
        },
        
        CUSTOMER_CATEGORY: {
        	DEAL:									"1",
        	SHAREHOLDER:				"2",
        	INVESTOR_GROUP:			"7"
        },
        
        EXPENSE_CATEGORY : {
        	"ACQUIOM_ESCROW_AGENT_FEE" : 37 //confirmed in Prod
        },
        
		DPS_SOURCE: {
				ENTERPRISE_CLIENT: 3
		},	
		VENDOR_BILL_STATUS : 
		{
			APPROVED : 2
		},
		ESCROW_AGENT_DISBURSEMENT_STATUS : 
		{
			"Canceled":4,
			"Completed":3,
			"Failed":2,
			"Initiated":1
		},
		PAYMENT_METHODS :
		{
		"ACH":9,
		"ACH (New)":14,
		"AES ACH":12,
		"AES CHECK":11,
		"AES Wire":13,
		"American Express":6,
		"Cash":1,
		"Check":2,
		"Discover":3,
		"EFT":8,
		"Master Card":4,
		"Undeposited Funds":10,
		"VISA":5,
		"Wire Transfer":7
		},
		CUSTOM_FORMS: {
			SRS_DEAL_EXPENSE_BILL : 111,
			 DEAL_ESCROW_AGENT:				296      // Staging: 325 Prod: 296
			,DEAL_ESCROW_AGENT_RESOLUTION:	298	      // Staging: 326 Prod: 298
			,SRS_DEAL_ACTION_RESOLUTION:	101      // Confirmed in Prod
			,ACQUIOM_INVOICE:				137      // Confirmed in Prod
			,SRS_DEAL_ACTION:				49         // Confirmed in Prod
			,ACQUIOM_VENDOR_BILL:			134			// Confirmed in Prod
			,SRS_INVOICE:					114			//Confirmed in Prod
			,ACQUIOM_CUST_REFUND: 			140
			,SRS_CUST_REFUND:               129
			,ACQ_DIST_AUTH:                 138
			,ACQ_ADD_PAYMT:                 147
		},
		
		DEPT: {
			ACQUIOM_ESCROW_AGENT: 			41, // Dev: 40; Staging: 41 NOTE: This department was renamed to Client Accounts - Escrow Agent
			GLOBAL_BUSINESS_DEVELOPMENT: 	4,
			CLIENT_ACCOUNT_SRS: 	18,
			ACQUIOM_OPERATIONS:				35,
			DATA_MANAGEMENT_AND_RELEASE:	34,
			POST_CLOSING_DISPUTE_MANAGEMENT: 5,
            LEGAL_AND_CORPORATE_DEVELOPMENT:16,	// 16=dev
			CLIENT_ACCOUNTS_ACQUIOM:		20,
			ACQUIOM	:						33	//Confirmed in Prod
		}, 

		PROJECT_TASK_MGMT_DEPT: {
			ACQUIOM_ESCROW_AGENT: 			14, // Confirmed in Prod
			CLAIMS_60:                       6 // Confirmed in Prod
		}, 
		
		AEA_STATEMENT_BATCH_STATUS: {
			GENERATING:			1,
			GENERATED:			2,
			APPROVING:			3,
			REJECTING:			4,
			READY_TO_SEND:		5,
			REJECTED:			6,
			SENDING:			7,
			COMPLETE:			8,
			CANCELLED:			9
		},
		
		AEA_STATEMENT_DETAIL_STATUS: {
			GENERATED:			1,
			APPROVED:			2,
			REJECTED:			3,
			SENT:				4
		},
		
		AEA_CRE_PROFILE:		22, // Stage = 21

		CLASS: {
			CLIENT_ACCOUNTS_ACQUIOM:	51,
			ACQUIOM_ESCROW_AGENT:	127, // NOTE: This class was renamed to Client Accounts - Escrow Agent
			CLIENT_ACCOUNTS_SRS: 38,
			ACQUIOM_CLEARINGHOUSE_LLC: 54		//Confirmed in Prod
		},
		
		RESOLUTION_TYPE:	{                 // This is custom list Settlement Type
			PENDING:						1
		},
		
		CUSTOM_DOCUMENT_TYPE: {
			ACQUIOM_ESCROW_AGENT:			449 // 549 in Staging 449 in Prod
		},
		
		CUSTOM_DOCUMENT_STATUS: {
			NOT_RECEIVED:					1
		},
		ACCOUNT : {
			ACQUIOM_ESCROW_AGENT_DR:	12996,		//same in production
			ACQUIOM_CLIENT_EXPENSES_ESCROW_DISTRIBUTIONS: 1816,
			ACQUIOM_ESCROW_AGENT_AR:	12997,		//same in production
			ACQUIOM_ESCROW_AGENT_AP: 	12998,
			AR_DUE_FROM_CLIENT_CASH : 336,
			AP_CLIENT_CASH: 	327,
			CORPORATE_ACCOUNTS_RECEIVABLE_NEW: 10331 //same in production
		},
		ITEM : {
			OPS_AEA_FEE_RECEIVED : 812,				//same in production
			ESCROW_AGENT_ANNUAL_FEE : 813,
			AEA_DISBURSEMENT : 815                  //same in production 
		},
		VENDOR : {
			ACQUIOM_CLEARINGHOUSE_LLC : 321416
		},
		USER_ROLE: {
			SRS_LEGAL: 						1020, 
			SRS_LEGAL_DOCKET_ENTERER_RRD: 	1038,
			ADMINISTRATOR:					3,
			RESTLET_ADMINISTRATOR:			1072,
			CUSTOM_ADMINISTRATOR:			1050,
			SRS_OPERATIONS_MANAGER:         1025,	
		   	SRS_OPERATIONS_ANALYST:         1032,	
		   	SRS_SALES_MANAGER:         		1021
		},
		
        SHAREHOLDER_LETTER_STATUS: {
        	READY_TO_GEN_SUBLIST:			1,
        	SUBLIST_GENERATION_IN_PROGRESS:	2,
        	SUBLIST_GENERATED:				3,
        	SENDING_SHAREHOLDER_LETTERS:	4,
        	SHAREHOLDER_LETTERS_SENT:		5,
        },        
        
        SHAREHOLDER_LETTER_DISTRIBUTION_STATUS: {
        	PENDING:			1,
        	FAILED_RETRYING:	2,
        	FAILED_ABANDONED:	3,
        	COMPLETED:			4
        },
        
        ESCROW_CONTACT_ROLES: {
        	ACQUIOM_ESCROW_AGENT_CLIENT: 49
        },
        
        PREPARED_EMAIL_JOB_STATUS: {
			  NEW: 1,
			  IN_PROCESS: 2,
			  CANCELED: 3,
			  COMPLETED: 4,
			  ERROR: 5,
			  READY_FOR_CONFIRMATION: 6,
			  APPROVED: 7,
			  REJECTED: 8,
			  REVIEW_COMPLETE: 9,
			  PAUSED: 10
  	},
      
        SCRIPT_NAMES: {
        	MOVE_ERS_TO_PAYMENT_DASHBOARD:			"customscript_srs_update_ers",
        	UTILITIES_SUITELET:						"customscript_srs_sl_utilities",
        	ANONYMOUS_UTILITIES_SUITELET:			"customscript_srs_sl_anonymous_utilities",
        	GENERATE_SHAREHOLDER_LETTER_RECORDS:	"customscript_srs_sc_gen_shr_ltr_recs",
        	GENERATE_EXPIRATION_LETTER_RECORDS:		"customscript_srs_sc_gen_exp_ltr_recs",
        	UPDATE_ACCOUNT_AUDIENCES_QM_SCRIPT:		"customscript_update_account_audiences_qm",
        	SEND_SHAREHOLDER_LETTERS:				"customscript_srs_sc_send_shr_letters",
        	SEND_EXPIRATION_LETTERS:				"customscript_srs_sc_send_exp_letters"
        	,PAID_UNPAID:                           "customscript_generate_pup_deal_list_que"
            ,PAID_UNPAID2:                          "customscript_generate_pup_deal_list_que2"
        },
        

        SCRIPT_DEPLOYMENTS: {
        	UTILITIES_SUITELET:						"customdeploy_srs_sl_utilities",
        },
        
        QUEUE_NAMES: {
        	MOVE_ERS_TO_PAYMENT_DASHBOARD:			"Move To Payment Dashboard",
        	GENERATE_SHAREHOLDER_LETTER_RECORDS:	"GenShareholderLetterRecords",
        	GENERATE_EXPIRATION_LETTER_RECORDS:		"GenExpirationLetterRecords",
        	UPDATE_ACCOUNT_AUDIENCE:				"Update Account Audience",
        	RSM:									"RSM",
        	RSM_MAP_REDUCE:							"RSM Map/Reduce"
        	,PAID_UNPAID:                           "PaidUnpaid"
        },
        "Client Fund Release Status" : {  
			"In Progress" : 1,
			"Pending Approval" : 2,
			"Approved" : 3,
			"Rejected" : 4,
			"Cancelled" : 5,
			"Completed" : 6,
			"Failed" : 7
		},
        "DER Deficiencies" : {
			"Ops Approved to Pay" : 5,
			"Acquiom Approved to Pay" :1,
			"Counsel Approved to Pay" :3
		},
		"Acquiom LOT Status" : {
			"1. Exchange Record Created":1,
			"2. LOT Sent":2,
			"3. Ready for Data Entry":3,
			"3b. Awaiting Documents":9,
			"4. Ready for Review":4,
			"4b. Reviewed - Changes Made":6,
			"5. Approved for Payment":5,
			"5b. Upon Approval Ready for Payment":7,
			"5e. Queued for Payment Processing":15,
			"5f. Payment Processing":16,
			"6. Paid (Refund Issued)":8,
			"Exception: Need Copy of Certificate(s)":10,
			"Exception: Need Signed LOT":13,
			"Exception: Need W-8":11,
			"Exception: Need W-9":12,
			"LOT Requires Follow Up":14
			},
			"Shareholder LOT Status" : {
				"1. Shareholder Created / Awaiting LOT Send":1,
				"2. LOT Sent / Awaiting LOT Received":2,
				"3a. Received via manual":3,
				"3b. Received via web entry":4,
				"4. Ready for Approval":5,
				"5. Ready for Payment":6,
				"6. Payment Sent":7,
				"7. Paid":8,
				"Exception: Waiting for Returned Documents":9
				},
		"Payment Instruction Type" : {
			"Acquiom Deal Specific":10,
			"Default":9,
			"Exchange Record":11,
			"SRS Deal":12
			},
			"Payment File Type" : 
			{
				"Flat File":1,
				"NACHA":2,
				"Check":3
				,"ISO20022":5
				,"SimpleXML":6
			},
			"PFT Account Options" : 
			{
				"Uses Omnibus Account":1,
				"GL Account Selection Required":2
			},
			"CRE Request Status" :
			{
				"Open" : 1, 
				"In Progress" : 2,
				"Failed" : 3,
				"Completed" : 4,
				"Initializing" : 5
			},
			"Payment File Delivery Status" :
			{
				"File Not Yet Created" : 1, 
				"Waiting for Approval" : 2,
				"Ready For Download" : 3, 
				"Delivery Failed" : 4,
				"Ready For Download" : 5,
				"Downloaded" : 6,
				"Cancelled" : 7,
				"Pending Async Delivery" : 8
			},
			"Check Max Amount" : 99999999.99,
			"CRE Request Detail Document Completion Action" :
			{
				"Delete Detail Output Document" : 1,
				"Set Available Without Login Off" : 2
			},
			"CUST_REFUND_SUBLIST_COLUMNS" : {
				"EXCLUDE_FLAG_INDEX" : 0,
				"LINK_INDEX" : 1,
				"INTERNAL_ID_INDEX" : 2, // this contains unique values that can ID that particular record
				"DEAL_LINK_INDEX" : 3,
				"TRANSACTION_TYPE_INDEX" : 4, //Was 3 prior to Mitch Saved Search rebuild
				"PAYMENT_TOTAL_INDEX" : 7 //Was 36 prior to Mitch Saved Search rebuild
			}
		,"DATACENTER_URLS" : "https://system.netsuite.com/rest/datacenterurls?account="
		,"GENERAL_RESTLET_10_SCRIPTID" : "customscript_srs_general_restlet_10"
		,"GENERAL_RESTLET_10_DEPLOYID" : "customdeploy_srs_general_restlet_10"
        ,PUP_EMAIL_SENDER : 77671
       	,PUP_EMAIL_RECIPIENT: "pupsupport@srsacquiom.com"
       	,PUP_FREQUENCY : {
       		"Always":1,
       		"Month End":4,
       		"Never":2,
       		"Transactional":3,
       		"Transactional and Month End":5
       	},
        "Escrow Type" : {
			"Paying Account" : 45
		},
		"Account Audience":
		{
			"Buyer":1,
			"Seller": 2,
			"Outside Paying Agent":3,
			"Buyer Counsel":4,
			"Seller Counsel":5,
			"Internal Only":6,
			"Shareholder":7
		},
        "RSM Evaluation Result" : {
			"Never Run" : 1,
			"Passed" :2,
			"Failed" :3
		}
        ,PUP_DEAL_JOB_STATUS : {
       		"Started":1,
       		"Complete":2
       	}
        ,"Tax Form Batch Refresh Miliseconds" : 2750 
        ,"Tax Form Batch Status" : 
        {
        	"Draft":1,
        	"Submitted":2,
        	"IRS Filing In Progress":3,
        	"Filed with IRS":4,
        	"Correction Pending":5,
        	"Cancelled":6,
        	"Submit Failed":9,
        	"Processing Submit":10
       	}
        ,"Tax Form Status" : 
        {
        	"Draft":1,
        	"Removed":2,
        	"Generated":3,
        	"Delivered":4,
        	"Inactive":5,
        	"Failed":6
       	}
        //"Tax Form Batch Detail Columns" represents columns AND filters to be rendered 
        //on tax form batch page
        ,"Tax Form Batch Detail Columns" : 	//these columns are used to render Detail Tax Form Batch Sublist 
		[
			{
				"id": "isinactive",			//internal id of the field as defined in netsuite 
				"columnlabel": "Inactive",	//label under which this field will be shown 
				"filterlabel": "Show Inactive",	//label under which this field will be shown 
				"isAvailableFilter":true,	//if true, it will be added to as part of the search 
				"showAvailableFilter":true,	//if true, filter will be added above the columns 
				"helpText": "When selected, 'Mark All', 'Unmark All', and 'Select' checkboxes will be hidden. Both active and inactive Tax Form Batch Detail records will be shown.",
				"operator":"is",			//operator to be used in search; if not provided, anyof will be used 
				"sort":"",					//sort option for this column ASC/DESC
				"filterparam" : "isinactive",//in the URL this filter will be represented with with this 'user friendly' name
				"filtertype" : "CHECKBOX",	 //this filter is of type 
				"columntype" : "TEXT",		//this column is of this type
				"showColumn":false			//controls if column will be show or not 
			},
		 	{
		 		"id": "internalid",
		 		"recordtype" : "customrecord_tax_form_batch_detail", //if provided, link will be created to open this record
				"columnlabel": "Id",
		 		"filterlabel": "Id",
		 		"isAvailableFilter":false,	
		 		"showAvailableFilter":false,
		 		"operator":"anyof",
		 		"sort":"",					
		 		"filtertype" : "TEXT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 			
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_deal",
		 		"recordtype" : "customer", //if provided, link will be created to open this record
				"columnlabel": "Deal",
		 		"filterlabel": "Deal",
		 		"isAvailableFilter":true,
		 		"showAvailableFilter":true,
		 		"helpText": "Tax Form Batch Detail records are filtered based on the selected Deals.",
				"operator":"anyof",
		 		"sort":"ASC",
				"filterparam" : "deals",
		 		"filtertype" : "MULTISELECT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_shareholder",
		 		"recordtype" : "customer", //if provided, link will be created to open this record
				"columnlabel": "Shareholder",
		 		"filterlabel": "Shareholder",
		 		"isAvailableFilter":true,
		 		"showAvailableFilter":true,
		 		"helpText": "Tax Form Batch Detail records are filtered based on the selected Shareholder.",
		 		"operator":"anyof",
		 		"sort":"ASC",
		 		"filterparam" : "shareholder",
		 		"filtertype" : "SELECT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_txid",
		 		"columnlabel": "Tax ID",
		 		"filterlabel": "Tax ID",
		 		"isAvailableFilter":true,
		 		"showAvailableFilter":true,
		 		"helpText": "Tax Form Batch Detail records are filtered based on the entered Tax id.",
		 		"operator":"is",
		 		"sort":"",
				"filterparam" : "taxid",
		 		"filtertype" : "TEXT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_status",
		 		"columnlabel": "Status",
		 		"filterlabel": "Status",
		 		"isAvailableFilter":true,
		 		"showAvailableFilter":true,
		 		"helpText": "Tax Form Batch Detail records are filtered based on Status.",
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "status",
		 		"filtertype" : "SELECT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_version",
		 		"columnlabel": "Form Version",
		 		"filterlabel": "Form Version",
		 		"isAvailableFilter":true,
		 		"showAvailableFilter":true,
		 		"helpText": "Tax Form Batch Detail records are filtered based on the selected Form Version.",
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "version",
		 		"filtertype" : "SELECT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_delivery",
		 		"columnlabel": "Delivery Type",
		 		"filterlabel": "Delivery Type",
		 		"isAvailableFilter":true,
		 		"showAvailableFilter":true,
		 		"helpText": "Tax Form Batch Detail records are filtered based on the selected Delivery Type.",
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "delivery",
		 		"filtertype" : "SELECT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_box1d_proceed",
		 		"columnlabel": "Box 1D",
		 		"filterlabel": "Box 1D",
		 		"isAvailableFilter":false,
		 		"showAvailableFilter":false,
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "box1d",
		 		"filtertype" : "TEXT",
		 		"columntype" : "CURRENCY",
		 		"showColumn":true
		 		
		 	},
		 	{
		 		"id": "custrecord_txfm_detail_box4_fedwithheld",
		 		"columnlabel": "Box 4",
		 		"filterlabel": "Box 4",
		 		"isAvailableFilter":false,
		 		"showAvailableFilter":false,
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "box4",
		 		"filtertype" : "TEXT",
		 		"columntype" : "CURRENCY",
		 		"showColumn":true
		 	},
			{
		 		"id": "custrecord_txfm_detail_box1e_cost_other",
		 		"columnlabel": "Box 1E",
		 		"filterlabel": "Box 1E",
		 		"isAvailableFilter":false,
		 		"showAvailableFilter":false,
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "box1e",
		 		"filtertype" : "TEXT",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
			{
		 		"id": "created",
		 		"columnlabel": "Date Created",
		 		"filterlabel": "",
		 		"isAvailableFilter":false,
		 		"showAvailableFilter":false,
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "",
		 		"filtertype" : "",
		 		"columntype" : "TEXT",
		 		"showColumn":true
		 	},
			{
		 		"id": "custrecord_txfm_detail_processing_notes",
		 		"columnlabel": "Processing Notes",
		 		"filterlabel": "Processing Notes",
		 		"isAvailableFilter":false,
		 		"showAvailableFilter":false,
		 		"operator":"anyof",
		 		"sort":"",
		 		"filterparam" : "notes",
		 		"filtertype" : "TEXT",
		 		"columntype" : "TEXTAREA",
		 		"showColumn":false
		 	},
		 	{
				"id": "custrecord_txfm_detail_batch_id",
				"columnlabel": "Tax Form Batch",
				"filterlabel": "Tax Form Batch",
				"isAvailableFilter":true,	//if true, it will be added to sublist as a filter
				"showAvailableFilter":false,
				"operator":"anyof",
				"sort":"",
		 		"filterparam" : "taxformbatch",
				"filtertype" : "TEXT",
				"columntype" : "TEXT",
				"showColumn":false
			}
        ]
        //these are the columns to be used in 
        //Tax Form Batch Preview page
        ,"Tax Form Batch Preview Columns" : //these columns are used to render Preview Tax Form Batch Sublist 
    	[
         {
             "id": "custrecord_acq_loth_zzz_zzz_deal",
             "columnlabel": "Deal",
             "columntype":"TEXT"
           },
           {
             "id": "custrecord_acq_loth_zzz_zzz_shareholder",
             "columnlabel": "Shareholder",
             "recordtype" : "customer",
             "columntype":"TEXT"
           },
           {
             "id": "custrecord_acq_loth_2_de1_ssnein",
             "columnlabel": "Tin",
             "columntype":"TEXT"
           },
           {
             "id": "custrecord_act_lotce_tax_report_amount",
             "columnlabel": "Box 1D",
             "columntype":"CURRENCY"
           },
           {
             "id": "custrecord_acq_lotce_zzz_zzz_taxwithheld",
             "columnlabel": "Box 4",
             "columntype":"CURRENCY"
           }
         ]
        ,"Tax Form Batch Detail Delivery Type" : 
        {
        	"E-Mail":1,
        	"Mail":2
       	}
        ,"Default Payer Financial Entity" : 69
        ,"Default Payer Phone" : "(303) 222-2080"
        ,"Tax Form Batch Payer Type" : 
        {
        	"Acquiom Financial":1,
        	"Buyer":2,
        	"Seller":3,
        	"Other":4
       	}
    };
});