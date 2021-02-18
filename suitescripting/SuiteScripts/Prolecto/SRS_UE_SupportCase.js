//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the Support Case record
 * 
 */

define([ "N/search",'./Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'],
				
		function( search, srsFunctions, priLibrary) {
	
			var scriptName = "SRS_UE_SupportCase.";

			/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
			
			function afterSubmit(context) {
				
				//ATP-1132
				var REC = context.newRecord;
				var records = [];
				//montior CASE QUEUE for any changes. If found, re-check ASSOCIATED EXCHANGE RECORD ER155
				if (priLibrary.fieldChanged(context, "custevent_case_queue"))
				{
					//if queue status field has changed append related exchange record
					records = srsFunctions.addRecordsToArray(context.oldRecord, REC, "custevent_qx_acq_associatedexchangereco", records);
				}
				
				//montior STATUS  for any changes. If found, re-check ASSOCIATED EXCHANGE RECORD ER155
				if (priLibrary.fieldChanged(context, "status"))
				{
					//if exchange record id has changed, append both old exchange record and new exchange record. 
					records = srsFunctions.addRecordsToArray(context.oldRecord, REC, "custevent_qx_acq_associatedexchangereco", records);
				}
				
				if (records.length > 0)
				{
					//this array of records will be matched against Exchange REcord internal id
					srsFunctions.writeExchangeRecordsToRSMQueue([["internalid",search.Operator.ANYOF,records]]);
				}
				
				//montior changes to COMPANY. If changed, re-evaluate all exchange records that belong to this shareholder 
				if (priLibrary.fieldChanged(context, "company"))
				{
					records = [];
					records = srsFunctions.addRecordsToArray(context.oldRecord, REC, "company", records);
					if (records.length > 0)
					{
						//this array of records will be matched against company field (shareholder)
						srsFunctions.writeExchangeRecordsToRSMQueue([["custrecord_acq_loth_zzz_zzz_shareholder",search.Operator.ANYOF,records]]);
					}
				}
				
				//ATP-1132 end
	        }
			
    		return {
			//beforeLoad: 	beforeLoad,
			afterSubmit:	afterSubmit
		}
});

