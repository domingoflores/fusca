//-----------------------------------------------------------------------------------------------------------
// Copyright 2018 and Beyond, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/*
 * 
 * Prolecto Utilities Bundle: Common Library of Extensions, Types, Constants and Functions available to both Client and Server scripts
 * 
 */

	
define(['N/record','N/search','N/runtime','N/format','N/email', 'N/https', 'N/url', 'N/util'],

		
	function(record, search, runtime, format, email, https, url, util) {

		var scriptName = "PRI_CommonLibrary.";

		"use strict";


		var timerQueue = []; 
		
	// === DATE PROTOTYPES ==========================================================================================================
	
		Date.prototype.addDays = Date.prototype.addDays || function( days ) {
		   	return this.setDate( this.getDate() + days ) && this;
		};
	
		// NOTE: 	add +1 month to "01/31/2017" will give you 02/28/2017 
		//			add -1 month to 03/31/2017 will give you 02/28/2017
		Date.prototype.addMonths = Date.prototype.addMonths || function(nbrOfMonths) {			 
			var m, d = (date = new Date(+this)).getDate()

			date.setMonth(date.getMonth() +nbrOfMonths, 1)
			m = date.getMonth()
			date.setDate(d)
			if (date.getMonth() !== m) date.setDate(0);

			return date;	  
		}
		
		
		Date.prototype.diffDays = Date.prototype.diffDays || function(b) {
			
			var MS_PER_DAY = 86400000;
			
			var utc1 = Date.UTC(this.getFullYear(), this.getMonth(), this.getDate());
			var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
	
			return Math.floor((utc2 - utc1) / MS_PER_DAY);		
		} 
		

		// given a date, returns the date that is the first day of that month	(eg 07/15/2018 would return 07/01/2018
		Date.prototype.firstDayOfMonth = Date.prototype.firstDayOfMonth || function() {
			return new Date(this.getFullYear(), this.getMonth(), 1);
		}

		
		// given a date, returns the date that is the last day of that month	(eg 07/15/2018 would return 07/31/2018
		Date.prototype.lastDayOfMonth = Date.prototype.lastDayOfMonth || function() {
			return new Date(this.getFullYear(), this.getMonth() + 1 , 0);
		}


		Date.prototype.format = Date.prototype.format || function (formatString) {
			var element = "";
			var i = 0;
			var result = "";

			do {
				if ( (element.length > 0) && (formatString.charAt(i).toLowerCase() != element.substring(element.length-1).toLowerCase()) ) {
					result += formatDateTimeElement(this, element);
					element = "";
				}
				element += formatString.charAt(i++);
			} while (i <= formatString.length);

			if (element.length > 0)
				result += formatDateTimeElement(d, element);

			return result;
		}
		
		
		// === STRING PROTOTYPES ==========================================================================================================
		
		String.prototype.startsWith = String.prototype.startsWith || function(searchString) {
			return this.substr(0, searchString.length) === searchString;
		};

		String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
			return this.slice(-suffix.length) == suffix;
		};

		String.prototype.replaceAll = String.prototype.replaceAll  || function(replaceWhat, replaceWith) {
			return this.replace(new RegExp(replaceWhat, 'g'), replaceWith);
		}

	    String.prototype.padLeft = String.prototype.padLeft || function(len, c) {
	        var s = this, c= c || '0';
	        while(s.length < len) s = c+ s;
	        return s;
	    }

		// === NUMBER PROTOTYPES ==========================================================================================================
		
		Number.prototype.formatWithCommas = Number.prototype.formatWithCommas  || function(){
			return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		};

	    Number.prototype.isInteger = Number.prototype.isInteger || function() {
	        return typeof this === "number" && isFinite(this) && Math.floor(this) === this;
	    };
	    
		// ===== MISC =====================================================================================================================


		var FORM_DELIMITERS = {
				FIELD_DELIMITER: /\u0001/,
				LINE_DELIMITER: /\u0002/,
				MULTI_SELECT_FIELD_DELIMITER:  /\u0005/
		},

		

		ITEM_TYPE_MAP = { 
				'Assembly': 	'assemblyitem',										
				'Description': 	'descriptionitem',
				'Discount': 	'discountitem',
				'Group': 		'itemgroup',										
				'InvtPart': 	'inventoryitem',
				'Kit': 			'kititem',										
				'Markup': 		'markupitem',										
				'OthCharge': 	'otherchargeitem',										
				'Subtotal': 	'subtotalitem',										
				'Payment': 		'paymentitem',										
				'Service': 		'serviceitem',										
				'NonInvtPart': 	'noninventoryitem'
		};

		// generic items
		// -30 : transaction
		// -10 : item
		// -2 : customer/lead/prospect
		
		NATIVE_RECORD_INTERNAL_IDS = {
				"_-30": "transaction",
				"_-10": "item",
				"_-2": "customer",
				"_-112": "account",
				"_-253": "accountingbook",
				"_-255": "appdefinition",
				"_-254": "apppackage",
				"_-139": "billingclass",
				"_-141": "billingschedule",
				"_-242": "bin",
				"_-24": "campaign",
				"_-130": "campaignresponse",
				"_-290": "charge",
				"_-101": "classification",
				"_-108": "competitor",
				"_-6": "contact",
				"_-158": "contactcategory",
				"_-157": "contactrole",
				"_-155": "costcategory",
				"_-122": "currency",
				"_-109": "customercategory",
				"_-161": "customermessage",
				"_-104": "customerstatus",
				"_-102": "department",
				"_-120": "emailtemplate",
				"_-4": "employee",
				"_-252": "entityaccountmapping",
				"_-126": "expensecategory",
				"_-250": "globalaccountmapping",
				"_-260": "inventorydetail",
				"_-266": "inventorynumber",
				"_-26": "issue",
				"_-251": "itemaccountmapping",
				"_-246": "itemdemandplan",
				"_-269": "itemrevision",
				"_-247": "itemsupplyplan",
				"_-7": "job",
				"_-177": "jobtype",
				"_-103": "location",
				"_-294": "manufacturingcosttemplate",
				"_-36": "manufacturingoperationtask",
				"_-288": "manufacturingrouting",
				"_-303": "note",
				"_-180": "notetype",
				"_-31": "opportunity",
				"_-181": "othernamecategory",
				"_-5": "partner",
				"_-182": "partnercategory",
				"_-183": "paymentmethod",
				"_-265": "payrollitem",
				"_-22": "phonecall",
				"_-186": "pricelevel",
				"_-187": "pricinggroup",
				"_-287": "projectexpensetype",
				"_-27": "projecttask",
				"_-121": "promotioncode",
				"_-28": "resourceallocation",
				"_-191": "salesrole",
				"_-128": "salestaxitem",
				"_-25": "solution",
				"_-117": "subsidiary",
				"_-23": "supportcase",
				"_-21": "task",
				"_-127": "taxperiod",
				"_-199": "term",
				"_-256": "timebill",
				"_-201": "unitstype",
				"_-3": "vendor",
				"_-110": "vendorcategory",
				"_-203": "winlossreason",
			}
		
		//
		//	use like this:	RECORD_TYPE_INFO.salesorder.PARTIALLY_FULFILLED.statusCode			gives you "D";
		//					RECORD_TYPE_INFO.salesorder.PARTIALLY_FULFILLED.statusName			gives you partiallyFulfilled
		//					RECORD_TYPE_INFO.salesorder.PARTIALLY_FULFILLED.searchStatusCode	gives you SalesOrd:D
		//					RECORD_TYPE_INFO.salesorder.shortName								SalesOrd
		//
		
		RECORD_TYPE_INFO = {
			// ITEMS
			item: {shortName: "?", textName: "?", recordId: 0, isItem: true, isGeneric: true, permissionCode: "LIST_ITEM"},
			assemblyitem: {shortName: "Assembly", textName: "?", recordId: -10, isItem: true, permissionCode: "LIST_ITEM"},
			descriptionitem: {shortName: "Description", textName: "?", recordId: 0, isItem: true, permissionCode:"LIST_ITEM"},
			discountitem: {shortName: "Discount", textName: "?", recordId: 0, isItem: true, permissionCode:"LIST_ITEM"},
			inventoryitem: {shortName: "InvtPart", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			itemgroup: {shortName: "Group", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			downloaditem: {shortName: "?", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			lotnumberedassemblyitem: {shortName: "?", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			lotnumberedinventoryitem: {shortName: "?", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			markupitem: {shortName: "Markup", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			kititem: {shortName: "Kit", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			noninventoryitem: {shortName: "NonInvtPart", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			salestaxitem: {shortName: "?", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_TAXITEM"},
			serializedassemblyitem: {shortName: "?", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			serializedinventoryitem: {shortName: "?", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			otherchargeitem: {shortName: "OthCharge", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			serviceitem: {shortName: "Service", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			subtotalitem: {shortName: "Subtotal", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},
			paymentitem: {shortName: "Payment", textName: "?", recordId: 0, isItem: true, permissionCode: "LIST_ITEM"},

			
			// ENTITIES
			entity: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode: "LIST_ENTITY"},
			lead: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode: "LIST_CUSTJOB"},
			job: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode: "LIST_JOB"},
			prospect: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode: "LIST_CUSTJOB"},
			customer: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode: "LIST_CUSTJOB"},
			contact: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode:"LIST_CONTACT"},
			vendor: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode:"LIST_VENDOR"},
			partner: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode: "LIST_PARTNER"},
			employee: {shortName: "?", textName: "?", recordId: 0, isEntity: true, permissionCode:"LIST_EMPLOYEE"},
			
			
			// CLASSIFICATIONS
			"class": {shortName: "?", textName: "?", recordId: 0, recordId: -101, isSegment: true, permissionCode: "LIST_CLASS"},
			department: {shortName: "?", textName: "?", recordId: 0, recordId: -102, isSegment: true, permissionCode: "LIST_DEPARTMENT"},
			location: {shortName: "?", textName: "?", recordId: 0, recordId: -103, isSegment: true, permissionCode: "LIST_LOCATION"},
			subsidiary: {shortName: "?", textName: "?", recordId: 0, recordId: -117, isSegment: true, permissionCode: "LIST_SUBSIDIARY"},


			// MISC
			account: {shortName: "?", textName: "?", recordId: -112, permissionCode: "LIST_ACCOUNT"},			
			accountingperiod: {shortName: "?", textName: "?", recordId: -105},			
			calendarevent: {shortName: "event", textName: "?", recordId: -20},



			// TRANSACTIONS
			transaction: {shortName: "transaction", textName: "?", recordId: 0, isGeneric: true, isTransaction: true},
			
			assemblybuild: {shortName: "Build", textName: "Assembly Build", recordId: -30, isTransaction: true, permissionCode: "TRAN_BUILD"},
			assemblyunbuild: {shortName: "Unbuild", textName: "Assembly Unbuild", recordId: -30, isTransaction: true, permissionCode: "TRAN_UNBUILD"},
			
			cashrefund: {shortName: "?", textName: "Cash Refund", recordId: -30, isTransaction: true, permissionCode:"TRAN_CASHRFND"},
			cashsale: {shortName: "?", textName: "Cash Sale", recordId: -30, isTransaction: true, permissionCode:"TRAN_CASHSALE"},
			check: {shortName: "?", textName: "?", recordId: 0, isTransaction: true, permissionCode:"TRAN_CHECK"},
			intercompanyjournalentry: {shortName: "?", textName: "?", recordId: 0, isTransaction: true, permissionCode:"TRAN_JOURNAL"},
			
			creditcardcharge: {shortName: "CardChrg", textName: "Credit Card", isTransaction: true},  
			creditcardrefund: {shortName: "CardRfnd", textName: "CCard Refund", isTransaction: true},  
			
			creditmemo: {shortName: "CustCred", textName: "Credit Memo", isTransaction: true, permissionCode:"TRAN_CUSTCRED",
				APPLIED: {statusCode:"B", statusName: "applied", searchStatusCode: "CustCred:B", statusText: "Fully Applied"},
				OPEN: {statusCode:"A", statusName: "open", searchStatusCode: "CustCred:A", statusText: "Open"},
				VOIDED: {statusCode:"V", statusName: "voided", searchStatusCode: "CustCred:V", statusText: "Voided"}
			}, 
			customerdeposit: {shortName: "CustDep", textName: "Customer Deposit", isTransaction: true, permissionCode:"TRAN_CUSTDEP", 
				NOT_DEPOSITED: {statusCode:"A", statusName: "notDeposited", searchStatusCode: "CustDep:A", statusText: "Not Deposited"},
				APPLIED: {statusCode:"C", statusName: "applied", searchStatusCode: "CustDep:C", statusText: "Fully Applied"},
				DEPOSITED: {statusCode:"B", statusName: "deposited", searchStatusCode: "CustDep:B", statusText: "Deposited"},
				UNAPPROVED_PAYMENT: {statusCode:"D", statusName: "unapprovedPayment", searchStatusCode: "CustDep:D", statusText: "Unapproved Payment"}
			},
			customerpayment: {shortName: "CustPymt", textName: "Payment", isTransaction: true,  permissionCode:"TRAN_CUSTPYMT",
				DEPOSITED: {statusCode:"C", statusName: "deposited", searchStatusCode: "CustPymt:C", statusText: "Deposited"},
				NOT_DEPOSITED: {statusCode:"B", statusName: "notDeposited", searchStatusCode: "CustPymt:B", statusText: "Not Deposited"},
				UNAPPROVED_PAYMENT: {statusCode:"A", statusName: "unapprovedPayment", searchStatusCode: "CustPymt:A", statusText: "Unapproved Payment"}
			},		
			customerrefund: {shortName: "CustRfnd", textName: "Customer Refund", isTransaction: true, permissionCode:"TRAN_CUSTRFND",
				VOIDED: {statusCode:"V", statusName: "voided", searchStatusCode: "CustRfnd:V", statusText: "Voided"}
			},

			deposit: {shortName: "Deposit", textName: "Deposit", isTransaction: true}, 
			depositapplication: {shortName: "DepAppl", textName: "Deposit Application", isTransaction: true, permissionCode:"TRAN_DEPAPPL"},
			
			estimate: {shortName: "Estimate", textName: "Estimate", isTransaction: true,  permissionCode:"TRAN_ESTIMATE", 
				CLOSED: {statusCode:"C", statusName: "closed", searchStatusCode: "Estimate:C", statusText: "Closed"},
				EXPIRED: {statusCode:"X", statusName: "expired", searchStatusCode: "Estimate:X", statusText: "Expired"},
				OPEN: {statusCode:"A", statusName: "open", searchStatusCode: "Estimate:A", statusText: "Open"},
				PROCESSED: {statusCode:"B", statusName: "processed", searchStatusCode: "Estimate:B", statusText: "Processed"},
				VOIDED: {statusCode:"V", statusName: "voided", searchStatusCode: "Estimate:V", statusText: "Voided"}
			},

			expensereport: {shortName: "?", textName: "Expense Report", recordId: 0, isTransaction: true, permissionCode:"TRAN_EXPREPT",
				IN_PROGRESS: {statusCode: "A", statusName: "InProgress", searchStatusCode: "ExpRept:A", statusText: "In Progress"},
				APPROVED_OVERRIDDEN_BY_ACCOUNTING: {statusCode: "G", statusName: "?", searchStatusCode: "ExpRept:G", statusText: "?"},
				APPROVED_BY_ACCOUNTING: {statusCode: "F", statusName: "?", searchStatusCode: "ExpRept:G", statusText: "?"},
				PAID_IN_FULL: {statusCode: "I", statusName: "?", searchStatusCode: "ExpRept:I", statusText: "Paid In Full"},
				PAYMENT_IN_TRANSIT: {statusCode: "J", statusName: "?", searchStatusCode: "ExpRept:J", statusText: "?"},
				PENDING_ACCOUNTING_APPROVAL: {statusCode: "C", statusName: "?", searchStatusCode: "ExpRept:C", statusText: "?"},
				PENDING_SUPERVISOR_APPROVAL: {statusCode: "B", statusName: "?", searchStatusCode: "ExpRept:B", statusText: "?"},
				REJECTED_OVERRIDDEN_BY_ACCOUNTING: {statusCode: "H", statusName: "?", searchStatusCode: "ExpRept:H", statusText: "?"},
				REJECTED_BY_ACCOUNTING: {statusCode: "E", statusName: "?", searchStatusCode: "ExpRept:E", statusText: "?"},
				VOIDED: {statusCode: "V", statusName: "?", searchStatusCode: "ExpRept:V", statusText: "?"}
			},
			
			fxreval: {shortName: "FxReval", textName: "Currency Revaluation", isTransaction: true}, 
			inventoryadjustment: {shortName: "InvAdjst", textName: "Inventory Adjustment", isTransaction: true,  permissionCode:"TRAN_INVADJST"},
			inventorytransfer: {shortName: "InvTrnfr", textName: "Inventory Transfer", isTransaction: true}, 

			invoice: {shortName: "CustInvc", textName: "Invoice", isTransaction: true,  permissionCode:"TRAN_CUSTINVC", 
				OPEN: {statusCode:"A", statusName: "open", searchStatusCode: "CustInvc:A", statusText: "Open"},
				PAID_IN_FULL: {statusCode:"B", statusName: "paidInFull", searchStatusCode: "CustInvc:B", statusText: "Paid In Full"},
				VOIDED: {statusCode:"V", statusName: "voided", searchStatusCode: "CustInvc:V", statusText: "Voided"}
				// missing Pending Approval and Rejected
			}, 

			itemfulfillment: {shortName: "ItemShip", textName: "Item Fulfillment", isTransaction: true, permissionCode:"TRAN_ITEMSHIP", 
				PACKED: {statusCode:"B", statusName: "packed", searchStatusCode: "ItemShip:B", statusText: "Packed"},
				PICKED: {statusCode:"A", statusName: "picked", searchStatusCode: "ItemShip:A", statusText: "Picked"},
				SHIPPED: {statusCode:"C", statusName: "shipped", searchStatusCode: "ItemShip:C", statusText: "Shipped"}
			},

			itemreceipt: {shortName: "ItemRcpt", textName: "Item Receipt", isTransaction: true, permissionCode:"TRAN_ITEMRCPT"}, 

			journalentry: {shortName: "Journal", textName: "Journal Entry", isTransaction: true, permissionCode:"TRAN_JOURNAL", 
				APPROVED: {statusCode:"B", statusName: "approved", searchStatusCode: "approved:B", statusText: "Approved for Posting"}
				// missing A - Pending Approval
				// missing R - Rejected
			}, 

			opportunity: {shortName: "Opprtnty", textName: "Opportunity", isTransaction: true, permissionCode:"TRAN_OPPRTNTY",
				CLOSED_LOST: {statusCode:"D", statusName: "closedLost", searchStatusCode: "Opprtnty:D", statusText: "Closed - Lost"},
				CLOSED_WON: {statusCode:"C", statusName: "closedWon", searchStatusCode: "Opprtnty:C", statusText: "Closed - Won"},
				IN_PROGRESS: {statusCode:"A", statusName: "inProgress", searchStatusCode: "Opprtnty:A", statusText: "In Progress"},
				ISSUED_ESTIMATE: {statusCode:"B", statusName: "issuedEstimate", searchStatusCode: "Opprtnty:B", statusText: "Issued Estimate"}
			}, 

			purchaseorder: {shortName: "PurchOrd", textName: "Purchase Order", isTransaction: true, permissionCode:"TRAN_PURCHORD", 
				CLOSED: {statusCode:"H", statusName: "closed", searchStatusCode: "PurchOrd:H", statusText: "Closed"},
				FULLY_BILLED: {statusCode:"G", statusName: "fullyBilled", searchStatusCode: "PurchOrd:G", statusText: "Fully Billed"},
				PARTIALLY_RECEIVED: {statusCode:"D", statusName: "partiallyReceived", searchStatusCode: "PurchOrd:D", statusText: "Partially Received"},
				PENDING_BILLING: {statusCode:"F", statusName: "pendingBilling", searchStatusCode: "PurchOrd:F", statusText: "Pending Bill"},
				PENDING_BILL_PART_RECEIVED: {statusCode:"E", statusName: "pendingBillPartReceived", searchStatusCode: "PurchOrd:E", statusText: "Pending Billing/Partially Received"},
				PENDING_RECEIPT: {statusCode:"B", statusName: "pendingReceipt", searchStatusCode: "PurchOrd:B", statusText: "Pending Receipt"},
				PENDING_SUP_APPROVAL: {statusCode:"A", statusName: "pendingSupApproval", searchStatusCode: "PurchOrd:A", statusText: "Pending Supervisor Approval"}
			},

			returnauthorization: {shortName: "RtnAuth", textName: "Return Authorization", isTransaction: true, permissionCode:"TRAN_RTNAUTH", 
				CLOSED: {statusCode:"H", statusName: "closed", searchStatusCode: "RtnAuth:H", statusText: "Closed"},
				PENDING_RECEIPT: {statusCode:"B", statusName: "pendingReceipt", searchStatusCode: "RtnAuth:B", statusText: "Pending Receipt"},
				PENDING_REFUND: {statusCode:"F", statusName: "pendingRefund", searchStatusCode: "RtnAuth:F", statusText: "Pending Refund"},
				PENDING_REFUND_PART_RECEIVED: {statusCode:"E", statusName: "pendingRefundPartReceived", searchStatusCode: "RtnAuth:E", statusText: "Pending Refund/Partially Received"},
				REFUNDED: {statusCode:"G", statusName: "refunded", searchStatusCode: "RtnAuth:G", statusText: "Refunded"}
			},

			salesorder: {shortName: "SalesOrd", textName: "Sales Order", isTransaction: true, recordId: -30, permissionCode: "TRAN_SALESORD", 
				CANCELLED: {statusCode:"C", statusName: "cancelled", searchStatusCode: "SalesOrd:C", statusText: "Cancelled"},
				CLOSED: {statusCode:"H", statusName: "closed", searchStatusCode: "SalesOrd:H", statusText: "Closed"},
				BILLED: {statusCode:"G", statusName: "fullyBilled", searchStatusCode: "SalesOrd:G", statusText: "Billed"},
				PARTIALLY_FULFILLED: {statusCode:"D", statusName: "partiallyFulfilled", searchStatusCode: "SalesOrd:D", statusText: "Partially Fulfilled"},
				PENDING_APPROVAL: {statusCode:"A", statusName: "pendingApproval", searchStatusCode: "SalesOrd:A", statusText: "Pending Approval"},
				PENDING_BILLING: {statusCode:"F", statusName: "pendingBilling", searchStatusCode: "SalesOrd:F", statusText: "Pending Billing"},
				PENDING_FULFILLMENT: {statusCode:"B", statusName: "pendingFulfillment", searchStatusCode: "SalesOrd:B", statusText: "Pending Fulfillment"}
			},

			transferorder: {shortName: "TrnfrOrd", textName: "Transfer Order", isTransaction: true, 
				CLOSED: {statusCode:"H", statusName: "closed", searchStatusCode: "TrnfrOrd:H", statusText: "Closed"},
				PENDING_FULFILLMENT: {statusCode:"B", statusName: "pendingFulfillment", searchStatusCode: "TrnfrOrd:B", statusText: "Pending Fulfillment"},
				PENDING_RECEIPT: {statusCode:"F", statusName: "pendingReceipt", searchStatusCode: "TrnfrOrd:F", statusText: "Pending Receipt"},
				RECEIVED: {statusCode:"G", statusName: "received", searchStatusCode: "TrnfrOrd:G", statusText: "Received"}
			},

			vendorbill: {shortName: "VendBill", textName: "Bill", isTransaction: true,  permissionCode:"TRAN_VENDBILL", 
				OPEN: {statusCode:"A", statusName: "open", searchStatusCode: "VendBill:A", statusText: "Open"},
				PAID_IN_FULL: {statusCode:"B", statusName: "paidInFull", searchStatusCode: "VendBill:B", statusText: "Paid In Full"},
				PENDING_APPROVAL: {statusCode:"D", statusName: "pendingApproval", searchStatusCode: "VendBill:D", statusText: "Pending Approval"}
				// MISSING C - CANCELLED
				// MISSING E - REJECTED
				
			}, 
			
			vendorcredit: {shortName: "VendCred", textName: "Bill Credit", isTransaction: true,  ermissionCode:"TRAN_VENDCRED"}, 
			vendorpayment: {shortName: "VendPymt", textName: "Bill Payment", isTransaction: true, permissionCode:"TRAN_VENDPYMT", 
				UNDEFINED: {statusCode:"undefined", statusName: "undefined", searchStatusCode: "VendPymt:undefined", statusText: "undefined"},
				VOIDED: {statusCode:"undefined", statusName: "voided", searchStatusCode: "VendPymt:undefined", statusText: "Voided"}
			}, 
			
			vendorreturnauthorization: {shortName: "VendAuth", textName: "Vendor Return Authorization", isTransaction: true, permissionCode:"TRAN_VENDAUTH", 
				CREDITED: {statusCode:"G", statusName: "credited", searchStatusCode: "VendAuth:G", statusText: "Credited"}
			}, 

			workorder: {shortName: "?", textName: "Work Order", recordId: 0, isTransaction: true, permissionCode:"TRAN_WORKORD"}

			
		} 




		/*
					unmapped permissions: 
							activity:"LIST_ACTIVITY",
							campaign:"LIST_CAMPAIGN",
							supportcase:"LIST_CASE",
							competitor:"LIST_COMPETITOR",
							currency:"LIST_CURRENCY",
							calendarevent:"LIST_EVENT",
							issue:"LIST_ISSUE",
							othername:"LIST_OTHERNAME",
							phonecall:"LIST_CALL",
							projecttask:"LIST_PROJECTTASK",
							promotioncode:"LIST_PROMOTIONCODE",
							solution:"LIST_KNOWLEDGEBASE",
							task:"LIST_TASK",
							taxgroup:"LIST_TAXITEM",
							taxtype:"LIST_TAXITEM",
							topic:"LIST_KNOWLEDGEBASE",
		*/


		/*
		* as of yet unsupported
		* 				{longName:'activity',			shortName:'?			',			fullName:'?			',			internalId:0},				
				{longName:'campaign',			shortName:'?			',			fullName:'?			',			internalId:-24},
				{longName:'check',			shortName:'Check',			fullName:'Check			',			internalId:0},
				{longName:'classification',			shortName:'?			',			fullName:'?			',			internalId:-101},
				{longName:'competitor			',			shortName:'?			',			fullName:'?			',			internalId:-108},
				{longName:'currency',			shortName:'?			',			fullName:'?			',			internalId:-122},
				{longName:'employee',			shortName:'?			',			fullName:'?			',			internalId:-4},
				{longName:'entity',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'giftcertificate',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'giftcertificateitem',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'issue',			shortName:'?			',			fullName:'?			',			internalId:-26},
				{longName:'message',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'note',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'othername',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'phonecall',			shortName:'call			',			fullName:'?			',			internalId:-22},
				{longName:'projecttask',			shortName:'?			',			fullName:'?			',			internalId:-27},
				{longName:'promotioncode',			shortName:'?			',			fullName:'?			',			internalId:-121},
				{longName:'solution',			shortName:'?			',			fullName:'?			',			internalId:-25},
				{longName:'subsidiary',			shortName:'?			',			fullName:'?			',			internalId:-117},
				{longName:'supportcase			',			shortName:'?			',			fullName:'?			',			internalId:-23},
				{longName:'task',			shortName:'?			',			fullName:'?			',			internalId:-21},
				{longName:'taxgroup',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'taxtype',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'timebill',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'topic',			shortName:'?			',			fullName:'?			',			internalId:0},
		  "_-105": "accountingperiod",
		  "_-107": "campaignevent",
		  "_-109": "customercategory",
		  "_-120": "emailtemplate",
		  "_-111": "employeetype",
		  "_-104": "customerstatus",
		  "_-20": "calendarevent",
		  "_-124": "customfield",
		  "_-106": "itemtype",
		  "_-116": "issuemodule",
		  "_-115": "issueproduct",
		  "_-114": "issueproductbuild",
		  "_-113": "issueproductversion",
		  "_-21": "task",
		  "_-100": "transactiontype",
		  "_-110": "vendorcategory"

		* 
		* 
		*/


		/*
		{longName:'cashrefund',			shortName:'CashRfnd			',			fullName:'Cash			Refund',			internalId:0},
		{longName:'cashsale',			shortName:'CashSale			',			fullName:'Cash			Sale',			internalId:0},
				{longName:'customerdeposit',			shortName:'CustDep',			fullName:'Customer			Deposit',			internalId:0},
				{longName:'customerpayment',			shortName:'CustPymt',			fullName:'Customer			Payment',			internalId:0},
				{longName:'customerrefund',			shortName:'CustRfnd',			fullName:'Customer			Refund',			internalId:0},
				{longName:'depositapplication',			shortName:'DepAppl',			fullName:'Deposit			Application',			internalId:0},
				{longName:'creditmemo',			shortName:'CustCred',			fullName:'Credit			Memo',			internalId:0},
				{longName:'expensereport',			shortName:'ExpRept',			fullName:'Expense			Report',			internalId:0},
				{longName:'fxreval',			shortName:'FxReval',			fullName:'Currency			Revaluation',			internalId:0},
				{longName:'inventoryadjustment',			shortName:'InvAdjst',			fullName:'Inventory			Adjustment',			internalId:0},
				{longName:'intercompanyjournalentry',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'invoice',			shortName:'CustInvc',			fullName:'Invoice',			internalId:0},
				{longName:'itemfulfillment',			shortName:'ItemShip',			fullName:'Item			Fulfillment',			internalId:0},
				{longName:'itemreceipt',			shortName:'ItemRcpt',			fullName:'Item			Receipt',			internalId:0},
				{longName:'opportunity',			shortName:'Opprtnty',			fullName:'Opportunity',			internalId:-31},
				{longName:'purchaseorder',			shortName:'PurchOrd',			fullName:'Purchase			Order',			internalId:0},
				{longName:'estimate',			shortName:'Estimate',			fullName:'Estimate',			internalId:0},
				{longName:'returnauthorization			',			shortName:'RtnAuth',			fullName:'Return			Authorization',			internalId:0},
				{longName:'salesorder			',			shortName:'SalesOrd			',			fullName:'Sales			Order			',			internalId:-30},
				{longName:'vendorbill',			shortName:'VendBill',			fullName:'Vendor			Bill',			internalId:0},
				{longName:'vendorcredit',			shortName:'VendCred			',			fullName:'Vendor			Credit',			internalId:0},
				{longName:'vendorpayment',			shortName:'VendPymt			',			fullName:'Vendor			Payment',			internalId:0},
				{longName:'vendorreturnauthorization',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'workorder',			shortName:'?			',			fullName:'?			',			internalId:0},
				{longName:'inventorycount',			shortName:'InvCount',			fullName:'Inventory			Count',			internalId:0},
				{longName:'inventorytransfer',			shortName:'InvTrnfr',			fullName:'Inventory			Transfer',			internalId:0},
				{longName:'transferorder',			shortName:'TrnfrOrd',			fullName:'Transfer			Order',			internalId:0},
				{longName:'workorder',			shortName:'WorkOrd',			fullName:'Work			Order',			internalId:0}
				{longName:'journalentry',			shortName:'Journal',			fullName:'Journal			',			internalId:0},
		*/



		// ================================================================================================================================
		// = EMAIL-RELATED FUNCTIONS ========================================================================================================
		// ================================================================================================================================

		// takes a comma or semi-colon separated list, and cleans it up (removes leading or trailing elements).  example:   a,b;c;;d; becomes a,b,c,d
		// this is most useful for taking a list of email addresses and cleaning it up so that NetSuite doesn't choke on them

		
		function fixEmailRecipientList(s,newDelim) {
			var a = s.split(/[;, ]/);
		  
			newDelim = newDelim || ",";
			s = "";
			for (var j = 0; j < a.length; j++)
			  if (a[j].trim().length > 0)
				  s += ((s.length > 0) ? newDelim : "") + a[j];

			return s;
		}
		
		// --------------------------------------------------------------------------------------------------------------------------------
		
		function isEmailAddressValid(emailAddress) {
			var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(String(emailAddress));
		}

		// --------------------------------------------------------------------------------------------------------------------------------

		// find the first email address in the list which is not valid; 
		// validates them based on the assumption that they are separated by commas, spaces or semicolons
		function findInvalidEmailAddress(emailAddresses) {
						
			var theList = emailAddresses.split(/[;, ]/);
			  
			for (var j = 0; j < theList.length; j++)
			  if (theList[j].trim().length > 0) {
				  var emailAddress = theList[j].trim();
				  if (!isEmailAddressValid(emailAddress))
					  return emailAddress; 
			  }
		}
		
		// ================================================================================================================================
		// = RECORD TYPE FUNCTIONS ========================================================================================================
		// ================================================================================================================================
		
		function getRecordTypeInfo(recName) {
			
			var keys = Object.keys(RECORD_TYPE_INFO);
			
			for (var i = 0; i < keys.length; i++) {
				var keyName = keys[i]; 
				if (recName == keyName || RECORD_TYPE_INFO[keyName].shortName == recName || RECORD_TYPE_INFO[keyName].textName == recName)
					return RECORD_TYPE_INFO[keyName]; 				
			}
		}
		

		function nativeRecordType(id) {
			return NATIVE_RECORD_INTERNAL_IDS["_" + id];
			/*			
			var REC = record.create({type: "customrecordcustomfield", isDynamic:true}); 

			REC.setValue("fieldtype","SELECT");

			var fld = REC.getField("selectrecordtype"); 
			
			var typeList = fld.getSelectOptions(); 

			for (var i = 0; i < typeList.length; i++)
				if (typeList[i].value == id)
			*/	
			
		}
		
		// ================================================================================================================================
		// = DATE HELPER FUNCTIONS ========================================================================================================
		// ================================================================================================================================
	
		// --------------------------------------------------------------------------------------------------------------------------------

		// internal function
		function formatDateTimeElement(dt, formatString) {
			
			var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
			var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

			switch (formatString.toLowerCase()) {

				case "m" : 		return dt.getMonth()+1;
								break;
			
				case "mm" :		return dt.getMonth() < 9 ? "0" + (dt.getMonth() + 1).toString() : dt.getMonth()+1;
								break;
			
				case "mmm" :	return (formatString == "MMM") ? monthNames[dt.getMonth()].substring(0,3).toUpperCase() : monthNames[dt.getMonth()].substring(0,3);
								break;              
			
				case "mmmm" : 	return (formatString == "MMMM") ?  monthNames[dt.getMonth()].toUpperCase() : monthNames[dt.getMonth()];
								break;
			
				case "d" :		return dt.getDate();
								break;
			
				case "dd" : 	return (dt.getDate() < 10) ? "0" + (dt.getDate()).toString() : dt.getDate();
								break;
			
				case "ddd" : 	return (formatString == "DDD") ? dayNames[dt.getDay()].substring(0,3).toUpperCase() : dayNames[dt.getDay()].substring(0,3);
								break;              
			
				case "dddd" : 	return (formatString == "DDDD") ? dayNames[dt.getDay()].toUpperCase() : dayNames[dt.getDay()];
								break;
			
				case "yy" : 	return dt.getFullYear() % 100;
								break;
			
				case "yyyy" : 	return dt.getFullYear();
								break;
			
								
				case "h" :		return dt.getHours();
								break;
								
				case "hh" : 	return (dt.getHours() < 10) ? "0" + (dt.getHours()).toString() : dt.getHours();
								break;
			
				case "n" :		return dt.getMinutes();
								break;
			
				case "nn" : 	return (dt.getMinutes() < 10) ? "0" + (dt.getMinutes()).toString() : dt.getMinutes();
								break;
			
				case "s" :		return dt.getSeconds();
								break;
			
				case "ss" :		return (dt.getSeconds() < 10) ?  "0" + (dt.getSeconds()).toString() : dt.getSeconds();
								break;
			
				default: 
					return formatString;
			}

		}


		// ================================================================================================================================
		// = RECORD/ITEM/TRANSACTION FUNCTIONS =================================================================================================
		// ================================================================================================================================

	    function isTransaction(recType, recId) {
	          log.debug(scriptName + "isTransaction ","starting with " + recType + " : " + recId);
	          
	          if (!recType.startsWith("customrecord") && transactionType(recId) == recType) 
	                return true;
	          else
	                return false;                 
	    }
	    
	    // --------------------------------------------------------------------------------------------------------------------------------
	    
	    function transactionType(recId) {
	          try {
	                return search.lookupFields({type: "transaction", id: recId, columns: ["recordtype"]}).recordtype;                       
	          } catch (e) {
	                return;                                         
	          }
	    }

	    // --------------------------------------------------------------------------------------------------------------------------------

		function getItemType(itemId) {
			var itemType = search.lookupFields({type: "item", id: itemId, columns: ["type"]}).type;
				
			if (itemType && itemType.length > 0) 
				return itemType[0].value;				
		}
			

	    // --------------------------------------------------------------------------------------------------------------------------------

		function loadItem(itemId) {			
			var itemType = getItemType(itemId); 
			
			var ITEM = record.load({type: ITEM_TYPE_MAP[itemType], id: itemId});

			return ITEM;
		}

	    // --------------------------------------------------------------------------------------------------------------------------------

	    function isItem(recType, recId) {
	    	try {
	    		return (search.lookupFields({type: "item", id: recId, columns: ["recordtype"]}).recordtype == recType);
	    	} catch (e) {
	    		return false;
	    	}
	    	/*
	    	for (key in ITEM_TYPE_MAP)
	    		if (ITEM_TYPE_MAP[key] == recType)
	    			return true;
	    	*/
	    }
	    
	    // --------------------------------------------------------------------------------------------------------------------------------
	    
	    function isEntity(recType, recId) {
	    	try {
	    		return (search.lookupFields({type: "entity", id: recId, columns: ["recordtype"]}).recordtype == recType);
	    	} catch (e) {
	    		return false;
	    	}
	    }

	    // --------------------------------------------------------------------------------------------------------------------------------
	    

		//	Purpose:		Executes the passed in search, and retrieves 1000 rows at a time until all rows have been retrieved; 

		function searchAllRecords(searchDefinition) {
			var funcName = scriptName + "searchAllRecords"; 
	              
              //Run the search to get the result set
              var myResultSet = searchDefinition.run();
               
              //Set the initial min for the range
              var firstIndex = 0;
              var rangeSize = 1000;
               
              //Get the initial range
              var myResult = myResultSet.getRange(firstIndex, firstIndex + rangeSize);
               
              if (myResult.length >= rangeSize)
              {
                     var count = rangeSize;
 
                     while (count == rangeSize) 
                     {
                           firstIndex+= rangeSize;
                           var results = myResultSet.getRange(firstIndex, firstIndex + rangeSize);
 
                           count = results.length;
                           if (results && results.length > 0)
                           {
                                  myResult = myResult.concat(results);
                                  count = results.length;
                           }
                     }
              }
              return myResult;
		}
	 


		// retrieves a value from a search result, using its label (this is useful if you have multiple formula fields, etc.
		// parms:
		//	result		a single search result (eg search.Result)
		//	fieldLabel	the label that was used when defining the column in the search

		function getSearchResultValueByLabel(result, fieldLabel) {
	    	var searchCols = result.columns;

	    	fieldLabel = fieldLabel.toLowerCase(); 
	    	
	    	for (var i = 0; i < searchCols.length; i++) {
	    		var col = searchCols[i]; 
	    		if (col.label && col.label.toLowerCase() == fieldLabel)
	    			return result.getValue(col);
	    	}			
		}

		// retrieves a value from a search result, using its label (this is useful if you have multiple formula fields, etc.
		// parms:
		//	result		a single search result (eg search.Result)
		//	fieldLabel	the label that was used when defining the column in the search

		function getSearchResultTextByLabel(result, fieldLabel) {
	    	var searchCols = result.columns;

	    	fieldLabel = fieldLabel.toLowerCase(); 

	    	for (var i = 0; i < searchCols.length; i++) {
	    		var col = searchCols[i]; 
	    		if (col.label && col.label.toLowerCase() == fieldLabel)
	    			return result.getText(col);
	    	}
			
		}
		
	    
		// ================================================================================================================================

	    // checks whether a given value in a given field exists on any record other than the current one (useful for preventing duplicate values) 
	    
		function valueExists(REC, fieldName, fieldValue, addlFilters) {
			
			var fld = REC.getField(fieldName); 
			
			var searchFilters = [];
			
			if (addlFilters) 
				searchFilters.push(addlFilters); 

			if (searchFilters.length > 0)
				searchFilters.push("AND");
			
			if (RECORD_TYPE_INFO[REC.type] && RECORD_TYPE_INFO[REC.type].isTransaction) 
				searchFilters.push(["mainline",search.Operator.IS,true]); 
			else
				searchFilters.push(["isinactive",search.Operator.IS,false]); 

			searchFilters.push("AND");
			
			if (fld.type == format.Type.CHECKBOX)
				searchFilters.push([fieldName, search.Operator.IS, fieldValue]);
			else if (fld.type == format.Type.DATE || fld.type == format.Type.DATETIME || fld.type == format.Type.DATETIMETZ)
				searchFilters.push([fieldName, search.Operator.ON, fieldValue]);					
			else if (fld.type == "select" || fld.type == "multiselect")
				searchFilters.push([fieldName, search.Operator.ANYOF, [fieldValue]]);
			else
				searchFilters.push([fieldName, search.Operator.EQUALTO, fieldValue]);
							
			if (REC.id) {
				searchFilters.push("AND"); 
				searchFilters.push(["internalid",search.Operator.NONEOF,[REC.id]]); 				
			} 
				
			var ss = search.create({type: REC.type, filters: searchFilters}).run().getRange(0,1);
			return (ss.length > 0); 
			
		}

		// ================================================================================================================================
	    

	    // this function works for either single select or multi-select fields; for single-select, it checks whether the value is "itemOption" ... for multi-select, it checks whether itemOption is one of the selected items
		function isSelectFieldItemSelected(REC, fldName,itemOption) {
		
			var fldList = REC.getValue(fldName);
			
			if (typeof fldList === "undefined")
				return false;
			
			// both util.isArray, and Array.isArray return FALSE when a multi-select field is retrieved from NetSuite.  but our own "isArray" function works
			
			if (isArray(fldList))
				return fldList.indexOf(itemOption.toString()) >= 0;
			else
				return fldList == itemOption;			
		}
		
	    
	    // --------------------------------------------------------------------------------------------------------------------------------

		// ================================================================================================================================
		// = STRING FUNCTIONS =============================================================================================================
		// ================================================================================================================================
		
		function generateGUID()
		{
			"use strict";
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
			{

				var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});

			return guid;
		}

		// ================================================================================================================================

		// used for generating passwords, etc., as long as they don't have special requirements such as MUST have letter, number, etc.
		function generateRandomString(len) {	
			var CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-=_+,./|?";
			var s = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function(c)
					{ return CHARSET[parseInt(Math.random() * CHARSET.length)]; });

			return (len > 50) ? s : s.substring(0,len);
		}

		
		// ================================================================================================================================

		// formats a value to be written out to a CSV file -- if the value contains either a comma, or double quote, it gets wrapped in double quotes 
		function formatCSValue(val) {
			if (!val)
				return ""; 
			
			if (val.indexOf(",") >= 0 || val.indexOf('"') >= 0) 
				return '"' + val.replace(/"/g,'""') + '"';
			else 
				return val;				
		}
				
		// ================================================================================================================================
		
		function currentDateTimeStr() {
			return format.format({value: new Date(), type: format.Type.DATETIME});
		}

		// ================================================================================================================================
		// = MISC FUNCTIONS ===============================================================================================================
		// ================================================================================================================================

		
		function extractMapReduceErrorMessages(summary) {
			var errorMsgs = [];
			
	    	var inputSummary = summary.inputSummary;
	    	if (inputSummary.error) {
	    		var msg = "STAGE=input" + " ERROR=" + inputSummary.error;
	    		errorMsgs.push(msg);
	    	}
	    	
	    	var a = extractErrorsFromStage("map", summary.mapSummary);
	    	if (a.length > 0)
	    		errorMsgs.push(a);

	    	a = extractErrorsFromStage("reduce", summary.reduceSummary);
	    	if (a.length > 0)
	    		errorMsgs.push(a);

	    	return errorMsgs;
		}
		
		function extractErrorsFromStage(stage, summary) {
	    	var errorMsgs = [];
	    	summary.errors.iterator().each(function(key, value) {
	    		// var msg = 'Unable to process staging record ' + key + '.
				// Error was: ' + JSON.parse(value).message + '\n';
	    		var msg = "STAGE=" + stage + + " KEY=" + key + " ERROR=" + JSON.parse(value).message;	    		
	    		errorMsgs.push(msg);
	    		return true;
	    	});

	    	return errorMsgs;
		}


		// ================================================================================================================================

    	var NANOTIME_PER_SECOND = 1000000000; 
    	var NANOTIME_PER_MILLISECOND = 1000000; 

		function startTimer() {
    		timerQueue.push(util.nanoTime());  
		}

		function elapsedTimeInNanoSeconds() {
			if (timerQueue.length > 0) {
				var startTime = timerQueue.pop();
	        	return (util.nanoTime() - startTime); 
			}
		}

		function elapsedTimeInMilliSeconds() {

        	return (elapsedTimeInNanoSeconds() / NANOTIME_PER_MILLISECOND);
		}
		

		function elapsedTimeInSeconds() {

        	return (elapsedTimeInNanoSeconds() / NANOTIME_PER_SECOND);
		}

		
		function waitForMilliseconds(nbrOfMilliseconds) {
        	var startTime = util.nanoTime(); 

        	do {
        		; 
        	} while ((util.nanoTime() - startTime) < (nbrOfMilliSeconds * NANOTIME_PER_MILLISECOND));
			
		}
		

		// ================================================================================================================================

		
		function logDebugAll(funcName, msg) {
			var maxLength = 3000;
			while (msg.length > maxLength) {
				log.debug(funcName, msg.substring(0,maxLength));
				msg = msg.substring(maxLength);
			}
			log.debug(funcName, msg);
		} 

		
		// ================================================================================================================================
		

	    // gets the accounting period for a specific date, or current date, if no date is specified
	    function getAccountingPeriod(dt) {
	          
	    	dt = dt || new Date();
	    	
	    	if (dt instanceof Date) 
	    		dt = format.format({value: dt, type: format.Type.DATE});
	          
	    	var ss = search.create({
	    		type: "accountingperiod",
	    		filters: [
	    		          ["startdate",search.Operator.ONORBEFORE,dt]
	    		          ,"AND",["enddate",search.Operator.ONORAFTER,dt]
	    		          ,"AND",["isadjust",search.Operator.IS,false]
	    		          ,"AND",["isquarter",search.Operator.IS,false]
	    		          ,"AND",["isyear",search.Operator.IS,false]
	    		          ]
	    	}).run().getRange(0,1);
	          
	    	if (ss.length > 0)
	    		return ss[0].id;

	    }
	    
	    
	    function accountingPeriodIsOpen(periodId) {
        	return (!accountingPeriodIsClosed(periodId)); 
	    }
	    
	    function accountingPeriodIsClosed(periodId) {
        	return (search.lookupFields({type: record.Type.ACCOUNTING_PERIOD, id: periodId, columns: ["closed"]}).closed); 
	    }
	    

		// ================================================================================================================================
		// = MISC FUNCTIONS ===============================================================================================================
		// ================================================================================================================================

	    /*
	    ??? is array?   
	    		
	    ???  is date?
	    */	
	    		
	    
		function isUndef(param) {
			return (typeof param === "undefined");
		}

		function isNull(param) {
			return (param == null); 
		}

		function isObject(param) {
			return (typeof param === 'object'); 
		}
		
		function isEmpty(param) {
			// is this an "empty" object (has no properties of its own)
			if (isObject(param)) {
				for(var key in param) { 
					if (param.hasOwnProperty(key))
						return false; 
				} 
				return true; 
			}
						
			return (param == '' || isNull(param) || isUndef(param) || param.length == 0) ? true : false;
		}

		function isNotNull(param) {
			return !isNull(param);
		}

		function isNotEmpty(param) {
			return !isEmpty(param);
		}

		function isArray(param) {
            return (param instanceof Array); 
		}
		
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
	    
		return {
			
			// CONSTANTS
			ITEM_TYPE_MAP: 					ITEM_TYPE_MAP,
			FORM_DELIMITERS:				FORM_DELIMITERS,
			RECORD_TYPE_INFO:				RECORD_TYPE_INFO,
						
			// RECORD/ITEM/TRANSACTION FUNCTIONS			
			getRecordTypeInfo:				getRecordTypeInfo,
			nativeRecordType:				nativeRecordType,				
			transactionType:				transactionType,
			isTransaction:					isTransaction,
			getItemType:					getItemType,
			loadItem:						loadItem,
			isItem:							isItem,									// determines whether the specific record type is an "item" type
			isEntity:						isEntity,								// determines whether the specific record type is an "entity" type
			isSelectFieldItemSelected:		isSelectFieldItemSelected,

			
			// SEARCH-RELATED FUNCTIONS			
			searchAllRecords:				searchAllRecords,
			valueExists:					valueExists,							// checks whether a value exists in a field on another record; useful for preventing duplicates
			getSearchResultValueByLabel:	getSearchResultValueByLabel,
			getSearchResultTextByLabel:		getSearchResultTextByLabel,
			
			// DATA CHECK FUNCTIONS
			
			isUndef: 						isUndef,
			isNull: 						isNull,
			isEmpty: 						isEmpty,
			isNotNull: 						isNotNull,
			isNotEmpty: 					isNotEmpty,
			isObject:						isObject,
			isArray:						isArray,
			
			//	STRING FUNCTIONS
			fixEmailRecipientList: 			fixEmailRecipientList,					// takes string of values delimited by either comma or semi-colon, and removes "empties" (eg:   a,b,,,c,d, ==> a,b,c,d) -- useful for cleaning up email lists
			isEmailAddressValid:			isEmailAddressValid,			
			findInvalidEmailAddress:		findInvalidEmailAddress,
			
			
			generateGUID: 					generateGUID,
			generateRandomString: 			generateRandomString,
			formatCSValue:					formatCSValue,
			currentDateTimeStr:				currentDateTimeStr,

			// TIMER FUNCTIONS
			startTimer:						startTimer,
			elapsedTimeInNanoSeconds:		elapsedTimeInNanoSeconds,
			elapsedTimeInMilliSeconds:		elapsedTimeInMilliSeconds,
			elapsedTimeInSeconds:			elapsedTimeInSeconds,

			
			// MISC FUNCTIONS
			extractMapReduceErrorMessages:	extractMapReduceErrorMessages,
			logDebugAll:					logDebugAll,									// performs repeated log.debug() commands, logging 3,000 characters at a time, until the entire message is logged
			getAccountingPeriod: 			getAccountingPeriod,
			accountingPeriodIsOpen:			accountingPeriodIsOpen,
			accountingPeriodIsClosed:		accountingPeriodIsClosed
		}

	}	

);



