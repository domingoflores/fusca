/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Library for Tax Form, functions that require SERVER SIDE ONLY modules such as file module
 */

define(["N/search" ,"N/url" ,"N/runtime" ,"N/record" ,"N/file" 
        ],
       
    function (search ,url ,runtime ,record ,file
    		 ) {

	
		//========================================================================================================================================
		//========================================================================================================================================
		function inactivateTaxFormBatchDetail(recordId) {
			  var taxFormBatchDetailStatus_Inactive = "5";
			  
			  var objtaxFormBatchDetailFields = search.lookupFields({type:"customrecord_tax_form_batch_detail" ,id:recordId   
                                                                 ,columns:["custrecord_txfm_detail_document"]});
			  
			  var objValues = {};
			  objValues["isinactive"]                           = "T"; 
			  objValues["custrecord_txfm_detail_status"]        = taxFormBatchDetailStatus_Inactive; 
			  record.submitFields({ type:"customrecord_tax_form_batch_detail" ,id:recordId ,values:objValues });
			  					  
			  if (objtaxFormBatchDetailFields["custrecord_txfm_detail_document"].length > 0) {
				  var documentId = objtaxFormBatchDetailFields["custrecord_txfm_detail_document"][0].value;
				  
				  var objDocumentFields = search.lookupFields({type:"customrecord_document_management" ,id:documentId   
                                                           ,columns:["custrecord_file"]});
				  
				  var objValues = {};
				  objValues["isinactive"]    = "T"; 
				  record.submitFields({ type:"customrecord_document_management" ,id:documentId ,values:objValues });
				  
				  if (objDocumentFields["custrecord_file"].length > 0) {
					  file.delete({ id:objDocumentFields["custrecord_file"][0].value });
				  }
			  }
			  
		}
		
		  
		//========================================================================================================================================
		//========================================================================================================================================

		return { inactivateTaxFormBatchDetail: inactivateTaxFormBatchDetail
        	   };
    });