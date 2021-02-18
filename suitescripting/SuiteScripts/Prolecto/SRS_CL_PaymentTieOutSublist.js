//-----------------------------------------------------------------------------------------------------------
// Copyright 2020 All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

/*
 *
 * Client script for the similarly named Suitelet 
 * 
 */

define(['N/error','N/ui/dialog','N/currentRecord','N/format'],
	function(error,dialog,currentRecord,format) {
	
		var scriptName = "SRS_CL_PaymentTieOutSublist.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC; 
		
		function pageInit(context) {		
			REC = context.currentRecord;
			
			window.parent.require(['N/ui/message'], function(message) {
				if (REC.getValue("custpage_banner_info"))
					message.create(JSON.parse(REC.getValue("custpage_banner_info"))).show();
			})
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			pageInit: 			pageInit,
		};
});