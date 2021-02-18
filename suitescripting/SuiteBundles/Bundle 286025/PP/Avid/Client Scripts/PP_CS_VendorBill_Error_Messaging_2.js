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
		function fieldChanged(context) { 
			try {
				if (context.fieldId == 'custbody_pp_afn_error') {
					var curRec = context.currentRecord;
					var errorText = curRec.getValue('custbody_pp_afn_error');
				}
			} catch(ex) {
				log.error({
					title: 'Error in fieldChange',
					details: ex.message
				});
			}
		}

		function pageInit(context) {
			try{
				var type = context.mode;
				if (type == 'create') {
					var curRec = context.currentRecord;
					var script = runtime.getCurrentScript();
					var mapHeaderToLine = script.getParameter({
						name: 'custscript_pp_enable_header_to_line_map'
					});
					var mapLineToLine = script.getParameter({
						name: 'custscript_pp_enable_dist_line_map'
					});
					var mapHeaderToHeader = script.getParameter({
						name: 'custscript_pp_enable_hdr_fld_map'
					});

					var isOneWorld = runtime.isFeatureInEffect({
						feature: 'SUBSIDIARIES'
					});
					if (mapHeaderToLine == true || mapLineToLine == true) {
						var tcDesc = curRec.getValue({
							fieldId: 'custpage_tcdesc_field'
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
					  	  	if (lineCount > 0) {
						  	  	for (var b = 1; b <= lineCount; b++) {
						  	  		curRec.selectLine({
						  	  			sublistId: types[a],
						  	  			line: b
						  	  		});
						  	  		var amount = curRec.getCurrentSublistValue({
						  	  			sublistId: types[a],
						  	  			fieldId: 'amount'
						  	  		});
								     if (amount != null && amount != '') {
								     	log.debug({
								     		title: 'pageInit',
								     		details: 'There is an amount value, but no tax code yet. Not doing anything further for now.'
								     	});
								     	curRec.commitLine({
								     		sublistId: types[a]
								     	});
								     	log.debug({
								     		title: 'Done recomitting line',
								     		details: b
								     	});
								    }
						  	  	}
							}
						}
						var errorText = curRec.getValue({
							fieldId: 'custbody_pp_afn_error'
						});
						if (errorText != '' && errorText != null) {
							alert(errorText);
						}
					}
				}
			} catch(ex) {
				log.error({
					title: 'Error in pageInit',
					details: ex.message
				});
			}
		}

		

		return {
			fieldChanged: fieldChanged,
			pageInit: pageInit
		}
	});