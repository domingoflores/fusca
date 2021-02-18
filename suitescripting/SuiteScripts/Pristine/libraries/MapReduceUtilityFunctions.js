/**
* @NApiVersion 2.x
* @NModuleScope public
*/

define(['N/runtime' ,'N/record' ,'N/error' ,'N/search' ,'N/file' ,'N/task' ,'N/url' ,'N/https'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	   ,'/SuiteScripts/Pristine/libraries/TaxForm_Library.js'
	   ,'/SuiteScripts/Pristine/libraries/TaxForm_Library_ServerSideOnly.js'
	   ],
            
function(runtime ,record ,error ,search ,file ,task ,url ,https
		,priLibrary 
		,appSettings 
		,srsConstants
		,tfLibrary
		,tfLibraryServer
		) {

var scriptName = "MapReduceUtilityFunctions.js-->";

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// NOTES ON USAGE
//
// To implement additional functionality into Map/Reduce Utility Functions script it is only necessary to add your function  
// here in this library. The main function will the one that is executed in the Map phase of the map reduce. 
//
// It will also require a function to be executed in the Get Input Phase. That function name will start with "gid_" and it
// will return the search filters for the Get Input search object as an array of filters. That function can also do any 
// additional up front work that might be necessary before the Map phase.
// 
// There is also the option to also have a function to be executed in the summarize phase of the Map/Reduce. 
// That function is not required and its name should start with "sum_". This function can do any work necessary after
// all of the Map phase processing has been completed. It receives the summary object as an argument and can interrogate
// the results to determine what kind of processing it needs to do. 
//
// These two functions are communicated to the Map/Reduce script in an object returned from the main function.
// return { getInputDataFunction:"gid_setCustomerRefund" ,summarizeFunction:"sum_setCustomerRefund" };
//
//
//  WARNING   WARNING   WARNING   WARNING   WARNING   WARNING   WARNING   WARNING   WARNING   WARNING
//
//  This script should not used for processes that might be executed at high frequencies, let's say multiple times a minute.
//  Bear in mind that if it is executed too frequently there becomes the possibility that the system will run out of 
//  available deployments and your process will not be executed.
//
//
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
      
var availableFunctions = {
		
		  
		
		  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
		  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
		  // taxFormBatchDetailRequest	
		  //======================================================================================================================
		  //======================================================================================================================
		  "gid_taxFormBatchDetailRequest": 
		  function (jsonObject) {
			  var funcName = scriptName + "gid_taxFormBatchDetailRequest";

			  var objSublistAction = JSON.parse(jsonObject)
			  
			  var taxFormBatchStatus_ProcessingInProgress      = "10";
			  var objValues = {};
			  objValues["custrecord_txfm_batch_status"]        = taxFormBatchStatus_ProcessingInProgress; 
			  record.submitFields({ type:"customrecord_tax_form_batch" ,id:objSublistAction["taxFormBatchId"] ,values:objValues });
			  
	  		  var arrFilters   = [         ['internalid'    ,'ANYOF'    ,objSublistAction.detailArray ]
	                             ];
	  		  return arrFilters;
		  } // end gid_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			
		  , // COMMA between functions in property list
					
		  //======================================================================================================================
		  //======================================================================================================================
		  "sum_taxFormBatchDetailRequest": 
		  function (jsonObject ,summary) {
			  var funcName = scriptName + "sum_taxFormBatchDetailRequest";
			  
			  var objSublistAction = JSON.parse(jsonObject);
			  var length = objSublistAction["detailArray"].length;
			  objSublistAction["detailArray"] = length.toString() + " records requested";
			  var processingNotes = "Request processed: " + JSON.stringify(objSublistAction, null, "\t");				  
			  
			  var taxFormBatchStatus_ProcessingFailed = "9";
			  var ResetBatchStatus = objSublistAction["taxFormBatchStatus"];
	    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
			  
			  if (errorMsgs.length > 0) {
				  log.error(funcName ,errorMsgs.length + " Errors were encountered during processing.    " + JSON.stringify(errorMsgs));
				  //throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
				  ResetBatchStatus = taxFormBatchStatus_ProcessingFailed;
				  processingNotes = "Request processing completed with errors: " + JSON.stringify(objSublistAction, null, "\t");
			  }
			  
			  if ((objSublistAction.action === "revise")
				   ||
				  (objSublistAction.action === "correct"))
			  {
				  if (parseInt(ResetBatchStatus,10) !== parseInt(srsConstants["Tax Form Batch Status"]["Submit Failed"],10))
				  {
				 
					  var request_options = {};
	      	  		  request_options.taxformbatch = objSublistAction["taxFormBatchId"];
	      	  		  request_options.subslistAction = objSublistAction;
	      	  		  request_options.ResetBatchStatus = objSublistAction["ResetBatchStatus"]; //pass along status
	      	  		  request_options.processingNotes = processingNotes;
	      	  		  var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
	      	  		  mapReduceTask.scriptId     = "customscript_tax_form_cert_mr";
	      	  		  mapReduceTask.params       = {"custscript_mr_taxform_cert_json_object": JSON.stringify(request_options)};
	      	  		  var mapReduceTaskId = mapReduceTask.submit();
	      	  		  return; //map reduce will update statistics so we can exit now
				  }
	    	  }
			  //update statistics when process failed; or when process succeeded but this is not revise or correct 
			  tfLibrary.taxFormBatchUpdateStatistics(objSublistAction["taxFormBatchId"] ,ResetBatchStatus ,processingNotes);
			  
		      log.audit(funcName ,"'Tax Form Details' request completed: " + jsonObject );

		  } // end sum_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			
		  , // COMMA between functions in property list
		  
		  //======================================================================================================================
		  //======================================================================================================================
		  "taxFormBatchDetailRequest": 
		  function (recordId ,jsonObject ,returnPropertiesObject) {
			  if (returnPropertiesObject) { return { getInputDataFunction:"gid_taxFormBatchDetailRequest" ,summarizeFunction:"sum_taxFormBatchDetailRequest" }; }
			  var funcName = scriptName + "taxFormBatchDetailRequest->" + recordId;
			  var objReturn = {success:false ,message:""} 
				
			  fromTry:
			  try {
				  var objSublistAction = JSON.parse(jsonObject)

				  log.debug(funcName, "Processing action: " + objSublistAction.action + ",    recordId: " + recordId );
				  var returnValue; 
				  
				  switch (objSublistAction.action) {
				  case "remove":
					  returnValue = taxFormBatchDetailRequestREMOVE(objSublistAction ,recordId);
					  break;
				  case "revise":
					  returnValue = taxFormBatchDetailRequestREVISE(objSublistAction ,recordId);
					  break;
				  case "correct":
					  returnValue = taxFormBatchDetailRequestCORRECT(objSublistAction ,recordId);
					  break;				  
				  case "generate":
					  returnValue = taxFormBatchDetailRequestGENERATE(objSublistAction ,recordId);
					  break;				  
				  case "recreate":
					  returnValue = taxFormBatchDetailRequestRECREATE(objSublistAction ,recordId);
					  break;				  
				  }

				  if (returnValue == "success") { objReturn.success = true; }
				  
				  objReturn.message = returnValue;
			  }
			  catch(e) {
				  log.error(funcName, "exception: " + e );
				  var errorObj = error.create({ name:'DUMMY' ,message:'dummmy error' ,notifyOff:false });
				  log.debug(funcName, "errorObj: " + JSON.stringify(errorObj) );
				  objReturn.message = e.message;
			  }
						      
			  return objReturn;
			  
			  //======================================================================================================================
			  //======================================================================================================================
			  function taxFormBatchDetailRequestREMOVE(objSublistAction ,recordId) { 
				  var funcName = scriptName + "taxFormBatchDetailRequestREMOVE->" + recordId;
				  log.debug(funcName ,JSON.stringify(objSublistAction) );
				  
				  var taxFormBatchStatus_Submitted               = "2";
				  var taxFormBatchStatus_FiledWithIRS            = "4";
				  var taxFormBatchStatus_CorrectionPending       = "5";
				  
				  var taxFormBatchDetailStatus_Draft             = "1";
				  var taxFormBatchDetailStatus_Removed           = "2";
				  var taxFormBatchDetailStatus_Inactive          = "5";
				  
				  var taxFormBatchDetailFormVersion_Corrected    = "3";
				  
				  var taxFormBatchDetailCorrectionType_1         = "1";
				  				  
				  var objtaxFormBatchDetailFields = search.lookupFields({type:"customrecord_tax_form_batch_detail" ,id:recordId   
                                                                     ,columns:["custrecord_txfm_detail_document" 
                  	                                                          ,"custrecord_txfm_detail_deal"
                  	                                                          ,"custrecord_txfm_detail_shareholder"
                  	                                                          ,"custrecord_txfm_detail_batch_status"
                  	                                                          ]});

				  var txfm_batch_status = objSublistAction["taxFormBatchStatus"];
				  				  
				  if ( !( txfm_batch_status == taxFormBatchStatus_Submitted ||  txfm_batch_status == taxFormBatchStatus_FiledWithIRS ||  txfm_batch_status == taxFormBatchStatus_CorrectionPending ) ) {
					  log.error(funcName, "Tax Form Batch Status is invalid for this process -  objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   Tax Form Batch Status: " + txfm_batch_status); 
					  return "success";
				  }
				  
				  try {
					  var txfm_detail_status = taxFormBatchDetailStatus_Removed;
					  if ( txfm_batch_status == taxFormBatchStatus_FiledWithIRS ||  txfm_batch_status == taxFormBatchStatus_CorrectionPending ) { 
						  txfm_detail_status = taxFormBatchDetailStatus_Inactive; 
					  }
					  
					  var objValues = {};
					  objValues["isinactive"]                           = "T"; 
					  objValues["custrecord_txfm_detail_status"]        = txfm_detail_status; 
					  record.submitFields({ type:"customrecord_tax_form_batch_detail" ,id:recordId ,values:objValues });
					  
					  					  
					  if (objtaxFormBatchDetailFields["custrecord_txfm_detail_document"].length > 0) {
						  var objValues = {};
						  objValues["isinactive"]    = "T"; 
						  record.submitFields({ type:"customrecord_document_management" ,id:objtaxFormBatchDetailFields["custrecord_txfm_detail_document"][0].value ,values:objValues });
					  }
				  
				  }
				  catch(e2) { 
					  log.error(funcName, "Exception inactivating TFBD record -   RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e2));  
					  return e2.message; 
				  }
				  
				  
				  log.debug("ALEX" ,"txfm_batch_status: " + txfm_batch_status )
				  if ( txfm_batch_status == taxFormBatchStatus_FiledWithIRS ||  txfm_batch_status == taxFormBatchStatus_CorrectionPending ) {
					  log.debug("ALEX" ,"inside the IF")
					  
					  try {						  
						  var overrideValues = {};
						  overrideValues["custrecord_txfm_detail_version"]           = taxFormBatchDetailFormVersion_Corrected; 
						  overrideValues["custrecord_txfm_detail_status"]            = taxFormBatchDetailStatus_Draft; 
						  overrideValues["custrecord_txfm_detail_correction_type"]   = taxFormBatchDetailCorrectionType_1;
						  overrideValues["custrecord_txfm_detail_box1d_proceed"]     = ".00"; 
						  overrideValues["custrecord_txfm_detail_box4_fedwithheld"]  = ".00"; 
						  overrideValues["custrecord_txfm_detail_box1e_cost_other"]  = ""; //hardcoding empty
						  var result = createNewtaxFormBatchDetail(objSublistAction ,objtaxFormBatchDetailFields ,overrideValues);
						  return result; 
					      
					  }
					  catch(e3) { 
						  log.error(funcName, "Exception creating new TFBD record -   Old RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e3));  
						  return e3.message; 
					  }
				  
				  }
				  
				  return "success";
			  }
						
			  
			  //======================================================================================================================
			  //======================================================================================================================
			  function taxFormBatchDetailRequestREVISE(objSublistAction ,recordId) { 
				  var funcName = scriptName + "taxFormBatchDetailRequestREVISE->" + recordId;
				  log.debug(funcName ,JSON.stringify(objSublistAction) );
				  
				  var taxFormBatchStatus_Submitted               = "2";
				  
				  var taxFormBatchDetailStatus_Inactive          = "5";
				  var taxFormBatchDetailStatus_Draft             = "1";
				  var taxFormBatchDetailFormVersion_Revised      = "2";

				  var objtaxFormBatchDetailFields = search.lookupFields({type:"customrecord_tax_form_batch_detail" ,id:recordId   
                                                                     ,columns:["custrecord_txfm_detail_document" 
                                                                              ,"custrecord_txfm_detail_deal"
                                                                              ,"custrecord_txfm_detail_shareholder"
                                                                              ,"custrecord_txfm_detail_batch_status"
                                                                              ]});

				  var txfm_batch_status = objSublistAction["taxFormBatchStatus"];
				  log.debug("ATP-2036 - txfm_batch_status" ,txfm_batch_status );
				  
				  if ( !( txfm_batch_status == taxFormBatchStatus_Submitted ) ) {
					  log.error(funcName, "Tax Form Batch Status is invalid for this process -  objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   Tax Form Batch Status: " + txfm_batch_status); 
					  return "success";
				  }
				  
				  
				  try {
					  tfLibraryServer.inactivateTaxFormBatchDetail(recordId);
				  }
				  catch(e2) { 
					  log.error(funcName, "Exception inactivating TFBD record -   RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e2));  
					  return e2.message; 
				  }
				  
				  try {	
					  var overrideValues = {};
					  overrideValues["custrecord_txfm_detail_version"]       = taxFormBatchDetailFormVersion_Revised; 
					  overrideValues["custrecord_txfm_detail_status"]        = taxFormBatchDetailStatus_Draft; 
					  var result = createNewtaxFormBatchDetail(objSublistAction ,objtaxFormBatchDetailFields ,overrideValues);
					  return result; 
				  }
				  catch(e3) { 
					  log.error(funcName, "Exception creating new TFBD record -   Old RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e3));  
					  return e3.message; 
				  }
				  	
				  return "success";
			  }
			  
			  //======================================================================================================================
			  //======================================================================================================================
			  function taxFormBatchDetailRequestCORRECT(objSublistAction ,recordId) { 
				  var funcName = scriptName + "taxFormBatchDetailRequestCORRECT->" + recordId;
				  log.debug(funcName ,JSON.stringify(objSublistAction) );
			  
				  var taxFormBatchStatus_CorrectionPending       = "5";
				  var taxFormBatchDetailStatus_Inactive          = "5";
				  var taxFormBatchDetailStatus_Draft             = "1";
				  var taxFormBatchDetailFormVersion_Corrected    = "3";


				  var objtaxFormBatchDetailFields = search.lookupFields({type:"customrecord_tax_form_batch_detail" ,id:recordId   
                                                                     ,columns:["custrecord_txfm_detail_document" 
                                                                              ,"custrecord_txfm_detail_deal"
                                                                              ,"custrecord_txfm_detail_shareholder"
                                                                              ,"custrecord_txfm_detail_batch_status"
                                                                              ]});

				  var txfm_batch_status = objSublistAction["taxFormBatchStatus"];
				  
				  
				  try {
					  tfLibraryServer.inactivateTaxFormBatchDetail(recordId);
				  }
				  catch(e2) { 
					  log.error(funcName, "Exception inactivating TFBD record -   RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e2));  
					  return e2.message; 
				  }
				  
				  try {						  
					  var overrideValues = {};
					  overrideValues["custrecord_txfm_detail_version"]         = taxFormBatchDetailFormVersion_Corrected; 
					  overrideValues["custrecord_txfm_detail_status"]          = taxFormBatchDetailStatus_Draft; 
					  overrideValues["custrecord_txfm_detail_correction_type"] = objSublistAction["correctType"]; 
					  var result = createNewtaxFormBatchDetail(objSublistAction ,objtaxFormBatchDetailFields ,overrideValues);
					  return result; 
				  }
				  catch(e3) { 
					  log.error(funcName, "Exception creating new TFBD record -   Old RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e3));  
					  return e3.message; 
				  }
				  	
				  return "success";
			  }
			  
			  //======================================================================================================================
			  //======================================================================================================================
			  function taxFormBatchDetailRequestGENERATE(objSublistAction ,recordId) { 
				  var funcName = scriptName + "taxFormBatchDetailRequestGENERATE->" + recordId;
				  log.debug(funcName ,JSON.stringify(objSublistAction) );
			  
				  var taxFormBatchDetailStatus_Inactive          = "5";
				  var taxFormBatchDetailStatus_Draft             = "1";
				  var taxFormBatchDetailFormVersion_Corrected    = "3";


				  var objtaxFormBatchDetailFields = search.lookupFields({type:"customrecord_tax_form_batch_detail" ,id:recordId   
                                                                     ,columns:["custrecord_txfm_detail_document" 
                                                                              ,"custrecord_txfm_detail_deal"
                                                                              ,"custrecord_txfm_detail_shareholder"
                                                                              ,"custrecord_txfm_detail_batch_status"
                                                                              ,"custrecord_txfm_detail_delivery"
                                                                              ]});

				  var txfm_batch_status = objSublistAction["taxFormBatchStatus"];
				  var objCreRequest = {};
				  objCreRequest["creProfile"]           = appSettings.readAppSetting("Tax Forms" ,"CRE Profile for 1099-B");
				  objCreRequest["noPassword"]           = false;
				  objCreRequest["TaxFormBatchDetailId"] = recordId;
				  
				  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
				  var TaxFormFile;
				  var TaxFormFileDocumentRecord;
				  try {
					  log.debug(funcName ,"Creating Tax Form, password protected");
					  var objValues = {};
					  // IMPORTANT!    IMPORTANT!    IMPORTANT!    IMPORTANT!    IMPORTANT!    
					  // The actual Tax Form file is created via a CRE Profile, CRE cannot be called from 2.0 script
					  // As a result we have placed the code to create the file in a suitescript 1.0 user event
					  // Pseudo field "custpage_generate_request" is updated below with the necessary information
					  // The User Event script looks for that field to have a value and when it contains data 
					  // The Tax Form file is created. That UE script is TaxFormBatchDetail_CreateDoc_CRE_UE.js
					  objValues["custpage_generate_request"] = JSON.stringify( objCreRequest ); 
					  record.submitFields({ type:"customrecord_tax_form_batch_detail" ,id:recordId ,values:objValues });
				  }
				  catch(e1) { 
					  log.error(funcName, "Exception Creating Tax Form -   RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e2));  
					  return e1.message; 
				  }
				  
				  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
				  var TaxFormFileNoPassword;
				  var TaxFormFileNoPasswordDocumentRecord;
				  try {
					  var taxFormDelivery_Mail = 2;
					  if (objtaxFormBatchDetailFields["custrecord_txfm_detail_delivery"][0].value == taxFormDelivery_Mail ) {
						  log.debug(funcName ,"Creating Tax Form, No Password");
						  objCreRequest["noPassword"] = true;
						  var objValuesNP = {};
						  // IMPORTANT!    IMPORTANT!    IMPORTANT!    IMPORTANT!    IMPORTANT!    
						  // The actual Tax Form file is created via a CRE Profile, CRE cannot be called from 2.0 script
						  // As a result we have placed the code to create the file in a suitescript 1.0 user event
						  // Pseudo field "custpage_generate_request" is updated below with the necessary information
						  // The User Event script looks for that field to have a value and when it contains data 
						  // The Tax Form file is created. That UE script is TaxFormBatchDetail_CreateDoc_CRE_UE.js
						  objValuesNP["custpage_generate_request"] = JSON.stringify( objCreRequest ); 
						  record.submitFields({ type:"customrecord_tax_form_batch_detail" ,id:recordId ,values:objValuesNP });
					  }
				  }
				  catch(e2) { 
					  log.error(funcName, "Exception Creating Tax Form, No Password -   RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e2));  
					  return e2.message; 
				  }
				  	
				  return "success";
			  }
						
			  
			  //======================================================================================================================
			  //======================================================================================================================
			  function taxFormBatchDetailRequestRECREATE(objSublistAction ,recordId) { 
				  var funcName = scriptName + "taxFormBatchDetailRequestRECREATE->" + recordId;
				  log.debug(funcName ,JSON.stringify(objSublistAction) );
				  
				  var taxFormBatchDetailStatus_Draft             = "1";
				  var taxFormBatchDetailFormVersion_Revised      = "2";

				  var objtaxFormBatchDetailFields = search.lookupFields({type:"customrecord_tax_form_batch_detail" ,id:recordId   
                                                                     ,columns:["custrecord_txfm_detail_document" 
                                                                              ,"custrecord_txfm_detail_deal"
                                                                              ,"custrecord_txfm_detail_shareholder"
                                                                              ,"custrecord_txfm_detail_batch_status"
                                                                              ]});
				  
				  try {	
					  var overrideValues = {};
					  overrideValues["custrecord_txfm_detail_version"]       = taxFormBatchDetailFormVersion_Revised; 
					  overrideValues["custrecord_txfm_detail_status"]        = taxFormBatchDetailStatus_Draft; 
					  var result = createNewtaxFormBatchDetail(objSublistAction ,objtaxFormBatchDetailFields ,overrideValues);
					  return result; 
				  }
				  catch(e3) { 
					  log.error(funcName, "Exception creating new TFBD record -   Old RecordId:" + recordId + ",   objSublistAction:" + JSON.stringify(objSublistAction) + "" + "" + ",   exception: " + JSON.stringify(e3));  
					  return e3.message; 
				  }
				  	
				  return "success";
			  }
			  
			  
			  //======================================================================================================================
			  //======================================================================================================================
			  function createNewtaxFormBatchDetail(objSublistAction ,objtaxFormBatchDetailFields ,overrideValues) { 
				  
				  log.debug("ATP-2036 createNewtaxFormBatchDetail" ,"started "  );
				  
				  try{
					  
					  var objTaxFormBatch = tfLibrary.getTaxFormValues(objSublistAction["taxFormBatchId"]);
					  var searchObj = tfLibrary.getTaxFormBatchSearch(objTaxFormBatch);
					  
					  var deal        = objtaxFormBatchDetailFields["custrecord_txfm_detail_deal"][0].value;
					  var shareholder = objtaxFormBatchDetailFields["custrecord_txfm_detail_shareholder"][0].value;
					  
					  searchObj.filters.push(search.createFilter({ name:"custrecord_acq_loth_zzz_zzz_deal"        ,operator:search.Operator.ANYOF ,values:[deal] }));
					  searchObj.filters.push(search.createFilter({ name:"custrecord_acq_loth_zzz_zzz_shareholder" ,operator:search.Operator.ANYOF ,values:[shareholder] }));
					  
					  var searchExrec        = searchObj.run();
					  var searchExrecResults = searchExrec.getRange(0,1);
					  
					  // It is acceptable for the search to return zero rows
					  // If the user intends to remove a Shareholder from the batch they will modify their certificate
					  // so that it no longer qualifies to be part of the batch and then request a REVISE
					  // REVISE process will inactivate the old detail record and then call this function to create a new one
					  // But in such a case there will no longer be any certs for that Shareholder which qualify
					  // That is an acceptable result and it becomes a removal of that shareholder from the batch
					  // So we will just gracefully exit here and call it a success
					  if (searchExrecResults.length == 0) { 
						  log.audit("createNewtaxFormBatchDetail" ,"Search returned zero rows, no need to create new detail record");
						  return "success"; 
					  }
					  
				      var searchResult       = searchExrecResults[0];
					  
					  var success = tfLibrary.createTaxFormBatchDetailRecord(searchResult ,objSublistAction["taxFormBatchId"] ,overrideValues ,searchExrec);
					  if (!success) { return "tfLibrary.createTaxFormBatchDetailRecord failed to create a proper Tax Form Batch Detail record"; }
					  return "success";
				  }
				  catch(e) {
					  log.error("ATP-2036 createNewtaxFormBatchDetail" ,"exception: " + JSON.stringify(e) );
					  return e.message;
				  }
			  }

		  } // end taxFormBatchDetailRequest =================================================================================
					
			
		  , // COMMA between functions in property list 			

			  
					
				
				
		
		  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
		  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
		  // queueManagerHistory	
		  //======================================================================================================================
		  //======================================================================================================================
		  "gid_queueManagerHistory": 
		  function (jsonObject) {
			  var funcName = scriptName + "gid_queueManagerHistory";

			  var objQueueManagerHistory = JSON.parse(jsonObject);
			  var objAppSettings = appSettings.createAppSettingsObject("Queue Manager History");
		      log.audit(funcName ,"queueManagerHistory get input data");
		      

				var arrColumns = new Array();
				var col_queueName                = search.createColumn({ name:'custrecord_pri_qm_queue_name' ,"summary":"GROUP" });
				arrColumns.push(col_queueName);
						
			    var queuesToArchive = JSON.parse( objAppSettings.settings["QManager Queues to Archive"] );
			    var queuesToDelete = JSON.parse( objAppSettings.settings["QManager Queues to Delete"] );
				var queueNames = [];
		    	for (var i=0; i<queuesToArchive.length; i++) { queueNames.push(queuesToArchive[i]); }	
		    	for (var i=0; i<queuesToDelete.length;  i++) { queueNames.push(queuesToDelete[i]);  }

				
				var arrFilters = [];
				for (var i=0; i<queueNames.length; i++) {
					if (i>0) { arrFilters.push("AND"); }
					arrFilters.push([ 'custrecord_pri_qm_queue_name'          ,'ISNOT'     ,[queueNames[i]]  ]);
				}
						
				var searchTestObj = search.create({'type':"customrecord_pri_qm_queue"
				                                     ,'filters':arrFilters 
			                                         ,'columns':arrColumns 	       });
				var searchTest        = searchTestObj.run();
				var searchTestResults = searchTest.getRange(0,1000);
				
				if (searchTestResults.length > 0) {
					
			    	var introData = "";
					for (var i=0; i<searchTestResults.length; i++) {
						var queueName = searchTestResults[i].getValue({"name":"custrecord_pri_qm_queue_name" ,"summary":"GROUP" });
						log.debug(funcName ,"New Queue Detected: " + queueName);
				    	introData = introData + queueName + "<br/>";
					}
					
					var objCreProfile = JSON.parse( objAppSettings.settings["QManager CRE Profile"] );
					var creProfile = objCreProfile[runtime.accountId];
			 		var recordId   = creProfile;
					var recipient  = objCreProfile["recipient"];
				    var suiteletUrl = url.resolveScript({ scriptId: 'customscript_cre_send_email_sl',
						                              deploymentId: 'customdeploy_cre_send_email_sl',
						  		                            params: { profile:creProfile 
						  		                            	      ,record:recordId  
						  		                            	   ,recipient:recipient  
						  		                            	   ,introData:introData  
						  		                            	    }
					                            ,returnExternalUrl: true
							                            });

				    var fullSuiteletURL = suiteletUrl;
				    var response = https.post({ url: fullSuiteletURL });

				    var objResponse = JSON.parse(response.body);

				    if (!objResponse.success) {
				    	log.error(funcName ,"CRE Send Email failed: " + objResponse.message);
				    }
							      
					
				} // if (searchTestResults.length > 0)

				
			  var objAppSettings = appSettings.createAppSettingsObject("Queue Manager History");
			    
			  var nbrDays = objAppSettings.settings["QManager Retention Days"];
			  var now = new Date();
			  var nowMillisecs = now.getTime();
			  var dateDeleteOlderThanMillisecs = nowMillisecs - (nbrDays * 1440 * 60 * 1000);
			  var dateDeleteOlderThan = now;
			  dateDeleteOlderThan.setTime(dateDeleteOlderThanMillisecs);
				
			  var year    = dateDeleteOlderThan.getFullYear();
			  var month   = dateDeleteOlderThan.getMonth()+1;
			  var day     = dateDeleteOlderThan.getDate();
			  if (day < 10)   { day   = '0' + day;   }
			  if (month < 10) { month = '0' + month; }

			  var dateString = month + '/' + day + '/' + year + " 00:00 am";
			  
	  		  var arrFilters   = [  ["created"    ,'BEFORE'  ,[dateString]    ]
	                             ];
	  		  return arrFilters;
		  } // end gid_queueManagerHistory +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			
		  , // COMMA between functions in property list
					
		  //======================================================================================================================
		  //======================================================================================================================
		  "sum_queueManagerHistory": 
		  function (jsonObject ,summary) {
			  var funcName = scriptName + "sum_queueManagerHistory";
			  
	    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
			  
			  if (errorMsgs.length > 0) {
				  log.error(funcName ,"The following errors were encountered." + JSON.stringify(errorMsgs) );
				  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
			  }
			  
			  var objQueueManagerHistory = JSON.parse(jsonObject);

		      log.audit(funcName ,"queueManagerHistory summarized");

		  } // end sum_queueManagerHistory +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			
		  , // COMMA between functions in property list
		  
		  //======================================================================================================================
		  //======================================================================================================================
		  "queueManagerHistory": 
		  function (recordId ,jsonObject ,returnPropertiesObject) {
			  if (returnPropertiesObject) { return { getInputDataFunction:"gid_queueManagerHistory" ,summarizeFunction:"sum_queueManagerHistory" }; }
			  var funcName = scriptName + "queueManagerHistory->" + recordId;
			  var objReturn = {success:false ,message:""} 
				
			  fromTry:
			  try {
				    var objQueueManagerHistory = JSON.parse(jsonObject);
				    

				    var qMgrRecord = record.load({"type":'customrecord_pri_qm_queue' ,"id":recordId ,"isDynamic":true });
				    var queueName = qMgrRecord.getValue("custrecord_pri_qm_queue_name");
				    
					var objAppSettings = appSettings.createAppSettingsObject("Queue Manager History");
				    var queuesToArchive = JSON.parse( objAppSettings.settings["QManager Queues to Archive"] );
				    
				    var found = false;
				    for (var i=0; i<queuesToArchive.length; i++) { if (queuesToArchive[i] == queueName) { found = true; } }
				    
				    if (found) {
					    var fields = qMgrRecord.getFields();
				        var objRcd = record.create({ type:"customrecord_hist_pri_qm_queue" ,isDynamic:false });
				        
				        for (var i=0; i<fields.length; i++ ) {
				        	var name = fields[i].toString();
				        	if (name.indexOf("custrecord_pri_") >= 0) {
				        		var histName = name.replace("custrecord_pri_" ,"custrecord_h_pri_");
				        		objRcd.setValue(histName ,qMgrRecord.getValue(name) );
				        	}
				        } // for (var i=0; i<fields.length; i++ )
				        
				        objRcd.setValue("custrecord_h_pri_q_orig_internal_id" ,qMgrRecord.id );
				        objRcd.setValue("custrecord_h_original_owner_id"      ,qMgrRecord.getValue("owner") );
				        objRcd.setValue("custrecord_h_original_owner_name"    ,qMgrRecord.getText("owner") );
				        
						var id = objRcd.save();
				    }
				    
				    
				    
				    var queuesToDelete = JSON.parse( objAppSettings.settings["QManager Queues to Delete"] );
				    
				    if (!found) {
					    for (var i=0; i<queuesToDelete.length; i++) { if (queuesToDelete[i] == queueName) { found = true; } }
				    }
				    
				    if (found) { record.delete({ type:'customrecord_pri_qm_queue' ,id:recordId }); }
				    

					objReturn.success = true
					objReturn.message = "success";
			  }
			  catch(e) {
				  log.error(funcName, "exception: " + JSON.stringify(e) );
				  objReturn.message = e.message;
			  }
						      
			  return objReturn;
								
		  } // end queueManagerHistory =================================================================================
					
					
		  , // COMMA between functions in property list
		  
		  //======================================================================================================================
		  //======================================================================================================================
		  "ODSAuditTrailHistory": 
		  function (recordId ,jsonObject ,returnPropertiesObject) 
		  {
			  if (returnPropertiesObject) 
			  { 
				  var retObj = { 
					  getInputDataFunction:"gid_AuditTrailHistory",
					  summarizeFunction:"sum_AuditTrailHistory" 
				  };
				  return retObj;
			  }
			  var funcName = scriptName + "ODSAuditTrailHistory->" + recordId;
			  var objReturn = 
			  	{
				  "success":false 
				  ,"message":""
				}; 
				
			  try {
				    var objHistory = JSON.parse(jsonObject);
				    

				    var REC = record.load({"type":"customrecord_ods_sync_audit_trail" ,"id":recordId ,"isDynamic":true });
				    
				    
				    var fields = REC.getFields();
			        var histREC = record.create({ type:"customrecord_ods_sync_audit_trail_hist" ,isDynamic:false });
			        var name = "";
			        var histName = "";
			        var i = 0;
			        for (i=0; i<fields.length; i+=1 ) 
			        {
			        	name = fields[i].toString();
			        	if (name.indexOf("custrecord_osat_") >= 0) 
			        	{
			        		histName = name.replace("custrecord_osat_" ,"custrecord_osath_");
			        		histREC.setValue(histName ,REC.getValue(name) );
			        	}
			        } 
			        
			        histREC.setValue("custrecord_osath_orig_internal_id" ,REC.id );
			        histREC.setValue("custrecord_osath_original_owner_id"      ,REC.getValue("owner") );
			        histREC.setValue("custrecord_osath_original_owner_name"    ,REC.getText("owner") );
			        
					var id = histREC.save();
				    
					record.delete({ type:"customrecord_ods_sync_audit_trail" ,id:recordId }); 
				   
					objReturn.success = true;
					objReturn.message = "success";
			  }
			  catch(e) {
				  log.error(funcName, "exception: " + JSON.stringify(e) );
				  objReturn.message = e.message;
			  }
						      
			  return objReturn;
								
		  } // end ODSAuditTrailHistory =================================================================================

			
	  , // COMMA between functions in property list
		  
				
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  // gid_AuditTrailHistory	
	  // given JSON object 
	
		//======================================================================================================================
	  //======================================================================================================================
	  "gid_AuditTrailHistory": 
	  function (jsonObject) 
	  {
		  var funcName = scriptName + "gid_AuditTrailHistory";

		  var objHistory = JSON.parse(jsonObject);
		  
		  objAppSettings = appSettings.createAppSettingsObject("ODS Sync");
		    
		  var nbrDays = objAppSettings.settings["ODS Audit Trail Retention Days"];
		  var now = new Date();
		  var nowMillisecs = now.getTime();
		  var dateDeleteOlderThanMillisecs = nowMillisecs - (nbrDays * 1440 * 60 * 1000);
		  var dateDeleteOlderThan = now;
		  dateDeleteOlderThan.setTime(dateDeleteOlderThanMillisecs);
			
		  var year    = dateDeleteOlderThan.getFullYear();
		  var month   = dateDeleteOlderThan.getMonth()+1;
		  var day     = dateDeleteOlderThan.getDate();
		  if (day < 10)   { day   = "0" + day;   }
		  if (month < 10) { month = "0" + month; }

		  var dateString = month + "/" + day + "/" + year + " 00:00 am";
		  
  		  arrFilters   = [  ["created"    ,"BEFORE"  ,[dateString]    ]
                             ];
  		  return arrFilters;
	  } // end gid_queueManagerHistory +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
				
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_AuditTrailHistory": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_AuditTrailHistory";
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"The following errors were encountered." + JSON.stringify(errorMsgs) );
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objHistory = JSON.parse(jsonObject);

	      log.audit(funcName ,"ODS History summarized");

	  } // end sum_queueManagerHistory +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  ,
	  
	  
	  //======================================================================================================================
	  //ATP-1816
	  "processPDFChecksRequest": 
	  function (recordId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_PDFChecksRequest" ,summarizeFunction:"sum_PDFChecksRequest" }; }
		  var funcName = scriptName + "processPDFChecksRequest->" + recordId;
		  var objReturn = {success:false ,message:""}; 
		  log.audit("funcName ", funcName);
		  fromTry:
			  
		  try {
			    var objInput = JSON.parse(jsonObject);
			   // log.audit("objInput " , JSON.stringify(objInput));
			    requestDetail = record.create({type: "customrecord_pri_cre_request_detail", isDynamic: true});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_header",value:objInput.request_options.requestHeaderid});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_status",value:objInput.request_options.detailStatus});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_recordsubtype",value:objInput.request_options.BatchPFCmapID});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_id",value:objInput.request_options.PFCID});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_rawdata",value:JSON.stringify({"inclusionsList":recordId, "signatureFile": objInput.request_options.signatureFileID})});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_creprofile",value:objInput.request_options.CREID});
				requestDetail.setValue({fieldId:"custrecord_pri_cre_request_output_folder",value:objInput.request_options.BatchfolderID});
				requestDetailid = requestDetail.save();	
			
				objReturn.success = true;
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end updateAccountAudienceBasedonEscrowTypeAudience =================================================================================
	  ,
	//======================================================================================================================
	  //ATP-1843
	  "handlePDFChecksPostProcessing": 
	  function (recordId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_handlePDFChecksPostProcessing" ,summarizeFunction:"sum_handlePDFChecksPostProcessing" }; }
		  var funcName = scriptName + "handlePDFChecksPostProcessing->" + recordId;
		  var objReturn = {success:false ,message:""}; 
		  log.audit("funcName ", funcName);
		  fromTry:
			  
		  try {
			    var objInput = JSON.parse(jsonObject);
			   // log.audit("objInput " , JSON.stringify(objInput));
			    requestDetail = record.load({type: "customrecord_pri_cre_request_detail", id:recordId, isDynamic: true});
			    
			    if (parseInt(objInput.request_options.completionAction,10) 
			    === parseInt(srsConstants["CRE Request Detail Document Completion Action"]["Delete Detail Output Document"],10))
			    {
			    	requestDetail.setValue({fieldId:"custrecord_pri_cre_request_output_dlink",value:""});
			    	requestDetailid = requestDetail.save();	
			    	var outputDoc = requestDetail.getValue({fieldId:"custrecord_pri_cre_request_output_doc"});
			    	if (outputDoc)
			    	{			    	
			    		file.delete(outputDoc);
			    	}
			    	
			    }
			    
			    if (parseInt(objInput.request_options.completionAction,10) 
			    === parseInt(srsConstants["Set Available Without Login Off"],10))
			    {
			    	//todo: if needed, logic to update without login checkbox goes here 
			    }
			    	
				
				objReturn.success = true;
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end updateAccountAudienceBasedonEscrowTypeAudience =================================================================================
	  ,
	  
	//======================================================================================================================
	  //ATP-1767
	  "updateAccountAudienceBasedonEscrowTypeAudience": 
	  function (recordId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_setAccountAudience" ,summarizeFunction:"sum_setAccountAudience" }; }
		  var funcName = scriptName + "updateAccountAudienceBasedonEscrowTypeAudience->" + recordId;
		  var objReturn = {success:false ,message:""}; 
		  log.audit("funcName ", funcName);
		  fromTry:
		  try {
			    var objEscrowType = JSON.parse(jsonObject);
			    log.audit("objEscrowType.audienceArr " + objEscrowType.audienceArr);
	  
			    var REC = record.load({type:'account' ,id:recordId ,isDynamic:true });
				REC.setValue({ fieldId:"custrecord_account_audience",value:objEscrowType.audienceArr});
				var rcdId = REC.save({ enableSourcing:false ,ignoreMandatoryFields:true});
			      
			    objReturn.success = true;
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end updateAccountAudienceBasedonEscrowTypeAudience =================================================================================
	  ,
	//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  // updateAccountAudienceBasedonEscrowTypeAudience	
	  //======================================================================================================================
	//======================================================================================================================
	  "gid_PDFChecksRequest": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_PDFChecksRequest";

		  var objInput = JSON.parse(jsonObject);
		  
		  //log.debug(funcName ,"objInput: " + JSON.stringify(objInput) );
		  //Load the JSON File Object
		  //log.debug("runtime.accountid " + runtime.accountId);
		  var arrFilters   = [         
		                      	["mainline","is","T"], 
		                      	"AND",
						        ["internalid","anyof",objInput.request_options.inclusionsList],
                             ];
  		 
  		  log.debug(funcName ,"inclusionsList count: " + objInput.request_options.inclusionsList.length);
  		
  		  return arrFilters;
	  } // end gid_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  ,
	  
	  //======================================================================================================================
	  "gid_handlePDFChecksPostProcessing": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_handlePDFChecksPostProcessing";

		  var objInput = JSON.parse(jsonObject);
		  
		  log.audit(funcName ,"objInput: " + JSON.stringify(objInput) );
		  //Load the JSON File Object
		  //log.debug("runtime.accountid " + runtime.accountId);
		  
		  var statusList = [];
		  statusList.push(srsConstants["CRE Request Status"]["Failed"]);
		  statusList.push(srsConstants["CRE Request Status"]["Completed"]);
		  
		  var arrFilters   = [         
		                      	["custrecord_pri_cre_request_header.custrecord_pri_cre_request_header_status","anyof",statusList], 
						      "AND", 
						      ["formulatext: {custrecord_pri_cre_request_output_doc}","isnotempty",""], 
						      "AND", 
						      ["formulatext: {custrecord_pri_cre_request_header.custrecord_pri_cre_request_header_doc_ac}","isnotempty",""], 
						      "AND", 
						      ["custrecord_pri_cre_request_header","anyof",objInput.request_options.requestHeaderid]
                             ];
  		 
  		   return arrFilters;
	  } // end gid_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  ,
	  //======================================================================================================================
	  "gid_setAccountAudience": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_setAccountAudience";

		  var objEscrowType = JSON.parse(jsonObject);
		  var escrowTypeID = objEscrowType.escrowTypeId;

		  log.debug(funcName ,"objEscrowType: " + JSON.stringify(objEscrowType) );
		  //Load the JSON File Object
		  log.debug("runtime.accountid " + runtime.accountId);
		  var parentAccounts = JSON.parse(appSettings.readAppSetting("General Settings", "Escrow Type Audience Parent Accounts"));
		  var parentAccountsArray = parentAccounts["accounts_"+runtime.accountId];
//		  {
//			  "accounts_772390_SB3": ["12999","19168"],
//			  "accounts_772390_SB1": ["12999","17235"],
//			  "accounts_772390": ["12999","24975"],
//			  "useMapReduce":false
//		  }
		  var arrFilters   = [         
						        ["parent","anyof",parentAccountsArray],
						        "AND", 
						        ["custrecord_account_override_audience","is","F"], 
						        "AND", 
						        ["custrecord_escrow_account_type","ANYOF",escrowTypeID]
  		  
                             ];
  		 
  		  log.debug(funcName ,"arrFilters: " + JSON.stringify(arrFilters) );
  		
  		  return arrFilters;
	  } // end gid_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	
	  ,
	  //======================================================================================================================
	  "sum_PDFChecksRequest": 
	  function (jsonObject ,summary) 
	  {
		  var funcName = scriptName + "sum_PDFChecksRequest";
		  log.debug("funcName", funcName);
		  var PFC = null;
		  var completionAction = "";
		  var mesgText = ""
		  try 
		  {
			  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
			  
	    	  if (errorMsgs.length > 0) {
				  log.error(funcName ,"Errors detected." + JSON.stringify(errorMsgs));
				  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
			  }
			  
			  
			  var objInput = JSON.parse(jsonObject);
			  
			  var requestHeader = record.load({type: "customrecord_pri_cre_request_header", id: objInput.request_options.requestHeaderid, isDynamic: true});
			  completionAction = requestHeader.getValue("custrecord_pri_cre_request_header_doc_ac");
			  
			  requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_status",value:srsConstants["CRE Request Status"]["Open"]});
			  var requestHeaderid = requestHeader.save();	
			  
			  log.debug("requestHeaderid ",  requestHeaderid);
			  requestHeader = record.load({type: "customrecord_pri_cre_request_header", id: objInput.request_options.requestHeaderid, isDynamic: true});
			  var rec_extraValues = JSON.parse(requestHeader.getValue("custrecord_pri_cre_request_header_param1")); 
			  var status = requestHeader.getValue("custrecord_pri_cre_request_header_status"); 
			  
			  PFC = record.load({type: "customrecord_payment_file", id: rec_extraValues.PFCID, isDynamic: true});
			  
			  log.debug("rec_extraValues ",  JSON.stringify(rec_extraValues));
			  
			  
			  var oldCREfileId = PFC.getValue("custrecord_pay_file_linktofile");
			  if (oldCREfileId)
			  {
				  log.debug("deleting old file custrecord_pay_file_linktofile ", oldCREfileId);
				  file.delete(oldCREfileId);
			  }
			  
			  oldCREfileId = PFC.getValue("custrecord_pay_file_cre_generated_file");
			  if (oldCREfileId)
			  {
				  log.debug("deleting old file custrecord_pay_file_cre_generated_file ", oldCREfileId);
				  file.delete(oldCREfileId);
			  }
			  
			  
			  
	//		  //move the file to right folder 
	//		  //update pfc with right information
			  var fileid = requestHeader.getValue("custrecord_pri_cre_request_header_doc");
			  
			  log.debug("fileid ",  fileid);
			  if (parseInt(status,10) === parseInt(srsConstants["CRE Request Status"]["Completed"],10))
			  {
				  if (fileid)
				  {
					  PFC.setValue("custrecord_pay_file_linktofile", fileid);
					  PFC.setValue("custrecord_pay_file_cre_generated_file", fileid);
				  		
					  
				  }
				  PFC.setValue("custrecord_pay_file_deliv_status", srsConstants["Payment File Delivery Status"]["Waiting for Approval"]);
				  PFC.save();
			  }
			  
			  
		  }
		  catch(e)
		  {
			  log.error(funcName, "exception: " + JSON.stringify(e) );

			  requestHeader = record.load({type: "customrecord_pri_cre_request_header", id: objInput.request_options.requestHeaderid, isDynamic: true});
			  requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_notes",value:e.message});
			  requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_status",value:srsConstants["CRE Request Status"]["Failed"]});
			  requestHeader.save();
		  }
		  
		  if (completionAction)
		  {
			  	var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
				mapReduceTask.scriptId     = "customscript_utility_functions_mr";
				mapReduceTask.params       = { "custscript_mr_uf_json_object"       : JSON.stringify(objInput)
											  ,"custscript_mr_uf_function"          : "handlePDFChecksPostProcessing"
											  ,"custscript_mr_uf_callingscript"     : scriptName
											  ,"custscript_mr_uf_record_type"       : "customrecord_pri_cre_request_detail"
						                     };
				log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
				var mapReduceTaskId = mapReduceTask.submit();
		  }
		  
	  } // end sum_PDFChecksRequest +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  ,
	  //======================================================================================================================
	  "sum_handlePDFChecksPostProcessing": 
	  function (jsonObject ,summary) 
	  {
		  var funcName = scriptName + "sum_handlePDFChecksPostProcessing";
		  log.debug("funcName", funcName);
		  var PFC = null;
		  var completionAction = "";
		  var mesgText = ""
		  try 
		  {
			  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
			  
	    	  if (errorMsgs.length > 0) {
				  log.error(funcName ,"Errors detected." + JSON.stringify(errorMsgs));
				  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
			  }
	    	  
	    	  	var objInput = JSON.parse(jsonObject);
	    	  	//log.audit("objInput " , JSON.stringify(objInput));
		        if (parseInt(objInput.request_options.completionAction,10) 
			    === parseInt(srsConstants["CRE Request Detail Document Completion Action"]["Delete Detail Output Document"],10))
			    {
		        	log.audit("requesting folder delete " + objInput.request_options.BatchfolderID);
			    	if (objInput.request_options.BatchfolderID)
			    	{			    	
			    		record.delete({ type: "folder", id: objInput.request_options.BatchfolderID });
			    	}
			    	
			    }
		  }
		  catch(e)
		  {
			  log.error(funcName, "exception: " + JSON.stringify(e) );

		  }
		  
	  } // end sum_handlePDFChecksPostProcessing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  
	  ,
	//======================================================================================================================
	  "sum_setAccountAudience": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_setAccountAudience";
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"Account Audience Status was not updated due to errors.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  log.audit(funcName ,"Account Audience Status was updated");

	  } // end sum_setAccountAudience +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  ,
	  
		  
				
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  // setCustomerRefundSubmittedForPayment	
	  //======================================================================================================================
	  //======================================================================================================================
	  "gid_setCustomerRefund": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_setCustomerRefund";

		  var objSetCustomerRefund = JSON.parse(jsonObject)
		  paymentFileRecordID = objSetCustomerRefund.paymentFileId;

		  // Get the id of the JSON file that contains the customer refund record id's 
		  var objPaymentFileRecordFields = search.lookupFields({type:'customrecord_payment_file' ,id:paymentFileRecordID
		        ,columns:["custrecord_json_cust_refund_file" ]});
		  
		  log.debug(funcName ,"objPaymentFileRecordFields: " + JSON.stringify(objPaymentFileRecordFields) );
		  //Load the JSON File Object
		  var jsonFileObject = file.load({ id:objPaymentFileRecordFields.custrecord_json_cust_refund_file[0].value });
		  //Get The Contents of the JSON file
		  var jsonFileContents = jsonFileObject.getContents();
		  //Split the Contents of the JSON File to get each individual Customer Refund ID
		  var recordIdArray = jsonFileContents.split(',');
		  log.audit(funcName ,"recordIdArray: " + JSON.stringify(recordIdArray) );
		  
  		  var arrFilters   = [         ['internalid'    ,'ANYOF'    ,recordIdArray ]
                              ,'AND'  ,["mainline"      ,'IS'       ,true    ]
                             ];
  		  return arrFilters;
	  } // end gid_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
				
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_setCustomerRefund": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_setCustomerRefund";
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"Payment File Creation record Status was not updated due to errors.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objSetCustomerRefund = JSON.parse(jsonObject);

	      objValues = {};
	      objValues["custrecord_pay_file_status"]       = 4;
	      record.submitFields({ type:'customrecord_payment_file' ,id:objSetCustomerRefund.paymentFileId ,values:objValues });
	      log.audit(funcName ,"Payment File Creation record Status was updated");

	  } // end sum_setCustomerRefund +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "setCustomerRefundSubmittedForPayment": 
	  function (recordId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_setCustomerRefund" ,summarizeFunction:"sum_setCustomerRefund" }; }
		  var funcName = scriptName + "setCustomerRefundSubmittedForPayment->" + recordId;
		  var objReturn = {success:false ,message:""} 
			
		  fromTry:
		  try {
			    var objSetCustomerRefund = JSON.parse(jsonObject);
			    
			    // ATP-1415
			    var paymentFileTransactionNumber;
			    for (var i=0; i<objSetCustomerRefund.fileTranSequenceList.length; i++) {
			    	if (recordId == objSetCustomerRefund.fileTranSequenceList[i]) {
			    		paymentFileTransactionNumber = i + 1;
			    		break;
			    	}
			    }
			    // End ATP-1415

		        objValues = {};
		        objValues["custbody_pp_payment_method"]       = 4;
		        objValues["custbody10"]                       = true;
		        objValues["custbody_pay_file_record"]         = objSetCustomerRefund.paymentFileId;
		        objValues["custbody_cr_payment_file_trxn_nbr"] = paymentFileTransactionNumber; // ATP-1415
		        record.submitFields({ type:record.Type.CUSTOMER_REFUND ,id:recordId ,values:objValues });

				objReturn.success = true
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end customerRefundSubmittedForPayment =================================================================================
				

		
	  , // COMMA between functions in property list
		  
				
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  // onetimeRecordUpdate
	  //
	  // This function is intended to be for one time usage. That means that after it's most recent use has been completed
	  // the function can just be recoded and reused at a later date
	  // USAGE LOG
	  //   1 - A.Fodor - Switching PAYMENT SUSPENSE REASON ADDED to a new list, this function will be used a single time 
	  //                 to update the field with the values in the new list
	  //
	  //======================================================================================================================
	  //======================================================================================================================
	  "gid_onetimeRecordUpdate": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_onetimeRecordUpdate";

		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)
		  
//  		  var arrFilters   = [         ['custrecord_imp_instruction_type'    ,'ANYOF'    ,[3] ]
//                             ];		  
		  
  		  var arrFilters   = [ 
  			  				 ];		  
		  
		  return arrFilters;
	  } // end gid_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
				
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_onetimeRecordUpdate": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_onetimeRecordUpdate";
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"There was at least one error while updating the target records.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)

	      log.audit(funcName ,funcName + " processing complete");

	  } // end sum_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "onetimeRecordUpdate": 
	  function (recordInternalId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_onetimeRecordUpdate" ,summarizeFunction:"sum_onetimeRecordUpdate" }; }
		  var funcName = scriptName + "onetimeRecordUpdate->" + recordInternalId;
		  var objReturn = {success:false ,message:""} 
			
	      var obj_ABA_Status = {
	        		"FedWire":{      "recordId":"customrecord415"
			   		               ,"fieldName":"custrecord158"
		        		      ,"fieldABAStatus":"custrecord_fedwire_aba_status_code"
	        		          }
	        	   ,"FedACH": {      "recordId":"customrecord416"
	        		   		       ,"fieldName":"custrecord165"
	        		   		  ,"fieldABAStatus":"custrecord_fedach_aba_status_code"
	        		          }
	        	}
			
		  fromTry:
		  try {
//			    var objSetCustomerRefund = JSON.parse(jsonObject);
//			    
//				var objImportRecordFields = search.lookupFields({type:'customrecord_import_record' ,id:recordId
//				                                             ,columns:["custrecord_imp_pay_susp_reason_added" ]});
//				
//				log.debug(funcName, "objImportRecordFields: " + JSON.stringify(objImportRecordFields) );
//			    var newValue;
//
//				switch (objImportRecordFields.custrecord_imp_pay_susp_reason_added[0].value) {
//				case "1": newValue = 4; break;
//				case "2": newValue = 1; break;
//				case "3": newValue = 2; break;
//				} 
//				log.debug(funcName, "old field value: " + objImportRecordFields.custrecord_imp_pay_susp_reason_added[0].value + "  ,new value: " + newValue );
//
//				if (newValue) {
//			        objValues = {};
//			        objValues["custrecord_imp_pay_susp_reason_added0"]       = newValue;
//			        record.submitFields({ type:"customrecord_import_record" ,id:recordId ,values:objValues });
//				}

			  
			    var objRecordUpdate = JSON.parse(jsonObject);

            	var objABAStatusUpdate;
            	
            	switch (objRecordUpdate.recordId) {
            	case obj_ABA_Status.FedWire.recordId:
            		objABAStatusUpdate          = obj_ABA_Status.FedWire;
            		break;
            	case obj_ABA_Status.FedACH.recordId:
            		objABAStatusUpdate          = obj_ABA_Status.FedACH;
            		break;
            	}
			    
				var objRecordFields = search.lookupFields({type:objRecordUpdate.recordId ,id:recordInternalId
				                                       ,columns:[objABAStatusUpdate.fieldName ]});
				
				log.debug(funcName, "objRecordFields: " + JSON.stringify(objRecordFields) );

	        	var abaStatus_Good = 1;
	        	var abaStatus_Bad  = 3;
	        	
	        	var fieldValue  = objRecordFields[objABAStatusUpdate.fieldName];
	        	var updateValue = abaStatus_Bad;

	        	switch (objRecordUpdate.recordId) {
	        	case obj_ABA_Status.FedWire.recordId:
	        		if (fieldValue.toUpperCase() == "Y") { updateValue = abaStatus_Good; }        		
	        		break;
	        	case obj_ABA_Status.FedACH.recordId:
	        		if ((fieldValue == 0) || (fieldValue == 1)) { updateValue = abaStatus_Good; }        		
	        		break;
	        	}

		        objValues = {};
		        objValues[objABAStatusUpdate.fieldABAStatus] = updateValue;
		        record.submitFields({ type:objRecordUpdate.recordId ,id:recordInternalId ,values:objValues });
			  
				objReturn.success = true
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end onetimeRecordUpdate ================================================================================= 1458
				
				

	  
	  
	  
	  

		
	  , // COMMA between functions in property list start of ATP-1458
		  
				
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  // onetimeRecordUpdate_atp1458
	  //
	  // This function is intended to be for one time usage. That means that after it's most recent use has been completed
	  // the function can just be recoded and reused at a later date
	  // USAGE LOG
	  //   1 - A.Fodor - Switching PAYMENT SUSPENSE REASON ADDED to a new list, this function will be used a single time 
	  //                 to update the field with the values in the new list
	  //
	  //======================================================================================================================
	  //======================================================================================================================
	  "gid_onetimeRecordUpdate_atp1458": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_onetimeRecordUpdate_atp1458";

		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)
		  
//  		  var arrFilters   = [         ['internalid'    ,'ANYOF'    ,[16516] ]
//                             ];		  
		  
		  var searchId = appSettings.readAppSetting("General Settings", "MapReduceUtility Search");
		  
		  var savedSearch = search.load({ id: searchId }); // returns search.Search
		  
		  var arrFilters = savedSearch.filters;
		  
//  		  var arrFilters   = [ 
//  			  				 ];		  
		  
		  return arrFilters;
	  } // end gid_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
				
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_onetimeRecordUpdate_atp1458": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_onetimeRecordUpdate_atp1458";
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"There was at least one error while updating the target records.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)

	      log.audit(funcName ,funcName + " processing complete");

	  } // end sum_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "onetimeRecordUpdate_atp1458": 
	  function (recordInternalId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_onetimeRecordUpdate_atp1458" ,summarizeFunction:"sum_onetimeRecordUpdate_atp1458" }; }
		  var funcName = scriptName + "onetimeRecordUpdate_atp1458->" + recordInternalId;
		  var objReturn = {success:false ,message:""} 
			
			
		  fromTry:
		  try {

			  
				var rcdExchange = record.load({type:'customrecord_acq_lot' ,id:recordInternalId ,isDynamic:true });
				
				rcdExchange.setValue('custrecord_map_reduce_trigger_1458' ,true );

				var rcdId = rcdExchange.save();
			  
				objReturn.success = true
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end onetimeRecordUpdate_atp1458 =================================================================================

	  
		

		
	  , // COMMA between functions in property list
		  
				
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	  // onetimeRecordUpdate
	  //
	  // This function is intended to be for one time usage. That means that after it's most recent use has been completed
	  // the function can just be recoded and reused at a later date
	  // USAGE LOG
	  
	  
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "gid_onetimeRecordUpdate_PmtInstr": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_onetimeRecordUpdate_PmtInstr";

		  log.debug(funcName ,"Started");
		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)
		  
  		  var arrFilters   = [ 
//  			                   ['internalid'    ,'ANYOF'    ,[744 ,741 ,733 ] ]
  			  				 ];		  
		  
		  return arrFilters;
	  } // end gid_onetimeRecordUpdate_PmtInstr +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
				
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_onetimeRecordUpdate_PmtInstr": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_onetimeRecordUpdate_PmtInstr";
		  log.debug(funcName ,"Started");
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"There was at least one error while updating the target records.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)

	      log.audit(funcName ,funcName + " processing complete");

	  } // end sum_onetimeRecordUpdate_PmtInstr +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "onetimeRecordUpdate_PmtInstr": 
	  function (recordInternalId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_onetimeRecordUpdate_PmtInstr" ,summarizeFunction:"sum_onetimeRecordUpdate_PmtInstr" }; }
		  var funcName = scriptName + "onetimeRecordUpdate_PmtInstr->" + recordInternalId;
		  var objReturn = {success:false ,message:""} 
  	      var recordType = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_record_type'      });
		  //log.debug(funcName ,"recordType: " + recordType + ",    recordInternalId: " + recordInternalId + ",    jsonObject: " + jsonObject);

		  
		  var objPmtInstructionFieldsByRecord = 
			  { 
				 "customrecord_paymt_instr_submission": { "oldRoutingNbr":     "custrecord_pisb_ep_abarouting_in"
					 									 ,"oldRoutingNbrImb":  "custrecord_pisb_ep_imb_abarouting_in"
						 								 ,"oldBankName":       "custrecord_pisb_ep_bankname"
							 							 ,"oldBankNameImb":    "custrecord_pisb_ep_imb_bankname"
						 								 ,"newRoutingNbrACH":  "custrecord_pisb_ep_abarouting_ach"
							 							 ,"newRoutingNbrWire": "custrecord_pisb_ep_abarouting_wire"
							 							 ,"newRoutingNbrImb":  "custrecord_pisb_ep_imb_abaroutg_wire"
									 						 
									 					 ,"newBanknameACH":    "custrecord_pisb_ep_ababank_ach"
												 		 ,"newBanknameWire":   "custrecord_pisb_ep_ababank_wire"
												 		 ,"newBanknameImb":    "custrecord_pisb_ep_imb_ababank_wire"
												 				 
											 			 ,"newStatusACH":      "custrecord_pisb_ep_abastatus_ach"
														 ,"newStatusNbrWire":  "custrecord_pisb_ep_abastatus_wire"
														 ,"newStatusNbrImb":   "custrecord_pisb_ep_imb_abastatus_wire"
							 							 ,"paymentMethod":     "custrecord_pisb_paymethod"
				                                        }
		  
		  		,"customrecord_paymt_instr":            { "oldRoutingNbr":     "custrecord_pi_ep_abarouting"
					                                     ,"oldRoutingNbrImb":  "custrecord_pi_ep_imb_abarouting"
							 							 ,"oldBankName":       "custrecord_pi_ep_bankname"
									 					 ,"oldBankNameImb":    "custrecord_pi_ep_imb_bankname"
							 							 ,"newRoutingNbrACH":  "custrecord_pi_ep_abarouting_ach"
									 					 ,"newRoutingNbrWire": "custrecord_pi_ep_abarouting_wire"
									 					 ,"newRoutingNbrImb":  "custrecord_pi_ep_imb_abaroutg_wire"
									 						 
									 					 ,"newBanknameACH":    "custrecord_pi_ep_ababank_ach"
												 		 ,"newBanknameWire":   "custrecord_pi_ep_ababank_wire"
												 		 ,"newBanknameImb":    "custrecord_pi_ep_imb_ababank_wire"
												 				 
											 			 ,"newStatusACH":      "custrecord_pi_ep_abastatus_ach"
														 ,"newStatusNbrWire":  "custrecord_pi_ep_abastatus_wire"
														 ,"newStatusNbrImb":   "custrecord_pi_ep_imb_abastatus_wire"
								 						 ,"paymentMethod":     "custrecord_pi_paymethod"
	                                                    }
		  		
				,"customrecord_paymt_instr_hist":       { "oldRoutingNbr":     "custrecord_pihs_ep_abarouting"
					                                     ,"oldRoutingNbrImb":  "custrecord_pihs_ep_imb_abarouting"
							 							 ,"oldBankName":       "custrecord_pihs_ep_bankname"
									 					 ,"oldBankNameImb":    "custrecord_pihs_ep_imb_bankname"
							 							 ,"newRoutingNbrACH":  "custrecord_pihs_ep_abarouting_ach"
									 					 ,"newRoutingNbrWire": "custrecord_pihs_ep_abarouting_wire"
									 					 ,"newRoutingNbrImb":  "custrecord_pihs_ep_imb_abaroutg_wire"
									 						 
								 						 ,"newBanknameACH":    "custrecord_pihs_ep_ababank_ach"
											 			 ,"newBanknameWire":   "custrecord_pihs_ep_ababank_wire"
											 			 ,"newBanknameImb":    "custrecord_pihs_ep_imb_ababank_wire"
											 				 
										 				 ,"newStatusACH":      "custrecord_pihs_ep_abastatus_ach"
													 	 ,"newStatusWire":     "custrecord_pihs_ep_abastatus_wire"
													 	 ,"newStatusImb":      "custrecord_pihs_ep_imb_abastatus_wire"
								 						 ,"paymentMethod":     "custrecord_pihs_paymethod"
			                                            }
				  
			  }
		  
		  
	      var obj_ABA_Routing = {
	        		"FedWire":{      "recordId":"customrecord415"
	        					  ,"recordName":"FedWire"
			   		          ,"routingNbrField":"custrecord153"
				   		       ,"bankNameField":"custrecord155"
					   		     ,"statusField":"custrecord158"
						   		 ,"statusValue":"*"
		        		      ,"fieldABAStatus":"custrecord_fedwire_aba_status_code"
	        		          }
	        	   ,"FedACH": {      "recordId":"customrecord416"
					              ,"recordName":"FedACH"
		   		              ,"routingNbrField":"custrecord162"
					   		   ,"bankNameField":"custrecord168"
					   		     ,"statusField":"custrecord165"
						   		 ,"statusValue":"3"
	        		   		  ,"fieldABAStatus":"custrecord_fedach_aba_status_code"
	        		          }
	        	};
		  var paymentMethod_ACH                = "1";
		  var paymentMethod_Wire_Domestic      = "4";
		  var paymentMethod_Wire_International = "5";
			
		  fromTry:
		  try {

			    var objPmtInstructionFields = objPmtInstructionFieldsByRecord[recordType];
				//log.debug(funcName, "objPmtInstructionFields: " + JSON.stringify(objPmtInstructionFields) );
				  
			    var objRecordUpdate = JSON.parse(jsonObject);
            	
				var objRecordFields = search.lookupFields({type:recordType ,id:recordInternalId
				                                       ,columns:[objPmtInstructionFields.paymentMethod 
				                                    	        ,objPmtInstructionFields.oldRoutingNbr
				                                    	        ,objPmtInstructionFields.oldRoutingNbrImb
				                                    	        ,objPmtInstructionFields.oldBankName
				                                    	        ,objPmtInstructionFields.oldBankNameImb
				                                    	        ]});
				
				//log.debug(funcName, "objRecordFields: " + JSON.stringify(objRecordFields) );
				
            	var oldRoutingNbrValue;
            	var oldBankNameValue;
            	var newRoutingNbrField;
            	var newBanknameField;
            	var newStatusField;
            	var paymentMethod = objRecordFields[objPmtInstructionFields.paymentMethod][0].value;
				//log.debug(funcName, "paymentMethod: " + paymentMethod + "   ,typeof: " + typeof paymentMethod );
            	switch (paymentMethod) {
            	case paymentMethod_ACH:
            		objABARouting          = obj_ABA_Routing.FedACH;
                	oldRoutingNbrValue     = objRecordFields[objPmtInstructionFields.oldRoutingNbr];
					oldBankNameValue       = objRecordFields[objPmtInstructionFields.oldBankName];
                	newRoutingNbrField     = objPmtInstructionFields.newRoutingNbrACH;
                	newBanknameField       = objPmtInstructionFields.newBanknameACH;
                	newStatusField         = objPmtInstructionFields.newStatusACH;
    				//log.debug(funcName, "paymentMethod ACH "  );
            		break;
            	case paymentMethod_Wire_Domestic:
            		objABARouting          = obj_ABA_Routing.FedWire;
                	oldRoutingNbrValue     = objRecordFields[objPmtInstructionFields.oldRoutingNbr];
					oldBankNameValue       = objRecordFields[objPmtInstructionFields.oldBankName];
                	newRoutingNbrField     = objPmtInstructionFields.newRoutingNbrWire;
                	newBanknameField       = objPmtInstructionFields.newBanknameWire;
                	newStatusField         = objPmtInstructionFields.newStatusWire;
    				//log.debug(funcName, "paymentMethod Dom Wire "  );
            		break;
            	case paymentMethod_Wire_International:
            		objABARouting          = obj_ABA_Routing.FedWire;
                	oldRoutingNbrValue     = objRecordFields[objPmtInstructionFields.oldRoutingNbrImb];
					oldBankNameValue       = objRecordFields[objPmtInstructionFields.oldBankNameImb];
                	newRoutingNbrField     = objPmtInstructionFields.newRoutingNbrImb;
                	newBanknameField       = objPmtInstructionFields.newBanknameImb;
                	newStatusField         = objPmtInstructionFields.newStatusImb;
    				//log.debug(funcName, "paymentMethod Wire Intl "  );
            		break;
            	}
            	
            	//objRecordFields: {"custrecord_pisb_paymethod":[{"value":"1","text":"ACH"}],"custrecord_pisb_ep_abarouting":"","custrecord_pisb_ep_imb_abarouting":"","custrecord_pisb_ep_bankname":"","custrecord_pisb_ep_imb_bankname":""}
				
      		    //log.debug(funcName ,"oldRoutingNbrValue: " + oldRoutingNbrValue + ",    oldBankNameValue: " + oldBankNameValue + ",    newRoutingNbrField: " + newRoutingNbrField );
				if (!oldRoutingNbrValue) { 
					//log.debug(funcName, "No Routing number, exiting " );
					objReturn.success = true;
					objReturn.message = "success; Routing number empty";
					return objReturn;
				}
				
				// Now do search to see if routing number is in table zzz
				var arrColumns = new Array();
				var col_internalid   = search.createColumn({ name:'internalid'                    });
				var col_abaBankname  = search.createColumn({ name:objABARouting.bankNameField     });
				var col_abaStatus    = search.createColumn({ name:objABARouting.fieldABAStatus    });
				var col_lastModified = search.createColumn({ name: 'lastmodified' ,"type":"datetime" ,"sortdir":"DESC"   });
				arrColumns.push(col_internalid);
				arrColumns.push(col_abaBankname);
				arrColumns.push(col_abaStatus);
				arrColumns.push(col_lastModified);
				
	  		    //log.debug(funcName ,"oldRoutingNbrValue: " + oldRoutingNbrValue   );
	  		    //log.debug(funcName ,"objABARouting.routingNbrField: " + objABARouting.routingNbrField   );
	  		    //log.debug(funcName ,"objABARouting.bankNameField: " + objABARouting.bankNameField   );
	  		    //log.debug(funcName ,"objABARouting.statusField: " + objABARouting.statusField   );
				var arrFilters = [];
				arrFilters.push([ objABARouting.routingNbrField          ,'IS'     ,oldRoutingNbrValue  ]);
						
				var searchTestObj     = search.create({'type':objABARouting.recordId
				                                   ,'filters':arrFilters 
			                                       ,'columns':arrColumns 	       });
				var searchTest        = searchTestObj.run();
				var searchTestResults = searchTest.getRange(0,1000);
				
				// if it is not found add it to table and indicate it was added by this process, then return
				//log.debug(funcName ,"searchTestResults.length: " + searchTestResults.length );
				var internalIdFromTable;
				var banknameFromTable;
				var statusFromTable;
				if (searchTestResults.length == 0) {
			        var objRcd = record.create({ type:objABARouting.recordId ,isDynamic:false });
			        
			        objRcd.setValue("name"                         ,oldRoutingNbrValue );
			        objRcd.setValue(objABARouting.routingNbrField  ,oldRoutingNbrValue );
			        objRcd.setValue(objABARouting.bankNameField    ,oldBankNameValue );
			        objRcd.setValue(objABARouting.statusField      ,objABARouting.statusValue );
 
					internalIdFromTable = objRcd.save();
					banknameFromTable   = oldBankNameValue;
					statusFromTable     = "unknown";
					
					log.audit("Routing Nbr added to table " + objABARouting.recordName ,oldRoutingNbrValue);
					objReturn.success = true;
					objReturn.message = "success";
					
				}
				else { 
					//log.debug(funcName ,"searchTestResults: " + JSON.stringify(searchTestResults) );
					internalIdFromTable = searchTestResults[0].getValue({"name":"internalid"                   }); 
					banknameFromTable   = searchTestResults[0].getValue({"name":objABARouting.bankNameField    }); 
					statusFromTable     = searchTestResults[0].getText({"name":objABARouting.fieldABAStatus   }); 
				}
				
				// If it was found update the record

	  		    //log.debug(funcName ,"internalIdFromTable: " + internalIdFromTable   + ",   newRoutingNbrField: " + newRoutingNbrField  );

		        //objValues = {};
		        //objValues[newRoutingNbrField] = internalIdFromTable;
				//log.debug(funcName, "objValues: " + JSON.stringify(objValues)  + ",   recordType: " + recordType + ",    recordInternalId: " + recordInternalId );
		        
				var objRecord = record.load({type:recordType ,id:recordInternalId ,isDynamic:true });
				objRecord.setValue(newRoutingNbrField ,internalIdFromTable );
				if (recordType == "customrecord_paymt_instr_hist") {
//					log.debug(funcName, "newBanknameField: " + newBanknameField  + ",   banknameFromTable: " + banknameFromTable + ",    newStatusField: " + newStatusField 
//							+ ",    statusFromTable: " + statusFromTable
//							);
					objRecord.setValue(newBanknameField ,banknameFromTable );
					objRecord.setValue(newStatusField   ,statusFromTable   );					
				}
				var rcdId = objRecord.save();
		        
				objReturn.success = true;
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end onetimeRecordUpdate_PmtInstr =================================================================================
		
	  // AFTER end onetimeRecordUpdate_PmtInstr

	  
	  , // COMMA between functions in property list before ATP_1738
	  

	  //======================================================================================================================
	  //======================================================================================================================
	  "gid_exchangeRcd_fxCurrContract_atp1738": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_exchangeRcd_fxCurrContract_atp1738";

		  var objFCCCList = JSON.parse(jsonObject)
		  
		  var objExchangeRecordToFccc = objFCCCList["objExchangeRecordToFccc"];
		  
	      var arrayExchangeRecords = [];
	      for ( strExchangeRecordId in objExchangeRecordToFccc ) {
	    	  arrayExchangeRecords.push( Number(strExchangeRecordId) );
	      }
		  
  		  var arrFilters   = [ ['internalid'    ,'ANYOF'    ,arrayExchangeRecords ] ];		  
		  
		  return arrFilters;
	  } // end gid_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
				
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_exchangeRcd_fxCurrContract_atp1738": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_exchangeRcd_fxCurrContract_atp1738";
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"There was at least one error while updating the target records.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objOnetimeRecordUpdate = JSON.parse(jsonObject)

	      log.audit(funcName ,funcName + " processing complete " + jsonObject);

	  } // end sum_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "exchangeRcd_fxCurrContract_atp1738": 
	  function (recordInternalId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_exchangeRcd_fxCurrContract_atp1738" ,summarizeFunction:"sum_exchangeRcd_fxCurrContract_atp1738" }; }
		  var funcName = scriptName + "exchangeRcd_fxCurrContract_atp1738->" + recordInternalId;
		  var objReturn = {success:false ,message:""} 
			
		  var objFCCCList = JSON.parse(jsonObject)
		  
		  var objExchangeRecordToFccc = objFCCCList["objExchangeRecordToFccc"];
			
		  fromTry:
		  try {

			    var strExchangeRecordId = recordInternalId.toString();
			  
				var rcdExchange = record.load({type:'customrecord_acq_lot' ,id:recordInternalId ,isDynamic:true });
				
				rcdExchange.setValue('custrecord_exrec_fx_conv_contract' ,objExchangeRecordToFccc[strExchangeRecordId] );

				var rcdId = rcdExchange.save();
			  
				objReturn.success = true
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end onetimeRecordUpdate_atp1738 =======================================================================================
		
	  
	  , // COMMA between functions in property list (before atp-2063)
				
	  
	  "gid_cancel_TaxFormDeal_atp2086": 
		  function (jsonObject) {
			  var funcName = scriptName + "gid_cancel_TaxFormDeal_atp2086";
			  log.debug(funcName ,"started");

			  var objCancelTaxDeal = JSON.parse(jsonObject)
			  log.debug("objCancelTaxDeal", JSON.stringify(objCancelTaxDeal));
			  var arrFilters   = [ ['custrecord_tfd_batch_id'    ,'ANYOF'    ,[objCancelTaxDeal.TaxFormBatchId ] ] ];		  
			  
			  return arrFilters;
		  } // end gid_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  ,	
	  //======================================================================================================================
	  //======================================================================================================================
	  "gid_cancel_TaxFormBatch_atp2063": 
	  function (jsonObject) {
		  var funcName = scriptName + "gid_cancel_TaxFormBatch_atp2063";
		  log.debug(funcName ,"started");

		  var objCancelTaxFormBatch = JSON.parse(jsonObject)
		  
  		  var arrFilters   = [ ['custrecord_txfm_detail_batch_id'    ,'ANYOF'    ,[objCancelTaxFormBatch.TaxFormBatchId ] ] ];		  
		  
		  return arrFilters;
	  } // end gid_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  , // COMMA between functions in property list
	  "sum_cancel_TaxFormDeal_atp2086": 
		  function (jsonObject ,summary) {
			  var funcName = scriptName + "sum_cancel_TaxFormDeal_atp2086";
			  log.debug(funcName ,"started");
				
	    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
			  
			  if (errorMsgs.length > 0) {
				  log.error(funcName ,"There was at least one error while updating the target records.");
				  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
			  }
			  
			  var objCancelTaxDeal = JSON.parse(jsonObject);
			  
			// finish up Tax Form Batch record here
			  var taxFormBatchStatus_Cancelled           = 6;
			  var objValues                              = {};
			  objValues["isinactive"]                    = "T"; 
			  objValues["lastmodifiedby"]                = objCancelTaxDeal.user; 
			  objValues["custrecord_txfm_batch_status"]  = taxFormBatchStatus_Cancelled; 
			  record.submitFields({ type:"customrecord_tax_form_batch" ,id:objCancelTaxDeal.TaxFormBatchId ,values:objValues });

			  
			  log.audit(funcName ,funcName + " processing complete " + jsonObject);
		  } // end sum_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	 ,	
	  //======================================================================================================================
	  //======================================================================================================================
	  "sum_cancel_TaxFormBatch_atp2063": 
	  function (jsonObject ,summary) {
		  var funcName = scriptName + "sum_cancel_TaxFormBatch_atp2063";
		  log.debug(funcName ,"started");
		  
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
		  
		  if (errorMsgs.length > 0) {
			  log.error(funcName ,"There was at least one error while updating the target records.");
			  throw "Error in " + funcName + "error count is greater than zero, " + errorMsgs.length + " errors";
		  }
		  
		  var objCancelTaxFormBatch = JSON.parse(jsonObject);
		  
	      log.audit(funcName ,funcName + " processing complete " + jsonObject);

		  var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
			mapReduceTask.scriptId     = "customscript_utility_functions_mr";
			mapReduceTask.params       = { "custscript_mr_uf_json_object"       : JSON.stringify(objCancelTaxFormBatch)
										  ,"custscript_mr_uf_function"          : "cancel_TaxFormDeal_atp2086"
										  ,"custscript_mr_uf_callingscript"     : scriptName
										  ,"custscript_mr_uf_record_type"       : "customrecord_tax_form_deal"
					                     };
			log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
			var mapReduceTaskId = mapReduceTask.submit();

	  } // end sum_onetimeRecordUpdate +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	  ,
	  "cancel_TaxFormDeal_atp2086": 
		  function (recordInternalId ,jsonObject ,returnPropertiesObject) {
			  if (returnPropertiesObject) { return { getInputDataFunction:"gid_cancel_TaxFormDeal_atp2086" ,summarizeFunction:"sum_cancel_TaxFormDeal_atp2086" }; }
			  var funcName = scriptName + "cancel_TaxFormDeal_atp2086->" + recordInternalId;
			  log.debug(funcName ,"started");
			  var objReturn = {success:false ,message:""} 
				
			  var objCancelTaxFormDeal = JSON.parse(jsonObject)
			  			
			  fromTry:
			  try {

				    var recordId = recordInternalId.toString();
				  
					var rcdTaxFormDeal = record.load({type:'customrecord_tax_form_deal' ,id:recordInternalId ,isDynamic:true });
					rcdTaxFormDeal.setValue('isinactive'                    ,true );
					var rcdId = rcdTaxFormDeal.save();
					
					
					objReturn.success = true
					objReturn.message = "success";
			  }
			  catch(e) {
				  log.error(funcName, "exception: " + JSON.stringify(e) );
				  objReturn.message = e.message;
			  }
						      
			  return objReturn;
								
		  } // end cancel_TaxFormBatch_atp2063 =======================================================================================

	  , // COMMA between functions in property list
	  
	  //======================================================================================================================
	  //======================================================================================================================
	  "cancel_TaxFormBatch_atp2063": 
	  function (recordInternalId ,jsonObject ,returnPropertiesObject) {
		  if (returnPropertiesObject) { return { getInputDataFunction:"gid_cancel_TaxFormBatch_atp2063" ,summarizeFunction:"sum_cancel_TaxFormBatch_atp2063" }; }
		  var funcName = scriptName + "cancel_TaxFormBatch_atp2063->" + recordInternalId;
		  log.debug(funcName ,"started");
		  var objReturn = {success:false ,message:""} 
			
		  var objCancelTaxFormBatch = JSON.parse(jsonObject)
		  			
		  fromTry:
		  try {

			    var recordId = recordInternalId.toString();
			  
				tfLibraryServer.inactivateTaxFormBatchDetail(recordId);
			  
				objReturn.success = true
				objReturn.message = "success";
		  }
		  catch(e) {
			  log.error(funcName, "exception: " + JSON.stringify(e) );
			  objReturn.message = e.message;
		  }
					      
		  return objReturn;
							
	  } // end cancel_TaxFormBatch_atp2063 =======================================================================================

	  
		
	  
	  
	  
	  
} // end availableFunctions
      

//================================================================================================================================
//================================================================================================================================
return { availableFunctions: availableFunctions
       };

}
);