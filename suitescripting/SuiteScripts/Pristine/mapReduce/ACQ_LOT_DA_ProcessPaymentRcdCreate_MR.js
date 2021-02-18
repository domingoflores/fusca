/**
* @NApiVersion 2.x
* @NScriptType MapReduceScript
* @NModuleScope SameAccount
*/

define(['N/runtime' ,'N/record' ,'N/error' ,'N/search' ,'N/file' ,'N/task'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ,'/.bundle/132118/PRI_QM_Engine' 
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ],
            
      function(runtime ,record ,error ,search ,file ,task 
    		  ,priLibrary 
    		  ,qmEngine
    		  ,appSettings 
    		  ) {

      var scriptName = "ACQ_LOT_DA_ProcessPaymentRcdCreate_MR.js-->";
      var PROCESSSATUS = {NOTSUPPLIED: 'NOTSUPPLIED', QUEUED: 'QUEUED', PROCESSING: 'PROCESSING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', DUPLICATE: 'DUPLICATE', REAPPROVE: 'REAPPROVE'};

      function getInputData() {

            var funcName = scriptName + "getInputData";

            log.debug(funcName, "Process is starting");

            var objParmsString = runtime.getCurrentScript().getParameter({ name:'custscript_mr_acq_obj_parms'    });
            log.debug(funcName, "objParmsString: " + objParmsString );
            var objParms = JSON.parse(objParmsString);
    	    
            var internalIdArray = [];

    	    objParms.exchangeRecordList.forEach(
    	    function (objExchangeRcd) {
    	    	internalIdArray.push(objExchangeRcd.id);
    	    });
            
                	    
            log.debug(funcName, "internalIdArray: " + JSON.stringify(internalIdArray) );
    	        	    
    		var arrColumns              = new Array();
    		var col_InternalId          = search.createColumn({ "name":"internalid"  });
    		arrColumns.push(col_InternalId);
    		var arrFilters   = [         ['isinactive'    ,'IS'       ,false ]
    		                    ,'AND'  ,['internalid'    ,'ANYOF'    ,internalIdArray ]
    	                       ];
    		var searchMapReduceObj = search.create({'type':'customrecord_acq_lot'
    		                                           ,'filters':arrFilters 
    	                                               ,'columns':arrColumns 	       });
                              
            return searchMapReduceObj;        
      }
      
      
      //================================================================================================================================
      //================================================================================================================================
      function map(context) {
    	  var funcName = scriptName + "map ";
    	  var success = "success";
    	  var recordId = null;

    	  var obj = JSON.parse(context.value);
            
    		  /* {"type":"mapreduce.MapContext","isRestarted":false,"executionNo":1,"key":"644590"
    		    ,"value":"{\"recordType\":\"customrecord_acq_lot\"
    		              ,\"id\":\"644590\"
    		              ,\"values\":{\"internalid\":{\"value\":\"644590\",\"text\":\"644590\"}
    		              }"\
    		     }            
    		  */
            
    	  recordId = obj.id;
    	  var currDatetime = new Date();
    	  funcName = funcName + "id:" + recordId + " time:" + currDatetime.getTime();
          var objParmsString = runtime.getCurrentScript().getParameter({ name:'custscript_mr_acq_obj_parms'    });
          var objParms = JSON.parse(objParmsString);
    		  
  		  try {
				
  			  var processThisRecord = checkIfRecordAlreadyProcessing(recordId);
				
  			  if (processThisRecord) {
  				  
  				  var objExchangeRecordParms = {};
  				  for (var i=0; i<objParms.exchangeRecordList.length; i++) {
  					  if (objParms.exchangeRecordList[i].id == recordId) { objExchangeRecordParms = objParms.exchangeRecordList[i]; break; }
  				  }

  				  log.debug(funcName ,"objExchangeRecordParms: " + JSON.stringify(objExchangeRecordParms));
  				  
  				  var rcdPaymentProcess = record.create({type:'customrecord_paymentprocess' ,isDynamic:true });
  				
  				  var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:recordId
                                                                 ,columns: ["internalid" 
                                                              	         ,"custrecord_acq_loth_4_de1_lotpaymethod" 
                                                              	         ,"custrecord_acq_loth_zzz_zzz_shareholder" 
                                                                  	     ,"custrecord_acq_loth_5a_de1_bankacctnum" 
                                                                  	     ,"custrecord_acq_loth_5a_de1_abaswiftnum" 
                                                                  	     ,"custrecord_acq_loth_5a_de1_bankaccttype" 
                                                               	         ,"custrecord_acq_loth_zzz_zzz_shareholder.entityid"
//                                                               	         ,"custrecord_exrec_payment_instruction"
                                                              	         ]});
  				  log.debug(funcName ,"objExchangeRecordFields: " + JSON.stringify(objExchangeRecordParms));
  				  var paymentMethod = objExchangeRecordFields.custrecord_acq_loth_4_de1_lotpaymethod[0].value;
  				  
//  				  var objPaymentInstructionFields;
//  				  var PaymentInstructionProcessingObsolete = appSettings.readAppSetting("Payment Instruction", "Apply PI To Exchange When Tagged");
//  				  if (!PaymentInstructionProcessingObsolete) { // ATP-1366 
//  	  				  if (objExchangeRecordFields.custrecord_exrec_payment_instruction[0]) {
//  	  	  				  var objPaymentInstructionFields = search.lookupFields({type:'customrecord_paymt_instr' ,id:objExchangeRecordFields.custrecord_exrec_payment_instruction[0].value
//  	                                                                         ,columns: ["internalid" 
//  	                                                                        	       ,"custrecord_pi_paymethod"
//  	                 	                                                               ,"custrecord_pi_ep_bankacctnum" 
//  	                   	                                                               ,"custrecord_pi_ep_abarouting" 
//  	                   	                                                               ,"custrecord_pi_ep_achaccttype" 
//  	                       	                                                           ]});
//  	  	  				  log.debug(funcName ,"objPaymentInstructionFields: " + JSON.stringify(objPaymentInstructionFields));
//  	  	  				  paymentMethod = objPaymentInstructionFields.custrecord_pi_paymethod[0].value;
//  	  	  			  }
//  				  } // ATP-1366
//	  			  if (objExchangeRecordFields.custrecord_exrec_payment_instruction[0]) {
//
//	  				  var objPaymentInstructionFields = search.lookupFields({type:'customrecord_paymt_instr' ,id:objExchangeRecordFields.custrecord_exrec_payment_instruction[0].value
//  	                                                                     ,columns: ["internalid" 
//  	                                                                        	   ,"custrecord_pi_paymethod"
//  	                 	                                                           ,"custrecord_pi_ep_bankacctnum" 
//  	                   	                                                           ,"custrecord_pi_ep_abarouting" 
//  	                   	                                                           ,"custrecord_pi_ep_achaccttype" 
//  	                       	                                                       ]});
//	  				  log.debug(funcName ,"objPaymentInstructionFields: " + JSON.stringify(objPaymentInstructionFields));
//	  				  paymentMethod = objPaymentInstructionFields.custrecord_pi_paymethod[0].value;
//	  			  }

					
  				  var paymentMethodValues = {paymentMethod_ACH:"1" ,paymentMethod_AES_ACH:"7"};
//  				  if (objExchangeRecordFields.custrecord_exrec_payment_instruction[0]) {
//  					  paymentMethod = "";
//  				  }
//  				  var objPiracle = null;
//  				  if (paymentMethod == paymentMethodValues.paymentMethod_ACH || paymentMethod == paymentMethodValues.paymentMethod_AES_ACH) {
//  					  objPiracle = piracleRecordProcessing(objExchangeRecordFields ,objPaymentInstructionFields);
//  					  objPiracle = piracleRecordProcessing(objExchangeRecordFields);
//  					  log.debug(funcName, 'objPiracle returned: ' + JSON.stringify(objPiracle) );
//  				  }
    				
  				  rcdPaymentProcess.setValue('custrecord_process_status'         , PROCESSSATUS.QUEUED);
  				  rcdPaymentProcess.setValue('custrecord_processpayment_exrecid' , recordId);
  				  rcdPaymentProcess.setValue('custrecord_process_batch_number'   , 0);
  				  rcdPaymentProcess.setValue('custrecord_process_type'           , objParms.type || PROCESSSATUS.NOTSUPPLIED);
  				  rcdPaymentProcess.setValue('custrecord_process_uid'            , objParms.user || -4);//-4 because that is what NetSuite returns if no user.
  				  objExchangeRecordParms.acqStatus = status;
  				  rcdPaymentProcess.setValue('custrecord_process_data'           , JSON.stringify(objExchangeRecordParms));

//  				  if (objPiracle) {
//  					  rcdPaymentProcess.setValue('custrecord_process_piracle_object' , JSON.stringify(objPiracle) );
//  				  }
  				  
  				  if (objParms.paymentsEffectiveDate > "") { 
  					  var dateParts = objParms.paymentsEffectiveDate.split("/");
  					  var month = parseInt(dateParts[0]) - 1;
  					  var effectiveDate = new Date(dateParts[2] ,month ,dateParts[1]);
  					  rcdPaymentProcess.setValue('custrecord_process_effective_date' ,effectiveDate);
  				  }

  				  var rcdId = rcdPaymentProcess.save();

  				  //Now Queue up this individual record to be processed by another queue manager script            				
  				  var QManagerParm = { "id":rcdId ,"exchangeId":objExchangeRecordParms.id ,"requestQueueId":objParms.requestQueueId ,"user":objParms.user };                			
  				  var intQid = qmEngine.addQueueEntry( "ApprovePayment" ,QManagerParm ,null ,true ,'customscript_acq_lot_da_qm_aprv_pmt');
					
    			}
				
  		  }
  		  catch(err){
				log.error(funcName, 'ERROR CREATING PROCESSPAYMENT RECORD (IGNORE)   ' + JSON.stringify(err));
				success = "Failed"; 
		  }
            
		  context.write(recordId, success);                   
      }
      
      
      //=================================================================================================================================
      //=================================================================================================================================
      function checkIfRecordAlreadyProcessing(id) {
          var funcName = "checkIfRecordAlreadyProcessing";
      	var canBeProcessed = false;
      	
			try { canBeProcessed = setRecordToProcessing(id); }
			catch (saveException) {
				if (saveException.name == "RCRD_HAS_BEEN_CHANGED") {
					// try once more just in case
					try { canBeProcessed = setRecordToProcessing(id); }
					catch(saveException2) { log.error(funcName, "Exception setting exchange rcd status to queued(5e):  " + id + ",  message:" + saveException2.message ); }
				}
				else {
	                log.error(funcName, "Exception setting exchange rcd status to queued(5e):  " + id + ",  message:" + saveException.message );         					
				}
			} // catch
      	
      	return canBeProcessed;
      }
 
      
      //=================================================================================================================================
      //=================================================================================================================================
      function setRecordToProcessing(id) {
			var funcName = "setRecordToProcessing";
        
			var rcdExchange = record.load({ type:'customrecord_acq_lot' ,id:id });
			status = rcdExchange.getValue("custrecord_acq_loth_zzz_zzz_acqstatus"); 
			if (status == 15 || status == 16) {
              log.debug(funcName, "Exchange Record already queued, skipped:  " + id + ",  status:" + status );         					
			}
			else {
				rcdExchange.setValue("custrecord_acq_loth_zzz_zzz_acqstatus",15);
				rcdExchange.save();
				return true;
			}
      	return false;
      }


      //=================================================================================================================================
      //=================================================================================================================================
//      function piracleRecordProcessing(objExchangeRecordFields ,objPaymentInstructionFields) {
      function piracleRecordProcessing(objExchangeRecordFields) {
        var funcName = scriptName + "piracleRecordProcessing";
      	var piracle = null;
      	
      	try {
      		
      		var shareholder        = objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value;
      		
//      		var newAccountNum;
//      		var newRoutingNum;
//      		var newBankAccountType;
//      		if (objPaymentInstructionFields) { // we have a payment instruction in play, use those fields
//          		log.debug(funcName, "objPaymentInstructionFields" );
//          		newAccountNum      = objPaymentInstructionFields.custrecord_pi_ep_bankacctnum;
//          		newRoutingNum      = objPaymentInstructionFields.custrecord_pi_ep_abarouting;
//          		newBankAccountType = objPaymentInstructionFields.custrecord_pi_ep_achaccttype[0].value;	
//      		}
//      		else {
//          		newAccountNum      = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankacctnum;
//          		newRoutingNum      = objExchangeRecordFields.custrecord_acq_loth_5a_de1_abaswiftnum;
//          		newBankAccountType = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankaccttype[0].value;      			
//      		}

      		var newAccountNum      = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankacctnum;
      		var newRoutingNum      = objExchangeRecordFields.custrecord_acq_loth_5a_de1_abaswiftnum;
      		var newBankAccountType = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankaccttype[0].value;
      		log.debug(funcName, "newAccountNum" + newAccountNum + ",    newRoutingNum: " + newRoutingNum + ",    newBankAccountType: " + newBankAccountType );
      		
      		var arrColumns = new Array();
      		var col_internalid                = search.createColumn({ name:'internalid'  });
      		var col_pp_ach_entity             = search.createColumn({ name:'custrecord_pp_ach_entity'  });
      		var col_pp_ach_account_number     = search.createColumn({ name:'custrecord_pp_ach_account_number'    ,sort:'ASC' });
      		var col_pp_ach_routing_number     = search.createColumn({ name:'custrecord_pp_ach_routing_number'    ,sort:'ASC' });
      		var col_pp_ach_transaction_code   = search.createColumn({ name:'custrecord_pp_ach_transaction_code'  ,sort:'ASC' });
      		arrColumns.push(col_internalid);
      		arrColumns.push(col_pp_ach_entity);
      		arrColumns.push(col_pp_ach_account_number);
      		arrColumns.push(col_pp_ach_routing_number);
      		arrColumns.push(col_pp_ach_transaction_code);
      		
      		var arrFilters   = [         ['custrecord_pp_ach_entity'          ,'ANYOF'              ,[shareholder] ]
      	                       ];
      		var searchAchAccountObj = search.create({'type':'customrecord_pp_ach_account'
      		                                     ,'filters':arrFilters 
      	                                         ,'columns':arrColumns 	       });
      		var searchAchAccount        = searchAchAccountObj.run();
      		var searchAchAccountResults = searchAchAccount.getRange(0,1000);					
      		
      		for (var i = 0; i < searchAchAccountResults.length; i++) {
      			var result = searchAchAccountResults[i];

      			if(result.getValue('custrecord_pp_ach_account_number') == newAccountNum && result.getValue('custrecord_pp_ach_routing_number') == newRoutingNum ) {
      				resultAcctType = result.getValue('custrecord_pp_ach_transaction_code');
      				
      				if(((newBankAccountType == 1 || newBankAccountType == 3) && resultAcctType == 7) || ((newBankAccountType == 2 || newBankAccountType == 4) && resultAcctType == 8)) {
      					piracle = {};
      					piracle.id          = result.getValue('internalid');
      					piracle.accountType = result.getValue('custrecord_pp_ach_transaction_code');
      					piracle.accountNumb = result.getValue('custrecord_pp_ach_account_number');
      					piracle.routingNUmb = result.getValue('custrecord_pp_ach_routing_number');
      					break;
      				}
      			}
      		} // for (var i = 0; i < searchAchAccountResults.length; i++)
      		
			if (piracle) { return piracle; }
      	}
      	catch(e) {
      		log.error(funcName, e.message);
      		if (!piracle) { piracle = {}; piracle.id = null; }
			piracle.error = true;
			piracle.errorMessage = 'Problem in Piracle search processing.  Error: ' + e.message;
			return piracle;
      	}


			
			// if we didn't find one above then we will create a new one
	    try {
			piracle = {};
				
			var objRcd = record.create({ type:"customrecord_pp_ach_account" ,isDynamic:false });
			objRcd.setValue("name"                                  ,objExchangeRecordFields["custrecord_acq_loth_zzz_zzz_shareholder.entityid"] );
			objRcd.setValue("custrecord_pp_ach_entity"              ,shareholder );
			objRcd.setValue("custrecord_pp_ach_account_number"      ,newAccountNum );
			objRcd.setValue("custrecord_pp_ach_routing_number"      ,newRoutingNum );
			objRcd.setValue("custrecord_pp_ach_deposit_withdrawal"  ,1 );
				

			if (newBankAccountType == 1 || newBankAccountType == 3) { // 1: Checking  3: Commercial Checking
				objRcd.setValue("custrecord_pp_ach_transaction_code"  ,7 );
			} 
			else 
			if (newBankAccountType == 2 || newBankAccountType == 4) { // 2: Savings  4: Commercial Savings
				objRcd.setValue("custrecord_pp_ach_transaction_code"  ,8 );
			}

			objRcd.setValue("custrecord_pp_ach_is_primary"  ,true );
			objRcd.setValue("custrecord_pp_ach_sec_code"    ,4 );

			try {
				piracle.id = objRcd.save();
				piracle.accountType = objRcd.getValue("custrecord_pp_ach_transaction_code");
				piracle.accountNumb = newAccountNum;
				piracle.routingNUmb = newRoutingNum;
			} 
			catch (e) {
	        	log.error(funcName, 'Problem submitting the CREATE of the Piracle ACH record.  Error: ' + e.message);

				piracle.id = null;
				piracle.error = true;
				piracle.errorMessage = 'Problem submitting the CREATE of the Piracle ACH record.  Error: ' + e.message;

				return piracle;
			}

      		log.debug(funcName, 'piracle 1: ' + JSON.stringify(piracle) );
				//===========================================================================================
				

      		log.debug(funcName, 'piracle 2: ' + JSON.stringify(piracle) );
			return piracle;

      	}
      	catch(e) {
      		log.error(funcName, e.message);
      		if (!piracle) { piracle = {}; piracle.id = null; }
			piracle.error = true;
			piracle.errorMessage = 'Problem in Piracle create processing.  Error: ' + e.message;
		    return piracle;
      	}
      	
  		log.debug(funcName, 'piracle 3: ' + JSON.stringify(piracle) );
      	return piracle;
      	
      }
      
      
      
      
      
      //================================================================================================================================
      //================================================================================================================================
      function summarize(summary) {
    	  var funcName = scriptName + "summarize";

    	  log.debug(funcName, summary); 
      
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	  if (errorMsgs && errorMsgs.length > 0) 
    		  log.error(funcName, JSON.stringify(errorMsgs));

    	  var exchangeRecordsProcessed = 0;
    	  var successCount = 0;
      
    	  summary.output.iterator().each(function(key, value) { 
    		  exchangeRecordsProcessed++;  
    		  if (value == "success") { successCount++; } 
    		  return true;
    		  });

    	  log.debug(funcName, "successCount: " + successCount); 
    	  var failureCount = exchangeRecordsProcessed - successCount;
    	  
    	  log.audit(funcName, exchangeRecordsProcessed + " Exchange Records were processed for submission to Payment Processing."); 
    	  if (successCount == exchangeRecordsProcessed) { log.audit(funcName, "All Exchange Records were succesfully submitted for Payment Processing."); }
    	  else                                          { log.audit(funcName, failureCount + " Exchange Records were NOT succesfully submitted for Payment Processing."); } 

    	  summary.output.iterator().each(function(key, value) { log.audit(funcName, key + " - Exchange record processing: " + value); return true; });
    	  
      }


    //================================================================================================================================
    //================================================================================================================================
    return { getInputData: getInputData
                     ,map: map
               ,summarize: summarize
           };

}
);