/**
 * TINCheckLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * 
 * Version    Date            Author           Remarks
 *  		  8/28/2018       Alex Fodor       ATP-289 TIN Check
 */
define(['N/search', 'N/runtime', 'N/record', 'N/log', 'N/https', 'N/url', 'N/crypto', 'N/encode', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_QM_Engine', '/SuiteScripts/Pristine/libraries/toolsLibrary.js'],


	function (search, runtime, record, log, https, url, crypto, encode, appSettings, qmEngine, toolslib) {


		var scriptName = "TINCheckLibrary.js";
		var newDelay = 0;
		var arrStatus = ["1", "2", "3", "4"];
		var objAppSettings;

		var objNotificationStatus = {
			NotApplicable: 1,
			Pending: 2,
			Notifying: 3,
			Notified: 4,
			Canceled: 5
		};
		var objRequestStatus = {
			Invoking: 1,
			Deferred: 2,
			Requested: 3,
			Scheduled: 4,
			Pending: 5,
			Processed: 6,
			Canceled: 7,
			Duplicate: 8,
			ServiceInactive: 9,
			PendingDuplicate: 10
		};


		// This mapping controls which fields on the TIN Check record will be updated by each property with the TIN Check request
		var requestToRecordMapping = [{
			"requestProperty": "ssnEin",
			"recordField": "custrecord_tinchk_ssnein"
		}, {
			"requestProperty": "irsName",
			"recordField": "custrecord_tinchk_irs_nm"
		}, {
			"requestProperty": "irsFirstName",
			"recordField": "custrecord_tinchk_irs_frst_nm"
		}, {
			"requestProperty": "giin",
			"recordField": "custrecord_tinchk_giin"
		}, {
			"requestProperty": "addr1",
			"recordField": "custrecord_tinchk_addr1"
		}, {
			"requestProperty": "addr2",
			"recordField": "custrecord_tinchk_addr2"
		}, {
			"requestProperty": "city",
			"recordField": "custrecord_tinchk_city"
		}, {
			"requestProperty": "stateName",
			"recordField": "custrecord_tinchk_st_txt"
		}, {
			"requestProperty": "postalCode",
			"recordField": "custrecord_tinchk_zip"
		}, {
			"requestProperty": "countryName",
			"recordField": "",
			"ignore": true
		}]


		//===============================================================================================================================	
		//===============================================================================================================================	
		function requestTinCheck() {
			this.sourceSystem = null;
			this.sourceId = null;
			this.requestStatus = null;
			this.ssnEin = null;
			this.irsName = null;
			this.irsFirstName = null;
			this.giin = null;
			this.addr1 = null;
			this.addr2 = null;
			this.city = null;
			this.stateName = null;
			this.postalCode = null;
			this.countryName = null;
			this.targetSystem = null;
			this.targetId = null;
		};
		requestTinCheck.prototype.getValue = function (propertyName) {
			return this[propertyName];
		};


		//===============================================================================================================================
		// When a TIN Check request is being created from an exchange record this function should be used
		//===============================================================================================================================	
		//ATP-980 fix
		function buildRequestFromExchangeRecord(context) {
			var objTINCheckRequest = new requestTinCheck();

			log.debug(scriptName, "internalId: " + context.newRecord.id);


			objTINCheckRequest.sourceSystem = "ExchangeRecord";
			objTINCheckRequest.sourceId = context.newRecord.id.toString();
			objTINCheckRequest.requestStatus = 3;
			objTINCheckRequest.targetSystem = "ExchangeRecord";
			objTINCheckRequest.targetId = context.newRecord.id.toString();

			objTINCheckRequest.ssnEin = toolslib.getFieldValue(context, "custrecord_acq_loth_2_de1_ssnein") + "";
			objTINCheckRequest.irsName = toolslib.getFieldValue(context, "custrecord_acq_loth_2_de1_irsname") + "";
			objTINCheckRequest.irsFirstName = "";
			objTINCheckRequest.giin = toolslib.getFieldValue(context, "custrecord_exrec_giin") + "";
			objTINCheckRequest.addr1 = toolslib.getFieldValue(context, "custrecord_acq_loth_1_de1_shrhldaddr1") + "";
			objTINCheckRequest.addr2 = toolslib.getFieldValue(context, "custrecord_acq_loth_1_de1_shrhldaddr2") + "";
			objTINCheckRequest.city = toolslib.getFieldValue(context, "custrecord_acq_loth_1_de1_shrhldcity") + "";
			objTINCheckRequest.postalCode = toolslib.getFieldValue(context, "custrecord_acq_loth_1_de1_shrhldpostalcd") + "";
			objTINCheckRequest.countryName = toolslib.getFieldValue(context, "custrecord_acq_loth_1_de1_shrhldcountry") + "";

			log.debug(scriptName, "bef state: ");
			try {
				if (context.type != context.UserEventType.XEDIT) {
					objTINCheckRequest.stateName = context.newRecord.getText("custrecord_acq_loth_1_de1_shrhldstate") + "";
				} else {
					objTINCheckRequest.stateName = context.oldRecord.getText("custrecord_acq_loth_1_de1_shrhldstate") + "";
				}
			} catch (e) {
				log.debug(scriptName, "inside catch: ");
				objTINCheckRequest.stateName = "";
				var stateId = toolslib.getFieldValue(context, "custrecord_acq_loth_1_de1_shrhldstate");
				log.debug(scriptName, "stateId: " + stateId);
				if (stateId > "") {
					var objLookupFields = search.lookupFields({
						type: "customrecord_states",
						id: stateId,
						columns: ["name"]
					});
					objTINCheckRequest.stateName = objLookupFields.name + "";
					log.debug(scriptName, "objTINCheckRequest.stateName: " + objTINCheckRequest.stateName);
				}
			}

			return objTINCheckRequest;
		}
		//end ATP-980
		/* original function
		function buildRequestFromExchangeRecord(rcdExchangeRecord) {
			var objTINCheckRequest = new requestTinCheck();
	
			log.debug(scriptName, "internalId: " + rcdExchangeRecord.id);
			
			
			objTINCheckRequest.sourceSystem  = "ExchangeRecord";
			objTINCheckRequest.sourceId      = rcdExchangeRecord.id.toString();
			objTINCheckRequest.requestStatus = 3;
			objTINCheckRequest.targetSystem  = "ExchangeRecord";
			objTINCheckRequest.targetId      = rcdExchangeRecord.id.toString();
			
			objTINCheckRequest.ssnEin        = rcdExchangeRecord.getValue("custrecord_acq_loth_2_de1_ssnein") + "";
			objTINCheckRequest.irsName       = rcdExchangeRecord.getValue("custrecord_acq_loth_2_de1_irsname") + "";
			objTINCheckRequest.irsFirstName  = "";
			objTINCheckRequest.giin          = rcdExchangeRecord.getValue("custrecord_exrec_giin") + "";
			objTINCheckRequest.addr1         = rcdExchangeRecord.getValue("custrecord_acq_loth_1_de1_shrhldaddr1") + "";
			objTINCheckRequest.addr2         = rcdExchangeRecord.getValue("custrecord_acq_loth_1_de1_shrhldaddr2") + "";
			objTINCheckRequest.city          = rcdExchangeRecord.getValue("custrecord_acq_loth_1_de1_shrhldcity") + "";
			objTINCheckRequest.postalCode    = rcdExchangeRecord.getValue("custrecord_acq_loth_1_de1_shrhldpostalcd") + "";
			objTINCheckRequest.countryName   = rcdExchangeRecord.getValue("custrecord_acq_loth_1_de1_shrhldcountry") + "";
			
		  log.debug(scriptName, "bef state: " );
			try { objTINCheckRequest.stateName = rcdExchangeRecord.getText("custrecord_acq_loth_1_de1_shrhldstate") + ""; }
			catch(e) {
			  log.debug(scriptName, "inside catch: " );
				objTINCheckRequest.stateName = "";
				var stateId = rcdExchangeRecord.getValue("custrecord_acq_loth_1_de1_shrhldstate");
			  log.debug(scriptName, "stateId: " + stateId );
				if (stateId > "") {
					var objLookupFields = search.lookupFields({type:"customrecord_states" ,id:stateId ,columns:["name" ]});
					objTINCheckRequest.stateName = objLookupFields.name + "";
			  log.debug(scriptName, "objTINCheckRequest.stateName: " + objTINCheckRequest.stateName );
				} 
			}
			
			return objTINCheckRequest;
		}
		*/


		//===============================================================================================================================
		// This function is used to submit (create) a TIN check record, it contains a search to insure that the TIN Check record that
		// would be created does not already exist. The search identifies a duplicate based on the request hash value
		//===============================================================================================================================	
		function submitTINCheckRequest(objTINCheckRequest) {
			var funcName = scriptName + "--->" + "submitTINCheckRequest";
			var objReturn = {
				"result": "invalidRequest",
				"internalId": null,
				"message": ""
			};

			log.debug(scriptName, "objTINCheckRequest: " + JSON.stringify(objTINCheckRequest));

			log.debug(scriptName, "getvalue: " + objTINCheckRequest.getValue("sourceId"));

			var validationResult = validateRequestTinCheck(objTINCheckRequest);
			if (!validationResult.success) {
				objReturn.message = validationResult.message;
				return objReturn;
			}

			// ATP-744  following lines commented out
			//    	var arrColumns        = new Array();
			//    	var col_id            = search.createColumn({ name:'id'  });
			//    	var col_RequestStatus = search.createColumn({ name:'custrecord_tinchk_req_sts'  });
			//    	var col_ReservedUntil = search.createColumn({ name:'custrecord_tinchk_reserved_until_ts'  });
			//    	arrColumns.push(col_id);
			//    	arrColumns.push(col_RequestStatus);
			//    	arrColumns.push(col_ReservedUntil);
			//    	
			//    	var arrFilters = [        ['isinactive' ,'IS' ,false]
			//    	                  ,'AND' ,['custrecord_tinchk_req_hash' ,'IS' ,objTINCheckRequest.requestHash ]
			//                         ];
			//
			//    	
			//		var objTinCheckSearch = search.create({    'type':'customrecord_tin_check'
			//		                                          ,'filters':arrFilters 
			//                                                  ,'columns':arrColumns 	       });
			//
			//		var TinCheckSearch = objTinCheckSearch.run();
			//        var TinCheckSearchResults = TinCheckSearch.getRange(0,1000); 
			//        
			//        
			//    	log.debug(scriptName, "TinCheckSearchResults.length: " +  TinCheckSearchResults.length);
			//    	
			//    	// If results not empty exit
			//    	if (TinCheckSearchResults.length > 0) { 
			//    		log.debug(funcName, "TinCheckSearchResults.length == 0  Exiting"); 
			//    		objReturn.result = "requestExists";
			//    		objReturn.internalId = TinCheckSearchResults[0].getValue("internalid");
			//    		return objReturn; 
			//    	}
			// END ATP-744


			try {
				var rcdTinCheck = record.create({
					type: 'customrecord_tin_check',
					isDynamic: true
				});

				for (var ix = 0; ix < requestToRecordMapping.length; ix++) {
					var objRequestToRecordMapping = requestToRecordMapping[ix];
					if (!(objRequestToRecordMapping.ignore)) {
						var value = objTINCheckRequest.getValue(objRequestToRecordMapping.requestProperty);
						rcdTinCheck.setValue(objRequestToRecordMapping.recordField, value);
					}
				}

				rcdTinCheck.setValue("custrecord_tinchk_src_sys", objTINCheckRequest.sourceSystem);
				rcdTinCheck.setValue("custrecord_tinchk_src_id", objTINCheckRequest.sourceId);
				rcdTinCheck.setValue("custrecord_tinchk_req_sts", objTINCheckRequest.requestStatus);
				rcdTinCheck.setValue("custrecord_tinchk_req_hash", objTINCheckRequest.requestHash);
				rcdTinCheck.setValue("custrecord_tinchk_trg_sys", objTINCheckRequest.targetSystem);
				rcdTinCheck.setValue("custrecord_tinchk_trg_id", objTINCheckRequest.targetId);

				var tinCheckId = rcdTinCheck.save();

				objReturn.internalId = tinCheckId;
				objReturn.result = "success";
			} catch (e) {
				objReturn.result = "error";
				objReturn.message = e.message;
			}




			return objReturn;
		}



		//===============================================================================================================================	
		//===============================================================================================================================	
		function validateRequestTinCheck(requestTinCheck) {
			var validationResult = {
				"success": true,
				"message": ""
			};
			var semicolon = "";


			var val_ssnEin = requestTinCheck.ssnEin.toString().trim();
			var val_irsName = requestTinCheck.irsName.toString().trim();
			if (val_ssnEin.length > 0) {
				if (val_irsName.length == 0) {
					validationResult.message += semicolon + "CheckingTINWithoutName";
					validationResult.success = false;
					semicolon = ";";
				}
			}

			//		var val_addr1       = requestTinCheck.addr1.toString().trim();
			//		var val_addr2       = requestTinCheck.addr2.toString().trim();
			//		var val_city        = requestTinCheck.city.toString().trim();
			//		var val_stateName   = requestTinCheck.stateName.toString().trim();
			//		var val_postalCode  = requestTinCheck.postalCode.toString().trim();
			//		var combinedAddress = val_addr1 + val_addr2 + val_city + val_stateName + val_postalCode;
			//		log.debug("validateRequestTinCheck" ,"combinedAddress: " + combinedAddress );
			//		var val_countryName = requestTinCheck.countryName.toString().toUpperCase().trim();
			//		if (val_countryName == "UNITED STATES" ) {
			//			if (combinedAddress.length > 0) {
			//				if ((val_addr1.length == 0) || (val_city.length == 0)) {
			//					validationResult.message += semicolon + "PartialAddress";
			//					validationResult.success = false;
			//					semicolon = ";";
			//				}
			//			}
			//		}
			//		else {
			//			if ((combinedAddress.length > 0) && (val_countryName.length == 0)) {
			//				validationResult.message += semicolon + "AddressCountryMissing";
			//				validationResult.success = false;
			//				semicolon = ";";
			//			} 
			//		}

			var val_giin = requestTinCheck.giin.toString().trim();
			var combinedRequest = val_ssnEin + val_irsName + val_giin;
			log.debug("validateRequestTinCheck", "combinedRequest: " + combinedRequest);
			if (combinedRequest.length == 0) {
				validationResult.message += semicolon + "EmptyRequest";
				validationResult.success = false;
				semicolon = ";";
			}

			log.debug("validateRequestTinCheck", "validationResult: " + JSON.stringify(validationResult));
			return validationResult;
		}


		//===============================================================================================================================	
		//===============================================================================================================================	
		function digitsOnly(str) {
			return str.replace(/\D/g, "");
		}



		//===============================================================================================================================	
		//===============================================================================================================================	
		function canonicalizeText(str) {

			if (typeof str === "undefined" || str === null || str === "undefined") {
				return "";
			}
			var returnString = str.toUpperCase().replace(/,/g, "").replace(/\./g, "").replace(/\|/g, "").replace(/  +/g, " ").trim();
			log.debug("canonicalizeText", "returnString: " + returnString);
			return returnString;

		}


		//===============================================================================================================================	
		//===============================================================================================================================	
		function formatGIIN(str) {

			if (typeof str === "undefined" || str === null || str === "undefined") {
				return "";
			}
			var temp = str.replace(/\D/g, "").trim();
			result = temp.substring(0, 6) + "." + temp.substring(6, 11) + "." + temp.substring(11, 13) + "." + temp.substring(13);
			return result;

		}


		var objStateCodes = {
			"ALABAMA": "AL",
			"ALASKA": "AK",
			"ARIZONA": "AZ",
			"ARKANSAS": "AR",
			"CALIFORNIA": "CA",
			"COLORADO": "CO",
			"CONNECTICUT": "CT",
			"DELAWARE": "DE",
			"DISTRICT OF COLUMBIA": "DC",
			"FLORIDA": "FL",
			"GEORGIA": "GA",
			"HAWAII": "HI",
			"IDAHO": "ID",
			"ILLINOIS": "IL",
			"INDIANA": "IN",
			"IOWA": "IA",
			"KANSAS": "KS",
			"KENTUCKY": "KY",
			"LOUISIANA": "LA",
			"MAINE": "ME",
			"MARYLAND": "MD",
			"MASSACHUSETTS": "MA",
			"MICHIGAN": "MI",
			"MINNESOTA": "MN",
			"MISSISSIPPI": "MS",
			"MISSOURI": "MO",
			"MONTANA": "MT",
			"NEBRASKA": "NE",
			"NEVADA": "NV",
			"NEW HAMPSHIRE": "NH",
			"NEW JERSEY": "NJ",
			"NEW MEXICO": "NM",
			"NEW YORK": "NY",
			"NORTH CAROLINA": "NC",
			"NORTH DAKOTA": "ND",
			"OHIO": "OH",
			"OKLAHOMA": "OK",
			"OREGON": "OR",
			"PENNSYLVANIA": "PA",
			"RHODE ISLAND": "RI",
			"SOUTH CAROLINA": "SC",
			"SOUTH DAKOTA": "SD",
			"TENNESSEE": "TN",
			"TEXAS": "TX",
			"UTAH": "UT",
			"VERMONT": "VT",
			"VIRGINIA": "VA",
			"WASHINGTON": "WA",
			"WEST VIRGINIA": "WV",
			"WISCONSIN": "WI",
			"WYOMING": "WY",
			"AMERICAN SAMOA": "AS",
			"GUAM": "GU",
			"NORTHERN MARIANA ISLANDS": "MP",
			"PUERTO RICO": "PR",
			"US VIRGIN ISLANDS": "VI",
			"US MINOR OUTLYING ISLANDS": "UM"
		};
		//===============================================================================================================================	
		//===============================================================================================================================	
		function getStateCode(str) {

			var strU = str.toUpperCase();
			if (objStateCodes[strU]) {
				return objStateCodes[strU];
			}
			return str;
		}


		//===============================================================================================================================	
		// This function accepts either a TIN Check request or a TIN Check record as input and generates a hash value
		//===============================================================================================================================	
		function getRequestHash(requestTinCheck, rcdTinCheck) {

			var hashInputString = "";

			var hash_ssnEin;
			var hash_irsName;
			var hash_irsFirstName;
			var hash_giin;
			var hash_addr1;
			var hash_addr2;
			var hash_city;
			var hash_state;
			var hash_postalCode;



			if (requestTinCheck) {
				hash_ssnEin = digitsOnly(requestTinCheck.ssnEin);
				hash_irsName = canonicalizeText(requestTinCheck.irsName);
				hash_irsFirstName = canonicalizeText(requestTinCheck.irsFirstName);
				hash_giin = formatGIIN(requestTinCheck.giin);
				hash_addr1 = requestTinCheck.addr1;
				hash_addr2 = requestTinCheck.addr2;
				hash_city = canonicalizeText(requestTinCheck.city);
				hash_state = canonicalizeText(requestTinCheck.stateName);
				hash_postalCode = digitsOnly(requestTinCheck.postalCode);
			} else {
				hash_ssnEin = digitsOnly(rcdTinCheck.getValue("custrecord_tinchk_ssnein") + "");
				hash_irsName = canonicalizeText(rcdTinCheck.getValue("custrecord_tinchk_irs_nm") + "");
				hash_irsFirstName = canonicalizeText(rcdTinCheck.getValue("custrecord_acq_loth_7_zzz_firatname") + "");
				hash_giin = formatGIIN(rcdTinCheck.getValue("custrecord_exrec_giin") + "");
				hash_addr1 = rcdTinCheck.getValue("custrecord_tinchk_addr1") + "";
				hash_addr2 = rcdTinCheck.getValue("custrecord_tinchk_addr2") + "";
				hash_city = canonicalizeText(rcdTinCheck.getValue("custrecord_tinchk_city") + "");
				hash_state = canonicalizeText(rcdTinCheck.getValue("custrecord_tinchk_st_txt") + "");
				hash_postalCode = digitsOnly(rcdTinCheck.getValue("custrecord_tinchk_zip") + "");

			}

			hash_addr1 = hash_addr1.toString().replace(/\bp o box\b/gi, "PO BOX");
			hash_addr2 = hash_addr2.toString().replace(/\bp o box\b/gi, "PO BOX");

			if (hash_state.length > 2) {
				hash_state = getStateCode(hash_state);
			}

			hashInputString = hash_ssnEin +
				"|" + hash_irsName +
				"|" + hash_irsFirstName +
				"|" + hash_giin +
				"|" + hash_addr1 +
				"|" + hash_addr2 +
				"|" + hash_city +
				"|" + hash_state +
				"|" + hash_postalCode;

			var objHash = crypto.createHash({
				algorithm: crypto.HashAlg.MD5
			});
			objHash.update(hashInputString);
			var hash = objHash.digest({
				outputEncoding: encode.Encoding.HEX
			});

			return hash;
		}

		//===============================================================================================================================	
		// 
		//===============================================================================================================================	
		function notifyTargetAddToQueue(rcdTinCheck) {
			var funcName = scriptName + "--->" + "notifyTargetAddToQueue";

			var QManagerParm = {
				"idTinCheck": rcdTinCheck.id,
				"targetSystem": rcdTinCheck.getText("custrecord_tinchk_trg_sys"),
				"targetId": rcdTinCheck.getText("custrecord_tinchk_trg_id")
			};

			try {
				var intQid = qmEngine.addQueueEntry("TINCheckNotifyTarget", QManagerParm, null, true, 'customscript_tinchk_notify_target_qm');

				record.submitFields({
					type: 'customrecord_tin_check',
					id: rcdTinCheck.id,
					values: {
						'custrecord_tinchk_notif_sts': objNotificationStatus.Pending
					}
				});
			} catch (e) {
				log.error(funcName, "Exception when inserting TIN Check rcd into Target Notify Queue - id: " + rcdTinCheck.id + ",   message: " + e.message);
			}

		}


		//===============================================================================================================================	
		// This function is called the TinCheck record has a Target System and Target Id so that the data from the Tin Check record 
		// can be propagated to the Target System
		//===============================================================================================================================	
		function notifyTarget(tinCheckId, targetSystem, targetId) {

			var funcName = scriptName + "--->" + "notifyTarget";

//			log.debug(funcName, "tinCheckId:" + tinCheckId + ",    targetSystem:" + targetSystem + ",    targetId:" + targetId);
			objAppSettings = appSettings.createAppSettingsObject("TIN Check");

			var rcdTinCheck = record.load({ type: 'customrecord_tin_check' , id: tinCheckId });

			switch (targetSystem.toString().toLowerCase()) {
				case "exchangerecord":
					notifyTargetExchangeRecord(tinCheckId, targetSystem, targetId, rcdTinCheck);
					break;

				default:
					log.error(funcName, "TIN Check notifyTarget function does NOT support this Target System: " + targetSystem + ",     tinCheckId:" + tinCheckId + ",     targetId:" + targetId);
					break;

			} //switch( targetSystem.toString().toLowerCase() )		

			rcdTinCheck.setValue("custrecord_tinchk_notif_sts", objNotificationStatus.Notified);
//			log.debug("ATP-1608" ,"bef rcdTinCheck.save()");
			rcdTinCheck.save();
//			log.debug("ATP-1608" ,"bef rcdTinCheck.save()");
        }


		var notifyDebug;
		//===============================================================================================================================
		// The function is called by notifyTarget when the system is ExchangeRecord
		//===============================================================================================================================	
		function notifyTargetExchangeRecord(tinCheckId, targetSystem, targetId, rcdTinCheck) {

			var funcName = scriptName + "--->" + "notifyTargetExchangeRecord";
			notifyDebug = (objAppSettings.settings["TINCHK Notify Target Debug"] == "T");

			try {
				var arrTinChkToTargetMapping = JSON.parse(objAppSettings.settings["TINCHK Notify Target Mapping: ExchangeRecord"]);
			} catch (e) {
				log.error(funcName, "parse of setting 'TINCHK Notify Target Mapping: ExchangeRecord' failed, exception message: " + e.message);
			}

			notifyDebugLog(funcName, "function invoked,  Mapping:" + objAppSettings.settings["TINCHK Notify Target Mapping: ExchangeRecord"]);

			var rcdExchange = record.load({
				type: 'customrecord_acq_lot',
				id: targetId
			});
			
			for (ix = 0; ix < arrTinChkToTargetMapping.length; ix++) {
				var objTinChkToTargetMapping = arrTinChkToTargetMapping[ix];
				if (!objTinChkToTargetMapping.ignoreThisField) {

					//===== MAPPING =======================================================================================================================
					if (objTinChkToTargetMapping.mapping) {
						var targetValue = applyMapping(rcdTinCheck.getValue(objTinChkToTargetMapping.tinChkField), objTinChkToTargetMapping.mapping);
						if (targetValue != "!ignore!") {
							notifyDebugLog(funcName, "tinChkField:" + objTinChkToTargetMapping.tinChkField +
								",    sourceValue:" + rcdTinCheck.getValue(objTinChkToTargetMapping.tinChkField) +
								",    targetField:" + objTinChkToTargetMapping.targetField +
								",    mappedValue:" + targetValue);
							rcdExchange.setValue(objTinChkToTargetMapping.targetField, targetValue);
						} else {
							notifyDebugLog(funcName, "tinChkField:" + objTinChkToTargetMapping.tinChkField +
								",    targetField:" + objTinChkToTargetMapping.targetField +
								",    value: ignore, no change to target field ");
						}

					} // if (objTinChkToTargetMapping.mapping)

					//===== CONDITIONAL FIELD===============================================================================================================
					else if (objTinChkToTargetMapping.conditionalField) {
						notifyDebugLog(funcName, "conditionalField:" + objTinChkToTargetMapping.conditionalField);
						var conditionalFieldValue = rcdTinCheck.getValue(objTinChkToTargetMapping.conditionalField).toString() + "";
						notifyDebugLog(funcName, "conditionalField value: >>>" + conditionalFieldValue + "<<<");
						if (conditionalFieldValue > "") {
							notifyDebugLog(funcName, "tinChkField:" + objTinChkToTargetMapping.tinChkField +
								",    conditionalField:" + objTinChkToTargetMapping.conditionalField +
								",    targetField:" + objTinChkToTargetMapping.targetField +
								",    value:" + rcdTinCheck.getValue(objTinChkToTargetMapping.tinChkField));
							rcdExchange.setValue(objTinChkToTargetMapping.targetField, rcdTinCheck.getValue(objTinChkToTargetMapping.tinChkField));
						}
					} // else if (objTinChkToTargetMapping.conditionalField)

					//===== SCRIPT LOGIC ===================================================================================================================
					//ATP-1300
					else if (objTinChkToTargetMapping.scriptLogic) {

						switch (objTinChkToTargetMapping.tinChkField) {
							case "custrecord_tinchk_giin_result":

								giin_check_result = rcdTinCheck.getValue("custrecord_tinchk_giin_result");

								if (giin_check_result == 'PossibleMatch') {
									rcdExchange.setValue({
										fieldId: 'custrecord_exrec_giin_validated',
										value: true,
										ignoreFieldChange: true
									})
									rcdExchange.setValue({
										fieldId: 'custrecord_exrec_giin_validated_ts',
										value: '',
										ignoreFieldChange: true
									})
									rcdExchange.setValue({
										fieldId: 'custrecord_exrec_giin_validated_by',
										value: '',
										ignoreFieldChange: true
									})
								} else if (giin_check_result == 'NotChecked' ||
									giin_check_result == 'NoMatch' ||
									giin_check_result == 'Error') {

									rcdExchange.setValue({
										fieldId: 'custrecord_exrec_giin_validated',
										value: false,
										ignoreFieldChange: true
									})
									rcdExchange.setValue({
										fieldId: 'custrecord_exrec_giin_validated_ts',
										value: '',
										ignoreFieldChange: true
									})
									rcdExchange.setValue({
										fieldId: 'custrecord_exrec_giin_validated_by',
										value: '',
										ignoreFieldChange: true
									})

								}
								break;
						}
					} //else if (objTinChkToTargetMapping.scriptLogic)

					//===== DEFAULT ===============================================================================================================
					else {
						notifyDebugLog(funcName, "tinChkField:" + objTinChkToTargetMapping.tinChkField +
							",    targetField:" + objTinChkToTargetMapping.targetField +
							",    value:" + rcdTinCheck.getValue(objTinChkToTargetMapping.tinChkField));
						rcdExchange.setValue(objTinChkToTargetMapping.targetField, rcdTinCheck.getValue(objTinChkToTargetMapping.tinChkField));
					}

				} // if (!objTinChkToTargetMapping.ignoreThisField)

			} // for (ix=0; ix<arrTinChkToTargetMapping.length; ix++)

//			log.debug("ATP-1608" ,"bef rcdExchange.save()");
			rcdExchange.save();
//			log.debug("ATP-1608" ,"aft rcdExchange.save()");

		}


		//=======================================================================================================================================	
		// This function returns a mapped value based on a mapping entry contained in AppSetting "TINCHK Notify Target Mapping: ExchangeRecord" 
		//=======================================================================================================================================
		function applyMapping(fieldValue, arrMapping) {
			var returnValue = "nochange";
			var objMapping;
			for (i = 0; i < arrMapping.length; i++) {
				objMapping = arrMapping[i];
				if (objMapping.valueIn == "default") {
					returnValue = objMapping.valueOut;
				}
			}
			for (j = 0; j < arrMapping.length; j++) {
				objMapping = arrMapping[j];
				if (objMapping.valueIn == fieldValue) {
					returnValue = objMapping.valueOut;
				}
			}
			return returnValue;
		}


		//===============================================================================================================================	
		//===============================================================================================================================
		function notifyDebugLog(funcName, msg) {
			if (notifyDebug) {
				log.debug(funcName, msg);
			}
		}


		//===============================================================================================================================
		// This function accepts a Tin Check record id and invoke the PHP Service 
		//===============================================================================================================================	
		function invokeTINCheck(tinCheckRecordId) {
			var funcName = scriptName + "--->" + "invokeTINCheck";
			var objReturn = {
				success: false,
				result: "",
				failureReason: ""
			}
			log.debug(scriptName, "TinCheckInvoker  " + tinCheckRecordId);

			if (!tinCheckRecordId) {
				objReturn.failureReason = "InvalidRecordId";
				objReturn.result = "InvalidRecordId";
				return objReturn;
			}

			if (!isInt(tinCheckRecordId)) {
				objReturn.failureReason = "InvalidRecordId";
				return objReturn;
			}

			try {
				log.debug(scriptName, "TinCheckInvoker inside try");

				try {
					objAppSettings = appSettings.createAppSettingsObject("TIN Check");
					//		    	log.debug(scriptName, "TINCHK PHP Service URL: "                   + objAppSettings.settings["TINCHK PHP Service URL"]);
					//		    	log.debug(scriptName, "TINCHK PHP Service Auth Token: "            + objAppSettings.settings["TINCHK PHP Service Auth Token"]);
					//		    	log.debug(scriptName, "TINCHK Request Status to Priority: "        + objAppSettings.settings["TINCHK Request Status to Priority"]);
					//		    	log.debug(scriptName, "TINCHK Response Property to Field Xref: "   + objAppSettings.settings["TINCHK Response Property to Field Xref"]);
					//		    	log.debug(scriptName, "TINCHK Nbr Attempts before cancel: "        + objAppSettings.settings["TINCHK Nbr Attempts before cancel"]);
					//		    	log.debug(scriptName, "TINCHK Unavailable Delay Seconds: "         + objAppSettings.settings["TINCHK Unavailable Delay Seconds"]);
					//		    	log.debug(scriptName, "TINCHK Unavailable Delay List: "            + objAppSettings.settings["TINCHK Unavailable Delay List"]);
					//		    	log.debug(scriptName, "TINCHK PHP Service Last Status: "           + objAppSettings.settings["TINCHK PHP Service Last Status"]);
					//		    	log.debug(scriptName, "TINCHK PHP Service Unavailable Timestamp: " + objAppSettings.settings["TINCHK PHP Service Unavailable Timestamp"]);
				} catch (e11) {
					log.debug(scriptName, "exception getting appSettings: " + e11.message);
					return;
				}

				//var appValue = objAppSettings.settings["my app value"];

				arrStatus = JSON.parse(objAppSettings.settings["TINCHK Queue Servicer Status List"]);
				var objDateTimeNow = new Date();
				var nbrMinutes = 3;
				var newDateObj = new Date(objDateTimeNow.getTime() + nbrMinutes * 60000);

				var ProcessRecord = true;
				var rcdTinCheck = record.load({
					type: 'customrecord_tin_check',
					id: tinCheckRecordId
				});
				if (!rcdTinCheck) {
					objReturn.failureReason = "LoadRecordFailed";
					objReturn.result = "LoadRecordFailed";
					return objReturn;
				}

				var resUntil = JSON.stringify(rcdTinCheck.getValue("custrecord_tinchk_reserved_until_ts"));
				var objDateTime = JSON.stringify(newDateObj);
				var objDateTimeNow = JSON.stringify(objDateTimeNow);
				log.audit(scriptName, "TinCheckInvoker record loaded; " + "reqStat:" + rcdTinCheck.getText("custrecord_tinchk_req_sts") + ",    resUntil: " + resUntil + ",     now+6: " + objDateTime + ",   Now:" + objDateTimeNow);

				// This logic is intended to insure that more than one invocation of this script does not 
				// simultaneously process this record
				if (arrStatus.indexOf(rcdTinCheck.getValue("custrecord_tinchk_req_sts")) > -1) {
					if (rcdTinCheck.getValue("custrecord_tinchk_reserved_until_ts") < new Date()) {
						log.debug(scriptName, "Status ok ");

						// Now save the reserve until timestamp
						// If this save fails usually means another instance has already started working the record
						rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", newDateObj);
						var resu = JSON.stringify(rcdTinCheck.getValue("custrecord_tinchk_reserved_until_ts"));
						try {
							rcdTinCheck.save();
							log.audit(scriptName, "TinCheckInvoker record res ts updated; " + resu);
						} catch (e0) {
							if ((e0.name != "RCRD_HAS_BEEN_CHANGED") && (e0.name != "CUSTOM_RECORD_COLLISION")) {
								log.error(scriptName, "Save failed   " + e0);
								objReturn.failureReason = "RecordSaveError: " + e0.message;
								objReturn.result = "RecordSaveError";
							} else {
								log.debug(scriptName, "RCRD_HAS_BEEN_CHANGED   " + e0);
								objReturn.failureReason = "RecordAlreadyBeingProcessed";
								objReturn.result = "RecordAlreadyBeingProcessed";
							}
							return objReturn;
						}

						// Do not return, process this record
						log.debug(scriptName, "Process this Record   ");

					} // if (rcdTinCheck.getValue("custrecord_tinchk_reserved_until_ts") < new Date() )
					else {
						objReturn.failureReason = "RecordAlreadyBeingProcessed";
						objReturn.result = "RecordAlreadyBeingProcessed";
						return objReturn;
					}
				} // if (arrStatus.indexOf(rcdTinCheck.getValue("custrecord_tinchk_req_sts")) > -1)
				else {
					objReturn.failureReason = "RecordStatusInvalid";
					objReturn.result = "RecordStatusInvalid";
					return objReturn;
				}

				log.debug(scriptName, "TinCheckInvoker preparing to make request");

				//var rcdTinCheck = record.load({type:'customrecord_tin_check' ,id:tinCheckRecordId} );
				//if (!rcdTinCheck) { objReturn.failureReason = "LoadRecordFailed"; return objReturn; }

				var requestStatus = rcdTinCheck.getText("custrecord_tinchk_req_sts");

				var arrRequestStatusToPriority = JSON.parse(objAppSettings.settings["TINCHK Request Status to Priority"]);

				var priority = arrRequestStatusToPriority[0].priority; //Default
				for (i = 0; i < arrRequestStatusToPriority.length; i++) {
					if (arrRequestStatusToPriority[i].requestStatus == requestStatus) {
						priority = arrRequestStatusToPriority[i].priority;
					}
				}
				log.debug(scriptName, "ID:" + rcdTinCheck.getValue("internalid") + ",    Priority:" + priority + ",   requestStatus:" + requestStatus + ",    custrecord_tinchk_req_ts:" + rcdTinCheck.getValue("custrecord_tinchk_req_ts"));

				// ,requestedService: "tinOnly|uspsOnly|full"
				var requestDate = getDateTimeStringWithLocalOffset(rcdTinCheck.getValue("custrecord_tinchk_req_ts"));
				log.debug(scriptName, "after getDateTimeStringWithLocalOffset ");

				var tinCheckRequest = {
					invoker: "nsTINCheck",
					priority: priority,
					requestDate: requestDate,
					TINCheckId: tinCheckRecordId,
					sourceSystem: rcdTinCheck.getValue("custrecord_tinchk_src_sys"),
					sourceId: rcdTinCheck.getValue("custrecord_tinchk_src_id"),
					targetSystem: rcdTinCheck.getValue("custrecord_tinchk_trg_sys"),
					targetId: rcdTinCheck.getValue("custrecord_tinchk_trg_id"),
					ssnEIN: rcdTinCheck.getValue("custrecord_tinchk_ssnein"),
					irsName: rcdTinCheck.getValue("custrecord_tinchk_irs_nm"),
					irsFirstName: rcdTinCheck.getValue("custrecord_tinchk_irs_frst_nm"),
					GIIN: rcdTinCheck.getValue("custrecord_tinchk_giin"),
					address1: rcdTinCheck.getValue("custrecord_tinchk_addr1"),
					address2: rcdTinCheck.getValue("custrecord_tinchk_addr2"),
					city: rcdTinCheck.getValue("custrecord_tinchk_city"),
					stateText: rcdTinCheck.getValue("custrecord_tinchk_st_txt"),
					zip: rcdTinCheck.getValue("custrecord_tinchk_zip")
				};

				var str99 = JSON.stringify(tinCheckRequest);
				log.debug(scriptName, "tinCheckRequest: " + str99);


				var ServiceURL = objAppSettings.settings["TINCHK PHP Service URL " + runtime.envType];

				var RequestToSend = tinCheckRequest;

				log.debug(scriptName, "B4 Service Call");
				try {
					//
					log.debug(scriptName, "runtime.envType: " + runtime.envType);
					log.debug(scriptName, "TINCHK PHP Service Auth Token: " + objAppSettings.settings["TINCHK PHP Service Auth Token " + runtime.envType]);
					var objHeader = {
						"Authorization": objAppSettings.settings["TINCHK PHP Service Auth Token " + runtime.envType]
					};
					//var objHeader = { "Authorization": objControlStatusFields.custrecord_tinchk_ctrlstat_svc_auth_tokn };
					//var httpsResponse = https.post({  url:ServiceURL ,body:tinCheckRequest ,header:objHeader});
					log.debug(scriptName, "Service URL: " + ServiceURL);
					var body = JSON.stringify(RequestToSend);
					var objHttpsRequest = {
						url: ServiceURL,
						body: body,
						headers: objHeader
					};
					var str3 = JSON.stringify(objHttpsRequest);
					log.debug(scriptName, "objHttpsRequest: " + str3);

					addUserNote(tinCheckRecordId, "customrecord_tin_check", "httpRequest", str3)

					var httpsResponse = https.post(objHttpsRequest);
					var httpsResponseString = JSON.stringify(httpsResponse);
					log.debug(scriptName, "After htts post ");
					if (!httpsResponse) {
						log.debug(scriptName, "response is null ");
					} else if (httpsResponse == "") {
						log.debug(scriptName, "response is empty string ");
					} else {
						log.debug(scriptName, "response is OTHER ===>" + httpsResponseString);
					}

					addUserNote(tinCheckRecordId, "customrecord_tin_check", "httpResponse", httpsResponseString)

					if (httpsResponse.code < "300") {
						log.debug(scriptName, "bef parse");
						// {"status":"tincheck_fail","tincheckResponse":null,"tincheckId":"4045"}
						var tinCheckResponse = JSON.parse(httpsResponse.body);
						log.debug(scriptName, "aft parse");

						objReturn.Result = tinCheckResponse.status;
					} else {

						objReturn.result = "service_returned_error_code";
						objReturn.failureReason = "Service Call returned ClientResponse Code: " + httpsResponse.code + ", we were expecting 201, check script log for details";

						objReturn.success = false;
						log.error(scriptName + ",  TinCheck Id:" + tinCheckRecordId, objReturn.failureReason);
						log.error(scriptName + ",  TinCheck Id:" + tinCheckRecordId, "Response Body: " + httpsResponse.body);
						updateStatusControl(objReturn.result);

						try {
							var rcdTinCheck = record.load({
								type: 'customrecord_tin_check',
								id: tinCheckRecordId
							});

							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_ts", new Date());
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_result", objReturn.failureReason);
							rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", null);

							if (!invocationCount) {
								invocationCount = 0
							}
							invocationCount++;
							rcdTinCheck.setValue("custrecord_tinchk_invoked_cnt", invocationCount);
							if (invocationCount > objAppSettings.settings["TINCHK Nbr Attempts before cancel"]) {
								rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.Canceled);
							}

							rcdTinCheck.save();
						} catch (eIgnore) {}


						return objReturn;
					}


				} catch (e0) {

					objReturn.result = "unavailable";

					objReturn.failureReason = "Service Call Exception: " + e0.message;
					objReturn.success = false;
					log.error(scriptName, "Service call exception: " + e0);
					updateStatusControl(objReturn.result);
					return objReturn;
				}

				// {"status":"tincheck_fail","tincheckResponse":null,"tincheckId":"4045"}
				var s_tinCheckResponse = JSON.stringify(tinCheckResponse);
				log.debug(scriptName, "Aft Service call, tinCheckResponse: " + s_tinCheckResponse);

				var rcdTinCheck = record.load({
					type: 'customrecord_tin_check',
					id: tinCheckRecordId
				});
				log.audit(scriptName, "Aft record.load,    objReturn.Result: " + objReturn.Result);

				switch (objReturn.Result) {

					case 'unavailable':
						objReturn.success = false;
						objReturn.failureReason = "Service is unavailable";
						if (rcdTinCheck) {
							log.debug(funcName, "Processing TIN Check record: " + tinCheckRecordId);
							//
							if (objAppSettings.settings["TINCHK PHP Service Last Status"] != "unavailable") {
								var invocationCount = rcdTinCheck.getValue("custrecord_tinchk_invoked_cnt");
								if (!invocationCount) {
									invocationCount = 0
								}
								invocationCount++;
								rcdTinCheck.setValue("custrecord_tinchk_invoked_cnt", invocationCount);
							}

							if (invocationCount > objAppSettings.settings["TINCHK Nbr Attempts before cancel"]) {
								if (rcdTinCheck.getValue("custrecord_tinchk_req_sts") < 5) {
									rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.Canceled);
								}
							}

							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_result", objReturn.Result);
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_ts", new Date());
							rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", null);
							rcdTinCheck.save();
						}
						break;

					case 'pending':
						objReturn.success = true;
						if (rcdTinCheck) {
							log.debug(funcName, "Accepted Processing TIN Check record: " + tinCheckRecordId);
							var invocationCount = rcdTinCheck.getValue("custrecord_tinchk_invoked_cnt");
							log.debug(funcName, "invocationCount: " + invocationCount);
							if (!invocationCount) {
								invocationCount = 0
							}
							invocationCount++;
							var TinChkRecordIdReturned = tinCheckResponse.tincheckId;
							if (tinCheckRecordId != TinChkRecordIdReturned) {
								rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.PendingDuplicate);
								rcdTinCheck.setValue("custrecord_duplicated_tin_chk_record", TinChkRecordIdReturned);
							} else {
								rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.Pending);
							}

							rcdTinCheck.setValue("custrecord_tinchk_invoked_cnt", invocationCount);
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_ts", new Date());
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_result", objReturn.Result);
							rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", null);
							rcdTinCheck.save();
						}
						break;


					case 'tincheck_complete':
						// Do not update Request Status, we want this record to be processed again later
						objReturn.success = true;
						objReturn.failureReason = "TIN Check is complete but results have not yet been sync'd back to the TIN Check record in NetSuite";
						var TinChkRecordIdReturned = tinCheckResponse.tincheckId;
						if (tinCheckRecordId != TinChkRecordIdReturned) {
							rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.PendingDuplicate);
							rcdTinCheck.setValue("custrecord_tinchk_invoked_cnt", invocationCount);
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_ts", new Date());
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_result", objReturn.Result);
							rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", null);
							rcdTinCheck.save();
						}
						break;




					case 'netsuite_sync_complete':
						objReturn.success = true;

						var TinChkRecordIdReturned = tinCheckResponse.tincheckId;
						if (rcdTinCheck) {
							log.debug(funcName, "DuplicateRequest Processing TIN Check record: " + tinCheckRecordId);
							//rcdTinCheck.setValue("custrecord_tinchk_req_sts" ,objRequestStatus.Processed);
							var invocationCount = rcdTinCheck.getValue("custrecord_tinchk_invoked_cnt");
							log.debug(funcName, "invocationCount: " + invocationCount);
							if (!invocationCount) {
								invocationCount = 0
							}
							invocationCount++;
							if (rcdTinCheck.getValue("custrecord_tinchk_req_sts") < 5) {
								rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.Pending);
							}
							rcdTinCheck.setValue("custrecord_tinchk_invoked_cnt", invocationCount);
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_ts", new Date());
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_result", objReturn.Result);
							rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", null);


							log.debug(funcName, "TinChkRecordIdReturned: " + TinChkRecordIdReturned + ",      tinCheckRecordId: " + tinCheckRecordId);
							if (TinChkRecordIdReturned != tinCheckRecordId) {
								rcdTinCheck.setValue("custrecord_tinchk_req_sts", objRequestStatus.Duplicate);
								rcdTinCheck.setValue("custrecord_duplicated_tin_chk_record", TinChkRecordIdReturned);
							}

							rcdTinCheck.save();
						}
						break;

					default:
						objReturn.success = true;

						if (rcdTinCheck) {
							log.error(funcName, "Unknown status returned from TIN Check service: " + objReturn.Result);
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_ts", new Date());
							rcdTinCheck.setValue("custrecord_tinchk_lst_invoked_result", objReturn.Result);
							rcdTinCheck.setValue("custrecord_tinchk_reserved_until_ts", null);

							rcdTinCheck.save();
						}

				} // switch (objReturn.Result)

				updateStatusControl(objReturn.Result);


			} // try
			catch (e) {
				log.error(scriptName, "invokeTINCheck exception: " + e);
				objReturn.failureReason = "Exception: " + e.message;
				objReturn.success = false;
			} // catch(e)


			return objReturn;
		} // invokeTINCheck 


		//==================================================================================================
		//==================================================================================================
		function isInt(value) {

			if (isNaN(value)) {
				return false;
			}

			var x;
			x = parseFloat(value);
			return (x | 0) === x;
		} // function isInt



		//==================================================================================================
		//==================================================================================================
		function getDateTimeStringWithLocalOffset(nsDateTimeObject) {
			// returns NS date object as string in format 2019-01-31T07:08:27.000-08:00
			var dateStringZuluTime = JSON.stringify(nsDateTimeObject);
			var tsOffest = nsDateTimeObject.getTimezoneOffset(); //Offset in minutes
			var tsOffestHours = parseInt(tsOffest / 60); //Compute whole hours
			var tsOffestMinutes = tsOffest - (tsOffestHours * 60); //Compute leftover minutes
			var lzHours;
			var lzMinutes;
			var lzSign; // lz=Local Zone
			if (tsOffest < 1) {
				lzSign = "+"
			} else {
				lzSign = "-"
			} // if offset positve then time earlier than UTC
			if (tsOffestHours < 10) {
				lzHours = "0"
			} else {
				lzHours = "0"
			}
			if (tsOffestMinutes < 10) {
				lzMinutes = "0"
			} else {
				lzMinutes = "0"
			}
			return dateStringZuluTime.replace("Z", lzSign + lzHours + tsOffestHours + ":" + lzMinutes + tsOffestMinutes);
		}



		//==================================================================================================
		// This function is obsolete. It was originally code to be used when the PHP Service returned
		// result "duplicaterequest" along with the Tin Check info from the request that duplicated.
		// The data is copied from the return object to the Tin Check record being processed.
		// The service was not coded to return the Tin Check data as a duplicate request.
		//==================================================================================================
		function updateLookupInformation(tinCheckResponse, rcdTinCheck, objControlStatusFields) {
			var funcName = scriptName + "--->" + "updateLookupInformation";

			var arrPropToFieldXref = JSON.parse(objAppSettings.settings["TINCHK Response Property to Field Xref"]);

			for (i = 0; i < arrPropToFieldXref.length; i++) {
				var objPropertyXref = arrPropToFieldXref[i];

				try {
					var propertyValue = "";
					if (objPropertyXref.isObject) {
						propertyValue = JSON.stringify(tinCheckResponse[objPropertyXref.responseProperty])
					} else if (objPropertyXref.isDateTime) {
						propertyValue = datetimeStringToDateObject(tinCheckResponse[objPropertyXref.responseProperty]);
					} else {
						propertyValue = tinCheckResponse[objPropertyXref.responseProperty];
					}

					//				log.debug(funcName, "rcdField: " + objPropertyXref.rcdField 
					//						          + ",   responseProperty:" + objPropertyXref.responseProperty
					//						          + ",   isObject:" + objPropertyXref.isObject
					//						          + ",   isDateTime:" + objPropertyXref.isDateTime
					//						          + ",   propertyValue:" + propertyValue );				
					rcdTinCheck.setValue(objPropertyXref.rcdField, propertyValue);
					//				log.debug(funcName, "rcdField: " + objPropertyXref.rcdField + ",  new value: " + rcdTinCheck.getValue(objPropertyXref.rcdField) + ",    propertyValue: " + propertyValue + ",     property: " + objPropertyXref.responseProperty );
				} catch (e) {
					log.error(funcName, "Exception: " + e);
					log.error(funcName, "rcdField: " + objPropertyXref.rcdField +
						",   responseProperty:" + objPropertyXref.responseProperty +
						",   propertyValue:" + propertyValue +
						",   isObject:" + objPropertyXref.isObject +
						",   isDateTime:" + objPropertyXref.isDateTime);
				}

			}

			return;

		} // function updateLookupInformation


		//==================================================================================================
		//==================================================================================================
		function addUserNote(rcdId, rcdType, noteTitle, noteText) {
			var funcName = scriptName + "--->" + "addUserNote";
			try {
				var rcdTypeId = getCustomRecordTypeInternalId(rcdType, rcdId);
				log.debug(funcName, "rcdTypeId: " + rcdTypeId);
				noteText = noteText.substr(0, 4000); // ensure max width of note
				var userNote = record.create({
					type: "note"
				});
				userNote.setValue({
					fieldId: "title",
					value: noteTitle
				});
				userNote.setValue({
					fieldId: "notetype",
					value: 7
				});
				userNote.setValue({
					fieldId: "record",
					value: rcdId
				});
				userNote.setValue({
					fieldId: "recordtype",
					value: rcdTypeId
				});
				userNote.setValue({
					fieldId: "note",
					value: noteText
				});
				var intUserNoteId = userNote.save();
			} catch (e) {
				log.debug(funcName, "Exception: " + e);
			}
		}



		//==================================================================================================
		//==================================================================================================
		function getCustomRecordTypeInternalId(name, rcdId) {
			//leverage NetSuite's URL generator to get the record type
			var recordURL = url.resolveRecord({
				recordType: name,
				recordId: rcdId,
				isEditMode: false,
				params: {}
			});
			log.debug("getCustomRecordTypeInternalId", "recordURL: " + recordURL);
			return getURLParameterByName('rectype', recordURL)


			//url parser helper function
			function getURLParameterByName(name, url) {
				name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
				var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
					results = regex.exec(url);
				return results === null ? "" : results[1].replace(/\+/g, " ");
			};
		};



		//==================================================================================================
		//==================================================================================================
		function datetimeStringToDateObject(dateString) {

			try {
				var Year = dateString.substring(0, 4);
				var Month = dateString.substring(5, 7);
				Month--;
				var Day = dateString.substring(8, 10);
				var Hour = dateString.substring(11, 13);
				var Min = dateString.substring(14, 16);
				var Sec = dateString.substring(17, 19);
				return new Date(Year, Month, Day, Hour, Min, Sec, 0);
			} catch (e) {
				return null
			}
		} // function datetimeStringToDateObject



		//==================================================================================================
		//==================================================================================================
		function updateStatusControl(lastStatus) {
			var funcName = scriptName + "--->" + "updateStatusControl";

			var timestamp = null;
			if (lastStatus == "unavailable") {
				timestamp = new Date();
			}

			log.debug(funcName, "before appSettings   lastStatus: " + lastStatus);
			appSettings.writeAppSetting("TIN Check", "TINCHK PHP Service Unavailable Timestamp", timestamp, appSettings.FIELD_TYPES.DATEANDTIME);
			appSettings.writeAppSetting("TIN Check", "TINCHK PHP Service Last Status", lastStatus, appSettings.FIELD_TYPES.TEXT);
			appSettings.writeAppSetting("TIN Check", "TINCHK Unavailable Delay Seconds", newDelay, appSettings.FIELD_TYPES.INTEGER);
			log.debug(funcName, "after appSettings ");

		} // function updateStatusControl


		//==================================================================================================
		//==================================================================================================
		//==================================================================================================
		//==================================================================================================
		return {
			invokeTINCheck: invokeTINCheck,
			notifyTargetAddToQueue: notifyTargetAddToQueue,
			notifyTarget: notifyTarget,
			submitTINCheckRequest: submitTINCheckRequest,
			requestTinCheck: requestTinCheck,
			getRequestHash: getRequestHash,
			submitTINCheckRequest: submitTINCheckRequest,
			buildRequestFromExchangeRecord: buildRequestFromExchangeRecord,
			objNotificationStatus: objNotificationStatus,
			objRequestStatus: objRequestStatus
		};
	});

/*

{"ServiceQueueId": "6420f6bb-0216-45b3-b98e-7a656db4ca8f"
 ,"DateProcessed": "2018-09-04T22:28:10.000000"
 ,"SubmittedSSNEIN": ""
 ,"SubmittedIRSName": "MUTEBUTSI JULES"
 ,"SubmittedIRSFirstName": ""
 ,"requestId": "47935429"
 ,"requestStatus": "1"
 ,"requestDetails": "Request Completed"
 ,"NameMatchLevel": "NoMatch"
 ,"NameMatchScore": -1
 ,"TINNameCode": "-1"
 ,"TINMatch": "No"
 ,"TINResult": "NotChecked"
 ,"TINNameDetails": "No TIN provided. TIN lookup skipped."
 ,"DMFResult": "NotChecked"
 ,"DeathMasterData": {}
 ,"DateOfDeath": ""
 ,"EINResult": "NotChecked"
 ,"EINData": ""
 ,"GIINResult": "NotChecked"
 ,"GIINScore": 0
 ,"GIINName": ""
 ,"GIINNameMatch": ""
 ,"GIINCountry": ""
 ,"OFACCount": 1
 ,"OFACData": [  {
    "Id": "11977"
   ,"SearchName": "MUTEBUTSI JULES"
   ,"SysID": "11977"
   ,"Name": "MUTEBUTSI JULES"
   ,"Type": "individual"
   ,"Program": "DRCONGO"
   ,"Remarks": "DOB 06 Jul 1960; POB South Kivu, DRC; nationality Congo, Democratic Republic of the."
   ,"Address": ""
   ,"AKA": ""
   ,"DisplayName": "MUTEBUTSI JULES"
   ,"MatchScore": "100%"
   ,"MatchType": "Exclusion"
   }   ]
 ,"ListResult": "PossibleMatch"
 ,"ListMatchCount": 2
 ,"ListsMatched": "EPLS,UNCON"
 ,"ListData": {
    "EPLS": [    {
        "Id": "298342"
       ,"SearchName": "JULES  MUTEBUTSI"
       ,"SysId": "298342"
       ,"Name": "JULES  MUTEBUTSI"
       ,"First": "JULES"
       ,"Last": "MUTEBUTSI"
       ,"Classification": "Individual"
       ,"ExclusionType": "Reciprocal"
       ,"Country": "RWA"
       ,"CTCode": "03-SDN-01"
       ,"Agency": "TREAS-OFAC"
       ,"TerminationDate": "Indefinite"
       ,"DisplayName": "JULES  MUTEBUTSI"
       ,"ExclusionProgram": "Prohibition/Restriction"
       ,"AdditionalComments": "PII data has been masked from view"
       ,"CrossReference": "(also COLONEL MUTEBUTSI, JULES MUTEBUSI, JULES MUTEBUZI)"
       ,"SAMNumber": "S4MR3QDWR"
       ,"MatchScore": "100%"
       ,"MatchType": "Exclusion"
       }   ]
    ,"UNCON": [   {
        "Id": "27086"
       ,"SearchName": "JULES MUTEBUTSI"
       ,"SysId": "27086"
       ,"Name": "JULES MUTEBUTSI"
       ,"DisplayName": "JULES MUTEBUTSI"
       ,"ListType": "DRC"
       ,"ListTypes": "UN List"
       ,"DataId": "6908009"
       ,"MatchScore": "100%"
       ,"MatchType": "Exclusion"
       }
    ]   }
 ,"NonCriticalListMatchCount": 3
 ,"NonCriticalListsMatched": "OFAC,EUS,DTC"
 ,"NonCriticalListData": {
    "EUS": [   {
        "Id": "52341"
       ,"SearchName": "JULES MUTEBUTSI"
       ,"SysID": "52341"
       ,"Name": "JULES MUTEBUTSI"
       ,"Program": "COD"
       ,"BirthPlace": "Minembwe South Kivu"
       ,"BirthDate": "1964"
       ,"BirthCountry": "COD"
       ,"CitizenCountry": "COD"
       ,"Gender": "M"
       ,"MatchScore": "100%"
       ,"MatchType": "Exclusion"
       }
    ]
    ,"DTC": [   {
        "Id": "221339"
       ,"SearchName": "MUTEBUTSI Jules"
       ,"SysID": "221339"
       ,"Name": "MUTEBUTSI Jules"
       ,"SourceList": "Specially Designated Nationals (SDN) -Treasury Department"
       ,"EntityNumber": "11977"
       ,"SDNType": "Individual"
       ,"Programs": "DRCONGO"
       ,"Address": "RW"
       ,"MatchScore": "100%"
       ,"MatchType": "Exclusion"
       }
    ]   }
 ,"USPSResult": "NoMatch"
 ,"USPSMessage": "No USPS Match found."
 ,"USPSFormatted": ""
 ,"USPSDPV": ""
 ,"USPSZip": ""
 ,"RemainingAPICalls": "132"
}
*/