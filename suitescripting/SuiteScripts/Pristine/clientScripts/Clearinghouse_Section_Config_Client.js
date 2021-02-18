/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/ui/message', 'N/currentRecord'
       ,'/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'
       ,'/.bundle/132118/PRI_AS_Engine'
	   ],
	/**
	 * -----------------------------------------------------------
	 * Clearinghouse_Section_Config_Client.js
	 * ___________________________________________________________
	 * Version 1.0
	 * Author: Alex Fodor
	 * Date: 2019-02-13	
	 *
	 */
	function(runtime ,msg ,currentRecord ,tools ,appSettings ) {

		var currentUser = null;
		var rcd = null;
  
  var requiredFieldsList; 
        
  function pageInit(context) {
    	 requiredFieldsList = JSON.parse( appSettings.readAppSetting("General Settings", "CH Section Config Required Fields") ); 
    
  }
		
		//=====================================================================================================
		//=====================================================================================================
		function fieldChanged(context) {
			
			var rcd = context.currentRecord;
          
			for (i = 0; i < requiredFieldsList.length; i++) {
				var objFieldSet = requiredFieldsList[i];
				if (objFieldSet.targetField == context.fieldId) {
					
					if ( rcd.getValue({ fieldId:objFieldSet.targetField }) ) { // IF field has been checked
						
						for (j = 0; j < objFieldSet.requiredFields.length; j++) { 
							var fieldValue = rcd.getValue({ fieldId:objFieldSet.requiredFields[j] } );
							if (!fieldValue) {
								rcd.setValue({ fieldId:objFieldSet.targetField ,value:false } );							
								showErrorMessage("Required Fields Not Entered/Checked", objFieldSet.userMsg );
								break;
							}
						} // for (j = 0; j < objFieldSet.requiredFields.length; j++)

					} // if (rcd.getValue({ fieldId:objFieldSet.targetField } ))
					break; 
				} // if (objFieldSet.targetField == context.fieldId)
			} // for (i = 0; i < requiredFieldsList.length; i++)
          
		}
		
		
		//=====================================================================================================
		//=====================================================================================================
		function saveRecord(context) {

			var rcd = context.currentRecord;
			
			for (i = 0; i < requiredFieldsList.length; i++) {
				var objFieldSet = requiredFieldsList[i];
				
				if ( rcd.getValue({ fieldId:objFieldSet.targetField }) ) { // IF field has been checked
					
					for (j = 0; j < objFieldSet.requiredFields.length; j++) { 
						var fieldValue = rcd.getValue({ fieldId:objFieldSet.requiredFields[j] } );
						if (!fieldValue) {
							rcd.setValue({ fieldId:objFieldSet.targetField ,value:false } );							
							showErrorMessage("Required Fields Not Entered/Checked", objFieldSet.userMsg );
							return false;
						}
					} // for (j = 0; j < objFieldSet.requiredFields.length; j++)

				} // if (rcd.getValue({ fieldId:objFieldSet.targetField } ))
				
				
				
				
			} // for (i = 0; i < requiredFieldsList.length; i++)
        	
    		
    		return true;
		}

		
		
		
		//=====================================================================================================
		//=====================================================================================================
		function showErrorMessage(msgTitle, msgText) {
			var myMsg = msg.create({
				title: msgTitle,
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show({ duration: 9900 });
            window.scrollTo(0, 0);
		}

		return {  fieldChanged: fieldChanged
			       ,saveRecord: saveRecord,
                pageInit:	pageInit
			
		};
	});