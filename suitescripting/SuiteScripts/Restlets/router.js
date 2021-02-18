/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Oct 2014     TJTyrrell
 *
 */

var srs = (function(){
	
	// Declare private / public
	var public = {},
		private = {};
	
	private._returnSyntax = 'json';
	private._restletLocation = 'SuiteScripts/Restlets/';
	
	private._returnStatus = { SUCCESS : "Success", ERROR : "Error", WARNING : "Warning"};
	private._messages = [];
	private._status;
	private._data;
	private._startTime = new Date().getTime();
	private._executionTime = [];
	
	
	/*
	 * "Is Status" functions
	 */
	public.isSuccess = function(){
		return private._status == private._returnStatus.SUCCESS;
	}
	
	public.isWarning = function() {
		return private._status == private._returnStatus.SUCCESS;
	}
	
	public.isError = function() {
		return public._status == private._returnStatus.ERROR;
	}
	
	/*
	 * Setters/Adders
	 */
	public.setStatus = function( status ) {
		private._status = private._returnStatus[status];
	}
	
	public.setReturnPayload = function( payload ) {
		private._data = payload;
	}
	
	public.addMessage = function( code, message ) {
		private._messages.push( { 'code' : code, 'message' : message } );
	}
	
	public.addExecutionTime = function( action ) {
		private._executionTime.push( { 'action' : action, 'time' : public.trackTime() } );
	}
	
	/*
	 * Getters
	 */
	public.getStatus = function() {
		return private._status;
	}
	
	public.getReturnPayload = function() {
		return private._data;
	}
	
	public.getMessages = function() {
		return private._messages;
	}
	
	public.getExecutionTime = function() {
		return private._executionTime;
	}
	
	public.getStartTime = function() {
		return private._startTime;
	}
	

	/**
	 * HTTP Type: Post
	 * @param {Object} dataIn Parameter object
	 * @returns {Object} Output object
	 */
	public.restCreate = function( dataIn ) {
		
		public.addExecutionTime('startRestlet');
		// Load the file and call the get method
		private._loadFile( dataIn.module, dataIn.file, 'createCall', dataIn );
		
		// Format the return data
		return private._return();
		
	};
	
	/**
	 * HTTP Type: Get
	 * @param {Object} dataIn Parameter object
	 * @returns {Object} Output object
	 */
	public.restRead = function( dataIn ) {
		
		public.addExecutionTime('startRestlet');
		// Load the file and call the get method
		private._loadFile( dataIn.module, dataIn.file, 'readCall', dataIn );
		
		// Format the return data
		return private._return();

	};
	
	/**
	 * @param {Object} dataIn Parameter object
	 * @returns {Object} Output object 
	 */
	public.restUpdate = function( dataIn ){
		
		public.addExecutionTime('startRestlet');
		// Load the file and call the get method
		private._loadFile( dataIn.module, dataIn.file, 'updateCall', dataIn );
		
		// Format the return data
		return private._return();
		
	};
	
	/**
	 * @param {Object} dataIn Parameter object
	 * @returns {Void} 
	 */
	public.restDelete = function() {
		
		return {};
		
	};
	
	public.trackTime = function() {
		
		var testTime = new Date().getTime(),
			executionTime = testTime - public.getStartTime();
		
		return executionTime;
		
	}
	
	/**
	 * @param {String} module | The module requested
	 * @param {String} type | 
	 * @param {String} call | The restlet call requested (post, put, get, delete) 
	 */
	private._loadFile = function( module, file, call, dataIn ) {
		
		var fileLocation,
			fileContents,
			restlet;
		
		if( !module ) {
			module = 'general';
		}
		
		if( !file ) {
			file = 'crud';
		}
		
		fileLocation = private._restletLocation + module + '/' + file + '.js';

		try {
			
			fileContents = nlapiLoadFile(fileLocation);
			
			restlet = eval( fileContents.getValue() );
			
			restlet[call]( dataIn );

			public.addExecutionTime( 'finishRestlet' );
			
		} catch(e) {

			var msg = '';
			
			if(e instanceof nlobjError ) {
				
				msg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
				
			} else {
				
				msg = e;
				nlapiLogExecution('DEBUG', 'unexpected error', e);
				
			}
			
			public.setStatus( 'ERROR' );
			public.addMessage( 197, 'Invalid API Call: ' + msg + ". Request: [" + module + '|' + file + "]" );

		}
		
	};
	
	/**
	 * @returns {String} Output string based on return type
	 */
	private._return = function() {
		
		var returnObject = {},
			returnString = '';
		
		returnObject.status = public.getStatus();
		returnObject.message = public.getMessages();
		returnObject.data = public.getReturnPayload();
		returnObject.executionTime = public.getExecutionTime();
		
		return returnObject;
	};
	
	return public;
	
}());