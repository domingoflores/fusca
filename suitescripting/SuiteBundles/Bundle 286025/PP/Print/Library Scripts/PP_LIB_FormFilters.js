/**
 * Reusable wrapper class to create and maintain form filters that connect to searches. 
 * This code is intended for use in suitelets. It pairs with client script code in PP_UI_FormFilters.
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Nov 2015     MMenlove
 *
 */


function NSFormFilter(options,form){
	
	this.filters = [];
	this.form = form;
	this.group = {
			'name' : 'filters',
			'label' : 'Filters'
	};
	
	var filterFieldPrefix = 'filter_';
	var me = this;
	var paramVals;
	
	this.addFilter = function(filterObj){
		//TODO validate filterObj
		var filter = filterObj;
		filter.fieldId = filterFieldPrefix + filter.field;
		this.filters.push(filter);
	};
	
	this.extractFiltersValues = function(){
		extractFilterValuesFromParams();
		var sessionParams = extractFilterValuesFromSession();
		paramVals = $PPS.extend(sessionParams,paramVals);
		saveFiltersToSession(paramVals);
	};
	
	this.renderFilters = function(){
		this.extractFiltersValues();
		
		if(this.group){
			var filterGroup = form.addFieldGroup(this.group.name, this.group.label);
			filterGroup.setCollapsible(true, true);
		}
		
		
		for(var i = 0; i < this.filters.length; i++){
			var filter = this.filters[i];
			// TODO: set fieldId somewhere else
			filter.fieldId = filterFieldPrefix + filter.field;
			var field = null;
			switch(filter.type){
			case 'select':
				var recType = null;
				if(filter.recordType){
					recType = filter.recordType;
				}
				//TODO: blank is a possible value
				field = this.form.addField(filter.fieldId,'select',filter.label,recType,this.group.name || null);
				
				if(typeof filter.options != 'undefined'){
					var options
					if(typeof filter.options == 'function'){
						 options = filter.options();
					}
					else{
						options = filter.options;
					}
					for(var j = 0; j < options.length; j++){
						if(Array.isArray(options[j])){
							field.addSelectOption(options[j][0],options[j][1]);
						}
						else{
							field.addSelectOption(options[j]);
						}
					}
				}
				
				break;
			case 'text':
			case 'checkbox':
			case 'date':
				field = this.form.addField(filter.fieldId,filter.type,filter.label,null,this.group.name || null);
				break;
			}
			
			var defaultValue = getDefaultValue(filter);
			if(defaultValue != null){
				field.setDefaultValue(defaultValue);
			}
			
			if(filter.breakType){
				field.setBreakType(filter.breakType);
			}
		}
		
		
		var clientFilterObj = buildClientFilterObj(this.filters);
		
		var script = '<script type="text/javascript">';
		script += 'var filtersToRegister='+JSON.stringify(clientFilterObj)+';';
		script += '</script>';
		var inlineScript = form.addField('filter_script','inlinehtml');
		inlineScript.setDefaultValue(script);
	};
	
	
	this.getFilterValues = function(includePrefix){
		//TODO: filter.defaultValue to build paramVals
		if(typeof paramValues == 'undefined'){
			this.extractFiltersValues();
		}
		
		if(includePrefix){
			return paramVals;
		}
		else{
			// remove prefix from keys of paramVals
			var obj = {};
			for (var key in paramVals) {
			  if (paramVals.hasOwnProperty(key)) {
			    obj[key.replace(new RegExp('^' + filterFieldPrefix),'')] = paramVals[key];
			  }
			}
			return obj;
		}
	};
	
	// get the filter data for filters
	function extractFilterValuesFromParams(){
		var vals = {};
		
		for(var i = 0; i < me.filters.length; i++){
			var filter = me.filters[i];
			var paramVal = request.getParameter(filter.fieldId);
			nlapiLogExecution('DEBUG', 'param type', typeof paramVal);
			if(paramVal != null){
				vals[filter.fieldId] = paramVal;
			}
		}
		paramVals = vals;
	}
	
	function extractFilterValuesFromSession(){
		var context = nlapiGetContext();
		var sessionObj = context.getSessionObject(context.getDeploymentId() + '.filters');
		var filterParams;
		if(!sessionObj){
			filterParams = {};
		}
		else{
			try{
				filterParams = JSON.parse(sessionObj);
			}
			catch(e){
				nlapiLogExecution('ERROR','Unable to parse sessoin filters',e.toString());
				filterParams = {};
			}
		}
		
		// only extract filters that are suppose to be stored in session
		var fObj = {};
		for(var i = 0; i < me.filters.length; i++){
			var f = me.filters[i];
			if(f.storeInSession && typeof filterParams[f.fieldId] != 'undefined'){
				fObj[f.fieldId] = filterParams[f.fieldId];
			}
		}
		
		return fObj;
	}
	
	function saveFiltersToSession(params){
		var obj = {};
		for(var i = 0; i < me.filters.length; i++){
			var f = me.filters[i];
			if(f.storeInSession && typeof params[f.fieldId] != 'undefined'){
				obj[f.fieldId] = params[f.fieldId];
			}
		}
		var context = nlapiGetContext();
		context.setSessionObject(context.getDeploymentId() + '.filters',JSON.stringify(obj));
	}
	
	function getDefaultValue(filter){
		var defaultValue = null;
		if(paramVals[filter.fieldId]){
			defaultValue = paramVals[filter.fieldId];
		}
		else if(typeof filter.defaultValue != 'undefined'){
			defaultValue = filter.defaultValue;
		}
		return defaultValue;
	}
	
	function buildClientFilterObj(filters){
		var clientFilters = [];
		
		for(var i = 0; i < filters.length; i++){
			var filter = filters[i];
			var clientFilterObj = {};
			clientFilterObj.fieldId = filter.fieldId;
			clientFilterObj.type = filter.type;
			clientFilterObj.connectedField = filter.connectedField ? filterFieldPrefix + filter.connectedField : null;
			clientFilterObj.connectedRule =  filter.connectedRule ? filter.connectedRule : null;
			clientFilters.push(clientFilterObj);
		}
		return clientFilters;
	}
	
	// initialize object here
	for(var i = 0; i < options.filters.length; i++){
		this.addFilter(options.filters[i]);
	}
}