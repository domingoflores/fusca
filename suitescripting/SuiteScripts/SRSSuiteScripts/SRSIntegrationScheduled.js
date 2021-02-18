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
//	@namespace Integration scheduled script functions.
//
////////////////////////////////////////////////////////////////////////////////

if (!this.SRS) {
	this.SRS = {};
}

SRS.IntegrationScheduled = function(){

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

	function _prepMergedRecs (){
		try {
            SRS.IntegrationLibrary.scheduledRecordMerges('customer');
            SRS.IntegrationLibrary.scheduledRecordMerges('vendor');
            SRS.IntegrationLibrary.scheduledRecordMerges('contact');
        } catch (e) {
			SRS.Utility.processError('ERROR','SRS.IntegrationScheduled._prepMergedRecs',e);
			nlapiLogExecution('ERROR',"SRS.IntegrationScheduled._prepMergedRecs","Error setting export flag. Will not integrate.");
		}
	}

    return {
		/////////////////////////////////////////
		//
		//	Public Members
		//
		/////////////////////////////////////////
		prepMergedRecs: _prepMergedRecs
    };


}();