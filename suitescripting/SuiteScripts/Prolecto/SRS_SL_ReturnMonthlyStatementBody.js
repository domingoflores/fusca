/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */


define(['N/record', 'N/runtime', 'N/search'],  
	function(record, runtime, search) {

		var scriptName = "SRS_SL_ReturnMonthlyStatementBody.";

		var _context;
		
		function onRequest(context) {
							
			var funcName = scriptName + ".onRequest ";
		
			_context = context;
							
			var sdaId = context.request.parameters.sdaId;
			
			if (!sdaId) {
				writeToScreen(context, "Parameter sdaId not found");
				return;
			}
			
			
			var ss = search.create({
				type:		"customrecord_prepared_emails",
				filters:	[
				        	 	["custrecord_prepared_email_job",search.Operator.ANYOF,[19796,19799,19808]]
				        	 	,"AND",["custrecord_rpt_access_record",search.Operator.ANYOF,[sdaId]]
				        	 ],
			}).run().getRange(0,1); 
			
			if (ss.length > 0) {
	        	var EMAIL = record.load({type: "customrecord_prepared_emails", id: ss[0].id});
	        	
	        	writeToScreen(context, EMAIL.getValue("custrecord_prepared_email_body")); 
			} else
				writeToScreen(context, "Failed");									
							
		}			

		// ================================================================================================================================

		function writeToScreen(context, msg) {
			context.response.write(msg + "<br>");				
		}

		// ================================================================================================================================
			

			return {
				onRequest : onRequest
			};
});

