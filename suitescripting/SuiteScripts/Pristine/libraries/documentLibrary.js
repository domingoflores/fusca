/**
 * documentLibrary.js
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
 		,'/SuiteScripts/Pristine/libraries/documentLibraryClient.js'
 ],

	function(search
			,appSettings
			,docLibClient
	 ) {
	    const FIELDS = {
		
			EXCHANGE_RECORD: {
				ID: 'customrecord_acq_lot',
				TAX_FORM_COLLECTED: 'custrecord_exrec_tax_form_collected'
			}
		};
		var scriptName = 'documentLibrary.js';

		//=====================================================================================================
		function getExRecTaxForm(exRecId) {
		 	var funcName = scriptName + '==>' + 'getExRecTaxForm';
			return docLibClient.getExRecTaxForm(exRecId);
		}
		
		//=====================================================================================================
		function isJSONValid(JSONObj) {
			var funcName = scriptName + "==>isJSONValid";
			return docLibClient.isJSONValid(JSONObj);   	
		}
		// ================================================================================================================================
		return {
				getExRecTaxForm: getExRecTaxForm
				,isJSONValid: isJSONValid
		};
	});