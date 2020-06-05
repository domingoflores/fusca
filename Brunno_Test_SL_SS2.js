/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/record' ,'N/url' ,'N/runtime', 'N/search' ,'N/task' ,'N/crypto' ,'N/email' ,'N/encode' ,'N/error' ,'N/file' ,'N/format' ,'N/https' ,'N/ui/serverWidget'
	, '/SuiteScripts/Pristine/libraries/toolsLibrary.js'
    ,'/SuiteScripts/Pristine/libraries/TINCheckLibrary.js'
    ,'/.bundle/132118/PRI_AS_Engine'
    ,'/.bundle/132118/PRI_QM_Engine'
    ,'/SuiteScripts/Pristine/libraries/searchResultsLibrary.js'
    ,'/SuiteScripts/Pristine/libraries/searchLibrary.js'
    ,'/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'
    ,'/SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
	,'/SuiteScripts/Pristine/libraries/paymtInstrLight.js'
	,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
	,'/SuiteScripts/Pristine/libraries/sftpLibrary'
	],    //  
	function (record ,url ,runtime, search ,task ,crypto ,email ,encode ,error ,file ,format ,https ,serverWidget
		  ,tools ,tinCheck ,appSettings ,qmEngine ,searchResultsLibrary ,searchLib ,subsequentPaymentsLibrary ,ExRecAlphaPI 
		  ,paymtInstrLight ,piListLib
		  ,SFTPLibrary
		  ) {
 
		var scriptName = "Brunno_Test_SL_SS2.js";
        var BrunnoEmployeeId = 747284;

 //==========================================================================================================================================================
 //==========================================================================================================================================================
 //==========================================================================================================================================================
 //==========================================================================================================================================================
  
   function onRequest(context) {
	    var funcName = scriptName + "--->onRequest";
	    //============================================== 
	    context.response.write( "Starting  " + "" + " <br/>");
	    
	    
	    
	    
		var rcdId;
        var objValues = {};
       objValues[""] = 0; 
       
       pftrcdId = 4;
       //        record.submitFields({ type:"customer" ,id:rcdId ,values:objValues });
       //        

       var objPFTfinra = search.lookupFields({
           type: 'customrecord_pay_file_type', id: pftrcdId
           , columns: ["custrecord_pft_finra_lic_app_req"
           ]
       });

       var PFTfieldValue = objPFTfinra.custrecord_pft_finra_lic_app_req;
       context.response.write("<br/><br/>fieldValue: " + JSON.stringify(PFTfieldValue));


       context.response.write("<br/><br/>ok ");
       return;

        //
        rcdId = 538328;
//        record.submitFields({ type:"customer" ,id:rcdId ,values:objValues });
//        
        
        
		var objCustomerFields = search.lookupFields({type:'customer' ,id:rcdId 
            ,columns: ["custentity_acq_deal_fx_settle_currencies" 
                      ]});
		
		var fieldValue = objCustomerFields.custentity_acq_deal_fx_settle_currencies;
		context.response.write("<br/><br/>fieldValue: " + JSON.stringify(fieldValue) );
        
        
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
	    
		context.response.write("<br/><br/>preparing to send file " );
		
		var objPaymentFileType = search.lookupFields({type:'customrecord_pay_file_type' ,id:1 
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
		
		var paymentsFile = file.load({id:19689616});
		var myFile = { name:paymentsFile.name ,contents:paymentsFile.getContents() };		
		
	    var targetDirectory = "/sandbox_files";
		var uploadSuccessful = SFTPLibrary.uploadFile(myFile ,sftpServerCreds ,targetDirectory);
	    
		context.response.write("<br/><br/>uploadSuccessful: " + uploadSuccessful );
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
	    
	    
	    
	    var pfcId = 2043;
		var objRecordFields = search.lookupFields({type:"customrecord_payment_file" ,id:pfcId
            ,columns:["custrecord_pay_file_cust_refund_list" ]});

		context.response.write("<br/><br/>Transaction List: " + objRecordFields.custrecord_pay_file_cust_refund_list );
		var arrayCustRefunds = JSON.parse( objRecordFields.custrecord_pay_file_cust_refund_list );
	    
	    //var arrayCustRefunds = ["7441466","7441766","7441866","7442066","7448496","7448596","7448696","7448796","7449096","7449196","7449698","7449700","7449798","7449898","7450000","7450098","7450100","7450198","7450398","7450498","7450598","7450600","7450698","7450700","7450800","7450900","7451002","7451100","7451104","7451202","7451400","7451498","7451500","7451502","7451598","7451700","7451798","7451800","7451898","7451998","7452100","7452200","7452298","7452398","7452498","7452698","7444098","7444396","7444698","7445098","7448096","7449900","7449998","7450298","7450300","7450798","7450898","7450998","7451198","7451300","7451402","7451600","7452000","7452098","7452198","7436836","7436838","7436842","7436844","7436940","7437032","7437034","7437036","7437038","7437134","7437138","7437140","7437233","7437234","7437237","7437332","7437334","7437338","7437340","7437432","7437434","7437436","7437438","7437534","7437632","7437732","7437736","7437832","7444096","7444100","7444106","7444197","7444206","7444296","7444298","7444304","7444398","7444400","7444496","7444500","7444600","7444696","7444702","7444798","7444802","7444896","7444900","7444996","7444998","7445002","7445096","7445100","7445196","7445198","7445200","7445202","7445296","7445300","7450400","7450500","7451098","7451102","7451200","7451204","7451298","7451302","7451398","7451698","7451900","7452300","7444596"];
	    //arrayCustRefunds = ["7441366"];
	    
    	var filter0 = search.createFilter({ name:'mainline'    ,operator:"IS"       ,values:true                  });
    	var filter1 = search.createFilter({ name:'internalid'  ,operator:"anyof"    ,values:arrayCustRefunds      });
    	var filter2 = search.createFilter({ name:'custbody10'  ,operator:"IS"       ,values:true                  });
    	var arrFilters = [];
    	arrFilters.push(filter0);
    	arrFilters.push(filter1);
    	arrFilters.push(filter2);
		
		var qSearchObj = search.create({ type:"transaction"
			   ,filters: arrFilters
			   ,columns: [   search.createColumn({ name: 'internalid'		                })
				   		 ]
				 });


		var qSearch        = qSearchObj.run(); //returns search object
		var qSearchResults = qSearch.getRange(0,1000);
		
		context.response.write("<br/><br/>#Transactions: " + qSearchResults.length );
		
		for (var ix in qSearchResults ) {
			
			context.response.write("<br/><br/>Exchange: " + qSearchResults[ix].getValue("internalid") );
			var rcdId = qSearchResults[ix].getValue("internalid");
			
	        var objValues = {};
	        objValues["custbody10"]     = null;      
	                                      
	        record.submitFields({ type:record.Type.CUSTOMER_REFUND ,id:rcdId ,values:objValues });
			var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
			context.response.write("RemainingUsage " + RemainingUsage  + "<br/>" );
			if (RemainingUsage < 75) { context.response.write("remaining usage running low, STOPPING " + "<br/>" ); break; }
			
		}
	    
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    

	    

	    
        // 624999
	    
        // 624999
        rcdId = 2030;
		var payFileCreationRecord = record.load({ type:'customrecord_payment_file' ,id:rcdId });
		
		payFileCreationRecord.setValue("custrecord_pay_file_final_approver" , 1047697);
		payFileCreationRecord.setValue("owner" , 624999);
		
		payFileCreationRecord.setValue("custrecord_pay_file_status" , null);
		payFileCreationRecord.setValue("custrecord_pay_file_approved_by" , null);
		payFileCreationRecord.setValue("custrecord_pay_file_approved_date" , null);
		
		
		payFileCreationRecord.save();
	    return;
//		
//		
//		// custrecord_pay_file_linktofile
//		var fileId   = payFileCreationRecord.getValue("custrecord_pay_file_linktofile");
//		var filename = payFileCreationRecord.getText("custrecord_pay_file_linktofile");	    
//		context.response.write("<br/><br/>fileId: " + fileId + ",   filename: " + filename );
//		
//		// custrecord_pay_file_cre_generated_file
//		var fileId   = payFileCreationRecord.getValue("custrecord_pay_file_cre_generated_file");
//		var filename = payFileCreationRecord.getText("custrecord_pay_file_cre_generated_file");	    
//		context.response.write("<br/><br/>fileId: " + fileId + ",   filename: " + filename );
//	    
//		context.response.write("<br/><br/>ok " );
//	    return;

	    
	    
//	    
//		var	jsonString = file.load({ id: }).getContents();
//
//		context.response.write("<br/><br/>jsonString: " + jsonString  );
//	    
//	    
//		var arrayOfCustRefundIds = JSON.parse("[" + jsonString + "]");
//		context.response.write("<br/><br/>arrayOfCustRefundIds: " + JSON.stringify(arrayOfCustRefundIds)  );
//	    
//		context.response.write("<br/><br/>ok " );
//	    return;
//	    
//	    
//	    
	    
	    
		  
		  var searchId = appSettings.readAppSetting("General Settings", "MapReduceUtility Search");
		  
		  var savedSearch = search.load({ id: searchId }); // returns search.Search
		  
		  var arrFilters = savedSearch.filters;
			context.response.write("<br/><br/>arrFilters: " + JSON.stringify( arrFilters ) );
		  
    

			context.response.write("<br/><br/>ok " );
		    return;
	    
	    
	    
	    
	    //var intermedStr = intermedStr.replace(/[^0-9a-zA-Z:?()-+.]/g ,"");
	    var objSettings = {
				"Payment File Type" : { "Flat File":1,
					"NACHA":2,
					"Check":3,
					"ISO20022":4 }	    		
	    };
	    
	    var what = objSettings["Payment File Type" ];
	    var arry = Object.keys(objSettings["Payment File Type" ]);
	    
		
		context.response.write("<br/><br/>what: " + JSON.stringify( what ) );

		context.response.write("<br/><br/>arry: " + JSON.stringify( arry ) );
		
		for (var ix=0; ix<arry.length; ix++) {
			context.response.write("<br/><br/>ix: " + ix + ",  arry[ix]: " + arry[ix] );
			if (objSettings["Payment File Type" ][arry[ix]] == 2) {
				//return arry[ix] ;
				context.response.write("<br/><br/>Found: " + arry[ix] );
			}
		}

//		for (let [key, value] of Object.entries(objSettings["Payment File Type" ]);; ) {
//			  //console.log(`${key}: ${value}`);
//			  context.response.write("<br/><br/>${key}: " + ${key} + ",  ${value}: " + ${value} );
//			}
		
//		for (var ix in Object.keys(objSettings["Payment File Type" ]) ) {
//			
//			context.response.write("<br/><br/>ix: " + ix );
//			
//		}
	    

		context.response.write("<br/><br/>ok " );
	    return;
	    

	    
	    
		var form = serverWidget.createForm({ title: 'Alex Test Suitelet' });
		form.clientScriptModulePath = "SuiteScripts/Prolecto/Alex_Test_Client.js";
        form.addButton({ id:'custpage_btn_alex' ,label:'Alex' ,functionName: "alexFunction1"      });
        var fieldRegex = form.addField({ id: 'custpage_regex'  ,type:serverWidget.FieldType.TEXT ,label:'REGEX ' });
        fieldRegex.defaultValue = "[^0-9a-zA-Z-?:()./+]";
        var fieldRegexRemove = form.addField({ id: 'custpage_regex_rmv'  ,type:serverWidget.FieldType.TEXT ,label:'REGEX REMOVe ' });
        fieldRegexRemove.defaultValue = "";
        var fieldString = form.addField({ id: 'custpage_string' ,type:serverWidget.FieldType.TEXT ,label:'STRING ' });
        fieldString.defaultValue = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-?:()./+";
        fieldString.updateDisplaySize({ height:60 ,width:120 });
        form.addField({ id: 'custpage_result' ,type:serverWidget.FieldType.TEXT ,label:'RESULT ' });
        var fieldNew = form.addField({ id: 'custpage_new' ,type:serverWidget.FieldType.TEXT ,label:'New String ' });
        fieldNew.updateDisplaySize({ height:60 ,width:120 });
		context.response.writePage(form);
	    return;//==================================================================================================================
	    

	    
	    
	    
	    //var result = Regex.Replace(your String, @"[^0-9a-zA-Z]+", "")
	    //var regex = new RegExp("[^0-9a-zA-Z-?:().'+]",'g');
	    var regex = new RegExp("[^0-9a-zA-Z-?:()./+]",'g');
	    
	    var str = "Z,bc";
        var result = regex.exec(str);

        if (!str){
    		context.response.write("<br/><br/>ok " );
    	    return;        	
        }
		
		context.response.write("<br/><br/>result: " + JSON.stringify( result ) );

	    
	    

		context.response.write("<br/><br/>ok " );
	    return;
	    

	    
	    
	    
	    
	    //1963
	    
		var rcdId;
        var objValues = {};
        objValues["custrecord_pay_file_count_of_ach"]     = 0; 
        objValues["custrecord_pay_file_count_of_swt"]     = 0; 
        objValues["custrecord_pay_file_count_of_fed"]     = 0; 
        objValues["custrecord_pay_file_count_of_check"]     = 0; 
        //
        rcdId = 1963;
        record.submitFields({ type:"customrecord_payment_file" ,id:rcdId ,values:objValues });
		
		
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
		context.response.write("<br/><br/>context: " + JSON.stringify( context.request.parameters.script ) );
		
		context.response.write("<br/><br/>context: " + JSON.stringify( context ) );
	    
	    
	    

		context.response.write("<br/><br/>ok " );
	    return;
	    
		searchID = 18806;
		var mySearch = search.load({ id: searchID }); // returns search.Search
//		context.response.write("mySearch: " + JSON.stringify(mySearch) + "<br/>" );
		
		var searchObj = mySearch.run(); //returns search object
		var searchResults = searchObj.getRange(0,1000);
		
		context.response.write("searchResults.length: " + searchResults.length + "<br/>" );
	    
	    
	    

		context.response.write("<br/><br/>ok " );
	    return;
	    
	    

		var rcdId;
        var objValues = {};
        objValues["custrecord_acq_loth_4_de1_lotpaymethod"]     = 1; 
        //
        rcdId = 1070591;
        record.submitFields({ type:"customrecord_acq_lot" ,id:rcdId ,values:objValues });
		
		
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
	    var PaymentInstruction = 720;
	    var exRecId            = 688628;
		var exRec    = record.load({type:'customrecord_acq_lot' ,id:exRecId ,isDynamic:true });
	    
		var piId     = exRec.getValue("custrecord_exrec_payment_instruction");

		
		context.response.write("<br/><br/>PI currently is " + JSON.stringify(  exRec.getValue("custrecord_exrec_payment_instruction")  )  );
		
		if (piId) { exRec.setValue("custrecord_exrec_payment_instruction" ,null);               }
		else      { exRec.setValue("custrecord_exrec_payment_instruction" ,PaymentInstruction); }
		
		context.response.write("<br/><br/>Setting PI to " + JSON.stringify(  exRec.getValue("custrecord_exrec_payment_instruction")  )  );
		
		var rcdId = exRec.save();
		
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    

		var rcdId;
        var objValues = {};
        objValues["custrecord_pi_ep_addlinst"]     = ""; 
        //
        rcdId = 720;
        record.submitFields({ type:"customrecord_paymt_instr" ,id:rcdId ,values:objValues });
		
		
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    

		var rcdId;
        var objValues = {};
        objValues["custrecord_pri_qm_completed_on"]     = null; 
        objValues["custrecord_pri_qm_complete"]         = false 
        //
        rcdId = 5927647;
        record.submitFields({ type:"customrecord_pri_qm_queue" ,id:rcdId ,values:objValues });
		
		
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
		
		var intQid = qmEngine.addQueueEntry("TINCheckNotifyTarget" ,'{"idTinCheck":801296,"targetSystem":"ExchangeRecord","targetId":"18548"}' ,null ,true ,'customscript_tinchk_notify_target_qm');

		
	    
		context.response.write("<br/><br/>ok " );
	    return;

	    
	    
	    
	    
	    var PaymentInstruction = 715;
	    var exRecId            = 1060051;
		var exRec    = record.load({type:'customrecord_acq_lot' ,id:exRecId ,isDynamic:true });
	    
		var piId     = exRec.getValue("custrecord_exrec_payment_instruction");
		
		if (piId) { exRec.setValue("custrecord_exrec_payment_instruction" ,null);               }
		else      { exRec.setValue("custrecord_exrec_payment_instruction" ,PaymentInstruction); }
		
		context.response.write("<br/><br/>Setting PI to " + JSON.stringify(  exRec.getValue("custrecord_exrec_payment_instruction")  )  );
		
		var rcdId = exRec.save();
		
	    
		context.response.write("<br/><br/>ok " );
	    return;

	    
		
	    var millisecs2Minutes = 2 * 60 * 1000; // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds  
	    var objToday = new Date();
	    
		var myString0 = objToday.toString();
		context.response.write("<br/><br/> myString  " + JSON.stringify(  myString0  )  );
    
	    
	    
		context.response.write("<br/><br/>objToday.getTime()  " + JSON.stringify( objToday.getTime()  )  );
		context.response.write("<br/><br/>millisecs2Minutes " + JSON.stringify( millisecs2Minutes )  );
		nbrMillisecs = objToday.getTime() + (millisecs2Minutes); 
		context.response.write("<br/><br/>Setting PI to " + JSON.stringify(  nbrMillisecs  )  );
		var objEndDate = new Date();
		objEndDate.setTime(nbrMillisecs); // Update datetime variable using new milliseconds value
		context.response.write("<br/><br/>objEndDate " + JSON.stringify(  objEndDate  )  );
		
		var myString = objEndDate.toString();
		context.response.write("<br/><br/> myString  " + JSON.stringify(  myString  )  );
		
		var testd = new Date(myString)
		var myString9 = testd.toString();
		
		context.response.write("<br/><br/>myString9 " + JSON.stringify(  myString9  )  );
		context.response.write("<br/><br/>testd " + JSON.stringify(  testd  )  );
		
	    
		context.response.write("<br/><br/>ok " );
	    return;

	    

	    
	    var exRecId = 1066150;
		var exRec    = record.load({type:'customrecord_acq_lot' ,id:exRecId ,isDynamic:true });

	    
	    var suspenseReasons = exRec.getValue("custrecord_suspense_reason");
		context.response.write("<br/><br/>suspenseReasons: " + JSON.stringify( suspenseReasons )   );
		context.response.write("<br/><br/>typeof " + typeof suspenseReasons   );
		context.response.write("<br/><br/>Array? " + Array.isArray( suspenseReasons )   );
		
		var myString = JSON.stringify( suspenseReasons ) ;
		var newArray = JSON.parse( myString );
		context.response.write("<br/><br/>newArray: " + JSON.stringify( newArray )   );

//		context.response.write("<br/><br/>newArray: " + JSON.stringify( ExRecAlphaPI.piListLib.piEnum.paymtSuspenseReason.PIOnHold )   );

		var paymtSuspenseReason = ExRecAlphaPI.piListLib.piEnum.paymtSuspenseReason;
		
	   // var retValue = ExRecAlphaPI.removeSuspenseReasonFromRecord(exRec ,[ paymtSuspenseReason.PIOnHold ] );
	    var retValue = ExRecAlphaPI.addSuspenseReasonToRecord(exRec ,[ paymtSuspenseReason.PIOnHold ] );
		
		context.response.write("<br/><br/>retValue: " + JSON.stringify( retValue )   );
		
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
	    
	    var exRecId = 1066150;
		var exRec    = record.load({type:'customrecord_acq_lot' ,id:exRecId ,isDynamic:true });
	    
	    var suspenseReasons = exRec.getValue("custrecord_suspense_reason");
		context.response.write("<br/><br/>suspenseReasons: " + JSON.stringify( suspenseReasons )   );
		context.response.write("<br/><br/>typeof " + typeof suspenseReasons   );
		context.response.write("<br/><br/>Array? " + Array.isArray( suspenseReasons )   );
		
		var myString = JSON.stringify( suspenseReasons ) ;
		var newArray = JSON.parse( myString );
		
//		var newSuspense = [];
//		for (ix in newArray) {
//			
//			newSuspense.push(   parseInt(newArray[ix])   );
//		}
//
//		context.response.write("<br/><br/>newSuspense: " + JSON.stringify( newSuspense )   );
//		context.response.write("<br/><br/>typeof " + typeof newSuspense   );
//		context.response.write("<br/><br/>Array? " + Array.isArray( newSuspense )   );
//
//		context.response.write("<br/><br/>newArray: " + JSON.stringify( newArray )   );
//		context.response.write("<br/><br/>typeof " + typeof newArray   );
//		context.response.write("<br/><br/>Array? " + Array.isArray( newArray )   );
//		
//		var splitSuspenseReasons = suspenseReasons.split(',');
//		context.response.write("<br/><br/>splitSuspenseReasons: " + JSON.stringify( splitSuspenseReasons )   );
//		context.response.write("<br/><br/>typeof " + typeof splitSuspenseReasons   );
		
		newArray.push(paymtSuspReason.PIOnHold.toString());
		newArray.push(paymtSuspReason.PIOnHold.toString());

		context.response.write("<br/><br/>suspenseReasons new: " + JSON.stringify( newArray )   );
		
		
		exRec.setValue("custrecord_suspense_reason" ,newArray);
		
		var rcdId = exRec.save();

	    
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
	    var arrayPiToEx = ExRecAlphaPI.piListLib.arrayPiToExchangeRecord;
	    
	    var exRecId = 1065089;
		var exRecOld = record.load({type:'customrecord_acq_lot' ,id:exRecId ,isDynamic:true });
		var exRec    = record.load({type:'customrecord_acq_lot' ,id:exRecId ,isDynamic:true });
		
		var myContext = {};
		myContext.newRecord = exRec; 
		
//		var returnedObject = ExRecAlphaPI.applyPaymentInstructionToExrec(myContext);
		var returnedObject = ExRecAlphaPI.clearPIDataOnExrec(myContext);
		context.response.write("<br/><br/>pi returnedObject: " + JSON.stringify( returnedObject )   );
		
		//=========================================================================================================
		// applyPaymentInstructionToExrec(context)
//		var piId       = exRec.getValue("custrecord_exrec_payment_instruction");
//		var piRec      = record.load({type:'customrecord_paymt_instr' ,id:piId ,isDynamic:true });
//  	  	var pmtMethod  = piRec.getValue("custrecord_pi_paymethod");
//
//	    for (ix in arrayPiToEx) {
//	    	  var objPiToEx = null;
//	    	  var value;
//	    	  
//	    	  // Only process those fields that either specify as PI Source field or a Function 
//	    	  // and have no Payment Method specified or match the Payment Method on the PI record
//	    	  if (arrayPiToEx[ix].piField > "" || arrayPiToEx[ix].func > "") {
////		    	  context.response.write("<br/><br/>typeof pmtMethod: "  + typeof pmtMethod    );
////		    	  context.response.write("<br/><br/>pi pmtMethod: "  + pmtMethod + ",    arrayPiToEx[ix].pmtMethods: " + JSON.stringify( arrayPiToEx[ix].pmtMethods )   );
//		    	  if (arrayPiToEx[ix].pmtMethods.length > 0 ) {
//		    		  if (arrayPiToEx[ix].pmtMethods.indexOf(pmtMethod) > -1) {
//			    		  objPiToEx = arrayPiToEx[ix];
//		    		  }
//		    	  }
//		    	  else { objPiToEx = arrayPiToEx[ix]; }
//	    	  }
//	    	  
//	    	  if (objPiToEx) {
//	    		  
//		    	  if (objPiToEx.func > "") {
////		    		  context.response.write("<br/><br/>func "  + objPiToEx.func + ",    objPiToEx.piField: " + objPiToEx.piField   );
//		    		  // Here a fuction is specified to obtain a value
//		    		  var piFunction = ExRecAlphaPI[objPiToEx.func];
//		    		  var result = piFunction(objPiToEx ,piRec ,exRec);
//		    		  context.response.write("<br/><br/>func "  + objPiToEx.func + ",    result: " + JSON.stringify( result )  );
//		    		  value = result.value;
//		    	  }
//		    	  else 
//		    	  if ( Array.isArray(objPiToEx.piField) ) {
//		    		  context.response.write("<br/><br/> "  );
//		    		  // This is a case where piField is a list of field id's rather than a simple string
//		    		  // Pick value of first field in list that is > empty string
//		    		  value = "";
//		    		  for (jx in objPiToEx.piField) {  
//		    			  context.response.write("    "  + objPiToEx.piField[jx]   ); 
//		    			  var sourceValue = piRec.getValue(objPiToEx.piField[jx]);
//		    			  if (sourceValue && sourceValue.toString().trim() > "") {
//		    				  value = sourceValue;
//		    				  break;
//		    			  }
//		    		  }
//		    	  } 
//		    	  else 
//		    	  if (objPiToEx.getText) {
//		    		  try {value = piRec.getText(objPiToEx.piField);}
//		    		  catch(eGetText) { value = piRec.getValue(objPiToEx.piField); }
//			    	  //context.response.write("<br/><br/>row:     " +  objPiToEx.piField + "===>" +  objPiToEx.exField + "   getText value:" + value  +  "" );
//		    	  }
//		    	  else {
//		    		  value = piRec.getValue(objPiToEx.piField);
//			    	  //context.response.write("<br/><br/>:     " +  objPiToEx.piField + "===>" +  objPiToEx.exField + "   value:" + value  +  "" );
//		    		  
//		    	  }
//	    		  
////		    	  context.response.write("<br/>     "  +  objPiToEx.exField + "   value:" + value  +  "" );
//		  		  exRec.setValue(objPiToEx.exField ,value );
//	    	  } // if (objPiToEx)
//
//	    } // for (ix in arrayPiToEx)
	    
		// var rcdId = exRec.save();
	    
	    for (ix in arrayPiToEx) {
	    	objPiToEx = arrayPiToEx[ix];
	    	var oldValue = exRecOld.getValue(objPiToEx.exField);
	    	var newValue = exRec.getValue(objPiToEx.exField);
	    	  context.response.write("<br/>     "  +  objPiToEx.exField + "   value   " + oldValue  +  "===>" + newValue );
	    }
	    
	    
		context.response.write("<br/><br/>ok " );
	    return;
	    
	    
	    
	    
	    try {
			var rcdExchange = record.load({type:'customrecord_acq_lot' ,id:23476 ,isDynamic:true });
			
			rcdExchange.setValue('custrecord_map_reduce_trigger_1458'         ,true );

			var rcdId = rcdExchange.save();
	    }
	    catch(e) { context.response.write("ex: " +  e.message  +  "<br/>" ); }
	    
		context.response.write("ok " );
	    return;
	    
	    
	    
	    
	    
	    
	    //1060849   HSBCHKHHPBD   custrecord_exch_de1_imb_swiftbic  custrecord_acq_loth_5b_de1_abaswiftnum
	    //  1066051   021052367  good    011600567 bad
	    //  17938
	    
	    var rcdId; 
	    var fieldId;
	    var fieldValue;
	    
	    rcdId = 1060849; fieldId = "custrecord_acq_loth_5b_de1_abaswiftnum"; fieldValue = "9HSBCHKHHPBD";
	    rcdId = 1060849; fieldId = "custrecord_exch_de1_imb_swiftbic"; fieldValue = "9HSBCHKHHPBD";
//	    rcdId = 26668; fieldId = "custrecord_acq_loth_5b_de1_abaswiftnum"; fieldValue = "021052367";
//	    rcdId = 17938; fieldId = "custrecord_acq_loth_5a_de1_abaswiftnum"; fieldValue = "314074269";
	    
	    
		var objRecordFields = search.lookupFields({type:"customrecord_acq_lot" ,id:rcdId
            ,columns:[fieldId ]});

		context.response.write("objRecordFields: " + JSON.stringify(objRecordFields) + "<br/>" );
		
        var objValues = {};
        if (objRecordFields[fieldId] > "") { objValues[fieldId]     = "";                   } 
                                      else { objValues[fieldId]     = fieldValue;        }
        record.submitFields({ type:"customrecord_acq_lot" ,id:rcdId ,values:objValues });
		
		context.response.write("ok " );
    	return; //================================================================================================================================

    	
    	
		var objRecordFields = search.lookupFields({type:"customrecord415" ,id:9602
            ,columns:["custrecord158" ]});

		context.response.write("objRecordFields: " + JSON.stringify(objRecordFields) + "<br/>" );
		
		context.response.write("ok " );
    	return; //================================================================================================================================

    	
    	
	    var objTestData = {"exchangeInternalId":646256  ,"piInternalId":468 }
	    
		var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:objTestData.exchangeInternalId
            ,columns: ["custrecord_exrec_payment_instruction"
                      ]});
		context.response.write("objExchangeRecordFields: " + JSON.stringify(objExchangeRecordFields) + "<br/>" );

		var piInternalId = null;
		try { piInternalId = objExchangeRecordFields.custrecord_exrec_payment_instruction[0].value; } catch(e) {}
		
		context.response.write("piInternalId: " + piInternalId + "<br/>" );
		
		if (piInternalId) { piInternalId = null; }
		else { piInternalId = objTestData.piInternalId; } 

		context.response.write("new piInternalId: " + piInternalId + "<br/>" );
		
        var objValues = {};
        objValues["custrecord_exrec_payment_instruction"]     = piInternalId;
        record.submitFields({ type:"customrecord_acq_lot" ,id:objTestData.exchangeInternalId ,values:objValues });
		
		context.response.write("ok " );
    	return; //================================================================================================================================

	    
		var piRecord = record.load({type:'customrecord_paymt_instr_submission' ,id:5412 ,isDynamic:true });
	    
		var pisb_ep_bankstate = piRecord.getValue("custrecord_pisb_ep_bankstate");
		context.response.write("pisb_ep_bankstate: " + pisb_ep_bankstate + "<br/>" );
		var pisb_ep_bankcountryname = piRecord.getValue("custrecord_pisb_ep_bankcountryname");
		context.response.write("pisb_ep_bankcountryname: " + pisb_ep_bankcountryname + "<br/>" );
		
    	var filterState   = search.createFilter({ name:'internalid'                ,operator:"ANYOF"    ,values:[pisb_ep_bankstate] });
    	var filterCountry = search.createFilter({ name:'custrecord_state_country'  ,operator:"ANYOF"    ,values:[pisb_ep_bankcountryname] });
    	var arrFilters = [];
    	arrFilters.push(filterState);
    	arrFilters.push(filterCountry);
		
		var stateSearchObj = search.create({ type:"customrecord_states"
			   ,filters: arrFilters
			   ,columns: [   search.createColumn({ name: 'internalid'		                })
				   			,search.createColumn({ name: 'name'	                            })
				   			,search.createColumn({ name: 'custrecord_state_abbreviation'	})
				   			,search.createColumn({ name: 'custrecord_state_netsuite'	    })
				   			,search.createColumn({ name: 'custrecord_state_country'	        })
				   			,search.createColumn({ name: 'custrecord_country_netsuite'	    })
				   		 ]
				 });


		var stateSearch = stateSearchObj.run(); //returns search object
		var stateSearchResults = stateSearch.getRange(0,1000);

		context.response.write("stateSearchResults: " + JSON.stringify(stateSearchResults) + "<br/>" );
		
		
		var returnObject= {};
		returnObject["name"] = stateSearchResults[0].getValue("name");
		context.response.write("returnObject: " + JSON.stringify(returnObject) + "<br/>" );
		
		context.response.write("ok " );
    	return; //================================================================================================================================

	    
	    
	    
	    
	    var myArray = [ {"prop1":"one1" ,"prop2":"two1"}
	    			   ,{"prop1":"one2" ,"prop2":"two2"}
	    			   ,{"prop1":"one3" ,"prop2":"two3"}
	    			  ]
	    for each (var obj in myArray) {
			context.response.write("obj: " + JSON.stringify(obj) + "<br/>" );
	    	
	    }
		
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    
		var objPayFileCreationFields = search.lookupFields({type:'customrecord_payment_file' ,id:1521
            ,columns: ["custrecord_pay_file_status"
                      ]});
		context.response.write("objPayFileCreationFields: " + JSON.stringify(objPayFileCreationFields) + "<br/>" );
		
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    var objRequest = {paymentFileId:1518 ,transactionList:[] };
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
		mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : JSON.stringify(objRequest)
									  ,'custscript_mr_uf_function'          : 'assignFileTransactionNumbers'
									  ,'custscript_mr_uf_callingscript'     : 'Alex_Test_SL.js'
									  ,'custscript_mr_uf_record_type'       : record.Type.CUSTOMER_REFUND
				                     };
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    
	    var objRequest = {paymentFileId:1518 };
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
		mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : JSON.stringify(objRequest)
									  ,'custscript_mr_uf_function'          : 'resetCustomerRefundsPaymentFileFailed'
									  ,'custscript_mr_uf_callingscript'     : 'Alex_Test_SL.js'
									  ,'custscript_mr_uf_record_type'       : record.Type.CUSTOMER_REFUND
				                     };
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
    	return; //================================================================================================================================


    	
    	
		var objLookup = search.lookupFields({type:'customrecord_pay_file_type'                   ,id:1 
            ,columns: ["name"
            	      ,"custrecord_pft_output_file_prefix" 
            	      ,"custrecord_pft_output_file_extension"
            	      ,"custrecord_pft_output_file_folder"
//                      ,"custrecord_pft_payments_lookup_search"
//                      ,"custrecord_pft_file_generation_search"
                      ,"custrecord_pft_suitelet_pmts_search_id"
                      ,"custrecord_pft_file_gen_search_id"
                      ,"custrecord_pft_idx_deal"
                      ,"custrecord_pft_idx_payment_type"
                      ,"custrecord_pft_idx_amount"
                      ,"custrecord_pft_idx_output_start"
                      ,"custrecord_pft_no_header_row" // ATP-1243
                      ]});
		context.response.write("objLookup: " + JSON.stringify(objLookup) + "<br/>" );

		context.response.write("ok ========================================================================================== " );
	    return

	    
	    
	    
	    
	    

		context.response.write("search record type: " + search.Type.SAVED_SEARCH + "<br/>" );
        //var searchName = nlapiLookupField("employee" ,objParms.user ,"email");
		var objSearchFields = search.lookupFields({type:search.Type.SAVED_SEARCH ,id:15810
	        ,columns:["internalid" ,'id' ,'title'
	     	         ]});
		context.response.write("objSearchFields: " + JSON.stringify(objSearchFields) + "<br/>" );

		context.response.write("ok ========================================================================================== " );
	    return

	    
	    
		
		searchID = 18806;
		var mySearch = search.load({ id: searchID }); // returns search.Search
//		context.response.write("mySearch: " + JSON.stringify(mySearch) + "<br/>" );
		
		var searchObj = mySearch.run(); //returns search object
		var searchResults = searchObj.getRange(0,1000);
		
		context.response.write("searchResults.length: " + searchResults.length + "<br/>" );
		context.response.write("ok " );
	    return

	    
	    
//		var mySearch = search.load({ id: searchID }); // returns search.Search
//		context.response.write("mySearch: " + JSON.stringify(mySearch) + "<br/>" );
		
    	var filterRecType = search.createFilter({ name:'recordtype'  ,operator:"IS"          ,values:["Transaction"] });
    	var filterTitle   = search.createFilter({ name:'formulatext' ,operator:"startswith"  ,values:["PMT DASH"]    ,formula:"{title}" });
    	var arrFilters = [];
    	arrFilters.push(filterRecType);
    	arrFilters.push(filterTitle);
		
		var mySearch = search.create({ type:search.Type.SAVED_SEARCH
		     					   ,filters: arrFilters
		     					   ,columns: [   search.createColumn({ name: 'id'		    })
		     						   			,search.createColumn({ name: 'title'	    })
		     						   			,search.createColumn({ name: 'recordtype'	})
		     						   		 ]
		    						 });
		
		
		var searchObj = mySearch.run(); //returns search object
		var searchResults = searchObj.getRange(0,1000);
		
		context.response.write("searchResults.length: " + searchResults.length + "<br/>" );
		context.response.write("ok " );
	    return
		
	    
	    
	    
	    var objPayFileTypeFields = getPayFileTypeFields(4);
    	context.response.write( "objPayFileTypeFields:  " + JSON.stringify(objPayFileTypeFields) + " <br/>");
	    
		
		context.response.write("ok " );
    	return; //================================================================================================================================

	    
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
		mapReduceTask.deploymentId = "customdeploy_utility_functions_mr_qm_his";
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
    	return; //================================================================================================================================

    	
    	

		var arrColumns = new Array();
		var col_queueName                = search.createColumn({ name:'custrecord_pri_qm_queue_name' ,"summary":"GROUP" });
		arrColumns.push(col_queueName);
				
		var queueNames = ["ApprovePayment" ,"ApprovePaymentsRequest"];
		var arrFilters = [];
		for (var i=0; i<queueNames.length; i++) {
			if (i>0) { arrFilters.push("AND"); }
			arrFilters.push([ 'custrecord_pri_qm_queue_name'          ,'ISNOT'     ,[queueNames[i]]  ]);
		}
				
		var searchTestObj = search.create({'type':"customrecord_pri_qm_queue"
		                                     ,'filters':arrFilters 
	                                         ,'columns':arrColumns 	       });
		
    	context.response.write( "searchTestObj:  " + JSON.stringify(searchTestObj) + " <br/>");
    	context.response.write( "searchTestObj.filters:  " + JSON.stringify(searchTestObj.filters) + " <br/>");
    	context.response.write( "searchTestObj.filters[0]:  " + JSON.stringify(searchTestObj.filters[0]) + " <br/>");
    	context.response.write( "searchTestObj.filters[0].rightparens:  " + JSON.stringify(searchTestObj.filters[0].rightparens) + " <br/>");
		
		var searchTest        = searchTestObj.run();
		var searchTestResults = searchTest.getRange(0,1000);
    	context.response.write( "searchTestResults.length:  " + searchTestResults.length + " <br/>");
    	context.response.write( "searchTestResults:  " + JSON.stringify(searchTestResults) + " <br/>");
		
    	var introData = "";
		for (var i=0; i<searchTestResults.length; i++) {
			var queueName = searchTestResults[i].getValue({"name":"custrecord_pri_qm_queue_name" ,"summary":"GROUP" });
	    	context.response.write( "searchTestResults[i]:  " + queueName + " <br/>");
	    	introData = introData + queueName + " <br/>";
		}
		
		var objAppSettings = appSettings.createAppSettingsObject("Queue Manager History");
		    
		var objCreProfile = objAppSettings.settings["QManager CRE Profile"];
	   	context.response.write( "objCreProfile[runtime.accountId]:  " + objCreProfile[runtime.accountId] + " <br/>");
		
		//[runtime.accountId]
	   	context.response.write( "about to send email:  " + " <br/>");
		var creProfile = objCreProfile[runtime.accountId];
 		var recordId   = creProfile;
		var recipient  = "afodor@shareholderrep.com";
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
	    //log.debug(funcName, "response: " + JSON.stringify(response)  );

	    var objResponse = JSON.parse(response.body);

	    log.debug(funcName, "objResponse.success: " + objResponse.success);

	    if (!objResponse.success) {
	    	log.error(funcName ,"CRE Request to generate Bankfile failed: " + objResponse.message);
	    }
		
		
		
//        if (sendEmail) {
//    	nlapiLogExecution("AUDIT" ,funcName, "Sending email" ); 
//        
//        var objRequestParms = JSON.parse(objFieldValues.custrecord_pri_qm_parameters);
//        
//        var creProfile = new CREProfile(20);
//        creProfile.Translate(objParms.requestQueueId);
//
//        var translatedValue = creProfile.fields.BodyMessageIntroduction.translatedValue;
//        
//        var exchangeRecordsText = "";
//        for (var ix = 0; ix < objRequestParms.exchangeRecordList.length; ix++){ 
//        	var objExchangeRecordInfo = objRequestParms.exchangeRecordList[ix];
//        	exchangeRecordsText = exchangeRecordsText + objExchangeRecordInfo.id + "<br/>";
//        }
//        
//        var translatedValueNew = translatedValue.replace("[0]",exchangeRecordsText);
//        
//        creProfile.fields.BodyMessageIntroduction.translatedValue = translatedValueNew;
//        
//        var userEmail = nlapiLookupField("employee" ,objParms.user ,"email");
//        if (userEmail) { creProfile.fields.Recipient.translatedValue = userEmail; }
//
//		nlapiLogExecution("DEBUG", funcName, "b4 CREPROFILE");
//        creProfile.Execute(false);
//		nlapiLogExecution("DEBUG", funcName, "aft CREPROFILE");
//    }
		
		

	    
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    
	    var qMgrRecord = record.load({type:'customrecord_pri_qm_queue' ,id:541535 ,isDynamic:true });
	    
	    var fields = qMgrRecord.getFields();
    	context.response.write( "fields:  " + JSON.stringify(fields) + " <br/>");
	    
        var objRcd = record.create({ type:"customrecord_hist_pri_qm_queue" ,isDynamic:false });
        
        for (var i=0; i<fields.length; i++ ) {
        	var name = fields[i].toString();
        	context.response.write( "name:  " + name + ",   value: " + qMgrRecord.getValue(name) + " <br/>");
        	if (name.indexOf("custrecord_pri_") >= 0) {
        		var histName = name.replace("custrecord_pri_" ,"custrecord_h_pri_");
        		objRcd.setValue(histName ,qMgrRecord.getValue(name) );
        	}
        }
        
        objRcd.setValue("custrecord_h_pri_q_orig_internal_id" ,qMgrRecord.id );
        objRcd.setValue("custrecord_h_original_owner_id"      ,qMgrRecord.getValue("owner") );
        objRcd.setValue("custrecord_h_original_owner_name"    ,qMgrRecord.getText("owner") );
        
		var id = objRcd.save();

        
		context.response.write("ok "  );
    	return; //================================================================================================================================
	    
	    

        var deliveryStatus_readydownload = 5;
        var objValues = {};
        objValues["custrecord_pay_import_acq_approved_pay"]     = true;
        record.submitFields({ type:"customrecord_payment_import_record" ,id:2794 ,values:objValues });
        
		context.response.write("ok "  );
    	return; //================================================================================================================================

	    
//	    value = nlapiEscapeXML(value);   //--- Checks the 'XML escape characters' if any.                       
//	    var postStr= '<?xml version="1.0" encoding="utf-8"?>'+         '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"                     xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+                     '<soap:Header>'+   '<AuthHeader xmlns="http://mindfire.com/">'+   '<Username>mindfire</Username>'+                           '<Password>netsuite</Password>' +   '</AuthHeader>'+ '</soap:Header>'+                   '<soap:Body>'+ '<GetCustomerInformation xmlns="http://mindfire.com/">' +   '<MFSProperties>'+ '<MFSProperty>'+  '<PropertyDef>123</PropertyDef>' +      '<Value>' + value + '</Value>'+ '</MFSProperty>'+  '</MFSProperties>'+                     '</GetCustomerInformation>' +'</soap:Body>' + '</soap:Envelope>'; 
//	    var header = new Array();     header['Content-Type'] = 'text/xml; charset=utf-8';     header['Content-Length']= 'length';                  
//	    var response = nlapiRequestURL(url ,postStr ,header); 
//	    var responseXML = nlapiStringToXML( response.getBody() );

		
		
		// https://www.CheckTLS.com/TestReceiver?CUSTOMERCODE=me@mydomain.com&CUSTOMERPASS=IllNeverTell&EMAIL=test@CheckTLS.com&LEVEL=XML_DETAIL
	    var url = 'https://www.CheckTLS.com/TestReceiver?';  
	    url += "&CUSTOMERCODE=" + "me@mydomain.com";
	    url += "&CUSTOMERPASS=" + "IllNeverTell";
	    url += "&EMAIL=" + "test@CheckTLS.com";
	    url += "&LEVEL=" + "XML_DETAIL";
		context.response.write( "url:  " + url + " <br/>");
		var apiResponse = https.request({ method:https.Method.GET ,url:url });
		
		log.debug(funcName ,"Body: " + apiResponse.body);
		
		context.response.write( "apiResponse.body:  " + apiResponse.body + " <br/>");

		
		
		
		
		
		
		context.response.write("ok " );
    	return; //================================================================================================================================

	    
	    var paymentFileCreationId = 909;
	    
	    
//		var deliveryStatus_complete = 3;
//		var deliveryStatus_failed   = 4;
//        var objValues = {};
//		objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_complete; 
//		objValues["custrecord_pay_file_deliv_user"]       = runtime.getCurrentUser().id; 
//		objValues["custrecord_pay_file_deliv_datetime"]   = new Date(); 
//        record.submitFields({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,values:objValues });
//        
//		context.response.write("ok "  );
//    	return; //================================================================================================================================
//	    
	    

        var deliveryStatus_readydownload = 5;
        var objValues = {};
        objValues["custrecord_pay_file_final_approver"]     = AlexEmployeeId;
//        objValues["custrecord_pay_file_deliv_status"]            = deliveryStatus_readydownload;
        objValues["custrecord_pay_file_status"]             = 1;
        record.submitFields({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,values:objValues });
        
		context.response.write("ok "  );
    	return; //================================================================================================================================
	    

        var objValues = {};
		var deliveryStatus_downloaded = 6;
        objValues["custrecord_pay_file_deliv_status"]            = deliveryStatus_downloaded;
        record.submitFields({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,values:objValues });
        
		context.response.write("ok "  );
    	return; //================================================================================================================================

        var approvalStatus_readyapproval = 1;
        var objValues = {};
        objValues["custrecord_pay_file_status"]            = approvalStatus_readyapproval;
        objValues["custrecord_pay_file_approved_by"]       = null;
        objValues["custrecord_pay_file_approved_date"]     = null;
        record.submitFields({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,values:objValues });
        
		context.response.write("ok "  );
    	return; //================================================================================================================================
	    

		var arrColumns = new Array();
		var col_internalid                = search.createColumn({ name:'internalid'  });
		arrColumns.push(col_internalid);
		
		var arrFilters   = [         ['internalid'    ,'ANYOF'    ,[4725473] ]
	                       ];
		var searchTestObj = search.create({'type':record.Type.CUSTOMER_REFUND
		                                     ,'filters':arrFilters 
	                                         ,'columns':arrColumns 	       });
		var searchTest        = searchTestObj.run();
		var searchTestResults = searchTest.getRange(0,1000);
		context.response.write( "searchTestResults.length  " + searchTestResults.length + " <br/>");
		
		context.response.write("ok " );
    	return; //================================================================================================================================

	    
	    var f = file.load({id: 14502478});
		context.response.write("ok " +  JSON.stringify(context.request.parameters.recordId) );
    	return; //================================================================================================================================

		var objpaymentFileCreationFields = search.lookupFields({type:'customrecord_payment_file' ,id:paymentFileCreationId
	        ,columns:["custrecord_pay_file_linktofile" 
	     	         ]});
	    
	    try {
    	    var f = file.load({id: objpaymentFileCreationFields.custrecord_pay_file_linktofile[0].value});
	        if (f && f.fileType) {
	            // context.response.setContentType(f.fileType, f.name, 'inline');
	            context.response.setHeader({name: "Content-Type", value: "text/csv"});
	            context.response.setHeader({name: 'Content-Disposition', value: 'attachment; filename=' + f.name});
//	            context.response.setHeader({name: "Content-Transfer-Encoding", value: "binary"});
	            context.response.write(f.getContents());
	            context.response.end();
	          }
	    	
	    }
	    catch(e) {
    	    context.response.write( "exception: " + e.message + " <br/>");
	    }
	    
//		context.response.sendRedirect({type:"RECORD" ,identifier:'customrecord_payment_file' ,id:902 ,editMode:false });               
        
//	    context.response.sendRedirect({
//	          type: http.RedirectType.SUITELET,
//	          identifier : 'customscript_loan_port_detailed_report',
//	          id : 'customdeploy_loan_portf_detailed_report',
//	          parameters: {
//	                    type : 'monthly'
//	                  }
//	 });
		
		//context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    
	    
	    var objRequest = {paymentFileId:889 };
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
		mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : JSON.stringify(objRequest)
									  ,'custscript_mr_uf_function'          : 'setCustomerRefundSubmittedForPayment'
									  ,'custscript_mr_uf_callingscript'     : 'Alex_Test_SL.js'
									  ,'custscript_mr_uf_record_type'       : record.Type.CUSTOMER_REFUND
				                     };
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
    	return; //================================================================================================================================

	    
        var exchangeRecordId = 646251;
        
		var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:exchangeRecordId
        ,columns:["internalid" 
     	         ,"custrecord_acq_loth_zzz_zzz_shareholder" 
     	         ,"custrecord_acq_loth_zzz_zzz_deal"
     	         ,"custrecord_exrec_payment_instruction"
     	         ]});
        
		if (objExchangeRecordFields.custrecord_exrec_payment_instruction[0]) {
		    context.response.write( "PI Already exists"  + " <br/>");
		    return;			
		}
		
        objValues = {};
        objValues["isdeployed"]     = false;
        record.submitFields({ type:"scriptdeployment" ,id:3694 ,values:objValues });
        var rightNow = new Date();

        try {
            var objRcd = record.create({ type:"customrecord_paymt_instr" ,isDynamic:false });
    		objRcd.setValue("custrecord_pi_exchange"                   ,exchangeRecordId );
    		objRcd.setValue("custrecord_pi_paymt_instr_type"           ,11 );
    		objRcd.setValue("custrecord_pi_shareholder"                ,objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value );
    		objRcd.setValue("custrecord_pi_deal"                       ,objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_deal[0].value );
    		objRcd.setValue("custrecord_pi_paymethod"                  ,1 );
    		objRcd.setValue("custrecord_pi_ep_nameonbnkacct"           ,"Alex Testing" );
    		objRcd.setValue("custrecord_pi_ep_bankacctnum"             ,"8876788909" );
    		objRcd.setValue("custrecord_pi_ep_abarouting"              ,"071000013" );
    		objRcd.setValue("custrecord_pi_ep_achaccttype"             ,1 );
    		objRcd.setValue("custrecord_pi_source"                     ,16 );
    		objRcd.setValue("custrecord_pi_med_status"                 ,13 );
    		var piId = objRcd.save();
    	    context.response.write( "Payment Instruction Created" + " <br/>");
    		
            var objRcd2 = record.create({ type:"customrecord_paymt_instr_hist" ,isDynamic:false });
    		objRcd2.setValue("custrecord_pihs_hist_ts"                           ,rightNow );
    		objRcd2.setValue("custrecord_pihs_paymt_instr"                           ,piId );
//    		objRcd2.setValue("custrecord_pihs_submission"                           , );
    		objRcd2.setValue("custrecord_pihs_change_summary"                           ,"Alex Test" );
    		objRcd2.setValue("custrecord_pihs_original_source"                           ,16 );
    		objRcd2.setValue("custrecord_pihs_source"                           ,16 );
    		objRcd2.setValue("custrecord_pihs_src_internal_id"                           ,"16" );
    		objRcd2.setValue("custrecord_pihs_dflts_src_name"                           ,15 );
//    		objRcd2.setValue("custrecord_pihs_source_case"                           , );
    		objRcd2.setValue("custrecord_pihs_created_by"                           ,1047697 );
    		objRcd2.setValue("custrecord_pihs_submission_ts"                           ,rightNow );
    		objRcd2.setValue("custrecord_pihs_promotion_ts"                           ,rightNow );
            
    		objRcd2.setValue("custrecord_pihs_exchange"                   ,exchangeRecordId );
    		objRcd2.setValue("custrecord_pihs_paymt_instr_type"           ,11 );
    		objRcd2.setValue("custrecord_pihs_shareholder"                ,objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value );
    		objRcd2.setValue("custrecord_pihs_deal"                       ,objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_deal[0].value );
    		objRcd2.setValue("custrecord_pihs_paymethod"                  ,1 );
    		objRcd2.setValue("custrecord_pihs_ep_nameonbnkacct"           ,"Alex Testing" );
    		objRcd2.setValue("custrecord_pihs_ep_bankacctnum"             ,"8876788909" );
    		objRcd2.setValue("custrecord_pihs_ep_abarouting"              ,"071000013" );
    		objRcd2.setValue("custrecord_pihs_ep_achaccttype"             ,1 );
    		objRcd2.setValue("custrecord_pihs_source"                     ,16 );
    		objRcd2.setValue("custrecord_pihs_med_status"                 ,13 );
    		objRcd2.save();
    	    context.response.write( "Payment Instruction History Created" + " <br/>");
        } 
        catch(e){  
    	    context.response.write( "exception: " + e.message + " <br/>");
        }
	    
        objValues = {};
        objValues["isdeployed"]     = true;
        record.submitFields({ type:"scriptdeployment" ,id:3694 ,values:objValues });
	    
	    
	    
	
		context.response.write("ok " );
    	return; //================================================================================================================================

    	
	    
        objValues = {};
        objValues["custrecord_pi_exchange"]     = 646246;
        objValues["custrecord_pi_deal"]         = 733757;
        objValues["custrecord_pi_ep_nameonbnkacct"]         = "Alex Testing";
        objValues["custrecord_pi_ep_bankacctnum"]         = "8876788909";
        objValues["custrecord_pi_ep_abarouting"]         = "071000013";
        objValues["custrecord_pi_ep_achaccttype"]         = 1; // ACH=1, Save=2, Comm Check=3, Comm Sav=4
        record.submitFields({ type:"customrecord_paymt_instr" ,id:466 ,values:objValues });
	    
	    
	    
	    context.response.write( "???????????:" + "???????????????????" + " <br/>");
	
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    var exrecList = [ 646719 ];
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_test_supp_util_functions_mr';
		//mapReduceTask.deploymentId = 'customdeploy_test_supp_util_functions_mr';
		mapReduceTask.params       = { 'custscript_mr_tsdp_internal_id_list'  : JSON.stringify(exrecList)
									  ,'custscript_mr_tsdp_function'          : 'addCertToExchangeRecords'
									  ,'custscript_mr_tsdp_callingscript'     : 'Alex_Test_SL.js'
									  ,'custscript_mr_tsdp_record_type'       : 'customrecord_acq_lot'
				                     };
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    
	    var id = 648756;
	    var idAsString = id.toString();
	    context.response.write( "idAsString:" + idAsString + " <br/>");
    
	    var amt = parseInt( idAsString.substring(idAsString.length - 4) );
	    context.response.write( "amt:" + amt + " <br/>");
    
    
	    context.response.write( "???????????:" + "???????????????????" + " <br/>");
	
		context.response.write("ok " );
    	return; //================================================================================================================================
	    
	    
	    
	    
	    
	    var exrecList = [646344];
	    var i = 0;
	    
		var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:exrecList[i]
                                                       ,columns:["internalid" 
                                                    	        ,"custrecord_acq_lot_payment_import_record" 
                                                    	        ,"custrecord_acq_loth_zzz_zzz_shareholder" 
                                                    	        ,"custrecord_acq_loth_zzz_zzz_deal" 

                                                    	        ]});
	
		var derId        = objExchangeRecordFields.custrecord_acq_lot_payment_import_record[0].value;
	    
		var objValues;
		var derChanged = false;
		var objDerFields = search.lookupFields({type:'customrecord_payment_import_record' ,id:derId
										    ,columns:["internalid" 
										    	     ,"custrecord_pay_import_approved_pay" 
										    	     ,"custrecord_pay_import_acq_approved_pay" 
										    	     ]});
		
	    context.response.write( "objDerFields:" + JSON.stringify(objDerFields) + " <br/>");
		if (objDerFields.custrecord_pay_import_approved_pay || objDerFields.custrecord_pay_import_acq_approved_pay) {
		    context.response.write( "changing DER" + " <br/>");
	        objValues = {};
	        objValues["custrecord_pay_import_approved_pay"]     = false;
	        objValues["custrecord_pay_import_acq_approved_pay"] = false;
	        record.submitFields({ type:"customrecord_payment_import_record" ,id:derId ,values:objValues });
	        derChanged = true;
		}
	    
	    // Change Exchange record status so we can add lot cert ??????

		
		// Add certificate customrecord_acq_lot_cert_entry
	    try {
		    context.response.write( "Creating Cert" + " <br/>");
			var objRcd = record.create({ type:"customrecord_acq_lot_cert_entry" ,isDynamic:false });
			objRcd.setValue("custrecord_acq_lotce_zzz_zzz_parentlot"   ,exrecList[i] );
			objRcd.setValue("custrecord_lot_cert_shareholder"          ,objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value );
			objRcd.setValue("custrecord_lot_cert_deal"                 ,objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_deal[0].value );
			objRcd.setValue("custrecord_acq_lotce_zzz_zzz_lotcestatus" ,5 );
			objRcd.setValue("custrecord_acq_lotce_3_src_certtype"      ,13 );
			objRcd.setValue("custrecord_acq_lotce_3_src_numbershares"  ,10 );
			objRcd.setValue("custrecord_acq_lotce_zzz_zzz_payment"     ,666 );
			objRcd.save();
	    }
	    catch(e) {context.response.write("Exception Adding Cert;  e.message: " +  e.message + "<br/>");}
		
		
		
		if (derChanged) {
	        objValues = {};
	        objValues["custrecord_pay_import_approved_pay"]     = true;
	        objValues["custrecord_pay_import_acq_approved_pay"] = true;
	        record.submitFields({ type:"customrecord_payment_import_record" ,id:derId ,values:objValues });
		    context.response.write( "DER changed back" + " <br/>");
		}
		
	    
	    //availableFunctions["testFunction"](context);
	    context.response.write( "???????????:" + "???????????????????" + " <br/>");
		
		context.response.write("ok " );
	    return; //================================================================================================================================

	    
	    
	    var qMgrRecord = record.load({type:'customrecord_pri_qm_queue' ,id:300341 ,isDynamic:true });
	    context.response.write( "qMgrRecord:" + JSON.stringify(qMgrRecord) + " <br/>");
	    var objFields = search.lookupFields({type:'customrecord_pri_qm_queue' ,id:300341        ,columns:["internalid"      	         ,"created"      	         ]});
	    context.response.write( "objFields:" + JSON.stringify(objFields) + " <br/>");

		var objDateCreated = new Date(objFields.created);  
	    context.response.write( "objDateCreated:" + objDateCreated + " <br/>");
	    context.response.write( "objDateCreated string:" + JSON.stringify(objDateCreated) + " <br/>");
		
	    var millisecs = objDateCreated.getTime();
	    context.response.write( "millisecs:" + millisecs + " <br/>");
		
		context.response.write("ok " );
	    return; //================================================================================================================================
	    
	    
	    var exrecList = []; 
	    
		var arrColumns0 = new Array();
		var col_internalid                = search.createColumn({ name:'internalid'  });
		arrColumns0.push(col_internalid);
		
		var arrFilters0   = [         ['custrecord_acq_loth_zzz_zzz_acqstatus'          ,'ANYOF'     ,[5] ]
                             ,'AND',  ['custrecord_acq_loth_4_de1_lotpaymethod'         ,'ANYOF'     ,[1]         ]
                             ,'AND',  ['custrecord_acq_loth_zzz_zzz_deal'               ,'ANYOF'     ,[733757]         ]
	                        ];
		var searchExchangeRcdsObj = search.create({'type':'customrecord_acq_lot'
		                                     ,'filters':arrFilters0 
	                                         ,'columns':arrColumns0 	       });
		var searchExchangeRcds        = searchExchangeRcdsObj.run();
		var searchExchangeRcdsResults = searchExchangeRcds.getRange(0,1000);					
	
		
	    context.response.write( "searchExchangeRcdsResults.length:" + searchExchangeRcdsResults.length + " <br/>");
	    
		// loop through the results
		for (var k = 0; k < searchExchangeRcdsResults.length; k++) { 
		    context.response.write( "exrec:" + searchExchangeRcdsResults[k].getValue("internalid") + " <br/>");
			exrecList.push(searchExchangeRcdsResults[k].getValue("internalid"));
		}
	    
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_test_supp_util_functions_mr';
		mapReduceTask.deploymentId = 'customdeploy_test_supp_util_functions_mr';
		mapReduceTask.params       = { 'custscript_mr_tsdp_internal_id_list'  : JSON.stringify(exrecList)
									  ,'custscript_mr_tsdp_function'          : 'deletePriacleRecord'
									  ,'custscript_mr_tsdp_callingscript'     : 'Alex_Test_SL.js'
									  ,'custscript_mr_tsdp_record_type'       : 'customrecord_acq_lot'
				                     };
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
	    return; //================================================================================================================================

	    
	    
		var nbrExrecs = exrecList.length;
		var ctr = 0;
		context.response.write("nbrExrecs " + nbrExrecs + "<br/>" );
	    
	    for (var ii=0; ii<exrecList.length; ii++) {
			var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
			context.response.write("RemainingUsage " + RemainingUsage + "<br/>" );
			if (RemainingUsage <70) { context.response.write("Out of RemainingUsage, stopping. " + "<br/>" );   break;}
//			   

			var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:exrecList[ii]
                ,columns:["internalid" 
             	         ,"custrecord_acq_loth_zzz_zzz_shareholder" 
             	         ,"custrecord_acq_loth_5a_de1_bankacctnum" 
             	         ,"custrecord_acq_loth_5a_de1_abaswiftnum" 
             	         ,"custrecord_acq_loth_5a_de1_bankaccttype" 
             	         ]});
			
			var shareholder        = objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value;
    		var newAccountNum      = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankacctnum;
    		var newRoutingNum      = objExchangeRecordFields.custrecord_acq_loth_5a_de1_abaswiftnum;
    		var newAccountType     = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankaccttype[0].value;
    		
//    		context.response.write( "newAccountNum:  " + newAccountNum + " <br/>");
//    		context.response.write( "newRoutingNum:  " + newRoutingNum + " <br/>");
//    		context.response.write( "newAccountType: " + newAccountType + " <br/>");
			
			var piracle = {};
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
			
			// loop through the results
			for (var i = 0; searchAchAccountResults != null && i < searchAchAccountResults.length; i++) {
				// get result values
				var searchresult = searchAchAccountResults[i];
				
//	    		context.response.write( "+++++++++++++++++++++++++++++++++++"  + " <br/>");
//	    		context.response.write( "pp_ach_account_number:   " + searchresult.getValue('custrecord_pp_ach_account_number') + " <br/>");
//	    		context.response.write( "pp_ach_account_number:   " + searchresult.getValue('custrecord_pp_ach_routing_number') + " <br/>");
//	    		context.response.write( "resultAcctType  pp_ach_transaction_code: " + searchresult.getValue('custrecord_pp_ach_transaction_code') + " <br/>");
				
				if(searchresult.getValue('custrecord_pp_ach_account_number') == newAccountNum && searchresult.getValue('custrecord_pp_ach_routing_number') == newRoutingNum ) {
					var resultAcctType = searchresult.getValue('custrecord_pp_ach_transaction_code');
					if(((newAccountType == 1 || newAccountType == 3) && resultAcctType == 7) || ((newAccountType == 2 || newAccountType == 4) && resultAcctType == 8)) {
						piracle.id          = searchresult.getValue('internalid');
						piracle.accountType = searchresult.getValue('custrecord_pp_ach_transaction_code');
						piracle.accountNumb = searchresult.getValue('custrecord_pp_ach_account_number');
						piracle.routingNUmb = searchresult.getValue('custrecord_pp_ach_routing_number');
						
					}
				}
			}
			
			if (piracle.id) {

				context.response.write( "exrec:" + exrecList[ii] + ",  Piracle Rcd ID: " + piracle.id + " <br/>");
				
	    		var arrColumns2 = new Array();
	    		var col_internalid                = search.createColumn({ name:'internalid'  });
	    		arrColumns2.push(col_internalid);
	    		
	    		var arrFilters2   = [         ['custbody_pp_ach_account'  ,'ANYOF'  ,[piracle.id] ]
                                     ,'AND',  ['mainline'                 ,'IS'     ,["T"]         ]
	    	                       ];
	    		var searchTransObj = search.create({'type':'transaction'
	    		                                     ,'filters':arrFilters2 
	    	                                         ,'columns':arrColumns2 	       });
	    		var searchTrans        = searchTransObj.run();
	    		var searchTransResults = searchTrans.getRange(0,1000);					
				
				// loop through the results
				for (var j = 0; j < searchTransResults.length; j++) {
					
			        objValues = {};
			        objValues["custbody_pp_ach_account"] = null;
			        objValues["custbody_pp_payment_method"] = 4;
//			        context.response.write( "tran id:" + searchTransResults[j].getValue('internalid') + " <br/>");
			        record.submitFields({ type:record.Type.CUSTOMER_REFUND ,id:searchTransResults[j].getValue('internalid') ,values:objValues });
//					context.response.write( "transaction modified <br/>");
				}
				
				rcdId = record.delete({ type:'customrecord_pp_ach_account' ,id:piracle.id });			
				context.response.write( "piracle record deleted <br/>");
				
				ctr += 1;
				if (ctr > nbrExrecs) { break; }
				
			} else { context.response.write( "exrec:" + exrecList[ii] + ",  Piracle Rcd ID: NOT FOUND" + " <br/>"); }
			
			
		    context.response.write( "============================================== <br/>");
			
			
			
	    	
	    } // for (var i=0; i<exrecList.length; i++)
	    
	    context.response.write( "DONE ============================================== <br/>");
	    return;
	   
		var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:646018
                                                       ,columns:["internalid" 
                                                    	        ,"custrecord_acq_loth_4_de1_lotpaymethod" 
                                                    	        ,"custrecord_acq_loth_zzz_zzz_shareholder" 
                                                    	        ,"custrecord_acq_loth_5a_de1_bankacctnum" 
                                                    	        ,"custrecord_acq_loth_5a_de1_abaswiftnum" 
                                                    	        ,"custrecord_acq_loth_5a_de1_bankaccttype" 
                                                    	        ,"custrecord_acq_loth_zzz_zzz_shareholder.entityid"
                                                    	        ]});
		var paymentMethod  = objExchangeRecordFields.custrecord_acq_loth_4_de1_lotpaymethod[0].value;
		var shareholder    = objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value;
//		var newAccountNum  = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankacctnum[0].value;
//		var newRoutingNum  = objExchangeRecordFields.custrecord_acq_loth_5a_de1_abaswiftnum[0].value;
//		var newAccountType = objExchangeRecordFields.custrecord_acq_loth_5a_de1_bankaccttype[0].value;
			    
	    context.response.write(shareholder +  "<br/>");
	    context.response.write(JSON.stringify(objExchangeRecordFields) +  "<br/>");
	    context.response.write( "============================================== <br/>");
	    return;
	    
	    
		var arrColumns = new Array();
		var col_pp_ach_entity             = search.createColumn({ name:'custrecord_pp_ach_entity'  });
		var col_pp_ach_account_number     = search.createColumn({ name:'custrecord_pp_ach_account_number'    ,sort:'ASC' });
		var col_pp_ach_routing_number     = search.createColumn({ name:'custrecord_pp_ach_routing_number'    ,sort:'ASC' });
		var col_pp_ach_transaction_code   = search.createColumn({ name:'custrecord_pp_ach_transaction_code'  ,sort:'ASC' });
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
	    context.response.write("searchAchAccountResults.length: " + searchAchAccountResults.length +  "<br/>");
		
		for (var i = 0; i < searchAchAccountResults.length; i++) {
			var result = searchAchAccountResults[i];
			context.response.write("result: " + JSON.stringify(result) +  "<br/>");


		
		} // for (var i = 0; i < searchAchAccountResults.length; i++)
		
	    
		
		context.response.write("ok " );
	    return; //================================================================

	    
	    
		var QManagerParm = { "ODSSyncRecordTypeId":1 ,"startingIndex":0 ,"recordIdList":[472712,472713,472714,472715,472716,472717,472718,472719,472720,472721,472722,472723,472724,472725,472726,472727,472728,472729,472730,472731,472732,472733,472734,472735,472736,472737,472738,472739,472740,472741,472742,472743,472744,472745,472746,472747,472748,472749,472750,472751,472752,472753,472754,472755,472756,472757,472758,472759,472760,472761,472762,472763,472764,472765,472766,472767,472768,472769,472770,472771,472772,472773,472774,472775,472776,472777,472778,472779,472780,472781,472782,472783,472784,472785,472786,472787,472788,472789,472790,472791,472792,472793,472794,472795,472796,472797,472798,472799,472800,472801,472802,472803,472804,472805,472806,472807,472808,472809,472810,472811,472812,472813,472814,472815,472816,472817,472818,472819,472820,472821,472822,472823,472824,472825,472826,472827,472828,472829,472830,472831,472832,472833,472834,472835,472836,472837,472838,472839,472840,472841,472842,472843,472844,472845,472846,472847,472848,472849,472850,472851,472852,472853,472854,472855,472856,472857,472858,472859,472860,472861,472862,472863,472865,472866,472867,472868,472869,472874,472876,472877,472878,472879,472880,472881,472882,472883,472884,472885,472886,472889,472890,472891,472892,472893,472894,472895,472896,472897,472898,472899,472900,472901,472902,472903,472904,472905,472906,472907,472908,472909,472910,472911,472912,472913,472914,472915,472916,472917,472918,472920,472921,472922,472923,472924,472925,472926,472927,472928,472929,472930,472931,472932,472933,472934,472935,472936,472937,472938,472939,472940,472941,472942,472943,472944,472945,472946,472947,472948,472949,472950,472951,472952,472953,472954,472955,472956,472957,472958,472959,472960,472961,472962,472963,472964,472965,472966,472967,472968,472969,472970,472971,472972,472973,472974,472975,472976,472977,472978,472979,472980,472981,472982,472983,472984,472985,472986,472987,472988,472989,472990,472991,472992,472993,472994,472995,472996,472997,472998,472999,473000,473001,473002,473003,473004,473005,473006,473007,473008,473009,473010,473011,473012,473013,473014,473015,473016,473017,473018,473019,473020,473021,473022,473023,473024,473025,473026,473027,473028,473029,473030,473031,473032,473033,473034,473035,473036,473037,473038,473039,473040,473041,473042,473043,473044,473045,473046,473047,473048,473049,473050,473051,473052,473053,473054,473055,473056,473057,473058,473059,473060,473061,473062,473063,473064,473065,473066,473067,473068,473069,473070,473072,473073] ,"recType":"customrecord_document_management" ,"envType":runtime.envType ,"eventType":context.type ,"executionContext":runtime.executionContext ,callingScript:"Alex_Test_SL.js" };
			 	    
		QManagerParm = {"ODSSyncRecordTypeId":"6","recordIdList":["191","211","213"],"startingIndex":0,"recType":"journalentry","envType":"SANDBOX","eventType":"userinterface","executionContext":"SCHEDULED","callingScript":"ODS_Sync_SS"}
		var intQid = qmEngine.addQueueEntry( "ODSSyncRecord" ,QManagerParm ,null ,true ,'customscript_ods_sync_record_qm');
	    
		
		context.response.write("ok " );
	    return; //================================================================
	    
	    // 263579
		var rcdDocument = record.load({type:'customrecord_document_management' ,id:263579 ,isDynamic:true });
		
//		var audience = rcdDocument.getValue('custrecord_doc_audience'        );
//	    context.response.write(JSON.stringify(audience) +  "<br/>");
//	    var removedBuyer = -1;
//        var audience_BUYER = "1";
//        var audienceUpdated = [];
//		for (var i = 0; i < audience.length; i++) {
//			if (audience[i] == audience_BUYER) { removedBuyer = i; }
//			else { audienceUpdated.push(audience[i]); } 
//		}
//		if (removedBuyer >= 0) {
//		    context.response.write(removeBuyerIndex +  "<br/>");
//			audience.splice(removeBuyerIndex,1);
//		}
//
//	    context.response.write(JSON.stringify(audience) +  "<br/>");
		
        var audienceSpouseTest = rcdDocument.getValue({fieldId: "custrecord_doc_audience"});
        var audience_BUYER = 1;                
	    var buyerPresent = false;
        var audienceUpdated = [];
		for (var i = 0; i < audienceSpouseTest.length; i++) {
			if (audienceSpouseTest[i] == audience_BUYER) { buyerPresent = true; }
			else { audienceUpdated.push(audienceSpouseTest[i]); } 
		}
		if (buyerPresent) {
            var echosignJSON = rcdDocument.getValue({fieldId: "custrecord_echosign_json"});
            var echosignOuterObject = JSON.parse(echosignJSON);
            var echosignObject = echosignOuterObject["0"];
            context.response.write(JSON.stringify(echosignObject) +  "<br/>");
            context.response.write("echosignObject['Spouses Email'] " + echosignObject["Spouses Email"] +  "<br/>");
            context.response.write("echosignObject['Spouse  Email'] " + echosignObject["Spouse Email"] +  "<br/>");
            var spouseEmail = "";
            if (echosignObject["Spouses Email"] ) { spouseEmail = echosignObject["Spouses Email"];  }
            if (echosignObject["Spouse Email"] )  { spouseEmail = echosignObject["Spouse Email"];  }
            context.response.write("spouseEmail " + spouseEmail +  "<br/>");
            if (spouseEmail > "") {
            	context.response.write(echosignObject["Spouses Email"] +  "<br/>");
//                newRec.setValue({ fieldId: FIELDS.DOCUMENT.AUDIENCE, value: audienceUpdated });
            }
		}

		
	    context.response.write(JSON.stringify(audienceUpdated) +  "<br/>");
		
		context.response.write("ok " );
	    return; //====================================

	    
//		var exchangeRecord  = null;
//	    var shareholder     = 971329;
//	    var deal            = null;
//	    
//		var exRecSearchResults = ExRecAlphaPI.getShareholderExRecs(shareholder, deal, exchangeRecord);
//		
//		if (exRecSearchResults.length == 0) { return; }
//		
//		var exchangeRecordList = [];
//		for (var i = 0; i < exRecSearchResults.length; i++) {
//			exchangeRecordList.push(exRecSearchResults[i].id);
//		}
//		
//		log.debug(funcName ,"shareholder: " + shareholder + ",    deal: " + deal + ",    exchangeRecord: " + exchangeRecord );
//		log.debug(funcName ,"exchangeRecordList: " + JSON.stringify(exchangeRecordList) );
//	    
//	    
//	    
//	    ExRecAlphaPI.updateRelatedExRecsViaMapReduce( shareholder ,deal ,exchangeRecord );
//		
//		context.response.write("ok " );
//	    return; //====================================

	    
	    
	    var shrhldr = 676777;
	    var shareholderText = "'" + shrhldr + "'";
	    var deal = 5557;
	    var dealText = "'" + deal + "'";
	    
		var arrColumns              = new Array();
		var col_InternalId          = search.createColumn({ "name":"internalid"  });
		var col_formula_Shareholder = search.createColumn({ "name":"formulatext" ,"type":"text" ,"formula":shareholderText });
		var col_formula_Deal        = search.createColumn({ "name":"formulatext" ,"type":"text" ,"formula":dealText });
		arrColumns.push(col_InternalId);
		arrColumns.push(col_formula_Shareholder);
		arrColumns.push(col_formula_Deal);
		
		var exchangeRecords = [644590 ,644694 ,645490];
		
		var arrFilters   = [         ['isinactive'    ,'IS'       ,false ]
		                    ,'AND'  ,['internalid'    ,'ANYOF'    ,exchangeRecords ]
	                       ];
		var searchMapReduceObj = search.create({'type':'customrecord_acq_lot'
		                                           ,'filters':arrFilters 
	                                               ,'columns':arrColumns 	       });

	    var searchMapReduce = searchMapReduceObj.run();

	    var myResults = searchLib.getSearchResultDataAsArrayOfSimpleObjects(searchMapReduce);
	    
	    var output = JSON.stringify(myResults);
	    context.response.write("results: " + "<br/>");	    
	    context.response.write(output +  "<br/>");	    
	    
	    
		context.response.write("ok " );
	    return; //====================================

	    
	    
		var exchangeRecords = [644590 ,644694 ,645490];
	    var shareholder     = 676777;
	    var deal            = 5557;
	    
		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
		mapReduceTask.scriptId     = 'customscript_exrec_alpha_pi_mapreduce';
		mapReduceTask.deploymentId = 'customdeploy_exrec_alpha_pi_mapreduce1';
		mapReduceTask.params       = { 'custscript_exrec_mr_shareholder'  : shareholder 
								      ,'custscript_exrec_mr_deal'         : deal
								      ,'custscript_exrec_mr_exrec_list'   : JSON.stringify(exchangeRecords)
				                     };
		log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
		var mapReduceTaskId = mapReduceTask.submit();
		
		context.response.write("ok " );
	    return; //====================================

	    
	    
	    var shrhldr = 676777;
	    var shareholderText = "'" + shrhldr + "'";
	    var deal = 5557;
	    var dealText = "'" + deal + "'";
	    
		var arrColumns              = new Array();
		var col_InternalId          = search.createColumn({ "name":"internalid"  });
		var col_formula_Shareholder = search.createColumn({ "name":"formulatext" ,"type":"text" ,"formula":shareholderText });
		var col_formula_Deal        = search.createColumn({ "name":"formulatext" ,"type":"text" ,"formula":dealText });
		arrColumns.push(col_InternalId);
		arrColumns.push(col_formula_Shareholder);
		arrColumns.push(col_formula_Deal);
		
		var exchangeRecords = [644590 ,644694 ,645490];
		
		var arrFilters   = [         ['isinactive'    ,'IS'       ,false ]
		                    ,'AND'  ,['internalid'    ,'ANYOF'    ,exchangeRecords ]
	                       ];
		var searchMapReduceObj = search.create({'type':'customrecord_acq_lot'
		                                           ,'filters':arrFilters 
	                                               ,'columns':arrColumns 	       });

	    var searchMapReduce = searchMapReduceObj.run();
		searchMapReduceResults = searchMapReduce.getRange(0,1000);					
		
		for each (result in searchMapReduceResults) {
			context.response.write("result: " + JSON.stringify(result) +  "<br/>");
		} // for each (result in searchMapReduceResults)
	    
	    
	    
		context.response.write("ok " );
	    return; //====================================
	    
	    ExRecAlphaPI.updateRelatedExRecsViaMapReduce(910732 ,null ,644694);
	    
		context.response.write("ok " );
	    return; //====================================
		
    	var permissionObjRow = {"pOne":"2" ,"pTwo":1 ,"pThree":{p1:"hhhhhhh"}};
    	
    	for(var property in permissionObjRow){
    	
    		context.response.write("================================================================== " + "<br/>" );
    		context.response.write("property: " + property + "             " + typeof property + "<br/>" );
    		context.response.write("permissionObjRow[property]: " + permissionObjRow[property] + "<br/>" );
    	
    	
    	
    	}            	
		context.response.write("ok " );
	    return
    	

	    
	    
	    
		
		suiteletSearchID = 15810;
		
		var mySearch = search.load({ id: suiteletSearchID }); // returns search.Search
		
		var payFileCreationRecord = record.load({ type:'customrecord_payment_file' ,id:893 });
		var objPaymentFileDate = payFileCreationRecord.getValue("custrecord_pay_file_payments_date");
		context.response.write("objPaymentFileDate: " + objPaymentFileDate + "<br/>" );
		var month = objPaymentFileDate.getMonth() + 1;
		var day   = objPaymentFileDate.getDate();
		var year  = objPaymentFileDate.getFullYear();
		var paymentFileDate = month + "/" + day + "/" + year;;
		context.response.write("paymentFileDate: " + paymentFileDate + "<br/>" );
		var objFilter = search.createFilter({ name:'trandate' ,operator:search.Operator.ON ,values:paymentFileDate });
		mySearch.filters.push(objFilter);

		var searchObj = mySearch.run(); //returns search object
		var searchResults = searchObj.getRange(0,1000);
		
		context.response.write("searchResults.length: " + searchResults.length + "<br/>" );
		context.response.write("ok " );
	    return
		
		

//		
//        var objExchangeFields = search.lookupFields({type:"customrecord_acq_lot" 
//                                                      ,id:645519 
//                                                 ,columns:["custrecord_acq_loth_0_de2_notes" ]});
//		context.response.write("objExchangeFields " +  JSON.stringify(objExchangeFields)  +  "<br/>" );
		
		
		
		context.response.write("b4 submitfields " +  "<br/>" );
        objValues = {};
        objValues["custrecord_acq_loth_0_de1_notes"] = "Alex Test";
	    tools.takeTimestamp("start" ,"Start");
		record.submitFields({ type:"customrecord_acq_lot" ,id:645519 ,values:objValues });
		tools.takeTimestamp("done" ,"stop");


		context.response.write("ok " );
	    return
	    
	    tools.takeTimestamp("one" ,"Start");
		tools.takeTimestamp("two");
		tools.takeTimestamp("three" ,"stop");

		context.response.write("ok " );
	    return

	    	    
	    // parseFloat(Math.round(num3 * 100) / 100).toFixed(2);
	    var millisecs = 2745;
	    var displaySecs = parseFloat(Math.round(millisecs * 1000) / 1000).toFixed(1);
	    
		context.response.write("secs: " +  displaySecs  +  "<br/>" );
	   
		displaySecs = parseFloat(millisecs / 1000).toFixed(1);
	    
		context.response.write("secs: " +  displaySecs  +  "<br/>" );
		
		context.response.write("ok " );
	    return
	    
	    
	    
		var sSettingValue = appSettings.readAppSetting("General Settings", "Users with Administrator override in sandbox");

		context.response.write("setting value: " +  sSettingValue  +  "<br/>" );
		
		var arrayUsers = JSON.parse(sSettingValue);
		context.response.write("array: " +  JSON.stringify(arrayUsers)  +  "<br/>" );
		context.response.write("array length: " +  arrayUsers.length  +  "<br/>" );
		
		context.response.write("ok " );
	    return
	    var millisecs24Hours = 24 * 60 * 60 * 1000; // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds  
	    var objToday = new Date();
		nbrMillisecs = objToday.getTime() + (millisecs24Hours * 10); 
		var objEndDate = new Date();
		objEndDate.setTime(nbrMillisecs); // Update datetime variable using new milliseconds value
	    
	    
	    
		var arrColumns         = new Array();
		var col_name           = search.createColumn({ name:'name'  });
		var col_dateObserved   = search.createColumn({ name:'custrecord_date_observed'  ,sort:'ASC' });
		arrColumns.push(col_name);
		arrColumns.push(col_dateObserved);
		
		var arrFilters   = [         ['isinactive'                        ,'IS'              ,false ]
		                    ,'AND'  ,['custrecord_date_observed'          ,'after'           ,["today"] ]
                            ,'AND'  ,['custrecord_date_observed'          ,'before'          ,["10/10/2019"] ]
	                       ];
		var searchHolidaysObj = search.create({'type':'customrecord_bank_holiday'
		                                           ,'filters':arrFilters 
	                                               ,'columns':arrColumns 	       });
		var searchHolidays = searchHolidaysObj.run();
		searchHolidaysResults = searchHolidays.getRange(0,1000);					
		
		for each (result in searchHolidaysResults) {
			var theDate = result.getValue(col_dateObserved);
			context.response.write("result: " + JSON.stringify(result) +  "<br/>");
			context.response.write("theDate: " +  theDate  +  "<br/>" );
		} // for each (result in searchHolidaysResults)
	    
		context.response.write("ok " );
	    return;
	    

	    
	    
	    try {
			var rcdPaymentProcess = record.load({type:'customrecord_paymentprocess' ,id:260992 ,isDynamic:true });
			
			var month = parseInt("5") - 1;
			var myDate = new Date("2019" ,month ,"19");
			rcdPaymentProcess.setValue('custrecord_process_effective_date'         , myDate);

			var rcdId = rcdPaymentProcess.save();
	    }
	    catch(e) { context.response.write("ex: " +  e.message  +  "<br/>" ); }
	    
		context.response.write("ok " );
	    return;
	    
	    
		var currentDER = 292929292929;
//		var derPayoutType = context.request.parameters.custscript_der_payout_type;
//		var derPayDate = context.request.parameters.custscript_der_pay_date;

		// find DERs eligible for the process
		var filters = [];
		filters.push(search.createFilter({ name:'internalid' ,operator:'noneof' ,values:currentDER }));
		var columns = [];
		columns.push(search.createColumn({ name:'internalid' ,sort:search.Sort.DESC }));
		columns.push('name');
		var derSearch = subsequentPaymentsLibrary.findDERsByDeal(11115544545 ,filters, columns).run();
		var all = searchResultsLibrary.getSearchResultData(derSearch);
 
		context.response.write("results.length: " + all.length +  "<br/>");
		context.response.write("results: " + JSON.stringify(all) +  "<br/>");
	    
		context.response.write("done " );
		return;
	    
	    
		   
	    
		var columns = [];
		columns.push(search.createColumn({ name:'custrecord_acq_lotce_zzz_zzz_payment' }));
		//return subsequentPaymentsLibrary.findCertsByExRec(exRecList, columns);
		var exRecList = [929292929];
		var certSearch = search.create({     type: 'customrecord_acq_lot_cert_entry',
			                              columns: columns,
			                              filters: [ ['custrecord_acq_lotce_zzz_zzz_parentlot', 'anyof', exRecList] ]
		                               }).run();
		
		try { var results = getSearchResultData(context ,certSearch); }
		catch(e){ throw e.message }
		
		context.response.write("results.length: " + results.length +  "<br/>");
		context.response.write("results: " + JSON.stringify(results) +  "<br/>");
	    
		context.response.write("ok " );
		return;
	    
	    
	    
	    try {
			var objRcd = record.create({ type:"customrecord_payment_import_record" ,isDynamic:false });
			objRcd.setValue("name" ,"Alex Test" );
			objRcd.setValue("custrecord_pay_import_analyst" ,72196 );
			objRcd.setValue("custrecord_pay_import_deal" ,688740 );
			objRcd.setValue("custrecord_pay_import_approved_pay" ,true );
			objRcd.setValue("custrecord_pay_import_tax_reporting" ,4 );
			objRcd.setValue("custrecord_pay_import_acq_approved_pay" ,true );
			objRcd.save();
	    }
	    catch(e) {context.response.write("e.message: " +  e.message + "<br/>");}
	    
		context.response.write("ok " );
		return;
	    

	    var fieldValue = null;
	    if (fieldValue > "") { context.response.write("fieldValue > '' " +  "<br/>"); }
		

		context.response.write("ok " );
		return;
	    
		var erFieldValues = search.lookupFields({ type:'customrecord_acq_lot',
            id:642874,
       columns:['custrecord_acq_lot_payment_import_record.custrecord_pay_import_approved_pay'
               ,'custrecord_acq_lot_priority_payment'
               ,'custrecord_acq_loth_zzz_zzz_acqstatus'
               ,'custrecord_acq_loth_zzz_zzz_shareholder'
               ,'custrecord_acq_loth_zzz_zzz_deal'
               ]
        });
	    

		context.response.write("erFieldValues: " +  JSON.stringify(erFieldValues) + "<br/>");

		context.response.write("ok " );
		return;
	    
		   
		var nbrMinutes = Math.ceil(50 / 2.5);
		var now = new Date();
		context.response.write("nbrMinutes: " +  nbrMinutes + "<br/>");
		context.response.write("now: " +  now.toString() + "<br/>");
		var nbrMillisecs = now.getTime() + ( nbrMinutes * 60 * 1000); 
		now.setTime(nbrMillisecs); 
		context.response.write("doNotRunUntil: " +  now.toString() + "<br/>");
		
		try {
	   		var objValues;
	   		objValues = { custrecord_pri_qm_next_attempt:now };
			record.submitFields({ type:'customrecord_pri_qm_queue' ,id:228267 ,values:objValues });
		}
		catch(e) { context.response.write("exception: " +  e.message + "<br/>"); }



		context.response.write("ok " );
		return;
	    
		   // 624999  1047697
		   
   		var objValues = { custrecord_pay_file_final_approver:1047697 };
   		//objValues = { custrecord_pay_file_final_approver:624999 };
		record.submitFields({ type:'customrecord_payment_file' ,id:889 ,values:objValues });


		context.response.write("ok " );
		return;
	    
	    var tranIdList = [4698795 ,4698793]
    	//var relatedRecords = {transactionId:[4698795,4698793]};
    	var id = 4698893;
    	var body = "Testing<br/><br/>";
    	var pfcURL = url.resolveRecord({recordType:"customrecord_payment_file", recordId:887 });
        var pfcLink = "<a href='" + pfcURL + "'>Payment File Creation record " + "887" + "</a> <br/>";
        body = body + pfcLink + "<br/><br/>";
    	for each (tranId in tranIdList) {
        	var ioURL = url.resolveRecord({recordType:record.Type.CUSTOMER_REFUND, recordId:tranId});
            var ioLink = "<a href='" + ioURL + "'>Customer Refund " + tranId + "</a> <br/>";
        	body = body + ioLink;    		
    	}
  		email.send({ author:77671 ,recipients:'afodor@shareholderrep.com' ,subject:"Test Email" ,body:body });

		   
		context.response.write("ok " );
		return;

	    
	    
		try {
			var arrColumns         = new Array();
			var col_id             = search.createColumn({ name:'internalid'  });
			var col_parameters     = search.createColumn({ name:'custrecord_pri_qm_parameters'  });
			arrColumns.push(col_id);
			arrColumns.push(col_parameters);
			
			var filterValue1 = '"idTinCheck":{0},'.replace("{0}","84839");
			var filterValue2 = '"ExchangeRecord","targetId":"{0}"'.replace("{0}","639790");
			
			var arrFilters   = [         ['isinactive'                        ,'IS'              ,false ]
			                    ,'AND'  ,['custrecord_pri_qm_queue_name'      ,'IS'              ,"TINCheckNotifyTarget" ]
			                    ,'AND'  ,['custrecord_pri_qm_parameters'      ,'doesnotcontain'  ,filterValue1 ]
			                    ,'AND'  ,['custrecord_pri_qm_parameters'      ,'contains'        ,filterValue2 ]
		                       ];
			var searchNotifyQueueObj = search.create({'type':'customrecord_pri_qm_queue'
			                                           ,'filters':arrFilters 
		                                               ,'columns':arrColumns 	       });
			var searchNotifyQueue = searchNotifyQueueObj.run();
			searchNotifyQueueResults = searchNotifyQueue.getRange(0,1000);					
			context.response.write("searchNotifyQueueResults.length: " +  searchNotifyQueueResults.length + "<br/>");
			
			for each (result in searchNotifyQueueResults) {
				var Parms = result.getValue(col_parameters);
				var id = result.getValue(col_id);
				context.response.write("id: " +  id + ",     Parms: " + Parms + "<br/>");
			} // for each (result in searchNotifyQueueResults)

			
			
			
		} 
		catch(e) { context.response.write("exception: " + e.message + "<br/>" ); }
		   
		   
		context.response.write("ok " );
		return;
	    
		try {
			var placeholderDotTextFileId = appSettings.readAppSetting("Documents", "Placeholder.txt File Id");
			var arrColumnsDF       = new Array();
			var col_id             = search.createColumn({ name:'internalid'  });
			var col_name           = search.createColumn({ name:'name'  });
			var col_defaultDocType = search.createColumn({ name:'custrecord_default_doc_type'  });
			arrColumnsDF.push(col_id);
			arrColumnsDF.push(col_name);
			arrColumnsDF.push(col_defaultDocType);
			var eventRecordName_Customer = 6;
			var arrFiltersDF = [         ['isinactive'                        ,'IS'    ,false ]
			                    ,'AND'  ,['custrecord_def_record_name'        ,'ANYOF' ,eventRecordName_Customer ]
			                    ,'AND'  ,['custrecord_def_record_field_id'    ,'IS'    ,"category" ]
			                    ,'AND'  ,['custrecord_def_record_field_value' ,'IS'    ,"1" ]
		                       ];
			var searchDefaultDocumentsObj = search.create({'type':'customrecord_default_doc_list'
			                                           ,'filters':arrFiltersDF 
		                                               ,'columns':arrColumnsDF 	       });
			var searchDefaultDocuments = searchDefaultDocumentsObj.run();
			searchDefaultDocumentsResults = searchDefaultDocuments.getRange(0,1000);					
			context.response.write("searchDefaultDocumentsResults.length: " +  searchDefaultDocumentsResults.length + "<br/>");
		} 
		catch(e) { context.response.write("exception: " + e.message + "<br/>" ); }
		   
		context.response.write("ok " );
		return;

	   
	   
	    var objRcd = record.load({ type:"customrecord_acq_lot" ,id:302764 ,isDynamic:false });
  		context.response.write("custrecord_alpha_er_record: " +  objRcd.getValue("custrecord_alpha_er_record") + "<br/>");
  		
  		if (objRcd.getValue("custrecord_alpha_er_record").toString() > "") { context.response.write("> '' "  + "<br/>"); }
  		else { context.response.write("not > '' "  + "<br/>"); }
		   
		context.response.write("ok " );
		return;

	   
	   	var shareholder = 76500;
//		var searchFilters = [        ['isinactive' ,search.Operator.IS         ,["F"]          		 ]
//                             ,'AND', ['custrecord_dp_deal_checkbox_id'     ,search.Operator.ANY   ,["custentitycustomer_oppo_acceptype_aqmesc"]  ]
//                            ];
	   	
	   	//INSTR('*custentitycustomer_oppo_acceptype_aqmesc*', concat('-',concat({custrecord_dp_deal_checkbox_id},'-')) )
		
//	   	var fieldIdList = "-custentitycustomer_oppo_acceptype_aqmesc-custentity_acq_escrow_agent-";
//	   	var fieldFormula = "formulanumeric: INSTR('" + fieldIdList + "' ,concat('-',concat({custrecord_dp_deal_checkbox_id},'-')) )";
//		var searchFilters = [        ['isinactive' ,search.Operator.IS         ,["F"]          		 ]
//        ,'AND'  ,["formulanumeric: INSTR('-custentitycustomer_oppo_acceptype_aqmesc-custentity_acq_escrow_agent-' ,concat('-',concat({custrecord_dp_deal_checkbox_id},'-')) )", "greaterthan", "0"]
//       ];
		
		
	   	var fieldIdList = "-custentitycustomer_oppo_acceptype_aqmesc--custentity_acq_escrow_agent-";
	   	var fieldFormula = "INSTR('" + fieldIdList + "' ,concat( '-' ,concat({custrecord_dp_deal_checkbox_id}, '-')) )";
//		var searchFilters = [        ['isinactive' ,search.Operator.IS         ,["F"]          		 ]
//        ,'AND'  ,["formulanumeric: INSTR('-custentitycustomer_oppo_acceptype_aqmesc-custentity_acq_escrow_agent-' ,concat('-',concat({custrecord_dp_deal_checkbox_id},'-')) )", "greaterthan", "0"]
//       ];

	   	
   		context.response.write("fieldFormula: " +  fieldFormula + "<br/>");
	   	
	   	
		var searchFilterInactive = search.createFilter({name: 'isinactive'			,operator: search.Operator.IS          ,values:["F"]			});
		var searchFilterCheckboxName = search.createFilter({name: 'formulanumeric'  ,operator: search.Operator.GREATERTHAN ,values:["0"]
			                                             ,formula:fieldFormula });
		

		var searchFilters = [];
		searchFilters.push(searchFilterInactive);
		searchFilters.push(searchFilterCheckboxName);

		var searchObj = search.create({ type:'customrecord_deal_product' ,columns:[{name: 'internalid'} ,{name: 'name'} ] ,filters:searchFilters });
	   	var searchRun = searchObj.run()
   		var rsIndex = 0;
   		var rsStep = 1000;
   		var searchResults = searchRun.getRange(rsIndex, rsIndex + rsStep);

   		context.response.write("searchResults.length: " +  searchResults.length + "<br/>");

   		if (searchResults.length > 0) { 
    	   
    	   
   		}

	   
		   
   		context.response.write("ok " );
   		return;
	   
	   
	   
   		var objValues = { custrecord_pay_import_acq_approved_pay:true };
		record.submitFields({ type:'customrecord_payment_import_record' ,id:1627 ,values:objValues });

		   
		context.response.write("ok " );
		return;

	   
	   
	   
	   //create({	   type: record.Type.SALES_ORDER,	   isDynamic: true,	   defaultValues: {	   entity: 87	   }	   }
	   var defaultValues = {};
	   defaultValues.custrecord_tinchk_src_sys = "ExchangeRecord";
	   defaultValues.custrecord_tinchk_src_id  = "7941";
	   defaultValues.custrecord_tinchk_req_sts = 3;
	   defaultValues.custrecord_tinchk_ssnein  = "541-84-9439";
	   defaultValues.custrecord_tinchk_irs_nm  = "Lynn J. Bruno";
	   defaultValues.custrecord_tinchk_addr1   = "61350 Steens Mtn. Loop";
	   defaultValues.custrecord_tinchk_addr2   = "";
	   defaultValues.custrecord_tinchk_city    = "Bend";
	   defaultValues.custrecord_tinchk_st_txt  = "Oregon";
	   defaultValues.custrecord_tinchk_zip     = "97702";
	   defaultValues.custrecord_tinchk_trg_sys = "ExchangeRecord";
	   defaultValues.custrecord_tinchk_trg_id  = "7941";
	   
	   defaultValues.custrecord_tinchk_tinname_code    = "...";
	   defaultValues.custrecord_tinchk_tinname_result  = "...";
	   defaultValues.custrecord_tinchk_tinname_details = "...";
	   defaultValues.custrecord_tinchk_dmf_result      = "...";
	   defaultValues.custrecord_tinchk_dmf_data        = "...";
	   defaultValues.custrecord_tinchk_ein_result      = "...";
	   defaultValues.custrecord_tinchk_ein_data        = "...";
	   defaultValues.custrecord_tinchk_giin_result     = "...";
	   defaultValues.custrecord_tinchk_giin_nm         = "...";
	   defaultValues.custrecord_tinchk_giin_nm_match   = "...";
	   defaultValues.custrecord_tinchk_giin_score      = "...";
	   defaultValues.custrecord_tinchk_ofac_cnt        = "...";
	   defaultValues.custrecord_tinchk_ofac_data       = "...";
	   defaultValues.custrecord_tinchk_list_result     = "...";
	   defaultValues.custrecord_tinchk_list_match_cnt  = 77;
	   defaultValues.custrecord_tinchk_lists_matched   = "...";
	   defaultValues.custrecord_tinchk_list_data       = "...";
	   defaultValues.custrecord_tinchk_usps_result     = "...";
	   defaultValues.custrecord_tinchk_usps_msg        = "...";
	   defaultValues.custrecord_tinchk_usps_fmt_addr   = "...";
	   defaultValues.custrecord_tinchk_usps_zip        = "...";
	   defaultValues.custrecord_tinchk_ignored_match_cnt     = "...";
	   defaultValues.custrecord_tinchk_ignored_lists_matched = "...";
	   defaultValues.custrecord_tinchk_ignored_list_data     = "...";
	   var objRcd = record.create({ type:"customrecord_tin_check" ,isDynamic:false ,defaultValues:defaultValues });
	   objRcd.setValue("custrecord_tinchk_dmf_death_dt" ,new Date() );
	   objRcd.save();

	   
	   
	   
		context.response.write("ok " );
		return;
	   
	   var objValues = { custrecord_dealaction_notes:"..." };
		record.submitFields({ type:'customrecord_deal_action' ,id:3421 ,values:objValues });

		   
		context.response.write("ok " );
		return;
	   
	   
		var stateId = 2;		
		var objLookupFields = search.lookupFields({type:"customrecord_states" ,id:2 ,columns:["name" ]});
		context.response.write("objLookupFields " + JSON.stringify(objLookupFields)  + "<br/>");

	   
	   
	   
	   // 302759
	   var objRcd = record.load({ type:"customrecord_acq_lot" ,id:302759 ,isDynamic:true });
	   objRcd.setValue("custrecord_acq_loth_zzz_zzz_acqstatus" ,5);
	   objRcd.save();
	   
//	   
//	   var objRcd2 = record.load({ type:"customrecord_acq_lot_cert_entry" ,id:415380 ,isDynamic:true });
//	   objRcd2.setValue("custrecord_lot_cert_shareholder" ,388623);
//	   objRcd2.setValue("custrecord_lot_cert_deal" ,359987);
//	   objRcd2.save();
	   
	   
	   context.response.write("ok " );
	   return;
	   
	   
	   var objLookupFields = search.lookupFields({type:"customrecord_deal_escrow" ,id:60
           ,columns: ["custrecord_de_escrow_tax_rptg_rqd" ,"custrecord_de_escrow_tax_no_rptg_reason" ,"custrecord_de_tax_no_reporting_notes" ]});

	   context.response.write("objLookupFields " + JSON.stringify(objLookupFields)  + "<br/>");
	   
	   
	   context.response.write("ok " );
	   return;
	   
	   var objRcd = record.load({ type:"customrecord_paymt_instr_submission" ,id:1398 ,isDynamic:true });
	   objRcd.setValue("custrecord_pisb_source_case" ,29292929);
	   objRcd.save();
	   
       
	   context.response.write("ok " );
	   return;
	   
	   var objRcd = record.load({ type:"customrecord_acq_lot" ,id:7941 ,isDynamic:true });
	   var str1 = objRcd.getValue("custrecord_acq_loth_zzz_zzz_rcvdtimestmp").toString();
	   var objDate = objRcd.getValue("custrecord_acq_loth_zzz_zzz_rcvdtimestmp");
	   //var str1 = JSON.stringify(objDate);
	   
	   
	   var objDate = new Date("10/2/0013 12:43:00 pm");
	   
	   context.response.write("objDate: " +  objDate + "<br/>");
	   
	   var zzz = objRcd.getText("custrecord_acq_loth_zzz_zzz_rcvdtimestmp");
	   var str0 = zzz.substr(0,zzz.indexOf(' '));
	   context.response.write("str0: " +  str0 + "<br/>");
	   
	   context.response.write("str1: " +  objRcd.getText("custrecord_acq_loth_zzz_zzz_rcvdtimestmp") + "<br/>");
	  // context.response.write("str1: " + str1 + "<br/>");
	   if (objRcd.getValue("custrecord_acq_loth_zzz_zzz_rcvdtimestmp").toString() == "Invalid Date") { context.response.write("tests invalid " + "<br/>" ); }
	   
	   
	       
	   context.response.write("ok " );
	   return;

	   	var shareholder = 76500;
		var searchFilters = [        ['custrecord_acq_loth_zzz_zzz_shareholder'     ,search.Operator.ANYOF      ,[shareholder]  ]
                             ,'AND', ['isinactive' ,search.Operator.IS         ,["F"]         ]
                             ,'AND', [       ['custrecord_acq_loth_zzz_zzz_acqstatus'     ,search.Operator.NONEOF ,["5"] ]   
                                      ,'OR', ['custrecord_acq_loth_related_trans'     ,search.Operator.ANYOF   ,["@NONE@"]]
                                     ]
                            ];

		var searchExRecsObj = search.create({ type:'customrecord_acq_lot' ,columns:[{name: 'internalid'} ,{name: 'custrecord_acq_loth_zzz_zzz_acqstatus'} ,{name: 'custrecord_acq_loth_related_trans'}] ,filters:searchFilters });
	   	var searchExRecs = searchExRecsObj.run()
   		var rsIndex = 0;
   		var rsStep = 1000;
   		var searchExRecsResult = searchExRecs.getRange(rsIndex, rsIndex + rsStep);

       if (searchExRecsResult.length > 0) { 
    	   
          	LoopOuter: do { /*	 loop through results in 1000 row	blocks   */
           		rsIndex = rsIndex + rsStep;
         	    context.response.write("searchExRecsResult.length = " + searchExRecsResult.length + ", rsIndex: " + rsIndex + ",  rsStep: " + rsStep + " <br/>" );
           			
           		for (var ix = 0; ix < searchExRecsResult.length; ix++) {
         		   var obResult = searchExRecsResult[0];
        		   if (obResult.getValue("custrecord_acq_loth_zzz_zzz_acqstatus") == 5) {
        			   if (obResult.getValue("custrecord_acq_loth_related_trans") > "") {
            			   var id = obResult.getValue("internalid");
            			   context.response.write("Exchange rcd: " + id + "<br/>" );
        			   }
        		   }
           		} 
           		
           		searchExRecsResult = searchExRecs.getRange(rsIndex, rsIndex + rsStep);
           	} while (searchExRecsResult.length > 0) /* LoopOuter */
     	   
       }
       
       
       
       
 	   context.response.write("ok " );
	   return;

	   
		
	   var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:301557
                                                      ,columns: ["custrecord_acq_loth_related_trans" ,"isinactive" ,"custrecord_acq_loth_zzz_zzz_acqstatus" ]});
	   
	   var str1 = JSON.stringify( objExchangeRecordFields );
	   
	   context.response.write(str1 + "<br/>" );
		
	   if (objExchangeRecordFields.custrecord_acq_loth_related_trans[0].value > "") { context.response.write("ERROR: Exchange record is already paid, PI Submission create is not allowed" + "<br/>" );}

		  
		
	   context.response.write("ok " );
		   
	   return;
	   
	   
	
	   var checkedByFieldList = [ {"name":"Alex" ,"age":"59"}
	                             ,{"name":"Mirah" ,"age":"49"}
	                             ,{"name":"Ethan" ,"age":"14"}
	                             ,{"name":"Hazel" ,"age":"10"}
	                            ];
	   
	   checkedByFieldList.forEach(arrayFunction.bind(context));
	   
	   context.response.write("ok " );
	   return;
	   
	   
	   
	   var objRcd = record.load({ type:"customrecord_deal_action_resolution", id:2932 ,isDynamic:true });
	   var dateProcessed = context.newRecord.getValue("custrecord_tinchk_req_processed_ts");
	   var dateProcessedMS = dateProcessed.getTime() - (8*60*60*1000);
	   var adjustedDateProcessed = dateProcessed.setTime(dateProcessedMS);
	   objRcd.setValue("custrecord_tinchk_req_processed_ts" ,adjustedDateProcessed);
	   objRcd.save();


	   
	   context.response.write("ok " );
	   return;
	   
//	   
//	   var objRcd = record.load({ type:"customrecord_deal_action_resolution", id:2932 ,isDynamic:true });
//	   objRcd.setValue({ fieldId:"custrecord_dar_resolution_date_changed" ,value:false });
//	   objRcd.save();
//	   
//	   context.response.write("ok " );
//	   return;
	   
	   var objRcd = record.load({ type:"customrecord_deal_action_resolution", id:2932 ,isDynamic:true });
	   objRcd.setValue({ fieldId:"custrecord_resolution_amount" ,value: 413 });
	   objRcd.save();
	   
	   context.response.write("ok " );
	   return;

	   var QManagerParm = { "user":runtime.getCurrentUser().name ,"payFileCreationRecordID":159 ,"startingIndex":0 };
		var jsonFileObject = file.load({ id:11039327 });
	    var jsonFileContents = jsonFileObject.getContents(); //Get The Contents of the JSON file
	    var custRefundIDs = jsonFileContents.split(',');//Split the Contents of the JSON File to get each individual Customer Refund ID
		QManagerParm.CustRefundArray = custRefundIDs;
		var intQid = qmEngine.addQueueEntry("PaymentFileApprovedUpdateCustRefunds" ,QManagerParm ,null ,true ,'customscript_qm_pmtfile_apprv_upd_cusref');

	   
	   context.response.write("ok " );
	   return;
	   
	   
//       var rqst = context.request.parameters.rqst;
//       var nbrRefunds = 0;
//       
//       context.response.write( "rqst: " + rqst + "<br/>" );
//       
//       if (rqst == "custrefund") {  
//    	   try { nbrRefunds = parseInt(context.request.parameters.nbr); } catch(e){}
//           
//           if (typeof nbrRefunds == "number") { 
//               if (nbrRefunds > 0) { testing(nbrRefunds); }           
//           }
//       }
//       
//	   
//       
//	   context.response.write("ok " );
//	   return;
//	   
//	   function testing(nbrRefunds) {  
//		   
//		   
//		   	var arrColumns    = new Array();
//			col_amount        = search.createColumn({ "name":"amount"      ,"sortdir":null   });
//			col_internalid    = search.createColumn({ "name":"internalid"  ,"sort":search.Sort.DESC });
//			arrColumns.push( col_amount );
//			arrColumns.push( col_internalid );
//			
//			var arrFilters = [        ['type'     ,'ANYOF'      ,["CustCred"]  ]
//                              ,'AND', ['mainline' ,'IS'         ,["T"]         ]
//                              ,'AND', ['memo'     ,'STARTSWITH' ,["Alex test"] ]
//		                     ];
//			var searchObj = search.create({    'type':'creditmemo'
//			                                          ,'filters':arrFilters 
//		                                              ,'columns':arrColumns 	       });
//			var searchRun = searchObj.run();
//		    var searchResults = searchRun.getRange(0,1000); 
//			//log.debug(funcName, "searchResults.length: " +  searchTinCheckResults.length);
//			// If results are empty set deal to null
//			var amount = 0;
//			if (searchResults.length > 0) { 
//				amount = searchResults[0].getValue("amount") * -1;
//			} else { context.response.write("Ooooops! Cant get starting amount " + "<br/>" ); return; }
//			context.response.write("RemainingUsage1 " + RemainingUsage1 + "<br/>" );
//		   
//			var RemainingUsage1 = runtime.getCurrentScript().getRemainingUsage();
//			context.response.write("amount " + amount + "<br/>" );
//		   
//		    var ctr = 0;
//			for (var i=0; i<nbrRefunds; i++) {
//			   
//			   ctr = ctr + 1;
//			   amount = amount + 5;
//			   
//			   var objCreditMemo = record.copy({ type:record.Type.CREDIT_MEMO, id:2666010 ,isDynamic:true ,defaultValues:{} });
//
//			   objCreditMemo.selectLine({ sublistId:'item' ,line:0 });
//			   objCreditMemo.setCurrentSublistValue({sublistId:'item' ,fieldId:'amount' ,value:amount ,ignoreFieldChange:true });
//			   objCreditMemo.commitLine({ sublistId:'item' });
//			   
//			   var idCreditMemo = objCreditMemo.save();
//			   context.response.write("credit memo created,  id=" + idCreditMemo + " <br/>" );
//			   
//			   
//			   var objSeedRecord = record.load({ type:record.Type.CUSTOMER_REFUND, id:2666003 ,isDynamic:true });
//			   var defaultValues = {     entity:objSeedRecord.getValue("customer")
//		                            ,customform:140    };
//
//			   var objRecord = record.create({type:record.Type.CUSTOMER_REFUND ,isDynamic:true ,defaultValues:defaultValues });
//			   
//			   objRecord.setValue({fieldId:"department" ,value:objSeedRecord.getValue("department") });
//			   objRecord.setValue({fieldId:"class" ,value:objSeedRecord.getValue("class") });
//			   objRecord.setValue({fieldId:"custbody_acq_lot_createdfrom_exchrec" ,value:objSeedRecord.getValue("custbody_acq_lot_createdfrom_exchrec") });
//			   objRecord.setValue({fieldId:"custbodyacq_deal_link" ,value:objSeedRecord.getValue("custbodyacq_deal_link") });
//			   objRecord.setValue({fieldId:"paymentmethod" ,value:objSeedRecord.getValue("paymentmethod") });
//			   objRecord.setValue({fieldId:"paymentmethod" ,value:objSeedRecord.getValue("paymentmethod") });custrecord_acq_loth_4_de1_lotpaymethod
//			   objRecord.setValue({fieldId:"memo" ,value:"Alex test" });
//			   
//			   var numLines = objRecord.getLineCount({ sublistId:'apply'});
//			   
//			   
//			   if (numLines > 0) {
//				   objRecord.selectLine({ sublistId:'apply' ,line:0 });
//				   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'apply' ,value:true });
//				   objRecord.commitLine({ sublistId:'apply' });
//
//				   var newRecordId = objRecord.save();
//				   context.response.write("credit memo created,  id=" + newRecordId + "<br/>" );
//			   }
//			   else {
//				   context.response.write("no more credit memos " + "<br/>" );
//				   break;
//			   }
//			   
//			   
//			   var RemainingUsage2 = runtime.getCurrentScript().getRemainingUsage();
//			   context.response.write("RemainingUsage2 " + RemainingUsage2 + "===========================" + "<br/>" );
//			   if (RemainingUsage2 < 75) { context.response.write("remaining usage running low " + "<br/>" ); break; }
//		   } // for (var i=0; i<nbrRefunds; i++)
//		   
////			var RemainingUsage2 = runtime.getCurrentScript().getRemainingUsage();
////			var RemainingUsageDiff = RemainingUsage1 - RemainingUsage2;
////			context.response.write("RemainingUsage2 " + RemainingUsage2 + "<br/>" );
////			context.response.write("RemainingUsageDiff " + RemainingUsageDiff + "<br/>" );
//			
//			context.response.write(ctr + " credit refunds created "  + "<br/>" );
//
//		   
//		   return;  
//	   }
//
//
	   
	   
	   var objSeedRecord = record.load({ type:record.Type.CUSTOMER_REFUND, id:2666003 ,isDynamic:true });
	   var numLines = objSeedRecord.getLineCount({ sublistId:'apply'});
	   context.response.write("aracct: " + objSeedRecord.getValue("aracct") + "<br/>" );
	   context.response.write("numLines: " + numLines + "<br/>" );
	   objSeedRecord.selectLine({ sublistId:'apply' ,line:0 });
	   context.response.write("apply: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'apply' }) + "<br/>" );
	   context.response.write("amount: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'amount' }) + "<br/>" );
	   context.response.write("applydate: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'applydate' }) + "<br/>" );
	   context.response.write("internalid: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'internalid' }) + "<br/>" );
	   context.response.write("total: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'total' }) + "<br/>" );
	   context.response.write("due: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'due' }) + "<br/>" );
//	   context.response.write("amount: " + objSeedRecord.getCurrentSublistValue({ sublistId:'apply' ,fieldId:'amount' }) + "<br/>" );
	   
	   
	   var defaultValues = { entity:objSeedRecord.getValue("customer")
			                ,customform:140
//			                ,account:objSeedRecord.getValue("account")
//		 	   				,"department":objSeedRecord.getValue("department")
//			   				,"class":objSeedRecord.getValue("class")
//			   				,"custbody_acq_lot_createdfrom_exchrec":objSeedRecord.getValue("custbody_acq_lot_createdfrom_exchrec")
//			   				,"custbodyacq_deal_link":objSeedRecord.getValue("custbodyacq_deal_link")
//			   				,"paymentmethod":objSeedRecord.getValue("paymentmethod")
//		 	   				,memo:"AlexTest"
	   };
	   context.response.write("defaultValues: " + JSON.stringify(defaultValues) + "<br/>" );
	   
	   var objRecord = record.create({type:record.Type.CUSTOMER_REFUND ,isDynamic:true ,defaultValues:defaultValues });

	   context.response.write("aracct: " + objRecord.getValue("aracct") + "<br/>" );
	   
	   objRecord.setValue({fieldId:"department" ,value:objSeedRecord.getValue("department") });
	   objRecord.setValue({fieldId:"class" ,value:objSeedRecord.getValue("class") });
	   objRecord.setValue({fieldId:"custbody_acq_lot_createdfrom_exchrec" ,value:objSeedRecord.getValue("custbody_acq_lot_createdfrom_exchrec") });
	   objRecord.setValue({fieldId:"custbodyacq_deal_link" ,value:objSeedRecord.getValue("custbodyacq_deal_link") });
	   objRecord.setValue({fieldId:"paymentmethod" ,value:objSeedRecord.getValue("paymentmethod") });
	   objRecord.setValue({fieldId:"memo" ,value:"Alex test" });
	   
	   var numLines = objRecord.getLineCount({ sublistId:'apply'});
	   context.response.write("numLines: " + numLines + "<br/>" );
	   
	   if (numLines > 0) {
		   
		   objRecord.selectLine({ sublistId:'apply' ,line:0 });
		   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'apply' ,value:true });
		   objRecord.commitLine({ sublistId:'apply' });
	   }
	   
	   //objRecord.insertLine({		   sublistId: 'apply' ,line:0 ,ignoreRecalc: false });

	   
//	   var myDate = new Date();
//	   var lineNum = objRecord.selectNewLine({ sublistId: 'apply' });
//	   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'amount' ,value:85	});
//	   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'applydate' ,value:myDate	});
//	   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'internalid' ,value:2666005	});
//	   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'total' ,value:85	});
//	   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'due' ,value:85	});
//	   objRecord.commitLine({		   sublistId: 'apply'		   });
	   
	   
	   var newRecordId = objRecord.save();
	   context.response.write("newRecordId: " + newRecordId + "<br/>" );
	   
	   context.response.write("ok " );
	   return;
	   
	   
	   var objRecord = record.copy({ type:record.Type.CREDIT_MEMO, id:2666005 ,isDynamic:true ,defaultValues:{} });
	   
	   objRecord.selectLine({ sublistId:'item' ,line:0 });
	   var amount = objRecord.getCurrentSublistValue({ sublistId:'item' ,fieldId:'amount' });
	   amount = amount + 5;
	   objRecord.setCurrentSublistValue({sublistId:'item' ,fieldId:'amount' ,value:amount ,ignoreFieldChange:true });
	   objRecord.commitLine({ sublistId:'item' });
	   
	   objRecord.save();
	   
	   context.response.write("ok " );
	   return;
	   
	   
   	var arrColumns        = new Array();
	var col_name          = search.createColumn({ name:'name'  });
	arrColumns.push(col_name);
	var arrFilters = [    ['isinactive' ,'IS' ,false] ,'AND' ,['internalid' ,'IS' ,6 ]   ];
	var objSearch = search.create({ 'type':'customlist_proj_task_mng_dept' ,'filters':arrFilters ,'columns':arrColumns });
	var runSearch = objSearch.run();
    var SearchResults = runSearch.getRange(0,1000); 

	   
	   context.response.write("ok " + SearchResults.length );
	   return;
	   
	   
	    var rcdTinCheck = record.load({type:'customrecord_tin_check' ,id:743} );

	    notifyTargetExchangeRecord(743 ,"ExchangeRecord" ,754 ,rcdTinCheck);
	   
		
	   context.response.write("ok "  );
	   return;
	   
	   var rcdTinCheck = record.load({type:'customrecord_tin_check' ,id:10315} );
		
	   context.response.write("requestDate: " + rcdTinCheck.getValue("custrecord_tinchk_req_ts") );
	   context.response.write("<br/><br/> "  );
		
	   context.response.write("timezoneOffset: " + rcdTinCheck.getValue("custrecord_tinchk_req_ts").getTimezoneOffset() );
	   context.response.write("<br/><br/> "  );
		
		
	   var tinCheckRequest = { requestDate:rcdTinCheck.getValue("custrecord_tinchk_req_ts")	};
	   context.response.write("tinCheckRequest: " + JSON.stringify(tinCheckRequest) );
	   context.response.write("<br/><br/> "  );
	   
	   context.response.write("requestDate: " + tinCheckRequest.requestDate.toString() );
	   context.response.write("<br/><br/> "  );
	   
	   var objWithDate = { dateValue:rcdTinCheck.getValue("custrecord_tinchk_req_ts")	};
	   var tsOffest = rcdTinCheck.getValue("custrecord_tinchk_req_ts").getTimezoneOffset();
	   var tsOffestHours = parseInt(tsOffest / 60);
       context.response.write("tsOffestHours: " + tsOffestHours );
       context.response.write("<br/><br/> "  );
	   var tsOffestMinutes = tsOffest - (tsOffestHours * 60);
       context.response.write("tsOffestMinutes: " + tsOffestMinutes );
       context.response.write("<br/><br/> "  );
	   
       var lzHours; var lzMinutes; var lzSign; // lz=Local Zone
       if (tsOffest < 1) { lzSign = "+" } else { lzSign = "-" }
       if (tsOffestHours < 10) { lzHours = "0" } else { lzHours = "0" }
       if (tsOffestMinutes < 10) { lzMinutes = "0" } else { lzMinutes = "0" }
       var offsetString = lzSign + lzHours + tsOffestHours + ":" + lzMinutes + tsOffestMinutes;
       context.response.write("offsetString: " + offsetString );
       context.response.write("<br/><br/> "  );
	   
	   var tsOffest = rcdTinCheck.getValue("custrecord_tinchk_req_ts").getTimezoneOffset() * -1;
	   var dateString = JSON.stringify( objWithDate.dateValue);
	   var dateString = JSON.stringify(rcdTinCheck.getValue("custrecord_tinchk_req_ts"));
       context.response.write("dateString: " + getDateTimeStringWithLocalOffset(rcdTinCheck.getValue("custrecord_tinchk_req_ts")) );
	   
	   
	   
	   context.response.write("<br/><br/> "  );
		
	   context.response.write("ok "  );
	   return;

		
		context.response.write("getEnvironment: " + tools.getEnvironment() );
		
		context.response.write("<br/> "  );
	   
		   
		context.response.write("isEnvironment: " + tools.isEnvironment("DEV") );
		
		context.response.write("<br/> "  );
	   
	   
		context.response.write("ok " + runtime.accountId );
		return;

		
		var objValues = {custrecord_acq_loth_0_de1_notes:"Alex Test" };
	   //var objValues = {custrecord_acq_loth_1_de1_shrhldcountry:38 ,custrecord_acq_loth_1_de1_shrhldstate:4};
	   //var objValues = {custrecord_acq_loth_1_de1_shrhldcountry:null};
	   record.submitFields({ type:'customrecord_acq_lot' ,id:302755 ,values:objValues });

	   
		context.response.write("ok ");
		return;

	   
	   	var arrColumns        = new Array();
		col_InternalId        = search.createColumn({ "name":"internalid"  });
		arrColumns.push( col_InternalId );
		
		var arrFilters = [        ['internalidnumber' ,'GREATERTHAN' ,0 ]
	                     ];
		var searchTinCheckObj = search.create({    'type':'customrecord_tin_check'
		                                          ,'filters':arrFilters 
	                                              ,'columns':arrColumns 	       });
		var searchTinCheck = searchTinCheckObj.run();
	    var searchTinCheckResults = searchTinCheck.getRange(0,1000); 
		log.debug(funcName, "searchTinCheckResults.length: " +  searchTinCheckResults.length);
		// If results are empty set deal to null
		if (searchTinCheckResults.length > 0) { 
			 for (var i=0; i<searchTinCheckResults.length; i++) {
				    var internalId = searchTinCheckResults[i].getValue(col_InternalId);
				 
					try {
						rcdId = record.delete({ type:'customrecord_tin_check' ,id:searchTinCheckResults[i].getValue(col_InternalId) });			
					}
					catch(e) {
		
						
					   	var arrColumnsEx        = new Array();
						col_InternalId_ex     = search.createColumn({ "name":"internalid"  });
						arrColumnsEx.push( col_InternalId_ex );
						
						var arrFiltersEx = [     ['custrecord_exrec_tinchk_src_giin' ,'IS' ,internalId ]
		                                  ,'OR' ,['custrecord_exrec_tinchk_src_tin'  ,'IS' ,internalId ]
		                                  ,'OR' ,['custrecord_exrec_usps_src_usps'   ,'IS' ,internalId ]
					                     ];
						var searchExchangeRcdObj = search.create({    'type':'customrecord_acq_lot'
						                                          ,'filters':arrFiltersEx 
					                                              ,'columns':arrColumnsEx 	       });
						var searchExchangeRcd = searchExchangeRcdObj.run();
					    var searchExchangeRcdResults = searchExchangeRcd.getRange(0,1000); 
						log.debug(funcName, "searchExchangeRcdResults.length: " +  searchExchangeRcdResults.length);
						// If results are empty set deal to null
						if (searchExchangeRcdResults.length > 0) {


							log.debug(funcName, "searchExchangeRcdResults.id: " + searchExchangeRcdResults[0].getValue(col_InternalId_ex) );
							
	                        var objValues = {"custrecord_exrec_tinchk_src_giin":null ,"custrecord_exrec_tinchk_src_tin":null  ,"custrecord_exrec_usps_src_usps":null  };
	                		record.submitFields({ type:'customrecord_acq_lot' ,id:searchExchangeRcdResults[0].getValue(col_InternalId_ex) ,values:objValues });
							
						}				 
					 
						try {
							rcdId = record.delete({ type:'customrecord_tin_check' ,id:searchTinCheckResults[i].getValue(col_InternalId) });			
						}
						catch(e2) {	}					
						
						
						
						
					}
			 }	 
		}
	   
		context.response.write("ok ");
		return;
	   
//	   var rcdPayInstrSub = record.load({type:'customrecord_paymt_instr_submission' ,id:1185});
//	   rcdPayInstrSub.setValue({ fieldId:"custrecord_pisb_deal" ,value:544399 });
//	   rcdPayInstrSub.save();
//	   
//	   
//	   
//	   return;
	   
       var objValues;
       objValues = {"custrecord_pisb_exchange":117934 ,"custrecord_pisb_shareholder":757008  }; // Exchange passes
       objValues = {"custrecord_pisb_exchange":51058  ,"custrecord_pisb_shareholder":757008   }; // Echange fail shrhldr
       objValues = {"custrecord_pisb_exchange":302751   }; //Exchange fail inactive
       //objValues = {"custrecord_pisb_exchange":51029   }; //Exchange fail inactive
       //record.submitFields({ type:'customrecord_paymt_instr_submission' ,id:1187 ,values:objValues });
		
//       objValues = {"custrecord_pisb_shareholder":596973  };
       objValues = {"custrecord_pisb_deal":740134  };
       record.submitFields({ type:'customrecord_paymt_instr_submission' ,id:1185 ,values:objValues });
	   
	   
	   return;
	   
//		var hostKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDBRD/KOjiJSC53W4rsOJ/R+BaJnVlcbbuzWwrQZXicVoWy1LjNAbnOXW4MiqYq/j2STBHuorLFHWcyGB70nxhcpEMUYCaBigX+rJv/J7L+0s3ibntzGjnGUoBTKa2jk5MZKbOEI57x1AxFYtBr5F3hZjkwUBsBH3r+o+DhV/b+iToUpWlIYgJ94zPQDW5NoTlkqpecouXOiH9m0GPFyvH+ApJZmyYYmrlZXMuTJlRohTQ+CxujmfpLeJ3oqxxzoV59Lj7Hvea/WanS93LQ9QLN92bxlHGIeD1aO1f5zGtSWur2bn6b39Fv2bxsg7uOJRywrwA1m8fRIUYfCtZ5XAXn';
//
//		var objPaymentFileType = search.lookupFields({type:'customrecord_pay_file_type' ,id:3
//            ,columns: ["custrecord_pft_cred_username" 
//                      ,"custrecord_pft_cred_password"
//                      ,"custrecord_pft_cred_password_guid"
//                      ,"custrecord_pft_cred_host_key"
//                      ,"custrecord_pft_cred_url"
//                      ,"custrecord_pft_ftp_target_dir_default"
//                      ,"custrecord_pft_ftp_target_dir_prod"]});
//		
//		if (hostKey == objPaymentFileType.custrecord_pft_cred_host_key) {context.response.write("equal ");}
//		else {context.response.write("NOT equal ");}
//		
//		
//		
//		return;
	   
	   var rcd  = record.load({type:'customrecord_payment_file' ,id:148}); 
	   //rcd.setValue("custrecord_pay_file_status"         ,1);
	   rcd.setValue("custrecord_pay_file_approved_by"    ,null);
	   rcd.setValue("custrecord_pay_file_approved_date"  ,null);
	   rcd.save();
	   context.response.write("ok ");
	   
	   return;
	   
	   
   	   var arrFieldsToCopy = JSON.parse( appSettings.readAppSetting("TIN Check", "TINCHK Duplicate Request Fields To Copy") ); 
	   var objFieldsAndValues = {};
	
	   for (var ix=0; ix<arrFieldsToCopy.length; ix++) {
		   	objFieldsAndValues[arrFieldsToCopy[ix]] = "test";
		    }
	
	   var str1 = JSON.stringify(objFieldsAndValues);
	   log.debug("objFieldsAndValues" ,"objFieldsAndValues: " + str1);

	   
	   
	   return;
	   
       var param_PaymentFileCreationId = context.request.parameters.pfcId;
       log.debug(funcName, "param_PaymentFileCreationId: " + param_PaymentFileCreationId);
       
       if (param_PaymentFileCreationId) {
           var UserId = runtime.getCurrentUser().id;
			record.submitFields({ type:'customrecord_payment_file' ,id:param_PaymentFileCreationId 
				,values:{ 'custrecord_pay_file_approved_by':UserId
			             ,'custrecord_pay_file_approved_date':new Date()
			             ,'custrecord_pay_file_approved_by':2
				        } });
				
			context.response.write("OK");			
       
       } else {        context.response.write("pfcId URL Parameter missing"); }

	   
	   
	   return;
	    
	   var settingValue = appSettings.readAppSetting("TIN Check", "TINCHK Reset Fields Exchange Record");
   	   log.debug(funcName, "settingValue " + settingValue );
	   var resetFields = JSON.parse( appSettings.readAppSetting("TIN Check", "TINCHK Reset Fields Exchange Record") );
       context.response.write("OK");

	   return;
	   
	   var rcd  = record.load({type:'customrecord_tin_check' ,id:418});
   	   var fieldValue = rcd.getValue("custrecord_tinchk_usps_result").toString() + "";
	   log.debug(funcName, "fieldValue:" + fieldValue );
   	   if (!fieldValue) { log.debug(funcName, "!fieldValue"  ); } else { log.debug(funcName, "!fieldValue is not null "  ); }
   	   if (fieldValue > "") { log.debug(funcName, "fieldValue > '' "  ); } else { log.debug(funcName, "fieldValue is not > '' "  ); }
   	   
   	   log.debug(funcName, "typeof fieldValue " + typeof fieldValue );
	   

	   return;
	   
	   var rcd  = record.load({type:'customrecord_acq_lot' ,id:101});
	   var res  = rcd.getValue("custrecord_acq_loth_1_de1_shrhldcountry");
	   var res2 = rcd.getText("custrecord_acq_loth_1_de1_shrhldcountry");
	   log.debug(funcName, "res >>>" + res + "<<<" + "          res2 >>>" + res2 + "<<<");
	   return;
	   
	   
	   
	   var addr1 = "heheh  p o Box    P O box dsgsfg";
	   var res = addr1.toString().replace(/\bp o box\b/gi ,"PO BOX");
	   log.debug(funcName, "res >>>" + res + "<<<");
	   return;
	   
	   
	   var giin = "   44|44  777 99,9 99.99.95 a !@#$%^&*()_+-=[]{};':,.,.<>?/  ";
	   		
	   var res = formatGIIN(giin);
	   log.debug(funcName, "res >>>" + res + "<<<");
	   return;
	   
	   var state = "alabama";
	   var stateCode = getStateCode(state);
	   log.debug(funcName, "stateCode: " + stateCode );
	   
       return;
	   
       
	   var str = "   Test . fff , ggg | . ooo / lll ,   hhh , lll .         kkk | ooo     ";
	   var res = str.replace(/,/g, "").replace(/\./g, "").replace(/\|/g, "").replace(/  +/g, " ").trim();
	   log.debug(funcName, "str >>>" + str + "<<<");
	   log.debug(funcName, "res >>>" + res + "<<<");
	   
       return;
	   
       var funcName = scriptName + ".onRequest ";
       log.debug(funcName, "Starting");
       var objTinCheckTest = new requestTinCheck();
       objTinCheckTest.Prop1 = "value1";
       objTinCheckTest.Prop2 = "value2";
       log.debug(funcName, "Prop1: " + objTinCheckTest.getValue("Prop1"));
       
       
       return;
	   
	   var inputString = "298764535Bob JOHNSON2143 Elm St #324 EugeneOR97405"; 

//	   var str1 = JSON.stringify(crypto);
//       log.debug(funcName, "crypto: " + str1);
	   
	   var objHash = crypto.createHash({ algorithm: crypto.HashAlg.SHA256 });
	   objHash.update(inputString);
	   var hash = objHash.digest({ outputEncoding:encode.Encoding.HEX });
	   
       log.debug(funcName, "hash: " + hash);
       
	   return;
	  
	   var inputString = "298764535Bob JOHNSON2143 Elm St #324 EugeneOR97405"; 
	   
	   var hash = generateHash(inputString); 
	   
       log.debug(funcName, "hash: " + hash);
	   //context.response.write(hash);
	    
	   return;
        
        var TinCheckReturnObject = {"ServiceQueueId": "6420f6bb-0216-45b3-b98e-7a656db4ca8f"
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
        		};
        
        
        var objReturn;
        objReturnAccepted    = {"result":"accepted"    ,"message":"" };
        objReturnUnavailable = {"result":"unavailable" ,"message":"" };
        objReturnDuplicate   = {"result":"duplicate"   ,"message":"" };
        objReturnError       = {"result":"error"       ,"message":"Required fields missing" };
        
        //objReturn = objReturnAccepted;
        //objReturn = objReturnUnavailable;
        objReturn = objReturnDuplicate;
        //objReturn = objReturnError;
        
        if (objReturn.result == "duplicate") { objReturn.resultData = TinCheckReturnObject; }
                
		var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});                                   
		scriptTask.scriptId = "customscript_acq_lot_da_qm_aprv_pmt";                                   
		var scriptTaskId = scriptTask.submit();                                 
        
        
        
        
        var sReturnObject = JSON.stringify(objReturn);
        context.response.write(sReturnObject);


  } // onRequest function
   
   
   

   //===========================================================================================================================================
   //===========================================================================================================================================
   function arrayFunction(objFields, ix, arr ) {
	   var context = this; // assign "this" to a variable with a meaningful name to identify what it actually is
	   context.response.write(objFields.name + "<br/>" );
   }
   
   //===========================================================================================================================================
   //===========================================================================================================================================
   function compareOldRecordToNewRecord(context) {
		var fieldListNew = context.newRecord.getFields();
		var fieldListOld = context.oldRecord.getFields();
		for (var ix=0; ix<fieldListNew.length; ix++){
			var fieldName = fieldListNew[ix];
			var fieldValue = context.newRecord.getValue(fieldName);
			var oldValue = "missing"
			for (var jx=0; jx<fieldListOld.length; jx++){
				try {
					if (fieldListNew[ix] == fieldName ) {
						if (context.newRecord.getValue(fieldName) != context.oldRecord.getValue(fieldName)) { oldValue = context.oldRecord.getValue(fieldName); }
						else { oldValue = ""; }
					}
				} catch(eee) {oldValue = "exception"}
			}
			if (oldValue > "") { log.debug(fieldName ,"new: " + fieldValue + ",    old: " + oldValue ); }
		}
   } // ==================================================================  custrecord_pay_import_approved_by
   


   
   
   //===========================================================================================================================================
   //===========================================================================================================================================
   function formatGIIN(str) {
	   
	   //var temp = str.toUpperCase().replace(/ /g, "").replace(/\|/g, "").replace(/,/g, "").replace(/\./g, "").trim();
	   var temp = str.replace(/\D/g,"").trim();
	   
	   
	   result = temp.substring(0,6) + "." + temp.substring(6,11) + "." + temp.substring(11,13) + "." + temp.substring(13);
	   
	   return result;
	   
   }
   
   

	//===============================================================================================================================	
	//===============================================================================================================================	
	function getStateCode(str) {
		
	    var strU = str.toUpperCase();
		var objStateCodes = {"ALABAMA":"AL" 
			    ,"ALASKA":"AK"
				,"ARIZONA":"AZ"
				,"ARKANSAS":"AR"
				,"CALIFORNIA":"CA"
				,"COLORADO":"CO"
				,"CONNECTICUT":"CT"
				,"DELAWARE":"DE"
				,"DISTRICT OF COLUMBIA":"DC"
				,"FLORIDA":"FL"
				,"GEORGIA":"GA"
				,"HAWAII":"HI"
				,"IDAHO":"ID"
				,"ILLINOIS":"IL"
				,"INDIANA":"IN"
				,"IOWA":"IA"
				,"KANSAS":"KS"
				,"KENTUCKY":"KY"
				,"LOUISIANA":"LA"
				,"MAINE":"ME"
				,"MARYLAND":"MD"
				,"MASSACHUSETTS":"MA"
				,"MICHIGAN":"MI"
				,"MINNESOTA":"MN"
				,"MISSISSIPPI":"MS"
				,"MISSOURI":"MO"
				,"MONTANA":"MT"
				,"NEBRASKA":"NE"
				,"NEVADA":"NV"
				,"NEW HAMPSHIRE":"NH"
				,"NEW JERSEY":"NJ"
				,"NEW MEXICO":"NM"
				,"NEW YORK":"NY"
				,"NORTH CAROLINA":"NC"
				,"NORTH DAKOTA":"ND"
				,"OHIO":"OH"
				,"OKLAHOMA":"OK"
				,"OREGON":"OR"
				,"PENNSYLVANIA":"PA"
				,"RHODE ISLAND":"RI"
				,"SOUTH CAROLINA":"SC"
				,"SOUTH DAKOTA":"SD"
				,"TENNESSEE":"TN"
				,"TEXAS":"TX"
				,"UTAH":"UT"
				,"VERMONT":"VT"
				,"VIRGINIA":"VA"
				,"WASHINGTON":"WA"
				,"WEST VIRGINIA":"WV"
				,"WISCONSIN":"WI"
				,"WYOMING":"WY"
				,"AMERICAN SAMOA":"AS"
				,"GUAM":"GU"
				,"NORTHERN MARIANA ISLANDS":"MP"
				,"PUERTO RICO":"PR"
				,"US VIRGIN ISLANDS":"VI"
				,"US MINOR OUTLYING ISLANDS":"UM"};
		if (objStateCodes[strU]) { return objStateCodes[strU]; }
		return str;
	}
	


   function generateHash(s) {
	    var hash = 0,
	      i, char;
	    if (s.length == 0) return hash;
	    for (i = 0, l = s.length; i < l; i++) {
	      char = s.charCodeAt(i);
	      hash = ((hash << 5) - hash) + char;
	      hash |= 0; // Convert to 32bit integer
	    }
	    return hash;
	  };
  
  return {
   onRequest : onRequest
  };
});