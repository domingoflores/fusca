/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 */


//------------------------------------------------------------------
//Script: SC_Constants.js
//Module: SC_Constants
           
//------------------------------------------------------------------
define(["N/runtime"], function(runtime) {
	 "use strict";
	return {
		"COMMERCIAL_BANK_ROUTING_NUMBER" : "026009593",
		"SUNTRUST_BANK_INTERNAL_ID" : 20627,	//SAME IN PROD
		"BANK_ACCOUNT_TYPE" : 
		{
		"Checking":1,
		"Commercial Checking":3,
		"Commercial Savings":4,
		"Savings":5
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
		"Acquiom LOT Requirements" : {
			"LOT":1,
			"Security":2,
			"Joinder":3,
			"Shareholder Consent":4,
			"Optionholder Consent":5,
			"W9/W8":6,
			"Other":7,
			"Original Stock Certificate":8,
			"Original Warrant":9,
			"NOT APPLICABLE":10
		},
		"PAYOUT TYPE" : {
			"Closing Payment - Certificate":1,
			"Escrow Release":3,
			"Working Capital Release":4,
			"Earn-Out Payment":5,
			"Expense Fund Release":6,
			"Other":7,
			"Tax Refund":8,
			"Closing Payment":9,
			"Dividend":10,
			"SRS Held Fund Release (Not Acquiom Funds)":11,
			"Interest Only":12,
			"Data Collection Only":13,
			"LOT Administration":14,
			"Vendor Payment":15,
			"Entity Management Fund Release":16,
			"Test Transaction":17,
			"Deferred Merger Consideration":18,
			"Sales Demonstration":19,
			"Vendor Payment No Fees":20,
			"Pre-Closing Documents":21,
			"Escheated":22

		},
		"IRS TIN CHECK RESULT" : {
			"Code 0: TIN and Name combination matches IRS records":9,
			"Code 1 or 4, Invalid data: The following were dropped, not sent to the IRS":1,
			"Code 2: TIN never issued. Typed incorrectly by mistake or fake":2,
			"Code 3: TIN and name do not match IRS records":3,
			"Code 5: Duplicate TIN Match Request":4,
			"Code 6: Match! These are Social Security Numbers SSNs":5,
			"Code 7: Match! These are Employer ID Numbers EINs":6,
			"Code 8: TIN and name combination Matches SSN and EIN Records":7,
			"Code 98: TIN Check Error Encountered - Re-queuing":13,
			"Code 99: TIN Check Error Encountered - Invalid Data or User Credentials":14,
			"Exempt payee":10,
			"GIACT Match":11,
			"Not Applicable - Non US Taxpayer":8,
			"Taxpayer Assertion":12,
			"Compliance Waiver":15
		},
		"DE1) TAXPAYER ID METHOD" : {
			"Substitute W9 eSigned":1,
			"Substitute W9 provided":2,
			"Signed W9 provided":3,
			"Signed W8 provided":4,
			"W9 required":5,
			"W8 required":6,
			"W-8BEN eSigned":7,
			"W-8BEN-E eSigned":8,
			"W-8IMY eSigned":9,
			"W-8EXP eSigned":10,
			"W-8CE eSigned":11,
			"W-8BEN Required":12,
			"W-8BEN-E Required":13,
			"W-8IMY Required":14,
			"W-8EXP Required":15,
			"W-8CE Required":16,
			"W9 eSigned":17,
			"W9 Special Cases Required":18,
			"W-9":19,
			"W-8BEN":20,
			"W-8BEN-E":21,
			"W-8IMY":22,
			"W-8ECI":23,
			"W-8EXP":24,
			"W-4":25
		},
		"DE1-LPM1) LOT PAYMENT METHOD" : (runtime.envType === "PRODUCTION") ? 
				{
					"ACH" : 1,
					"Domestic Check" : 2,
					"International Check" : 3,
					"Domestic Wire" : 4,
					"International Wire" : 5,
					"Payroll" : 6,
					"AES ACH" : 7,
					"AES DOMESTIC CHECK" : 8,
					"AES INTERNATIONAL CHECK" : 9,
					"AES DOMESTIC WIRE" : 10,
					"AES INTERNATIONAL WIRE" : 11,
					"International Wire to Brokerage" : 12,
					"International Wire to Bank" : 13,
					"Domestic Wire to Brokerage" : 14,
					"Domestic Wire to Bank" : 15
					
				}
				:
				{
					"ACH" : 1,
					"Domestic Check" : 2,
					"International Check" : 3,
					"Domestic Wire" : 4,
					"International Wire" : 5,
					"Payroll" : 6,
					"AES ACH" : 7,
					"AES DOMESTIC CHECK" : 8,
					"AES INTERNATIONAL CHECK" : 9,
					"AES DOMESTIC WIRE" : 10,
					"AES INTERNATIONAL WIRE" : 11,
					"International Wire to Brokerage" : 12,
					"International Wire to Bank" : 13,
					"Domestic Wire to Brokerage" : 14,
					"Domestic Wire to Bank" : 15
				},
		"LOT DELIVERY INSTRUCTIONS": 
		{
			  "Email": 1,
			  "Overnight": 2,
			  "Ground": 3,
			  "Sent by Buyer": 4,
			  "Web": 5,
			  "Payment Only": 6,
			  "Hold": 8,
			  "Other": 9,
			  "Created From RMA": 10,
			  "Subsequent Payment": 11,
			  "Letter with Web Link": 12,
			  "Vendor Payment": 13,
			  "Funds Returned To Buyer": 14,
			  "Escheated": 15,
			  "Offline": 16
			},
			"LOT DELIVERY INSTRUCTIONS SUMMARY": 
			{
				  "Email": 1,
				  "Web": 5,
				  "Payment Only": 6,
				  "Hold": 8,
				  "Other": 9,
				  "Subsequent Payment": 11,
				  "Letter with Web Link": 12,
				  "Vendor Payment": 13,
				  "Offline": 16
				},
			"ACQ Verify Holdings": 
			{
			  "Changes": 2,
			  "Changes Approved": 4,
			  "Changes Rejected": 5,
			  "New Form 3 Received": 3,
			  "Yes": 1
			},
			"Custom List Yes/No": 
			{
				  "Yes": 1,
				  "No": 2
			},
			"Shareholder Required Action": 
			{
				  "Required": 1,
				  "Optional": 2,
				  "Informational": 3
			},
			"Document Signed Status":
			{
				  "Signed": 1,
				  "Unsigned": 2,
				  "Declined": 3,
				  "Viewed": 4
			},
			"ACQ Online Offline Status": 
			{
			  "Declined": 6,
			  "Offline": 2,
			  "Offline Approved": 4,
			  "Offline Received": 3,
			  "Offline Rejected": 5,
			  "Yes": 1
			},
			"Country List": 
			{
			  "United States": 232
			},
			"TAX FORM E-SIGNED": 
			{
			  "Offline Received": 4,
			  "Offline Tax Form Approved": 5,
			  "Offline Tax Form Rejected": 6,
			  "Offline W8": 2,
			  "Offline W9": 3,
			  "Offline W9 Special Cases": 7,
			  "Yes": 1
			},
			"ACQ Medallion Status": 
			{
			  "Customer Elects - No Medallion": 7,
			  "Medallion Approved": 4,
			  "Medallion Rejected": 6,
			  "No Medallion Needed": 5,
			  "Offline Received": 3,
			  "Yes": 2
			},
			"Tax Form Collected" : 
			{
				"W-4":8,
				"W-8BEN":2,
				"W-8BEN-E":3,
				"W-8CE":7,
				"W-8ECI":5,
				"W-8EXP":6,
				"W-8IMY":4,
				"W-9":1
			},
			"ACQ Dual Entry Status":
			{
				"Completed": 4,
				"In Process": 3,
				"N/A" : 1,
				"Not Started" : 2

			},
			"Deficiences" : {
				"Acquiom Approved to Pay":1,
				"Amount Final":2,
				"Contact Status":101,
				"Counsel Approved to Pay":3,
				"Dual Entry Status":102,
				"Medallion Status":4,
				"Name Matches":103,
				"Ops Approved to Pay":5,
				"Payment Instruction Populated":6,
				"Payment Suspense Reasons":7,
				"Reasonable Amount for Payment":104,
				"Tax Status":105,
				"Verify Holdings":106
			},
			"CLEARINGHOUSE SECTION CONFIGURATION" : {
				"CONTACT + DOCUMENTS":14,
				"CONTACT + Payment":23,
				"CONTACT + TAX + DOCUMENTS":15,
				"CONTACT INFORMATION, TAX INFORMATION, PAYMENT INSTRUCTIONS, & DOCUMENTS":4,
				"Contact/Verify":21,
				"HOLDINGS, CONTACT, TAX, PAYMENT, DOCUMENTS":8,
				"Payment/Contact/Tax":10,
				"Payment/Contact/Tax/Additional Doc":7,
				"PCS Documents Only":9,
				"Pre-Closing (CONTACT INFO, TAX INFO, PAYMENT INSTRUCTIONS)":6,
				"Pre-Closing (VERIFY HOLDINGS, CONTACT INFORMATION, DOCUMENTS)":2,
				"Pre-Closing With Payment Info (Verify Holdings, Contact Information, Payment Information,  Documents)":5,
				"Standard":3,
				"Standard plus Documents for Signature":1,
				"Test Contact & Payment":18,
				"Test Contact & Payment & Docs ":17,
				"TEST Contact + Docs":16,
				"TEST WORKFLOW Lock Issue":13,
				"Verify Holdings/Contact/Tax/Payment":11,
				"Verify/Contact/LOT/Docs":22,
				"Verify/Contact/Payment/LOT":20,
				"Verify/Contact/SignSubmit/Documents":19,
				"Verify/Contact/Tax/Payment/Documents":12

			},
			"Case Queue" :{
				  "Account Opening": 61,
				  "Accounting": 58,
				  "Accounts Payable": 35,
				  "Acquiom Claims": 93,
				  "AES": 87,
				  "Analyst Cases": 118,
				  "BD Welcome Letter to Adv. Committee": 42,
				  "Call Back Dashboard": 67,
				  "Cases": 89,
				  "Certificate Discrepancy": 122,
				  "Claims": 1,
				  "Claims Mailing": 65,
				  "Clearinghouse (ACQ)": 60,
				  "Client Expenses": 59,
				  "Closing Payment": 10,
				  "Compliance": 18,
				  "Conductor WeWork": 125,
				  "Contact Management": 21,
				  "Customer Feedback": 70,
				  "Customer Feedback (ACQ)": 72,
				  "Dissolution": 85,
				  "Dissolution ": 86,
				  "Docket": 46,
				  "Document Retention": 111,
				  "Earnout": 50,
				  "Earnout & Expense": 55,
				  "EchoSign": 105,
				  "Escrow": 47,
				  "Escrow & Expense": 53,
				  "Escrow Agent": 16,
				  "Escrow Exchange": 22,
				  "Escrow Release": 8,
				  "Escrow Release Mailing": 73,
				  "Expense": 48,
				  "Final Instructions": 79,
				  "Finance": 17,
				  "General": 113,
				  "Hightower View the Space": 124,
				  "Holdback": 49,
				  "Holdback & Expense": 54,
				  "Import": 15,
				  "Instruction Letter": 71,
				  "Invoice": 23,
				  "LOT (ACQ)": 33,
				  "Market Standard": 108,
				  "Milestone Report": 38,
				  "Miscellaneous": 107,
				  "Miscellaneous-56": 56,
				  "Miscellaneous-13": 13,
				  "Miscellaneous - Compliance": 26,
				  "Miscellaneous Issue": 4,
				  "N/A": 90,
				  "Name Change": 126,
				  "Name Discrepancy": 120,
				  "Name Discrepancy ": 121,
				  "Nominum Akamai - James Ding Payment ": 123,
				  "Online Registrations": 9,
				  "Payment Instructions (ACQ)": 40,
				  "Payment Instructions (OPS)": 41,
				  "Payment Status (ACQ)": 32,
				  "Payments": 114,
				  "Payments Fax": 100,
				  "Payments Support": 119,
				  "Piracle": 74,
				  "Portal ": 88,
				  "Portal Support (do not use)": 25,
				  "Proactive Email (ACQ)": 92,
				  "Purchase Price Adjustments": 2,
				  "Relationship Associate": 98,
				  "Release - Compliance Review": 30,
				  "Release to Buyer": 43,
				  "Releases": 6,
				  "Remittance Email (ACQ)": 64,
				  "Rep & Warranty Insurance": 115,
				  "Returned Mail": 83,
				  "Returned Mailing (ACQ)": 82,
				  "Returned Payment (ACQ)": 68,
				  "Scanned Documents": 34,
				  "Securityholder Communication": 44,
				  "Settlement": 52,
				  "Shareholder Information (ACQ)": 31,
				  "Shareholder Rep": 116,
				  "SRS LOT Mailing ": 63,
				  "SRS Notice Mailing": 109,
				  "Statement": 11,
				  "Support Fax": 99,
				  "Tax Inquiry": 12,
				  "Tax Matters": 3,
				  "Tax Reporting": 103,
				  "Tax Reporting-104": 104,
				  "Tax Reporting (ACQ)": 81,
				  "Tax Withholding": 127,
				  "Technology": 117,
				  "Test Communications": 75,
				  "Transfer (Client Operations)": 36,
				  "Transfer (CRM)": 37,
				  "Uncategorized": 102,
				  "Uncategorized-101": 101,
				  "Uncategorized-110": 110,
				  "Uncategorized EM Case": 91,
				  "Uncategorized Inbound Fax": 94,
				  "Uncategorized Inbound Faxes": 20,
				  "Uncategorized Matter": 5,
				  "Uncategorized Matter-95": 95,
				  "Uncategorized Matter - SRS Acquiom": 77,
				  "Uncategorized Matter - SRS Acquiom-96": 96,
				  "Uncategorized Support Calls": 19,
				  "Uncategorized Support Email": 7,
				  "Unclassified": 57,
				  "Unpresented": 97,
				  "Unpresented Shareholder": 45,
				  "Unpresented Shareholder-14": 14,
				  "Vendor Payment": 66,
				  "VIP": 84,
				  "Welcome Letter Mailing": 62,
				  "Working Capital": 51
				},
				"Case Status" : {
					"Not Started" : 1,
					"In Progress" : 2,
					"Escalated" : 3,
					"Re-Opened" : 4,
					"Closed" : 5,
					"Completed" : 6,
					"Duplicate" : 7,
					"Sleep" : 8
				},
			"RSM Evaluation Result" : {
					"Never Run" : 1,
					"Passed" :2,
					"Failed" :3
				},
			"DER Deficiencies" : {
					"Ops Approved to Pay" : 5,
					"Acquiom Approved to Pay" :1,
					"Counsel Approved to Pay" :3
				},
			"Yes/No/NA/On Hold" : {
				"Yes" : 1,
				"No" : 2,
				"N/A" : 3,
				"On Hold" : 4
			}	
			,
			RULE_STATUS_CHECK_TYPE : {
				RECORD_CREATE: 1,
				RECORD_EDIT: 2,
				ALL_RULES: 3
			}//this rule is duplicate from SuiteBundles > Bundle 168443 > PRI_RSM_Constants.js, but because file is defined as SameAccount, we are creating copy of it
			
	};
});