/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
//requirements ATP-1301
define(["N/runtime", "/SuiteScripts/Pristine/libraries/autoPopulateTaxFormLibrary.js"],

    function(runtime, taxFormLib) {

		const FIELDS = {
            EXCHANGE_RECORD: {
                INTERNAL_ID     : "customrecord_acq_lot",
                TAX_METHOD      : "custrecordacq_loth_2_de1_taxidmethod",
                FORM_COLLECTED  : "custrecord_exrec_tax_form_collected"
            }
        };
        
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

            var execution = runtime.executionContext;
            var eventType = scriptContext.type;
            var taxFormCollectedValue = "";
			log.debug("execution ", execution );
			log.debug("eventType ", eventType );
			
			
			
			//we will leave Clearing House Logic as is, and separate CSV logic. 
			//perhaps Clearing house logic related to Create can be dropped 
			//suitelet logic requirements were created in ATP-1301
			if (execution === runtime.ContextType.SUITELET) 
            {
				var exchangeRecNew = scriptContext.newRecord;
                var taxMethod = exchangeRecNew.getValue({fieldId: FIELDS.EXCHANGE_RECORD.TAX_METHOD});
                var taxFormCollectedNew = exchangeRecNew.getValue({fieldId: FIELDS.EXCHANGE_RECORD.FORM_COLLECTED});
                
				if (eventType === scriptContext.UserEventType.CREATE)
				{
					log.audit("taxFormCollectedNew", taxFormCollectedNew);
					log.audit("taxMethod", taxMethod);
					//on add, old record is missing and if taxFormCollectedNew has value, fail the process
					//note, on add, new record does not contain taxFormCollectedNew in JSON, but does contain valid 
					//information in memory
					
					 if (taxFormCollectedNew)
		             {
		                	throw "(1) Tax Form Collected cannot be imported.";
		             }
					 if (taxMethod) 
		             {
		                    taxFormCollectedValue = taxFormLib.getCorrespondingTaxFormCollectedValue(taxMethod);
		                    exchangeRecNew.setValue({fieldId: FIELDS.EXCHANGE_RECORD.FORM_COLLECTED, value: taxFormCollectedValue});
		             }
					
				}
				else if (eventType === scriptContext.UserEventType.EDIT)
				{
					//on update, old record exists
					//case 1. when both already exist, and taxFormCollectedNew data is coming in, we should error out
					//case 2. when both already exist, and taxFormCollectedNew is empty, we should re-calculate
					//case 3. when none exists, and taxFormCollectedNew data is coming in we should error out
					//case 4, when 1 or 2 exists, and , and taxFormCollectedNew data is empty, we should re-calculate
					
					var exchangeRecOld = scriptContext.oldRecord;
	                
	                var taxMethodOld = exchangeRecOld.getValue({fieldId: FIELDS.EXCHANGE_RECORD.TAX_METHOD});
	                var taxFormCollectedOld = exchangeRecOld.getValue({fieldId: FIELDS.EXCHANGE_RECORD.FORM_COLLECTED});
//	               
//	                log.audit("taxMethod", taxMethod);
//	                log.audit("taxFormCollectedNew", taxFormCollectedNew);
//	                log.audit("taxMethodOld", taxMethodOld);
//	                log.audit("taxFormCollectedOld", taxFormCollectedOld);
	                
	                if ((taxFormCollectedNew) && (taxFormCollectedOld != taxFormCollectedNew))
	                {
	                	//handles reject scenarios when tax form collected exists, or has changed from the old form
	                	//if it is exactly the same as in the old form, no error is thrown
	                	//case 		taxMethodOld=19
	                	//				 taxFormCollectedNew=8  (or)
//	                					taxMethodOld=null
	                	//				 taxFormCollectedNew=8  (or)
	                	
	                	throw "(2) Tax Form Collected cannot be imported.";
	                }
	                if (taxMethod) 
	                {
	                	//on update, honor recalculation when taxMethod is provided 
	                	//or when tax method has changed between old and new
	                	//this handles empty taxMethod and allows for clearing out the tax form collected 
	                	taxFormCollectedValue = taxFormLib.getCorrespondingTaxFormCollectedValue(taxMethod);
	                	exchangeRecNew.setValue({fieldId: FIELDS.EXCHANGE_RECORD.FORM_COLLECTED, value: taxFormCollectedValue});
	                }
	                
				}
				
            }
        }
			
        
        
        return {
            beforeSubmit: beforeSubmit
        };

    });
