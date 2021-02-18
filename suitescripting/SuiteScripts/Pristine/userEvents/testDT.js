	/**
	 *@NApiVersion 2.x
	 *@NScriptType UserEventScript
	 
	 * -----------------------------------------------------------
	 * testDT.js
	 * ___________________________________________________________
	 */

	define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/format', 'N/runtime'
		],
		function(serverWidget, record, search, format, runtime) {

			
			function beforeLoad(context) {
				log.debug('beforeLoad', 'runtime.executionContext: ' + runtime.executionContext);
				log.debug('beforeLoad', 'context.type: ' + context.type);
				var thisRecID = context.newRecord.getValue('id');
				var runTimeCTX = runtime.executionContext;

				var createdDate = context.newRecord.getValue('created');
				var createdDateType = typeof createdDate;
				log.debug('beforeLoad', 'native createdDateType: ' + createdDateType);
				var lmDate = context.newRecord.getValue('lastmodified');
				var lmDateType = typeof lmDate;
				log.debug('beforeLoad', 'native lmDateType: ' + lmDateType);
				var testDT = context.newRecord.getValue('custrecord_test_dt');
				var testDTType = typeof testDT;
				log.debug('beforeLoad', 'custom testDTType: ' + testDTType);
			}
	
			return {
				beforeLoad: beforeLoad
			};
		}
	);