//------------------------------------------------------------------
// Copyright 2015-2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------
//------------------------------------------------------------------
//Function: this.additionalFilters
//Description: Injects additional filters into CRE searches.
//Developer: Matthew Marchant             
//Date: 5/29/2018
//------------------------------------------------------------------
this.additionalFilters = function (profileline_recordName)
{
	var logTitle='additionalFilters';
	creProfile = this;
	var filters = [];
	if (profileline_recordName)
	{
		nlapiLogExecution('audit',logTitle,'profileline_recordName');
		nlapiLogExecution('debug',logTitle,'JSON.stringify(creProfile.RawData.httprequest.parameters): '+JSON.stringify(creProfile.RawData.httprequest.parameters));
		switch(profileline_recordName) {
		case "items":
		case "mainline":
		case "itemlocations":
		case "lines":
			var transIds=[];
			var parameters=creProfile.RawData.httprequest.parameters;
			nlapiLogExecution('debug',logTitle,'pameters: '+JSON.stringify(parameters));
			if(!isEmpty(parameters)){
				for(key in parameters){
					if(key.indexOf('chkbxCredit')!='-1' || key.indexOf('chkbxInvoice')!='-1'){
						transIds.push(parameters[key]);
					}
				}
			}
			nlapiLogExecution('debug',logTitle,'transIds.length: '+transIds.length);
			if(!isEmpty(transIds)) filters.push(new nlobjSearchFilter('internalid', 'transaction', 'anyof',transIds));
			break;
		default:
			//do nothing
		}
	}
	return filters;
};
//------------------------------------------------------------------
//Script: this.javaScriptOverride
//Description: 
//Developer:              
//Date: 
//------------------------------------------------------------------
this.javaScriptOverride = function ()
{
	var logTitle='javascriptoverride';
	creRecord = this;  //required
	//var countriesJsonString=JSON.stringify(creRecord.RawData.countries);
	var tmp=[{'id':'1','name':'a'},{'id':'2','name':'b'}];
	creRecord.RawData.countriesJsonString=JSON.stringify(tmp);
  
     creRecord.RawData.countriesJsonObj=tmp;
  
	//var tmp='hello';
	//var countriesJsonString = JSON.stringify(tmp);
	//var countriesJsonString = tmp;
	//creRecord.RawData.countriesJsonString='[{\"id\":\"1\",\"name\":\"a\"},{\"id\":\"2\",\"name\":\"b\"}]';
	//var bob={"title":"MyApp"};
	//var eric=JSON.stringify(bob);
	//var eric="[{'title':'MyApp'},{'title':'MyApp'}]";
	//creRecord.RawData.countriesJsonString=eric;
	//nlapiLogExecution('error','countriesJsonString',countriesJsonString);
}

function isEmpty(val) {
	return (val == undefined || val == null || val == '');	
}