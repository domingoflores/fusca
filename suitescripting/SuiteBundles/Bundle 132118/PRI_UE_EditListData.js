// -----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// ------------------------------------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author Carl
 * @Note: Prolecto Edit List Data on Forms User Event Library
 * 
 * 20180618/Carl Embed mode added iframe mode support(works for check-box), need
 * new option parameter for: strIframeScriptId, strIframeDeployId,
 * strParentFld(get this field value on current record then used as parent to
 * filter/criteria back-end saved search).
 */
define([ 'N/error', 'N/record', 'N/runtime', 'N/search', 'N/url',
		'./PRI_EditListData_Lib.js' ],
/**
 * @param {error}
 *            error
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(error, record, runtime, search, url, editListData) {

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

		// Script Parameter first
		var objCurScript = runtime.getCurrentScript();
		var param_intSearchId = objCurScript.getParameter({
			name : 'custscript_pri_eld_searchid'
		});
		var param_objEditFldDef = objCurScript.getParameter({
			name : 'custscript_pri_eld_editflddef'
		});
		var param_objOptions = objCurScript.getParameter({
			name : 'custscript_pri_eld_options'
		});
		var currentRecord = scriptContext.newRecord;
		var objForm = scriptContext.form;

		switch (scriptContext.type) {
		case scriptContext.UserEventType.EDIT:
		case scriptContext.UserEventType.VIEW:

			var objClsOptions = param_objOptions ? JSON.parse(param_objOptions)
					: {};
			if (objClsOptions.strIframeScriptId
					&& objClsOptions.strIframeDeployId
					&& objClsOptions.strParentFld) {

				objClsOptions.strIframeUrl = url.resolveScript({
					scriptId : objClsOptions.strIframeScriptId,
					deploymentId : objClsOptions.strIframeDeployId,
				}) + '&custparam_parentid='
						+ currentRecord.getValue(objClsOptions.strParentFld);
			}

			var objEditListData = new editListData.EDITLISTDATA(scriptContext,
					param_intSearchId, param_objEditFldDef, objClsOptions);
			objEditListData.addList();

			break;

		// var objEditListData = new editListData.EDITLISTDATA(scriptContext,
		// param_intSearchId, param_objEditFldDef,
		// (param_objOptions ? JSON.parse(param_objOptions) : ''));
		// objEditListData.addList();
		// break;
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

	}

	return {
		beforeLoad : beforeLoad,
	// beforeSubmit : beforeSubmit,
	// afterSubmit : afterSubmit
	};

});
