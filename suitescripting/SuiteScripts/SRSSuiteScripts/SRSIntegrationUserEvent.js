/*******************************************************************************
 *******************************************************************************
 **		SRSIntegrationUserEvent.js / Nov 15, 2012
 **
 **		@author sbuttgereit
 **		@version 1.0
 **		@requires SRSUtilitiesLibrary.js
 **		@fileOverview This is a general controller script for the integration support.
 **
 **		Copyright (c) 2012 SRS | Shareholder Representative Services LLC
 **		Confidential and Proprietary
 ** 
 *******************************************************************************
 ******************************************************************************/

////////////////////////////////////////////////////////////////////////////////
//
//	@namespace Integration user event script functions.
//
////////////////////////////////////////////////////////////////////////////////

if (!this.SRS) {
	this.SRS = {};
}

SRS.IntegrationUserEvent = function(){ 

	/////////////////////////////////////////
	//
	//	Private Control Logic Members
	//
	/////////////////////////////////////////
	
	
	
	/////////////////////////////////////////
	//	
	//	Private	Script Action Members
	//
	/////////////////////////////////////////
	
	// @description The beforeLoad event is triggered when a record is read and prior to its display.  Online forms do not fire this event.
	// @param type The context of the record read (create, edit, view, copy, print, email).
	// @param form An nlobjForm object representing the current form.
	// @param request an nlobjRequest object representing the GET request (Only available for browser requests).
	function _beforeLoad (type, form, request){
		try {
            //no action
        } catch (e) {

        };	
	}
	
	// @description The beforeSubmit event is triggered prior to a record being written to the database. 
	// @param type The context of the record submission (create,edit,xedit,delete,etc.).
    function _beforeSubmit (type){
        try {
            SRS.IntegrationLibrary.updateIntegrationFlag(type);
        } catch (e) {
			SRS.Utility.processError('ERROR','SRS.IntegrationUserEvent._beforeSubmit',e);
			nlapiLogExecution('ERROR',"SRS.IntegrationUserEvent._beforeSubmit","Error setting export flag. Will not integrate.");	
        };
    }
    

	// @description The afterSubmit event is triggered just after a record has been written to the database.
	// @param type The context of the record submission (create,edit,xedit,delete,etc.).
    function _afterSubmit (type){
        try {
            
        } catch (e) {

        };
    }
    
    return {
    	/////////////////////////////////////////
    	//
    	//	Public Members
    	//
    	/////////////////////////////////////////
    	beforeLoad: _beforeLoad,
    	beforeSubmit: _beforeSubmit,
    	afterSubmit: _afterSubmit
    };


}();