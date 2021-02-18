/**
 * documentLibraryClient.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 * 
 *
 * Version    Date            Author           Remarks
 *	1.0		  				  Ken Crossman	   Meant to be a receptacle for useful scripting tools/functions/utilities for Documents 
 */
define(['N/search'
 		,'/.bundle/132118/PRI_AS_Engine'
 		,'/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'
 ],

	function(search
			,appSettings
			,toolsLibClient
	 ) {
	    const FIELDS = {
		
			EXCHANGE_RECORD: {
				ID: 'customrecord_acq_lot',
				TAX_FORM_COLLECTED: 'custrecord_exrec_tax_form_collected'
			}
		};
		var scriptName = 'documentLibraryClient.js';

		//=====================================================================================================
		function getExRecTaxForm(exRecId) {
		 	var funcName = scriptName + '==>' + 'getExRecTaxForm';
		 	log.debug(funcName, 'Entered with Ex Rec: ' + exRecId);

			var taxFormCollected = '';
			try {
				var exRecLookup = search.lookupFields({
					type: FIELDS.EXCHANGE_RECORD.ID,
					id: exRecId,
					columns: [FIELDS.EXCHANGE_RECORD.TAX_FORM_COLLECTED]
				});

				if (Boolean(exRecLookup[FIELDS.EXCHANGE_RECORD.TAX_FORM_COLLECTED][0])) {

					taxFormCollected = exRecLookup[FIELDS.EXCHANGE_RECORD.TAX_FORM_COLLECTED][0].value;
				}
			} catch (e){log.error(funcName, e.message);}
			return taxFormCollected;
		}

		// ================================================================================================================================
		function isJSONValid(JSONObj) {
			var funcName = 'toolsLibraryClient.js==>' + 'isJSONValid';
			var success = false;
			var message = '';
			var echosignOuterObject;
            var echosignObject;
            var additionalSignerTags = JSON.parse( appSettings.readAppSetting("Documents", 'Additional Signer Tags') ); 
			// 
			try { 
				if (JSONObj) { 
					echosignOuterObject = JSON.parse(JSONObj); 
				    if (echosignOuterObject) {
		                if (echosignOuterObject["0"]) { echosignObject = echosignOuterObject["0"]; }
		                                     else { echosignObject = echosignOuterObject; }
		                log.debug(funcName, 'echosignObject: ' + JSON.stringify(echosignObject));  
		               
		                for (var i = 0; i < additionalSignerTags.length; i++) {
		                    log.debug(funcName,'additionalSignerTags: ' + JSON.stringify(additionalSignerTags[i]));
		                    if (echosignObject[additionalSignerTags[i].toLowerCase()] ) {
		                    	log.debug(funcName,'additionalSignerTag value: ' + JSON.stringify(echosignObject[additionalSignerTags[i].toLowerCase()]));
		                        if (echosignObject[additionalSignerTags[i].toLowerCase()] > "") {
		                          	if (!toolsLibClient.validateEmail(echosignObject[additionalSignerTags[i].toLowerCase()])) {
		                          		message += additionalSignerTags[i] + ': ' + JSON.stringify(echosignObject[additionalSignerTags[i].toLowerCase()]) + ' is invalid. <br>'
		                          	}
		                        }
		                    }
		                }                    
	               	}
	            }
               	if (!message) {
					success = true;
               	}

			}
            catch(e){
            	message = e.message;
            }
            return {
            	success: success,
            	message: message
            }
		}
		// ================================================================================================================================
		return {
				getExRecTaxForm: getExRecTaxForm
				,isJSONValid:isJSONValid
		};
	});