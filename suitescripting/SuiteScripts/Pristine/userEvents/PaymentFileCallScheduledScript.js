/**
 * Module Description
 * This Script is called after a Payment File Creation record has been submitted.
 * The functionality in this script is completely dependednt on the Status of 
 * the Payment File Creation Record.  If the Status is Approved then this Script
 * will schedule a Task using the Update Customer Refund Scheduled script, which will 
 * update Customer Refunds listed in the JSON File attached to the Payment File
 * Creation record.
 *
 * This Script also DELETES associated CSV and JSON files linked to the Payment
 * Creation File record that was just saved.  This happens if the Status of the 
 * record is set to REJECTED or CANCELLED.
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 May 2017     Scott Streule    I wanna go fast
 *
 */

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task', 'N/file', 'N/sftp'
	   ,'/SuiteScripts/Pristine/libraries/sftpLibrary'
	   ,'/.bundle/132118/PRI_QM_Engine'
	   ],
	function(record, runtime, search, task, file, sftp
			,SFTPLibrary 
			,qmEngine 
			) {
	    var scriptName = "PaymentFileCallScheduledScript.js";


		function afterSubmit(context) {
			var funcName = scriptName + "-->afterSubmit";

			if (context.type !== context.UserEventType.CREATE) {
				var oldpayFileCreationRecord = context.oldRecord;
				var oldrecordID = oldpayFileCreationRecord.id;
				var oldrecordStatus = oldpayFileCreationRecord.getValue('custrecord_pay_file_status');
				var oldjsonFileID = oldpayFileCreationRecord.getValue('custrecord_json_cust_refund_file');
				var oldCSVFileID = oldpayFileCreationRecord.getValue('custrecord_pay_file_linktofile');
				//log.debug('jsonFileID is ' + oldjsonFileID);
				log.debug({ title:'OLDrecordStatus is ' ,details:oldrecordStatus + " ====================================================================================" });

				var newpayFileCreationRecord = context.newRecord;
				var newrecordID = newpayFileCreationRecord.id;
				var newrecordStatus = newpayFileCreationRecord.getValue('custrecord_pay_file_status');
				var newjsonFileID = newpayFileCreationRecord.getValue('custrecord_json_cust_refund_file');
				var newCSVFileID = newpayFileCreationRecord.getValue('custrecord_pay_file_linktofile');
				//log.debug('jsonFileID is ' + newjsonFileID);
				log.debug({ title:'NEWrecordStatus is ' ,details:newrecordStatus });

				//Payment File Creation Approval Status List values
				//1 - Pending Approval
				//2 - Approved
				//3 - Rejected
				//4 - Completed
				//5 - Cancelled

				//Check to see if this record is in status 2 (Approved)

				if (oldrecordStatus != "2" && newrecordStatus == "2") {
//					log.debug({	title:'NEWrecordStatus is Approved (2)' ,details:newrecordStatus });
//					var csvFile = file.load({ id:newCSVFileID });
//					var myFile = { name:csvFile.name ,contents:csvFile.getContents() };
//					log.debug({ title:'B4 Uplaod File CALL' ,details:'' });
					
			        var objValues = {};
					var deliveryMethod_FTP    = 1;
					var deliveryMethod_Manual = 2;
					var deliveryMethod_asynchronous_FTP  = 4;
					if (newpayFileCreationRecord.getValue('custrecord_pay_file_deliv_method') == deliveryMethod_asynchronous_FTP) {
						// For this Delivery Method the the file will be transmitted by an asyncronous process that monitors a folder for files waiting to be transmitted.
						// When approved the file is simply copied/moved to the specified folder to by processed by the appropriate transmission process
						var objPaymentFileType = search.lookupFields({type:'customrecord_pay_file_type' ,id:newpayFileCreationRecord.getValue('custrecord_pay_file_type') 
                                                                  ,columns:["custrecord_pft_xmit_staging_folder"]});

						// ATP-1724 - An Async Transmission should only be staged to the transmission folder one time.
						//            We can tell that it has already been processed here by looking at File-Delivery Status
						var deliveryStatus_waitingApproval = 2;
						if (newpayFileCreationRecord.getValue('custrecord_pay_file_deliv_status') != deliveryStatus_waitingApproval ) {
							log.error(funcName ,"PFC:" + oldpayFileCreationRecord.id + ", attempting to stage a batch of payments for transmission that has already been processed.");
//							throw funcName + " is attempting to stage a batch of payments for transmission that has already been processed."
//							               + " This is based on the value of File Delivery Status which is not 'Waiting for Approval'";							
						}
						else {
							var asyncXmitFile = file.load({ id:newpayFileCreationRecord.getValue('custrecord_pay_file_async_xmit_file') });
							var paymentsFileCopy = file.create({ name:asyncXmitFile.name ,fileType:asyncXmitFile.fileType ,contents:asyncXmitFile.getContents() ,folder:objPaymentFileType["custrecord_pft_xmit_staging_folder"] });
							paymentsFileCopy.save();
							
		            		var deliveryStatus_asyncPending = 8;
							objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_asyncPending; 
						}
						// ATP-1724 - End
						
					}
					else
					if (newpayFileCreationRecord.getValue('custrecord_pay_file_deliv_method') == deliveryMethod_FTP) {
						var paymentsFile = file.load({id:newCSVFileID});

						try {
							var myFile = { name:paymentsFile.name ,contents:paymentsFile.getContents() };
							//Call the function to send the CSV file to the SFTP Server
							var objPaymentFileType = search.lookupFields({type:'customrecord_pay_file_type' ,id:newpayFileCreationRecord.getValue('custrecord_pay_file_type') 
		                                                              ,columns: ["custrecord_pft_cred_username" 
		                                                                        ,"custrecord_pft_cred_password_guid"
		                                                                        ,"custrecord_pft_cred_host_key"
		                                                                        ,"custrecord_pft_cred_url"
		                                                                        ,"custrecord_pft_ftp_target_dir_default"
		    	                                                                ,"custrecord_pft_ftp_target_dir_prod"]});
							
							
							var sftpServerCreds = { username: objPaymentFileType.custrecord_pft_cred_username
								               ,passwordGuid: objPaymentFileType.custrecord_pft_cred_password_guid
								                    ,hostKey: objPaymentFileType.custrecord_pft_cred_host_key
								                        ,url: objPaymentFileType.custrecord_pft_cred_url  };
							
							var targetDirectory;
							if(runtime.envType == 'PRODUCTION') { targetDirectory = objPaymentFileType.custrecord_pft_ftp_target_dir_prod } 
							else { targetDirectory = objPaymentFileType.custrecord_pft_ftp_target_dir_default }

							
							var uploadSuccessful = SFTPLibrary.uploadFile(myFile ,sftpServerCreds ,targetDirectory);
							log.debug({ title:'AFTER Upload File CALL' ,details:'' });
		            		var deliveryStatus_complete = 3;
		            		var deliveryStatus_failed   = 4;
							if (uploadSuccessful) { 
								objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_complete; 
								objValues["custrecord_pay_file_deliv_user"]       = runtime.getCurrentUser().id; 
								objValues["custrecord_pay_file_deliv_datetime"]   = new Date(); 
							}
							else { objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_failed; }				        
						}
						catch(e) {
							log.error({ title:funcName ,details:'Exception encountered during FTP processing: ' + e });
		            		var deliveryStatus_failed   = 4;
							objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_failed;
						}
						
					} // delivery method = FTP
					else
					if (newpayFileCreationRecord.getValue('custrecord_pay_file_deliv_method') == deliveryMethod_Manual) {
						var deliveryStatus_readydownload = 5;
						objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_readydownload;
					} // delivery method = manual
					
					if (objValues != {}) {
				        record.submitFields({ type:"customrecord_payment_file" ,id:newpayFileCreationRecord.id ,values:objValues });						
					}

					// ATP-1243 - Changing from Queue Manager script to Map/Reduce to take advantage of concurrency
				    var fileTranSequenceList = JSON.parse(newpayFileCreationRecord.getValue('custrecord_pay_file_tran_sequence_list') );
					var objRequest = { paymentFileId: newrecordID ,fileTranSequenceList:fileTranSequenceList };
					var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
					mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
					mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : JSON.stringify(objRequest)
												  ,'custscript_mr_uf_function'          : 'setCustomerRefundSubmittedForPayment'
												  ,'custscript_mr_uf_callingscript'     : scriptName
												  ,'custscript_mr_uf_record_type'       : record.Type.CUSTOMER_REFUND
							                     };
					log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
					var mapReduceTaskId = mapReduceTask.submit();
					
					
					var objPaymentFileType = search.lookupFields({type:'customrecord_pay_file_type' ,id:newpayFileCreationRecord.getValue('custrecord_pay_file_type') 
                                                              ,columns:["custrecord_pft_create_fccc_record"]});
					if (objPaymentFileType["custrecord_pft_create_fccc_record"]) {
						foreignCurrencyContractProcessing(context);
					}

				} 
				else 
				if (newrecordStatus == 3 || newrecordStatus == 5) { //Check to see if the Record Status is 3 (Rejected) or 5 (cancelled)
					//Delete the Files since the record is either Rejected or Cancelled
					if (oldCSVFileID  !== null && oldCSVFileID  > "")   { file.delete({ id:oldCSVFileID  });  }
					if (oldjsonFileID !== null && oldjsonFileID > "")   { file.delete({ id:oldjsonFileID });  }
					
					var old_pay_file_cre_generated_file = oldpayFileCreationRecord.getValue('custrecord_pay_file_cre_generated_file');
					var old_pay_file_async_xmit_file    = oldpayFileCreationRecord.getValue('custrecord_pay_file_async_xmit_file');
					var old_pay_file_suitelet_csv_file  = oldpayFileCreationRecord.getValue('custrecord_pay_file_suitelet_csv_file');
					if (old_pay_file_cre_generated_file !== null && old_pay_file_cre_generated_file > "") { file.delete({ id:old_pay_file_cre_generated_file });  }
					if (old_pay_file_async_xmit_file    !== null && old_pay_file_async_xmit_file    > "") { file.delete({ id:old_pay_file_async_xmit_file });     }
					if (old_pay_file_suitelet_csv_file  !== null && old_pay_file_suitelet_csv_file  > "") { file.delete({ id:old_pay_file_suitelet_csv_file });   }

				} 

			}
		}
		
		
		//====================================================================================================================================================================================
		//====================================================================================================================================================================================
		function foreignCurrencyContractProcessing(context) {
			
			var pfc = context.newRecord;
			
			var strFCCCList = pfc.getValue('custrecord_pay_file_fccc_groups_obj' );
			if (!strFCCCList || strFCCCList == "") { return; }
	    	log.debug("foreignCurrencyContractProcessing" ,"Processing  " + strFCCCList  );
			
	    	var objFCCCList = JSON.parse( strFCCCList );
	    	var objExchangeRecordToFccc = {};
			
			var objPFT = search.lookupFields({type:'customrecord_pay_file_type' ,id:pfc.getValue('custrecord_pay_file_type') 
                                          ,columns:["custrecord_pft_fccc_fx_contract_type" ,"custrecord_pft_payment_bank"]});
			
			var fcccStatus_WaitingForConfirmation = 4;
			var fcccRec   = null;
			var fcccRecId = 0;
			
		    for ( objFCCCName in objFCCCList ) {
		    	objFCCC = objFCCCList[objFCCCName];
		    	log.debug("foreignCurrencyContractProcessing" ,"objFCCC: " + JSON.stringify(objFCCC) );
		    	
				fcccRec = record.create({ type:'customrecord_fx_conv_contract' });
				
				fcccRec.setValue("custrecord_fx_conv_pmt_file_creation"  ,pfc.id );
				fcccRec.setValue("custrecord_fx_conv_ctr_date"           ,new Date() );
				fcccRec.setValue("name"                                  ,objFCCCName );
				fcccRec.setValue("custrecord_fx_conv_contract_type"      ,objPFT.custrecord_pft_fccc_fx_contract_type[0]["value"] );
				fcccRec.setValue("custrecord_fx_conv_bank"               ,objPFT.custrecord_pft_payment_bank[0]["value"] );
				fcccRec.setValue("custrecord_fx_conv_status"             ,fcccStatus_WaitingForConfirmation );
				fcccRec.setValue("custrecord_fx_conv_orig_currency"      ,objFCCC["currencyId"] );
				fcccRec.setValue("custrecord_fx_conv_converted_currency" ,objFCCC["settleCurrencyId"] );
				fcccRec.setValue("custrecord_fx_conv_orig_amount"        ,objFCCC["amount"] );
				fcccRecId = fcccRec.save();
				
				objFCCCList[objFCCCName]["fcccRecId"] = fcccRecId;
				log.debug("foreignCurrencyContractProcessing" ,"objFCCCList[objFCCCName]: " + JSON.stringify(objFCCCList[objFCCCName]));
				
				for (ix in objFCCC["exchangeRecords"]) { objExchangeRecordToFccc[objFCCC["exchangeRecords"][ix]] = fcccRecId }
				
//				var obj_exchangeRcd_fxCurrContract = {};
//				obj_exchangeRcd_fxCurrContract.exchangeRecordIdList = objFCCC["exchangeRecords"];
//				obj_exchangeRcd_fxCurrContract.fcccId = fcccRecId;
//				log.debug("foreignCurrencyContractProcessing" ,"obj_exchangeRcd_fxCurrContract: " + JSON.stringify(obj_exchangeRcd_fxCurrContract));
		    	
			} // for ( objFCCCName in objFCCCList )
		    
		    objFCCCList["objExchangeRecordToFccc"] = objExchangeRecordToFccc;
			
		    log.debug("foreignCurrencyContractProcessing" ,"objFCCCList: " + JSON.stringify(objFCCCList));
	    	
			var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
			mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
			mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : JSON.stringify(objFCCCList)
										  ,'custscript_mr_uf_function'          : 'exchangeRcd_fxCurrContract_atp1738'
										  ,'custscript_mr_uf_callingscript'     : scriptName
										  ,'custscript_mr_uf_record_type'       : "customrecord_acq_lot"
					                     };
			log.debug("foreignCurrencyContractProcessing" ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
			var mapReduceTaskId = mapReduceTask.submit();
			log.debug("foreignCurrencyContractProcessing" ,"map/reduce submitted " );
			
		}
		
		
		//====================================================================================================================================================================================
		//====================================================================================================================================================================================
		function fcccRecUpdateAndSave(fcccRec ,sourceCurrencyAmount ,exchangeRecords ,group) {
			log.debug("foreignCurrencyContractProcessing" ,"saving FCCC record  Group: " + group + ",     sourceCurrencyAmount:" + sourceCurrencyAmount + ",   exchangeRecords:" + JSON.stringify(exchangeRecords)  );

			fcccRec.setValue("custrecord_fx_conv_orig_amount" ,sourceCurrencyAmount);
			fcccRecId = fcccRec.save();
			
			//trigger map/reduce process to update exchange records with fcccRecId
			var obj_exchangeRcd_fxCurrContract = {};
			obj_exchangeRcd_fxCurrContract.exchangeRecordIdList = exchangeRecords;
			obj_exchangeRcd_fxCurrContract.fcccId = fcccRecId;
			
			var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
			mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
			mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : JSON.stringify(obj_exchangeRcd_fxCurrContract)
										  ,'custscript_mr_uf_function'          : 'exchangeRcd_fxCurrContract_atp1738'
										  ,'custscript_mr_uf_callingscript'     : scriptName
										  ,'custscript_mr_uf_record_type'       : "customrecord_acq_lot"
					                     };
			log.debug("foreignCurrencyContractProcessing" ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
			var mapReduceTaskId = mapReduceTask.submit();
			log.debug("foreignCurrencyContractProcessing" ,"map/reduce submitted " );
		}
		
		
		//====================================================================================================================================================================================
		//====================================================================================================================================================================================
		function getCurrencyISOCode(currencyID) {
			var returnValue = currencyID;
			
			try {
				var objFields = search.lookupFields({type:'currency' ,id:currencyID ,columns:["symbol" ]});
				returnValue = objFields.symbol;
			}
			catch(e) { log.error(scriptName + "--->foreignCurrencyContractProcessing" ,"Error in getCurrencyISOCode: " + e ); }
			
			return returnValue;
		}

		
		

		return { 
			afterSubmit: afterSubmit
		};
	});