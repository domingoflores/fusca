/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'],
	// Add the callback function.
	function(record, serverWidget) {
		function myBeforeLoad(context) {
			log.debug('fred');
		}
		return {
			beforeLoad: myBeforeLoad
		};
	});