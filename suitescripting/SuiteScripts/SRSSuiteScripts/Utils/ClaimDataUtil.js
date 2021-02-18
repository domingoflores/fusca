/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />

var Field = {
	ACTION_TYPES: {PURCHASE_PRICE_ADJUSTMENT:1,BREACH_OF_REP_WARRANTY:2,APPRAISAL:3,FRAUD:4,FEES_AND_COST:5,EARNOUT:7},
	SETTLEMENT_TYPES: {PENDING:1,INDIVIDUALLY_SETTLED:2,GLOBAL:3,WITHDRAWN:4},
	EARNOUT_METRIC_TYPES: {REVENUE:1, EARNINGS_EBITDA:2, MILESTONE_EVENTS:3, COMBINATION:4},
	PPA_METRIC_TYPES: {WORKING_CAPITAL:5,DEBT:6,ASSETS:7,CASH:8,EARNINGS:9,OTHER:10}
}

/**
 * @author durbano
 */
function onBeforeLoad(type, form)
{
	if (type != 'edit') return;
	
	onFieldChange('onBeforeLoad','custrecord_action_type');
}

function onFieldChange(type, name)
{
	if(name.length < 14) return;

	handleActionTypeField(type,name);
}

function handleActionTypeField(type,name)
{
	if(name != 'custrecord_action_type') return;
	var answer = nlapiGetFieldValue('custrecord_action_type');
	
	var warrantyVisible = false;
	var nwcVisible = false;
	
	//<ATP-798>
	if(answer == Field.ACTION_TYPES.BREACH_OF_REP_WARRANTY){
		warrantyVisible = true;
	}
	//Removed on 7/14/15 for JIRA ticket NS-96
	//<RB>Added on 3/4/2019 for JIRA ticket ATP-733
	if(answer == Field.ACTION_TYPES.PURCHASE_PRICE_ADJUSTMENT){
		//nwcVisible = true;
		warrantyVisible = true;
	}
	//</ATP-798>

	else if(answer == Field.ACTION_TYPES.EARNOUT) 	nwcVisible = true;
	
	srsDisableField(type,'custrecord_action_sub_type', !warrantyVisible);
	
	srsDisableField(type,'custrecord_base_metric_amount', 	!nwcVisible);
	srsDisableField(type,'custrecord_base_metric_type', 	!nwcVisible);

	//reduceMetricTypes(answer);
}

function reduceMetricTypes(actionType)
{
	if(action != Field.ACTION_TYPES.PURCHASE_PRICE_ADJUSTMENT && action != Field.ACTION_TYPES.EARNOUT) return;
	
	var removeVals = Field.EARNOUT_METRIC_TYPES;
	
	if(action == Field.ACTION_TYPES.EARNOUT) removeVals = Field.PPA_METRIC_TYPES;
	
	for(var i = 0; i < removeVals.length; i++)
	{
		nlapiRemoveSelectOption('custrecord_base_metric_type',removeVals[i]);
	}
}

function handleSettlementTypeField(type,name)
{
	if(name != 'custrecord_settlement_type') return;
	var answer = nlapiGetFieldValue('custrecord_settlement_type');
	
	var globalVisible = true;
	var pendingVisible = true;
	var withdrawnVisible = false;
	
		 if(answer == Field.SETTLEMENT_TYPES.GLOBAL) 		globalVisible 	 = false;
	else if(answer == Field.SETTLEMENT_TYPES.WITHDRAWN) 	withdrawnVisible = true;
	else if(answer == Field.SETTLEMENT_TYPES.PENDING)
	{
		globalVisible = false;
		pendingVisible = false;
	}

	srsDisableField(type,'custrecord_settlement_amount', !globalVisible);
	srsDisableField(type,'custrecord_reduction_due_to_basket', !globalVisible);
	srsDisableField(type,'custrecord_basket_type_if_reduction', !globalVisible);
	
	srsDisableField(type,'custrecord_date_of_resolution', !pendingVisible);
	
	if(withdrawnVisible)
	{
		// set the following fields
		nlapiSetFieldValue('custrecord_settlement_amount',0.0);
	}
}

// my little helper functions
function srsDisableField(type,field,disable)
{
	if(field == null || disable == null) return;
	
	if(type == null || type == 'null')
	{
		nlapiDisableField(field,disable);
		return;
	}
	
	if(type == 'onBeforeLoad' && disable)
	{
		var nField = nlapiGetField(field);
			nField.setDisplayType('disabled');
	}
//<ATP-798>
	if(type == 'onBeforeLoad' && disable == false)
	{
		var nField = nlapiGetField(field);
			nField.setDisplayType('normal');
	}
//</ATP-798>

}

function changeFieldsView(type,fields,visible)
{
	for(var i = 0; i < fields.length; i++)
	{
		var field = fields[i];
		
		srsDisableField(type,field,!visible);
	}	
}