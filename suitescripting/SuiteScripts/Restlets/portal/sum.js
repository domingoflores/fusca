/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Dec 2014     TJTyrrell
 *
 */

(function() {

	var restlet = {};
	
	restlet.createCall = function( dataIn ) {
		
	};
	
	restlet.readCall = function( dataIn ) {

		// Example execution call
		public.addExecutionTime( 'startReadRecord' );
		nlapiLogExecution('DEBUG','readRecord','readRecord start');

		// Get record
		var record = {},
			returnPayload = {};

		public.addExecutionTime( 'finishReadRecord' );

		public.setStatus( 'SUCCESS' );
		
		try {
			
			if( readRecord ) {
				
				public.setReturnPayload( returnPayload );
	
			} else {
				
				public.setStatus('ERROR');
				public.addMessage( 'rhino', 'Invalid Exchange Hash' );
				nlapiLogExecution( 'ERROR', 'readRecord', 'Invalid Exchange Hash' );
	
			}
	
		} catch(e) {
			
			var msg = '';
			
			if(e instanceof nlobjError ) {
				
				msg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
				
			} else {
				
				for( var prop in e ) {
					msg += "Property: " + prop + ", Value: [" + e[prop] + "] -- ";
				}
				nlapiLogExecution('DEBUG', 'unexpected error', e);
				
			}
			
			public.setStatus( 'ERROR' );
			public.addMessage( 1999, "System Error: " + msg );
			
		}
		
	};
	
	restlet.updateCall = function( dataIn ) {
		
	};

	restlet.deleteCall = function( dataIn ) {
		
	};
	
	return restlet;
	
}());
