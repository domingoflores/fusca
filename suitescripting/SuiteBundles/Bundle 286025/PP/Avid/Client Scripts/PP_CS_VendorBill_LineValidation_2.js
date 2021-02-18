/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define([
	'N/record',
	'N/log',
	'N/runtime'
	],
	function(record, log, runtime) {

		function pageInit(context) {
			try{
				var curRec = context.currentRecord;
				var subId = context.sublistId;
				var user = runtime.getCurrentUser();
				log.debug({
					title: 'start pageInit'
				});
				var mapLineToLine = user.getPreference({
					name: 'custscript_pp_enable_dist_line_map'
				});
				var mapHeaderToLine = user.getPreference({
					name: 'custscript_pp_enable_header_to_line_map'
				});
				log.debug({
					title: 'pageInit mapHeaderToLine/mapLineToLine',
					details: mapHeaderToLine + ' / ' + mapLineToLine
				});

				if (mapHeaderToLine == 'T' || mapLineToLine == 'T') {
					var tcDesc = curRec.getValue({
						fieldId: 'custpage_tdcesc_field'
					});
					log.debug({
						title: 'tcDesc',
						details: tcDesc
					});

					var types = ['expense', 'item'];
				 	for (var a = 0; a < types.length; a++) {
						var lineCount = curRec.getLineCount({
							sublistId: types[a]
						});
						log.debug({
							title: types[a],
							details: lineCount
						});
				 		if (lineCount > 0) {
				 			for (var b = 0; b < lineCount; b++) {
								var line = curRec.selectLine({
									sublistId: types[a],
									line: b
								});
								var amount = curRec.getCurrentSublistValue({
									sublistId: types[a],
									fieldId: 'amount'
								});
								log.debug({
									title: "amount check",
									details: amount
								});
								if (amount != null && amount != '') {
									log.debug({
										title: 'pageInit',
										details: 'There is an amount value, but no taxcode yet.'
									});
									curRec.commitLine({
										sublistId: types[a]
									});
								}
				 			}
				 		}
				 	}
				}
			}catch(ex) {
				log.error({
					title: "Error in pageInit",
					details: ex.message
				});
			}
		}
		function validateLine(context) {
			try {
				var curRec = context.currentRecord;
				var subId = context.sublistId;
				var user = runtime.getCurrentUser();
				log.debug({
					title: 'user',
					details: user
				});
				var mapLineToLine = user.getPreference({
					name: 'custscript_pp_enable_dist_line_map'
				});
				var mapHeaderToLine = user.getPreference({
					name: 'custscript_pp_enable_header_to_line_map'
				});
				log.debug({
					title: 'mapHeaderToLine/mapLineToLine',
					details: mapHeaderToLine + ' / ' + mapLineToLine
				});

				if (mapHeaderToLine == true || mapLineToLine == true || mapHeaderToLine == 'T' || mapLineToLine == 'T') {
					var taxCode = curRec.getCurrentSublistValue({
						sublistId: subId,
						fieldId: 'taxcode'
					});
					log.debug({
						title: 'tax code',
						details: taxCode
					});
					if (taxCode != '' && taxCode != undefined && taxCode != null) {
						curRec.setCurrentSublistValue({
							sublistId: subId,
							fieldId: 'taxcode',
							value: taxCode,
							ignoreFieldChange: false 
						});
						var amount = curRec.getCurrentSublistValue({
							sublistId: subId,
							fieldId: 'amount'
						});
						curRec.setCurrentSublistValue({
							sublistId: subId,
							fieldId: 'amount',
							value: amount
						});
					}
				}
				return true;

			} catch (ex) {
				log.error({
					title: 'Error in validateLine',
					details: ex.message
				});
			}
		}

		return {
			pageInit: pageInit,
			validateLine: validateLine
		}
	});