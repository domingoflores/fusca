/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
 define([
	'N/record',
	'N/log',
	'N/runtime',
	'N/ui/serverWidget',
	'N/search'
	],

	function(record, log, runtime, ui, search) {
		function beforeLoad(context) {
			try {
				var isOneWorld = runtime.isFeatureInEffect({
					feature: 'SUBSIDIARIES'
				});

				if (!isOneWorld) {
					var field = context.form.getField({
						id: 'custrecord_pp_subsid_list'
					});
					field.updateDisplayType({
						displayType: ui.FieldDisplayType.HIDDEN
					});
				}
			} catch(ex) {
				log.error({
					title: 'Error in beforeLoad',
					details: ex.message
				});
			}
		}

		function beforeSubmit(context) {
			//this will add a subsidiary list beforeSubmit
			try {
				if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT) {
					var rec = context.newRecord;
					var vendor = rec.getValue({
						fieldId: 'custrecord_ai_inv_vendor'
					});
					if (vendor != null && vendor != '') {
						var subSearch = search.create({
							type: search.Type.VENDOR,
							filters: [{
								name: 'internalid',
								operator: 'anyof',
								values: [vendor]
							}, 
							{	
								name: 'isinactive',
								join: 'msesubsidiary',
								operator: 'is',
								values: false
							}
							],
							columns: [{
								name: 'internalid'
							}, {
								name: 'internalid',
								join: 'msesubsidiary'
							}, {
								name: 'name',
								join: 'msesubsidiary'
							}
							]
						});

						//run search, add to subsidArray
						var subsidArray = [];
						subSearch.run().each(function(result){
							subsidArray.push(result.getValue({
								name: 'internalid',
								join: 'msesubsidiary'
							}));
							return true;
						});

						//update record
						rec.setValue({
							fieldId: 'custrecord_pp_subsid_list',
							value: subsidArray
						});
					}
				}
			} catch(ex) {
				log.error({
					title: 'Error in beforeSubmit', 
					details: ex.message
				});
			}
		}

		return {
    		beforeLoad: beforeLoad,
    		beforeSubmit: beforeSubmit
    	};
    });
