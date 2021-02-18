/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/email', 'N/error', 'N/search', 'N/file', 'N/record', 'N/runtime', 'N/task' ,'N/ui/serverWidget' ,'N/url'
       ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
       ,'/.bundle/132118/PRI_AS_Engine'
   	   ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	],

    function(email, error, search, file, record, runtime, task ,ui ,url 
    		,srsConstants 
    		,appSettings 
    		,tools 
    		) {

        var scriptFileName = "PaymentFileType_UE.js";
        var scriptFullName = scriptFileName;
       
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeLoad(context) {
                	
        	var scriptFunctionName = "beforeLoad";
        	scriptFullName = scriptFileName + "--->" + scriptFunctionName;
        	var rcd = null;
        	log.debug("context.type" + context.type);
        	if (context.type == context.UserEventType.VIEW) {
        		rcd = context.newRecord;
        		
        		
//				var objFieldManualReason  = context.form.getField({ id:"custrecord_pay_file_manual_reason" });
//				var objFieldManualExplain = context.form.getField({ id:"custrecord_pay_file_man_deliv_explain" });

				var userRole = {administrator: 'administrator' ,customAdministrator:'customrole1150'};
				var roleId = runtime.getCurrentUser().roleId;
        		var viewSearchLink = "<span>" 
        			               + "<a class='dottedlink viewitm' style='color:#255599 !important;' href='/app/common/search/savedsearch.nl?id={id}' target=_blank>View this search</a>" 
        			               + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        			               + "<a class='dottedlink viewitm' style='color:#255599 !important;' href='/app/common/search/savedsearch.nl?e=T&id={id}' target=_blank>Edit this search</a>" 
           			               + "</span>";
        		var searchLink;
        		
        		var lookupSearchId  = rcd.getValue("custrecord_pft_suitelet_pmts_search_id");
        		var filegenSearchId = rcd.getValue("custrecord_pft_file_gen_search_id");
        		
        		var objLookupSearchFields  = search.lookupFields({type:search.Type.SAVED_SEARCH ,id:lookupSearchId  ,columns:['title']});
        		var objFilegenSearchFields = search.lookupFields({type:search.Type.SAVED_SEARCH ,id:filegenSearchId ,columns:['title']});
        		
        		// SUITELET LOOKUP SEARCH +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        		var fieldLookupSearchName = context.form.addField({id:'custpage_name_lookup' ,type:ui.FieldType.TEXT ,label: 'Payments Lookup Search' });
	            fieldLookupSearchName.defaultValue = objLookupSearchFields.title;
	            fieldLookupSearchName.setHelpText({ help:"This is the search that will be used on the Payment File Creation suitelet to lookup customer refund transactions to be presented to the user for inclusion in the payment file." });
	            context.form.insertField({ field:fieldLookupSearchName ,nextfield:'custrecord_pft_idx_deal' });
        		
				if (roleId == userRole.administrator || roleId == userRole.customAdministrator) {
		            var fieldViewSearch1 = context.form.addField({id:'custpage_view_search_link_1' ,type:ui.FieldType.INLINEHTML ,label: '&nbsp;' });
		            searchLink = viewSearchLink.replace("{id}" ,lookupSearchId);
		            fieldViewSearch1.defaultValue = searchLink.replace("{id}" ,lookupSearchId);
		            context.form.insertField({ field:fieldViewSearch1 ,nextfield:'custrecord_pft_idx_deal' });
				} 
				//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        		
				
        		// FILE GENERATION SEARCH +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	            var fieldFilegenSearchName = context.form.addField({id:'custpage_name_filegen' ,type:ui.FieldType.TEXT ,label: 'File Generation Search' });
	            fieldFilegenSearchName.defaultValue = objFilegenSearchFields.title;
	            fieldFilegenSearchName.setHelpText({ help:"This is the search that will be used on the Payment File Creation suitelet to load the payments chosen by the user and ouput then to the Payment File." });
	            context.form.insertField({ field:fieldFilegenSearchName ,nextfield:'custrecord_pft_idx_deal' });
	            
				if (roleId == userRole.administrator || roleId == userRole.customAdministrator) {
		            var fieldViewSearch2 = context.form.addField({id:'custpage_view_search_link_2' ,type:ui.FieldType.INLINEHTML ,label: '&nbsp;' });
		            searchLink = viewSearchLink.replace("{id}" ,filegenSearchId);
		            fieldViewSearch2.defaultValue = searchLink.replace("{id}" ,filegenSearchId);
		            context.form.insertField({ field:fieldViewSearch2 ,nextfield:'custrecord_pft_idx_deal' });
				} 
				//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
				
        	} // if (context.type == context.UserEventType.VIEW)
        	
        	else
        	
        	if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE) 
        	{
        		
        		
        		rcd = context.newRecord;
        		
            	var filterRecType = search.createFilter({ name:'recordtype'  ,operator:"IS"          ,values:["Transaction"] });
            	var filterTitle   = search.createFilter({ name:'formulatext' ,operator:"startswith"  ,values:["PFC:"]    ,formula:"{title}" });
            	var arrFilters = [];
            	arrFilters.push(filterRecType);
            	arrFilters.push(filterTitle);
        		
        		var mySearch = search.create({ type:search.Type.SAVED_SEARCH
        		     					   ,filters: arrFilters
        		     					   ,columns: [   search.createColumn({ name: 'internalid'   						})
        		     						   			,search.createColumn({ name: 'title'	  ,sort:search.Sort.ASC  	})
        		     						   			,search.createColumn({ name: 'recordtype'							})
        		     						   		 ]
        		    						 });
        		
        		var searchObj = mySearch.run(); //returns search object
        		var searchResults = searchObj.getRange(0,1000);

        		
	            var fieldLookupSearchSelect = context.form.addField({id:'custpage_lookup_select' ,type:ui.FieldType.SELECT ,label: 'Payments Lookup Search' });
	            fieldLookupSearchSelect.isMandatory = true;
	            fieldLookupSearchSelect.setHelpText({ help:"This is the search that will be used on the Payment File Creation suitelet to lookup customer refund transactions to be presented to the user for inclusion in the payment file." });
	            
	            if (context.type == context.UserEventType.CREATE) {
		            fieldLookupSearchSelect.addSelectOption({value:'', text:' '});
	            }
	            var ix=0;
	            var isSelected = false;
	            var internalid = "";
	            var title = "";
	            for (ix=0; ix<searchResults.length; ix++) {
	            	isSelected = false;
	            	if (rcd.getValue("custrecord_pft_suitelet_pmts_search_id")) {
		            	if (searchResults[ix].getValue('internalid') == rcd.getValue("custrecord_pft_suitelet_pmts_search_id")) { isSelected = true; } 
	            	}
	            	internalid    = searchResults[ix].getValue('internalid');
	            	title         = searchResults[ix].getValue('title');
		            fieldLookupSearchSelect.addSelectOption({value:internalid ,text:title ,isSelected:isSelected});
	            }
	            context.form.insertField({ field:fieldLookupSearchSelect ,nextfield:'custrecord_pft_idx_deal' });
        		

        		
	            var fieldFilegenSearchSelect = context.form.addField({id:'custpage_filegen_select' ,type:ui.FieldType.SELECT ,label: 'File Generation Search' });
	            fieldFilegenSearchSelect.isMandatory = true;
	            fieldFilegenSearchSelect.setHelpText({ help:"This is the search that will be used on the Payment File Creation suitelet to load the payments chosen by the user and ouput then to the Payment File." });
	            
	            if (context.type == context.UserEventType.CREATE) {
	            	fieldFilegenSearchSelect.addSelectOption({value:'', text:' '});
	            }
	            
	            for (ix=0; ix<searchResults.length; ix++) {
	            	isSelected = false;
	            	if (rcd.getValue("custrecord_pft_file_gen_search_id")) {
		            	if (searchResults[ix].getValue('internalid') == rcd.getValue("custrecord_pft_file_gen_search_id")) { isSelected = true; } 
	            	}
	            	internalid    = searchResults[ix].getValue('internalid');
	            	title         = searchResults[ix].getValue('title');
	            	fieldFilegenSearchSelect.addSelectOption({value:internalid ,text:title ,isSelected:isSelected});
	            }
	            context.form.insertField({ field:fieldFilegenSearchSelect ,nextfield:'custrecord_pft_idx_deal' });
			
	            
	            
	            
	            
	            
	            
        	} // if (context.type == context.UserEventType.VIEW)
        	
        	var displayType = ui.FieldDisplayType.HIDDEN;
        	//if (runtime.accountId == '772390_SB3' && runtime.getCurrentUser().id == 1047697) { displayType = ui.FieldDisplayType.INLINE; }
    		var field1 = context.form.getField("custrecord_pft_suitelet_pmts_search_id");
    		var field2 = context.form.getField("custrecord_pft_file_gen_search_id");
    		field1.updateDisplayType({ displayType:displayType });
    		field2.updateDisplayType({ displayType:displayType });
    		
    		
    		
    		

    		//ATP-1552
    		if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE) {
	    		var fieldcre = context.form.getField("custrecord_pft_cre_profile");
	    		var fileFormat = rcd.getValue("custrecord_pft_file_format");
	    		var isMandatory = false;
	    		if (fileFormat) {
					var objPFF_Fields = search.lookupFields({type:"customrecord_payment_file_format" ,id:fileFormat
			            ,columns:["custrecord_pff_cre_profile_required"]});
					isMandatory = objPFF_Fields.custrecord_pff_cre_profile_required;
	    		}
        		tools.makeMandatory(context, "custrecord_pft_cre_profile", isMandatory);
	        	
	        	var accountoptions = rcd.getValue("custrecord_pft_account_options");
	        	if (parseInt(accountoptions, 10) !== parseInt(srsConstants["PFT Account Options"]["Uses Omnibus Account"],10))
				{
		        	var omnibusname = context.form.getField('custrecord_pft_omnibus_company_name');
					var omnibusid = context.form.getField('custrecord_pft_omnibus_company_id');
					var omnibusimmediateorigin = context.form.getField('custrecord_pft_omnibus_immediate_origin');
					omnibusname.updateDisplayType({
	                    displayType: ui.FieldDisplayType.DISABLED
	                });
	    			omnibusid.updateDisplayType({
	                    displayType: ui.FieldDisplayType.DISABLED
	                });
					omnibusimmediateorigin.updateDisplayType({
	                    displayType: ui.FieldDisplayType.DISABLED
	                });
					
				}
				//ATP-1552 end 
    		}
            

        } // beforeLoad(context)

        function signatureNeeded(context)
		{
			var retValue = false;
			var fileformat = context.newRecord.getValue("custrecord_pft_file_format");
			if (parseInt(fileformat,10) === parseInt(srsConstants["Payment File Type"]["Check"],10))
			{
				var objSignature = JSON.parse(appSettings.readAppSetting("Payment File Creation", "PDF Check Signature Bank Map"))
				var paymentbank = context.newRecord.getValue("custrecord_pft_payment_bank");
				if (!(objSignature[runtime.accountId]
					&& objSignature[runtime.accountId][paymentbank]
					&& objSignature[runtime.accountId][paymentbank]["Signature File"]))
				{
					retValue = true; 
				}
			}
			return retValue;
		}
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {
            var funcName = scriptFileName + "--->beforeSubmit";
            var oldRec = context.oldRecord;
            var newRec = context.newRecord;
            
            if (newRec.getValue('custpage_lookup_select'))  { newRec.setValue('custrecord_pft_suitelet_pmts_search_id' ,newRec.getValue('custpage_lookup_select') );  }
            if (newRec.getValue('custpage_filegen_select')) { newRec.setValue('custrecord_pft_file_gen_search_id'      ,newRec.getValue('custpage_filegen_select') ); }

            if (signatureNeeded(context))
            {
            	throw "Signature File Internal ID not found in app setting: \"Payment File Creation-->PDF Check Signature Bank Map\" for payment bank " + context.newRecord.getText("custrecord_pft_payment_bank")+".";
            }
            
            
            return;


        } // beforeSubmit(context)
        
        

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return {
             beforeLoad: beforeLoad
            ,beforeSubmit: beforeSubmit
//            ,afterSubmit: afterSubmit
        };

    });