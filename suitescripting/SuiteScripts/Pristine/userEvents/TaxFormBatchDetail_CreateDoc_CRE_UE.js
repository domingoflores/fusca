//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------
var scriptName = "TaxFormBatchDetail_CreateDoc_CRE_SL.js";

function beforeSubmit(type) {
	var funcName = scriptName + "beforeSubmit";
	nlapiLogExecution('AUDIT' ,funcName ,'starting ======================================================================');
	
	nlapiLogExecution('AUDIT' ,funcName ,'ExecutionContext:' + nlapiGetContext().getExecutionContext());

	var generate_request = nlapiGetFieldValue('custpage_generate_request');
	
	// This script is specifically intended to execute GENERATE processing for a Tax Form Batch Detail record
	// If field "custpage_generate_request" is NOT present then exit this script 
	if (!generate_request) { return; }
	
    var responseObj = {success:false ,msg:""};
	var creSuccess  = false;  
	nlapiLogExecution('AUDIT' ,funcName ,'generate_request:' + generate_request );
	var creProfile = null;
	try {
		var requestObj = JSON.parse( generate_request );

	    creProfile = new CREProfile(requestObj["creProfile"]);
	    if (requestObj["noPassword"]) { creProfile.RawData.passwordProtect = 0; }
	    creProfile.Translate(requestObj["TaxFormBatchDetailId"]);
	    var creResponse = creProfile.Execute(true);
	    
		responseObj["creResponse"] = creResponse;
		var responseArray          = creResponse.split(" ");
		
		for (var i=0; i<responseArray.length; i++) {
			if (responseArray[i] == "Success.") {
				creSuccess  = true;  
			}
		}
		
		if ((!creSuccess) && (!creProfile.fields.DocumentName.file)) 
		{ 
			responseObj.msg = "CRE File creation failed"; 
			nlapiLogExecution("ERROR" ,funcName ,"CRE File creation failed: " + JSON.stringify(creResponse) );
		}
	}
	catch(e) {
		nlapiLogExecution("ERROR" ,funcName ,"Error when executing CRE Profile: " + JSON.stringify(e) );
		responseObj.msg = "Error when executing CRE Profile: " + e.message;
	}

	try {
		if (creSuccess) {
			
			var dealId           = nlapiGetFieldValue('custrecord_txfm_detail_deal');
			var dealName         = nlapiGetFieldText ('custrecord_txfm_detail_deal');
			var shareholderId    = nlapiGetFieldValue('custrecord_txfm_detail_shareholder');
			var shareholderName  = nlapiGetFieldText ('custrecord_txfm_detail_shareholder');
			var taxFormBatchId   = nlapiGetFieldValue('custrecord_txfm_detail_batch_id');
			var reportingMethod  = nlapiGetFieldText ('custrecord_txfm_detail_report_method');
			var accountNumber    = nlapiGetFieldValue('custrecord_txfm_detail_account_number');
			
        	var objTaxFormBatchFields = nlapiLookupField("customrecord_tax_form_batch" ,taxFormBatchId ,["custrecord_txfm_batch_yr_filed"] ,true);
        	var year = "year";
        	if (objTaxFormBatchFields["custrecord_txfm_batch_yr_filed"].length > 0) {
        		year = objTaxFormBatchFields["custrecord_txfm_batch_yr_filed"];
        	}
			
			var fileId = creProfile.fields.DocumentName.file.getId();
			
			try {
				moveFileFromCreFolderToAcquiomFolder(fileId);
			}
			// We dont want to interrupt this process so if folder move fails just log the error
			catch(e1) { nlapiLogExecution("ERROR" ,funcName ,"Exception when moving file to Tax Documents Folder: " + JSON.stringify(e1) ); }
			
	        var objRcd = nlapiCreateRecord("customrecord_document_management");
	        
	        var noPassword = "";
		    if (requestObj["noPassword"]) { noPassword = "_NO_PASSWORD"; } 	    
		    else { 
		    	var objFile = nlapiLoadFile(fileId);
		        objFile.setIsOnline(true);
		        nlapiSubmitFile(objFile);
    		}

	    	var name_format = "{year} {form} {shldr}_{deal}_{acct}{np}.pdf";
	    	var name = name_format;
	    	name = name.replace("{year}"  ,year);
	    	name = name.replace("{form}"  ,reportingMethod);
	    	name = name.replace("{shldr}" ,shareholderName);
	    	name = name.replace("{deal}"  ,dealName);
	    	name = name.replace("{acct}"  ,accountNumber);
	    	name = name.replace("{np}"    ,noPassword);
	        
	    	var doc_date        = new Date("12/31/" + year);
	    	var dtNow           = new Date();
	    	var arrayToday      = dtNow.toISOString().split("T");
	    	var arrayTodayParts = arrayToday[0].split("-");
	    	var dtToday         = new Date(arrayTodayParts[1] + "/" + arrayTodayParts[2] + "/" + arrayTodayParts[0]);
	    	
	    	var documentStatus_Draft          = 3;
	    	var deficiencyStatus_Deficient    = 2;
	    	var documentType_CustomerTaxDoc   = 43;
	    	
	    	objRcd.setFieldValue("custrecord_file"                        ,fileId );
	    	objRcd.setFieldValue("custrecord_doc_linked_tax_batch_detail" ,nlapiGetRecordId() );
	    	objRcd.setFieldValue("name"                                   ,name );
	    	objRcd.setFieldValue("altname"                                ,name );
	    	objRcd.setFieldValue("custrecord_escrow_customer"             ,shareholderId );
	    	objRcd.setFieldValue("custrecord_dm_status"                   ,documentStatus_Draft );
	        objRcd.setFieldValue("custrecord_date_srs_received"           ,dtToday );
	        objRcd.setFieldValue("custrecord_doc_type"                    ,documentType_CustomerTaxDoc );
	        objRcd.setFieldValue("custrecord_doc_date"                    ,doc_date );
	        objRcd.setFieldValue("custrecord_doc_def_status"              ,deficiencyStatus_Deficient );
	        objRcd.setFieldValue("custrecord104"                          ,dealName );
	        
			var documentId = nlapiSubmitRecord(objRcd);
	    	
	    	if (requestObj["noPassword"]) { nlapiSetFieldValue('custrecord_txfm_detail_document_nopwd' ,documentId ); }
	    	else                          { nlapiSetFieldValue('custrecord_txfm_detail_document'       ,documentId ); }
	    	
	    	responseObj.success = true;
		}
	}
	catch(e2) {
		nlapiLogExecution("ERROR" ,funcName ,"Error when creating Document record: " + JSON.stringify(e2) );
		responseObj.msg = "Error when creating Document record: " + e2.message;		
	}
	
	nlapiSetFieldValue("custrecord_txfm_detail_processing_notes" ,JSON.stringify( responseObj ) );
	var taxFormBatchDetailStatus_Generated = 8;
	if (responseObj.success) { nlapiSetFieldValue("custrecord_txfm_detail_status" ,taxFormBatchDetailStatus_Generated ); }

}


//===
//===
function moveFileFromCreFolderToAcquiomFolder(fileId) {
	
    var fileRec                 = nlapiLoadFile(fileId);
    var filename                = fileRec.getName();
    var taxYear                 = filename.substring(0,4);
	
	var destinationFolder = getTaxFormDocumentsFolder(taxYear);

    fileRec.setFolder(destinationFolder);
    nlapiSubmitFile(fileRec);
	
}