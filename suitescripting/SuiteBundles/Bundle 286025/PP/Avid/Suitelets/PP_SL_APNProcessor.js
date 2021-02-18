/**
 * Call PPSLibAvidSuite.doAPNPaymentBatch. This script expects a JSON POST and returns a JSON response
 * 
 * This script must be executed as admin in order for PPSLibAvidSuite.doAPNPaymentBatch to execute a scheduled script.
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Jul 2015     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	var requestJSON = JSON.parse(request.getBody());
	var paymentIds = requestJSON.paymentIds;
	
	// Authorize user, build XML payload and send payment batch request to APN
	var result = PPSLibAvidSuite.doAPNPaymentBatch(paymentIds);

	response.setContentType('JAVASCRIPT');
	response.write(JSON.stringify(result));
}