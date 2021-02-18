/**
 * Module Description
 * This Script checks to see if a Case Categorization By Email record
 * allready exists with the same inbound email address.  If it does, 
 * then this script simply blanks out the Inbound email address field 
 * and pops up an error message to the user (Still need to add).
 * 
 * 
 * Version    Date            Author           Remarks
 * 1.00       12/14/2017      Scott Streule    Client Script for Case Categorization By Email
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/ui/dialog', 'N/search'],
	
	function(message, dialog, search) {
		
		function pageInit(context) {
			
			log.debug({
				title: 'context',
				details: JSON.stringify(context)
			});
			//THIS CAN BE EDIT, VIEW, CREATE.  MIGHT WANT TO USE THIS LATER
			var mode = context.mode;

		}

		// function saveRecord(context) {
		// 	var inboundEmail = context.currentRecord.getValue({
		// 		fieldId: 'custrecord_case_cat_email'
		// 	});
		// 	//CALL THE SEARCH FUNCTION
		// 	searchForDup(context, inboundEmail);
		// }

		function fieldChanged(context) {

			//PROBABLY SET THE ACTUAL DEAL FIELD TO HAVE THE VALUE SELECTED IN THE TEMP FIELD
			//PROBABLY SET THE ACTUAL EXCHANGE RECORD FIELD TO HAVE THE VALUE SELECTED IN THE TEMP FIELD
			var inboundEmail = context.currentRecord.getValue({
				fieldId: 'custrecord_case_cat_email'
			});

			if ((context.fieldId == 'custrecord_case_cat_email')&&((inboundEmail !== null)&&(inboundEmail !== ''))){
				//CALL THE SEARCH FUNCTION
				searchForDup(context, inboundEmail);

			}

		}

		function searchForDup(context, inboundEmail){
			//INITIALIZE ARRAYS
			var searchFilters = [];
			var caseCatByEmailId = [];
			//DEFAULT SEARCH FILTER FOR SHAREHOLDER	
			searchFilters.push({
				name: 'custrecord_case_cat_email',
				operator: search.Operator.IS,
				values: inboundEmail 
			});
			//CREATE THE SEARCH
			var searchCaseCatByEmail = search.create({
                type: 'customrecord_case_categorization_email',
                columns: [{
                    name: 'custrecord_case_cat_email',
                }],
                filters: searchFilters
            });
           	//RUN THE SEARCH
       		var searchResults = searchCaseCatByEmail.run().getRange(0, 100);
       		//CHECK TO SEE IF THERE ARE ANY RESULTS
       		if(searchResults.length > 0){
       			log.debug({
       				title: 'NOT GOOD',
       				details: JSON.stringify(searchResults)
       			});
       			//CALL FUNCTION TO DISPLAY WARNING MESSAGE AT TOP OF SCREEN
       			displayMessage(context, inboundEmail);
       			//SET THE INBOUND EMAIL FIELD TO BE BLANK / NULL
       			context.currentRecord.setText({
				    fieldId: 'custrecord_case_cat_email',
				    text: '',
				    ignoreFieldChange: true,
				    fireSlavingSync: true
				});
				context.currentRecord.setValue({
				    fieldId: 'custrecord_case_cat_email',
				    value: null,
				    ignoreFieldChange: true,
				    fireSlavingSync: true
				});
			}
		}

		function displayMessage(context, inboundEmail){
			var dupFoundMessage = message.create({
	            title: "* WARNING *", 
	            message: "There is already a Case Categorization by Email record that contains the INBOUND EMAIL ADDRESS of " + '<b><u>' + inboundEmail + '</u></b>', 
	            type: message.Type.ERROR
	        });

			dupFoundMessage.show();
			setTimeout(dupFoundMessage.hide, 15000);
   		}

		return {
			fieldChanged: fieldChanged,
			pageInit: pageInit,
			//saveRecord: saveRecord,
			//validateField: validateField
		};
	});