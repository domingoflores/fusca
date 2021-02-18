/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/format','N/email', 'N/error', 'N/search', 'N/file', 'N/record', 'N/runtime', 'N/task', 'N/ui/serverWidget' ,'N/url'
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	   ,'/SuiteScripts/Pristine/libraries/ExRecAlphaPIClientLibrary.js'
	   ,'/SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
	   ,'/SuiteScripts/Pristine/libraries/TINCheckLibrary.js'
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
       ,'/SuiteScripts/Pristine/libraries/paymtInstrLight.js'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
       ,'/.bundle/132118/PRI_ShowMessageInUI'
	   ,'/.bundle/168443/PRI_RSM_Engine'
       ,'/.bundle/132118/PRI_ServerLibrary'
       ],
    /**
     * @param {email} email
     * @param {error} error
     * @param {file} file
     * @param {record} record
     * @param {runtime} runtime
     * @param {transaction} transaction
     */

    function (format, email, error, search, file, record, runtime, task, ui ,url
    		 ,srsConstants
    		 ,ExRecAlphaPIClient
    		 ,ExRecAlphaPI
    		 ,tinCheck
    		 ,appSettings
    		 ,toolslib
    		 ,pymtInstr
    		 ,piListLib
    		 ,priMessage
			 ,rsmEngine		
			 ,priLibrary
			 ) {

    	var FIELDS = ExRecAlphaPIClient.objValidation.FIELDS;
    	var messages = ExRecAlphaPIClient.objValidation.messages;

        // ATP-1246 ================================================================================================
        
        const FX_FIELDS = {
            CONTRACT: {
                ID: 'custrecord_exrec_fx_conv_contract',
                VALUE: '',
                FIELD_OBJ: ''
            },
            RATE: {
                ID: 'custrecord_exrec_fx_conv_ctr_rate',
                VALUE: '',
                FIELD_OBJ: ''
            },
            CURRENCY: {
                ID: 'custrecord_exrec_shrhldr_settle_curr',
                VALUE: '',
                FIELD_OBJ: ''
            },
            ISO_CODE: {
                ID: 'custrecord_exrec_fx_conv_iso_code',
                VALUE: '',
                FIELD_OBJ: ''
            }
        };

        const OLD_FX_FIELDS = {
            CONTRACT: {
                ID: 'custrecord_exrec_fx_conv_contract',
                VALUE: '',
                FIELD_OBJ: ''
            },
            RATE: {
                ID: 'custrecord_exrec_fx_conv_ctr_rate',
                VALUE: '',
                FIELD_OBJ: ''
            },
            CURRENCY: {
                ID: 'custrecord_exrec_shrhldr_settle_curr',
                VALUE: '',
                FIELD_OBJ: ''
            },
            ISO_CODE: {
                ID: 'custrecord_exrec_fx_conv_iso_code',
                VALUE: '',
                FIELD_OBJ: ''
            }
        };

        //var fxContractField = '';

        /**
         * Gets the values for all necessary fields that will be used for handling logic.
         */
        function getFieldValues(scriptContext, eventFunction) {

            var rec = scriptContext.newRecord;
            var oldRec = scriptContext.oldRecord;
            var form = scriptContext.form;

            for (var key in FX_FIELDS) {

                FX_FIELDS[key].VALUE = rec.getValue({
                    fieldId: FX_FIELDS[key].ID
                });

                if (eventFunction === 'beforeLoad') {

                    FX_FIELDS[key].FIELD_OBJ = form.getField({
                        id: FX_FIELDS[key].ID
                    });
                }
            }

            if (scriptContext.type === 'edit' && eventFunction === 'beforeSubmit') {

                for (var key in OLD_FX_FIELDS) {

                    OLD_FX_FIELDS[key].VALUE = oldRec.getValue({
                        fieldId: OLD_FX_FIELDS[key].ID
                    });
                }
            }


        }

        /**
         * Disables the FX Currency related fields
         */
        function disableFields() {

            for (var key in FX_FIELDS) {

                // Ensure the 'native' FX Contract field stays hidden
                if (FX_FIELDS[key] === 'CONTRACT') {

                    FX_FIELDS[key].FIELD_OBJ.updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
                }

                FX_FIELDS[key].FIELD_OBJ.updateDisplayType({
                    displayType: ui.FieldDisplayType.DISABLED
                });
            }
            /*
            // Ensure our custom FX Contract field gets disabled
            fxContractField.updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            });
            */
        }

        /**
         * Hide the 'native' FX Contract field and create a new custom one that can have it's values added
         * dynamically on the client side
         *
         * @param {Object} context - scriptContext Object
         */
        /*function handleFXContractField(context) {

            var form = context.form;

            FX_FIELDS.CONTRACT.FIELD_OBJ.updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            fxContractField = form.addField({
                id: 'custpage_fx_conv_contract',
                type: ui.FieldType.SELECT,
                label: 'FX CURRENCY CONTRACT'
            });

            form.insertField({
                field: fxContractField,
                nextfield: 'custrecord_ef_date'
            });

            fxContractField.setHelpText({
                help: 'Linked Foreign Currency Conversion Contract Record.'
            });

            // If there is a value in the 'native' Contract field, set that as the selected value in the custom field
            if (Boolean(FX_FIELDS.CONTRACT.VALUE)) {

                var contractName = context.newRecord.getText({
                    fieldId: FX_FIELDS.CONTRACT.ID
                });

                fxContractField.addSelectOption({
                    value: FX_FIELDS.CONTRACT.VALUE,
                    text: contractName
                });
            }

            form.insertField({
                field: fxContractField,
                nextfield: FX_FIELDS.RATE.ID
            });


            return fxContractField;

        }
        */
        /**
         * Runs a search to determine if the FX Contract is 'Locked'
         *
         * @param {string} contractId - Internal ID of the FX Contract
         *
         * @returns {boolean}
         */
        function determineLockedContract(contractId) {

            var filters = [
                [
                    ['custrecord_fx_conv_first_approved', 'is', 'T'], 'OR', ['custrecord_fx_conv_second_approved', 'is', 'T']
                ],
                'AND',
                ['internalid', 'is', contractId]
            ];

            var fxSearch = search.create({
                type: 'customrecord_fx_conv_contract',
                filters: filters
            });

            var resultCount = fxSearch.runPaged().count;

            return resultCount > 0;
        }

        /**
         * Determines if the FX Currency value on the Exchange Record matches the Converted Currency value on the FX Currency Contract
         *
         * @param {string} contractId - Internal ID of the FX Currency Contract to look up
         * @param {string} currencyId - Internal ID of the Currency record to compare to the value on the FX Currency Contract
         *
         * @returns {boolean}
         */
        function hasMatchingCurrency(contractId, currencyId) {
            
            if (contractId && currencyId) {
                var fxCurrencyLookUp = search.lookupFields({
                    type: 'customrecord_fx_conv_contract',
                    id: contractId,
                    columns: ['custrecord_fx_conv_converted_currency']
                });
                var fxCurrency = fxCurrencyLookUp['custrecord_fx_conv_converted_currency'][0].value;
                return fxCurrency === currencyId;
            }
        }
        
        // END ATP-1246 ============================================================================================

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptcontext
         * @param {Record} scriptcontext.newRecord - New record
         * @param {string} scriptcontext.type - Trigger type
         * @param {Form} scriptcontext.form - Current form
         * @Since 2015.2
         */

        var scriptFileName = "ExchangeRecord_UE.js";
        var scriptFullName = scriptFileName;
        var UserEventType;

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeLoad(context) {

            var objUser = runtime.getCurrentUser();
            var theForm = context.form
            var payment_instruction_sub = context.newRecord.getValue("custrecord_exrec_paymt_instr_sub");
            var payment_instruction = context.newRecord.getValue("custrecord_exrec_payment_instruction");
            var payout_type_value = context.newRecord.getValue("custrecord_acq_lot_payout_type");
            
            if (Boolean(payout_type_value)) {
                var payout_type = search.lookupFields({
                    type: 'customrecord_payment_type',
                    id: payout_type_value,
                    columns: ['custrecord_payout_no_override_ref_txt']
                });
                var payout_type = payout_type['custrecord_payout_no_override_ref_txt'];
            } else { 
                payout_type = null;
            }
            log.debug("payout_type: ", payout_type);

            //ATP-1367
            if ((Boolean(payment_instruction_sub) || Boolean(payment_instruction)) && context.type === 'edit') {
                var df = srsConstants.EXREC.disableFields;
                disableExRecFields(context, df, payout_type);
            }

            //ATP-1367 end

            //ATP-1300

            function evaluateTaxGroupFuntionalityAccess() {
                arrTaxGroupMembers = JSON.parse(appSettings.readAppSetting("Lot Certificate", "Tax Analyst group members"));
                if (arrTaxGroupMembers.indexOf(objUser.name) > -1) {
                    TaxGroupFuntionalityAccess = true;
                } else {
                    TaxGroupFuntionalityAccess = false;
                }
                return TaxGroupFuntionalityAccess;
            }

            if (context.type === 'edit' || context.type === 'create') {

                if (!Boolean(evaluateTaxGroupFuntionalityAccess())) {
                    var giin_validated = theForm.getField({
                        id: 'custrecord_exrec_giin_validated'
                    });
                    giin_validated.updateDisplayType({
                        displayType: ui.FieldDisplayType.DISABLED
                    })
                } else {
                    var giin_validated = theForm.getField({
                        id: 'custrecord_exrec_giin_validated'
                    });
                    giin_validated.updateDisplayType({
                        displayType: ui.FieldDisplayType.NORMAL
                    })
                }
            }

            // ATP-1246 ================================================================================================
            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE && (context.type === 'edit' || context.type === 'create')) {

                getFieldValues(context, 'beforeLoad');

                //fxContractField = handleFXContractField(context);

                FX_FIELDS.CONTRACT.FIELD_OBJ.updateDisplayType({
                    displayType: ui.FieldDisplayType.INLINE
                });

                if (Boolean(FX_FIELDS.CONTRACT.VALUE)) {

                    var isContractLocked = determineLockedContract(FX_FIELDS.CONTRACT.VALUE);

                    if (isContractLocked) {

                        disableFields();
                    }
                } /* else {

                    if (!Boolean(FX_FIELDS.CURRENCY.VALUE)) {

                        fxContractField.updateDisplayType({
                            displayType: ui.FieldDisplayType.DISABLED
                        });
                    }
                }*/
            }

            // END ATP-1246 ============================================================================================

            var scriptFunctionName = "beforeLoad";
            scriptFullName = scriptFileName + "--->" + scriptFunctionName;

            // ATO-233
            var fieldNotesToBeAdded = context.form.addField({
                id: 'custpage_notes_to_be_added',
                type: ui.FieldType.LONGTEXT,
                label: "ATO 234 HIDDEN FIELD"
            });
            fieldNotesToBeAdded.updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            // end ATO-233


            // ATP-743
            var userObj = runtime.getCurrentUser();
            if (userObj.role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER ||
                userObj.role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST ||
                userObj.role == srsConstants.USER_ROLE.ADMINISTRATOR) {
                var field = context.form.getField("custrecord_irs_tin_status");
                if (field) {
                    field.updateDisplayType({
                        displayType: ui.FieldDisplayType.NORMAL
                    });
                }
            } // END ATP-743


            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                if (context.type == context.UserEventType.VIEW) {
                    if (context.newRecord.getValue("custrecord_acq_rsm_run_status")) {
                        renderRSMStatus(context);
                    }
                    processReturnedPaymentButton(context);
                }
            }

            // ATP-1364
            var promotionTimeStamp;
            if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type == 'edit' || context.type == 'view')) {
                var rec = context.newRecord;
                var alphaPIrecord = rec.getValue({fieldId: 'custrecord_exrec_payment_instruction'});
                var alphaPISBrecord = rec.getValue({fieldId: 'custrecord_exrec_paymt_instr_sub'});
                if (alphaPIrecord) {
                    promotionTimeStamp = search.lookupFields({
                        type: 'customrecord_paymt_instr',
                        id: alphaPIrecord,
                        columns: ['custrecord_pi_promotion_ts']
                        }); 
                        if (promotionTimeStamp){
                            log.debug("timestamp from PI promotion",promotionTimeStamp);   
                        }
                }
                
                log.debug('alphaPIrecord '+Boolean(alphaPIrecord)+' & alphaPISBrecord '+Boolean(alphaPISBrecord) , 'alphaPIrecord='+alphaPIrecord+" alphaPISBrecord="+alphaPISBrecord );
                if ( Boolean(alphaPIrecord) ){
                    priMessage.prepareMessage("Alpha Payment Instruction Detected", "NOTICE: Payment Instruction Record attached will be used for Payment. Payment Instruction promoted at " + JSON.stringify(promotionTimeStamp.custrecord_pi_promotion_ts), priMessage.TYPE.WARNING);
                    rec.setValue({ fieldId: 'custrecord_exrec_alphapi_msg', value: '<br /><b style="color:red">Shareholder has active PI</b>' });
                }
                if ( Boolean(alphaPISBrecord) ){
                    priMessage.prepareMessage("Alpha Payment Instruction Submission Detected", "NOTICE: Shareholder has an outstanding Payment Instruction Submission record.", priMessage.TYPE.WARNING);
                    rec.setValue({ fieldId: 'custrecord_exrec_alphapi_msg', value: '<br /><b style="color:red">Shareholder has outstanding PISB</b>' });
                }
                // ATP-1852 line 429-432 comment out since this condition will not occur.
                // if ( Boolean(alphaPIrecord) && Boolean(alphaPISBrecord) ){
                //    priMessage.prepareMessage("Alpha Payment Instruction & Payment Instruction Submission Detected", "NOTICE: Payment Instruction Record attached will be used for Payment and Shareholder has an outstanding Payment Instruction Submission record.", priMessage.TYPE.WARNING);
                //    rec.setValue({ fieldId: 'custrecord_exrec_alphapi_msg', value: '<br /><b style="color:red">NOTICE: Payment Instruction Record attached will be used for Payment and Shareholder has an outstanding Payment Instruction Submission record.</b>' });
                //}

            }

            ifRecordIsPaid_ProtectFields(context);

            fxReturnMessage(context); // ATP-1978
            
            return;

        } // beforeLoad(context)


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function processReturnedPaymentButton(context) {
        	
    		var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};
			var hasAccess         = toolslib.checkPermission(objPermissionList);
			var creditMemoID      = parseInt(context.newRecord.getValue('custrecord_acq_loth_related_trans')) || null;
			var exRecID           = parseInt(context.newRecord.getValue('id')) || null;
			
			//log.debug('processReturnedPaymentButton', 'hasAccess: ' + hasAccess);
			// Is there a credit memo related to the exchange record?  Only show the button if that is so
			if (creditMemoID && hasAccess) {
				var thereIsFxReturnedPaymentVoidTracking = false;
				
				var voidTrackingStatus_Completed  = 3;
				var voidTrackingStatus_Voiding    = 6;
		    	var filter0 = search.createFilter({ name:'isinactive'                        ,operator:"IS"      ,values:["F"]             });
		    	var filter1 = search.createFilter({ name:'custrecord_vt_exchange_record'     ,operator:"ANYOF"   ,values:[exRecID]         });
		    	var filter2 = search.createFilter({ name:'custrecord_vt_status'              ,operator:"ANYOF"   ,values:[voidTrackingStatus_Completed ,voidTrackingStatus_Voiding ] });
		    	var filter3 = search.createFilter({ name:'custrecord_vt_fx_ret_exchange_rcd' ,operator:"NONEOF"  ,values:["@NONE@"] });
		    	var arrFilters = [];
		    	arrFilters.push(filter0);
		    	arrFilters.push(filter1);
		    	arrFilters.push(filter2);
		    	arrFilters.push(filter3);
				
		        var col_internalid   = search.createColumn({ name:"internalid" ,join:null });
		    	var arrColumns = [];
		    	arrColumns.push(col_internalid);
				
				var voidTrackingSearchObj = search.create({ type:"customrecord_void_tracking" ,filters:arrFilters ,columns:arrColumns  });
				
				var voidTrackingSearch        = voidTrackingSearchObj.run();
				var voidTrackingSearchResults = voidTrackingSearch.getRange(0,1);
			    
				if (voidTrackingSearchResults && voidTrackingSearchResults.length > 0 ) { thereIsFxReturnedPaymentVoidTracking = true; }
				
				if ( !thereIsFxReturnedPaymentVoidTracking ) {
					context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/voidTrackingClient.js';
					context.form.addButton({ id:'custpage_process_returned_payment_button' ,label:'Process Returned Payment' ,functionName:'processReturnedPayment()' });
				}
			}

        }


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function ifRecordIsPaid_ProtectFields(context) {
        	
        	if (ifRecordIsPaid_ProtectFields_sanbox_override(context)) { return; }       	
        	
        	var rcd = context.newRecord;        
			var cMemo          = rcd.getValue("custrecord_acq_loth_related_trans");
			var acquiomStatus  = rcd.getValue("custrecord_acq_loth_zzz_zzz_acqstatus");
			var shrhldrStatus  = rcd.getValue("custrecord_acq_loth_zzz_zzz_shrhldstat");
			
        	if (!cMemo && piListLib.objExRecAcqStatusLessThan5[acquiomStatus] && piListLib.objExRecShrStatusLessThan5[shrhldrStatus] ) { 
        		return; 
        	}
        	
        	var fieldsList = [];
			var arrayPiToEx = piListLib.arrayPiToExchangeRecord; // Get array of objects for PI fields on Exchange record
		    for (ix in arrayPiToEx) { // create an array of strings that are the exchange record field id's from the list above
		    	var objPiToEx = arrayPiToEx[ix];
		    	fieldsList.push(objPiToEx.exField);
		    } // for (ix in arrayPiToEx)
        	
    		toolslib.setFieldDisplayType(context ,fieldsList ,ui.FieldDisplayType.DISABLED );

        }


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function ifRecordIsPaid_ProtectFields_sanbox_override(context) {
        	
        	if (runtime.accountId == "772390") { return false; }
        	
			var searchFilters = [];
			searchFilters.push({ name:'formulatext' ,operator:search.Operator.IS ,values:["Exchange Record"] ,formula:"{custrecord_pri_as_app}"	});
			searchFilters.push({ name:'name'        ,operator:search.Operator.IS ,values:["Override Payment Data Locking"]			});
			
			var searchSetting = search.create({ type: 'customrecord_pri_app_setting'
				                           ,columns:[{name:'name'} 
				                                    ,{name:'custrecord_pri_as_value'}
                                                    ,{name:'lastmodified'} 
                                                    ]
				                           ,filters: searchFilters
			                                 }).run();

			var searchResults = searchSetting.getRange(0,1);

			if (searchResults.length > 0) {
				var minutes      = searchResults[0].getValue("custrecord_pri_as_value");
				var lastModified = searchResults[0].getValue("lastmodified");
				
				var milliseconds = Number(minutes) * 60 * 1000;
				
				var objLastModified = new Date(lastModified);  
				
			    var millisecs = objLastModified.getTime(); // This is Denver Time
			    millisecs = millisecs - (60 * 60 * 1000);  // Convert to NetSuite Time (pacific)
			    millisecs = millisecs + milliseconds;      // Add in number minutes from app setting
				
			    var objToday = new Date();
				if (millisecs > objToday.getTime()) { return true; } // override is NOT expired 
			}
        	
        	return false;

        }


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {

            var scriptFunctionName = "beforeSubmit";
            scriptFullName = scriptFileName + "--->" + scriptFunctionName;
            //    	log.debug(scriptFullName, "========================================================================");
            //    	log.debug(scriptFullName, "========================================================================");
            //log.debug(scriptFullName, "UserEventType: " + context.type);
            //log.debug(scriptFullName, "context.oldRecord: " + JSON.stringify(context.oldRecord));
            //log.debug(scriptFullName, "context: " + JSON.stringify(context));

            // ATP-562 - ISO Country Code Processing  (ATP-1658 add ISO2 country codes
            updateISOCountryFields(context, "custrecord_acq_loth_1_de1_shrhldcountry"  ,"custrecord_exrec_hldr_cntry_iso2" ,"custrecord_exrec_hldr_cntry_iso3"  ,"custrecord_exrec_hldr_citizen_cntry_nm");
            updateISOCountryFields(context, "custrecord_acq_loth_5b_de1_bankcountry"   ,"custrecord_exrec_wire_cntry_iso2" ,"custrecord_exrec_wire_cntry_iso3"  ,"custrecord_exrec_wire_citizen_cntry_nm");
            updateISOCountryFields(context, "custrecord_acq_loth_5c_de1_checkscountry" ,"custrecord_exrec_chk_cntry_iso2"  ,"custrecord_exrec_chk_cntry_iso3"   ,"custrecord_exrec_chk_citizen_cntry_nm");

            // ATP-562 - State Code Processing
            updateStateCodeField(context, "custrecord_acq_loth_1_de1_shrhldstate", "custrecord_exrec_hldr_state_cd");
            updateStateCodeField(context, "custrecord_acq_loth_5c_de1_checksstate", "custrecord_exrec_chk_state_cd");
            updateStateCodeField(context, "custrecord_acq_loth_5b_de1_bankstate", "custrecord_exrec_wire_state_cd");
            updateStateCodeField(context, "custrecord_acq_loth_5a_de1_bankstate", "custrecord_exrec_ach_state_cd");

            // ATP-1246 ================================================================================================
            var rec = context.newRecord;
            var oldRec = context.oldRecord;
            var contractField = rec.getValue({
                fieldId: FX_FIELDS.CONTRACT.ID
            });
            /*
            fxContractField = rec.getValue({
                fieldId: 'custpage_fx_conv_contract'
            });
            /*
            // ATP-1617 ================================================================================================
            if ( rec.getValue("custrecord_acq_loth_4_de1_lotpaymethod") ) { // xedit not an issue on this line
            	var exrec_shrhldr_settle_curr = getFieldValueAllContexts(context, "custrecord_exrec_shrhldr_settle_curr");
            	if ( ! exrec_shrhldr_settle_curr ) {
					var settlementCurrency_USD = 1;
            		rec.setValue({ fieldId:"custrecord_exrec_shrhldr_settle_curr" ,value:settlementCurrency_USD });
            	}
            }
            // END ATP-1617 ============================================================================================
            */
            /*
            // If the custom Contract field was set and that value hasn't been copied to the 'native' Contract field, do so
            if (Boolean(fxContractField) && !Boolean(contractField)) {

                rec.setValue({
                    fieldId: contractField,
                    value: fxContractField
                });
            }
            */
            // END ATP-1246 ============================================================================================

            // ATP-1458 ================================================================================================
            if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE && context.type !== context.UserEventType.DELETE) {

                var rec = context.newRecord;
                
                //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                // mapReduceTrigger_1458 (below) is a field that does not actually exist on the Exchange Record
                // Its purpose in this script is to allow a Map/Reduce script to trigger the validation logic below.
                // Because the code below is using toolslib.didValuesChange the validation logic will not normally fire
                // when the record is saved unless the field has actually been changed.
                // The Map/Reduce will do a record Load, setvalue("custrecord_map_reduce_trigger_1458",true), and save
                // The record.save will trigger this user event to fire.
                // When that happens the record object passed to this script will contain field mapReduceTrigger_1458
                // That field will of course not be saved to the record because it is not defined there 
                // Using mapReduceTrigger will allow us to run a one time process and force the validation to execute
                // on existing records that already have a value in the fields below. 
                // In the future if a mass update is applied to the FedACH Routing or Fed Wire Routing tables 
                // the Map/Reduce could be run again force a new update of the fields below
                //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                var mapReduceTrigger_1458 = rec.getValue({ fieldId:"custrecord_map_reduce_trigger_1458" });
//                log.debug("Alex" ,"mapReduceTrigger:" + mapReduceTrigger_1458 );
//                if (mapReduceTrigger_1458) { log.debug("" ,"mapReduceTrigger_1458 is something"  ); }
                
				var paymentMethod = toolslib.getFieldValue(context, FIELDS.PAYMENT_METHOD);
                var wireNumber    = toolslib.getFieldValue(context, FIELDS.WIRE_NUMBER);
                var achNumber     = toolslib.getFieldValue(context, FIELDS.ACH_NUMBER);
                var intmedNumber  = toolslib.getFieldValue(context, FIELDS.INTMED_ABA_NUMBER);
                var intmedSwift   = toolslib.getFieldValue(context, FIELDS.INTMED_SWIFT_BIC);
                var validatedData;
                var validObj;

                fromWireNumber:
                if ( toolslib.didValuesChange(context, [FIELDS.WIRE_NUMBER]) || mapReduceTrigger_1458 ) {
					var paymentMethod_domWire           = 4;
					var paymentMethod_domWire_brokerage = 14;
					var paymentMethod_domWire_bank      = 15;
					var paymentMethod_intWire           = 5;
					var paymentMethod_intWire_brokerage = 12;
					var paymentMethod_intWire_bank      = 13;
					
					if ( !wireNumber ) { wireNumber = ""; };
					if ( !(wireNumber.trim() > "") ) {
						rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value: null    });
						rec.setValue({ fieldId:FIELDS.WIRE_BANK                  ,value: ''	     });
						rec.setValue({ fieldId:FIELDS.WIRE_STATUS                ,value: ''      });
						rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS          ,value: ''      });
						break fromWireNumber;
					}
					
					if (   paymentMethod == paymentMethod_domWire 
						|| paymentMethod == paymentMethod_domWire_brokerage
						|| paymentMethod == paymentMethod_domWire_bank) { // Domestic Wire - edit for valid ABA Number
						
						var paymentMethod_Wire = 4;
						var validObj = pymtInstr.validateABARouting(wireNumber ,FIELDS.WIRE_NUMBER ,paymentMethod_Wire);
						
						if (validObj && validObj.objLookup && validObj.objLookup.bankName) {
							rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value:validObj.objLookup.internalId });
						}
						else {
							var msg = messages.msg_RoutingNumberInvalid_Wire;
							rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value: null   });
						}
						
						rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS              ,value: ''     });
					}
					else 
					if (   paymentMethod == paymentMethod_intWire 
						|| paymentMethod == paymentMethod_intWire_brokerage
						|| paymentMethod == paymentMethod_intWire_bank      ) { // International Wire - edit for valid swift/bic number
						var validObj = pymtInstr.validateSwiftBIC(wireNumber ,null ,null ,null ,false);
						rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value: null   });
						
						if ( validObj && validObj.result === "pass" ) { 
							rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS      ,value: ''     });
						}
						else {
							rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS      ,value: messages.msg_RoutingNumberInvalid_Swift + ", " + validObj.validationIssue });
						}
						
					}
                	
                } // if ( toolslib.didValuesChange(context, [FIELDS.WIRE_NUMBER]) )

                if (  toolslib.didValuesChange(context, [FIELDS.ACH_NUMBER]) || mapReduceTrigger_1458 ) {
                	if ( !achNumber ) { achNumber = ""; };
					if ( achNumber.trim() > "" ) {  

						var paymentMethod_ACH = 1;
						var validObj = pymtInstr.validateABARouting(achNumber ,FIELDS.ACH_NUMBER ,paymentMethod_ACH);
						
						if (validObj && validObj.objLookup && validObj.objLookup.bankName) {
							rec.setValue({ fieldId:FIELDS.ABA_ROUTING_VERIFICATION  ,value:validObj.objLookup.internalId });
						}
						else {
							var msg = messages.msg_RoutingNumberInvalid_Wire;
							rec.setValue({ fieldId:FIELDS.ABA_ROUTING_VERIFICATION  ,value: null   });
						}
						
					} 
					else {
						rec.setValue({ fieldId:FIELDS.ABA_ROUTING_VERIFICATION  ,value: null    });
					}

                } // if (  toolslib.didValuesChange(context, [FIELDS.ACH_NUMBER])  )
                
                

                if (  toolslib.didValuesChange(context, [FIELDS.INTMED_ABA_NUMBER]) || mapReduceTrigger_1458 ) {

                	if ( !intmedNumber ) { intmedNumber = ""; };
                	if ( intmedNumber.trim() > "" ) { 
                		
                		var paymentMethod_Wire = 4;
    					var validObj = pymtInstr.validateABARouting(intmedNumber ,FIELDS.INTMED_ABA_NUMBER ,paymentMethod_Wire);
    					
    					if (validObj && validObj.objLookup && validObj.objLookup.bankName) {
    						rec.setValue({ fieldId:FIELDS.INTMED_ABA_VERIFICATION  ,value:validObj.objLookup.internalId });
    					}
    					else {
    						var msg = messages.msg_RoutingNumberInvalid_Intmed;
    						rec.setValue({ fieldId:FIELDS.INTMED_ABA_VERIFICATION  ,value: null    });
    					}
                		
                	} 
                	else { rec.setValue({ fieldId:FIELDS.INTMED_ABA_VERIFICATION  ,value: null });                	}

                } // if (  toolslib.didValuesChange(context, [FIELDS.INTMED_ABA_NUMBER])  )

                

                if (  toolslib.didValuesChange(context, [FIELDS.INTMED_SWIFT_BIC]) || mapReduceTrigger_1458 ) {
                	
                	if ( !intmedSwift ) { intmedSwift = ""; };
                	if ( intmedSwift.trim() > "" ) {
    					
    					var validObj    = pymtInstr.validateSwiftBIC(intmedSwift ,null ,null ,null ,false);
                		
    					if ( validObj && validObj.result === "pass" ) { 
    						rec.setValue({ fieldId:FIELDS.INTMED_SWIFT_BIC_STATUS    ,value: ''     });
    					}
    					else {
    						rec.setValue({ fieldId:FIELDS.INTMED_SWIFT_BIC_STATUS    ,value: messages.msg_SwiftInvalid_Intmed + ", " + validObj.validationIssue });
    					}
                	
                	} 
                	else { rec.setValue({ fieldId:FIELDS.INTMED_SWIFT_BIC_STATUS    ,value: ''     }); }					

                } // if (  toolslib.didValuesChange(context, [FIELDS.INTMED_SWIFT_BIC])  )

            }
            // ATP-1458 ================================================================================================
            
            // ATP-1246 ================================================================================================
            if (runtime.executionContext === runtime.ContextType.CSV_IMPORT) {

                var matchingCurrency = '';
                var isLocked = false;

                getFieldValues(context, 'beforeSubmit');


                // ATP-1543
                if (context.type === 'create' || context.type === 'edit') {
					
    				var REC = context.newRecord; 

    				const WAIVE_FEES_ALL_PAYMENTS = "2";

    				var pmtWaiveFees, payoutWaiveFees;
                	
    				if (!priLibrary.fieldChanged(context, "custrecord_exrec_waive_fees") && (priLibrary.fieldChanged(context, "custrecord_acq_lot_priority_payment") || priLibrary.fieldChanged(context, "custrecord_acq_lot_payout_type"))) {
        				if (REC.getValue("custrecord_acq_lot_priority_payment")) 
        					pmtWaiveFees = search.lookupFields({type: "customrecord_acq_lot_priority_payment", id: REC.getValue("custrecord_acq_lot_priority_payment"), columns: ["custrecord_acq_lot_pri_pmt_waive_fees"]}).custrecord_acq_lot_pri_pmt_waive_fees;
        						
        				if (REC.getValue("custrecord_acq_lot_payout_type")) 
        					payoutWaiveFees = search.lookupFields({type: "customrecord_payment_type", id: REC.getValue("custrecord_acq_lot_payout_type"), columns: ["custrecord_payout_waive_fees"]}).custrecord_payout_waive_fees;    					

        				// if either field has WAVE FEES, and that field is not already correct, then set it
        				if ((pmtWaiveFees || payoutWaiveFees) && REC.getValue("custrecord_exrec_waive_fees") != WAIVE_FEES_ALL_PAYMENTS) {
        					REC.setValue("custrecord_exrec_waive_fees", WAIVE_FEES_ALL_PAYMENTS);
        					log.debug("beforeSubmit","Setting Waive Fees");
        				} 

        				// if we have both fields, and neither has WAIVE FEES set, and it is currently set, then clear it
        				if (REC.getValue("custrecord_acq_lot_priority_payment") && REC.getValue("custrecord_acq_lot_payout_type") && !pmtWaiveFees && !payoutWaiveFees && REC.getValue("custrecord_exrec_waive_fees")) {
        					log.debug("beforeSubmit","Setting Waive Fees");
        					REC.setValue("custrecord_exrec_waive_fees", "");					
        				} 
    				}
    				
                }
                                
                if (context.type === 'create') {

                    if (Boolean(FX_FIELDS.CURRENCY.VALUE) && Boolean(FX_FIELDS.CONTRACT.VALUE)) {

                        isLocked = determineLockedContract(FX_FIELDS.CONTRACT.VALUE);

                        matchingCurrency = true;
                        if (FX_FIELDS.CONTRACT.VALUE && FX_FIELDS.CURRENCY.VALUE) {
                            matchingCurrency = hasMatchingCurrency(FX_FIELDS.CONTRACT.VALUE, FX_FIELDS.CURRENCY.VALUE);
                        }
                        
                        if (isLocked) {
                            throw 'You cannot upload this Exchange Record. The FX Currency Contract is locked'
                        }

                        if (!matchingCurrency) {

                            throw 'You cannot upload this Exchange Record. The FX Currency you uploaded does not match the FX Currency Contract Converted Currency value. '
                        }
                    }

                    if (!Boolean(FX_FIELDS.CURRENCY.VALUE) && Boolean(FX_FIELDS.CONTRACT.VALUE)) {

                        var fxCurrencyLookUp = search.lookupFields({
                            type: 'customrecord_fx_conv_contract',
                            id: FX_FIELDS.CONTRACT.VALUE,
                            columns: ['custrecord_fx_conv_converted_currency']
                        });

                        var fxCurrency = fxCurrencyLookUp['custrecord_fx_conv_converted_currency'][0].value;

                        rec.setValue({
                            fieldId: FX_FIELDS.CURRENCY.ID,
                            value: fxCurrency
                        });
                    }
                }

                if (context.type === 'edit') {

                    if (OLD_FX_FIELDS.CONTRACT.VALUE !== FX_FIELDS.CONTRACT.VALUE) {

                        var isNewLocked = false;
                        var isOldLocked = false;

                        if (Boolean(FX_FIELDS.CONTRACT.VALUE)) {

                            isNewLocked = determineLockedContract(FX_FIELDS.CONTRACT.VALUE);
                        }

                        if (Boolean(OLD_FX_FIELDS.CONTRACT.VALUE)) {

                            isOldLocked = determineLockedContract(OLD_FX_FIELDS.CONTRACT.VALUE);
                        }

                        if (isOldLocked) {

                            throw 'You cannot update this Exchange Record. The FX Currency Contract already on this Exchange Record is locked'
                        }

                        if (isNewLocked) {

                            throw 'You cannot update this Exchange Record. The FX Currency Contract you are trying to add is locked'
                        }
                        matchingCurrency = true;
                        if (FX_FIELDS.CONTRACT.VALUE && FX_FIELDS.CURRENCY.VALUE) { 
                            matchingCurrency = hasMatchingCurrency(FX_FIELDS.CONTRACT.VALUE, FX_FIELDS.CURRENCY.VALUE);
                        }

                        if (!matchingCurrency) {
                            throw 'The new FX Currency Contract you uploaded does not have the same Converted Currency ' +
                                'as the FX Currency on this Exchange Record. The record was not updated.'
                        }
                    }

                    if (OLD_FX_FIELDS.CURRENCY.VALUE !== FX_FIELDS.CURRENCY.VALUE) {

                        if (Boolean(FX_FIELDS.CURRENCY.VALUE)) {

                            if (Boolean(FX_FIELDS.CONTRACT.VALUE)) {

                                isLocked = determineLockedContract(FX_FIELDS.CONTRACT.VALUE);
                            }

                            if (isLocked) {
                                throw 'You cannot update this Exchange Record. The FX Currency Contract is locked'
                            }

                            matchingCurrency = true;
                            if (FX_FIELDS.CONTRACT.VALUE && FX_FIELDS.CURRENCY.VALUE) {
                                matchingCurrency = hasMatchingCurrency(FX_FIELDS.CONTRACT.VALUE, FX_FIELDS.CURRENCY.VALUE);
                            }

                            if (!matchingCurrency) {
                                throw 'The new FX Currency you uploaded does not have the same Converted Currency ' +
                                    'as the FX Currency Contract on this Exchange Record. The record was not updated.'
                            }
                        }
                    }
                }

            }
            // END ATP-1246 ============================================================================================
            // ATP-1300 ================================================================================================
        
            if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) {

                checkboxFields = ['custrecord_exrec_giin_validated'];
                tsFields = ['custrecord_exrec_giin_validated_ts'];
                userFields = ['custrecord_exrec_giin_validated_by'];
                setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields);

            } else { 
                var giin_validated = context.newRecord.getValue({
                fieldId: 'custrecord_exrec_giin_validated'
                });
                var giin_timestamp = context.newRecord.getValue({
                    fieldId: 'custrecord_exrec_giin_validated_ts'
                });
                var giin_validated_by = context.newRecord.getValue({
                    fieldId: 'custrecord_exrec_giin_validated_by'
                });
                if (Boolean(giin_validated) && ( !Boolean(giin_timestamp) || !Boolean(giin_validated_by) )       ) { 
                    throw('GIIN VALIDATED WAS CHECKED IN THE UI WITHOUT TIMESTAMP OR USER VALIDATION')
                }
            }
            
            // ATP-1999
            if (context.type == "edit" || context.type == "xedit") {
            	var inactive = toolslib.getFieldValue(context ,"inactive" );
            	if (!inactive) {
            		var presentationApprovedDatetime  = toolslib.getFieldValue(context ,"custrecord_present_approved_time" );
            		var lotDeliveryInstructions       = toolslib.getFieldValue(context ,"custrecord_acq_loth_zzz_zzz_lotdelivery" );
    				var lotdelivery_Offline           = "16";
    				var lotdelivery_LetterWithWebLink = "12";
    				var lotdelivery_Web               = "5";
            		
    				switch (lotDeliveryInstructions) {
    				case lotdelivery_Web:
    				case lotdelivery_Offline:
    				case lotdelivery_LetterWithWebLink:
    					if (priLibrary.fieldChanged(context, "custrecord_acq_loth_zzz_zzz_acqstatus")) {
    						var acquiomStatus_5b_UponApprvReadyForPay = "7";
    						var acquiomStatus_5_ApprvForPay           = "5";
    						var acquiomStatus_5e_QueuedForPayProcess  = "15";
    						var acquiomStatus_5f_PayProcess           = "16";
    	            		var acquiomStatus                         = toolslib.getFieldValue(context ,"custrecord_acq_loth_zzz_zzz_acqstatus" );
    	            		var acquiomStatusOld                      = context.oldRecord.getValue({ fieldId:"custrecord_acq_loth_zzz_zzz_acqstatus" });
        					if (presentationApprovedDatetime) {
        						if (acquiomStatusOld == acquiomStatus_5b_UponApprvReadyForPay) {
            						switch (acquiomStatus) {
            						case acquiomStatus_5_ApprvForPay:
            						case acquiomStatus_5e_QueuedForPayProcess:
            						case acquiomStatus_5f_PayProcess:
            							break;
            						default:
            							rec.setValue("custrecord_present_approved_time", null); 
            						}
        						}
        					}
        					else {
        						if (acquiomStatus == acquiomStatus_5b_UponApprvReadyForPay) {
        							var currentDateTime = getCurrentDateTime();
        							rec.setValue("custrecord_present_approved_time", currentDateTime); 
        						}
        					}
    					}
    					break;
    				}
            	}
            }
            // end ATP-1999

            return;
        } // beforeSubmit(context)

        // helper functions ATP-1300 ===============================================================================
        /**
        * This function can timestamp datetime and current user based on the checkbox value
        * @param {object} context 
        * @param {boolean} checkboxFields 
        * @param {string} tsFields :
        * @param {string} userFields :
        */
        function setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields) {
            for (var i = 0; i < checkboxFields.length; i++) {
            	if (toolslib.didValuesChange(context, [ checkboxFields[i] ])) {
                    var fieldValue = context.newRecord.getValue({ fieldId: checkboxFields[i] });

                    if (fieldValue) {
                        currentDateTime = getCurrentDateTime();
                        currentUser = runtime.getCurrentUser().id;
                    } else {
                        currentDateTime = '';
                        currentUser = '';
                    }
                    context.newRecord.setValue({ fieldId: tsFields[i]   ,value: currentDateTime  ,ignoreFieldChange: true                });
                    context.newRecord.setValue({ fieldId: userFields[i] ,value: currentUser      ,ignoreFieldChange: true                });
            	}
            }
        }
        /**
        * This function uses N/format module
        * @return {string}
        */
        function getCurrentDateTime() {
            // grabs the current Javascript Date/Time and parses it into a format NetSuite accepts
            var now = new Date();
            return format.parse({
                value: now,
                type: format.Type.DATETIMETZ
            });
        }

        // ATP-1162 ================================================================================================
        /**
         * Validates a Routing Number to ensure it is the correct length and does not have any letters.
         *
         * @param {string} routingNumber - Routing number provided on the Exchange Record
         * @returns {boolean}
         */
        function validateRoutingNumber(routingNumber) {

            var validFormat = /^[0-9]{9}$/;

            return validFormat.test(routingNumber);
        }

        /**
         * Searches for a Fed ACH or Fed Wire Routing Code record based on a Routing Number.
         *
         * @param {Object} data
         * @param {string} data.routingNumber - Routing number provided on the Exchange Record
         * @param {string} data.type - Type of Routing Code record to search for - either ACH or Wire
         * @returns {Object} returnObject - Object containing data from the search results, if there was any
         */
        function findMatchingFedCode(data) {

            var achFields = {
                achRoutingCode: 'custrecord162',
                achRecordTypeCode: 'custrecord165',
                achBankName: 'custrecord168'
            };

            var wireFields = {
                wireRoutingNumber: 'custrecord153',
                wireTransferStatus: 'custrecord158',
                wireBankName: 'custrecord155'
            };

            var returnObject = {};
            returnObject.hasMatchingRoutingCode = false;

            var searchRecordType = data.type === 'ACH' ? 'customrecord416' : 'customrecord415';

            var columns = [];
            var filters = [];

            if (data.type === 'ACH') {

                for (var key in achFields) {

                    columns.push(search.createColumn({
                        name: achFields[key]
                    }));
                }

                filters.push(search.createFilter({
                    name: achFields.achRoutingCode,
                    operator: search.Operator.IS,
                    values: data.routingNumber
                }));


            } else {

                for (var key in wireFields) {

                    columns.push(search.createColumn({
                        name: wireFields[key]
                    }));
                }

                filters.push(search.createFilter({
                    name: wireFields.wireRoutingNumber,
                    operator: search.Operator.IS,
                    values: data.routingNumber
                }));
            }

            var fedRecordSearch = search.create({
                type: searchRecordType,
                columns: columns,
                filters: filters
            });

            var hasResults = fedRecordSearch.runPaged().count > 0;

            if (hasResults) {

                fedRecordSearch.run().each(function (result) {

                    returnObject.hasMatchingRoutingCode = true;

                    if (data.type === 'ACH') {

                        for (var key in achFields) {

                            returnObject[key] = result.getValue({
                                name: achFields[key]
                            });
                        }
                    } else {

                        for (var key in wireFields) {

                            returnObject[key] = result.getValue({
                                name: wireFields[key]
                            });
                        }
                    }
                });
            }

            return returnObject;
        }
        // END ATP-1162 ============================================================================================

        function renderRSMStatus(context) {
            var name = "";
            var name_internalid = "";
            var value = "";
            var foundPassed = false;
            var noFailures = true;


            var deficiences = context.newRecord.getValue("custrecord_acq_lot_deficiencies");
            log.audit("deficiences ", deficiences);

            if (deficiences.length === 0) {

                context.form.addPageInitMessage({
                    type: "RSM Status",
                    title: "There are NO deficiences found on this ER.",
                    message: '<h1 style="font-size:18px;!important">RSM PASSED</h1>'
                });
            } else {
                log.audit("rsm failures found");
            }


        }

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function updateStateCodeField(context, sourceField, fieldStateCode) {
            var scriptFunctionName = "updateStateCodeField";
            var sourceFieldValue;

            //log.debug(scriptFunctionName ,sourceField + "  new: " + context.newRecord.getValue(sourceField));

            var updateFields = false;
            if (context.type == context.UserEventType.CREATE) {
                if (context.newRecord.getValue(sourceField) > "") {
                    updateFields = true;
                    sourceFieldValue = context.newRecord.getValue(sourceField);
                }
            } else
            if (context.type == context.UserEventType.EDIT) {
                if (context.newRecord.getValue(sourceField) > "") {
                    updateFields = true;
                    sourceFieldValue = context.newRecord.getValue(sourceField);
                } else {
                    context.newRecord.setValue(fieldStateCode, null);
                    return;
                }
            } else
            if (context.type == context.UserEventType.XEDIT) {
                fieldList = context.newRecord.getFields();
                if (fieldList.indexOf(sourceField) >= 0) {
                    if (context.newRecord.getValue(sourceField) > "") {
                        updateFields = true;
                        sourceFieldValue = context.newRecord.getValue(sourceField);
                    } else {
                        context.newRecord.setValue(fieldStateCode, null);
                        return;
                    }
                } else {
                    if (context.oldRecord.getValue(sourceField) > "") {
                        updateFields = true;
                        sourceFieldValue = context.oldRecord.getValue(sourceField);
                    } else {
                        context.newRecord.setValue(fieldStateCode, null);
                        return;
                    }
                }
            }

            if (!updateFields) {
                return;
            }

            var objStateFields = search.lookupFields({
                type: 'customrecord_states',
                id: sourceFieldValue,
                columns: ["custrecord_state_abbreviation"]
            });


            //log.debug("sourceFieldValue: " ,sourceFieldValue );
            //log.debug("obj",JSON.stringify(objStateFields));
            if (objStateFields.custrecord_state_abbreviation > "") {
                context.newRecord.setValue(fieldStateCode, objStateFields.custrecord_state_abbreviation);
            } else {
                context.newRecord.setValue(fieldStateCode, null);
            }

        }


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function updateISOCountryFields(context, sourceField, fieldCountryCodeIso2, fieldCountryCodeIso3, fieldCountryName) {
            var scriptFunctionName = "updateISOCountryFields";
            var sourceFieldValue;

            //log.debug(scriptFunctionName ,sourceField + "  new: " + context.newRecord.getValue(sourceField));

            var updateFields = false;
            if (context.type == context.UserEventType.CREATE) {
                if (context.newRecord.getValue(sourceField) > "") {
                    updateFields = true;
                    sourceFieldValue = context.newRecord.getValue(sourceField);
                }
            } else
            if (context.type == context.UserEventType.EDIT) {
                if (context.newRecord.getValue(sourceField) > "") {
                    updateFields = true;
                    sourceFieldValue = context.newRecord.getValue(sourceField);
                } else {
                    context.newRecord.setValue(fieldCountryCodeIso2, null);
                    context.newRecord.setValue(fieldCountryCodeIso3, null);
                    context.newRecord.setValue(fieldCountryName, null);
                    return;
                }
            } else
            if (context.type == context.UserEventType.XEDIT) {
                fieldList = context.newRecord.getFields();
                if (fieldList.indexOf(sourceField) >= 0) {
                    if (context.newRecord.getValue(sourceField) > "") {
                        updateFields = true;
                        sourceFieldValue = context.newRecord.getValue(sourceField);
                    } else {
                        context.newRecord.setValue(fieldCountryCodeIso2, null);
                        context.newRecord.setValue(fieldCountryCodeIso3, null);
                        context.newRecord.setValue(fieldCountryName, null);
                        return;
                    }
                } else {
                    if (context.oldRecord.getValue(sourceField) > "") {
                        updateFields = true;
                        sourceFieldValue = context.oldRecord.getValue(sourceField);
                    } else {
                        context.newRecord.setValue(fieldCountryCodeIso2, null);
                        context.newRecord.setValue(fieldCountryCodeIso3, null);
                        context.newRecord.setValue(fieldCountryName, null);
                        return;
                    }
                }
            }

            if (!updateFields) {
                return;
            }

            var objCountryFields = search.lookupFields({
                type: 'customrecord_country_list',
                id: sourceFieldValue,
                columns: ["custrecord_cntry_iso2_country_code" ,"custrecord_iso_country_code" ,"custrecord_cntry_citizen_cntry_nm"]
            });


            log.debug("sourceFieldValue: ", sourceFieldValue);
            log.debug("obj", JSON.stringify(objCountryFields));
            if (objCountryFields.custrecord_cntry_iso2_country_code > "") {
                context.newRecord.setValue(fieldCountryCodeIso2, objCountryFields.custrecord_cntry_iso2_country_code);
            } else {
                context.newRecord.setValue(fieldCountryCodeIso2, null);
            }
            if (objCountryFields.custrecord_iso_country_code > "") {
                context.newRecord.setValue(fieldCountryCodeIso3, objCountryFields.custrecord_iso_country_code);
            } else {
                context.newRecord.setValue(fieldCountryCodeIso3, null);
            }
            if (objCountryFields.custrecord_cntry_citizen_cntry_nm > "") {
                context.newRecord.setValue(fieldCountryName, objCountryFields.custrecord_cntry_citizen_cntry_nm);
            } else {
                context.newRecord.setValue(fieldCountryName, null)
            }

        }



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function afterSubmit(context) {
            var scriptFunctionName = "afterSubmit";
            scriptFullName = scriptFileName + "--->" + scriptFunctionName;

            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT) {
                tinCheckSubmitProcessing(context);
            }
            //ATP-1598
            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT)
            {
            	if (
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_2_de1_irsname") ||
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_5a_de1_nameonbnkacct") || 
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_5b_de1_nameonbnkacct") ||
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_5c_de1_checkspayto") ||
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_4_de1_lotpaymethod") ||
            			priLibrary.fieldChanged(context, "custrecord_exrec_payment_instruction") ||
            			priLibrary.fieldChanged(context, "custrecord_exrec_paymt_instr_sub") ||
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_1_src_shrhldname") ||
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_5b_de1_frthrcrdtacct") ||
            			priLibrary.fieldChanged(context, "custrecord_acq_loth_5b_de1_frthrcrdtname")
            	)
            	{
            		rsmEngine.clearRuleInstanceOverride(context.newRecord, "ER130");
            	}
            }

            // ATO-233 
            if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
                if (context.type == context.UserEventType.EDIT) {
                    if (context.newRecord.getValue("custrecord_suspense_reason") != context.oldRecord.getValue("custrecord_suspense_reason")) {
                        var notesToBeAdded = context.newRecord.getValue("custpage_notes_to_be_added");
                        if (notesToBeAdded > "") {
                            var objNotesToBeAdded = JSON.parse(notesToBeAdded);
                            addUserNotes(context, objNotesToBeAdded);
                        }
                    }
                }
            }
            // end ATO-233 

            return;


        } // afterSubmit(context)


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function addUserNotes(context, objNotesToBeAdded) {
            var scriptFunctionName = "addUserNotes";
            scriptFullName = scriptFileName + "--->" + scriptFunctionName;

            var action;

            for (var i = 0; i < objNotesToBeAdded.length; i++) {
                var objNote = objNotesToBeAdded[i];
                if (objNote["action"] == "adding") {
                    action = "Added";
                } else {
                    action = "Removed";
                }
                var noteTitle = "Suspense Reason '" + objNote["text"] + "' " + action;
                toolslib.addUserNote(context.newRecord.id, context.newRecord.type, noteTitle, objNote["userReason"], 7, scriptFullName)
            }

        }


        var LOT_DELIVERY_METHOD_web = 5;
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function tinCheckSubmitProcessing(context) {
            var thisScriptFullName = scriptFullName + "--->" + "tinCheckSubmitProcessing";

            // ATP-99
            if (context.type == context.UserEventType.CREATE && context.newRecord.getValue("custrecord_alpha_er_record").toString() > "") {
                return;
            }
            // END ATP-99

            var submitTinCheck = false;
            var str1 = JSON.stringify(context);
//            log.debug(scriptFullName, "user: " + runtime.getCurrentUser().name + ", context: " + str1);
            if (fieldHasChanged(context, "custrecord_acq_loth_2_de1_ssnein")) {
                submitTinCheck = true;
            }
//            log.debug(scriptFullName, "aft custrecord_acq_loth_2_de1_ssnein, submitTinCheck?: " + submitTinCheck);
            if (fieldHasChanged(context, "custrecord_acq_loth_2_de1_irsname")) {
                submitTinCheck = true;
            }
//            log.debug(scriptFullName, "aft custrecord_acq_loth_2_de1_irsname, submitTinCheck?: " + submitTinCheck);
            if (fieldHasChanged(context, "custrecord_exrec_giin")) {
                submitTinCheck = true;
            }
//            log.debug(scriptFullName, "aft custrecord_exrec_giin, submitTinCheck?: " + submitTinCheck);
            if (context.newRecord.getValue("custrecord_acq_loth_zzz_zzz_lotdelivery") == LOT_DELIVERY_METHOD_web) {
                if (context.newRecord.getValue("custrecord_ch_completed_datetime").toString() != "Invalid Date") {
                    if (fieldHasChanged(context, "custrecord_ch_completed_datetime")) {
                        if (!(context.oldRecord.getValue("custrecord_ch_completed_datetime") > "")) {
                            submitTinCheck = true;
                        }
                    }
                }
            } // if ( context.newRecord.getValue("custrecord_acq_loth_zzz_zzz_lotdelivery") == LOT_DELIVERY_METHOD_web)

//            log.debug(scriptFullName, "aft custrecord_acq_loth_zzz_zzz_lotdelivery, submitTinCheck?: " + submitTinCheck);
            if (context.newRecord.getValue("custrecord_acq_loth_zzz_zzz_de_status") != null) {
                if (context.newRecord.getValue("custrecord_acq_loth_zzz_zzz_rcvdtimestmp").toString() != "Invalid Date") {
                    if (fieldHasChanged(context, "custrecord_acq_loth_zzz_zzz_rcvdtimestmp")) {
                        if (!(context.oldRecord.getValue("custrecord_acq_loth_zzz_zzz_rcvdtimestmp") > "")) {
                            submitTinCheck = true;
                        }
                    }
                }
            } // if ( context.newRecord.getValue("custrecord_acq_loth_zzz_zzz_de_status") != null)
//            log.debug(scriptFullName, "aft custrecord_acq_loth_zzz_zzz_de_status, submitTinCheck?: " + submitTinCheck);

            // So, we only want to create a TIN Check record if SSN and IRSName both have data or GIIN by itself has data
            if (!((context.newRecord.getValue("custrecord_acq_loth_2_de1_ssnein") > "" &&
                        context.newRecord.getValue("custrecord_acq_loth_2_de1_irsname") > "") ||
                    (context.newRecord.getValue("custrecord_exrec_giin") > ""))) {
                submitTinCheck = false;
            }

            var isTaxIdMethodBlank = toolslib.getFieldValue(context, "custrecordacq_loth_2_de1_taxidmethod");
//            log.debug("before the 980 function call:", submitTinCheck + " boolean = " + Boolean(isTaxIdMethodBlank));
            //call for ATP-980
            if (Boolean(isTaxIdMethodBlank)) {
                log.debug(" boolean inside the if = ", Boolean(isTaxIdMethodBlank));
                submitTinCheck = validateTinCheckTriggers(context, submitTinCheck);
            }
            //end call ATP-980

            //call for ATP-989
//            log.debug(scriptFullName, "submitTinCheckBeforeCheckDUPES: " + submitTinCheck);
//            log.debug(scriptFullName, "Boolean submitTinCheckBeforeCheckDUPES: " + (submitTinCheck && Boolean(isTaxIdMethodBlank)));

            if (submitTinCheck && Boolean(isTaxIdMethodBlank)) {
                submitTinCheck = checkForDupes(context);
            } else {
                submitTinCheck = false;
            }
//            log.debug(scriptFullName, "submitTinCheckAfterCheckDUPES: " + submitTinCheck);
            //end call ATP-989

//            log.debug(scriptFullName, "tinCheckSubmitProcessing, submitTinCheck?: " + submitTinCheck);
            var dontSubmit = false;
            if (submitTinCheck && (!dontSubmit)) {
                var objTinCheckRequest = tinCheck.buildRequestFromExchangeRecord(context);
                //var objTinCheckRequest = tinCheck.buildRequestFromExchangeRecord(context.newRecord);
//                log.debug(scriptFullName, "getvalue: " + objTinCheckRequest.getValue("ssnEin"));

                if (objTinCheckRequest) {
//                    log.debug(scriptFullName, "Submitting TinCheck ");
                    var objReturn = tinCheck.submitTINCheckRequest(objTinCheckRequest);
//                    log.debug(scriptFullName, "submitTINCheckRequest returned object: " + JSON.stringify(objReturn));

                    var resetFields = JSON.parse(appSettings.readAppSetting("TIN Check", "TINCHK Reset Fields Exchange Record"));

                    if (objReturn.result == "success") {
                        objValues = {
                            "rcdId": objReturn.internalId
                        };

                        // Here we need to clear the TIN Check fields on the Exchange Record
                        for (ix = 0; ix < resetFields.length; ix++) {
                            var objField = resetFields[ix];
                            objValues[objField.fieldName] = objField.value;
                        }
//                        log.debug(scriptFullName, "objValues: " + JSON.stringify(objValues));

                        record.submitFields({
                            type: 'customrecord_acq_lot',
                            id: context.newRecord.id,
                            values: objValues
                        });

                        //Submit scheduled script to run
                        var scriptTask = task.create({
                            'taskType': task.TaskType.SCHEDULED_SCRIPT
                        });
                        scriptTask.scriptId = "customscript_tinchk_q_servicer";
                        try {
                            var scriptTaskId = scriptTask.submit();
                        } catch (e) {
                            log.audit(scriptFullName, "TIN Check Queue Servicer submit failed ");
                        }
                    }


                } else {
                    log.error(thisScriptFullName, "tinCheck.buildRequestFromExchangeRecord failed to return a Tin Check request object");
                }

            }

        }
        //ATP-980
        function validateTinCheckTriggers(context, submitTinCheck) {

            var submitTinCheck = false;
//            log.debug(scriptFullName, "beforeEntering ATP-980, submitTinCheck?: " + submitTinCheck);
            var taxIDmethodOld = context.oldRecord.getValue("custrecordacq_loth_2_de1_taxidmethod");
//            log.debug(scriptFullName, "VALUE for taxpayerID OLDrecord: " + taxIDmethodOld);
            var taxIDmethodNew = context.newRecord.getValue("custrecordacq_loth_2_de1_taxidmethod");
//            log.debug(scriptFullName, "VALUE for taxpayerID NEWrecord: " + taxIDmethodNew);
            var taxIDmethodValue = toolslib.getFieldValue(context, "custrecordacq_loth_2_de1_taxidmethod");

            var taxpayerIDmethod = [];
            var customrecord_acq_taxidmethodSearchObj = search.create({
                type: "customrecord_acq_taxidmethod",
                filters: [],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "custrecord_irs_form",
                        label: "IRS Form"
                    })
                ]
            });
            var searchResultCount = customrecord_acq_taxidmethodSearchObj.runPaged().count;
//            log.debug("customrecord_acq_taxidmethodSearchObj result count", searchResultCount);
            customrecord_acq_taxidmethodSearchObj.run().each(function (result) {
                taxpayerIDmethod.push(
                    [result.getValue({
                            name: 'internalid'
                        }),
                        result.getText({
                            name: 'custrecord_irs_form'
                        })
                    ])
                return true;
            });
//            log.debug("taxpayerIDarray: ", taxpayerIDmethod);
            //for tomorrow
            for (var i = 0; i < taxpayerIDmethod.length; i++) {
                if (taxpayerIDmethod[i][0] == taxIDmethodValue) {
                    taxIDmethodValue = taxpayerIDmethod[i][1];
                }
            }
//            log.debug("taxTEXT: ", taxIDmethodValue);

            var irsname = toolslib.getFieldValue(context, "custrecord_acq_loth_2_de1_irsname");
            var einssn = toolslib.getFieldValue(context, "custrecord_acq_loth_2_de1_ssnein");
            var giin = toolslib.getFieldValue(context, "custrecord_exrec_giin");

//            log.debug("IRSNAME: ", irsname);
//            log.debug("SSNEIN: ", einssn);
//            log.debug("GIIN: ", giin);
//            log.debug("taxpayer", taxIDmethodValue);
//            log.debug("Boolean check irs", (Boolean(irsname)));
//            log.debug("Boolean check ssn", (Boolean(einssn)));
//            log.debug("Boolean check giin", (Boolean(giin)));
//            log.debug("checking library IF", toolslib.didValuesChange(context, ["custrecordacq_loth_2_de1_taxidmethod"]));

            // changes to the fields but not to taxpayer and taxpayer is populated
            if (!toolslib.didValuesChange(context, ["custrecordacq_loth_2_de1_taxidmethod"])) {
//                log.debug("field changes", "taxidmethod is not blank and changes were made to the IRSname or GIIN or EINSSN")


//                log.debug("taxIDmethod before the if", taxIDmethodValue);
//                log.debug("give me the taxpayerIDmethod text", "taxpayerIDmethod[0]=" + taxpayerIDmethod[0] + " taxpayerIDmethod[1]=" + taxpayerIDmethod[1] + " JSON=" + JSON.stringify(taxpayerIDmethod));
                if (toolslib.didValuesChange(context, ["custrecord_acq_loth_2_de1_irsname"])) {
                    if (taxIDmethodValue == "W-8" || "W-9" || "W-4") {
                        if (Boolean(irsname) && Boolean(einssn)) {
                            submitTinCheck = true;
                        }
                    }
                    if (taxIDmethodValue == "W-8") {
                        if (Boolean(irsname) && Boolean(giin)) {
                            submitTinCheck = true;
                        }
                    }
                }
                if (toolslib.didValuesChange(context, ["custrecord_acq_loth_2_de1_ssnein"])) {
                    if (taxIDmethodValue == "W-8" || "W-9" || "W-4") {
                        if (Boolean(irsname) && Boolean(einssn)) {
                            submitTinCheck = true;
                        }
                    }
                }
                if (toolslib.didValuesChange(context, ["custrecord_exrec_giin"])) {
                    if (taxIDmethodValue == "W-8") {
                        if (Boolean(irsname) && Boolean(giin)) {
                            submitTinCheck = true;
                        }
                    }
                }

            } else {
//                log.debug("taxIDmethod before the else", taxIDmethodValue);
                if (taxIDmethodValue == "W-8") {
                    if ((Boolean(irsname) && Boolean(giin)) || (Boolean(irsname) && Boolean(einssn))) {
                        submitTinCheck = true;
                    }
                }
                if (taxIDmethodValue == "W-4" || "W-9") {
                    if (Boolean(irsname) && Boolean(einssn)) {
                        submitTinCheck = true;
                    }
                }
//                log.debug("changes to the taxpayer", "changes were made to the taxpayer method");

            }
//            log.debug(scriptFullName, "afterEntering ATP-980, submitTinCheck?: " + submitTinCheck);
            return submitTinCheck;

            //end ATP-980

        }

        //ATP-989
        function checkForDupes(context) {
//            log.debug('checkForDupes', 'enteredFunction');

            var submitTinCheck = false;
            // Prepare input fields for search
            // Use getFieldValue function is used to account for XEDIT
            var exrec_ssn_ein = toolslib.getFieldValue(context, 'custrecord_acq_loth_2_de1_ssnein');
            var exrec_irs_name = toolslib.getFieldValue(context, 'custrecord_acq_loth_2_de1_irsname').toString();
            var exrec_giin = toolslib.getFieldValue(context, 'custrecord_exrec_giin').toString();
            var exrec_internal_id = context.newRecord.getValue('id').toString();
//            log.debug('CheckForDupes', 'newRecord: ' + JSON.stringify(context.newRecord.getValue('id')));

            var inputargs = {
                exrec_ssn_ein: exrec_ssn_ein,
                exrec_irs_name: exrec_irs_name,
                exrec_giin: exrec_giin,
                exrec_internal_id: exrec_internal_id,
            }

            ///	Run search to check for dupes
            return searchForDupesResult = searchForDupes(inputargs);
            // Returns true of false to checkForDupes
        }

        function searchForDupes(inputargs) {
//            log.debug('searchForDupes', 'inputargs: ' + JSON.stringify(inputargs));
//            log.debug('searchForDupes', 'inputargs.exrec_internal_id: ' + inputargs.exrec_internal_id);
//            log.debug('searchForDupes', 'inputargs.exrec_ssn_ein: ' + inputargs.exrec_ssn_ein);
//            log.debug('searchForDupes', 'inputargs.exrec_irs_name: ' + inputargs.exrec_irs_name);
//            log.debug('searchForDupes', 'inputargs.exrec_giin: ' + inputargs.exrec_giin);

            var exrecid = inputargs.exrec_internal_id;
            if (inputargs.exrec_ssn_ein == "") {
                var s1 = ["custrecord_tinchk_ssnein", "isempty", ""]
            } else {
                var s1 = ["custrecord_tinchk_ssnein", "is", inputargs.exrec_ssn_ein];
            }

            if (inputargs.exrec_irs_name == "") {
                var s2 = ["custrecord_tinchk_irs_nm", "isempty", ""]
            } else {
                var s2 = ["custrecord_tinchk_irs_nm", "is", inputargs.exrec_irs_name];
            }

            if (inputargs.exrec_giin == "") {
                var s3 = ["custrecord_tinchk_giin", "isempty", ""]
            } else {
                var s3 = ["custrecord_tinchk_giin", "is", inputargs.exrec_giin];
            }

//            log.debug('searchForDupes', 's1 ' + s1);
//            log.debug('searchForDupes', 's2 ' + s2);
//            log.debug('searchForDupes', 's3 ' + s3);

            var customrecord_tin_checkSearchObj = search.create({
                type: "customrecord_tin_check",
                filters: [
                    ["custrecord_tinchk_src_sys", "is", "ExchangeRecord"],
                    "AND",
                    ["custrecord_tinchk_src_id", "is", exrecid],
                    "AND",
                    s1,
                    "AND",
                    s2,
                    "AND",
                    s3
                ],
                columns: [
                    search.createColumn({
                        name: "internalid"
                    })
                ]
            }).run();

            var searchResults = customrecord_tin_checkSearchObj.getRange(0, 1);
            //if 1 false, 0 true
            log.debug('dupe', 'searchResults:' + JSON.stringify(searchResults));
            log.debug('dupe', 'searchResultsLength:' + searchResults.length);
            if (searchResults.length > 0) {
                return false;
            } else {
                return true;
            }
        }

        // end ATP-989

        // ================================================================================================================================
        // ================================================================================================================================
		function getFieldValueAllContexts(context, field) {
			
			if (context.type != 'xedit') { return context.newRecord.getValue(field); }
			
			var newRecFields = context.newRecord.getFields();
			fieldPos = newRecFields.indexOf(field);
			if (fieldPos < 0) { return context.oldRecord.getValue(field); }
			else              { return context.newRecord.getValue(field); }
		}



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function fieldHasChanged(context, fieldName) {
            if (context.type == context.UserEventType.CREATE) {
                if (context.newRecord.getValue(fieldName) > "") {
                    return true;
                }
            } else {
                if (context.oldRecord.getValue(fieldName) != context.newRecord.getValue(fieldName)) {
                    return true;
                }
            }
            return false;
        }

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        //ATP-1367
        function disableExRecFields(context, df, payout_type) {
            if (Boolean(payout_type)) { 
                // this splice removes an element from the SRS constants object disableFields
                df.splice(df.indexOf("custrecord_acq_loth_5b_de1_addlinstrct"), 1);
            }
            for (var i = 0; i < df.length; i++) {

                var fieldObject = context.form.getField({
                    id: df[i]
                });
                fieldObject.updateDisplayType({
                    displayType: ui.FieldDisplayType.DISABLED
                });
            }
        }
        
        
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function fxReturnMessage(context) { // ATP-1978
        	
	    	if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) { return; }
        	if (!context.newRecord.getValue("custrecord_exrec_fx_conv_contract")) { return; }
        	
	    	var voidTrackingStatus_Completed = 3;
        	var filter0 = search.createFilter({ name:'isinactive'                        ,operator:"IS"     ,values:["F"]  });
        	var filter1 = search.createFilter({ name:'custrecord_vt_exchange_record'     ,operator:"ANYOF"  ,values:[context.newRecord.id]  });
        	var filter2 = search.createFilter({ name:'custrecord_vt_status'              ,operator:"ANYOF"  ,values:[voidTrackingStatus_Completed]    });
        	var arrFilters = [];
        	arrFilters.push(filter0);
        	arrFilters.push(filter1);
        	arrFilters.push(filter2);
    		
            var col_internalid   = search.createColumn({ name:"internalid" ,join:null });
            var col_exchange     = search.createColumn({ name:"custrecord_vt_fx_ret_exchange_rcd" ,join:null });
        	var arrColumns = [];
        	arrColumns.push(col_internalid);
        	arrColumns.push(col_exchange);
    		
    		var voidTrackSearchObj = search.create({ type:"customrecord_void_tracking"
    			                                 ,filters:arrFilters
    			                                 ,columns:arrColumns  });
    		
    		var voidTrackSearch        = voidTrackSearchObj.run();
    		var voidTrackSearchResults = voidTrackSearch.getRange(0,1000);
    		
    		if (voidTrackSearchResults.length > 0) { 
    			
			    var newExchange = voidTrackSearchResults[0].getValue(col_exchange);
            	if (!newExchange) { return; }

			    var voidTrack = voidTrackSearchResults[0].getValue(col_internalid);

		    	var anchorVoidTracking = '<a href="' + url.resolveRecord({ recordType:'customrecord_void_tracking' ,recordId:voidTrack   ,isEditMode:false }) + '" target="_blank">' + voidTrack   +'</a>';
		    	var anchorNewExchange  = '<a href="' + url.resolveRecord({ recordType:'customrecord_acq_lot'       ,recordId:newExchange ,isEditMode:false }) + '" target="_blank">' + newExchange +'</a>';
		    	
		    	var messageText = "This payment involves a Foreign Currency Conversion."
	                  + "<br/>" + "The payment has been returned and the money placed into a suspense account." 
		              + "<br/>" + "The Void Tracking record is " + anchorVoidTracking
				      + "<br/>" + "The new Exchange record is  " + anchorNewExchange;
		        
				priMessage.prepareMessage('FX Payment Returned', messageText, priMessage.TYPE.WARNING);
				priMessage.showPreparedMessage(context);
    		}
        	
        }
        


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });