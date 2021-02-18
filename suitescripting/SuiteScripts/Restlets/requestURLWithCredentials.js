/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Nov 2014     TJTyrrell
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function getRESTlet(dataIn) {
	
	return '{}';
	
}

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function requestUrl(dataIn) {

	var request = {},
		environment = 'development',
		headers = {};

	request.url = dataIn.url;//'https://www.acquiomaccess.x042.com/send/request/14IU-UKVS-5L4G'; // + data.lot12hash;
	request.postData = ( dataIn.postData == null ) ? null : dataIn.postData;//'{ "email": "emartin@shareholderrep.com", "lotId": "6", "lot12hash": "14IU-UKVS-5L4G", "lot12Id": "6075" }';
	request.headers = ( dataIn.getHeaders == null ) ? null : dataIn.getHeaders;//"{ 'Accept': 'application/json','Content-Type': 'application/json'}";
	request.type = ( dataIn.type == null ) ? null : dataIn.type;
	
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
	headers['cred_1'] = '{acquiom}';
	headers['cred_2'] = '{bigmoney}';
	//if( environment == 'development' ) {
		request.credentials = [ 'acquiom', 'bigmoney' ];
		request.response = nlapiRequestURLWithCredentials(request.credentials, request.url, request.postData, headers, request.type);
	//} else {
	//	request.response = nlapiRequestURL(request.url, request.postData, null, null, request.type);
	//}
	
	try {
		if( dataIn.type == 'json' ) {
			request.data = JSON.parse( request.response.getBody() );
			return JSON.stringify( request );
		} else {
			return request.response.getBody();
		}
	} catch(e) {
		return "Error: " + e;
	}
	
	
	
	
}

/**
 * @param {Object} dataIn Parameter object
 * @returns {Void} 
 */
function deleteRESTlet(dataIn) {
	return "delete";
}

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object 
 */
function putRESTlet(dataIn) {
	
	return "put";
}
