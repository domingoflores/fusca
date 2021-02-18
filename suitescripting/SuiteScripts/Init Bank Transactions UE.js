function initcclinks(type, name) {
	//Designed for Shareholder Representative Services - Feb 2015
	//Frank Foster - Grace Business Solutions
	//ffoster@grace-solutions.com - 314-831-0078

	//This after submit script will credit Credit CRad transactions (Amex for now) upon import to a custom table
	// ATP-479 Change to cater for removal of Project Management module
	var isinactive = nlapiGetFieldValue('isinactive')
	var recid = nlapiGetRecordId()

	nlapiLogExecution('DEBUG', 'Payment', 'type = ' + type + ' Inactive= ' + isinactive);
	if (type == 'create' || type == 'edit') {
		//	if (isinactive == 'F' || isinactive == null)
		//	{
		var vendor = nlapiGetFieldValue('custrecord_ccp_vendor')
		var trandate = nlapiGetFieldValue('custrecord_ccp_date')
		var memo = nlapiGetFieldValue('custrecord_ccp_memo')
		var amount = nlapiGetFieldValue('custrecord_ccp_amount')
		var account = nlapiGetFieldValue('custrecord_ccp_account')
		var credit = nlapiGetFieldValue('custrecord_ccp_credit')
		var debit = nlapiGetFieldValue('custrecord_ccp_debit')
		var department = nlapiGetFieldValue('custrecord_ccp_department')
		var entity = nlapiGetFieldValue('custrecord_ccp_entity')
		var billable = nlapiGetFieldValue('custrecord_ccp_billable')
		var client = nlapiGetFieldValue('custrecord_ccp_client')

		/*	var recid = 2
			var vendor ='Hotwire'
			var trandate = '01/30/2015'
			var memo = 'HOTWIRE-SALES FINAL 866-468-9473 CA'
			var amount = 130.23
			var account = '006615 Expenses : Travel & Entertainment : Airfare, Lodging & Ground Trans'
			var department = 'Executive'
			var entity = 'SRS Acquiom LLC : SRS LLC'
			var billable = 'Yes'
			var client = 'Millennium Pharmerica'*/

		var update = false
		var message = ""
		var cctranid = ""
		var jrnltranid = ""

		//Lets resolve the input fields and try to find internal ids for for each
		var validated = validate(vendor, trandate, account, amount, credit, debit, department, entity, billable, client, update, message)

		if (validated.update) {
			if (amount < 0) {
				entryline = 0
				var journalentry = nlapiCreateRecord('journalentry')
				journalentry.setFieldValue('trandate', trandate)
				entryline = entryline + 1;
				journalentry.setLineItemValue('line', 'account', entryline, 130)
				journalentry.setLineItemValue('line', 'debit', entryline, Number(amount) * -1)
				journalentry.setLineItemValue('line', 'department', entryline, validated.department)
				journalentry.setLineItemValue('line', 'class', entryline, validated.entity)
				journalentry.setLineItemValue('line', 'memo', entryline, memo)
				entryline = entryline + 1;
				journalentry.setLineItemValue('line', 'account', entryline, validated.account)
				journalentry.setLineItemValue('line', 'credit', entryline, Number(amount) * -1)
				journalentry.setLineItemValue('line', 'department', entryline, validated.department)
				journalentry.setLineItemValue('line', 'class', entryline, validated.entity)
				journalentry.setLineItemValue('line', 'memo', entryline, memo)

				try {
					var journalid = nlapiSubmitRecord(journalentry) //Write Journal rec
					var jrnltranid = nlapiLookupField('journalentry', journalid, 'tranid')
				} catch (e) {
					validated.update = false
					validated.message = "Journal Entry Creation Failure - " + e.toString()
				}
			} else {
				var ccpayment = nlapiCreateRecord('creditcardcharge')

				ccpayment.setFieldValue('entity', validated.vendor)
				ccpayment.setFieldValue('trandate', trandate)
				ccpayment.setFieldValue('memo', memo)
				ccpayment.setFieldValue('account', 130)
				ccpayment.setFieldValue('class', validated.entity)
				ccpayment.setFieldValue('department', validated.department)

				ccpayment.insertLineItem('expense')
				ccpayment.setCurrentLineItemValue('expense', 'account', validated.account)
				ccpayment.setCurrentLineItemValue('expense', 'amount', amount)
				ccpayment.setCurrentLineItemValue('expense', 'class', validated.entity)
				ccpayment.setCurrentLineItemValue('expense', 'department', validated.department)
				ccpayment.setCurrentLineItemValue('expense', 'memo', memo)
				if (validated.client) {
					ccpayment.setCurrentLineItemValue('expense', 'isbillable', "T")
					ccpayment.setCurrentLineItemValue('expense', 'customer', validated.client)

				}
				ccpayment.commitLineItem('expense')

				//Set Link field
				var environment = nlapiGetContext().getEnvironment()
				if (environment == 'PRODUCTION') {
					//var requesturl = "https://system.netsuite.com/app/accounting/transactions/cardchrg.nl?whence=&payrecid="
					var requesturl = "/app/accounting/transactions/cardchrg.nl?whence=&payrecid="
				} else {
					//var requesturl = "https://system.sandbox.netsuite.com/app/accounting/transactions/cardchrg.nl?whence=&payrecid=" 
					var requesturl = "/app/accounting/transactions/cardchrg.nl?whence=&payrecid="
				}

				requesturl = requesturl + recid
				ccpayment.setFieldValue('custrecord_ccp_link', requesturl)


				try {
					var cctran = nlapiSubmitRecord(ccpayment)
					var cctranid = nlapiLookupField('creditcardcharge', cctran, 'transactionnumber')
				} catch (e) {
					validated.update = false
					validated.message = "CC Transaction Record Failure - " + e.toString()
				}
			}
		}

		if (!validated.update) {
			nlapiSubmitField('customrecord_ccpayments', recid, ['custrecord_ccp_message', 'custrecord_ccp_amount'], [validated.message, amount])
		} else {
			if (cctranid) {
				//Successful record creation
				validated.message = 'CC Transaction Created - ' + cctranid
				nlapiSubmitField('customrecord_ccpayments', recid, ['custrecord_ccp_message', 'custrecord_ccp_amount', 'isinactive'], [validated.message, debit, 'T'])
			} else {
				//Successful record creation
				validated.message = 'Journal Entry Created - ' + jrnltranid
				nlapiSubmitField('customrecord_ccpayments', recid, ['custrecord_ccp_message', 'custrecord_ccp_amount', 'isinactive'], [validated.message, credit, 'T'])
			}


		}


		//	}

	}


}

function validate(vendor, trandate, account, amount, credit, debit, department, entity, billable, client, update, message) {

	//Edit and vaildate record fields	
	var validated = new Object();
	validated.update = true
	validated.message = "-"

	//Vendor
	if (vendor) {
		var filter = new Array();
		filter[0] = new nlobjSearchFilter('entityid', null, 'is', vendor);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('entityid');
		var vendorrec = nlapiSearchRecord('vendor', null, filter, columns);
		if (vendorrec != null) {
			if (vendorrec.length > 1) {

				for (var v = 0; vendorrec != null && v < vendorrec.length; v++) {
					var entityid = vendorrec[v].getValue('entityid')
					if (entityid == vendor) {
						validated.vendor = vendorrec[0].getId()
					}
				}
				if (!validated.vendor) {
					validated.message = validated.message + "Multiple Vendors found with Vendor Name- "
					validated.update = false
				}


			} else
				validated.vendor = vendorrec[0].getId()
		} else {
			validated.message = validated.message + "Vendor Name Not Found- "
			validated.update = false
		}
	} else {
		validated.message = validated.message + "No Vendor Name supplied on import- "
		validated.update = false
	}

	//Date
	if (!trandate) {
		var today = nlapiDateToString(new Date())
		validated.trandate = today
	}

	//Account
	if (account) {

		account = account.split(" ")
		var acctno = account[0]
		var accountrec = nlapiSearchRecord('account', null, nlobjSearchFilter('number', null, 'is', acctno), null);
		if (accountrec != null) {
			validated.account = accountrec[0].getId()
		} else {
			validated.message = validated.message + "Account Not Found- "
			validated.update = false
		}
	} else {
		validated.message = validated.message + "Account Missing- "
		validated.update = false
	}

	//Amount
	if (!amount) {
		validated.message = validated.message + "Amount Field Missing "
		validated.update = false
	}

	//Department
	if (department) {
		var departmenttrec = nlapiSearchRecord('department', null, nlobjSearchFilter('name', null, 'is', department), null);
		if (departmenttrec != null) {
			validated.department = departmenttrec[0].getId()
		} else {
			validated.message = validated.message + "Department Not Found- "
			validated.update = false
		}
	} else {
		validated.message = validated.message + "Department Missing On Import- "
		validated.update = false
	}

	//Entity
	if (entity) {

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		var entitytrec = nlapiSearchRecord('classification', null, nlobjSearchFilter('name', null, 'startswith', entity), columns);

		var size = entitytrec.length
		var gotentity = false
		for (x = 0; x <= size - 1; x++) {
			var entname = entitytrec[x].getValue('name')
			if (entity == entname) {
				validated.entity = entitytrec[x].getId()
				gotentity = true
				break;
			}

		}

		if (!gotentity) {
			validated.message = validated.message + "Entity Not Found- "
			uvalidated.pdate = false
		}
	} else {
		validated.message = validated.message + "Entity Missing On Import- "
		validated.update = false
	}

	//Billable
	if (billable) {
		if (billable != 'Yes' && billable != 'No') {
			validated.message = validated.message + "Invalid Billable Field- "
			validated.update = false
		} else {
			if (billable == 'Yes') {
				//Client
				if (client) {
					//ATP-479 Add filter to ensure only Customers with Stage = Customer are returned
					var filters = new Array();
					filters[0] = new nlobjSearchFilter('companyname', null, 'startswith', client);
					filters[1] = new nlobjSearchFilter('stage', null, 'is', 'CUSTOMER');

					// var clientrec = nlapiSearchRecord('customer', null, nlobjSearchFilter('companyname', null, 'startswith', client), null);
					var clientrec = nlapiSearchRecord('customer', null, filters, null);
					nlapiLogExecution('DEBUG', 'validate', 'clientrec = ' + JSON.stringify(clientrec));
					if (clientrec != null) {
						validated.client = clientrec[0].getId()
					} else {
						validated.message = validated.message + "Client Not Found- "
						validated.update = false
					}
				} else {
					validated.message = validated.message + "Client Missing On Import- "
					validated.update = false
				}
			}

		}
	}



	return validated;

}