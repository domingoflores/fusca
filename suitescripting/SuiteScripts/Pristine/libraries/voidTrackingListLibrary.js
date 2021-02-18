/**
 * voidTrackingListLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * Centralized library of all lists used in Void Tracking project, so if internal IDs
 * are altered, only one location has to be changed.
 *
 * include '/SuiteScripts/Pristine/libraries/voidTrackingListLibrary.js'
 * Version    	Date            Author          Remarks
 *	1.0		  				  	Ken C 			Initial version 
 *  2.0 		Dec 2019		Ken C 			ATP-1350			
 */

define([],

	function() {

		var vtList = 		{
			vtStatus: 		{	"InProgress": 1, "Canceled": 2, "Completed": 3, "AwaitingFunds": 4, 
								"PendingResearch": 5, "Voiding": 6 },
			yesNo: 			{	"Yes": 1, "No": 2 },
			respParty:      {	"Payee": 1, "SRS": 2, "Buyer": 3, "Counsel": 4 },
			vtReturnReason: {	"AccountClosed": 1, "AccountNotFound": 2, "BeneficiaryDeniedPayment": 3, 
								"InvalidAccount": 4,"InvalidCurrency": 5,"PosPayException": 6 }
		};
		
		var recordType = {VoidTracking: 894};

		var caseCreation = {
			category: 564, // Information Update (Contact / Payment) 
			queue: 119, // Payments Support
			department: 35, // Acquiom Operations
			status: 1, // Not Started
			dealAction: 3 // No (Yes/No/Unknown)
		};

		var exRecUpdate = {
			acquiomStatus: 4,
			shareholderStatus: 5
		};

		var transactionConstant = {
			customformAcquiomInvoice: 137, // Acquiom Invoice
			customformAcquiomVendorBill: 134, // Acquiom Vendor Bill
			classClientAccountsAcquiom: 51, // Client Accounts - Acquiom
			classAcquiomFinancial: 69, // Acquiom Financial
			classAcquiomClearinghouse: 54, // Acquiom Clearinghouse LLC
			departmentClientAccountsAcquiom: 20, // Client Accounts - Acquiom
			departmentAcquiomOperations: 35, // Acquiom Operations
			itemBankFeeReimbursement: 787, // Reimbursement of Bank Fee
			itemShareholderProceeds: 264, // Shareholder Proceeds
			itemCertificateProceeds: 261, // Certificate Proceeds
			vendorAcquiomFinancial: 344281,
			vendorAcquiomClearinghouse: 321416,
			vendorContraBank: 1043944,
			dealPayingBankAccount: 1000205698540,
			expenseCategoryAcqClearinghouseFeeReimbursement: 25,
			expenseCategoryFeeChargedByBank: 35,
			bankAccountAcqFinLLCComerica: 6337,
			bankAccountAcqClearinghouseLLCCapital1: 3396,
			bankAccountAcqClearinghouseVectraOperating: 13309,
			acquiomClientFundsBankServiceChargeClearingAccount: 3080,
			apAccountAcquiom1: 3076, //002175
			apAccountTradeAdjustments: 12494,
			paymentMethodWireTfr: 7
		};

		return {
			vtList: vtList,
			recordType: recordType,
			caseCreation: caseCreation,
			exRecUpdate: exRecUpdate,
			transactionConstant: transactionConstant
		};
	});