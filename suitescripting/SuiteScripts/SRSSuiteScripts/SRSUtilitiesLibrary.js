/*******************************************************************************
 *******************************************************************************
 **		SRSUtilitiesLibrary.js / Sep 10, 2012
 **
 **		@author sbuttgereit
 **		@version 1.0
 **		@requires 
 **		@fileOverview A set of general purpose utilities for use in other scripts.
 **
 **		Copyright (c) 2012 SRS | Shareholder Representative Services LLC
 **		Confidential and Proprietary
 ** 
 *******************************************************************************
 ******************************************************************************/

////////////////////////////////////////////////////////////////////////////////
//
//	@namespace Holder for commonly used utility functions.
//
////////////////////////////////////////////////////////////////////////////////

if (!this.SRS) {
	this.SRS = {};
}

SRS.Utility = function(){
	
	/////////////////////////////////////////
	//
	//	Private Business Logic Members
	//
	/////////////////////////////////////////
	function _processError(level,caller,e) {
		if ( e instanceof nlobjError ) {
			nlapiLogExecution( level, 'system error', e.getCode() + '\n' + e.getDetails() );
		} else {
			nlapiLogExecution( level, 'unexpected error', e.toString() );
		}
	}
	
	return {		
    	/////////////////////////////////////////
    	//
    	//	Public Members
    	//
    	/////////////////////////////////////////
		
		processError:	_processError
	};
}();

