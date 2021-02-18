/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSWorkFlowUtils.js 
* @ AUTHOR        : Steven C. Buttgereit
* @ DATE          : 2010/12/16
*
* Copyright (c) 2010 Shareholder Representative Services LLC
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * 
 * addValueToMultiSelect
 * 
 * This function adds a value to an already defined multi-select field via workflow.
 * 
 */
function addValueToMultiSelect() {
	//retrieve context and passed parameters from the context.
	var context = nlapiGetContext();
	var targetFieldId = context.getSetting('SCRIPT','custscript_target_field_id'); //the multiselect field to update.
	var valueAddedId = context.getSetting('SCRIPT','custscript_value_added_id'); //internal id of the value to be added.
	
	//next get the array of values currently in the field
	var listOfValues = new Array();
	try {
		if(nlapiGetNewRecord().getFieldValues(targetFieldId) != null && nlapiGetNewRecord().getFieldValues(targetFieldId) != '') {
			var testArray = nlapiGetNewRecord().getFieldValues(targetFieldId);
			var isValueExtant = 'FALSE';
			for(var i = 0; i < testArray.length; i++) {
				if(testArray[i] == valueAddedId) {
					isValueExtant = 'TRUE';
					nlapiLogExecution('DEBUG','Add To MultiSelect','Value already exists in target field. Not adding to: '+nlapiGetNewRecord().getRecordType()+'/'+targetFieldId+' with value: '+valueAddedId+'.');
				
				}
			}
			if(isValueExtant == 'FALSE') {
				listOfValues = listOfValues.concat(nlapiGetNewRecord().getFieldValues(targetFieldId));
				listOfValues.push(valueAddedId);
				nlapiLogExecution('DEBUG','Add To MultiSelect','The new value does not exist. Adding to: '+nlapiGetNewRecord().getRecordType()+'/'+targetFieldId+' with value: '+valueAddedId+'.');
				nlapiGetNewRecord().setFieldValues(targetFieldId,listOfValues);	
			}
		} else {
			nlapiLogExecution('DEBUG','Add To MultiSelect','No pre-existing values in field. Adding to: '+nlapiGetNewRecord().getRecordType()+'/'+targetFieldId+' with value: '+valueAddedId+'.');
			listOfValues.push(valueAddedId);
			nlapiGetNewRecord().setFieldValues(targetFieldId,listOfValues);
		}
		return 0
	} catch (err) {
		if(err instanceof nlobjError) {
			nlapiLogExecution('ERROR','Add To MultiSelect','A problem adding values to record type/field: '+nlapiGetNewRecord().getRecordType()+'/'+targetFieldId+' with value: '+valueAddedId+' the message was: '+err.getCode()+':'+err.getDetails()+'.');
		} else {
			nlapiLogExecution('ERROR','Add To MultiSelect','A problem adding values to record type/field: '+nlapiGetNewRecord().getRecordType()+'/'+targetFieldId+' with value: '+valueAddedId+' the message was: '+err.toString()+'.');
			
		}
		return -1;
	}
}

/**
 * This takes three parameters and calls nlapiInitiateWorkflow(recordtype, id, workflowid):
 * String - workflow internal. I.e. "customworkflow_..."
 * String - target record type
 * String - target record id (this will be mapped from the source record)
 */
function callWorkflow()
{
	var context = nlapiGetContext();
	var workflowId = context.getSetting('SCRIPT','custscript_target_workflow_id');
	var targRcdTyp = context.getSetting('SCRIPT','custscript_target_record_type');
	var targRcdId  = context.getSetting('SCRIPT','custscript_target_record_id');
	var targActId  = context.getSetting('SCRIPT','custscript_target_action_id');
	
	nlapiLogExecution('DEBUG','Parameters','workflowId = ' + workflowId);
	nlapiLogExecution('DEBUG','Parameters','targRcdTyp = ' + targRcdTyp);
	nlapiLogExecution('DEBUG','Parameters','targRcdId  = ' + targRcdId);
	nlapiLogExecution('DEBUG','Parameters','targActId  = ' + targActId);

	if(targActId == null || targActId.length == 0)	nlapiInitiateWorkflow(targRcdTyp, targRcdId, workflowId);
	else											nlapiInitiateWorkflow(targRcdTyp, targRcdId, workflowId, targActId);
}



