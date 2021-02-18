function approvePayment() {
	var emailFields = new Array('custrecord_pri_qm_notes');
	var emailValues = new Array();
    var thisScriptName = "ACQ_LOT_DA_QM_Approve_Payment.js";
    var funcName = thisScriptName + "--->approvePayment ";
	var timestampDatetime;
	var startingTimestamp;
	var finishingTimestamp;
  
	try {
    
		nlapiLogExecution("DEBUG", funcName, "Starting");
		var MIN_USAGE_THRESHOLD = 1200;
		var SCRIPT_ID = "customscript_acq_lot_da_qm_aprv_pmt";
		var QUEUE_NAME = "ApprovePayment";
		var context = nlapiGetContext();
		nlapiLogExecution("DEBUG", funcName, "user=" + nlapiGetUser());
		var qEntry = getNextQueueEntry(QUEUE_NAME);
		var iCount = 0;
		
		while (qEntry !== null && typeof qEntry === 'object') {

			try {
				nlapiLogExecution("DEBUG", funcName, "Processing entry # " + ++iCount + ": " + JSON.stringify(qEntry) + "  - usage remaining: " + context.getRemainingUsage());
        
                funcName = thisScriptName + "--->ApprovePayment Q=" + qEntry.id;
            	
                var rcdPaymentProcess;
                try {
            		timestampDatetime = new Date();
            		startingTimestamp = timestampDatetime.getTime();
                    objParms = JSON.parse(qEntry.parms);
                    
                    var Complete = true;
        	        var ctr = 0;
    				var wasSuccessful = false;
    				var originalExchangeRcdStatus = 5;

                	var context = nlapiGetContext();
                	var deployment = context.getDeploymentId();
    				nlapiLogExecution("AUDIT" ,funcName, "ApprovePayment: " + objParms.id + ",   deployment:" + deployment);
                    
                	rcdPaymentProcess = nlapiLoadRecord("customrecord_paymentprocess" ,objParms.id );
		            var str11 = JSON.stringify(rcdPaymentProcess);
		            nlapiLogExecution("DEBUG", funcName,  "rcdPaymentProcess: " + str11);

            		var exchgId = rcdPaymentProcess.getFieldValue('custrecord_processpayment_exrecid');
            		var ExchangeRcdStatus_5f_PaymentProcessing = 16;
                	nlapiSubmitField('customrecord_acq_lot' ,exchgId ,'custrecord_acq_loth_zzz_zzz_acqstatus' ,ExchangeRcdStatus_5f_PaymentProcessing ,true);

                	var queueEntryMessage = "???";
                	var _data = rcdPaymentProcess.getFieldValue('custrecord_process_data'),
            		data = {},
            		output = {};
                	
        			data = JSON.parse(_data);    			
        			
        			originalExchangeRcdStatus = data.acqStatus;
    				nlapiLogExecution("DEBUG" ,funcName, "originalExchangeRcdStatus: " + originalExchangeRcdStatus);
        	        if (!originalExchangeRcdStatus) { originalExchangeRcdStatus = 5; nlapiLogExecution('DEBUG' ,funcName ,'Had to default originalExchangeRcdStatus '); }
        			
        			
        			//Short-circuit logic to handle reprocess workflow; this is for voided approvals that are are being approved again
        			if (data.reprocess){    			
        				nlapiLogExecution("DEBUG" ,funcName, "b4 reprocess " );
        				//output = reprocessPaymentApproval(data.id, data.fee || 'false');    			
        				output = reprocessPaymentApproval(rcdPaymentProcess);    			
        			}
        			else {    				
        				nlapiLogExecution("DEBUG" ,funcName, "b4 process " );
        				//output = processPaymentApproval(data.id, data.fee || 'false');    			
        				output = processPaymentApproval(rcdPaymentProcess);    			
        			}
        			            			 
            		timestampDatetime = new Date();
            		finishingTimestamp = timestampDatetime.getTime();
        			var str1 = JSON.stringify(output);
    				nlapiLogExecution("DEBUG" ,funcName, "output: " + str1);
        			if (output && output.error){    			 	
        				if (output.duplicate){    			 	
            				nlapiLogExecution("DEBUG" ,funcName, "duplicate " );
        					updateProcessPaymentStatus(rcdPaymentProcess, PROCESSSATUS.DUPLICATE); 
        					setProcessPaymentError(rcdPaymentProcess, "Record indentified as a duplicate");
        					queueEntryMessage = "Record indentified as a duplicate";
        				}    				 
        				else{    					
            				nlapiLogExecution("DEBUG" ,funcName, "failed " );
            				nlapiLogExecution("ERROR" ,funcName, 'ERROR IN PAYMENT PROCESSING: ' + JSON.stringify(output.msg) );
        					updateProcessPaymentStatus(rcdPaymentProcess, PROCESSSATUS.FAILED);   
        					setProcessPaymentError(rcdPaymentProcess, output.msg);
        					queueEntryMessage = 'ERROR IN PAYMENT PROCESSING: ' + JSON.stringify(output.msg);
        				}    			
        			}
        			else{    				
        				nlapiLogExecution("DEBUG" ,funcName, "success " );
        				updateProcessPaymentStatus(rcdPaymentProcess, PROCESSSATUS.SUCCESS); 
        				wasSuccessful = true;
                		var elapsedSecs = parseFloat((finishingTimestamp - startingTimestamp) / 1000).toFixed(1);
                		var long = ""; if (elapsedSecs > 25) { long = "  longRunningPayment"; }
                		
    					queueEntryMessage = "Record processed successfully " + JSON.stringify(elapsedSecs) + " seconds;  " + long;
        			}
    			
    				nlapiLogExecution("DEBUG" ,funcName, "markQueueEntryComplete " );
    				markQueueEntryComplete(qEntry.id, deployment + " - " + queueEntryMessage);      
                	
            	    //=============================================================================================
            	    // AFodor - ATP-254 - changes to prevent duplicate payments 
            	    // Processing failed, set exchange record status to what it was before Payment Processing
    				nlapiLogExecution("DEBUG" ,funcName, "wasSuccessful: " + wasSuccessful);
                    if (!wasSuccessful) {
                	    nlapiSubmitField('customrecord_acq_lot', exchgId, 'custrecord_acq_loth_zzz_zzz_acqstatus', originalExchangeRcdStatus, true);
                    }
                    else {
                        // For now even when the process is successful we will move the status back to what it was, which should be 5
                        // There is a desire to eventually move the status on to 6 after successful processing so I am leaving the logic here
                        // and adding this else condition. When the processing is modified to move the record to status 6 this else can be removed
                	    nlapiSubmitField('customrecord_acq_lot', exchgId, 'custrecord_acq_loth_zzz_zzz_acqstatus', originalExchangeRcdStatus, true);        
                    }
                    
            	    //=============================================================================================
                } 
                catch (e) {
                    // Got an error, couldn't complete it, so update the status
                	// In this case we will tell Queue Manager to abandon this Queue Entry
                	// If it is possible the error is of temporary nature we could just mark it incomplete
                	// and allow Queue Manager to try this Queue Entry again
                	nlapiLogExecution('ERROR' ,funcName, "Exception: " + e);                      
        			updateProcessPaymentStatus(rcdPaymentProcess, PROCESSSATUS.FAILED);
					setProcessPaymentError(rcdPaymentProcess, "Exception: " + e.message);
                	var objParmsAsString = JSON.stringify(objParms);
    				markQueueEntryComplete(qEntry.id,  deployment + " - " + "Exception in Queue Manager script: " + e.message);      
               }   // End of try
				
				// Here we will do a search to look for ApprovePayment queue entries that are not complete
				// The process begins with an ApprovePaymentsRequest queue entry which spawns an ApprovePayment queue entry
				// for each requested exchange record. Each ApprovePayment entry contains as part of its parms the internal id
				// of the originating ApprovePaymentsRequest queue entry, so we can find them all using that.
				// If there are no remaining ApprovePayment queue entries that have not been marked complete then we send an email
				// to the user informing them that processing has finished
				var RequestQueueId = '"requestQueueId":' + objParms.requestQueueId.toString();
				var filters = new Array();
		        filters[0] = new nlobjSearchFilter('custrecord_pri_qm_parameters', null, 'contains', RequestQueueId);
		        filters[1] = new nlobjSearchFilter('custrecord_pri_qm_complete'   ,null ,'is'       ,"F");
		    
		        var columns = new Array();
		        columns[0] = new nlobjSearchColumn('internalid');

		        var searchresults = nlapiSearchRecord('customrecord_pri_qm_queue', null, filters, columns);
		        
		        if (searchresults) { nlapiLogExecution("DEBUG" ,funcName, "searchresults.length: " + searchresults.length ); }
        
		        if (!searchresults) {
		        	var sendEmail = false;
		        	var requestCompleteFields = ['custrecord_pri_qm_parameters', 'custrecord_pri_qm_notes' ,'created'];

		            var objFieldValues  = nlapiLookupField("customrecord_pri_qm_queue" ,objParms.requestQueueId ,requestCompleteFields);
		            
		            if (!(objFieldValues.custrecord_pri_qm_notes > "")) {//format.timezone
		            	var adjustedDatetime = timestampDatetime;
	            		adjustedTimestamp = adjustedDatetime.getTime();
		            	adjustedDatetime.setTime(adjustedTimestamp + (1*60*60*1000));
	            		adjustedTimestamp = adjustedDatetime.getTime();
			    		var objDateCreated = nlapiStringToDate(objFieldValues.created, 'datetimetz');
	            		var createdTimestamp = objDateCreated.getTime();
                		var elapsedMinutes = parseFloat( (adjustedTimestamp - createdTimestamp) / 60000).toFixed(1);
			        	emailValues[0] = "ApprovePaymentsRequest complete >" + qEntry.id + "<   " + elapsedMinutes + " minutes ";
		        		var updId = nlapiSubmitField("customrecord_pri_qm_queue", objParms.requestQueueId, emailFields, emailValues); 
		            }
		        	
		        	nlapiLogExecution("DEBUG" ,funcName, "Last QueueEntry is Complete " ); 
		            var objFieldValues = nlapiLookupField("customrecord_pri_qm_queue" ,objParms.requestQueueId ,requestCompleteFields);
		            
//		            if (objFieldValues.custrecord_pri_qm_notes.indexOf(">" + qEntry.id + "<") > -1) { sendEmail = true; }
//		            
//		            if (sendEmail) {
//			        	nlapiLogExecution("AUDIT" ,funcName, "Sending email" ); 
//			            
//			            var objRequestParms = JSON.parse(objFieldValues.custrecord_pri_qm_parameters);
//			            
//			            var creProfile = new CREProfile(20);
//			            creProfile.Translate(objParms.requestQueueId);
//
//			            var translatedValue = creProfile.fields.BodyMessageIntroduction.translatedValue;
//			            
//			            var exchangeRecordsText = "";
//			            for (var ix = 0; ix < objRequestParms.exchangeRecordList.length; ix++){ 
//			            	var objExchangeRecordInfo = objRequestParms.exchangeRecordList[ix];
//			            	exchangeRecordsText = exchangeRecordsText + objExchangeRecordInfo.id + "<br/>";
//			            }
//			            
//			            var translatedValueNew = translatedValue.replace("[0]",exchangeRecordsText);
//			            
//			            creProfile.fields.BodyMessageIntroduction.translatedValue = translatedValueNew;
//				        
//			            var userEmail = nlapiLookupField("employee" ,objParms.user ,"email");
//			            if (userEmail) { creProfile.fields.Recipient.translatedValue = userEmail; }
//
//						nlapiLogExecution("DEBUG", funcName, "b4 CREPROFILE");
//			            creProfile.Execute(false);
//						nlapiLogExecution("DEBUG", funcName, "aft CREPROFILE");
//		            }
		            
					nlapiLogExecution("DEBUG", funcName, "b4 checkForDupes");
		        	checkForDupes(objParms.user);
					nlapiLogExecution("DEBUG", funcName, "aft checkForDupes");
		            
		        }
      
			
			} catch (e) {
				// couldn't complete it, so update the status and let it try again
				nlapiLogExecution("ERROR", funcName, "Exception: " + e.message);
				abandonQueueEntry(qEntry.id, qEntry.parms, "ERROR: " + e.message);
			}
                
			nlapiLogExecution("DEBUG", funcName, "b4 min usage");
      
			if (context.getRemainingUsage() < MIN_USAGE_THRESHOLD) {
				nlapiLogExecution("DEBUG", funcName, "Running out of resources and attempting to reschedule");
				// this code is optional; it will attempt to re-schedule itself; or you can rely on NS if you have your script already scheduled to run every xx minutes
				try {
					nlapiScheduleScript(SCRIPT_ID);
					nlapiLogExecution("AUDIT", funcName, "Script rescheduled");
        
				} catch (e1) {          
					nlapiLogExecution("ERROR", funcName, "Failed to reschedule script: " + e1.message);        
				}        
        
				return;      
			}
          
			nlapiLogExecution("DEBUG", funcName, "b4 getnext");
			qEntry = getNextQueueEntry(QUEUE_NAME);       
			nlapiLogExecution("DEBUG", funcName, "aft getnext");
		}          

		nlapiLogExecution("DEBUG", funcName, "aft loop");

        
  
	} catch (e) { nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));  	}
    
}

//===========================================================================================================================
//===========================================================================================================================
function checkForDupes(user) {
	var mySearch = nlapiLoadSearch('transaction', 'customsearch14610');
	var mySearchRan = mySearch.runSearch();
	var exRecEmail = '',
		resultCount = 0;
	var myColumns = mySearchRan.getColumns();
	if(myColumns != null) {
		for(var i = 0; i < myColumns.length; i++) { // create header in csv
			var endChar = ',';
			if(i == myColumns.length-1) {
				endChar = '\n'
			}
			exRecEmail += myColumns[i].label + endChar;
		}
		mySearchRan.forEachResult(function(searchResult) {
			resultCount++;
			for(var i = 0; i < myColumns.length; i++) { // add data to csv
				var endChar = ',';
				if(i == myColumns.length-1) {
					endChar = '\n'
				}
				var result = searchResult.getText(myColumns[i]) || searchResult.getValue(myColumns[i]);
				exRecEmail += result + endChar;
			}
			return true;
		});
		if(resultCount > 0) {
			var exRecFile = nlapiCreateFile('duplicateRefunds.csv', 'CSV', exRecEmail)
			nlapiSendEmail(747289, user, 
				'Alert - Duplicate Acquiom Refund Detected', 
				'See attached file for Exchange Records which have Duplicate Refunds.',
				['analysts@srsacquiom.com', 'meckberg@srsacquiom.com'], null, null,
				exRecFile
			);
			nlapiLogExecution('AUDIT' ,"checkForDupes" ,'There are duplicates. Sending email.');
		}
	}
}