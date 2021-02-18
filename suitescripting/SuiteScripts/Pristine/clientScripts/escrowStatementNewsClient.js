/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['N/runtime'],
	
	/**
	 * -----------------------------------------------------------
	 * escrowStatementNewsClient.js
	 * ___________________________________________________________
	 * Escrow Statement News client script
	 *
	 * Version 1.0
	 * Author: Brunno Putnam
	 * Date: 2020-01-24	
	 * ATP-1069 - ATP-1595
	 * ___________________________________________________________
	 */

	function (runtime) {

		var REC;
		var fields_to_hide = ['custrecord90', 'custrecordcom_sh_news', 'custrecordsameasmajor', 'custrecord_esn_case'];
		var trigger_field = 'custrecord88';
		var vip = 'custrecord_esn_vip_message';
		var approval = 'custrecordesnapproval';
		var fields_to_disable = ['custrecord88', 'custrecord90', 'custrecord_esn_first_entry_complete', 'custrecord_esn_second_review_complete', 'custrecord_srs_mcp_export_flag_esn',
			'custrecord_srs_mcp_int_fail_esn', 'custrecord_srs_mcp_int_fail_esn', 'custrecord_esn_vip_message', 'custrecordsameasmajor', 'custrecordesnapproval',
			'custrecord_esn_assigned_to', 'custrecord_esn_case', 'custrecordcom_sh_news'];

		function pageInit(context) {

			REC = context.currentRecord;
			console.log('Runtime ContextType: ', JSON.stringify(runtime.executionContext));
			toggleDisplay(context, fields_to_hide, vip, trigger_field);
			var approval_status = context.currentRecord.getValue(approval);
			
			if (approval_status == 4) { //published 
				disableFields(context, fields_to_disable);
			}

		}

		function fieldChanged(context) {

			REC = context.currentRecord;
			console.log('fieldChanged', 'context.fieldId: ' + context.fieldId);

			if (context.fieldId == "custrecord_esn_first_entry_complete")
				toggleOverrideTimestamp(context);

			if (context.fieldId === 'custrecord88') {
				toggleDisplay(context, fields_to_hide, vip, trigger_field);
			}

			if (context.fieldId == "custrecord89") {
				var newsdate = context.currentRecord.getValue('custrecord89');
				var finalnewsdate = context.currentRecord.getValue('custrecord89');
				console.log('newsdate string: ' + newsdate);
				finalnewsdate.setDate(newsdate.getDate() + 90);
				REC.setValue("custrecord_esn_final_news_date", finalnewsdate);
			}

		}

		//======================================================================================================================


		
		function toggleOverrideTimestamp(context) {
			if (REC.getValue("custrecord_esn_first_entry_complete")) {
				REC.setValue("custrecord_esn_first_entry_by", runtime.getCurrentUser().id);
				REC.setValue("custrecord_esn_first_entry_dt", new Date());
			} else {
				REC.setValue("custrecord_esn_first_entry_by", "");
				REC.setValue("custrecord_esn_first_entry_dt", "");
			}
		}
		
		function toggleDisplay(context, fields_to_hide, vip, trigger_field) {

			var fieldObject;
			var trigger_field_value = context.currentRecord.getValue(trigger_field);
			var vip_field_object = context.currentRecord.getField({
				fieldId: vip
			});

			if (trigger_field_value == 591324) {
				vip_field_object.isDisplay = true;

				for (var i = 0; i < fields_to_hide.length; i++) {
					fieldObject = context.currentRecord.getField({
						fieldId: fields_to_hide[i]
					});

					fieldObject.isDisplay = false;
				}

			} else {
				vip_field_object.isDisplay = false

				for (var i = 0; i < fields_to_hide.length; i++) {
					fieldObject = context.currentRecord.getField({
						fieldId: fields_to_hide[i]
					});

					fieldObject.isDisplay = true;
				}
			}
		}
		
		//===========================================HELPER FUNCTIONS===========================================================

		function disableFields(context, array) {
			for (var i = 0; i < array.length; i++) {
				fieldObject = context.currentRecord.getField({
					fieldId: array[i]
				});
				fieldObject.isDisabled = true;
			}
		}
		//======================================================================================================================
		
		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
		};

	});