/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/record' ,'N/runtime' ,'N/search' ,'/.bundle/132118/PRI_QM_Engine' ],
 
function(record ,runtime ,search ,qmEngine) {
 
	var scriptName = "ACQ_LOT_DA_QM_AddEntryToQueue_SL.js";

	function onRequest(context) {

		if (context.request.method === 'GET') {
    		log.debug(scriptName, "Starting" );

            var UserId = runtime.getCurrentUser().id;
            var parmQueueName             = context.request.parameters.queueName;
            var parmType                  = context.request.parameters.type;
            var parmUser                  = context.request.parameters.user;
            var parmPaymentsEffectiveDate = context.request.parameters.paymentsEffectiveDate;
            var parmExchangeRecordList    = context.request.parameters.exchangeRecordList;
			
    		log.debug(scriptName, "parmQueueName: " + parmQueueName + ",   parmExchangeRecordList: " + parmExchangeRecordList );
    		
    		try {
    			var QManagerParm = {"startingIndex":0 ,"type":parmType ,"user":parmUser };
    			if (parmPaymentsEffectiveDate) { QManagerParm.paymentsEffectiveDate = parmPaymentsEffectiveDate; }
    			var objList = JSON.parse(parmExchangeRecordList);
    			QManagerParm.exchangeRecordList = objList;
    			
				var intQid = qmEngine.addQueueEntry( parmQueueName ,QManagerParm ,null ,true ,'customscript_acq_lot_da_qm_aprv_pmt_rqst');
    		} 
    		catch(e) { log.error(scriptName ,"Exception: " + e.message); }
			

			context.response.write('OK');
		} 
		
	} //function onRequest



return { onRequest: onRequest };
});