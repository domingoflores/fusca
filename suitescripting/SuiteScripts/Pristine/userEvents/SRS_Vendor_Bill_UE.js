/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/email', 'N/error', 'N/search', 'N/file', 'N/record', 'N/runtime', 'N/transaction' ,'N/ui/serverWidget' 
	   , '/SuiteScripts/Pristine/libraries/financeListLibrary.js'
       , '/SuiteScripts/Pristine/libraries/financeUtilitiesLibrary.js' ],
/**
 * @param {email} email
 * @param {error} error
 * @param {file} file
 * @param {record} record
 * @param {runtime} runtime
 * @param {transaction} transaction
 */

function(email, error, search, file, record, runtime, transaction ,ui ,financeListLibrary ,financeUtil ) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    
	var scriptFileName = "SRS_Vendor_Bill_UE.js";
	var billApprovalSts       = financeListLibrary.financeEnum.billApprovalSts;
	var nativeBillApprovalSts = financeListLibrary.financeEnum.nativeBillApprovalSts;
	
	
	/*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function beforeLoad(context) {
    	
    	//var scriptFunctionName = "beforeLoad";
    	//var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
    	//log.debug(scriptFullName, "========================================================================");
    	//log.debug(scriptFullName, "========================================================================");
    	//log.debug(scriptFullName, "UserEventType: " + context.type);

		var runTimeCTX = runtime.executionContext;
	   	
		// ATP-261 Approved By and Pre-Approved were INLINE TEXT but need to be editable on the form for Import 
        // Set them to Inline-Text here when it is not a CSV Import and form is SRS Vendor Bill
    	var formId    = context.newRecord.getValue('customform');
		if (runTimeCTX != 'CSVIMPORT') { 
	    	fldApprovedBy = context.form.getField({ id : 'custbody_pur_approved_by' });
	    	fldApprovedBy.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });			
	    	fldPreApproved = context.form.getField({ id : 'custbody_preapproved' });
	    	fldPreApproved.updateDisplayType({ displayType : ui.FieldDisplayType.INLINE });			
		}
      
    	var rcdNew = context.newRecord;

        // ATP-261 Make sure Pre-Approved is initialized to false on create and does copied as true on a record copy operation
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY ) { 
    	    rcdNew.setValue('custbody_preapproved' ,false);
        }

    	return;

    	
    } // beforeLoad(context)

    
    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function beforeSubmit(context) {
    	
        var preApprovedRoleValid = false;
    	var importError;
    	var scriptFunctionName = "beforeSubmit";
    	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
    	//log.debug(scriptFullName, "========================================================================");
    	//log.debug(scriptFullName, "========================================================================");
    	//log.debug(scriptFullName, "UserEventType: " + context.type);

		var runTimeCTX = runtime.executionContext;
		var userRoleId = runtime.getCurrentUser().roleId;
    	var rcdNew     = context.newRecord;

    	var preApproved    = rcdNew.getValue('custbody_preapproved');
    	
    	if (preApproved) {
    		if (context.type == context.UserEventType.COPY) { 
    			rcdNew.setValue('custbody_preapproved' ,false);
    		}
    		if (context.type == context.UserEventType.CREATE) {
    			if (runTimeCTX == 'CSVIMPORT') { 
    				if (!financeUtil.vendorBillPreApprovedRoleValid(userRoleId)) {
        				importError = error.create({ name:'IMPORT_PRE_APPRVD_INVALID_ROLE'
                            ,message: 'The Pre-Approved flag may only be set to true when a record is being created via a CSV import using the "SRS CFO" role. ' 
                            ,notifyOff: true });
                        throw importError.name + ': ' + importError.message;
    				}
    			}
    			else {
    				importError = error.create({ name:'IMPORT_PRE_APPRVD_IMPORT_ONLY'
                        ,message: 'The Pre-Approved flag may only be set to true when a record is being created via a CSV import. ' 
                        ,notifyOff: true });
                    throw importError.name + ': ' + importError.message;
    			}    			
    		}
    		else {
    	      var rcdOld         = context.oldRecord;
    	      var preApprovedOld = rcdOld.getValue('custbody_preapproved');
              if (preApproved != preApprovedOld) {
				importError = error.create({ name:'IMPORT_PRE_APPRVD_CREATE_ONLY'
                    ,message: 'The Pre-Approved flag may only be set to true when a record is being created, not allowed on updates. ' 
                    ,notifyOff: true });
                throw importError.name + ': ' + importError.message;
              }
    		}
    	
    	    rcdNew.setValue('custbody_approval_status_srs' ,billApprovalSts.Approved);
    	    rcdNew.setValue('approvalstatus'               ,nativeBillApprovalSts.Approved);
    	}

    	
    	return;

      
      

    	
    } // beforeSubmit(context)


    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    //function afterSubmit(context) {
    	



     	
     	
    //} // afterSubmit(context)
    
    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    return {
        beforeLoad: beforeLoad
        ,beforeSubmit: beforeSubmit
        //,afterSubmit: afterSubmit
    };
    
});
