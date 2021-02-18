//------------------------------------------------------------------
//------------------------------------------------------------------
// Copyright 2013-2015, All rights reserved, Blackline Systems, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Blackline Systems, Inc.
//------------------------------------------------------------------
//------------------------------------------------------------------

//------------------------------------------------------------------
//Function:         BL001_Redirector_Suitelet
//Script Type:      Suitelet
//Description:		Redirect user to account register or other report from Blackline application
//
//Date:             SG 20150323
//------------------------------------------------------------------
function BL001_Redirector_Suitelet(request, response)
{
	// lookup the account that is passed-in as "ACCNUM ACCNAME" string
	var account_num  = bl_noempty(request.getParameter('number'),'');
	var account_name = bl_noempty(request.getParameter('name'),'');
	if (account_name.length==0 && account_num.length==0){
		throw new nlobjError('INVALID_PARAMETER','You must specify &name or &number parameters in URL');	
		return;
	}
	// get the internalid
	var filters = new Array();
	if (account_name.length>0){
		filters[filters.length] = new nlobjSearchFilter('name', null, 'is', account_name);
	}else{
		filters[filters.length] = new nlobjSearchFilter('number', null, 'is', account_num);
	}
	var results = bl_noempty(nlapiSearchRecord('account', null, filters), {length:0});
	if (results.length==0){
		throw new nlobjError('UNKNOWN_ACCOUNT','The lookup failed for account: ' + account_num + ' ' + account_name);	
		return;
	}
	var acct_id = results[0].getId();
	
	// get the other request parameters and add them to the url
	var qs = new Array();
	var params = request.getAllParameters();
	for ( param in params )
	{
		if (param=='deploy' || param=='script' || param=='name' || param=='number')continue;
		qs[qs.length] = param + "=" + urlencode(params[param]);
	}
	// if there aren't any qs specified, add some defaults
	if (qs.length==0){
		qs[qs.length] = "showStartBalances=F";
		qs[qs.length] = "reload=T";
		qs[qs.length] = "outputtype=3";
		qs[qs.length] = "reporttype=REGISTER";
	}
		
	var url = '/app/reporting/reportrunner.nl?acctid='.concat(acct_id).concat("&").concat(qs.join('&'));
	
	//response.write(url);
	//response.write("<BR>");
	//response.write('/app/reporting/reportrunner.nl?acctid=1&reload=T&outputtype=3&reporttype=REGISTER');
	//return;
	
	
	var html = '';
	html += '<script>';
	html += "window.location='" + url + "';";
	html += '</script>';
	response.write(html);
	return;
}
function urlencode(x){
	return x.split(' ').join('+').split('?').join('');
}
function bl_noempty(input_value, default_value)
{
  if (!input_value)
  {
      return default_value;
  }
  if (input_value.length==0)
  {
      return default_value;
  }
  return input_value;
};