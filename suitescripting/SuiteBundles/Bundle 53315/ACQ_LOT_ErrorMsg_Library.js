/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Jul 2014     smccurry
 *
 */
ERROR_MESSAGES = function(obj) { 
	this.returnMessages = new Array(); 
	this.returnRecId = null;
};
ERROR_MESSAGES.prototype.getMessages = function() { 
	return this.returnMessages; 
};
ERROR_MESSAGES.prototype.addMessage = function(message) { 
	this.returnMessages.push({ 'message' : message }); 
};
ERROR_MESSAGES.prototype.isSuccess = function() { 
	return this.returnStatus == ERROR_MESSAGES.RETURNSTATUS.SUCCESS; 
};
ERROR_MESSAGES.prototype.isError = function() { 
	return this.returnStatus == ERROR_MESSAGES.RETURNSTATUS.ERROR; 
};
ERROR_MESSAGES.prototype.setStatusSuccess = function() { 
	this.returnStatus = ERROR_MESSAGES.RETURNSTATUS.SUCCESS; 
};
ERROR_MESSAGES.prototype.setStatusError = function() {
	this.returnStatus = ERROR_MESSAGES.RETURNSTATUS.ERROR; 
};
ERROR_MESSAGES.prototype.setReturnRecID = function(recID) { 
	this.returnRecID = recID; 
};
ERROR_MESSAGES.prototype.getReturnRecID = function() {
	return this.returnRecID; 
};
ERROR_MESSAGES.RETURNSTATUS = { SUCCESS : "Success", ERROR : "Error"};