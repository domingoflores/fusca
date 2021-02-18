//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// Authors: Carl Zeng, Marty Zigman
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define([ 'N/error', 'N/record', 'N/render', 'N/runtime', 'N/search',
		'N/ui/serverWidget', './PRI_CustomRecord_LIB' ],
/**
 * @param {error}
 *            error
 * @param {record}
 *            record
 * @param {render}
 *            render
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(error, record, render, runtime, search, ui, UTIL_INC) {

	// -------------------------- User Event -------------------------
	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @param {Form}
	 *            scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {

		var clsIncrementer = new UTIL_INC.INCREMENTER({
			scriptContext : scriptContext
		});

		switch (scriptContext.type) {
		case scriptContext.UserEventType.CREATE:
		case scriptContext.UserEventType.COPY:

			// Enable/disable name field and initial value
			clsIncrementer.beforeLoad_Create();
			break;
		case scriptContext.UserEventType.EDIT:

			// Enable or disable name field
			clsIncrementer.beforeLoad_Edit();
			break;
		}
		return true;
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {

		var currentRecord = scriptContext.newRecord;
		var clsIncrementer = new UTIL_INC.INCREMENTER({
			scriptContext : scriptContext
		});
		var strName = currentRecord.getValue(clsIncrementer.strFieldId);

		switch (scriptContext.type) {
		case scriptContext.UserEventType.XEDIT:
		case scriptContext.UserEventType.EDIT:
		case scriptContext.UserEventType.CREATE:

			// Check uniqueness, or throw error
			clsIncrementer.beforeSubmit_CreateEdit(strName);
			break;
		}

		return true;
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

		var currentRecord = scriptContext.newRecord;
		var clsIncrementer = new UTIL_INC.INCREMENTER({
			scriptContext : scriptContext
		});
		var strName = currentRecord.getValue(clsIncrementer.strFieldId);

		switch (scriptContext.type) {
		case scriptContext.UserEventType.XEDIT:
		case scriptContext.UserEventType.EDIT:
		case scriptContext.UserEventType.CREATE:

			// AUTO-name and Auto increment feature
			clsIncrementer.afterSubmit_CreateEdit(strName);
			break;
		}

		return true;
	}

	return {
		beforeLoad : beforeLoad,
		beforeSubmit : beforeSubmit,
		afterSubmit : afterSubmit,
	};
});
