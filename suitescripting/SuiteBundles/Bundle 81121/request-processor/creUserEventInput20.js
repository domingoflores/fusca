//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(
		[ 'N/record', 'N/runtime', 'N/search', 'N/error', 'N/ui/serverWidget',
				'N/url', './creSuiteletInput20_lib' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search, error, ui, url, inputSlLib) {

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

				if (scriptContext.type == scriptContext.UserEventType.CREATE
						|| runtime.executionContext != runtime.ContextType.USER_INTERFACE)
					return;

				var objCurScript = runtime.getCurrentScript();
				var strTabLbl = objCurScript.getParameter({
					name : 'custscript_pri_cre_embedded_input_tablbl'
				});

				// Added by MM: 2017-09-01 : Only show subtab/button if Search
				// is not empty
				var showSubtabButton = true;
				var rec = scriptContext.newRecord;
				var searchId = objCurScript
						.getParameter('custscript_pri_cre_show_subtab_criteria');
				if (searchId != null && searchId != '') {
					var showSubtabCriteriaSearch = search.load({
						id : searchId
					});
					var idFilter = search.createFilter({
						name : 'internalid',
						operator : search.Operator.ANYOF,
						values : rec.id
					});
					showSubtabCriteriaSearch.filters.push(idFilter);
					var showSubtabCriteriaSearchResults = showSubtabCriteriaSearch
							.run().getRange({
								start : 0,
								end : 1
							});
					log.debug('showSubtabCriteriaSearchResults',
							showSubtabCriteriaSearchResults);
					if (!showSubtabCriteriaSearchResults
							|| showSubtabCriteriaSearchResults.length == 0)
						showSubtabButton = false;
				}
				var buttonToOpenTool = objCurScript
						.getParameter('custscript_pri_cre_button_open_tool');
				log.debug('buttonToOpenTool, showSubtabButton',
						buttonToOpenTool + ', ' + showSubtabButton);
				// End Added by MM: 2017-09-01

				// Prepare parameters
				var strInputSlURL = url.resolveScript({
					scriptId : 'customscript_pri_cre_input_suitelet',
					deploymentId : 'customdeploy_pri_cre_input_suitelet',
					params : ''
				});

				// Put in value to overwrite definitions in suitelet script
				// parameter definition
				var custparam_searchid = objCurScript.getParameter({
					name : 'custscript_pri_cre_embedded_searchid'
				});
				var custparam_formfilter = objCurScript.getParameter({
					name : 'custscript_pri_cre_embedded_formfilter'
				});
				var custparam_creprofile = objCurScript.getParameter({
					name : 'custscript_pri_cre_embedded_creprofile'
				});
				var custparam_creoptiongrp = objCurScript.getParameter({
					name : 'custscript_pri_cre_embedded_creoptiongrp'
				});
				var custparam_rootfolder = objCurScript.getParameter({
					name : 'custscript_pri_cre_embedded_rootfolder'
				});
				var custparam_mult_cre_json = objCurScript.getParameter({
					name : 'custscript_pri_cre_mult_cre_ids_json'
				});
				var custparam_filter_flds = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_filtrs'
				});
				
				var custparam_parentrecid = scriptContext.newRecord.id;
				var custparam_parentrectype = scriptContext.newRecord.type;
				var strParameter = (custparam_searchid ? ('&custparam_searchid=' + custparam_searchid)
						: '')
						+ (custparam_formfilter ? ('&custparam_formfilter=' + custparam_formfilter)
								: '')
						+ (custparam_creprofile ? ('&custparam_creprofile=' + custparam_creprofile)
								: '')
						+ (custparam_creoptiongrp ? ('&custparam_creoptiongrp=' + custparam_creoptiongrp)
								: '')
						+ (custparam_rootfolder ? ('&custparam_rootfolder=' + custparam_rootfolder)
								: '')
						+ (custparam_parentrectype ? ('&custparam_parentrectype=' + custparam_parentrectype)
								: '')
						+ (custparam_parentrecid ? ('&custparam_parentrecid=' + custparam_parentrecid)
								: '')
						+ (custparam_mult_cre_json ? ('&custparam_mult_cre_json=' + encodeURIComponent(custparam_mult_cre_json))
								: '')
						+ (custparam_filter_flds ? ('&custparam_filter_flds=' + encodeURIComponent(custparam_filter_flds))
								: '');

				switch (scriptContext.type) {

				case scriptContext.UserEventType.VIEW:
					if (buttonToOpenTool && showSubtabButton) {
						var buttonLabel = strTabLbl ? strTabLbl : 'CRE Request';
						var scr = "require([], function() {window.open('"
								+ strInputSlURL
								+ '&custparam_frombutton=T&custparam_title='
								+ buttonLabel + strParameter
								+ "','_blank'); });";
						scriptContext.form.addButton({
							id : "custpage_cre_open_request_in_tool_button",
							label : buttonLabel,
							functionName : scr
						});
					}
				case scriptContext.UserEventType.EDIT:
					if (!buttonToOpenTool && showSubtabButton) {

						// TODO: remove this auto mode trigger after deployment
						// inputSlLib.creInputAutomated();
						var form = scriptContext.form;
						var objDynamicTab = form.addTab({
							id : 'custpage_cre_tab_suiteletinput',
							label : strTabLbl ? strTabLbl : 'CRE Request'
						});

						var objEmbeddedFld = form.addField({
							id : 'custpage_cre_fld_suiteletinputfld',
							label : 'HTML IFRAME Container',
							type : ui.FieldType.INLINEHTML,
							container : 'custpage_cre_tab_suiteletinput'
						});
						// Put iframe
						objEmbeddedFld.defaultValue = '<iframe name="custpage_cre_iframe_suiteletinput" '
								+ 'src="'
								+ strInputSlURL
								+ '&custparam_hidenavbar=T&ifrmcntnr=T'
								+ strParameter
								+ '" '
								+ 'width="100%" height="600" '
								+ 'frameborder="0" '
								+ 'longdesc="Show input UI to select and submit records"></iframe>';
						break;
					}

				}

				return true;
			}

			return {
				beforeLoad : beforeLoad
			};

		});