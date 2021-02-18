/**
 * paymtInstrLight.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A lightweight library of utilities that is designed to be downloaded client-side - keep it slim, lads!
 * Some of this functionality is also used on the server-side.
 * 
 * Version    Date            Author           Remarks
 *	1.0		  				  Alana Thomas	   Initial version 
 *  		  4/24/2018       Ken Crossman     ATP-133 Payment Method determines Country
 */
define(['N/search' ,'N/runtime'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
	   ,'/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'
	   ],

	function(search ,runtime
			,paymtInstrListLibrary
			,toolsClient
			) {

		var payMeth = paymtInstrListLibrary.piEnum.payMeth;
		var piType = paymtInstrListLibrary.piEnum.piType;
		var subSts = paymtInstrListLibrary.piEnum.subSts;
		var countries = paymtInstrListLibrary.countries;

		var fieldMap = [
			[],
			// 1. ACH Fields
			['custrecord_pisb_ep_ffcname', 'custrecord_pisb_ep_ffcacctnum', 'custrecord_pisb_ep_swiftbic_in', 'custrecord_pisb_ep_swiftbic',
				'custrecord_pisb_ep_iban_in', 'custrecord_pisb_ep_iban', 'custrecord_pisb_ep_iban_sortcode', 'custrecord_pisb_ep_addlinst',
				'custrecord_pisb_ep_bankcountryname', 'custrecord_pisb_ep_bankcountry'], 
			[],
			[],
			// 4. Domestic Wire
			['custrecord_pisb_ep_bankcountryname', 'custrecord_pisb_ep_bankcountry', 'custrecord_pisb_ep_swiftbic_in', 'custrecord_pisb_ep_swiftbic',
				'custrecord_pisb_ep_iban_in', 'custrecord_pisb_ep_iban', 'custrecord_pisb_ep_iban_sortcode', 'custrecord_pisb_ep_achaccttype'
			],
			// 5. International Wire
			['custrecord_pisb_ep_achaccttype', 'custrecord_pisb_ep_abarouting_in', 'custrecord_pisb_ep_abarouting']
		];

		var fieldTypeMap = {
			check: ['custrecord_pisb_chk_payto', 'custrecord_pisb_chk_mailto', 'custrecord_pisb_chk_addr1', 'custrecord_pisb_chk_addr2',
				'custrecord_pisb_chk_addr3', 'custrecord_pisb_chk_city', 'custrecord_pisb_chk_comment', 'custrecord_pisb_chk_state',
				'custrecord_pisb_chk_zip', 'custrecord_pisb_chk_country'
			],
			intermediaryBank: ['custrecord_pisb_ep_imb_validation_msg', 'custrecord_pisb_ep_imb_abarouting_in', 'custrecord_pisb_ep_imb_abarouting',
				'custrecord_pisb_ep_imb_swiftbic_in', 'custrecord_pisb_ep_imb_swiftbic', 'custrecord_pisb_ep_imb_bankname_in', 'custrecord_pisb_ep_imb_bankname_lkup',
				'custrecord_pisb_ep_imb_use_bankname_in', 'custrecord_pisb_ep_imb_bankname', 'custrecord_pisb_ep_imb_nameonbnkacct', 'custrecord_pisb_ep_imb_bankacctnum'
			],
			ePay: ['custrecord_pisb_ep_requirements', 'custrecord_pisb_ep_validation_msg', 'custrecord_pisb_ep_abarouting_in', 'custrecord_pisb_ep_abarouting',
				'custrecord_pisb_ep_achaccttype', 'custrecord_pisb_ep_ffcname', 'custrecord_pisb_ep_ffcacctnum', 'custrecord_pisb_ep_swiftbic_in',
				'custrecord_pisb_ep_swiftbic', 'custrecord_pisb_ep_iban_in', 'custrecord_pisb_ep_iban', 'custrecord_pisb_ep_iban_sortcode', 'custrecord_pisb_ep_addlinst',
				'custrecord_pisb_ep_bankname_in', 'custrecord_pisb_ep_bankname_lkup', 'custrecord_pisb_ep_use_bankname_in', 'custrecord_pisb_ep_bankname',
				'custrecord_pisb_ep_nameonbnkacct', 'custrecord_pisb_ep_bankacctnum', 'custrecord_pisb_ep_bankaddr', 'custrecord_pisb_ep_bankcity', 'custrecord_pisb_ep_bankstate',
				'custrecord_pisb_ep_bankpostal', 'custrecord_pisb_ep_bankcountryname', 'custrecord_pisb_ep_bankcountry', 'custrecord_pisb_ep_bankcontact',
				'custrecord_pisb_ep_bankphone'
				,'custrecord_pisb_ep_abarouting_ach'
				,'custrecord_pisb_ep_ababank_ach'
				,'custrecord_pisb_ep_abastatus_ach'
				,'custrecord_pisb_ep_abarouting_wire'
				,'custrecord_pisb_ep_ababank_wire'
				,'custrecord_pisb_ep_abastatus_wire'
				,'custrecord_pisb_ep_imb_abaroutg_wire'
				,'custrecord_pisb_ep_imb_ababank_wire'
				,'custrecord_pisb_ep_imb_abastatus_wire'

			]
		};

		// Certain fields become mandatory when a user sends a PI Submission for review. The set of mandatory fields depends on which Payment Method has been selected 
		var mandatoryPayMethodFields = {
			ach: ['custrecord_pisb_ep_abarouting_in', 'custrecord_pisb_ep_achaccttype' , 'custrecord_pisb_ep_bankname_in'
				, 'custrecord_pisb_ep_nameonbnkacct', 'custrecord_pisb_ep_bankacctnum'],
			check: ['custrecord_pisb_chk_payto', 'custrecord_pisb_chk_mailto', 'custrecord_pisb_chk_addr1', 'custrecord_pisb_chk_city', 'custrecord_pisb_chk_zip', 'custrecord_pisb_chk_country'],
			domcheck: ['custrecord_pisb_chk_state'],
			intcheckconditional: ['custrecord_pisb_chk_state'],
			wire: ['custrecord_pisb_ep_nameonbnkacct', 'custrecord_pisb_ep_bankname_in', ],
			domwire: ['custrecord_pisb_ep_abarouting_in', 'custrecord_pisb_ep_bankacctnum'],
			wireconditional: ['custrecord_pisb_ep_ffcname', 'custrecord_pisb_ep_ffcacctnum'],
			intwire: ['custrecord_pisb_ep_bankcountryname'],
			intwireconditional: ['custrecord_pisb_ep_bankacctnum','custrecord_pisb_ep_swiftbic_in','custrecord_pisb_ep_iban_in']
		};

		// Certain fields are modifiable depending on which Payment Method has been selected 
		var modifiablePayMethodFields = {
			ach: ['custrecord_pisb_ep_abarouting_in', 'custrecord_pisb_ep_achaccttype' , 'custrecord_pisb_ep_bankname_in'
				, 'custrecord_pisb_ep_nameonbnkacct', 'custrecord_pisb_ep_bankacctnum',
					'custrecord_pisb_ep_bankaddr', 'custrecord_pisb_ep_bankcity', 'custrecord_pisb_ep_bankstate','custrecord_pisb_ep_bankpostal','custrecord_pisb_ep_bankcontact', 'custrecord_pisb_ep_bankphone'],
			check: ['custrecord_pisb_chk_payto', 'custrecord_pisb_chk_mailto', 'custrecord_pisb_chk_addr1', 'custrecord_pisb_chk_addr2',
					'custrecord_pisb_chk_addr3', 'custrecord_pisb_chk_city', 'custrecord_pisb_chk_zip', 'custrecord_pisb_chk_comment'],
			domcheck: ['custrecord_pisb_chk_state'],
			intcheck: ['custrecord_pisb_chk_country','custrecord_pisb_chk_state'],
			wire: [  'custrecord_pisb_ep_bankname_in', 
				'custrecord_pisb_ep_nameonbnkacct', 'custrecord_pisb_ep_bankacctnum', 'custrecord_pisb_ep_bankaddr', 'custrecord_pisb_ep_bankcity','custrecord_pisb_ep_bankstate',
					'custrecord_pisb_ep_bankpostal', 'custrecord_pisb_ep_bankcontact', 'custrecord_pisb_ep_bankphone', 'custrecord_pisb_ep_ffcname', 'custrecord_pisb_ep_ffcacctnum', 'custrecord_pisb_ep_addlinst'],
			domwire: ['custrecord_pisb_ep_abarouting_in'],
			intwire: ['custrecord_pisb_ep_bankcountryname','custrecord_pisb_ep_swiftbic_in','custrecord_pisb_ep_iban_in', 'custrecord_pisb_ep_iban_sortcode', 'custrecord_pisb_ep_imb_nameonbnkacct',
			'custrecord_pisb_ep_imb_abarouting_in'  , 'custrecord_pisb_ep_imb_bankname_in'
			, 'custrecord_pisb_ep_imb_swiftbic_in', 'custrecord_pisb_ep_imb_bankacctnum']
		};

		

		
		//===========================================================================================================================
		//===========================================================================================================================
		function alertAlex(msg) {
            var userAlexFodor = 1047697;
			if (runtime.accountId.toLowerCase() == "772390_sb3") { if (runtime.getCurrentUser().id == userAlexFodor) { alert(msg); } }
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function validateABARouting(inputRoutingNumber ,fieldName ,paymentMethod) { // ATP-1451
			var isValid = false;
			var validationObj = null;
			var sourceName    = null;
			var sourceCode    = null;
			var forgiving     = true;
			// these methods are FAILSAFE, so outside of try
			// Reuse input validationObj if valid JSON; always use textInputValue if non null/undefined; update other fields ONLY IF omitted from validation object
			var vobj = initValidationObject(validationObj, inputRoutingNumber, 'ABA Routing Number', 'abarouting', null, sourceName, sourceCode, forgiving, false);
			var routingNumber = getValInputValueString(vobj);

			try {

				routingNumber = getForgivingABANumber(routingNumber);

				var paymentMethod_ACH = 1;
				var ach_wire;
        		if (paymentMethod == paymentMethod_ACH) { ach_wire = "a"; }
        		else { ach_wire = "w"; }

				var objLookup = toolsClient.lookupABA(ach_wire ,routingNumber);
				
				isValid = objLookup.success;
				vobj.objLookup = objLookup;

				// set return values
				vobj.evaluated = true;
				if (!isValid) {
					vobj.validatedValue = "";
					vobj.displayValue = "";
					vobj.result = "fail";
					vobj.validationIssue = validateABARouting.ErrorMessages[0].msg;
					vobj.msgLookup = validateABARouting.ErrorMessages[0].msgLookup;
					//alert("vobj.validationIssue: " + vobj.validationIssue );
					vobj.validationIssueCode = "InvalidABA";
				} 
				else if (objLookup.abaStatusCodeText.toLowerCase() != "good") {
					vobj.validatedValue = "";
					vobj.displayValue = "";
					vobj.result = "fail";
					vobj.validationIssue = validateABARouting.ErrorMessages[1].msg;
					vobj.msgLookup = validateABARouting.ErrorMessages[1].msgLookup;
					//alert("vobj.validationIssue: " + vobj.validationIssue );
					vobj.validationIssueCode = "InvalidABAStatus";
				}
				else {
					vobj.validatedValue = routingNumber;
					vobj.displayValue = routingNumber;
					vobj.result = "pass";
					vobj.validationIssue = "";
					vobj.validationIssueCode = "";
				}
			} catch (e) {
				log.error("paymtInstrLight.js-->validateABARouting" ,e);
				vobj.evaluated = false;
				vobj.result = 'unable';
				vobj.testException = true;
				vobj.textExceptionMessage = e.description;
			}
			return vobj;
		}
		
		// DO NOT USE SEMI-COLONS IN THESE MESSAGES, the semi-colon is used to separate messages from each other
		validateABARouting.ErrorMessages = [{msg:"ABA Routing Number is invalid; "                    ,msgLookup:"ABA Routing Number is invalid" }
			                               ,{msg:"ABA Routing Number has an invalid ABA Status; "     ,msgLookup:"ABA Routing Number has an invalid ABA Status" }
			                               ];

		

		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getForgivingABANumber(str) {
			// remove whitespace and dashes
			// if cleansed version is less than 9 digits, prepend a single zero
			try {
				var re = /[\s-]*/gi;
				var rslt = str.replace(re, '');
				if (rslt.length == 8) {
					return '' + '0' + rslt;
				}
				return rslt;
			} catch (e) {
				return str;
			}
		}

		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function validateSwiftBIC(textInputValue, validationObj, sourceName, sourceCode, forgiving) {
			// these methods are FAILSAFE, so outside of try
			var isValid = false;
			var isWarn = false;
			var countryObj;
			var isoCountryCode;
			var bankIdentifier;
			var re = /([0-9]{1})/g;
			// Reuse input validationObj if valid JSON; always use textInputValue if non null/undefined; update other fields ONLY IF omitted from validation object
			var vobj = initValidationObject(validationObj, textInputValue, 'SWIFT/BIC Number', 'swiftbic', null, sourceName, sourceCode, forgiving, false);
			var str = getValInputValueString(vobj);

			try {

				if (vobj.forgiving) {
					// remove spaces and illegal symbols
					str = getForgivingSwiftNumber(str);
				}

				// From revised ISO 9362:2014 standards document: https://www.swift.com/standards/data-standards/bic
				var match = str.match(/^(([A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2})(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?)$/);
				if (match) {
					isValid = true;
					isoCountryCode = str.substr(4, 2);
					vobj.isoCountryCode = isoCountryCode;
					countryObj = getCountryInfoObject(isoCountryCode);
					vobj.countryInfo = countryObj;
					if (countryObj.iblen == -99) {
						isWarn = true;
						//vobj.validationIssue = "SWIFT/BIC country code " + isoCountryCode + " not found--check carefully as this may be an error.";
						vobj.validationIssue = validateSwiftBIC.ErrorMessages[1].msg.replace("{0}" ,isoCountryCode);
						vobj.msgLookup       = validateSwiftBIC.ErrorMessages[1].msgLookup;
					} else if (countryObj.iblen == -1) {
						isValid = false;
						//vobj.validationIssue = "SWIFT/BIC transfer to country " + isoCountryCode + "/" + countryObj.name + " is illegal from United States";
						vobj.validationIssue = validateSwiftBIC.ErrorMessages[2].msg.replace("{0}" ,isoCountryCode + "/" + countryObj.name);
						vobj.msgLookup       = validateSwiftBIC.ErrorMessages[2].msgLookup;
					}
					// Newer standard allows digits in first four, but it is far less common, so warn on this use case
					bankIdentifier = str.substr(0, 4);
					if (re.test(bankIdentifier)) {
						isWarn = true;
						//vobj.validationIssue = "SWIFT/BIC numeric digit in business party identifier (" + bankIdentifier + ")--though possibly valid with 2014 revised standard it is uncommon and may be an error.";
						vobj.validationIssue = validateSwiftBIC.ErrorMessages[3].msg.replace("{0}" ,bankIdentifier);
						vobj.msgLookup       = validateSwiftBIC.ErrorMessages[3].msgLookup;
					}

				} else {
					vobj.requirements = 'SWIFT/BIC pattern is 8 or 11 characters long: BBBBCCSSbbb - BBBB business party identifier (ltrs with numbers allowed), CC ISO Country Code, SS (party suffix, formerly location code), bbb branch is optional or XXX for primary office; '
					//vobj.validationIssue = '' + ((vobj.sourceName.length > 0) ? vobj.sourceName : vobj.testName) + ' invalid; pattern is BBBBCCSSbbb (8 or 11 characters long; bbb is optional)';
					var msgName = ((vobj.sourceName.length > 0) ? vobj.sourceName : vobj.testName);
					vobj.validationIssue = validateSwiftBIC.ErrorMessages[4].msg.replace("{0}" ,msgName);
					vobj.msgLookup       = validateSwiftBIC.ErrorMessages[4].msgLookup;
				}

				// set return values
				vobj.evaluated = true;
				if (!isValid) {
					vobj.validatedValue = "";
					vobj.displayValue = "";
					vobj.result = "fail";
					if (vobj.validationIssue.length == 0) {
						//vobj.validationIssue = "SWIFT/BIC is invalid";
						vobj.validationIssue = validateSwiftBIC.ErrorMessages[0].msg;
						vobj.msgLookup       = validateSwiftBIC.ErrorMessages[0].msgLookup;
					}
					vobj.validationIssueCode = "InvalidSwiftBIC";
				} else {
					vobj.validatedValue = str;
					vobj.displayValue = str;
					if (isWarn) {
						vobj.result = "warn";
					} else {
						vobj.result = "pass";
						vobj.validationIssue = "";
						vobj.validationIssueCode = "";
					}
				}
			} catch (e) {
				vobj.evaluated = false;
				vobj.result = 'unable';
				vobj.testException = true;
				vobj.textExceptionMessage = e.description;
			}
			return vobj;
		}
		
		// DO NOT USE SEMI-COLONS IN THESE MESSAGES, the semi-colon is used to separate messages from each other
		validateSwiftBIC.ErrorMessages = [{msg:"SWIFT/BIC is invalid; "                                                           ,msgLookup:"SWIFT/BIC is invalid" }
                                         ,{msg:"SWIFT/BIC country code {0} not found--check carefully as this may be an error.; " ,msgLookup:"not found--check carefully as this may be an error" }
                                         ,{msg:"SWIFT/BIC transfer to country {0} is illegal from United States; "                ,msgLookup:"SWIFT/BIC transfer to country" }
                                         ,{msg:"SWIFT/BIC numeric digit in business party identifier ({0})--though possibly valid with 2014 revised standard it is uncommon and may be an error.; " 
                                        	                                                                                      ,msgLookup:"SWIFT/BIC numeric digit in business party identifier" }
		                                 ,{msg:"{0} invalid, pattern is BBBBCCSSbbb (8 or 11 characters long, bbb is optional); " ,msgLookup:"invalid, pattern is BBBBCCSSbbb" }
			                             ];

		
//		//===========================================================================================================================
//		//===========================================================================================================================
//		function alertAlex(msg) {
//            var userAlexFodor = 1047697;
//			if (runtime.accountId.toLowerCase() == "772390_sb3") { if (runtime.getCurrentUser().id == userAlexFodor) { alert(msg); } }
//		}
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function validateIBAN(textInputValue, validationObj, sourceName, sourceCode, forgiving) {
			// these methods are FAILSAFE, so outside of try
			var isValid = false;
			var isWarn = false;
			var countryObj;
			var isoCountryCode;
			var checkDigitsResult = 0;
			var bbanValid = false;
			var tmpISOCountryCode = '';
			// Reuse input validationObj if valid JSON; always use textInputValue if non null/undefined; update other fields ONLY IF omitted from validation object
			var vobj;
			try {
				vobj = initValidationObject(validationObj, textInputValue, 'IBAN Number', 'iban', null, sourceName, sourceCode, forgiving, false);
			} catch (e) {
				// this should only fail if the initValidaitonObject method does not exist
				vobj = JSON.parse('{"sourceName":"","sourceCode":"","testName":"IBAN Number","testCode":"iban","testType":"syntactic","forgiving":true,"inputValue":"","validatedValue":"","displayValue":"","evaluated":false,"result":"pending","validationIssue":"","validationIssueCode":""}');
				vobj.inputValue = textInputValue;
				vobj.sourceName = sourceName;
				vobj.sourceCode = sourceCode;
				if (typeof(forgiving) == "boolean") {
					vobj.forgiving = forgiving;
				}
			}
			var str;
			try {
				str = getValInputValueString(vobj);
			} catch (e) {
				str = textInputValue;
			}

			try {
				if (vobj.forgiving) {
					// remove spaces and illegal symbols
					try {
						str = getForgivingIBAN(str);
					} catch (e) {
						// do nothing
					}
				}

				tmpISOCountryCode = '' + str.slice(0, 2);
				if (tmpISOCountryCode.search(/\d/g) >= 0) {
					isValid = false;
					//vobj.validationIssue = "IBAN Country Code must be alphabetic";
					vobj.validationIssue = validateIBAN.ErrorMessages[1].msg;
					vobj.msgLookup = validateIBAN.ErrorMessages[1].msgLookup;
					vobj.validationIssueCode = "InvalidIBANNumericCountryCode";
				} else {
					isValid = true;
					try {
						isoCountryCode = tmpISOCountryCode;
						countryObj = getCountryInfoObject(isoCountryCode);
						vobj.countryInfo = countryObj;
						vobj.isoCountryCode = tmpISOCountryCode;

						if (countryObj.iblen == -99) {
							isWarn = true;
							//vobj.validationIssue = "Unable to locate IBAN country code " + isoCountryCode + "; IBAN number may be invalid";
							vobj.validationIssue = validateIBAN.ErrorMessages[2].msg.replace("{0}" ,isoCountryCode);
							vobj.msgLookup = validateIBAN.ErrorMessages[2].msgLookup;
							vobj.validationIssueCode = "WarnIBANCountryNotFound";
						} else if (countryObj.iblen == -1) {
							isValid = false;
							//vobj.validationIssue = "IBAN transfer To Country " + isoCountryCode + "/" + countryObj.name + " is illegal from the United States";
							vobj.validationIssue = validateIBAN.ErrorMessages[3].msg.replace("{0}" ,isoCountryCode + "/" + countryObj.name);
							vobj.msgLookup = validateIBAN.ErrorMessages[3].msgLookup;
							vobj.validationIssueCode = "InvalidIBANIllegalCountry";
						} else if (countryObj.iblen === 0) {
							isWarn = true;
							//vobj.validationIssue = "IBAN may not be supported To Country code " + isoCountryCode + "/" + countryObj.name;
							vobj.validationIssue = validateIBAN.ErrorMessages[4].msg.replace("{0}" ,isoCountryCode + "/" + countryObj.name);
							vobj.msgLookup = validateIBAN.ErrorMessages[4].msgLookup;
							vobj.validationIssueCode = "WarnIBANUnsupportedCountry";
						} else if (countryObj.iblen > 0) {
							if (str.length != countryObj.iblen) {
								isValid = false;
								vobj.validationIssueCode = "InvalidIBANBadLength";
								//vobj.validationIssue = "Correct IBAN length for To Country " + isoCountryCode + "/" + countryObj.name + " is " + countryObj.iblen;
								vobj.validationIssue = validateIBAN.ErrorMessages[5].msg.replace("{0}" ,isoCountryCode + "/" + countryObj.name + " is " + countryObj.iblen);
								vobj.msgLookup = validateIBAN.ErrorMessages[5].msgLookup;
								if (str.length > countryObj.iblen) {
									vobj.validationIssue += " entry is too long by " + (str.length - countryObj.iblen) + " characters.";
								} else {
									vobj.validationIssue += " entry is too short by " + (countryObj.iblen - str.length) + " characters.";
								}
							} else {
								try {
									bbanValid = checkCountryBBAN(str.slice(4), countryObj.bban_re);
									if (typeof(bbanValid) == "boolean") {
										if (!bbanValid) {
											isValid = false;
											//vobj.validationIssue = ((vobj.sourceName.length > 0) ? vobj.sourceName : vobj.testName) + " does not follow required format for country code " + isoCountryCode + "/" + countryObj.name;
											var msgName = ((vobj.sourceName.length > 0) ? vobj.sourceName : vobj.testName);
											vobj.validationIssue = validateIBAN.ErrorMessages[6].msg.replace("{0}" ,msgName).replace("{1}" ,isoCountryCode + "/" + countryObj.name);
											vobj.msgLookup = validateIBAN.ErrorMessages[6].msgLookup;
											vobj.validationIssueCode = "InvalidIBANCountryBBANMismatch";
										} else {
											isValid = true;
										}
									} else {
										// presumably a null was returned from bban checker
										isWarn = true;
										//vobj.validationIssue = "Unable to check the format for country code " + isoCountryCode + "/" + countryObj.name + " is valid.";
										vobj.validationIssue = validateIBAN.ErrorMessages[7].msg.replace("{0}" ,isoCountryCode + "/" + countryObj.name);
										vobj.msgLookup = validateIBAN.ErrorMessages[7].msgLookup;
										vobj.validationIssueCode = "WarnIBANUnableCountryBBAN";
									}
								} catch (e) {
									isWarn = true;
									//vobj.validationIssue = "Unable to check the format for country code " + isoCountryCode + "/" + countryObj.name + " is valid.";
									vobj.validationIssue = validateIBAN.ErrorMessages[7].msg.replace("{0}" ,isoCountryCode + "/" + countryObj.name);
									vobj.msgLookup = validateIBAN.ErrorMessages[7].msgLookup;
									vobj.validationIssueCode = "WarnIBANUnableCountryBBAN";
								}
							}
						}
					} catch (e) {
						isWarn = true;
						//vobj.validationIssue = "Unable to verify country specific requirements for this IBAN number; please ensure you are following required format country" + isoCountryCode;
						vobj.validationIssue = validateIBAN.ErrorMessages[8].msg.replace("{0}" ,isoCountryCode );
						vobj.msgLookup = validateIBAN.ErrorMessages[8].msgLookup;
						vobj.validationIssueCode = "WarnIBANUnableCountryTest";
					}
				}

				// validate the check digits
				if (isValid) {
					try {
						checkDigitsResult = mod9710(str);
						if (checkDigitsResult !== 1) {
							isValid = false;
							//vobj.validationIssue = '' + ((vobj.sourceName.length > 0) ? vobj.sourceName : vobj.testName) + ' invalid - entered value not consistent with check digits.';
							var msgName = ((vobj.sourceName.length > 0) ? vobj.sourceName : vobj.testName);
							vobj.validationIssue = validateIBAN.ErrorMessages[9].msg.replace("{0}" ,msgName);
							vobj.msgLookup = validateIBAN.ErrorMessages[9].msgLookup;
							vobj.validationIssueCode = "InvalidIBANCheckDigits";
						}
					} catch (e) {
						vobj.evaluated = false;
						vobj.result = 'unable';
						vobj.testException = true;
						//vobj.textExceptionMessage = 'Cannot validate IBAN check digits: ' + e.description;
						vobj.textExceptionMessage = validateIBAN.ErrorMessages[10].msg + e.description;
						vobj.msgLookup = validateIBAN.ErrorMessages[10].msgLookup;
						return vobj;
					}
				}

				// set return values
				vobj.evaluated = true;
				if (!isValid) {
					vobj.validatedValue = "";
					vobj.displayValue = "";
					vobj.result = "fail";
					if (vobj.validationIssue.length == 0) {
						//vobj.validationIssue = "IBAN Number is invalid";
						vobj.validationIssue = validateIBAN.ErrorMessages[0].msg;
						vobj.msgLookup = validateIBAN.ErrorMessages[0].msgLookup;
					}
					if (vobj.validationIssueCode.length == 0) {
						vobj.validationIssueCode = "InvalidIBAN";
					}

				} else {
					vobj.validatedValue = str;

					if (isWarn) {
						vobj.result = "warn";
						vobj.displayValue = str;
					} else {
						vobj.result = "pass";
						// if everything passes perfectly, reformat for friendly IBAN display (space separated groups of four)
						vobj.displayValue = str.replace(/(.{4})(?!$)/g, "$1" + ' ');
						vobj.validationIssue = "";
						vobj.validationIssueCode = "";
					}
				}
			} catch (e) {
				vobj.evaluated = false;
				vobj.result = 'unable';
				vobj.testException = true;
				vobj.textExceptionMessage = e.description;
			}
			return vobj;
		}
		
		// DO NOT USE SEMI-COLONS IN THESE MESSAGES, the semi-colon is used to separate messages from each other
		validateIBAN.ErrorMessages = [{msg:"IBAN Number is invalid; "                                             ,msgLookup:"IBAN Number is invalid" }
		                             ,{msg:"IBAN Country Code must be alphabetic; "                               ,msgLookup:"IBAN Country Code must be alphabetic" }
		                             ,{msg:"Unable to locate IBAN country code {0}, IBAN number may be invalid; " ,msgLookup:"Unable to locate country code " }
		                             ,{msg:"IBAN transfer to country {0} is illegal from the United States; "     ,msgLookup:"IBAN transfer to country" }
		                             ,{msg:"IBAN may not be supported to country code {0}; "                      ,msgLookup:"IBAN may not be supported to country code" }
		                             ,{msg:"Correct IBAN length for To Country {0}, "                             ,msgLookup:"Correct IBAN length for To Country" }
		                             ,{msg:"{0} does not follow required format for country code {1}; "           ,msgLookup:"does not follow required format for country code" }
		                             ,{msg:"Unable to check the format for country code {0};"                     ,msgLookup:"Unable to check the format for country code" }
		                             ,{msg:"Unable to verify country specific requirements for this IBAN number; please ensure you are following required format country {0}; " 
		                            	                                                                          ,msgLookup:"ABA Routing Number has an invalid ABA Status" }
		                             ,{msg:"{0} invalid - entered value not consistent with check digits;"        ,msgLookup:"invalid - entered value not consistent with check digits" }
		                             ,{msg:"Cannot validate IBAN check digits ;"                                  ,msgLookup:"Cannot validate IBAN check digits" }
			                         ];

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function initValidationObject(validationObj, inputValue, testName, testCode, testType, sourceName, sourceCode, forgiving, overwriteObjectValues) {
			try {
				var vobj = JSON.parse("{}");
				var voType = typeof(validationObj);
				var invalidObj = false;
				var invalidMsg = "";
				var overWrite = true;

				if (typeof(overwriteObjectValues) == "boolean") {
					overWrite = overwriteObjectValues;
				}
				// (Re-)Use validationObj if it is valid
				try {
					if (!(validationObj == null || voType == "undefined")) {
						if (voType == "string") {
							vobj = JSON.parse(validationObj);
						} else if (voType == "object" && (!(Array.isArray(validationObj)))) {
							vobj = validationObj;
						}
					}
				} catch (e) {
					// do nothing
					invalidObj = true;
					//invalidMsg = e.name + '[' + e.message + ']';
					invalidMsg = e.description;
				}

				// Use input values if supplied or insert element into object if missing
				if (typeof(sourceName) == "string" && (overWrite || (!("sourceName" in vobj)))) {
					vobj.sourceName = sourceName;
				}
				if (!("sourceName" in vobj)) {
					vobj.sourceName = "";
				}
				if (typeof(sourceCode) == "string" && (overWrite || (!("sourceCode" in vobj)))) {
					vobj.sourceCode = sourceCode;
				}
				if (!("sourceCode" in vobj)) {
					vobj.sourceCode = "";
				}
				if (typeof(testName) == "string" && (overWrite || (!("testName" in vobj)))) {
					vobj.testName = testName;
				}
				if (!("testName" in vobj)) {
					vobj.testName = "";
				}
				if (typeof(testCode) == "string" && (overWrite || (!("testCode" in vobj)))) {
					vobj.testCode = testCode;
				}
				if (!("testCode" in vobj)) {
					vobj.testCode = "";
				}
				if (typeof(testType) == "string" && (overWrite || (!("testType" in vobj)))) {
					vobj.testType = testType;
				}
				if (!("testType" in vobj)) {
					vobj.testType = "syntactic";
				}
				if (typeof(forgiving) == 'boolean' && (overWrite || (!("forgiving" in vobj)))) {
					vobj.forgiving = forgiving;
				}
				if (!("forgiving" in vobj)) {
					vobj.forgiving = true;
				}

				// inputValue would usually be a string, but it might not be in complex cases of validation
				if (inputValue == null || typeof(inputValue) == "undefined") {
					// only reset / create this element if it does not already exist
					if (!("inputValue" in vobj)) {
						vobj.inputValue = "";
					}
				} else {
					// if some non null/undefined input is provided, ALWAYS update the validation object with this value
					// this might be something other than a string type in an unusual or complex validation
					vobj.inputValue = inputValue;
				}

				// reset all other standard values
				vobj.validatedValue = "";
				vobj.displayValue = "";
				vobj.evaluated = false;
				vobj.result = 'pending';
				vobj.validationIssue = "";
				vobj.validationIssueCode = "";
				vobj.testException = false;
				if ("testExceptionCode" in vobj) {
					vobj.testExceptionMessage = "";
				}

				if (invalidObj) {
					vobj.invalidValidationObject = true;
					vobj.invalidValObjMessage = invalidMsg;
				} else {
					// do not add this element to the JSON if it does not exist, but reset the value if it does exist        
					if ("invalidValidationObject" in vobj) {
						vobj.invalidValidationObject = false;
					}
					if ("invalidValObjMessage" in vobj) {
						vobj.invalidValObjMessage = "";
					}
				}

				return vobj;
			} catch (e) {
				return JSON.parse('{"sourceName":"","sourceCode":"","testName":"","testCode":"","testType":"syntactic","forgiving":true,"inputValue":"","validatedValue":"","displayValue":"","evaluated":false,"result":"na","validationIssue":"","validationIssueCode":""}');
			}
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getForgivingSwiftNumber(str) {
			// remove whitespace and swift/bic can never contain: ~ ` ! @ # $ % ^ * = \ | { } [ ] “ ; < >
			var re = /[\s-]*/gi;
			var re2 = /[^A-Z0-9]/gi;
			var rslt;
			try {
				rslt = '' + (str.replace(re, '').toUpperCase()).replace(re2, '');
				return rslt;
			} catch (e) {
				// do nothing
			}
			return str;
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function isValForgiving(validationObj) {
			try {
				if ("forgiving" in validationObj) {
					return validationObj.forgiving;
				} else {
					return true;
				}
			} catch (e) {
				return true;
			}
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getValInputValueString(validationObj) {
			try {
				if ("inputValue" in validationObj) {
					if (typeof(validationObj.inputValue) == "string") {
						return validationObj.inputValue;
					}
				}
			} catch (e) {
				// do nothing    
			}
			return "";
		}


		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getCountryInfoObject(isoTwoCharCountryCode) {
			var cob; // country object

			switch (isoTwoCharCountryCode) {
				// moving most frequently used to TOP of CASE statement based on NetSuite historical usage
				case 'US':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'United States of America'
					};
					break;
				case 'CA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Canada'
					};
					break;
				case 'GB':
					cob = {
						iblen: 22,
						bban_re: '^[A-Z]{4}[0-9]{14}$',
						name: 'United Kingdom'
					};
					break;
				case 'SE':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{20}$',
						name: 'Sweden'
					};
					break;
				case 'DE':
					cob = {
						iblen: 22,
						bban_re: '^[0-9]{18}$',
						name: 'Germany'
					};
					break;
				case 'FR':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'France'
					};
					break;
				case 'IL':
					cob = {
						iblen: 23,
						bban_re: '^[0-9]{19}$',
						name: 'Israel'
					};
					break;
				case 'AU':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Australia'
					};
					break;
				case 'TW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Taiwan, Province of China'
					};
					break;
				case 'IN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'India'
					};
					break;
				case 'JP':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Japan'
					};
					break;
				case 'SG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Singapore'
					};
					break;
				case 'CH':
					cob = {
						iblen: 21,
						bban_re: '^[0-9]{5}[A-Z0-9]{12}$',
						name: 'Switzerland'
					};
					break;
				case 'HK':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Hong Kong'
					};
					break;
				case 'ES':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{20}$',
						name: 'Spain'
					};
					break;
				case 'NL':
					cob = {
						iblen: 18,
						bban_re: '^[A-Z]{4}[0-9]{10}$',
						name: 'Netherlands'
					};
					break;
				case 'CN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'China'
					};
					break;
				case 'AT':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{16}$',
						name: 'Austria'
					};
					break;
				case 'LB':
					cob = {
						iblen: 28,
						bban_re: '^[0-9]{4}[A-Z0-9]{20}$',
						name: 'Lebanon'
					};
					break;
				case 'DK':
					cob = {
						iblen: 18,
						bban_re: '^[0-9]{14}$',
						name: 'Denmark'
					};
					break;
				case 'IE':
					cob = {
						iblen: 22,
						bban_re: '^[A-Z0-9]{4}[0-9]{14}$',
						name: 'Republic of Ireland'
					};
					break;
				case 'IT':
					cob = {
						iblen: 27,
						bban_re: '^[A-Z]{1}[0-9]{10}[A-Z0-9]{12}$',
						name: 'Italy'
					};
					break;
				case 'EE':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{16}$',
						name: 'Estonia'
					};
					break;
				case 'KR':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Korea, Republic of'
					};
					break;
				case 'KY':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Cayman Islands'
					};
					break;
				case 'AE':
					cob = {
						iblen: 23,
						bban_re: '^[0-9]{3}[0-9]{16}$',
						name: 'United Arab Emirates'
					};
					break;
				case 'MX':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Mexico'
					};
					break;
				case 'AR':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Argentina'
					};
					break;
				case 'BM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bermuda'
					};
					break;
				case 'ZA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'South Africa'
					};
					break;
					// alphabetical resumes below
				case 'AL':
					cob = {
						iblen: 28,
						bban_re: '^[0-9]{8}[A-Z0-9]{16}$',
						name: 'Albania'
					};
					break;
				case 'AD':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{8}[A-Z0-9]{12}$',
						name: 'Andorra'
					};
					break;
				case 'AZ':
					cob = {
						iblen: 28,
						bban_re: '^[A-Z]{4}[0-9]{20}$',
						name: 'Republic of Azerbaijan'
					};
					break;
				case 'BH':
					cob = {
						iblen: 22,
						bban_re: '^[A-Z]{4}[A-Z0-9]{14}$',
						name: 'Bahrain'
					};
					break;
				case 'BE':
					cob = {
						iblen: 16,
						bban_re: '^[0-9]{12}$',
						name: 'Belgium'
					};
					break;
				case 'BA':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{16}$',
						name: 'Bosnia and Herzegovina'
					};
					break;
				case 'BR':
					cob = {
						iblen: 29,
						bban_re: '^[0-9]{23}[A-Z]{1}[A-Z0-9]{1}$',
						name: 'Brazil'
					};
					break;
				case 'BG':
					cob = {
						iblen: 22,
						bban_re: '^[A-Z]{4}[0-9]{6}[A-Z0-9]{8}$',
						name: 'Bulgaria'
					};
					break;
				case 'CR':
					cob = {
						iblen: 21,
						bban_re: '^[0-9]{17}$',
						name: 'Costa Rica'
					};
					break;
				case 'HR':
					cob = {
						iblen: 21,
						bban_re: '^[0-9]{17}$',
						name: 'Croatia'
					};
					break;
				case 'CY':
					cob = {
						iblen: 28,
						bban_re: '^[0-9]{8}[A-Z0-9]{16}$',
						name: 'Cyprus'
					};
					break;
				case 'CZ':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{20}$',
						name: 'Czech Republic'
					};
					break;
				case 'FO':
					cob = {
						iblen: 18,
						bban_re: '^[0-9]{14}$',
						name: 'Faroe Islands (Denmark)'
					};
					break;
				case 'GL':
					cob = {
						iblen: 18,
						bban_re: '^[0-9]{14}$',
						name: 'Greenland (Denmark)'
					};
					break;
				case 'DO':
					cob = {
						iblen: 28,
						bban_re: '^[A-Z]{4}[0-9]{20}$',
						name: 'Dominican Republic'
					};
					break;
					// Finland
				case 'FI':
					cob = {
						iblen: 18,
						bban_re: '^[0-9]{14}$',
						name: 'Finland'
					};
					break;
				case 'AX':
					cob = {
						iblen: 18,
						bban_re: '^[0-9]{14}$',
						name: 'Aland Islands (Finland)'
					};
					break;
					// End Finland
					// France
				case 'GF':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'French Guyana (France)'
					};
					break;
				case 'GP':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Guadeloupe (France)'
					};
					break;
				case 'MQ':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Martinique (France)'
					};
					break;
				case 'RE':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Reunion (France)'
					};
					break;
				case 'PF':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'French Polynesia (France)'
					};
					break;
				case 'TF':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'French Southern Territories (France)'
					};
					break;
				case 'YT':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Mayotte (France)'
					};
					break;
				case 'NC':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'New Caledonia (France)'
					};
					break;
				case 'BL':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Saint Barthelemy (France)'
					};
					break;
				case 'MF':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Saint Martin (France)'
					};
					break;
				case 'PM':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Saint Pierre et Miquelon (France)'
					};
					break;
				case 'WF':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Wallis and Futuna Islands (France)'
					};
					break;
					// End France
				case 'GE':
					cob = {
						iblen: 22,
						bban_re: '^[A-Z0-9]{2}[0-9]{16}$',
						name: 'Georgia'
					};
					break;
				case 'GI':
					cob = {
						iblen: 23,
						bban_re: '^[A-Z]{4}[A-Z0-9]{15}$',
						name: 'Gibraltar'
					};
					break;
				case 'GR':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{7}[A-Z0-9]{16}$',
						name: 'Greece'
					};
					break;
				case 'GT':
					cob = {
						iblen: 28,
						bban_re: '^[A-Z0-9]{24}$',
						name: 'Guatemala'
					};
					break;
				case 'HU':
					cob = {
						iblen: 28,
						bban_re: '^[0-9]{24}$',
						name: 'Hungary'
					};
					break;
				case 'IS':
					cob = {
						iblen: 26,
						bban_re: '^[0-9]{22}$',
						name: 'Iceland'
					};
					break;
				case 'JO':
					cob = {
						iblen: 30,
						bban_re: '^[A-Z]{4}[0-9]{4}[A-Z0-9]{18}$',
						name: 'Jordan'
					};
					break;
				case 'KZ':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{3}[A-Z0-9]{13}$',
						name: 'Kazakhstan'
					};
					break;
				case 'XK':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{16}$',
						name: 'Kosovo'
					};
					break;
				case 'KW':
					cob = {
						iblen: 30,
						bban_re: '^[A-Z]{4}[A-Z0-9]{22}$',
						name: 'Kuwait'
					};
					break;
				case 'LV':
					cob = {
						iblen: 21,
						bban_re: '^[A-Z]{4}[A-Z0-9]{13}$',
						name: 'Latvia'
					};
					break;
				case 'LI':
					cob = {
						iblen: 21,
						bban_re: '^[0-9]{5}[A-Z0-9]{12}$',
						name: 'Liechtenstein'
					};
					break;
				case 'LT':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{16}$',
						name: 'Lithuania'
					};
					break;
				case 'LU':
					cob = {
						iblen: 20,
						bban_re: '^[0-9]{3}[A-Z0-9]{13}$',
						name: 'Luxembourg'
					};
					break;
				case 'MK':
					cob = {
						iblen: 19,
						bban_re: '^[0-9]{3}[A-Z0-9]{10}[0-9]{2}$',
						name: 'Republic of Macedonia'
					};
					break;
				case 'MT':
					cob = {
						iblen: 31,
						bban_re: '^[A-Z]{4}[0-9]{5}[A-Z0-9]{18}$',
						name: 'Malta'
					};
					break;
				case 'MR':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{23}$',
						name: 'Mauritania'
					};
					break;
				case 'MU':
					cob = {
						iblen: 30,
						bban_re: '^[A-Z]{4}[0-9]{19}[A-Z]{3}$',
						name: 'Mauritius'
					};
					break;
				case 'MD':
					cob = {
						iblen: 24,
						bban_re: '^[A-Z0-9]{2}[A-Z0-9]{18}$',
						name: 'Moldova'
					};
					break;
				case 'MC':
					cob = {
						iblen: 27,
						bban_re: '^[0-9]{10}[A-Z0-9]{11}[0-9]{2}$',
						name: 'Monaco'
					};
					break;
				case 'ME':
					cob = {
						iblen: 22,
						bban_re: '^[0-9]{18}$',
						name: 'Montenegro'
					};
					break;
				case 'NO':
					cob = {
						iblen: 15,
						bban_re: '^[0-9]{11}$',
						name: 'Norway'
					};
					break;
				case 'PK':
					cob = {
						iblen: 24,
						bban_re: '^[A-Z0-9]{4}[0-9]{16}$',
						name: 'Pakistan'
					};
					break;
				case 'PS':
					cob = {
						iblen: 29,
						bban_re: '^[A-Z0-9]{4}[0-9]{21}$',
						name: 'Palestinian territories'
					};
					break;
				case 'PL':
					cob = {
						iblen: 28,
						bban_re: '^[0-9]{24}$',
						name: 'Poland'
					};
					break;
				case 'PT':
					cob = {
						iblen: 25,
						bban_re: '^[0-9]{21}$',
						name: 'Portugal'
					};
					break;
				case 'QA':
					cob = {
						iblen: 29,
						bban_re: '^[A-Z]{4}[A-Z0-9]{21}$',
						name: 'Qatar'
					};
					break;
				case 'RO':
					cob = {
						iblen: 24,
						bban_re: '^[A-Z]{4}[A-Z0-9]{16}$',
						name: 'Romania'
					};
					break;
				case 'LC':
					cob = {
						iblen: 32,
						bban_re: '^[A-Z]{4}[A-Z0-9]{24}$',
						name: 'Saint Lucia'
					};
					break;
				case 'SM':
					cob = {
						iblen: 27,
						bban_re: '^[A-Z]{1}[0-9]{10}[A-Z0-9]{12}$',
						name: 'San Marino'
					};
					break;
				case 'ST':
					cob = {
						iblen: 25,
						bban_re: '^[0-9]{21}$',
						name: 'Sao Tome And Principe'
					};
					break;
				case 'SA':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{2}[A-Z0-9]{18}$',
						name: 'Saudi Arabia'
					};
					break;
				case 'RS':
					cob = {
						iblen: 22,
						bban_re: '^[0-9]{18}$',
						name: 'Serbia'
					};
					break;
				case 'SC':
					cob = {
						iblen: 31,
						bban_re: '^[[A-Z]{4}[]0-9]{20}[A-Z]{3}$',
						name: 'Seychelles'
					};
					break;
				case 'SK':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{20}$',
						name: 'Slovak Republic'
					};
					break;
				case 'SI':
					cob = {
						iblen: 19,
						bban_re: '^[0-9]{15}$',
						name: 'Slovenia'
					};
					break;
				case 'TL':
					cob = {
						iblen: 23,
						bban_re: '^[0-9]{19}$',
						name: 'Timor-Leste'
					};
					break;
				case 'TN':
					cob = {
						iblen: 24,
						bban_re: '^[0-9]{20}$',
						name: 'Tunisia'
					};
					break;
				case 'TR':
					cob = {
						iblen: 26,
						bban_re: '^[0-9]{5}[A-Z0-9]{17}$',
						name: 'Turkey'
					};
					break;
				case 'UA':
					cob = {
						iblen: 29,
						bban_re: '^[0-9]{6}[A-Z0-9]{19}$',
						name: 'Ukraine'
					};
					break;
				case 'VG':
					cob = {
						iblen: 24,
						bban_re: '^[A-Z0-9]{4}[0-9]{16}$',
						name: 'British Virgin Islands'
					};
					break;
				case 'AF':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Afghanistan'
					};
					break;
				case 'AG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Antigua and Barbuda'
					};
					break;
				case 'AI':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Anguilla'
					};
					break;
				case 'AM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Armenia'
					};
					break;
				case 'AO':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Angola'
					};
					break;
				case 'AQ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Antarctica'
					};
					break;
				case 'AS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'American Samoa'
					};
					break;
				case 'AW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Aruba'
					};
					break;
				case 'BB':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Barbados'
					};
					break;
				case 'BD':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bangladesh'
					};
					break;
				case 'BF':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Burkina Faso'
					};
					break;
				case 'BI':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Burundi'
					};
					break;
				case 'BJ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Benin'
					};
					break;
				case 'BN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Brunei Darussalam'
					};
					break;
				case 'BO':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bolivia, Plurinational State of'
					};
					break;
				case 'BQ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bonaire, Sint Eustatius and Saba'
					};
					break;
				case 'BS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bahamas'
					};
					break;
				case 'BT':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bhutan'
					};
					break;
				case 'BV':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Bouvet Island'
					};
					break;
				case 'BW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Botswana'
					};
					break;
				case 'BY':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Belarus'
					};
					break;
				case 'BZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Belize'
					};
					break;
				case 'CC':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Cocos (Keeling) Islands'
					};
					break;
				case 'CD':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Congo, the Democratic Republic of the'
					};
					break;
				case 'CF':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Central African Republic'
					};
					break;
				case 'CG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Congo'
					};
					break;
				case 'CI':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Côte d\'Ivoire'
					};
					break;
				case 'CK':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Cook Islands'
					};
					break;
				case 'CL':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Chile'
					};
					break;
				case 'CM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Cameroon'
					};
					break;
				case 'CO':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Colombia'
					};
					break;
				case 'CU':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Cuba'
					};
					break;
				case 'CV':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Cabo Verde'
					};
					break;
				case 'CW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Curaçao'
					};
					break;
				case 'CX':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Christmas Island'
					};
					break;
				case 'DJ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Djibouti'
					};
					break;
				case 'DM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Dominica'
					};
					break;
				case 'DZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Algeria'
					};
					break;
				case 'EC':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Ecuador'
					};
					break;
				case 'EG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Egypt'
					};
					break;
				case 'EH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Western Sahara'
					};
					break;
				case 'ER':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Eritrea'
					};
					break;
				case 'ET':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Ethiopia'
					};
					break;
				case 'FJ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Fiji'
					};
					break;
				case 'FK':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Falkland Islands (Malvinas)'
					};
					break;
				case 'FM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Micronesia, Federated States of'
					};
					break;
				case 'GA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Gabon'
					};
					break;
				case 'GD':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Grenada'
					};
					break;
				case 'GG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Guernsey'
					};
					break;
				case 'GH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Ghana'
					};
					break;
				case 'GM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Gambia'
					};
					break;
				case 'GN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Guinea'
					};
					break;
				case 'GQ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Equatorial Guinea'
					};
					break;
				case 'GS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'South Georgia and the South Sandwich Islands'
					};
					break;
				case 'GU':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Guam'
					};
					break;
				case 'GW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Guinea-Bissau'
					};
					break;
				case 'GY':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Guyana'
					};
					break;
				case 'HM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Heard Island and McDonald Islands'
					};
					break;
				case 'HN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Honduras'
					};
					break;
				case 'HT':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Haiti'
					};
					break;
				case 'ID':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Indonesia'
					};
					break;
				case 'IM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Isle of Man'
					};
					break;
				case 'IO':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'British Indian Ocean Territory'
					};
					break;
				case 'IQ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Iraq'
					};
					break;
				case 'IR':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Iran, Islamic Republic of'
					};
					break;
				case 'JE':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Jersey'
					};
					break;
				case 'JM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Jamaica'
					};
					break;
				case 'KE':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Kenya'
					};
					break;
				case 'KG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Kyrgyzstan'
					};
					break;
				case 'KH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Cambodia'
					};
					break;
				case 'KI':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Kiribati'
					};
					break;
				case 'KM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Comoros'
					};
					break;
				case 'KN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Saint Kitts and Nevis'
					};
					break;
				case 'KP':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Korea, Democratic People\'s Republic of'
					};
					break;
				case 'LA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Lao People\'s Democratic Republic'
					};
					break;
				case 'LK':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Sri Lanka'
					};
					break;
				case 'LR':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Liberia'
					};
					break;
				case 'LS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Lesotho'
					};
					break;
				case 'LY':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Libya'
					};
					break;
				case 'MA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Morocco'
					};
					break;
				case 'MG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Madagascar'
					};
					break;
				case 'MH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Marshall Islands'
					};
					break;
				case 'ML':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Mali'
					};
					break;
				case 'MM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Myanmar'
					};
					break;
				case 'MN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Mongolia'
					};
					break;
				case 'MO':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Macao'
					};
					break;
				case 'MP':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Northern Mariana Islands'
					};
					break;
				case 'MS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Montserrat'
					};
					break;
				case 'MV':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Maldives'
					};
					break;
				case 'MW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Malawi'
					};
					break;
				case 'MY':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Malaysia'
					};
					break;
				case 'MZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Mozambique'
					};
					break;
				case 'NA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Namibia'
					};
					break;
				case 'NE':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Niger'
					};
					break;
				case 'NF':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Norfolk Island'
					};
					break;
				case 'NG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Nigeria'
					};
					break;
				case 'NI':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Nicaragua'
					};
					break;
				case 'NP':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Nepal'
					};
					break;
				case 'NR':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Nauru'
					};
					break;
				case 'NU':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Niue'
					};
					break;
				case 'NZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'New Zealand'
					};
					break;
				case 'OM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Oman'
					};
					break;
				case 'PA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Panama'
					};
					break;
				case 'PE':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Peru'
					};
					break;
				case 'PG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Papua New Guinea'
					};
					break;
				case 'PH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Philippines'
					};
					break;
				case 'PN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Pitcairn'
					};
					break;
				case 'PR':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Puerto Rico'
					};
					break;
				case 'PW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Palau'
					};
					break;
				case 'PY':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Paraguay'
					};
					break;
				case 'RU':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Russian Federation'
					};
					break;
				case 'RW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Rwanda'
					};
					break;
				case 'SB':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Solomon Islands'
					};
					break;
				case 'SD':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Sudan'
					};
					break;
				case 'SH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Saint Helena, Ascension and Tristan da Cunha'
					};
					break;
				case 'SJ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Svalbard and Jan Mayen'
					};
					break;
				case 'SL':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Sierra Leone'
					};
					break;
				case 'SN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Senegal'
					};
					break;
				case 'SO':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Somalia'
					};
					break;
				case 'SR':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Suriname'
					};
					break;
				case 'SS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'South Sudan'
					};
					break;
				case 'SV':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'El Salvador'
					};
					break;
				case 'SX':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Sint Maarten (Dutch part)'
					};
					break;
				case 'SY':
					cob = {
						iblen: -1,
						bban_re: '',
						name: 'Syrian Arab Republic'
					};
					break;
				case 'SZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Swaziland'
					};
					break;
				case 'TC':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Turks and Caicos Islands'
					};
					break;
				case 'TD':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Chad'
					};
					break;
				case 'TG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Togo'
					};
					break;
				case 'TH':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Thailand'
					};
					break;
				case 'TJ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Tajikistan'
					};
					break;
				case 'TK':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Tokelau'
					};
					break;
				case 'TM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Turkmenistan'
					};
					break;
				case 'TO':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Tonga'
					};
					break;
				case 'TT':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Trinidad and Tobago'
					};
					break;
				case 'TV':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Tuvalu'
					};
					break;
				case 'TZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Tanzania, United Republic of'
					};
					break;
				case 'UG':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Uganda'
					};
					break;
				case 'UM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'United States Minor Outlying Islands'
					};
					break;
				case 'UY':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Uruguay'
					};
					break;
				case 'UZ':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Uzbekistan'
					};
					break;
				case 'VA':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Holy See'
					};
					break;
				case 'VC':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Saint Vincent and the Grenadines'
					};
					break;
				case 'VE':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Venezuela, Bolivarian Republic of'
					};
					break;
				case 'VI':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Virgin Islands, U.S.'
					};
					break;
				case 'VN':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Viet Nam'
					};
					break;
				case 'VU':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Vanuatu'
					};
					break;
				case 'WS':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Samoa'
					};
					break;
				case 'YE':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Yemen'
					};
					break;
				case 'ZM':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Zambia'
					};
					break;
				case 'ZW':
					cob = {
						iblen: 0,
						bban_re: '',
						name: 'Zimbabwe'
					};
					break;
				default:
					cob = {
						iblen: -99,
						bban_re: '',
						name: ''
					};
			}

			return cob;
		}

		// IBAN Helper methods

		//===========================================================================================================================================================
		// Check BBAN format
		// @param {string} BBAN
		// @param {string} Regexp BBAN validation regexp
		// @return {boolean} valid
		//===========================================================================================================================================================
		function checkCountryBBAN(bban, bformat) {
			var rslt;
			try {
				if (bban && bformat) {
					var reg = new RegExp(bformat, '');
					rslt = reg.test(bban);
					return rslt;
				} else {
					return null;
				}

			} catch (e) {
				return null;
			}
		}

		//===========================================================================================================================================================
		// MOD-97-10
		// @param {string}
		// @return {number}
		//===========================================================================================================================================================
		function mod9710(iban) {
			iban = iban.slice(3) + iban.slice(0, 4);
			var validationString = '';
			for (var n = 1; n < iban.length; n++) {
				var c = iban.charCodeAt(n);
				if (c >= 65) {
					validationString += (c - 55).toString();
				} else {
					validationString += iban[n];
				}
			}
			while (validationString.length > 2) {
				var part = validationString.slice(0, 6);
				validationString = '' + (parseInt(part, 10) % 97).toString() + validationString.slice(part.length);
			}
			return parseInt(validationString, 10) % 97;
		}


		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getForgivingIBAN(str) {
			var rslt;
			try {
				rslt = str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
				return rslt;
			} catch (e) {
				// do nothing
			}
			return str;
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getPaymentMethodDetails(paymentMethodID) {
			var payClass = null;
			var payRegion = null;
			var payCountry = null;
			// Determine Payment Class based on payment method
			switch (parseInt(paymentMethodID)) {
				case payMeth.ACH:
					payClass = 'ACH';
					break;
				case payMeth.DomesticCheck:
				case payMeth.InternationalCheck:
					payClass = 'CHECK';
					break;
				case payMeth.DomesticWire:
				case payMeth.InternationalWire:
					payClass = 'WIRE';
					break;
				default:
			}
			// Determine Payment region based on payment method
			switch (parseInt(paymentMethodID)) {
				case payMeth.ACH:
				case payMeth.DomesticCheck:
				case payMeth.DomesticWire:
					payRegion = 'US';
					break;
				case payMeth.InternationalCheck:
				case payMeth.InternationalWire:
					payRegion = 'INTERNATIONAL';
					break;
			}
			// Determine Country based on payment method
			switch (parseInt(paymentMethodID)) {
				case payMeth.ACH:
				case payMeth.DomesticCheck:
				case payMeth.DomesticWire:
					payCountry = countries.unitedStates;
					break;
			}
			var pmDetails = {
				payClass: payClass,
				payRegion: payRegion,
				payCountry: payCountry,
			};
			return pmDetails;
		}

		
		//===========================================================================================================================================================
		// PPE-135: Sends back the fields that should be deactivated depending on the selected Payment Method
		//===========================================================================================================================================================
		function getPaymentFieldsByMethod(paymentMethod) { // PPE-135
			var myFields = [];
			switch (parseInt(paymentMethod, 10)) {
				case payMeth.ACH:
					myFields = concatenateArrays(myFields, fieldMap[payMeth.ACH]);
					myFields = concatenateArrays(myFields, fieldTypeMap.check);
					myFields = concatenateArrays(myFields, fieldTypeMap.intermediaryBank);
					break;
				case payMeth.DomesticCheck:
				case payMeth.InternationalCheck:
					myFields = concatenateArrays(myFields, fieldTypeMap.ePay);
					myFields = concatenateArrays(myFields, fieldTypeMap.intermediaryBank);
					break;
				case payMeth.DomesticWire:
					myFields = concatenateArrays(myFields, fieldMap[payMeth.DomesticWire]);
					myFields = concatenateArrays(myFields, fieldTypeMap.intermediaryBank);
					myFields = concatenateArrays(myFields, fieldTypeMap.check);
					break;
				case payMeth.InternationalWire:
					myFields = concatenateArrays(myFields, fieldMap[payMeth.InternationalWire]);
					myFields = concatenateArrays(myFields, fieldTypeMap.check);
					break;
				default:
					myFields = concatenateArrays(myFields, fieldTypeMap.ePay);
					myFields = concatenateArrays(myFields, fieldTypeMap.intermediaryBank);
					myFields = concatenateArrays(myFields, fieldTypeMap.check);
			}
			return myFields;
		}

		
		//===========================================================================================================================================================
		// PPE-135: Returns every field related to Payment
		//===========================================================================================================================================================
		function getAllPaymentFields() {
			return fieldTypeMap;
		}

		
		//===========================================================================================================================================================
		// Utility function for concatenating arrays since I cannot get arr.concat to work
		//===========================================================================================================================================================
		function concatenateArrays(array1, array2) {
			for (var i = 0; i < array2.length; i++) {
				array1.push(array2[i]);
			}
			return array1;
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function searchIdenticalRecords(searchData) {
			// a genericized methods for searching for either Payment Instructions with the same Paymt Type information
			// or Payment Instruction Submissions with the same Paymt Type information
			var paymtInstrType = searchData.paymtInstrType;
			var piDeal = searchData.deal;
			var piExchange = searchData.exchangeRecord;
			var shareholderField, paymtInstrTypeField, dealField, exRecField;

			if (searchData.searchType == 'customrecord_paymt_instr') {
				shareholderField = 'custrecord_pi_shareholder';
				paymtInstrTypeField = 'custrecord_pi_paymt_instr_type';
				dealField = 'custrecord_pi_deal';
				exRecField = 'custrecord_pi_exchange';
			} else { // searchType == 'customrecord_paymt_instr_submission'
				shareholderField = 'custrecord_pisb_shareholder';
				paymtInstrTypeField = 'custrecord_pisb_paymt_instr_type';
				dealField = 'custrecord_pisb_deal';
				exRecField = 'custrecord_pisb_exchange';
			}

			var searchFilters = [];
			if (searchData.customFilters) {
				for (var i = 0; i < searchData.customFilters.length; i++) {
					searchFilters.push(searchData.customFilters[i]);
				}
			}
			searchFilters.push({
				name: shareholderField,
				operator: search.Operator.IS,
				values: searchData.shareholder
			});
			searchFilters.push({
				name: paymtInstrTypeField,
				operator: search.Operator.IS,
				values: paymtInstrType
			});
			searchFilters.push({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			});
			if ((paymtInstrType == piType.AcquiomDeal || paymtInstrType == piType.SRSDeal) && piDeal) { // Acq Deal or SRS Deal
				searchFilters.push({
					name: dealField,
					operator: search.Operator.IS,
					values: piDeal
				});
			} else if (paymtInstrType == piType.ExchangeRecord && piExchange) { // Exchange Record
				searchFilters.push({
					name: exRecField,
					operator: search.Operator.IS,
					values: piExchange
				});
			}

			//CREATE THE SEARCH
			var searchPayInstr = search.create({
				type: searchData.searchType,
				columns: 'internalid',
				filters: searchFilters
			}).run();

			//RUN THE SEARCH
			var searchPayInstrResult = searchPayInstr.getRange({
				start: 0,
				end: 1000
			});
			return searchPayInstrResult;
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function searchIdenticalPaymtInstrSubmissions(searchData) {
			searchData['searchType'] = 'customrecord_paymt_instr_submission';
			searchData['customFilters'] = [{
				name: 'custrecord_pisb_submission_status',
				operator: search.Operator.NONEOF,
				values: [subSts.Canceled, subSts.Promoted]
			}];
			return searchIdenticalRecords(searchData);
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function searchIdenticalPaymentInstructions(searchData) {
			searchData['searchType'] = 'customrecord_paymt_instr';
			return searchIdenticalRecords(searchData);
		}

		
		//===========================================================================================================================================================
		// PPE-257: Sends back the fields that should be mandatory depending on the selected Payment Method
		//===========================================================================================================================================================
		function getMandatoryPaymentFieldsByMethod(paymentMethod, chkCountry, wireFFCName, wireFFCAccountNumber, bankAccountNbr, /*ibanNbr, swiftbicNbr, */ ibanNbrEntry, swiftbicNbrEntry) {
			var mandatoryFields = ['custrecord_pisb_paymethod'];
			switch (parseInt(paymentMethod, 10)) {
				case payMeth.ACH:
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.ach);
					break;
				case payMeth.DomesticCheck:
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.check);
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.domcheck);
					break;
				case payMeth.InternationalCheck:
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.check);
					break;
				case payMeth.DomesticWire:
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.wire);
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.domwire);
					break;
				case payMeth.InternationalWire:
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.wire);
					mandatoryFields = concatenateArrays(mandatoryFields, mandatoryPayMethodFields.intwire);
					break;
				default:
			}
			// Add conditionally mandatory fields by Pay Method
			switch (parseInt(paymentMethod, 10)) {
				case payMeth.ACH:
					break;
				case payMeth.DomesticCheck:
					break;
				case payMeth.InternationalCheck:
					if (chkCountry === countries.mexico || chkCountry === countries.canada) { //State is mandatory only for Canada and Mexico
						mandatoryFields.push('custrecord_pisb_chk_state');
					}
					break;
				case payMeth.DomesticWire:
					if (wireFFCName) {
						mandatoryFields.push('custrecord_pisb_ep_ffcacctnum');
					}
					if (wireFFCAccountNumber) {
						mandatoryFields.push('custrecord_pisb_ep_ffcname');
					}
					break;
				case payMeth.InternationalWire:
					// If FFC Name entered then FFC Account Number is mandatory and vice versa
					if (wireFFCName) {
						mandatoryFields.push('custrecord_pisb_ep_ffcacctnum');
					}
					if (wireFFCAccountNumber) {
						mandatoryFields.push('custrecord_pisb_ep_ffcname');
					}
					//if (!ibanNbr) { //Optional. When blank the other 2 fields are required.
					if (!ibanNbrEntry) { //Optional. When blank the other 2 fields are required.
						mandatoryFields.push('custrecord_pisb_ep_bankacctnum');
						mandatoryFields.push('custrecord_pisb_ep_swiftbic_in');
					}
					if (bankAccountNbr) { //Optional. When blank, IBAN is required. When not, at least one of the other 2 fields becomes mandatory. 
						//if (!ibanNbr) {
						if (!ibanNbrEntry) {
							if (mandatoryFields.indexOf("custrecord_pisb_ep_swiftbic_in") === -1)
								mandatoryFields.push('custrecord_pisb_ep_swiftbic_in');
						}
						//if (!swiftbicNbr) {
						if (!swiftbicNbrEntry) {
							if (mandatoryFields.indexOf("custrecord_pisb_ep_iban_in") === -1)
								mandatoryFields.push('custrecord_pisb_ep_iban_in');
						}
					} else {
						if (mandatoryFields.indexOf("custrecord_pisb_ep_iban_in") === -1)
							mandatoryFields.push('custrecord_pisb_ep_iban_in');
					}
					//if (swiftbicNbr) { //Optional. When blank, IBAN is mandatory. When not, at least one of the other 2 fields becomes mandatory. 
					if (swiftbicNbrEntry) { //Optional. When blank, IBAN is mandatory. When not, at least one of the other 2 fields becomes mandatory. 
						//if (!ibanNbr) {
						if (!ibanNbrEntry) {
							if (mandatoryFields.indexOf("custrecord_pisb_ep_bankacctnum") === -1)
								mandatoryFields.push('custrecord_pisb_ep_bankacctnum');
						}
						if (!bankAccountNbr) {
							if (mandatoryFields.indexOf("custrecord_pisb_ep_iban_in") === -1)
								mandatoryFields.push('custrecord_pisb_ep_iban_in');
						}
					} else {
						if (mandatoryFields.indexOf("custrecord_pisb_ep_iban_in") === -1)
							mandatoryFields.push('custrecord_pisb_ep_iban_in');
					}
					break;
				default:
			}
			return mandatoryFields;
		}

		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function getModifiablePaymentFieldsByMethod(paymentMethodID) {
			var modifiableFields = ['custrecord_pisb_paymethod'];
			switch (parseInt(paymentMethodID, 10)) {
				case payMeth.ACH:
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.ach);
					break;
				case payMeth.DomesticCheck:
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.check);
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.domcheck);
					break;
				case payMeth.InternationalCheck:
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.check);
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.intcheck);
					break;
				case payMeth.DomesticWire:
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.wire);
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.domwire);
					break;
				case payMeth.InternationalWire:
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.wire);
					modifiableFields = concatenateArrays(modifiableFields, modifiablePayMethodFields.intwire);
					break;
				default:
			}
			return modifiableFields;
		}

		return {
			validateABARouting: validateABARouting,
			validateSwiftBIC: validateSwiftBIC,
			validateIBAN: validateIBAN,
			getPaymentMethodDetails: getPaymentMethodDetails,
			getPaymentFieldsByMethod: getPaymentFieldsByMethod,
			getAllPaymentFields: getAllPaymentFields,
			searchIdenticalPaymentInstructions: searchIdenticalPaymentInstructions,
			getMandatoryPaymentFieldsByMethod: getMandatoryPaymentFieldsByMethod,
			searchIdenticalPaymtInstrSubmissions: searchIdenticalPaymtInstrSubmissions,
			getModifiablePaymentFieldsByMethod: getModifiablePaymentFieldsByMethod
		};
	});