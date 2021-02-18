// -----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// ------------------------------------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Portlet
 * @NScriptPortletType html
 * @NModuleScope Public
 * @author Carl
 * @Date 20180502
 * @Note: Prolecto Edit List Data for stand alone PortLet Mode; <br>
 *        Deployment: configure the parameter, link to specific Stand Alone
 *        SuitLet UI.
 */
define(
		[ 'N/error', 'N/record', 'N/url', 'N/runtime', 'N/search',
				'N/ui/serverWidget', './PRI_EditListData_Lib.js' ],

		function(error, record, url, runtime, search, ui, editListData) {

			/**
			 * Definition of the Portlet script trigger point.
			 * 
			 * @param {Object}
			 *            params
			 * @param {Portlet}
			 *            params.portlet - The portlet object used for rendering
			 * @param {number}
			 *            params.column - Specifies whether portlet is placed in
			 *            left (1), center (2) or right (3) column of the
			 *            dashboard
			 * @param {string}
			 *            params.entity - (For custom portlets only) references
			 *            the customer ID for the selected customer
			 * @Since 2015.2
			 */
			function render_inlineEdit_PLMode(params) {

				// Script Parameter first
				var objCurScript = runtime.getCurrentScript();
				var param_uiScriptId = objCurScript.getParameter({
					name : 'custscript_pri_eldpl_uiscriptid'
				});
				var param_uiDeploymentId = objCurScript.getParameter({
					name : 'custscript_pri_eldpl_uideploymentid'
				});
				var param_title = objCurScript.getParameter({
					name : 'custscript_pri_eldpl_title'
				});

				var portletObj = params.portlet;
				portletObj.title = (param_title && param_title != 'undefined') ? param_title
						: 'Flexible Inline Edit';

				if (!param_uiScriptId || !param_uiDeploymentId) {

					portletObj.html = '[MISS_MANDATORY_PARAMETER]\rPlease setup script parameter for: UI Script Id, UI Script Deployment Id';
					// throw error
					// .create({
					// name : 'MISS_MANDATORY_PARAMETER',
					// message : 'A required argument is missing. Please enter
					// script parameter for: UI Script Id, UI Script Deployment
					// Id.',
					// notifyOff : true
					// });
					return true;
				}

				portletObj.html = '<iframe name="custpage_pri_pl_editlistdata_uimode" '
						+ 'src="'
						+ url.resolveScript({
							scriptId : param_uiScriptId,
							deploymentId : param_uiDeploymentId,
						})
						+ '&custparam_hidenavbar=T&custparam_title='
						+ 'Flexible Inline Edit'
						+ '&ifrmcntnr=T" '
						+ 'width="100%" height="600" '
						+ 'frameborder="0" '
						+ 'longdesc="Flexible Inline Edit"></iframe>';
			}

			return {
				render : render_inlineEdit_PLMode
			};

		});
