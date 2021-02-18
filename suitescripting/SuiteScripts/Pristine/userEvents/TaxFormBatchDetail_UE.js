/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/runtime' ,'N/search'
        ,"/SuiteScripts/Pristine/libraries/TaxForm_Library.js"
	],

    function(runtime ,search
    	,tfLibrary
    ) {

        var scriptFileName = "TaxFormBatchDetail_UE.js";

        function beforeLoad(context) 
        {
        	log.debug("before load")
        	if (runtime.executionContext === "USERINTERFACE"
            		|| runtime.executionContext === "CSVIMPORT") 
            {
        		log.debug("context.type " + context.type );
        		log.debug("tfLibrary.userIsAdmin()", tfLibrary.userIsAdmin());
	    		if ((!tfLibrary.userIsAdmin()) && context.type === "view") 
	    		{
	    			
					context.form.removeButton("makecopy");
					context.form.removeButton("new");
					context.form.removeButton("edit");
				}

	    		if ((!tfLibrary.userIsAdmin()) && (context.type === "edit" || context.type === "create" || context.type === "copy")) 
	    		{
	    			throw "Only Administrator role can modify Tax Form Batch Detail records.";
				}
        	}
        }
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {
            var scriptFunctionName = "beforeSubmit";
            var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
            //    	log.debug(scriptFullName, "========================================================================");
            //    	log.debug(scriptFullName, "========================================================================");
            log.debug(scriptFullName, "UserEventType: " + context.type);
       	            
            if (context.type == context.UserEventType.CREATE) {
            	var account_number_format = "{dealId}_{shareholderId}_{formType}";
            	var dealId        = context.newRecord.getValue({ fieldId: 'custrecord_txfm_detail_deal' });
            	var shareholderId = context.newRecord.getValue({ fieldId: 'custrecord_txfm_detail_shareholder' });
            	
            	var taxRptMethod  = context.newRecord.getValue({ fieldId: 'custrecord_txfm_detail_report_method' });
            	objTaxRptMethodFields = search.lookupFields({type:"customrecord_tax_rpt_method" ,id:taxRptMethod   
                                                         ,columns: ["custrecord_trm_irs_acct_nbr_suffix" ]});
            	var formType      = taxRptMethod;
            	if (objTaxRptMethodFields["custrecord_trm_irs_acct_nbr_suffix"] > "") {
                	formType      = objTaxRptMethodFields["custrecord_trm_irs_acct_nbr_suffix"];
            	}
            	
            	var accountNumber = account_number_format.replace("{dealId}",dealId).replace("{shareholderId}",shareholderId).replace("{formType}",formType);
            	context.newRecord.setValue({ fieldId: 'custrecord_txfm_detail_account_number' ,value:accountNumber });

            } // if (context.type == context.UserEventType.CREATE)

            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.CREATE) {
            	var txfm_detail_version_corrected = 3;
            	var txfm_detail_version  = context.newRecord.getValue({ fieldId: 'custrecord_txfm_detail_version' });
            	if (txfm_detail_version == txfm_detail_version_corrected) {
            		if ( !context.newRecord.getValue({ fieldId: 'custrecord_txfm_detail_correction_type' }) ) { throw "Correction Type is required when 'Tax Form Type' is 'Corrected'"  }
            	} 
            }
            
            return;


        } // beforeSubmit(context)



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return { 
                 beforeSubmit: beforeSubmit,
                 beforeLoad: beforeLoad
        };

    });