//-----------------------------------------------------------------------------------------------------------
//Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
//No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 * 
 * This script simply loads/saves a record, firing off User Event scripts
 */
define([ 'N/record', 'N/runtime', 'N/search' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(record, runtime, search) {

	/**
	 * Definition of the Suitelet script trigger point.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @Since 2016.1
	 */
	function onAction(scriptContext) {

		var params = scriptContext.newRecord;
		if (!params)
			params = scriptContext.oldRecord;

		var strUpdateFlds = runtime.getCurrentScript().getParameter({
			name : "custscript_pri_wa_touch_updateflds"
		});
		var objUpdateFlds = strUpdateFlds ? JSON.parse(strUpdateFlds) : {};

		var funcName = "PRI_WA_Touch " + params.type + " " + params.id;
		try {
			var objRec = record.load({
				type : params.type,
				id : params.id
			});

			// Update Field Values, if configured
			for ( var fldId in objUpdateFlds) {
				objRec.setValue(fldId, objUpdateFlds[fldId]);
			}

			objRec.save();
			log.debug(funcName, "Record Loaded/Saved");
		} catch (e) {
			log.error(funcName + " error", e);
		}

		return true;
	}

	return {
		onAction : onAction
	};

});
