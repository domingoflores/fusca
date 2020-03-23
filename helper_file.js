
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