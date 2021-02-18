/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Library for Tax Form
 */

define(["N/search", "N/url", "N/runtime", "N/record"
        ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
        ,'/.bundle/132118/PRI_AS_Engine'
        ],
       
    function (search, url, runtime, record
    		 ,srsConstants
    		 ,appSettings
    		 ) {

	
		//========================================================================================================================================
		//========================================================================================================================================
		function GetLastBatchStatus(taxFormBatchId){
			var returnObject = {"value":null ,"text":null };
			var mySearchObj = search.create({ type:'customrecord_tax_form_batch'
				                          ,filters:[        ["internalid"           ,search.Operator.ANYOF  ,[taxFormBatchId]]
				                                    ,'AND' ,["systemNotes.field"    ,search.Operator.ANYOF  ,["CUSTRECORD_TXFM_BATCH_STATUS"]]
		                                            ,'AND' ,["systemNotes.oldvalue" ,search.Operator.ISNOT  ,["Processing Failed"]]
                                                    ,'AND' ,["systemNotes.oldvalue" ,search.Operator.ISNOT  ,["Processing in progress"]]
				                                   ]
				                          ,columns:["systemNotes.field" ,"systemNotes.oldvalue" ,"systemNotes.newvalue" ,"systemNotes.type"
				                        	       ,search.createColumn({name:"date" ,join:"systemNotes" ,sort:search.Sort.DESC })
				                                   ]
				                           }).run();
			var mySearchResults = mySearchObj.getRange(0,1);
			
			if (mySearchResults.length == 0) { return returnObject; }
			
			returnObject["text"] = mySearchResults[0].getValue({name:"oldvalue" ,join:"systemNotes"});
			
			var statusSearchObj = search.create({ type:'customrecord_txfm_batch_statuses'
                                              ,filters:[        ["name"  ,search.Operator.IS  , returnObject["text"]  ]
                                                       ]
                                              ,columns:["internalid" ]
                                                }).run();
            var statusSearchResults = statusSearchObj.getRange(0,1);
            
            if (statusSearchResults.length > 0) { returnObject["value"] = statusSearchResults[0].getValue("internalid") }
            
            return returnObject;
		}
	
		
		//========================================================================================================================================
		//========================================================================================================================================
		function getTaxFormDocumentsFolder(taxYear) {
			
			var taxYearFolderName   = taxYear + " Shareholder Tax Documents";
			var taxYearFolderId;

			var parentFolder  = appSettings.readAppSetting("Tax Forms", "Parent Folder For Tax Forms");
		    
		    // see if Destination Folder exists, if not create it
			var col_internalid = new nlobjSearchColumn('internalid');
			var arrColumns = [col_internalid ];	
			var arrFilters = [];
			arrFilters.push( new nlobjSearchFilter('parent' ,null  ,'anyof' ,[parentFolder] ) );
			arrFilters.push( new nlobjSearchFilter('name'   ,null  ,'is'    ,[taxYearFolderName] ) );
			var mySearchObj = search.create({ type:'folder'
		                                  ,filters:[        ["parent"  ,search.Operator.ANYOF  ,[parentFolder]]
		                                            ,'AND' ,["name"    ,search.Operator.IS     ,[taxYearFolderName]]
		                                           ]
		                                  ,columns:["internalid"
		                                           ]
		                                    });
			var mySearch = mySearchObj.run();
			var mySearchResults = mySearch.getRange(0,1);
			
			if (mySearchResults.length == 0) {
				try {
					var objRecord = record.create({ type:record.Type.FOLDER ,isDynamic:true });
			        objRecord.setValue({ fieldId:'parent' ,value:parentFolder });
			        objRecord.setValue({ fieldId:'name'   ,value:taxYearFolderName   });
			        taxYearFolderId = objRecord.save({ enableSourcing:true ,ignoreMandatoryFields:true });
				}
				catch(e) {
					// try search again just in case 2 scripts were trying this simultaneously
					var mySearch2 = mySearchObj.run();
					var mySearchResults2 = mySearch2.getRange(0,1);
					if (mySearchResults2.length > 0) { taxYearFolderId = mySearchResults2[0].getValue("internalid"); }
					else { throw "Exception when creating Tax Forms folder: " + JSON.stringify(e); }
				}
			}
			else { taxYearFolderId = mySearchResults[0].getValue("internalid"); }
			
			return taxYearFolderId;
		}
	
		
		//========================================================================================================================================
		//========================================================================================================================================
		function createTaxFormBatchDetailRecord(result ,taxFormBatch  ,overrideValues ,searchObj){
			log.debug("TaxForm_Library.createTaxFormBatchDetailRecord" ,"started "  );
            var recordId     = result.id;
      	  	var funcName     = "createTaxFormBatchDetailRecord   id:" + recordId;
			
			if (searchObj) { // This is a search result, not a mapReduce result, convert it
				result = convertSearchResult(result ,taxFormBatch ,searchObj);
			}
			log.debug(funcName ,"result: " + JSON.stringify(result)  );
			
            var success  = false;
            var deal     = "";
            var tfDetail = null;
            
            try {

            	deal                     = (result.values["GROUP(custrecord_acq_loth_zzz_zzz_deal)"] && result.values["GROUP(custrecord_acq_loth_zzz_zzz_deal)"]["value"]) ||"";
            	var shareholder          = (result.values["GROUP(custrecord_acq_loth_zzz_zzz_shareholder)"] && result.values["GROUP(custrecord_acq_loth_zzz_zzz_shareholder)"]["value"]) ||"";
         		var er                   = result.values["MAX(id)"] ||"";
         		var box1DProceeds        = (result.values["SUM(custrecord_act_lotce_tax_report_amount.CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT)"]) ||0;
         		var box1e                = 0;
         		var box4FedIncomeWitheld = (result.values["SUM(custrecord_acq_lotce_zzz_zzz_taxwithheld.CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT)"]) ||0;
         		
         		var erREC = search.lookupFields({type:"customrecord_acq_lot" ,id:er
    					                     ,columns: ["custrecord_exrec_payment_eff_date"
    					                               ,"custrecord_acq_loth_2_de1_ssnein"
    					                               ,"custrecord_acq_loth_2_de1_irsname"
    					                               ,"custrecord_acq_loth_1_de1_shrhldaddr1"
    					                               ,"custrecord_acq_loth_1_de1_shrhldaddr2"
    					                               ,"custrecord_acq_loth_1_de1_shrhldaddr3"
    					                               ,"custrecord_acq_loth_1_de1_shrhldcity"
    					                               ,"custrecord_acq_loth_1_de1_shrhldstate"
    					                               ,"custrecord_acq_loth_1_de1_shrhldpostalcd"
    					                               ,"custrecord_acq_loth_1_de1_shrhldcountry"
    					                               ,"CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_SHAREHOLDER.custentity4"
    					                               ,"CUSTRECORD_ACQ_LOTH_RELATED_TRANS.trandate"
    					                               ]
    				                            });
         		
         		log.audit("erREC ", JSON.stringify(erREC));
    			
         		var paymentEffectiveDate = erREC["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.trandate"] && (new Date(erREC["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.trandate"]));
            	var tin                  = erREC.custrecord_acq_loth_2_de1_ssnein;
            	var shareholderIRSName   = erREC.custrecord_acq_loth_2_de1_irsname;
            	var addr1                = erREC.custrecord_acq_loth_1_de1_shrhldaddr1;
            	var addr2                = erREC.custrecord_acq_loth_1_de1_shrhldaddr2;
            	var addr3                = erREC.custrecord_acq_loth_1_de1_shrhldaddr3;
            	var address              = (addr1 + " " + addr2 + " " + addr3).trim();
            	var city                 = erREC.custrecord_acq_loth_1_de1_shrhldcity;
            	var state                = (erREC.custrecord_acq_loth_1_de1_shrhldstate && erREC.custrecord_acq_loth_1_de1_shrhldstate[0] && erREC.custrecord_acq_loth_1_de1_shrhldstate[0].value)|| null;
            	var postalCode           = erREC.custrecord_acq_loth_1_de1_shrhldpostalcd;
            	var country              = (erREC.custrecord_acq_loth_1_de1_shrhldcountry && erREC.custrecord_acq_loth_1_de1_shrhldcountry[0] && erREC.custrecord_acq_loth_1_de1_shrhldcountry[0].value)|| null;
            	var altemail            = erREC["CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_SHAREHOLDER.custentity4"];
            	
         		tfDetail = record.create({type:"customrecord_tax_form_batch_detail", isDynamic: true});
         		
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_batch_id"          ,value:taxFormBatch });
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_deal"              ,value:deal });
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_shareholder"       ,value:shareholder });
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_exrec_id"          ,value:er });
            	if (paymentEffectiveDate) {
            		tfDetail.setValue({fieldId:"custrecord_txfm_detail_lastpay_dt"    ,value:paymentEffectiveDate });
            	}
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_txid"              ,value:tin});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_sh_name"           ,value:shareholderIRSName});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_address"           ,value:address});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_city"              ,value:city});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_state"             ,value:state});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_postal" ,value:postalCode});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_country"  ,value:country});
            	var deliverytype = (altemail) ? srsConstants["Tax Form Batch Detail Delivery Type"]["E-Mail"] : srsConstants["Tax Form Batch Detail Delivery Type"]["Mail"];
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_delivery"          ,value:deliverytype});
            	
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_box1d_proceed"     ,value:box1DProceeds});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_box4_fedwithheld"  ,value:box4FedIncomeWitheld});
            	//tfDetail.setValue({fieldId:"custrecord_txfm_detail_box1e_cost_other"  ,value:box1e});
            	
            	if (overrideValues) {
            		for (fieldName in overrideValues) {
                    	tfDetail.setValue({fieldId:fieldName ,value:overrideValues[fieldName] });
            		}
            	}
            	
            	var tfDetailId = tfDetail.save();	
 				success = tfDetailId;
            }
            catch(e) { log.error(funcName, "exception: " + JSON.stringify(e) ); throw e; }
			
			return success;
		}

		
		//========================================================================================================================================
		//========================================================================================================================================
		function convertSearchResult(searchResult ,taxFormBatchId ,searchObj){
			log.debug("TaxForm_Library.createTaxFormBatchDetailRecord" ,"started "  );
			var mapReduceLikeObject = {};
			mapReduceLikeObject["id"] = taxFormBatchId;
	      	var objValues = {};
			
	      	for (ix in searchObj.columns) {
	      	    var column = searchObj.columns[ix];
				log.debug("TaxForm_Library.createTaxFormBatchDetailRecord" ,"column: " + JSON.stringify(column)  );
	      		var fieldName = column.name;
	      		if (column.join) { fieldName = fieldName + "." + column.join ; }
	      		var columnName;
	      		if (column.summary) { columnName = column.summary + "(" + fieldName + ")"; }
	      		else { columnName = fieldName; }

	      		var value = searchResult.getValue(column);
	      		if (value == "" && column.name == "custrecord_acq_lotce_zzz_zzz_taxwithheld") { value = ".00"; }
	      		var text  = searchResult.getText(column);
	      		if (text) { 
		      		var obj = {};
		      		obj["value"] = searchResult.getValue(column);
	      			obj["text"]  = text; 
		      		objValues[columnName] = obj;
	      		}
	      		else { objValues[columnName] = value.toString(); }
	      	}
			
	      	mapReduceLikeObject["values"] = objValues;
			return mapReduceLikeObject;
			
		}
	
		//========================================================================================================================================
		//========================================================================================================================================
		function taxFormBatchUpdateStatistics(taxFormBatchID ,batchStatus ,processingNotes) {
			
			try {
      	  		var savedSearchObj = search.load({ id: "customsearch_tax_form_detail_counts" }); // returns search.Search
      	  		removeFilter(savedSearchObj, "custrecord_txfm_detail_batch_id");
      	  		savedSearchObj.filters.push( search.createFilter({ name:"custrecord_txfm_detail_batch_id" ,operator:search.Operator.ANYOF ,values:[taxFormBatchID] }) );
     	  		var searchResults  = savedSearchObj.run().getRange(0,1); 
      	  	
      	  		log.audit("searchResults", JSON.stringify(searchResults));
      	  	
//		         "values": {
//		           "COUNT(custrecord_txfm_detail_deal)": "2",
//		           "COUNT(internalid)": "580",
//		           "SUM(formulanumeric)": "580",
//		           "SUM(formulanumeric)_1": "0",
//		           "SUM(formulanumeric)_2": "0",
//		           "SUM(formulanumeric)_3": "580",
//		           "SUM(custrecord_txfm_detail_box1d_proceed)": "602476021.28",
//		           "SUM(custrecord_txfm_detail_box1e_cost_other)": ".00",
//		           "SUM(custrecord_txfm_detail_box4_fedwithheld)": ".00",
//		           "SUM(formulanumeric)_4": "0",
//		           "SUM(formulanumeric)_5": "0",
//		           "SUM(formulanumeric)_6": "0",
//		           "SUM(formulanumeric)_7": "580"
		      
      	  		var numberOfDeals = searchResults[0].getValue({name: "custrecord_txfm_detail_deal", summary: "COUNT"});
      	  		var numberOfForms = searchResults[0].getValue({name: "internalid", summary: "COUNT"});
      	  		var box1dSum      = searchResults[0].getValue({name: "custrecord_txfm_detail_box1d_proceed", summary: "SUM"});
      	  		var box1e         = searchResults[0].getValue({name: "custrecord_txfm_detail_box1e_cost_other", summary: "SUM"});
      	  		var box14         = searchResults[0].getValue({name: "custrecord_txfm_detail_box4_fedwithheld", summary: "SUM"});
	      
      	  		searchResults = JSON.parse(JSON.stringify(searchResults));
	      
      	  		var draftFormCount            = getSearchValue(searchResults, "SUM(formulanumeric)");		//formulanumeric
      	  		var generatedFormCount        = getSearchValue(searchResults, "SUM(formulanumeric)_1");		//formulanumeric_1
      	  		var deliveredFormCount        = getSearchValue(searchResults, "SUM(formulanumeric)_2");		//formulanumeric_2
      	  		var originalFormVersionCount  = getSearchValue(searchResults, "SUM(formulanumeric)_3");		//formulanumeric_3
      	  		var revisedFormVersionCount   = getSearchValue(searchResults, "SUM(formulanumeric)_4");		//formulanumeric_4
      	  		var correctedFormVersionCount = getSearchValue(searchResults, "SUM(formulanumeric)_5");		//formulanumeric_5
      	  		var emailDeliveryCount        = getSearchValue(searchResults, "SUM(formulanumeric)_6");		//formulanumeric_6
      	  		var mailDeliveryCount         = getSearchValue(searchResults, "SUM(formulanumeric)_7");		//formulanumeric_7
	      
      	  		tfREC = record.load({type: "customrecord_tax_form_batch", id:taxFormBatchID, isDynamic: true});
      	  		//we should never override custrecord_txfm_batch_numberofdeals
      	  		//and custrecord_txfm_batch_numberofforms because these should ever be based on 
      	  		//saved search of exchange records, which is based on input criteria 
      	  		//and never on a search of batch detail records 
      	  	
//      	  	tfREC.setValue("custrecord_txfm_batch_numberofdeals", numberOfDeals);
//      	  	tfREC.setValue("custrecord_txfm_batch_numberofforms", numberOfForms);
      	  		tfREC.setValue("custrecord_txfm_batch_box1d"          ,box1dSum);
      	  		//tfREC.setValue("custrecord_txfm_batch_box1e"          ,box1e);
      	  		tfREC.setValue("custrecord_txfm_batch_box4"           ,box14);
      	  		tfREC.setValue("custrecord_txfm_batch_formsindraft"   ,draftFormCount);
      	  		tfREC.setValue("custrecord_txfm_batch_formsgenerated" ,generatedFormCount);
      	  		tfREC.setValue("custrecord_txfm_batch_formsdelivered" ,deliveredFormCount);
      	  		tfREC.setValue("custrecord_txfm_batch_oriform_count"  ,originalFormVersionCount);
      	  		tfREC.setValue("custrecord_txfm_batch_revform_count"  ,revisedFormVersionCount);
      	  		tfREC.setValue("custrecord_txfm_batch_corform_count"  ,correctedFormVersionCount);
      	  		tfREC.setValue("custrecord_txfm_batch_emaildelivery"  ,emailDeliveryCount);
      	  		tfREC.setValue("custrecord_txfm_batch_mailcount"      ,mailDeliveryCount);
//      	  		tfREC.setValue("custrecord_txfm_batch_submittedby"    ,runtime.getCurrentUser().id);
//      	  		tfREC.setValue("custrecord_txfm_batch_submittedon"    ,new Date());

      	  		if (batchStatus)      { tfREC.setValue("custrecord_txfm_batch_status"           ,batchStatus); }
      	  	
      	  		if (processingNotes)  { tfREC.setValue("custrecord_txfm_batch_processing_notes" ,processingNotes); }
      	    
      	  		tfREC.save();
      	  	
      	  		log.audit("search results ", JSON.stringify(searchResults));
	        }
        
			catch(e) {
				log.error("Error Occurred ", e.toString());			
				tfREC = record.load({type: "customrecord_tax_form_batch", id:taxFormBatchID, isDynamic: true});
				var taxFormBatchStatus_ProcessingFailed = "9";
				tfREC.setValue("custrecord_txfm_batch_status", taxFormBatchStatus_ProcessingFailed);
				tfREC.setValue("custrecord_txfm_batch_processing_notes", e.message);
				tfREC.setValue("custrecord_txfm_batch_processingmetadata", "");
				tfREC.save();
			}

		}

	
		//========================================================================================================================================
		//========================================================================================================================================
		function getDealsInProgress (taxyearfiled,reportmethod,iscovered,deals, currentTaxBatchID)
		{
			//throw "taxyearfiled " + taxyearfiled;
			log.debug("taxyearfiled", taxyearfiled);
			log.debug("reportmethod", reportmethod);
			log.debug("currentTaxBatchID", currentTaxBatchID);
			log.debug("deals", JSON.stringify(deals));
			if (!(taxyearfiled && reportmethod && iscovered && deals.length>0))
			{
				log.debug("All listed fields are required to run getDealsInProgress. Exiting function...");
				return;
			}
			var statusArr = [];
			var dealsInProgress = [];
			statusArr.push(srsConstants["Tax Form Batch Status"]["Cancelled"]);
			
			var filters = [
						      ["custrecord_txfm_batch_status","noneof",statusArr], 
						      "AND", 
						      ["custrecord_txfm_batch_yr_filed","anyof",taxyearfiled], 
						      "AND", 
						      ["custrecord_txfm_batch_report_method","anyof",reportmethod], 
						      "AND", 
						      ["custrecord_txfm_batch_iscovered","anyof",iscovered], 
						      "AND", 
						      ["custrecord_txfm_batch_deals","anyof",deals],
						      "AND", 
						      ["isinactive","is","F"]
						   ];
			if (currentTaxBatchID)
			{
				filters.push("AND");
				filters.push(["internalidnumber","notequalto",currentTaxBatchID]);
			}
			
			var customrecord_tax_form_batchSearchObj = search.create({
				   type: "customrecord_tax_form_batch",
				   filters:filters,
				   columns:
				   [
				      search.createColumn({
				         name: "name",
				         sort: search.Sort.ASC,
				         label: "Name"
				      }),
				      search.createColumn({name: "id", label: "ID"})
				   ]
				});
				var searchResultCount = customrecord_tax_form_batchSearchObj.runPaged().count;
				log.debug("customrecord_tax_form_batchSearchObj result count",searchResultCount);
				var entry = {};
				customrecord_tax_form_batchSearchObj.run().each(function(result){
					entry = {};
					entry.name = result.getValue("name");
					entry.id = result.getValue("id");
					dealsInProgress.push(entry);
					return true;
				});
				return dealsInProgress;
		}
		function getFieldValue(context, fieldId) {
			var fieldValue = null;
			if (context.currentRecord)
			{
				fieldValue = context.currentRecord.getValue(fieldId);
			}
			else 
			{
				var newRecFields = context.newRecord.getFields();
				
				fieldValue = context.newRecord.getValue(fieldId);
				var fieldPos = null;
				if (context.type === "xedit") {
					fieldPos = newRecFields.indexOf(fieldId);
					if (fieldPos === -1) {
						fieldValue = context.oldRecord.getValue(fieldId);
					}
				}
			}
			return fieldValue;
		}
		function getAnchor(recordtype, internalid, text, bEditMode) {
        	if (bEditMode !== true)
        	{
        		bEditMode = false;
        	}
	     	var link = url.resolveRecord({
				    recordType: recordtype,
				    recordId: internalid,
				    isEditMode: bEditMode
				});
	     	link = "<a href=\""+link+"\" target=\"_blank\">"+(text||internalid)+"</a>";
	     	return link;
		}
		function validateField(context, fieldid,msg, currentErrors)
		{
			var fieldvalue = getFieldValue(context,fieldid);
			if (!fieldvalue)
			{
				currentErrors = (currentErrors) ? currentErrors + "," : currentErrors;
				currentErrors = currentErrors  + msg;
			}
			return currentErrors;
		}
		function userIsAdmin() {
			var userRole = runtime.getCurrentUser().role;  
				
			return (userRole == srsConstants.USER_ROLE.ADMINISTRATOR || userRole == srsConstants.USER_ROLE.RESTLET_ADMINISTRATOR || userRole == srsConstants.USER_ROLE.CUSTOM_ADMINISTRATOR);				
		}
		function userIsATaxAnalyst() 
		{
			
			var taxAnalyst = search.lookupFields({
				type: "employee",
				id: runtime.getCurrentUser().id,
				columns: "custentity_em_tax_analyst"
			}).custentity_em_tax_analyst;
			
			return (taxAnalyst || userIsAdmin());
		}
		function validateTaxForm(context)
		{
			var errormsg = "";
			if (!userIsATaxAnalyst())
    		{
				errormsg = "Only Tax Analysts may make changes to this record.";
    		}
			var savedtaxAnalystValue = getFieldValue(context,"custrecord_txfm_batch_analyst");
			if (!parseInt(savedtaxAnalystValue,10))
			{
				errormsg = "Tax Analysts field is required.";
			}
			var payertype = getFieldValue(context,"custrecord_txfm_batch_payer_type");
			if (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Acquiom Financial"],10))
            {
				errormsg = validateField(context, "custrecord_txfm_batch_payer_entity","Payer Entity is required", errormsg);
            }
			if ((parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Acquiom Financial"],10))
				|| (parseInt(payertype,10) === parseInt(srsConstants["Tax Form Batch Payer Type"]["Other"],10))
			)
            {
				errormsg = validateField(context, "custrecord_txfm_batch_payer_name","Payer Name is required", errormsg);
				errormsg = validateField(context, "custrecord_txfm_batch_payer_taxid","Payer Tax ID is required", errormsg);
				errormsg = validateField(context, "custrecord_txfm_batch_payer_address","Payer Address is required", errormsg);
				errormsg = validateField(context, "custrecord_txfm_batch_payer_city","Payer City is required", errormsg);
				errormsg = validateField(context, "custrecord_txfm_batch_payer_state","Payer State is required", errormsg);
				errormsg = validateField(context, "custrecord_txfm_batch_payer_postal","Payer Postal Code is required", errormsg);
				errormsg = validateField(context, "custrecord_txfm_batch_payer_phone","Payer Phone is required", errormsg);
            }
			return errormsg;
		}
		function removeFilter(savedSearch,filtername)
		{
			 var i = 0;
			 for (i = 0; i < savedSearch.filters.length; i+=1) 
			 {
				 if (String(savedSearch.filters[i].name) ===filtername)
				 {
					 //log.debug("found subsidiary");
					 //need to splice account
					 savedSearch.filters.splice(i,1);
					 break;
				 }
			 }
		}
		function getSearchValue(searchResults, field)
		{
			return (searchResults && searchResults[0] && searchResults[0].values && searchResults[0].values[field])||0;
		}
		//getDetals will return either array of internal Deal IDs as default formatting option
		//this kind of format is desirable for saved search filter 
		//Example Output 1:
		//["972033","1169715"]
		//if name_value_format format is requested, then 
		//returned format is array of objects. This kind of format is desirable
		//when rendering multiselect box 
		//Example Output 2:
//		[
//		{
//		  "value": "972033",
//		  "text": "Value Payment Systems Government Brands Holdings"
//		},
//		{
//		  "value": "1169715",
//		  "text": "VaaS International Motorola"
//		}
//		]
		function getDeals(deals, name_value_format)
		{
			var dealArr = [];
			var i = 0;
			
			log.debug("deals object is Array " + Array.isArray(deals));
			
			if (Array.isArray(deals))
			{
//				"custrecord_txfm_batch_deals": [
//				{
//				  "value": "972033",
//				  "text": "Value Payment Systems Government Brands Holdings"
//				},
//				{
//				  "value": "1169715",
//				  "text": "VaaS International Motorola"
//				}
//				]
				if (name_value_format)
				{
					dealArr = deals; //if we requested name value output, then deals is already in the right format 
				}
				else 
				{
					for (i = 0; i < deals.length; i+=1) 
		    		{
						dealArr.push(deals[i].value);
		    		}
				}
			}
			else 
			{
//				"custrecord_txfm_batch_deals": {
//				    "value": "27485,40453,73164,110900,114525,132535,165204,167973,173092,180010,231499,250733,321830,345822,400187,421065,538328,548775,578880,592267,598351,660140,662585,678977,695104,707207,726308,734681,736333,758046,781041,800070,869605,878269,886832,920415,948046,957047,972033,977490,979932,1069882,1168096,1169715,1187027,1202890,1223744,1254975,1305938,1306867,1320854,1346854,1363412,1388409,1391348,1399909,1400409,1459469,1500222,1515993,1586195,1632099,1646185,1646294,1649356,1661987,1667050,1675943,1681895,1706514,1707224,1707325,1787337",
//				    "text": "Orkus SailPoint,V&E Smetana 2018,VES Holding Valicor PPC,VaaS International Motorola,Valant Medical VMS,Valerio Toyos Cano Health, LLC,Valeritas Admin Escrow 2020,Valeritas Madden Plan Escrow 2020,Valeritas Zealand Pharma,Valeritas, Inc. (Expenses Escrow),Valiant Holdings Trackforce AcquireCo,Validity Sensors Synaptics,Valor Humana,Value Payment Systems Government Brands Holdings,Value Payment Systems Government Brands Holdings (Sellside) 2018 (Shareholder Re,ValueCentric IQVIA,Van Gilder/Buyers Escrow 2019,Vantis Penn Mutual,Vaporsens Gentex,Vaultive CyberArk,Veenome Integral Ad Science,Vehix Offshore VTV Topco,Vehix Transvision VTV Parent,Velocloud Networks VMware,Venbrook Buyer Turner Escrow,Venbrook Group NAPA Escrow 2020,Vensun Pharmaceuticals Strides Pharma,Veracode CA,Verbify Snapchat,Veriflow VMware,Veriforce Holdings Project Power Buyer,Verify Optel,Verinata Illumina,Veritox J.S. Held LLC,Veritract Nestec,Verity Southern Holdings (Suntrust),Verodin FireEye,Vertica HP,Vertical Management VMS,Vertical Networks Whistle Sports,Vertigo Civiq,Vessix Boston Scientific,Vestmark Adhesion,Vettery ADO Staffing,VidGrid Paylocity,VideoIQ Avigilon,VideoSurf Microsoft,Viewfinity Cyber-Ark,VigLink sovrn Holdings,Vindicia Amdocs,Vineti, Inc. ( Citizens Escrow),Viomics Exact Sciences,Virdante Momenta,Virent Tesoro Refining,ViroCyt Sartorius,Virtual COMSovereign,Virtual Computer Citrix,Virtus FIS Data Systems,Virtustream EMC,Visible World Comcast,Visually Scribble Technologies,Vital Network Services VOLOGY,VitalWare Health,Viteos Holdings Intertrust Group B.V.,Viteos Mauritius Viteos,Vitrue Oracle,Vivid Learning Systems ASHI,Vivisimo IBM,Vixen Pharmaceuticals Aclaris,Vixxi Dash,Vlingo Nuance,Vlocity Salesforce.com,vAuto AutoTrader.com"
//				  },
				
				if (name_value_format)
				{
					//USER REQUESTED ARRAY OF OBJECTS FOR PURPOSE OF 
					//MULIT SELECT BOX RENDERING
					var entry = {};
					var valuesArr = (deals.value && deals.value.split(",")) || [];
					var textArr = (deals.text && deals.text.split(",")) || [];
					for (i = 0; i < valuesArr.length; i+=1) 
		    		{
						entry = {};
						entry.value = valuesArr[i]; 
						entry.text = textArr[i]; 
						dealArr.push(entry);
		    		}
				}
				else 
				{
					dealArr = (deals.value && deals.value.split(",")) || [];
				}
			}
			return dealArr;
			
		}
		//copy_filter is used to 
		//for purposes of copying existing saved search
		//and triggering saved search asynchronous export
		//given an old filter, it uses search.createFilter to create new one
		function copy_filter(old_filter)
		{
//			var values = JSON.stringify(old_filter.values);
			//log.audit("values", old_filter.values);
			// create the filter object
			var ret = search.createFilter({
				name: old_filter.name,
				operator: old_filter.operator,
				values: old_filter.values,
				formula : old_filter.formula ? old_filter.formula : "",
				join : old_filter.join ? old_filter.join : ""
			});
			return ret;
		}
		//copy_column is used to 
		//for purposes of copying existing saved search
		//and triggering saved search asynchronous export
		//given an old column, it uses search.createColumn to create new one
		function copy_column(old_column, options)
		{
			//note
			//since column transfer is primarily because of search export
			//setWhenOrderedBy is not needed. However, this piece of information is 
			//essential when trying to get latest Exchange Record 
//			columns[1].setWhenOrderedBy({
//			    name: "trandate",
//			    join: "transaction"
//			});
			
			log.debug("old_column.name ",old_column.name); 
			var ret = null;
			if (options && options.excludeSummary)
			{
				ret = search.createColumn({
					name: old_column.name,
					formula : old_column.formula ? old_column.formula : "",
					join : old_column.join ? old_column.join : "",
					label : old_column.label ? old_column.label : ""
				});
			}
			else 
			{
				ret = search.createColumn({
				name: old_column.name,
				formula : old_column.formula ? old_column.formula : "",
				join : old_column.join ? old_column.join : "",
				summary : old_column.summary ? old_column.summary : "",
				label : old_column.label ? old_column.label : ""
			});
			}
				
			return ret;
		}
		//getTaxFormBatchSearch is mainly used to 
		//1. render Preview sublist, 
		//2. Saved Search export of Preview Sublist 
		//3. Generate Tax Form Batch Detail records 
		//4. Tax Form Batch summary currency Totals (column 3)
		function getTaxFormBatchSearch(options)
		{
			var savedSearchObj = search.load({ id: "customsearch_batch_deal_sharholders" }); // returns search.Search
		
			if (options.downloadRequested || options.lotCertificatesRequested)
			{
				var filters = [];
				var columns = [];
				var searchTitle = "";
				if (options.downloadRequested)
				{
					searchTitle = "Saved Search Download Request.";
				}
				if (options.lotCertificatesRequested)
				{
					searchTitle = "Tax Form Batch Certificates.";
				}
				var filter = "";
				var column = "";
				var oldColumn = "";
				savedSearchObj = JSON.parse(JSON.stringify(savedSearchObj));	//need to convert netsuite obj to json obj
				for (filter in savedSearchObj.filters)
		    	{
					filters[filters.length] = copy_filter(savedSearchObj.filters[filter]);
		    	}
				for (column in savedSearchObj.columns)
		    	{
					
					oldColumn = JSON.parse(JSON.stringify(savedSearchObj.columns[column]));
					if (!oldColumn.whenorderedbyalias)
					{
						//setWhenOrderedBy does not work during search.create
						//and it does not work during search copy. Therefore, exclude this column
						//from being exported as it may contain incorrect data 
						//Answer Id: 35107
						columns[columns.length] = copy_column(savedSearchObj.columns[column], options);
					}
		    	}
				
				//throw "filters " + JSON.stringify(savedSearchObj.filters) + "  " + JSON.stringify(filters);
				//throw "columns " + JSON.stringify(savedSearchObj.columns) + " ||| " + JSON.stringify(columns);
				
				savedSearchObj = search.create({ 
					type: savedSearchObj.type,
					columns: columns,
					filters: filters,
					title: options.newSavedSearchID + " " + searchTitle + " OK to delete.",
	                id: options.newSavedSearchID
				}); // returns search.Search
			}
			
			 removeFilter(savedSearchObj, "custrecord_lot_cert_taxfiled_year");
			 removeFilter(savedSearchObj, "custrecord_acq_lotce_covered_security");
			 removeFilter(savedSearchObj, "custrecord_act_lotce_tax_report_method");
			 removeFilter(savedSearchObj, "custrecord_acq_loth_zzz_zzz_deal");
			 
			 savedSearchObj.filters.push(
	    				search.createFilter({
	    					name: "custrecord_lot_cert_taxfiled_year",
	    					join: "custrecord_acq_lotce_zzz_zzz_parentlot",
	    					operator: search.Operator.ANYOF,
	    					values: options.taxyearfiled
	    	    		})
	    		);
			 	savedSearchObj.filters.push(
	    				search.createFilter({
	    					name: "custrecord_acq_lotce_covered_security",
	    					join: "custrecord_acq_lotce_zzz_zzz_parentlot",
	    					operator: search.Operator.ANYOF,
	    					values: options.isCovered
	    	    		})
	    		);
			 	savedSearchObj.filters.push(
	    				search.createFilter({
	    					name: "custrecord_act_lotce_tax_report_method",
	    					join: "custrecord_acq_lotce_zzz_zzz_parentlot",
	    					operator: search.Operator.ANYOF,
	    					values: options.reportmethod
	    	    		})
	    		);
			 	savedSearchObj.filters.push(
	    				search.createFilter({
	    					name: "custrecord_acq_loth_zzz_zzz_deal",
	    					operator: search.Operator.ANYOF,
	    					values: options.deals
	    	    		})
	    		);
			 	if (options.shareholders)
			 	{
			 		removeFilter(savedSearchObj, "custrecord_acq_loth_zzz_zzz_shareholder");
				 	savedSearchObj.filters.push(
		    				search.createFilter({
		    					name: "custrecord_acq_loth_zzz_zzz_shareholder",
		    					operator: search.Operator.ANYOF,
		    					values: options.shareholders
		    	    		})
		    		);
			 	}
			 	if (options.lotCertificatesRequested)
				{
			 		savedSearchObj.columns.push(search.createColumn({
			 	         name: "internalid",
			 	         join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",
			 	         label: "Internal ID"
			 	      }));
				}
			if (options.downloadRequested)
			{
				savedSearchObj.save();
			}
			return savedSearchObj;
		}
		//SEARCH THAT IS EXECUTED WHEN TAX FORM BATCH DETAIL IS REQUESTED
		function getTaxFormBatchDetailSearch(options)
		{
			var operator = "anyof";	//default value for operator
			var searchValue = null;
			var columnOptions = {};
			var sortOption = "";
			var i = 0;
			//ORIGINALLY, taxformbatch was all that was needed
			var ssOptions = {
					   type: "customrecord_tax_form_batch_detail",
					   filters:[],
					   columns:[]
					};
			
			//spin through each of the defined fields
			for (i = 0; i < options.fields_to_render.length; i+=1) 
    		{
				//only add column to columns array if showColumn is true 
				if (options.fields_to_render[i].showColumn)
    			{
					//default column retrieval fields are name and label 
					columnOptions = {
							name: options.fields_to_render[i].id, 
							label: options.fields_to_render[i].columnlabel
						};
					
					//if sort option has been requested, process it here 
					if (options.fields_to_render[i].sort)
					{
						sortOption = (options.fields_to_render[i].sort === "ASC") ? search.Sort.ASC : ((options.fields_to_render[i].sort === "DESC") ? search.Sort.DESC : "");
					}
					if (sortOption)
					{
						columnOptions.sort=sortOption;
					}
					
					if (options.downloadRequested)
					{
						if (options.fields_to_render[i].id === "custrecord_txfm_detail_shareholder")
						{
							ssOptions.columns.push(search.createColumn({
						         name: "internalid",
						         join: "CUSTRECORD_TXFM_DETAIL_SHAREHOLDER",
						         label: "Shareholder ID"
						      }));
						}
					}
					
					//add column to search
					ssOptions.columns.push( 
							search.createColumn(columnOptions));
    			}
				
				if (options.fields_to_render[i].isAvailableFilter)
    			{
					//add any of the filelds to filter list if isAvailableFilter is true 
					if (options.fields_to_render[i].operator)
					{
						operator = options.fields_to_render[i].operator;
					}
					
					
					if (options.fields_to_render[i].filtertype === "CHECKBOX")
					{
						//for checkboxes if value is provided, use true, if empty/false/undefined/null, use false
						searchValue = (options.fields_to_render[i].value === "T") ? "T" : "F";
						if (options.fields_to_render[i].id === "isinactive")
						{
							//special handling for isinactive. We want to show all rows when ckeckbox is checked
							//not just inactive 
							searchValue = (options.fields_to_render[i].value === "T") ? null : "F";
							
						}
						//throw " searchValue " + searchValue;
					}
					else if (options.fields_to_render[i].filtertype === "MULTISELECT")
					{
						searchValue = options.fields_to_render[i].value;
						if (searchValue)
						{
							searchValue = searchValue.replace(/\u0005/g, ",");
							searchValue = searchValue.split(",");
						}
					}
					else
					{
						//for all other fields, use the value provided, otherwise null
						searchValue = (options.fields_to_render[i].value) ? options.fields_to_render[i].value : null;
					}
					
					if (searchValue !== null)
					{
						//if search value is anything other than null, generate a filter
						// ATP-2036
						var filter = [];
						filter.push(options.fields_to_render[i].id);
						filter.push(operator);
						filter.push(searchValue);
						log.debug("filter" ,JSON.stringify(filter));
						if (ssOptions.filters.length >0) { ssOptions.filters.push('AND'); }
						ssOptions.filters.push(filter);
						//end Alex
//						ssOptions.filters.push(
//								search.createFilter({ name:options.fields_to_render[i].id 
//									 ,operator:operator 
//								     ,values:searchValue }));
						// end ATP-2036

					}
				}
    		}
			log.audit("filters" ,JSON.stringify(options["custpage_filter_revise"]) + "/" + JSON.stringify(options["custpage_filter_correct"]));
		
			// ATP-2036
			if (options["custpage_filter_revise"]) {
				var reviseFilter = [ ['custrecord_txfm_detail_status' ,'anyof' ,["1","4","8"] ] ,"AND" ,['custrecord_txfm_detail_version' ,'anyof' ,["1","2"] ] ];
				ssOptions.filters.push('AND');
				ssOptions.filters.push(reviseFilter);
				log.audit("revise filter" ,JSON.stringify(reviseFilter));
			}
			
			if (options["custpage_filter_correct"]) {
				var correctFilter = [       [ ['custrecord_txfm_detail_status' ,'anyof' ,["7"            ] ] ,"AND" ,['custrecord_txfm_detail_version' ,'anyof' ,["1","2"] ] ] 
				                     ,"OR" ,[ ['custrecord_txfm_detail_status' ,'anyof' ,["1","4","7","8"] ] ,"AND" ,['custrecord_txfm_detail_version' ,'anyof' ,["3"    ] ] ]
				                    ];
				ssOptions.filters.push('AND');
				ssOptions.filters.push(correctFilter);
				log.audit("correct filter" ,JSON.stringify(correctFilter));
			}
			// end ATP-2036
			
			//throw "ssOptions.filters " + JSON.stringify(ssOptions.filters);
			//throw "ssOptions.columns " + JSON.stringify(ssOptions.columns);
			//throw "options.fields_to_render " + JSON.stringify(options.fields_to_render);
			log.audit("ssOptions.filters" ,JSON.stringify(ssOptions.filters));
			
			if (options.downloadRequested)
			{
				ssOptions.title = options.newSavedSearchID + " Downloaded Saved Search. OK to delete.";
				ssOptions.id = options.newSavedSearchID;
			}
			
			var savedSearchObj = search.create(ssOptions); // returns search.Search
			
			if (options.downloadRequested)
			{
				savedSearchObj.save();
			}
			return savedSearchObj;
		}
		//following TaxFormBatch Columns will be requested 
		//Same columns need to also be retrieved in getLookupValues function
		//This is done so that both search and search promise can be 
		//completed using same code 
		function setLookupValues()
		{
			return [
			          "name",
			          "custrecord_txfm_batch_yr_filed",
			          "custrecord_txfm_batch_report_method",
			          "custrecord_txfm_batch_deals",
			          "custrecord_txfm_batch_iscovered",
			          "custrecord_txfm_batch_payer_entity",
			          "custrecord_txfm_batch_status",
			          "custrecord_txfm_batch_numberofforms",
			          "custrecord_txfm_batch_numberofdeals",
			          "isinactive"
			          
			          ];
		}
		//lookup values has been moved to separate function
		//so that both promise and non promise calls can 
		//have the same processing 
		function getLookupValues(tfbREC, taxformBatch)
		{
			log.audit("tfbREC", JSON.stringify(tfbREC));
	         
	         var taxbatchStatus = (tfbREC.custrecord_txfm_batch_status && tfbREC.custrecord_txfm_batch_status[0] && tfbREC.custrecord_txfm_batch_status[0].value) || "";
				
	         var taxyearfiled = (tfbREC.custrecord_txfm_batch_yr_filed && tfbREC.custrecord_txfm_batch_yr_filed[0] && tfbREC.custrecord_txfm_batch_yr_filed[0].value) || "";
	         var reportmethod = (tfbREC.custrecord_txfm_batch_report_method && tfbREC.custrecord_txfm_batch_report_method[0] && tfbREC.custrecord_txfm_batch_report_method[0].value) || "";
	         var reportmethodText = (tfbREC.custrecord_txfm_batch_report_method && tfbREC.custrecord_txfm_batch_report_method[0] && tfbREC.custrecord_txfm_batch_report_method[0].text) || "";
	         var isCovered = (tfbREC.custrecord_txfm_batch_iscovered && tfbREC.custrecord_txfm_batch_iscovered[0] && tfbREC.custrecord_txfm_batch_iscovered[0].value) || "";
	         var deals = getDeals(tfbREC.custrecord_txfm_batch_deals); //transform deals to array format;
	         var name_value_format =true;
	         var deals_for_multiselect = getDeals(tfbREC.custrecord_txfm_batch_deals,name_value_format); //transform deals to array format;
	         log.audit("deals ", JSON.stringify(deals));
	         var name = tfbREC.name || "";
	         var options = {
					 "name" : name,
	        		 "taxyearfiled" : taxyearfiled,
					 "reportmethod" : reportmethod,
					 "reportmethodText" : reportmethodText,
					 "deals" : deals,
					 "deals_for_multiselect": deals_for_multiselect,
					 "numberOfForms" : tfbREC.custrecord_txfm_batch_numberofforms || 0,
					 "numberOfDeals" : tfbREC.custrecord_txfm_batch_numberofdeals || 0,
					 "isCovered" : isCovered,
					 "status" : taxbatchStatus,
					 "taxformbatch" : taxformBatch,
					 "isinactive" : tfbREC.isinactive,
					 "suiteletURL" : url.resolveScript({
							scriptId : "customscript_srs_tax_form_batch",
							deploymentId : "customdeploy_srs_tax_form_batch",
							returnExternalUrl: false
						})
					 
	 		 	};
	         return options;
		}
		//tax form values could be requested via promise
		//this function is used in client scripting, but has been
		//moved to library so that getLookupValues could be re-used 
		function getTaxFormValuesPromise(taxformBatch)
		{
			var promise = new Promise(function(resolve, reject)
			{
				search.lookupFields.promise({						
					type: "customrecord_tax_form_batch",
					id: taxformBatch,
					columns: setLookupValues()
				})
				.then(function(result)
				{
					resolve(getLookupValues(result,taxformBatch));
				})
				.catch(function(reason) {
                    console.log("reason " + reason);
                    reject( reason );
                    //do something on failure
                });
         
			});
			return promise;
		}
		//no promise version of getTaxFormValues, used in suitelet 
		function getTaxFormValues(taxformBatch)
		{
			 var tfbREC = search.lookupFields({						
					type: "customrecord_tax_form_batch",
					id: taxformBatch,
					columns: setLookupValues()
				});
         
//			 {
//				  "name": "test 10-4 4",
//				  "custrecord_txfm_batch_yr_filed": [
//				    {
//				      "value": "7",
//				      "text": "2019"
//				    }
//				  ],
//				  "custrecord_txfm_batch_report_method": [
//				    {
//				      "value": "4",
//				      "text": "1099-B"
//				    }
//				  ],
//				  "custrecord_txfm_batch_deals": [
//				    {
//				      "value": "868590",
//				      "text": "10-4 Systems Trimble"
//				    }
//				  ],
//				  "custrecord_txfm_batch_iscovered": [
//				    {
//				      "value": "2",
//				      "text": "No"
//				    }
//				  ],
//				  "custrecord_txfm_batch_payer_entity": [
//				    {
//				      "value": "69",
//				      "text": "SRS Acquiom Holdings Inc. : SRS Intermediate Inc. : SRS Acquiom Inc : SRS Acquiom Holdings LLC : Acquiom Financial LLC"
//				    }
//				  ],
//				  "custrecord_txfm_batch_status": [
//				    {
//				      "value": "10",
//				      "text": "Processing Submit"
//				    }
//				  ],
//				  "custrecord_txfm_batch_numberofforms": "14"
//				}
         
         // really odd, but deals could arrive in different non-array format
//         {
//         	  "custrecord_txfm_batch_yr_filed": [
//         	    {
//         	      "value": "7",
//         	      "text": "2019"
//         	    }
//         	  ],
//         	  "custrecord_txfm_batch_report_method": [
//         	    {
//         	      "value": "4",
//         	      "text": "1099-B"
//         	    }
//         	  ],
//         	  "custrecord_txfm_batch_deals": {
//         	    "value": "27485,40453,73164,110900,114525,132535,165204,167973,173092,180010,231499,250733,321830,345822,400187,421065,538328,548775,578880,592267,598351,660140,662585,678977,695104,707207,726308,734681,736333,758046,781041,800070,869605,878269,886832,920415,948046,957047,972033,977490,979932,1069882,1168096,1169715,1187027,1202890,1223744,1254975,1305938,1306867,1320854,1346854,1363412,1388409,1391348,1399909,1400409,1459469,1500222,1515993,1586195,1632099,1646185,1646294,1649356,1661987,1667050,1675943,1681895,1706514,1707224,1707325,1787337",
//         	    "text": "Orkus SailPoint,V&E Smetana 2018,VES Holding Valicor PPC,VaaS International Motorola,Valant Medical VMS,Valerio Toyos Cano Health, LLC,Valeritas Admin Escrow 2020,Valeritas Madden Plan Escrow 2020,Valeritas Zealand Pharma,Valeritas, Inc. (Expenses Escrow),Valiant Holdings Trackforce AcquireCo,Validity Sensors Synaptics,Valor Humana,Value Payment Systems Government Brands Holdings,Value Payment Systems Government Brands Holdings (Sellside) 2018 (Shareholder Re,ValueCentric IQVIA,Van Gilder/Buyers Escrow 2019,Vantis Penn Mutual,Vaporsens Gentex,Vaultive CyberArk,Veenome Integral Ad Science,Vehix Offshore VTV Topco,Vehix Transvision VTV Parent,Velocloud Networks VMware,Venbrook Buyer Turner Escrow,Venbrook Group NAPA Escrow 2020,Vensun Pharmaceuticals Strides Pharma,Veracode CA,Verbify Snapchat,Veriflow VMware,Veriforce Holdings Project Power Buyer,Verify Optel,Verinata Illumina,Veritox J.S. Held LLC,Veritract Nestec,Verity Southern Holdings (Suntrust),Verodin FireEye,Vertica HP,Vertical Management VMS,Vertical Networks Whistle Sports,Vertigo Civiq,Vessix Boston Scientific,Vestmark Adhesion,Vettery ADO Staffing,VidGrid Paylocity,VideoIQ Avigilon,VideoSurf Microsoft,Viewfinity Cyber-Ark,VigLink sovrn Holdings,Vindicia Amdocs,Vineti, Inc. ( Citizens Escrow),Viomics Exact Sciences,Virdante Momenta,Virent Tesoro Refining,ViroCyt Sartorius,Virtual COMSovereign,Virtual Computer Citrix,Virtus FIS Data Systems,Virtustream EMC,Visible World Comcast,Visually Scribble Technologies,Vital Network Services VOLOGY,VitalWare Health,Viteos Holdings Intertrust Group B.V.,Viteos Mauritius Viteos,Vitrue Oracle,Vivid Learning Systems ASHI,Vivisimo IBM,Vixen Pharmaceuticals Aclaris,Vixxi Dash,Vlingo Nuance,Vlocity Salesforce.com,vAuto AutoTrader.com"
//         	  },
//         	  "custrecord_txfm_batch_iscovered": [
//         	    {
//         	      "value": "2",
//         	      "text": "No"
//         	    }
//         	  ],
//         	  "custrecord_txfm_batch_payer_entity": [
//         	    {
//         	      "value": "69",
//         	      "text": "SRS Acquiom Holdings Inc. : SRS Intermediate Inc. : SRS Acquiom Inc : SRS Acquiom Holdings LLC : Acquiom Financial LLC"
//         	    }
//         	  ],
//         	  "custrecord_txfm_batch_status": [
//         	    {
//         	      "value": "10",
//         	      "text": "Processing Submit"
//         	    }
//         	  ]
//         	}
         
          return getLookupValues(tfbREC, taxformBatch); 
		}
		return {
        	getDealsInProgress: getDealsInProgress
        	,getAnchor : getAnchor
        	,validateTaxForm : validateTaxForm
        	,userIsATaxAnalyst : userIsATaxAnalyst 
			,userIsAdmin : userIsAdmin
        	,getTaxFormBatchSearch : getTaxFormBatchSearch
        	,getTaxFormBatchDetailSearch : getTaxFormBatchDetailSearch
        	,getDeals : getDeals
        	,removeFilter : removeFilter
        	,getSearchValue  : getSearchValue
        	,getTaxFormValues: getTaxFormValues
        	,getTaxFormValuesPromise : getTaxFormValuesPromise
        	,taxFormBatchUpdateStatistics: taxFormBatchUpdateStatistics
        	,createTaxFormBatchDetailRecord: createTaxFormBatchDetailRecord
        	,GetLastBatchStatus: GetLastBatchStatus
        	,getTaxFormDocumentsFolder: getTaxFormDocumentsFolder
        	     };
    });