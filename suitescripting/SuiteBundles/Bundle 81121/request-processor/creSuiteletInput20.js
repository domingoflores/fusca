//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(
		[ 'N/file', 'N/format', 'N/url', 'N/error', 'N/record', 'N/runtime',
				'N/search', 'N/ui/serverWidget', 'N/task', 'N/redirect',
				'./creSuiteletInput20_lib' ],
		/**
		 * @param {error}
		 *            error
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 * @param {serverWidget}
		 *            serverWidget
		 */
		function(file, format, url, error, record, runtime, search, ui, task,
				redirect, inputSlLib) {

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
			function onRequest(context) {

				// Script Parameter first
				var objCurScript = runtime.getCurrentScript();
				var param_intSearchId = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_searchid'
				});
				var param_formFilterFld = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_formfilter'
				});
				var param_creProfile = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_creprofile'
				});
				var param_creOptionGrp = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_creoptiongrp'
				});
				var param_creRootFlder = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_rootfolder'
				});
				var param_filterFlds = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_filters'
				});
				var param_headerFlds = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_headerfields'
				});
				var param_reqFilterObj = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_sl_reqfilterobj'
				});
				var param_multiple_cre_json = objCurScript.getParameter({
					name : 'custscript_pri_cre_multiple_cre_ids_json'
				});
				var param_parentRecId = '';
				var param_parentRecType = '';

				if (context.request.method === 'GET') {

					// Overwrite by script parameter in standalone mode
					param_intSearchId = context.request.parameters.custparam_searchid ? context.request.parameters.custparam_searchid
							: param_intSearchId;
					param_formFilterFld = context.request.parameters.custparam_formfilter ? context.request.parameters.custparam_formfilter
							: param_formFilterFld;
					param_creProfile = context.request.parameters.custparam_creprofile ? context.request.parameters.custparam_creprofile
							: param_creProfile;
					param_creOptionGrp = context.request.parameters.custparam_creoptiongrp ? context.request.parameters.custparam_creoptiongrp
							: param_creOptionGrp;
					param_creRootFlder = context.request.parameters.custparam_rootfolder ? context.request.parameters.custparam_rootfolder
							: param_creRootFlder;
					param_parentRecId = context.request.parameters.custparam_parentrecid ? context.request.parameters.custparam_parentrecid
							: param_parentRecId;
					param_parentRecType = context.request.parameters.custparam_parentrectype ? context.request.parameters.custparam_parentrectype
							: param_parentRecType;
					param_multiple_cre_json = context.request.parameters.custparam_mult_cre_json ? context.request.parameters.custparam_mult_cre_json
							: param_multiple_cre_json;
					param_filterFlds = context.request.parameters.custparam_filter_flds ? context.request.parameters.custparam_filter_flds
							: param_filterFlds;

					var param_title = context.request.parameters.custparam_title; // Used when opening Suitelet form from Button

					var intPostTaskId = context.request.parameters.custparam_posttaskid;
					var strHideNavBar = context.request.parameters.custparam_hidenavbar;
					var fromButton = context.request.parameters.custparam_frombutton; // Added by MM 2017-09-07

					var form = ui
							.createForm({
								title : (param_title && param_title != 'undefined') ? param_title
										: 'CRE Request Input Utility',
								hideNavBar : (strHideNavBar == 'T') ? true
										: false
							});

					form.clientScriptFileId = './creClientInput20.js';

					// [1.1] Body Fields - Dynamic Filters
					var arrFormFilterFlds = addFormFilterFlds(param_filterFlds,
							context, form);

					// [1.2] Body fields - Inputs
					form.addFieldGroup({
						id : 'custpage_grp_inputs',
						label : 'Inputs'
					});
					var objSrchId = form.addField({
						id : 'custpage_searchid',
						type : ui.FieldType.SELECT,
						source : '-119',
						label : 'Search',
						container : 'custpage_grp_inputs'
					});
					objSrchId.layoutType = ui.FieldLayoutType.NORMAL;
					objSrchId.breakType = ui.FieldBreakType.STARTCOL;
					objSrchId.isMandatory = true;
					if (strHideNavBar == 'T' || fromButton == 'T')
						objSrchId.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
					//MM2018-04-13 begin modification
					//If the paramter for selecting multiple cre's is empty, then show
					//field for selecting any CRE
					if(isEmpty(param_multiple_cre_json)){
						var objCreProfile = form.addField({
							id : 'custpage_creprofile',
							type : ui.FieldType.SELECT,
							label : 'CRE Profile',
							source : 'customrecord_pri_cre_profile',
							container : 'custpage_grp_inputs'
						});
						objCreProfile.isMandatory = true;

						if (strHideNavBar == 'T' || fromButton == 'T')
							objCreProfile.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
					}
					else{//else build select options from the script parameter JSON
						var objCreProfile = form.addField({
							id : 'custpage_creprofile',
							type : ui.FieldType.SELECT,
							label : 'CRE Profile',
							container : 'custpage_grp_inputs'
						});
						var selectOptionsJson=JSON.parse(decodeURIComponent(param_multiple_cre_json));

						for(var i=0; i<selectOptionsJson.length; i++){
							objCreProfile.addSelectOption({
								value : selectOptionsJson[i].id,
								text : selectOptionsJson[i].name,
							});
						}
						objCreProfile.isMandatory = true;
					}
					//MM2018-04-13 end modification
					
					var objCreOptionGrp = form.addField({
						id : 'custpage_creoptiongrp',
						type : ui.FieldType.SELECT,
						label : 'Target CRE Option Group',
						source : 'customrecord_pri_cre_request_option_grp',
						container : 'custpage_grp_inputs'
					});
					if (strHideNavBar == 'T' || fromButton == 'T')
						objCreOptionGrp.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
					var objRootFolder = form.addField({
						id : 'custpage_rootfolder',
						type : ui.FieldType.TEXT,
						label : 'Root Folder',
						container : 'custpage_grp_inputs'
					});
					if (strHideNavBar == 'T' || fromButton == 'T')
						objRootFolder.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
					var objFormFilterFldId = form.addField({
						id : 'custpage_formfilter',
						type : ui.FieldType.TEXT,
						label : 'Form Filter Field',
						container : 'custpage_grp_inputs'
					});
					if (strHideNavBar == 'T' || fromButton == 'T')
						objFormFilterFldId.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
					var objParentRecId = form.addField({
						id : 'custpage_parentrecid',
						type : ui.FieldType.INTEGER,
						label : 'Parent Record Id',
						container : 'custpage_grp_inputs'
					});
					var objParentRecType = form.addField({
						id : 'custpage_parentrectype',
						type : ui.FieldType.TEXT,
						label : 'Parent Record Type',
						container : 'custpage_grp_inputs'
					});
					if (strHideNavBar == 'T' || fromButton == 'T') {

						objParentRecId.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						objParentRecType.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
					}

					var objHideNavBar = form.addField({
						id : 'custpage_hidenavbar',
						type : ui.FieldType.TEXT,
						label : 'Hide Nav Bar?',
						container : 'custpage_grp_inputs'
					}).updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});

					// Added by MM: 2017-09-11
					var objFromButton = form.addField({
						id : 'custpage_frombutton',
						type : ui.FieldType.TEXT,
						label : 'From Button',
						container : 'custpage_grp_inputs'
					}).updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					var objFormTitle = form.addField({
						id : 'custpage_title',
						type : ui.FieldType.TEXT,
						label : 'Form Title',
						container : 'custpage_grp_inputs'
					}).updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					// End Added by MM
					
					// Added by MM: 2018-02-13: Allows building dropdown options for selecting CRE profile 
					var objMultipleCREs = form.addField({
						id : 'custpage_multiple_cre',
						type : ui.FieldType.LONGTEXT,
						label : 'Multiple CREs'
					});
					objMultipleCREs.defaultValue = param_multiple_cre_json;
					objMultipleCREs.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					// End Added by MM

					var objTaskStatusTxt = form.addField({
						id : 'custpage_taskstatustxt',
						type : ui.FieldType.TEXT,
						label : 'Task Current Status',
						container : 'custpage_grp_inputs'
					}).updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					if (intPostTaskId) {
						var objStatus = task.checkStatus(intPostTaskId);
						objTaskStatusTxt.defaultValue = objStatus.status;
					}

					// [1.3] Body fields - Added Request Header Fields
					addFormReqHeaderFlds(form, param_headerFlds, context);

					var strUsageNote = form.addField({
						id : 'custpage_usagenote',
						type : ui.FieldType.TEXTAREA,
						label : 'Note:',
						container : 'custpage_grp_inputs'
					}).updateDisplayType({
						displayType : ui.FieldDisplayType.INLINE
					});
					if (strHideNavBar == 'T' || fromButton == 'T')
						strUsageNote.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
					strUsageNote.breakType = ui.FieldBreakType.STARTCOL;
					strUsageNote.defaultValue = '1. Fill in or Update Search ID.<br>\r'
							+ '2. Select records and hit "Submit" to create CRE Request Header and Detail.<br>\r'
							+ '3. View <a href="/app/common/media/mediaitemfolders.nl?sortcol=sortdate&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&filetype=DOCUMENT&folder='
							+ param_creRootFlder
							+ '" target="_blank">saved file requests</a> under Processing folder.';

					// Set Body fields default values
					objCreProfile.defaultValue = param_creProfile;
					objCreOptionGrp.defaultValue = param_creOptionGrp;
					objRootFolder.defaultValue = parseInt(param_creRootFlder)
							.toFixed(0);
					objFormFilterFldId.defaultValue = param_formFilterFld;
					objParentRecId.defaultValue = param_parentRecId;
					objParentRecType.defaultValue = param_parentRecType;
					objHideNavBar.defaultValue = strHideNavBar;
					objFromButton.defaultValue = fromButton; // Added by MM: 2017-09-11
					objFormTitle.defaultValue = param_title; // Added by MM: 2017-09-11

					// [2] Tab & Sublist 1
					form.addTab({
						id : 'custpage_sl_tab_selectrecord',
						label : 'Select Record(s)'
					});
					var objSelectSublist = form.addSublist({
						id : 'custpage_sl_selectrecord',
						label : 'Select Record(s)',
						tab : 'custpage_sl_tab_selectrecord',
						type : ui.SublistType.LIST
					});
					objSelectSublist.addMarkAllButtons();
					objSelectSublist.addField({
						id : 'custpage_select',
						label : 'Select',
						type : ui.FieldType.CHECKBOX
					});
					objSelectSublist.addField({
						id : 'custpage_hide_internalid',
						label : 'InternalID',
						type : ui.FieldType.TEXT
					});
					objSelectSublist.addField({
						id : 'custpage_hide_recordtype',
						label : 'RecordType',
						type : ui.FieldType.TEXT
					});

					log.debug('Get request', 'runtime: '
							+ runtime.getCurrentUser().email
							+ '. param_intSearchId: ' + param_intSearchId);

					// [3] Put default values
					if (param_intSearchId) {

						objSrchId.defaultValue = param_intSearchId;
						var objControlSrch = search.load({
							id : param_intSearchId
						});

						// [3.1] Apply filtering: filter field(s)
						if (param_filterFlds && arrFormFilterFlds) {

							for (var i = 0; i < arrFormFilterFlds.length; i++) {

								var objFormFilterFlds = arrFormFilterFlds[i];

								if (!objFormFilterFlds.defaultValue || objFormFilterFlds.defaultValue=='-1') //-1 condition added by MM on 2018-02-16: to not filter when select option value is -1 (empty selection)
									continue;

								// Special/Advance formula approach
								if (objFormFilterFlds.formula
										&& objFormFilterFlds.formula.toString()
												.indexOf('{%VALUE%}') != -1) {
									objFormFilterFlds.formula = objFormFilterFlds.formula
											.toString()
											.replace(
													'{%VALUE%}',
													objFormFilterFlds.defaultValue);
									objFormFilterFlds.formula = decodeURIComponent(objFormFilterFlds.formula);
									objFormFilterFlds.defaultValue = objFormFilterFlds.formula_defaultValue;
								}

								var objFilter_tmp = search
										.createFilter({
											name : objFormFilterFlds.id,
											join : objFormFilterFlds.join ? objFormFilterFlds.join
													: '',
											operator : objFormFilterFlds.operator,
											values : (objFormFilterFlds.operator == 'anyof') ? [ objFormFilterFlds.defaultValue ]
													: objFormFilterFlds.defaultValue,
											formula : objFormFilterFlds.formula ? objFormFilterFlds.formula
													: '',
											summary : objFormFilterFlds.summary ? objFormFilterFlds.summary
													: null
										});
								objControlSrch.filters.push(objFilter_tmp);
							}
						}

						// [3.2] Apply filtering: filter field and parent rec id
						if (param_formFilterFld && param_parentRecId) {
							// Addition by MM on 2017-09-01 to allow join criteria
							var childKeyField = param_formFilterFld;
							var childKeyFieldArray = param_formFilterFld
									.split('.');
							var childKeyFieldJoin = null;
							if (childKeyFieldArray.length == 2) {
								childKeyField = childKeyFieldArray[1];
								childKeyFieldJoin = childKeyFieldArray[0];
							}
							log.audit('childKeyField, childKeyFieldJoin',
									childKeyField + ', ' + childKeyFieldJoin);
							// MM 2017.09.01 - end of code added

							// objControlSrch.add
							var objParentFilter = search.createFilter({
								name : childKeyField,
								join : childKeyFieldJoin,
								operator : search.Operator.ANYOF,
								values : [ param_parentRecId ],
							});
							objControlSrch.filters.push(objParentFilter);
						}

						var arrResultSets = objControlSrch.run().getRange(0,
								1000);

						// API: Result.recordType, Result.id, Result.columns
						if (arrResultSets && arrResultSets.length > 0) {

							// Create sublist columns
							for (var i = 0; i < arrResultSets[0].columns.length; i++) {

								var objCol = arrResultSets[0].columns[i];

								// Supported formula and join, workaround: NS
								// not support objCol.type
								objSelectSublist.addField({
									id : 'custpage_' + objCol.name + '_' + i,
									label : objCol.label,
									type : ui.FieldType.TEXT
								});
							}
						}

						// Set Value to sublist
						for (var i = 0; arrResultSets
								&& i < arrResultSets.length; i++) {

							if (!arrResultSets[i].id)
								continue;

							// Set internal id and record type column
							objSelectSublist.setSublistValue({
								id : 'custpage_hide_internalid',
								line : i,
								value : arrResultSets[i].id
							});
							objSelectSublist.setSublistValue({
								id : 'custpage_hide_recordtype',
								line : i,
								value : arrResultSets[i].recordType
							});

							for (var colIdx = 0; colIdx < arrResultSets[i].columns.length; colIdx++) {

								var objColTmp = arrResultSets[i].columns[colIdx];
								//
								var strTmpText = arrResultSets[i].getText({
									name : objColTmp.name,
									join : objColTmp.join
								});
								// consider join columns
								var strOrgValue = arrResultSets[i].getValue({
									name : objColTmp.name,
									join : objColTmp.join
								});
								var strTmpValue = strTmpText ? strTmpText
										: (strOrgValue ? strOrgValue : ' ');

								if (strTmpValue && strTmpValue.length > 300)
									strTmpValue = strTmpValue.substring(0, 300);

								objSelectSublist.setSublistValue({
									id : 'custpage_' + objColTmp.name + '_'
											+ colIdx,
									line : i,
									value : strTmpValue
								});
							}
						}
					}

					// [2] Tab & Sublist 2
					form.addTab({
						id : 'custpage_sl_tab_view',
						label : 'View Previous Requests'
					});
					var objViewSublist = form.addSublist({
						id : 'custpage_sl_viewinputheader',
						label : 'View Previous Requests',
						tab : 'custpage_sl_tab_view',
						type : ui.SublistType.LIST
					});
					objViewSublist.addField({
						id : 'custpage_cre_request_header_id',
						label : 'ID',
						type : ui.FieldType.TEXT
					});
					objViewSublist.addField({
						id : 'custpage_cre_request_datecreated',
						label : 'Date',
						type : ui.FieldType.TEXT
					});
					objViewSublist.addField({
						id : 'custpage_cre_request_header_status',
						label : 'Status',
						type : ui.FieldType.TEXT,
					});
					objViewSublist.addField({
						id : 'custpage_cre_request_downloadzip',
						label : 'Download Zip',
						type : ui.FieldType.URL
					}).linkText = 'Download Zip';

					objViewSublist.addField({
						id : 'custpage_cre_request_outputdoc',
						label : 'Output Doc',
						type : ui.FieldType.TEXT
					});
					objViewSublist.addField({
						id : 'custpage_cre_request_outputfolder',
						label : 'Output Folder',
						type : ui.FieldType.TEXTAREA
					});
					objViewSublist.addField({
						id : 'custpage_cre_request_countofrecords',
						label : '# of Records',
						type : ui.FieldType.INTEGER
					});

					objViewSublist.addField({
						id : 'custpage_cre_request_header_notes',
						label : 'Processing Notes',
						type : ui.FieldType.TEXTAREA
					});

					// TODO: Prodege want to ignore this owner filter; we need
					// parameter to control this
					if (param_reqFilterObj) {

						eval(param_reqFilterObj);

					} else {

						var arrPreviousFilters = [ search.createFilter({
							name : 'owner',
							operator : search.Operator.ANYOF,
							values : [ runtime.getCurrentUser().id, '-4' ]
						}) ];

						if (param_parentRecId && param_parentRecType)
							arrPreviousFilters
									.push(search
											.createFilter({
												name : 'custrecord_pri_cre_request_header_meta',
												operator : search.Operator.CONTAINS,
												values : '"parentRecord":"'
														+ param_parentRecType
														+ '|'
														+ param_parentRecId
														+ '"'
											}));
					}
					log.debug('onRequest - arrPreviousFilters:', JSON
							.stringify(arrPreviousFilters));

					// Put values to sublist 2
					var arrHeaderResults = search.create({
						type : 'customrecord_pri_cre_request_header',
						filters : arrPreviousFilters,
						columns : [ search.createColumn({
							name : 'created',
							sort : 'DESC',
							summary : 'MIN'
						}), search.createColumn({
							name : 'internalid',
							summary : 'GROUP'
						}), search.createColumn({
							name : 'custrecord_pri_cre_request_header_status',
							summary : 'MIN'
						}), search.createColumn({
							name : 'custrecord_pri_cre_request_header_zlink',
							summary : 'MIN'
						}), search.createColumn({
							name : 'custrecord_pri_cre_request_header_doc',
							summary : 'MIN'
						}), search.createColumn({
							name : 'custrecord_pri_cre_request_folder',
							summary : 'MIN'
						}), search.createColumn({
							name : 'custrecord_pri_cre_request_folder_link',
							summary : 'MIN'
						}), search.createColumn({
							name : 'internalid',
							join : 'custrecord_pri_cre_request_header',
							summary : 'COUNT'
						}), search.createColumn({
							name : 'custrecord_pri_cre_request_header_notes',
							summary : 'MIN'
						}) ]
					}).run().getRange({
						start : 0,
						end : 999
					});
					for (var i = 0; arrHeaderResults
							&& i < arrHeaderResults.length; i++) {

						objViewSublist
								.setSublistValue({
									id : 'custpage_cre_request_header_id',
									line : i,
									value : '<a class="dottedlink" href="'
											+ url
													.resolveRecord({
														recordType : 'customrecord_pri_cre_request_header',
														recordId : arrHeaderResults[i]
																.getValue({
																	name : 'internalid',
																	summary : 'GROUP'
																})
													}) + '" target="_blank">'
											+ arrHeaderResults[i].getValue({
												name : 'internalid',
												summary : 'GROUP'
											}) + '</a>'
								});

						objViewSublist.setSublistValue({
							id : 'custpage_cre_request_datecreated',
							line : i,
							value : arrHeaderResults[i].getValue({
								name : 'created',
								summary : 'MIN'
							})
						});
						objViewSublist
								.setSublistValue({
									id : 'custpage_cre_request_downloadzip',
									line : i,
									value : arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_header_zlink',
												summary : 'MIN'
											}) ? arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_header_zlink',
												summary : 'MIN'
											})
											: null
								});

						objViewSublist
								.setSublistValue({
									id : 'custpage_cre_request_outputdoc',
									line : i,
									value : arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_header_doc',
												summary : 'MIN'
											}) ? '<a class="dottedlink" href="'
											+ file
													.load({
														id : search
																.lookupFields({
																	type : 'customrecord_pri_cre_request_header',
																	id : arrHeaderResults[i]
																			.getValue({
																				name : 'internalid',
																				summary : 'GROUP'
																			}),
																	columns : 'custrecord_pri_cre_request_header_doc'
																})['custrecord_pri_cre_request_header_doc'][0].value
													}).url
											+ '" target="_blank">'
											+ arrHeaderResults[i]
													.getValue({
														name : 'custrecord_pri_cre_request_header_doc',
														summary : 'MIN'
													}) + '</a>'
											: null
								});

						objViewSublist
								.setSublistValue({
									id : 'custpage_cre_request_outputfolder',
									line : i,
									value : arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_folder_link',
												summary : 'MIN'
											}) ? '<a class="dottedlink" href="'
											+ arrHeaderResults[i]
													.getValue({
														name : 'custrecord_pri_cre_request_folder_link',
														summary : 'MIN'
													})
											+ '" target="_blank">Folder Link</a>'
											: null
								});
						objViewSublist.setSublistValue({
							id : 'custpage_cre_request_countofrecords',
							line : i,
							value : arrHeaderResults[i].getValue({
								name : 'internalid',
								join : 'custrecord_pri_cre_request_header',
								summary : 'COUNT'
							})
						});

						objViewSublist
								.setSublistValue({
									id : 'custpage_cre_request_header_status',
									line : i,
									value : arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_header_status',
												summary : 'MIN'
											})
								});
						objViewSublist
								.setSublistValue({
									id : 'custpage_cre_request_header_notes',
									line : i,
									value : arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_header_notes',
												summary : 'MIN'
											}) ? arrHeaderResults[i]
											.getValue({
												name : 'custrecord_pri_cre_request_header_notes',
												summary : 'MIN'
											})
											: ' '
								});
					}

					form.addButton({
						id : 'custpage_btn_refresh',
						label : 'Refresh',
						functionName : 'btn_refresh_Click()'
					});
					form.addSubmitButton({
						label : 'Submit'
					});
					context.response.writePage(form);

				} 
				//Action on POST
				else {
					var request = context.request;
					// [1] Get search template
					var intSearchId = request.parameters.custpage_searchid;
					var intCreProfile = request.parameters.custpage_creprofile;
					var intCreOptionGrp = request.parameters.custpage_creoptiongrp;
					var intRootFolder = request.parameters.custpage_rootfolder;
					var strFormFilter = request.parameters.custpage_formfilter;
					var strParentType = request.parameters.custpage_parentrectype;
					var intParentId = request.parameters.custpage_parentrecid;
					var strFiltersData = request.parameters.custpage_filters_data;
					var fromButton = request.parameters.custpage_frombutton;
					var param_title = request.parameters.custpage_title;
					var strFieldsData = request.parameters.custpage_fields_data;
					var multSelectCRE = request.parameters.custpage_multiple_cre;

					log.debug('Submit Search Info', 'intSearchId: '
							+ intSearchId);

					// [1.2] Set value from dynamic header fields
					var objCreRequestInput = setFieldDatatoObj(strFieldsData,
							request);
					objCreRequestInput.intSearchId = intSearchId;
					objCreRequestInput.formFilterFld = strFormFilter;
					if (strParentType && intParentId)
						objCreRequestInput.custrecord_pri_cre_request_header_meta = JSON
								.stringify({
									parentRecord : strParentType + '|'
											+ intParentId
								});
					objCreRequestInput.creProfile = intCreProfile;
					objCreRequestInput.creOptionGrp = intCreOptionGrp;
					objCreRequestInput.creRootFlder = intRootFolder;
					objCreRequestInput.detail = new Array();

					// [2] deal with selected lines
					var intLineCount = request.getLineCount({
						group : 'custpage_sl_selectrecord'
					});
					log.debug('Submit sublist Info', 'intLineCount: '
							+ intLineCount);
					var objConvertRecType = {};
					for (var lineIdx = 0; lineIdx < intLineCount; lineIdx++) {

						var objSelectedRecInfo = {};
						var strTempSelect = request.getSublistValue({
							group : 'custpage_sl_selectrecord',
							name : 'custpage_select',
							line : lineIdx
						});
						if (strTempSelect == 'T') {

							var strLoadRecType = request.getSublistValue({
								group : 'custpage_sl_selectrecord',
								name : 'custpage_hide_recordtype',
								line : lineIdx
							});
							var intRecId = request.getSublistValue({
								group : 'custpage_sl_selectrecord',
								name : 'custpage_hide_internalid',
								line : lineIdx
							});

							objSelectedRecInfo.strLoadRecType = strLoadRecType;
							objSelectedRecInfo.strRecId = intRecId;

							// Convert loadable record type to record type text
							var strRecType = objConvertRecType[strLoadRecType];
							if (!strRecType) {
								strRecType = inputSlLib
										.convertRecordTypeFldValToId(
												strLoadRecType, intRecId);
								objConvertRecType[strLoadRecType] = strRecType;
							}
							objSelectedRecInfo.strRecType = strRecType;

							objCreRequestInput.detail.push(objSelectedRecInfo);
						}
					}

					// [3] Store selected value to file
					var intFileId = inputSlLib
							.storeCreRequestInputFile(objCreRequestInput);

					// [4] post schedule/task: Save to record type
					var intScriptTaskId = inputSlLib
							.postCreateTaskByFile(intFileId);

					var objParameters = {
						selectedtab : 'custpage_sl_tab_view',
						custparam_hidenavbar : context.request.parameters.custpage_hidenavbar,
						custparam_posttaskid : intScriptTaskId,
						custparam_searchid : intSearchId,
						custparam_formfilter : strFormFilter,
						custparam_creprofile : intCreProfile,
						custparam_creoptiongrp : intCreOptionGrp,
						custparam_rootfolder : intRootFolder,
						custparam_parentrecid : intParentId,
						custparam_parentrectype : strParentType,
						custparam_frombutton : fromButton,
						custparam_title : param_title,
						custparam_filter_flds : strFiltersData,
						custparam_mult_cre_json : multSelectCRE
					};

					// [5.1] Filters
					var arrFormFilterFlds = strFiltersData ? JSON
							.parse(strFiltersData) : '';

					log.debug('arrFormFilterFlds: ', JSON
							.stringify(arrFormFilterFlds));
					for (var i = 0; arrFormFilterFlds
							&& i < arrFormFilterFlds.length; i++) {

						if (arrFormFilterFlds[i].defaultValue)
							objParameters[arrFormFilterFlds[i].formid] = arrFormFilterFlds[i].defaultValue;
					}

					// [5.2] Redirection to view page
					redirect.toSuitelet({

						scriptId : 'customscript_pri_cre_input_suitelet',
						deploymentId : 'customdeploy_pri_cre_input_suitelet',
						parameters : objParameters
					});
				}
			}

			/**
			 * Add Body Fields - Dynamic Filters
			 * 
			 * @param {string}
			 *            param_formFilterFld
			 * @param {object}
			 *            context
			 * @param {object}
			 *            form
			 * @returns {array} arrFormFilterFlds
			 */
			function addFormFilterFlds(param_formFilterFld, context, form) {

				var objUrlFld = form.addField({
					id : 'custpage_urlforrestart',
					type : ui.FieldType.TEXT,
					label : 'URL for Restart'
				});
				objUrlFld.updateDisplayType({
					displayType : ui.FieldDisplayType.HIDDEN
				});
				objUrlFld.defaultValue = url.resolveScript({
					scriptId : runtime.getCurrentScript().id,
					deploymentId : runtime.getCurrentScript().deploymentId
				});

				var arrFormFilterFlds = null;
				if (param_formFilterFld) {

					var objFilterGroup = form.addFieldGroup({
						id : 'custpage_grp_filters',
						label : 'Filters'
					});
					objFilterGroup.isCollapsible = true;
					var objFiltersData = form.addField({
						id : 'custpage_filters_data',
						type : ui.FieldType.LONGTEXT,
						label : 'Filters Data'
					});
					objFiltersData.defaultValue = param_formFilterFld;
					objFiltersData.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});

					arrFormFilterFlds = JSON.parse(param_formFilterFld);
					for (var i = 0; i < arrFormFilterFlds.length; i++) {

						var objFormFilterFldId = form
								.addField({
									id : arrFormFilterFlds[i].formid,
									type : arrFormFilterFlds[i].type,
									source : (arrFormFilterFlds[i].source ? arrFormFilterFlds[i].source
											: null),
									label : arrFormFilterFlds[i].label,
									container : 'custpage_grp_filters'
								});
						if (arrFormFilterFlds[i].source)
							objFormFilterFldId.source = arrFormFilterFlds[i].source;

						if (arrFormFilterFlds[i].savedsearch) {
							var objSrchRes_fld = search.load({
								id : arrFormFilterFlds[i].savedsearch
							}).run().getRange(0, 999);

							if (objSrchRes_fld)
								objFormFilterFldId.addSelectOption({
									value : " ",
									text : '&nbsp;'
								});
							for (var srchIdx = 0; objSrchRes_fld
									&& srchIdx < objSrchRes_fld.length; srchIdx++) {
								objFormFilterFldId
										.addSelectOption({
											value : objSrchRes_fld[srchIdx]
													.getValue(objSrchRes_fld[srchIdx].columns[0]),
											text : objSrchRes_fld[srchIdx]
													.getValue(objSrchRes_fld[srchIdx].columns[1])
										});
							}
						}
						
						//Begin add by MM: 2018-02-16: To allow defining select options in script parameter (this approach
						//can be significantly faster than the saved search approach immediately above)
						if(arrFormFilterFlds[i].selectoptions) {
							//begin by defining the empty option
							objFormFilterFldId.addSelectOption({
								value : "-1",
								text : '&nbsp;'
							});
							for(n in arrFormFilterFlds[i].selectoptions){
								objFormFilterFldId.addSelectOption({
									value : arrFormFilterFlds[i].selectoptions[n].id,
									text : arrFormFilterFlds[i].selectoptions[n].name
								});
							}
						}
						//End add by MM: 2018-02-16

						if (arrFormFilterFlds[i].displayType)
							objFormFilterFldId.updateDisplayType({
								displayType : arrFormFilterFlds[i].displayType
							});
						if (arrFormFilterFlds[i].breakType)
							objFormFilterFldId.breakType = arrFormFilterFlds[i].breakType;

						if (arrFormFilterFlds[i].defaultValue)
							objFormFilterFldId.defaultValue = arrFormFilterFlds[i].defaultValue;

						var param_fldVal = context.request.parameters[arrFormFilterFlds[i].formid];
						//MM2018-03-08: IF/ELSE condition added: To ensure that when an available filter
						//              is removed it doesn't come back when the page refreshes 
						if (param_fldVal) {
							objFormFilterFldId.defaultValue = param_fldVal;
						}
						else objFormFilterFldId.defaultValue = '';

						// Set back form filter field values
						arrFormFilterFlds[i].defaultValue = objFormFilterFldId.defaultValue;
					}

					objFiltersData.defaultValue = JSON
							.stringify(arrFormFilterFlds);
				}

				return arrFormFilterFlds;
			}

			/**
			 * Add Request Header Fields
			 * 
			 * @param {object}
			 *            SuiteLet Form
			 * @param {string}
			 *            param_formFld Request Header Fields from script
			 *            parameter
			 * @param {object}
			 *            context
			 */
			function addFormReqHeaderFlds(objForm, param_formFld, context) {

				var arrFormFlds = null;
				if (param_formFld) {

					var objFieldsData = objForm.addField({
						id : 'custpage_fields_data',
						type : 'longtext',
						label : 'Fields Data',
						container : 'custpage_grp_inputs'
					});
					objFieldsData.defaultValue = param_formFld;
					objFieldsData.updateDisplayType({
						displayType : 'hidden'
					});

					arrFormFlds = JSON.parse(param_formFld);
					for (var i = 0; i < arrFormFlds.length; i++) {

						var objFormFilterFldId = objForm
								.addField({
									id : arrFormFlds[i].formid,
									type : arrFormFlds[i].type,
									source : (arrFormFlds[i].source ? arrFormFlds[i].source
											: null),
									label : arrFormFlds[i].label,
									container : 'custpage_grp_inputs'
								});
						if (arrFormFlds[i].source)
							objFormFilterFldId.source = arrFormFlds[i].source;

						if (arrFormFlds[i].savedsearch) {
							var objSrchRes_fld = search.load({
								id : arrFormFlds[i].savedsearch
							}).run().getRange(0, 999);

							if (objSrchRes_fld)
								objFormFilterFldId.addSelectOption({
									value : " ",
									text : '&nbsp;'
								});
							for (var srchIdx = 0; objSrchRes_fld
									&& srchIdx < objSrchRes_fld.length; srchIdx++) {
								objFormFilterFldId
										.addSelectOption({
											value : objSrchRes_fld[srchIdx]
													.getValue(objSrchRes_fld[srchIdx].columns[0]),
											text : objSrchRes_fld[srchIdx]
													.getValue(objSrchRes_fld[srchIdx].columns[1])
										});
							}
						}

						if (arrFormFlds[i].displayType)
							objFormFilterFldId.updateDisplayType({
								displayType : arrFormFlds[i].displayType
							});
						if (arrFormFlds[i].breakType)
							objFormFilterFldId.breakType = arrFormFlds[i].breakType;

						try {
							if (arrFormFlds[i].defaultValue) {
								switch (arrFormFlds[i].type) {
								case 'checkbox':
									if (arrFormFlds[i].defaultValue == 'T'
											|| arrFormFlds[i].defaultValue == 'true')
										objFormFilterFldId.defaultValue = 'T';
									else
										objFormFilterFldId.defaultValue = 'F';

									break;
								case 'date':
									objFormFilterFldId.defaultValue = format
											.format({
												value : arrFormFlds[i].defaultValue,
												type : format.Type.DATE
											});

									break;
								case 'datetimetz':
									objFormFilterFldId.defaultValue = format
											.format({
												value : arrFormFlds[i].defaultValue,
												type : format.Type.DATETIMETZ
											});

									break;
								default:
									objFormFilterFldId.defaultValue = eval(arrFormFlds[i].defaultValue);
									break;
								}
							}
						} catch (ex) {
							log.audit('creSuiteletInput20.defaultValue Error',
									JSON.stringify(ex));
						}

						if (arrFormFlds[i].isMandatory == 'T')
							objFormFilterFldId.isMandatory = true;

						var param_fldVal = context.request.parameters[arrFormFlds[i].formid];
						if (param_fldVal) {
							objFormFilterFldId.defaultValue = param_fldVal;
						}

						// Set back form filter field values
						arrFormFlds[i].defaultValue = objFormFilterFldId.defaultValue;
					}

					objFieldsData.defaultValue = JSON.stringify(arrFormFlds);
				}

				return objForm;
			}

			/**
			 * Set objCreRequestInput with {id: value} pair, parepare to submit
			 * to file, then to schedule for Request Header record
			 * 
			 * @param {string}
			 *            strFieldsData
			 * @param {object}
			 *            request
			 */
			function setFieldDatatoObj(strFieldsData, request) {

				var objCreRequestInput = {};
				if (strFieldsData) {

					var arrFormFlds = JSON.parse(strFieldsData);
					for (var i = 0; i < arrFormFlds.length; i++) {
						objCreRequestInput[arrFormFlds[i].id] = request.parameters[arrFormFlds[i].formid];
					}
				}

				return objCreRequestInput;
			}
			function isEmpty(val) {
				return (val == undefined || val == null || val == '');	
			}

			return {
				onRequest : onRequest
			};

		});