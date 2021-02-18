/**
	 *@NApiVersion 2.x
	 *@NScriptType ClientScript
	 */

	define(['N/runtime', 'N/ui/message', 'N/ui/dialog' ,'N/currentRecord' ,'N/record' ,'N/https' ,'N/url'    
		, "N/search"
	       ,'/.bundle/132118/PRI_AS_Engine'
	       ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
		   ],

		function(runtime, message, dialog,currentRecord, record, https, url, search, appSettings, srsConstants) {
		    var mode;
			var objUser = runtime.getCurrentUser();
			var userRoleId = objUser.roleId;

			
			//======================================================================================================================
			//======================================================================================================================
			function pageInit(context) {
				console.log("started " );
				
				mode = context.mode;
				
//				if ( mode == 'create' || mode == 'copy' ) { 
//					
//				}

//				var exRecID = Number(context.currentRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot'));
//				exchangeRecordFields = certLib.getExchangeRecordFields(exRecID);
				

				
				
				
			}
			
			
			//=======================================================================================================================
			//=======================================================================================================================
			function validateField(context) {
		        
	            switch (context.fieldId) {
	            //----------------------------------------------------------------------------------------------------------------
	            case 'fieldname':
					return true;
	            	break;
	            } // switch (context.fieldId)
	            
	    		return true;          
			}

			
			
			//======================================================================================================================
			//======================================================================================================================
			function fieldChanged(context) {
				
				if (context.fieldId == "custrecord_pay_import_other_approved") 
					if (context.currentRecord.getValue("custrecord_pay_import_other_approved")) {
						context.currentRecord.setValue("custrecord_pay_import_other_mgr_approval", runtime.getCurrentUser().id);
						context.currentRecord.setValue("custrecord_pay_import_other_approval_dt", new Date());
					} else {
						context.currentRecord.setValue("custrecord_pay_import_other_mgr_approval", "");
						context.currentRecord.setValue("custrecord_pay_import_other_approval_dt", "");					
					}

				
//				switch (context.fieldId) {
//					//------------------------------------------------------------------------------------------------------------
//				case '': 
//					break;
//					//------------------------------------------------------------------------------------------------------------
//				case '': 
//					break;
//					//------------------------------------------------------------------------------------------------------------
//				case '': 
//					break;
//				} // switch (context.fieldId)

			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function saveRecord(context) {
				//alert("saveRecord");
				if (mode == 'edit') { 
				//alert("mode edit");
					var oldRecord = record.load({ type:context.currentRecord.type, id:context.currentRecord.id });
					console.log(oldRecord.getValue("custrecord_pay_import_approved_pay") + "<<<->>>" + context.currentRecord.getValue("custrecord_pay_import_approved_pay"));
					if ( oldRecord.getValue("custrecord_pay_import_approved_pay") ) {
						if ( oldRecord.getValue("custrecord_pay_import_approved_pay") != context.currentRecord.getValue("custrecord_pay_import_approved_pay") ) {
							var explanation = prompt("You have changed 'Operations Approved to Pay', you must provide an explanation for this change.");
							if (!explanation) { explanation = ""; }
							explanation = explanation.trim();
							if (!(explanation > "")) { alert("You did not enter an explanation, one is required to save the record"); return false; }

				    		var noteAdded = addUserNote(context.currentRecord.id ,context.currentRecord.type ,"Operations Approved to Pay change explanation" ,explanation);
				    		if (!noteAdded) { alert("note add failed"); return false; }
						} 
					}
				}
				
				
				return true;
			}
			


			//======================================================================================================================================
			//======================================================================================================================================
			function didValuesChange(currentRecord ,oldRecord ,fieldNames) {
				var changed = false;
				for (var i=0; i<fieldNames.length; i++) {
					if (oldRecord.getValue(fieldNames[i]) !== currentRecord.getValue(fieldNames[i])) { changed = true; break; }
				}
				return changed;
			}

			
			
			//==================================================================================================
			//==================================================================================================
		    function addUserNote(rcdId ,rcdType ,noteTitle ,noteText) {
		    	try {
		    		var objHeader     = {};
		    		var objBody       = {};
		    		objBody.rcdId     = rcdId;
		    		objBody.rcdType   = rcdType;
		    		objBody.noteTitle = noteTitle;
		    		objBody.noteText  = noteText;
		    		objBody.noteType  = 7;
		    		var body          = JSON.stringify(objBody);
		    		var suitletURL    = url.resolveScript({ scriptId:'customscript_addusernote_sl' ,deploymentId:'customdeploy_addusernote_sl' ,returnExternalUrl:false});
		    		console.log("URL: " + suitletURL );
		    		var response      = https.post({ url:suitletURL ,headers:objHeader ,body:body });				
		    		if (response.body != "OK") { return false; }
		    	}
		    	catch(e) { console.log(e.message); return false; }
		    	return true;
		    }
			
			
						
			//======================================================================================================================
			//======================================================================================================================
			function setFieldDisplayType(context, fields, displayType, makeMandatory) {
				// console.log('setFieldDisplayType', 'displayType: ' + displayType);
				// console.log('setFieldDisplayType', 'makeMandatory: ' + makeMandatory);
				for (var i = 0; i < fields.length; i++) {
					var tempField = context.currentRecord.getField({ fieldId:fields[i] });
					if (tempField) {
						// Only do something if the argument has been supplied
						if (typeof displayType !== 'undefined') {
							displayType = displayType.toUpperCase();
							switch (displayType) {
								case 'DISABLED':
									tempField.isDisabled = true;
									break;
								case 'NORMAL':
									tempField.isDisabled = false;
									break;
								default:
									break;
							}
						}
						// Only do something if the argument has been supplied
						if (typeof makeMandatory !== 'undefined') {
							makeMandatory = makeMandatory.toUpperCase();
							switch (makeMandatory) {
								case 'MANDATORY':
									tempField.isMandatory = true;
									break;
								case 'OPTIONAL':
									tempField.isMandatory = false;
									break;
								default:
									break;
							}
						}
					}

				}
			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function clearFields(context, fields) {
				for (var i = 0; i < fields.length; i++) {
					//Now set the field value on the form
					context.currentRecord.setValue({ fieldId:fields[i] ,value:'' ,ignoreFieldChange: true });
				}
			}
			//ATP-1132
			function getPaymentAmountSum(currentRec)
			{
				var retValue = {};
				try{
					var customrecord_acq_lotSearchObj = search.create({
						   type: "customrecord_acq_lot",
						   filters:
						   [
							   ["custrecord_acq_loth_related_trans","anyof","@NONE@"], 
							   "AND", 
							   ["isinactive","is","F"],
							   "AND", 
							   ["custrecord_acq_lot_payment_import_record","anyof",currentRec.id], 
						      "AND", 
						      ["custrecord_acq_loth_zzz_zzz_acqstatus","anyof",srsConstants["Acquiom LOT Status"]["5b. Upon Approval Ready for Payment"]]
						   ]
						});
						var searchResultCount = customrecord_acq_lotSearchObj.runPaged().count;
						log.debug("customrecord_acq_lotSearchObj result count",searchResultCount);
						//log.audit("customrecord_acq_lotSearchObj" + JSON.stringify(customrecord_acq_lotSearchObj))
						retValue.count = searchResultCount; 
						
						var ERs = [];
						
						customrecord_acq_lotSearchObj.run().each(function(result){
						   // .run().each has a limit of 4,000 results
							ERs.push(result.id);
						   return true;
						});
						retValue.exchangeRecords = {};
						retValue.exchangeRecords.list = ERs;
						//console.log("searching" + JSON.stringify(ERs));
						if (ERs.length>0)
						{
							var customrecord_acq_lot_cert_entrySearchObj = search.create({
							   type: "customrecord_acq_lot_cert_entry",
							   filters:
							   [
							      ["custrecord_acq_lotce_zzz_zzz_parentlot.internalid","anyof",ERs],
							      "AND", 
								   ["isinactive","is","F"]
							   ],
							   columns:
							   [
							      search.createColumn({
							         name: "custrecord_acq_lotce_zzz_zzz_payment",
							         summary: "SUM",
							         label: "Payment Amount"
							      })
							   ]
							});
							var searchResultCount = customrecord_acq_lot_cert_entrySearchObj.runPaged().count;
							//console.log("searchResultCount " + searchResultCount);
							log.debug("customrecord_acq_lot_cert_entrySearchObj result count",searchResultCount);
							result = customrecord_acq_lot_cert_entrySearchObj.run().getRange({
								start: 0,
								end: 1
							});
							//console.log(JSON.stringify(result));
							if (result && result[0])
							{
								result = JSON.parse(JSON.stringify(result[0]));
								retValue.sum = result && result.values && result.values["SUM(custrecord_acq_lotce_zzz_zzz_payment)"];
								//console.log("retValue.sum " + retValue.sum );
								retValue.sum = (parseFloat(retValue.sum)).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'); 
							}
							return retValue;
						}
						else 
						{
							return retValue;
						}
				}
				catch(e)
				{
					log.error("Error Occurred", e.toString())
				}
			}
			
			function movePaymentsSL(utilsurl, ERs) 
			{
				var currentRec = currentRecord.get();
				var RecID = currentRec.id;
				var messagetype = null;
				var suiteletURL = utilsurl + "&exchangeRecords="  + JSON.stringify(ERs);
				  
				var myMsg2 = message.create({
		            title: "Moving ERs to Payment Dashboard", 
		            message: "Please wait...", 
		            type: message.Type.INFORMATION
		        });

				
		        myMsg2.show();
			        
				
				https.post.promise({
				    url: suiteletURL,
				    body: {}
				})
			    .then(function(response)
			    {
			    	
					location.reload(true);

			    })
			    .catch(function onRejected(reason) {
			        log.error({
			            title: 'Invalid Request: ',
			            details: reason
			        });
			    	location.reload(true);
			    })
			}
			//ATP-1132
			function moveToPaymentDashboard(utilsurl)
			{
				console.log('moveToPaymentDashboard');
				var currentRec = currentRecord.get();
				
				var result = getPaymentAmountSum(currentRec) || {};
				
				
				var msg = "";
				if (result.count> 0)
				{
					// Offer confirmation dialog before proceeding
					msg = "You are about to move "+result.count+" record(s) for a total of $"+result.sum+" to the payment dashboard. Please click OK to continue.";
					
					var options = {
						message: msg,
						title: 'Press OK to Continue'
					};
					dialog.confirm(options).then(function(answer) {
							if (answer) {
								movePaymentsSL(utilsurl,result.exchangeRecords);
							}
						})
						.catch(function() {});
				}
				else 
				{
					dialog.alert({
	        			'title': 'No Related Exchange Records found',
	        			'message': 'No more exchange records with status "5b. Upon Approval Ready for Payment" found. '
	        		});
				}
			}
			//======================================================================================================================
			//======================================================================================================================
			function showErrorMessage(msgTitle, msgText) {
				var myMsg = message.create({ title:msgTitle ,message:msgText ,type:message.Type.WARNING });
				myMsg.show({ duration:12900 });
				window.scrollTo(0, 0);
			}

			return {
				     pageInit: pageInit
				,fieldChanged: fieldChanged
				  ,saveRecord: saveRecord
				     ,moveToPaymentDashboard : moveToPaymentDashboard
			};
		});