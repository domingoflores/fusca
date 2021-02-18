/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jan 2013     Jay
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	
	var printer = JSON.parse(decodeURIComponent(request.getParameter('printer')));
	var jsonObj = {printerOffsets: printer};
	
	nlapiLogExecution('debug', 'TestPrint', JSON.stringify(jsonObj));
	
	try{
		var url = $PPS.nlapiOutboundSSO() + "&testpage=1";
				
		var data = nlapiRequestURL(url, JSON.stringify(jsonObj));
		response.write(data.getBody());
	}catch(e){
		response.write(e.message);
	}
}
