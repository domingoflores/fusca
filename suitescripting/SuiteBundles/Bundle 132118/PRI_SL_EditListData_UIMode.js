// -----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// ------------------------------------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author Carl
 * @Date 20180501
 * @Note: Prolecto Edit List Data for stand alone UI Mode
 * @History 20180723/Carl, Added hidden fields from parameters dynamically,
 *          flexible to support send custom parameters to custom back-end
 *          SuiteLet, so it can receive data from any 'parent' record.
 */
define(
		[ 'N/error', 'N/record', 'N/redirect', 'N/runtime', 'N/search',
				'N/file', 'N/ui/serverWidget', './PRI_EditListData_Lib' ],
		/**
		 * @param {error}
		 *            error
		 * @param {record}
		 *            record
		 * @param {redirect}
		 *            redirect
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(error, record, redirect, runtime, search, file, ui,
				editListData) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest_inlineEdit_UIMode(context) {

				// Script Parameter first
				var objCurScript = runtime.getCurrentScript();
				var param_intSearchId = objCurScript.getParameter({
					name : 'custscript_pri_eldui_searchid'
				});
				var param_objEditFldDef = objCurScript.getParameter({
					name : 'custscript_pri_eldui_editflddef'
				});
				var param_objOptions = objCurScript.getParameter({
					name : 'custscript_pri_eldui_options'
				});

				if (context.request.method === 'GET') {

					if (!param_intSearchId || !param_objEditFldDef) {

						context.response
								.write('[MISS_MANDATORY_PARAMETER]\rPlease setup script parameter for: SAVED SEARCH, EDIT FIELD DEFINITION');
						// throw error
						// .create({
						// name : 'MISS_MANDATORY_PARAMETER',
						// message : 'A required argument is missing. Please
						// enter script parameter for: SAVED SEARCH, EDIT FIELD
						// DEFINITION.',
						// notifyOff : true
						// });
						return true;
					}

					var param_title = context.request.parameters.custparam_title;
					var strHideNavBar = context.request.parameters.custparam_hidenavbar;
					var param_parentId = context.request.parameters.custparam_parentid;

					var form = ui
							.createForm({
								title : (param_title && param_title != 'undefined') ? param_title
										: 'Flexible Inline Edit',
								hideNavBar : (strHideNavBar == 'T') ? true
										: false
							});

					try {
						var objClFileObj = file
								.load({
									id : 'SuiteBundles/Bundle 132118/PRI_CL_EditListData_UIMode.js'
								});
					} catch (ex) {
					}

					if (objClFileObj)
						form.clientScriptModulePath = './PRI_CL_EditListData_UIMode.js';

					// [1] Add hidden fields from parameters dynamically
					for ( var strCustParam in context.request.parameters) {

						if (strCustParam.indexOf('custparam_') != 0)
							continue;

						var objTmpFld = form.addField({
							id : 'custpage_' + strCustParam,
							label : 'custpage_' + strCustParam,
							type : ui.FieldType.TEXT
						}).updateDisplayType({
							displayType : 'hidden'
						});

						objTmpFld.defaultValue = context.request.parameters[strCustParam];
					}

					// [2] Add Sublist
					var scriptContext = {
						'form' : form
					};
					var objClsOptions = (param_objOptions ? JSON
							.parse(param_objOptions) : {});
					if (param_parentId)
						objClsOptions.intParentId = param_parentId;
					var objEditListData = new editListData.EDITLISTDATA(
							scriptContext, param_intSearchId,
							param_objEditFldDef, objClsOptions);
					form = objEditListData.addList();

					context.response.writePage(form);
				}
			}

			return {
				onRequest : onRequest_inlineEdit_UIMode
			};

		});
