/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Oct 2014     TJTyrrell
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */

(function() {
	var restlet = {};
	
	restlet.get = function() {
		var returnObject = {};
		
		returnObject.status = "success";
		returnObject.message = "You called Get Cases properly";
		
		return returnObject
	}
	
	return restlet;
	
}());