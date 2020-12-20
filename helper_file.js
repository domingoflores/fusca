

//building search filters dynamically
define(['N/search'],

    function (search) {

        function duplicateEmailSearch(email, contactID) {
            var filters = [];

            filters.push(search.createFilter({ name:'isinactive' ,operator:"is" ,values: "F" }));
            filters.push(search.createFilter({ name:'email' ,operator:"is" ,values: email }));

            if(contactID){
                filters.push(search.createFilter({ name:'internalid' ,operator:"noneof" ,values:[contactID] }));
            }

            var contactSearchObj = search.create({
                type: "contact",
                filters: filters
            });
            var searchResultCount = contactSearchObj.runPaged().count;
            log.debug("contactSearchObj result count", searchResultCount);
            return searchResultCount;
        }

        return {
            duplicateEmailSearch: duplicateEmailSearch
        };
    });

//Give Access to Non-Administrators

var e = nlapiLoadRecord("employee", -5);
var roleid = 46;
var roleCount=e.getLineItemCount('roles');
e.setLineItemValue('roles','selectedrole',roleCount+1,roleid);
e.setFieldValue("giveaccess", "T")
nlapiSubmitRecord(e)

//Remove Access to any user

var e = nlapiLoadRecord("employee", -5);
e.setFieldValue("giveaccess", "F")
nlapiSubmitRecord(e)


//Case switch statement for fieldchanged client functions example with try catch
function fieldChanged(context) {
	var REC = context.currentRecord;
	var fieldId = context.fieldId;
	var selectedValues = [];
	var unfilteredIndex = null;
	try {
		switch (fieldId) {
			case 'deal':
			case 'transactiontype':
				//for both deal and transaction type, 
				//do not allow Unfiltered to be selected
				//with other choices. This doubles up results incorrectly.
				selectedValues = REC.getValue(fieldId);
				if (selectedValues.length > 1) {	//if there are at least two selections, apply this logic 
					unfilteredIndex = selectedValues.indexOf("Unfiltered");
					if (unfilteredIndex >= 0) {
						REC.setValue(
							{
								fieldId: fieldId
								, value: selectedValues.splice(unfilteredIndex, 1)
								, ignoreFieldChange: true
							}
						);
					}
				}
				//console.log("selectedValues " + selectedValues);
				break;
		}
	}
	catch (e) {
		log.error("PaymentFileCreation_SL_CL field changed error ", e.toString());
		//console.log(e);
	}
}


//Marko msg examples ui
//call
if (e_mail && !is_inactive) {
	var dupEmailSearch = contactlib.duplicateEmailSearch(e_mail);

	if (!dupEmailSearch) {
		if (myMsg) {
			myMsg.hide();
		}
//funcation
function showErrorMessage(title, msgText) {
	if (myMsg) {
		myMsg.hide();
	}
	myMsg = msg.create({
		title: title,
		message: msgText,
		type: msg.Type.ERROR
	});
	myMsg.show();
	window.scrollTo(0, 0);
}

function showErrorMessage(title, msgText) {
	myMsg = msg.create({
		title: title,
		message: msgText,
		type: msg.Type.ERROR
	});
	myMsg.show();
	window.scrollTo(0, 0);
}
if (allExcluded) {
	showErrorMessage("Payment File Cannot be Created", "All lines are excluded.");
	return false;
}


//error handling from restlet post calls
function RecordHelper() {

	// Publicly available methods
	var module = {

		/**
		 * Writes error log message
		 * and sends an error code to requestor
		 * @param  {object} e Caught exception
		 * @return {null}   void
		 */
		handleError: function (e) {
			var msg = '';

			if (e instanceof nlobjError) {

				msg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n' + e.getDetails());

			} else {

				for (var prop in e) {
					msg += "Property: " + prop + ", Value: [" + e[prop] + "] -- ";
				}
				nlapiLogExecution('DEBUG', 'unexpected error', e);
			}

			public.setStatus('ERROR');
			public.addMessage(1999, "System Error: " + msg);
		},

	} catch (err) {
		var error = handleError(err);
		nlapiLogExecution('ERROR', 'createRecord', JSON.stringify(error));

		//var error = public.libraries.global.handleError( err, 'createError' );
		//nlapiLogExecution('ERROR','createRecord',err);
		public.setStatus('ERROR');
		public.addMessage(1999, JSON.stringify(error));
		nlapiLogExecution('DEBUG', 'There was an error', JSON.stringify(err));

	}



//how to break out of a try in a try/catch

+	fromTry:
try {
	+		if (certsTotal != 0 && dealEventRecord["payoutType"] == derPayoutType_DataCollectionOnly) {
		+			msg.setStatusError();
		+			msg.addMessage("DER indicates Transaction is for data collection only but the certificate payment amount is greater than $0.00");
		+			output.error = 'error';
		+			output.msg = msg.getMessages();
		+			return output;
		+		}
	+
		+		if (glAccounts.length == 0 && !dealEventRecord["glAccount"]) {
			+			// if we are here it means that there is no GL Account assigned.
				+			// There is a special case where if all certs total zero and DER payout Type is "Data Collection Only"
				+			// then no GL Account is required for this exchange record
				+
				+			if (certsTotal == 0 && dealEventRecord["payoutType"] == derPayoutType_DataCollectionOnly) { break fromTry; }
			+
				+			// if we are here then it is an error that there is no GL Account assigned 
				+			msg.setStatusError();
			+			msg.addMessage("This Exchange record is missing a GL Account on the DER record");
			+			output.error = 'error';
			+			output.msg = msg.getMessages();
			+			return output;
			+		}

//postman call to create contact rec


{
	"recordtype": "contact",
		"records": [
			{
				"entityid": "test contact bputnam 123",
				"customform": 24,
				"email": "bputnam@srsacquiom.com",
				"custentity58": 2
			}
		],
			"module": "generic",
				"restlet": "crud"
}



//double for loop to identified removed values from array

function haveCurrenciesBeenRemoved(newRecCurrencies, oldRecCurrencies) {
	var removedCurrencies = [];
	for (ix in oldRecCurrencies) {
		var found = false;
		for (jx in newRecCurrencies) {
			if (newRecCurrencies[jx] == oldRecCurrencies[ix]) {
				found = true;
			}
		}
		if (!found) {
			removedCurrencies.push(oldRecCurrencies[ix])
		}
		//removing USD from the removed fx currencies list
		var index = removedCurrencies.indexOf("1");
		if (index > -1) {
			removedCurrencies.splice(index, 1);
		}
	}
	return removedCurrencies;
}


(['N/ui/message'],
	function (msg) {
		function showErrorMessage(msgText) {
			var myMsg = msg.create({
				title: "Cannot Save Record",
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show({
				duration: 5000
			});
var customrecord_acq_lotSearchObj = search.create({
	type: "customrecord_acq_lot",
	filters:
		[
			["custrecord_acq_loth_zzz_zzz_deal", "anyof", "538328"],
			"AND",
			["custrecord_exrec_shrhldr_settle_curr", "anyof", "1", "31"]
		],
	columns:
		[
			search.createColumn({
				name: "id",
				sort: search.Sort.ASC,
				label: "ID"
			}),
			search.createColumn({ name: "custrecord_exrec_shrhldr_settle_curr", label: "Shareholder Settlement Currency" }),
			search.createColumn({ name: "custrecord_acq_loth_zzz_zzz_deal", label: "Deal" })
		]
});
var searchResultCount = customrecord_acq_lotSearchObj.runPaged().count;
log.debug("customrecord_acq_lotSearchObj result count", searchResultCount);
customrecord_acq_lotSearchObj.run().each(function (result) {
	// .run().each has a limit of 4,000 results
	return true;
});

submit nlapi fields
nlapiSubmitField('customrecord_acq_lot_cert_entry', 254944, 'custrecord_acq_lotce_zzz_zzz_payment', 500);

11: 25: 06.061 




/* ATP-1735 - start
					
	Add “Create FX Currency Contract” button to DER form.

Enabled when:
DEAL. FX SETTLEMENT CURRENCIES ALLOWED = YES
DEAL. FX LEVEL = DEAL
User Department = Operations and Technology: Client Operations: Acquiom Operations
User Role = SRS Operations Analyst and SRS Operations Manager

    				const FX_LEVEL_IS_DEAL = "2";
    				
    				if (REC.getValue("custrecord_pay_import_deal")) {
    					
        	        	if (srsFunctions.userIsAdmin() || 
        	        			(runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS 
        	        		&& (runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER 
        	        				|| runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST))) {
        	        		
        					var dealFields = search.lookupFields({type: record.Type.CUSTOMER, id: REC.getValue("custrecord_pay_import_deal"), columns: ["custentity_acq_deal_fx_curr_cbox", "custentity_acq_deal_fx_level"]});
        					
        					log.debug(funcName, dealFields); 
        					if (dealFields.custentity_acq_deal_fx_curr_cbox && dealFields.custentity_acq_deal_fx_level && dealFields.custentity_acq_deal_fx_level[0].value == FX_LEVEL_IS_DEAL) {
        						
                				var recURL = url.resolveRecord({
                                    recordType:			"customrecord_fx_conv_contract", 
                                    params:{
                                    		"record.custrecord_fx_conv_der":				REC.id 
                                    		}
                				});

                                var scr = "null; window.location.href='" + recURL + "'; console.log";

                				context.form.addButton({
                					id : "custpage_fx_k",
                					label : "Create FX Currency Contract",
                					functionName: scr
                				});    				                    	
        						
        					}
        	        	}
    				}
    				*/// ATP-1735 - end


//save file to cabinet folder -- must import n/file module
var myFile = file.create({
					 		name: "context",
					 		fileType: file.Type.PLAINTEXT,
					 		contents: JSON.stringify(context),
					 		folder: '350982'
					 	});
					 	 myFile.save();


//compare arrays

/*
// compare two arrays, return the number of differences
function compareArrays(array1, array2) {
	var len = Math.min(array1.length, array2.length),
		lengthDi
		
		ff = Math.abs(array1.length - array2.length),
		diffs = 0,
		i;
	for (i = 0; i < len; i++) {
		if (~~array1[i] !== ~~array2[i]) {
			diffs++;
		}
	}
	return diffs + lengthDiff;
}
*/


// two object structures matching saved items to another list in array
var savedCurrencies = context.newRecord.getValue('custentity_acq_deal_fx_settle_currencies');
log.debug('previously savedCurrencies from actual field: ', savedCurrencies);

var fxcheckbox = context.newRecord.getValue('custentity_acq_deal_fx_curr_cbox');
log.debug('fxcurrencies allowed checkbox value: ', fxcheckbox);

var form = context.form;

var fx_settlement_currencies = form.addField({
	id: 'custpage_acq_deal_fx_settle_currencies',
	label: 'FX SETTLEMENT CURRENCIES',
	type: 'multiselect'
});
fx_settlement_currencies.isMandatory = true;

form.insertField({
	field: fx_settlement_currencies,
	nextfield: 'custentity_acq_deal_fx_settle_currencies'
});

if (Boolean(paymentBankID)) {

	var pb_currencies_result = cuDealLibrary.paymentBankCurrencies(paymentBankID);
	log.debug("currencyList from PaymentBankCurrencies() SEARCH: ", JSON.stringify(pb_currencies_result));
//CORE OF THE LOOPING AND MATCHING
	for (var i = 0, len = pb_currencies_result.length; i < len; i++) {
		isSelected = false;
		for (var z = 0; z < savedCurrencies.length; z++) {
			if (savedCurrencies[z] == pb_currencies_result[i].internalid)
				isSelected = true;
		}

		fx_settlement_currencies.addSelectOption({
			text: pb_currencies_result[i].name,
			value: pb_currencies_result[i].internalid,
			isSelected: isSelected
		});
	}
}

//sourcing to real field on fieldchange

case 'custpage_pay_file_final_approver':
	finalApprover = context.currentRecord.getValue({
		fieldId: "custpage_pay_file_final_approver"
	});
	context.currentRecord.setValue({
		fieldId: "custrecord_pay_file_final_approver",
		value: finalApprover
	});
	break;
	

// if this form set a field
if (REC.getValue("customform") == 120 && context.type == context.UserEventType.CREATE) {
	REC.setValue("category", srsConstants.CUSTOMER_CATEGORY.DEAL)
}
//copy
if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.CUSTOMER_DEAL && context.type == context.UserEventType.CREATE) {
	REC.setValue("category", srsConstants.CUSTOMER_CATEGORY.DEAL)
}

//how to prevent imports to specific fields

function beforeSubmit(context) {
	var REC = context.newRecord;

	var donotimportfields = " FX SETTLEMENT CURRENCIES ALLOWED, FX LEVEL, FX PROVIDER, FX SETTLEMENT CURRENCIES."

	if (runtime.executionContext == runtime.ContextType.CSV_IMPORT) {
		if (context.newRecord.getValue("custentity_acq_deal_fx_curr_cbox") != context.oldRecord.getValue("custentity_acq_deal_fx_level")) {
			throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
		}
		if (context.newRecord.getValue("custentity_acq_deal_fx_level") != context.oldRecord.getValue("custentity_acq_deal_fx_level")) {
			throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";

		}
		if (context.newRecord.getValue("custentity_acq_deal_fx_provider") != context.oldRecord.getValue("custentity_acq_deal_fx_provider")) {
			throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
		}
		if (context.newRecord.getValue("custentity_acq_deal_fx_settle_currencies") != context.oldRecord.getValue("custentity_acq_deal_fx_settle_currencies")) {
			throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
		}
	}

if (savedCurrencies.forEach(function (item, index) {
	var currentsavedID = [item]
	log.debug("currentSavedID: ", currentsavedID)
}) == pb_currencies_result[i].internalid)
	
var customrecord_payment_bankSearchObj = search.create({
	type: "customrecord_payment_bank",
	filters:
		[
		],
	columns:
		[
			search.createColumn({ name: "custrecord_pb_settlement_currencies", label: "Settlement Currencies" }),
			search.createColumn({
				name: "name",
				sort: search.Sort.ASC,
				label: "Name"
			}),
			search.createColumn({
				name: "name",
				join: "CUSTRECORD_PB_SETTLEMENT_CURRENCIES",
				label: "Name"
			}),
			search.createColumn({
				name: "internalid",
				join: "CUSTRECORD_PB_SETTLEMENT_CURRENCIES",
				label: "Internal ID"
			})
		]
});
var searchResultCount = customrecord_payment_bankSearchObj.runPaged().count;
log.debug("customrecord_payment_bankSearchObj result count", searchResultCount);
customrecord_payment_bankSearchObj.run().each(function (result) {
	// .run().each has a limit of 4,000 results
	return true;
});



//old REcord New Record notes

//The newRecord for beforeSubmit is the new data that will be going into the database.The oldRecord is the data that is currently there.

//The newRecord for afterSubmit is the new data that is now in the database.The oldRecord is the data that was there.afterSubmit is read - only.

//For beforeLoad, it's a new record - so it's named newRecord for consistency.

//Add additional code
...
var configRecObj = config.load({
	type: config.Type.COMPANY_INFORMATION
});
configRecObj.setText({
	fieldId: 'fiscalmonth',
	text: 'July'
});
configRecObj.save();
...
//Add additional code

var searchoutput = { "custrecord_pb_settlement_currencies": [{ "value": "2", "text": "British pound" }, { "value": "3", "text": "Canadian Dollar" }, { "value": "4", "text": "Euro" }, { "value": "1", "text": "USD" }] }

var searchoutputcustom = searchoutput['custrecord_pb_settlement_currencies'];


[
	{
		name: "3D Robotics_B-1",
		internalid: "96"
	}
	,
	{
		name: "A Place For Mom",
		internalid: "18"
	}
	,
	{
		name: "Afterlive.tv_Twitter",
		internalid: "97"
	}
	,
	{
		name: "AirPatrol",
		internalid: "90"
	}
	,
	{
		name: "AirPatrol Sysorex",
		internalid: "91"
	}
	,
	{
		name: "Akros Silicon Kinetic Technologies",
		internalid: "141"
	}
	,
	{
		name: "Aliphcom Series 5 Preferred Stock",
		internalid: "57"
	}
]

for (var i = 0, len = searchoutputcustom.length; i < len; i++) {
	//writeln(searchoutputcustom[i]);
	writeln(searchoutputcustom[i].value);
	//writeln(searchoutputcustom[i].text);
	writeln(searchoutputcustom[i]['text']);
}



if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY || context.type == context.UserEventType.CREATE) {
	evaluateClientReleaseFundApproverGroup();

	var form = context.form;
	var savedCurrency = context.newRecord.getValue('custrecord_crf_trk_currency');

	var crf_currency = form.addField({
		id: 'custpage_crf_currency',
		type: serverWidget.FieldType.SELECT,
		label: 'CURRENCY',
		type: 'select'
	});

	form.insertField({
		field: crf_currency,
		nextfield: 'custrecord_crf_trk_pay_from_acc'
	});
	for (var i = 1; i <= currencies_and_balances.length; i++) {
		crf_currency.addSelectOption({
			value: currencies_and_balances[i - 1].currencyID,
			text: currencies_and_balances[i - 1].currency
		});
	}
	crf_currency.isMandatory = true;

}




fixes atp1564

//initiate amount available for release equals to gl account balance field
var custrecord_ead_account_balance = REC.getValue("custrecord_ead_account_balance");
REC.setValue({
	fieldId: 'custrecord_ead_amnt_avail_release',
	value: custrecord_ead_account_balance,
	ignoreFieldChange: true
});


node - cli 

alias sc = 'suitecloud'
alias scd = 'sc project:deploy'
alias scv = 'sc project:validate -s'

// clear and set records for ready states via console

require(["N/record"], function (record) {
	var REC = record.load({
		type: 'customrecord_escrow_agent_disbursement',
		id: 219
	});
	REC.setValue("custrecord_ead_credit_memo", "");
	REC.setValue("custrecord_ead_cust_refund", "");
	REC.setValue("custrecord_ead_first_journal", "");
	REC.setValue("custrecord_ead_second_journal", "");
	REC.setValue("custrecord_ead_third_journal", "");
	REC.setValue("custrecord_ead_credit_memo", "");
	REC.setValue("custrecord_ead_status", 1);
	REC.setValue("custrecord_ead_processing_summary", "");
	REC.save();


});


//DOCKET
//NLAPI
nlapiSubmitField('customrecord_escrow_agent_disbursement', 171, 'custrecord_ead_status', '1'); 

nlapiSubmitField('customer', '995904', 'custentity_docket_entered_dt', ‘')

 nlapiSubmitField('customer', '995904', 'custentity_docket_reviewed_by', ‘')

  nlapiSubmitField('customer', '995904', 'custentity_docket_sent_for_entry_by', ‘')

//create journal 2 and 3





/*
// JE # 2   stage example id = 4636814
// for the overage account (GL ACCOUNT #200001 ACQUIOM ESCROW AGENT: ACQUOIM CLEARINHOUSE EA - INTEREST OVERAGE). Internal ID = 13002
try {
	// header & line fields
	log.debug('creating JE#2...', '');

	var JE = record.create({
		type: "journalentry",
		isDynamic: true,
	});
	//body fields
	var journalEntryFields = {
		customform: customForm,             // SRS Esceow Agent Form
		custbody1: escrowTransaction,      // escrow transaction = Investment Earnings
		custbody2: escrow,                 // escrow
		custbody4: 'Investment Earnings',  // memo
		custbody_esc_tx_status: 'RELEASED',// req field
		custbodyacq_deal_link: dealLink,
		custbody_deal_escrow: dealEscrow,
		custbody_je_accrual_dt: todaysDate
	};
	for (prop in journalEntryFields) {
		JE.setValue({
			fieldId: prop,
			value: journalEntryFields[prop]
		});
	}

	// line items

	// line 1
	JE.selectNewLine({ sublistId: "line" });
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "account",
		value: lineAccount1,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "department",
		value: lineDepartment,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "class",
		value: lineClass,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "memo",
		value: lineMemo,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "entity",
		value: lineEntity,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "credit",
		value: JEobj.accruedInterestAmount,	//lineCredit
		ignoreFieldChange: true
	});
	JE.commitLine({ sublistId: "line" });


	// line 2
	JE.selectNewLine({ sublistId: "line" });
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "account",
		value: lineAccount2,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "department",
		value: lineDepartment,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "memo",
		value: lineMemo,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "class",
		value: lineClass,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "entity",
		value: lineEntity,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "debit",
		value: JEobj.accruedInterestAmount,	//lineDebt
		ignoreFieldChange: true
	});
	JE.commitLine({ sublistId: "line" });
	//console.log('JE#2 - line 1 accnt='+ lineAccount2 +' debit='+JEobj.accruedInterestAmount);


	//console.log("JE="+ JSON.stringify(JE) );

	JE.save();
	log.debug('CREATED JE#2 id=' + JE.id, 'date=' + todaysDate + ' JE=' + JE.id);
} catch (e) {
	log.error('JE #2 Error', e.message);
}






// JE #3
// Forward date the entry to the 1st day of the following month.
// This is to deposit into the interest overage account (deposit $$$ of interest) into
// the (GL Acct #200001 Acquiom Escrow Agent : Acquiom Clearinghouse EA - Interest Overage Internal ID = 13002) to make it whole again.
// I.e. the opposite of the debit/credit from the journal out of the Overage account (I.e. Journal #2)
try {
	// header & line fields
	log.debug('creating JE #3...', 'JE#3 lastDayThisMonth=' + lastDayThisMonth + ' firstDayNextMonth=' + firstDayNextMonth);

	var date = new Date();
	var firstDayNextMonth = new Date(date.getFullYear(), 11 + 1, 1);
	var lastDayThisMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
	// get the overage
	//


	var JE = record.create({
		type: "journalentry",
		isDynamic: true,
	});
	//body fields
	var journalEntryFields = {
		customform: customForm,             // SRS Esceow Agent Form
		custbody1: escrowTransaction,      // escrow transaction = Investment Earnings
		custbody2: escrow,                 // escrow
		custbody4: 'Investment Earnings',  // memo
		custbody_esc_tx_status: 'RELEASED',// req field
		custbodyacq_deal_link: dealLink,
		custbody_deal_escrow: dealEscrow,
		custbody_je_accrual_dt: lastDayThisMonth,
		trandate: firstDayNextMonth
	};
	for (prop in journalEntryFields) {
		JE.setValue({
			fieldId: prop,
			value: journalEntryFields[prop]
		});
	}

	// line items
	JE.selectNewLine({ sublistId: "line" });
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "account",
		value: lineAccount1,
		ignoreFieldChange: true
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "department",
		value: lineDepartment
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "class",
		value: lineClass
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "memo",
		value: lineMemo
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "entity",
		value: lineEntity
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "debit",
		value: JEobj.accruedInterestAmount	//lineDebt
	});
	JE.commitLine({ sublistId: "line" });

	// line 2
	JE.selectNewLine({ sublistId: "line" });
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "account",
		value: lineAccount2
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "department",
		value: lineDepartment
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "memo",
		value: lineMemo
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "class",
		value: lineClass
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "entity",
		value: lineEntity
	});
	JE.setCurrentSublistValue({
		sublistId: "line",
		fieldId: "credit",
		value: JEobj.accruedInterestAmount	//lineCredit
	});
	JE.commitLine({ sublistId: "line" });

	JE.save();
	log.debug('CREATED JE#3 id=' + JE.id, 'date=' + todaysDate + ' JE=' + JE.id);
} catch (e) {
	log.error('JE #3 Error', e.message);
}

*/



// fieldchanged roberts approach to app setting on client


if ((context.fieldId === 'custrecord89' || context.fieldId === 'custrecord_esn_final_news_date')) {
	var custrecordesnapproval = REC.getValue('custrecordesnapproval')
	if (custrecordesnapproval == 4) {
		var fieldLookUp = search.lookupFields({
			type: 'customrecord_pri_app_setting',
			id: '377',
			columns: ['custrecord_pri_as_value']
		}).custrecord_pri_as_value;
		var employeesAllowedForDateEdit = fieldLookUp.split(",");

		var currentUser = runtime.getCurrentUser().id;

		if (employeesAllowedForDateEdit.indexOf(currentUser.toString()) == -1) {
			return false;
		} else { }

	}
}





// custom script field custpage with custom drop down selections example code:

{
	evaluateClientReleaseFundApproverGroup();

	var form = context.form;
	var savedCurrency = context.newRecord.getValue('custrecord_crf_trk_currency');

	var crf_currency = form.addField({
		id: 'custpage_crf_currency',
		type: serverWidget.FieldType.SELECT,
		label: 'CURRENCY',
		type: 'select'
	});

	form.insertField({
		field: crf_currency,
		nextfield: 'custrecord_crf_trk_pay_from_acc'
	});
	for (var i = 1; i <= currencies_and_balances.length; i++) {
		crf_currency.addSelectOption({
			value: currencies_and_balances[i - 1].currencyID,
			text: currencies_and_balances[i - 1].currency
		});
	}
	crf_currency.isMandatory = true;

}


//handling multiple conditions if statements 
	
	
	const conditionsArray = [
		condition1,
		condition2,
		condition3,
	]

if (conditionsArray.indexOf(false) === -1) {
	"do somthing"
}

Or ES6

if (!conditionsArray.includes(false)) {
	"do somthing"
}

field_to_clear = ['custrecord_ss_submit_type', 'custrecord_ss_submit_deal', 'custrecord_ss_submit_ra', 'custrecord_ss_submit_rm',
	'custrecord_ss_submit_new_doc','custrecord_ss_submit_doc_id','custrecord_ss_submit_tab','custrecord_ss_submit_special',
	'custrecord_ss_submit_submitted','custrecord_ss_submit_subtime','custrecord_ss_submit_analyst','custrecord_ss_submit_sol_eta',
	'custrecord_ss_submit_clo_eta','custrecord_ss_submit_type_so','custrecord_ss_submit_type_pa','custrecord_ss_submit_report',
	'custrecord_ss_submit_certs','custrecord_ss_submit_auth','custrecord_ss_submit_foreign','custrecord_ss_submit_currenc',
	'custrecord_ss_submit_exp_doc','custrecord_ss_submit_add_doc','custrecord_ss_submit_aes','custrecord_ss_submit_vendor',
	'custrecord_ss_submit_total','custrecord_ss_submit_payout']




/*
var escrow_field_value = REC.getValue("custrecord88");

console.log('value on escrow field: ', escrow_field_value);

var vip = context.currentRecord.getField({
	fieldId: 'custrecord_esn_vip_message'
});

console.log('vip: ', JSON.stringify(vip));

if (escrow_field_value == 591324) {
	vip.isDisplay = true;
} else {
	vip.isDisplay = false;
}
*/

function showErrorMessage(msgTitle, msgText) {
	var myMsg = message.create({
		title: msgTitle,
		message: msgText,
		type: message.Type.WARNING
	});
	myMsg.show({
		duration: 12900
	});
	window.scrollTo(0, 0);
}






var escrow_field_value = REC.getValue("custrecord88");

console.log('value on escrow field: ', escrow_field_value);

var vip = context.currentRecord.getField({
	fieldId: 'custrecord_esn_vip_message'
});

console.log('vip: ', JSON.stringify(vip));

if (escrow_field_value == 591324) {

	vip.isDisplay = true;

} else {

	vip.isDisplay = false;

}

}




TOKEN ID
658 a75b74bf3db6a4c52ac9190be83430eb1e9a1ef57af3151e17e89a3df57d9
TOKEN SECRET
82686184 a5beee813edb439ccfc597ab36c2eda3ecd221001e9968d2811fa6ee


	. / sdfcli createproject - type ACCOUNTCUSTOMIZATION - parentdirectory / Users / bpadmin / CLI / projects - projectname SDF_CLI_POC

	. / sdfcli importobjects - account 772390 _SB3 -
	destinationfolder / Users / bpadmin / CLI / projects / SDF_CLI_POC / Objects -
	email bputnam @shareholderrep.com -
	p / Users / bpadmin / CLI / projects / SDF_CLI_POC / Objects -
	role 1116 -
	scriptid customrecord_deal_recap -
	type customrecord -
	url system.netsuite.com

//taking an element out of an array using indexOf
var b = a.splice(a.indexOf("custrecord_acq_loth_5b_de1_addlinstrct"), 1);
var a = ["custrecord_acq_loth_4_de1_lotpaymethod",
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
]


checkboxFields = context.newRecord.getValue('custrecord_exrec_giin_validated');
tsFields = context.newRecord.getValue('custrecord_exrec_giin_validated_ts');
userFields = context.newRecord.getValue('custrecord_exrec_giin_validated_by');

var giin_validated = context.newRecord.getValue("custrecord_exrec_giin_validated");
log.debug('csv import value', giin_validated);



// ATP-1300 -- logic similar to what will be added to TINCHECKLibrary.js
var giin_check_result = context.currentRecord.getValue("custrecord_exrec_tinchk_giin_result");
log.debug('giin check result:', giin_check_result + typeof (giin_check_result));
var giin_validated_checbox = context.currentRecord.getValue("custrecord_exrec_giin_validated");
log.debug('giin check result:', giin_validated_checbox + typeof (giin_validated_checbox));

if (giin_check_result == 'PossibleMatch') {
	log.debug('is giin result equals to possiblematch:', (giin_check_result == 'PossibleMatch'));
	context.currentRecord.setValue({
		fieldId: 'custrecord_exrec_giin_validated',
		value: true,
		ignoreFieldChange: true
	})
	log.debug("new record: ", JSON.stringify(context.currentRecord.fields));
	context.currentRecord.setValue({
		fieldId: 'custrecord_exrec_giin_validated_ts',
		value: '',
		ignoreFieldChange: true
	})
	context.currentRecord.setValue({
		fieldId: 'custrecord_exrec_giin_validated_by',
		value: '',
		ignoreFieldChange: true
	})
} else if (giin_check_result == 'NotChecked' ||
	giin_check_result == 'NoMatch' ||
	giin_check_result == 'Error') {

	context.currentRecord.setValue({
		fieldId: 'custrecord_exrec_giin_validated',
		value: false,
		ignoreFieldChange: true
	})
	context.currentRecord.setValue({
		fieldId: 'custrecord_exrec_giin_validated_ts',
		value: '',
		ignoreFieldChange: true
	})
	context.currentRecord.setValue({
		fieldId: 'custrecord_exrec_giin_validated_by',
		value: '',
		ignoreFieldChange: true
	})

} else { // If the original ExRec was in 5/5, the new one should be in 4/4
	// Else, the status should be copied over to the new ExRec
	log.debug("HERE", "inside else")
	log.debug("AQM stat :", temp_custrecord_acq_loth_zzz_zzz_acqstatus);
	log.debug("SHARE stat :", temp_custrecord_acq_loth_zzz_zzz_shrhldstat);

	var myIndex = findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_acqstatus");
	log.debug("index", myIndex);

	if (properties[myIndex].value != 5) {
		// ACQ LOT Status is in "5" status
		properties[myIndex].value = temp_custrecord_acq_loth_zzz_zzz_acqstatus;
	}
	var myIndex = findWithAttr(properties, "property", "custrecord_acq_loth_zzz_zzz_shrhldstat");
	if (properties[myIndex].value != 6) {
		// Shareholder LOT Status is in "6" status
		properties[myIndex].value = temp_custrecord_acq_loth_zzz_zzz_shrhldstat;
	}
}


var func = require(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'],

	function (record, search, runtime, error, format, url, serverWidget) {

		var accountsCurrency = accountsJSON();

		function accountsJSON() {
			var accountsList = [];
			var customerSearchObj = search.create({
				type: "account",
				filters: [
					["parent", "anyof", "220", "4764"]
				],
				columns: [
					search.createColumn({
						name: "internalid",
						label: "Internal ID"
					}),
					search.createColumn({
						name: "name",
						label: "Name"
					}),
					search.createColumn({
						name: "custrecord_acc_sourced_currency",
						label: "Sourced Currency"
					})

				]
			});
			var searchResultCount = customerSearchObj.runPaged().count;
			log.debug("customerSearchObj result count", searchResultCount);
			customerSearchObj.run().each(function (result) {
				accountsList.push({
					internalid: result.getValue({
						'name': 'internalid'
					}),
					name: result.getValue({
						'name': 'name'
					}),
					name: result.getValue({
						'name': 'custrecord_acc_sourced_currency'
					})
				})
				return true;
			});
			return accountsList;
			log.debug("accountsList search result", accountsList);
		}
	});
func();


var func = require(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'],
	function (record, search, runtime, error, format, url, serverWidget) {
		var accountsCurrency = accountsJSON();

		function accountsJSON() {

			var accountsList = [];
			var customerSearchObj = search.create({
				type: "account",
				filters: [
					["parent", "anyof", "220", "4764"]
				],
				columns: [
					search.createColumn({
						name: "internalid",
						label: "Internal ID"
					}),
					search.createColumn({
						name: "name",
						label: "Name"
					})
				]
			});
			var searchResultCount = customerSearchObj.runPaged().count;
			log.debug("customerSearchObj result count", searchResultCount);
			customerSearchObj.run().each(function (result) {
				//currencyLookUp

				var theID = result.getValue({
					'name': 'internalid'
				})

				var accountRecord = record.load({
					type: search.Type.ACCOUNT,
					id: theID,
					isDynamic: true
				});

				currencyLookUp = accountRecord.getValue({
					fieldId: 'currency'
				})

				accountsList.push({

					name: result.getValue({
						'name': 'name'
					}),

					currency: currencyLookUp,

					internalid: result.getValue({
						'name': 'internalid'
					})
				});
				return true;
			});
			return accountsList;
		}

		var stpp = 1;
	});

func();



var accountSearchObj = search.create({
	type: "account",
	filters: [
		["parent", "anyof", "220", "4764"]
	],
	columns: [
		search.createColumn({
			name: "name",
			sort: search.Sort.ASC,
			label: "Name"
		}),
		search.createColumn({
			name: "type",
			label: "Account Type"
		}),
		search.createColumn({
			name: "formulatext",
			formula: "{currency}",
			label: "Formula (Text)"
		})
	]
});
var searchResultCount = accountSearchObj.runPaged().count;
log.debug("accountSearchObj result count", searchResultCount);
accountSearchObj.run().each(function (result) {
	// .run().each has a limit of 4,000 results
	return true;
});


function accountsJSON() {
	var accountsList = [];
	var customerSearchObj = search.create({
		type: "account",
		filters: [
			["parent", "anyof", "220", "4764"]
		],
		columns: [
			search.createColumn({
				name: "internalid",
				label: "Internal ID"
			}),
			search.createColumn({
				name: "name",
				label: "Name"
			}),
			search.createColumn({
				name: "currency",
				label: "CURRENCY"
			})
		]
	});
	var searchResultCount = customerSearchObj.runPaged().count;
	log.debug("customerSearchObj result count", searchResultCount);
	customerSearchObj.run().each(function (result) {
		accountsList.push({
			name: result.getValue({
				'name': 'name'
			}),
			currency: result.getValue({
				'name': 'currency'
			}),
			internalid: result.getValue({
				'name': 'internalid'
			})
		})
		return true;
	});
	return accountsList;
}



context.form.insertField({
	field: accountFld,
	nextfield: "trandate"
});

}
}




var newRec = context.newRecord;
var deal_link_field = newRec.getValue({
	fieldId: 'custrecord_crf_trk_deal'
});

log.debug("deal related to the rap: ", deal_link_field);




crf_approver.addSelecticOption({
	value: '',
	text: 'Please Select an Approver'
});


var crf_account = theForm.addField({
	id: 'custpage_crf_account',
	type: serverWidget.FieldType.SELECT,
	label: 'Pay From Account'
});

crf_approver.addSelecticOption({
	value: '',
	text: 'Please Select an Account'
});
theForm.insertField({
	field: crf_account,
	nextfield: 'custrecord_crf_trk_pay_from_acc'
})


function checkValidUser(currentUser) {
	// only users with the  permission can see the buttons
	var empSearch = search.create({
		type: 'employee',
		columns: ['internalid'],
		filters: [
			['custentity_subsequent_payments', 'is', 'T']
		]
	}).run();

	var searchResults = searchResultsLibrary.getSearchResultData(empSearch);
	for (var i = 0; i < searchResults.length; i++) {
		var testId = searchResults[i].id;
		if (currentUser.toString() === testId.toString()) {
			return true;
		}
	}
	return false;
}


var ss = search.create({
	type: record.Type.ACCOUNT,
	filters: [
		["isinactive", search.Operator.IS, false], "AND", ["custrecord_deal_escrow", search.Operator.ANYOF, [REC.getValue("custbody_deal_escrow")]]
	],
	columns: ["name"]
}).run().each(function (result) {
	accountFld.addSelectOption({
		value: result.id,
		text: result.getValue("name")
	});
	return true;
});







/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *
 * ATP-1072 - UI
 * 
 */

define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/ui/message', 'N/url', 'N/redirect', '/.bundle/132118/PRI_AS_Engine', '/SuiteScripts/Prolecto/Shared/SRS_Constants'],

	function (record, search, serverWidget, runtime, message, url, redirect, appSettings, srsConstants) {

		var executionContext = runtime.executionContext;
		var userObj = runtime.getCurrentUser();
		var userDept = runtime.getCurrentUser().department;
		var userRoleId = runtime.getCurrentUser().role;
		var arrayClientReleaseGroup;
		var clientReleaseGroupAccess = false;
		var errorMessage = "";


		//**********************************************
		function evaluateClientReleaseFundApproverGroup() {
			arrayClientReleaseGroup = JSON.parse(appSettings.readAppSetting("Client Fund Release Tracking", "Client Release Fund Approver Group"));
			// Are you in the Group
			if (arrayClientReleaseGroup.indexOf(userObj.name) == -1) {
				errorMessage += "You are not part of the Client fund Approver Group <br>"
			}
			// Are you in the correct dept
			if (!Boolean(userDept == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE)) {
				errorMessage += "You must be in the DATA MANAGEMENT AND RELEASE DEPARTMENT TO PERFORM THIS ACTION <br>";
			}
			// Are you in the correct role
			if (!Boolean(userRoleId == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER || userRoleId == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST)) {
				errorMessage += "You must be in the SRS OPERATIONS MANAGER OR ANALYST ROLE TO PERFORM THIS ACTION <br>";
			}
			//back door for admin
			if (userRoleId == srsConstants.USER_ROLE.ADMINISTRATOR && runtime.envType == "SANDBOX") {
				errorMessage = "";
			}
			if (errorMessage != "") {
				throw errorMessage;
			} else {
				clientReleaseGroupAccess = true;
			}
		}

		//acount search, show only certain accounts on the drop down
		/*
var accountSearchObj = search.create({
type: "account",
filters: [
[
["number", "is", "002305"], "OR", ["parent", "anyof", "220", "4764"]
]
],
columns: [
search.createColumn({
name: "name",
sort: search.Sort.ASC,
label: "Name"
}),
search.createColumn({
name: "type",
label: "Account Type"
}),
search.createColumn({
name: "description",
label: "Description"
}),
search.createColumn({
name: "balance",
label: "Balance"
}),
search.createColumn({
name: "custrecord_deal_name",
label: "Deal"
})
]
});
var searchResultCount = accountSearchObj.runPaged().count;
log.debug("accountSearchObj result count", searchResultCount);
accountSearchObj.run().each(function (result) {
// .run().each has a limit of 4,000 results
return true;
});
	
*/
		//*****creating sourcing temp fields on the form for the filtered drop down selection





		//**********************************************

		function beforeLoad(context) {
			log.debug("context", JSON.stringify(context));
			evaluateClientReleaseFundApproverGroup();
			log.debug("beforeload", "In!")

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {


				custpage_crf_currency
				var crf_approver = form.addField({
					id: 'custpage_crf_approver',
					type: serverWidget.FieldType.SELECT,
					label: 'Approver',
					type: 'select'
				});

				form.insertField({
					field: crf_approver,
					nextfield: 'custrecord_crf_trk_deal'
				});

				crf_approver.addSelecticOption({
					value: '7',
					text: 'Seven'
				});


			} // beforeLoad
			return {
				beforeLoad: beforeLoad,
			};
		}
	});





var taxpayerIDmethod = [];
var customrecord_acq_taxidmethodSearchObj = search.create({
	type: "customrecord_acq_taxidmethod",
	filters: [],
	columns: [
		search.createColumn({
			name: "internalid",
			label: "Internal ID"
		}),
		search.createColumn({
			name: "custrecord_irs_form",
			label: "IRS Form"
		})
	]
});
var searchResultCount = customrecord_acq_taxidmethodSearchObj.runPaged().count;
log.debug("customrecord_acq_taxidmethodSearchObj result count", searchResultCount);
customrecord_acq_taxidmethodSearchObj.run().each(function (result) {
	taxpayerIDmethod.push(
		[result.getValue({
				name: 'internalid'
			}),
			result.getText({
				name: 'custrecord_irs_form'
			})
		])
	return true;
});

///goood CODE below

/*
			var crf_account = context.form.addField({
				id: 'custpage_crf_account',
				type: serverWidget.FieldType.SELECT,
				label: 'PAY FROM ACCOUNT',
				type: 'select'
			});
			context.form.insertField({
				field: crf_account,
				nextfield: 'custrecord_crf_trk_date'
			});


			var accountIDandName = [];
			var accountSearchObj = search.create({
				type: "account",
				filters: [
					[
						["number", "is", "002305"], "OR", ["parent", "anyof", "220", "4764"]
					]
				],
				columns: [
					search.createColumn({
						name: "name",
					}),
					search.createColumn({
						name: "internalid",
					})
				]
			});
			var searchResultCount = accountSearchObj.runPaged().count;
			log.debug("accountSearchObj result count", searchResultCount);

			accountSearchObj.run().each(function (result) {
				accountIDandName.push([
					result.getValue({
						name: 'internalid'
					}),
					result.getValue({
						name: 'name'
					})
				])
				// .run().each has a limit of 4,000 results
				return true;
			});

			log.debug("ID and Account Names: ", accountIDandName);
			log.debug("account search results:", accountSearchObj);

			for (var i = 0; i < accountIDandName.length; i++) {
			}

			crf_account.addSelectOption({
				value: '7',
				text: 'SRS Account'
			});
			crf_account.addSelectOption({
				value: '8',
				text: 'SRS Sub-Account'
			});
			crf_account.isMandatory = true;

		}
		*/






var currencyList = [];
var customerSearchObj = search.create({
	type: "currency",
	filters: [],
	columns: [
		search.createColumn({
			name: "internalid",
			label: "Internal ID"
		}),
		search.createColumn({
			name: "name",
			label: "Name"
		}),
		search.createColumn({
			name: "symbol",
			label: "SYMBOL"
		})
	]
});
var searchResultCount = customerSearchObj.runPaged().count;
log.debug("customerSearchObj result count", searchResultCount);
customerSearchObj.run().each(function (result) {
	currencyList.push({
		name: result.getValue({
			'name': 'name'
		}),
		internalid: result.getValue({
			'name': 'symbol'
		})
	})
	return true;
});
log.debug('Currency List: ', currencyList);



function validateAmount(context) {
	var amount = context.currentRecord.getValue({
		fieldId: 'custrecord_ead_disbursement_amt'
	});
	if (amount < 0) {
		dialog.alert({
			title: 'Invalid Amount',
			message: 'Amount may not be negative. Click OK to continue.'
		}).then().catch();
		context.currentRecord.setValue({
			fieldId: 'custrecord_ead_disbursement_amt',
			value: ''
		});
	}
}






function a() {
	return (1, 2);
}




// READ THROUGH AN APP SETTINGS FUNK

/*
arrayClientReleaseGroup = JSON.parse(appSettings.readAppSetting("Client Fund Release Tracking", "Client Release Fund Approver Group"));
// Are you in the Group
if (arrayClientReleaseGroup.indexOf(userObj.name) == -1) {
	errorMessage += "You are not part of the Client fund Approver Group <br>"
}
*/



var func = require(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'],

function (record, search, runtime, error, format, url, serverWidget) {

	var accountsCurrency = accountsJSON();

	function accountsJSON() {
		var accountsList = [];
		var customerSearchObj = search.create({
			type: "account",
			filters: [
				["parent", "anyof", "220", "4764"]
			],
			columns: [
				search.createColumn({
					name: "internalid",
					label: "Internal ID"
				}),
				search.createColumn({
					name: "name",
					label: "Name"
				}),
				search.createColumn({
					name: "currency",
					label: "CURRENCY"
				})
			]
		});
		var searchResultCount = customerSearchObj.runPaged().count;
		log.debug("customerSearchObj result count", searchResultCount);
		customerSearchObj.run().each(function (result) {
			accountsList.push({
				name: result.getValue({
					'name': 'name'
				}),
				currency: result.getValue({
					'name': 'currency'
				}),
				internalid: result.getValue({
					'name': 'internalid'
				})
			})
			return true;
		});
		return accountsList;
	}
]
});

func();