//=========================================================================================================================
// SUITELET
//=========================================================================================================================
function ExecuteRequest(request, response) {
	"use strict";
	var Scriptname = "Alex_Test_SL_SS1.js";
    //nlapiLogExecution("DEBUG", Scriptname, "started");
	//response.write("<br/><br/>request: " +  JSON.stringify( request ) );
	
	
	
	var rcdId = 538328;
	var filters = [];
	var columns = [];
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', [rcdId]);
	columns[0] = new nlobjSearchColumn('custentity_acq_deal_fx_settle_currencies');
	
	var searchresults = nlapiSearchRecord('customer', null, filters, columns );//10pts
	
	//response.write("<br/><br/>" + "searchresults: "  +  JSON.stringify(searchresults[0].columns()) );
	
	
	var fieldValue = searchresults[0].getValue('custentity_acq_deal_fx_settle_currencies');
	var fieldText = searchresults[0].getText('custentity_acq_deal_fx_settle_currencies');
	
	response.write("<br/><br/>" + "LOOKUP FIELDS "  );
	response.write("<br/><br/>" + "fieldValue: " +  JSON.stringify(fieldValue) );
	response.write("<br/><br/>" + "fieldText: "  +  JSON.stringify(fieldText) );
	
	
	response.write("<br/><br/>" + " " );
	
	
	var filters = [];
	var columns = [];
	filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', [rcdId]);
	columns[0] = new nlobjSearchColumn('name'       ,"custentity_acq_deal_fx_settle_currencies");
	columns[1] = new nlobjSearchColumn('internalid' ,"custentity_acq_deal_fx_settle_currencies");
	columns[2] = new nlobjSearchColumn('internalid' ,"custentity_acq_deal_fx_level");
	var searchresults = nlapiSearchRecord('customer', null, filters, columns );//10pts

	
	//response.write("<br/><br/>" + "fieldText: "  +  JSON.stringify(searchresults) );
	
	
	response.write("<br/><br/>" + "SEARCH WITH JOIN "  );
	
	for (ix in searchresults) {

		
		var fieldValue = searchresults[ix].getValue(columns[1]);
		var fieldText = searchresults[ix].getValue(columns[0]);
		var fxLevel = searchresults[ix].getValue(columns[2]);
		
		response.write("<br/><br/>" + "fieldValue: " +  fieldValue );
		response.write("<br/>" + "fieldText: "  +  fieldText );
		response.write("<br/>" + "fxLevel: "  +  fxLevel );
		
		
	}
	
	
	
	response.write("<br/><br/>" + "Done." );
    return
    
	
	
	
	
	
	
	
	
    
    var profileid = 30;
    var recordid = 1954;
    
    try {
        var creProfile = new CREProfile(profileid);
    	response.write("<br/><br/>creProfile: " +  JSON.stringify( creProfile ) );
        
    	response.write("<br/><br/>B4 creProfile.Translate." );
        creProfile.Translate(recordid);

    	response.write("<br/><br/>b4 creProfile.Execute" );
        var creReturn = creProfile.Execute(true);
                    	            
    	response.write("<br/><br/>AFT creProfile.Execute " + JSON.stringify( creReturn ) );
   	
    }
    catch(e) {
    	response.write("<br/><br/>Exception: " + e );
    }
    
    

    
	response.write("<br/><br/>Done." );
	return;
	
    
    
    
    
    
	var filters = [];
	var columns = [];
	filters.push(new nlobjSearchFilter('name', null,'is',"Apply PI To Exchange When Tagged")  );
	filters.push( new nlobjSearchFilter('formulatext', null,'is',"Payment Instruction").setFormula('{custrecord_pri_as_app}') );
	columns.push( new nlobjSearchColumn('custrecord_pri_as_value') );
	var searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );//10pts
	var val = searchresults[0].getValue('custrecord_pri_as_value');
	response.write("searchresults: " +  JSON.stringify(  searchresults )  +  "<br/>" );
	response.write("val: " +  JSON.stringify(  val )  +  "<br/>" );
	response.write("val: " +    val   +  "<br/>" );



	response.write("Done." );
	return

    
    
    
    
    var appsettingValue = appSettings.readAppSetting("Payment Instruction", "Apply PI To Exchange When Tagged"); 

	response.write("appsettingValue: " +  JSON.stringify(  appsettingValue )  +  "<br/>" );
    
	
	response.write("Done." );
    return
    
    
    var p = request.getParameter('param1');
	response.write("param1: " +  p  +  "<br/>" );
	
	response.write("Done." );
    return
    
     
    
	var userId   = nlapiGetUser();
	var userRole = nlapiGetRole(); // 1025 for SRS Operations Manager, 3 for administrator		
	var userDept = nlapiGetDepartment();   // 35 for Operations & Technology : Client Operations : Acquiom Operations	
	
	var searchresults = [];
	try {
		var filters = [];
		var columns = [];
		filters[0] = new nlobjSearchFilter('name', null, 'is', 'Users with Administrator override in sandbox');
		columns[0] = new nlobjSearchColumn('custrecord_pri_as_value');
		searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );
		var arrayUsers = JSON.parse(searchresults[0].getValue('custrecord_pri_as_value'));
	}
	catch(e0) { console.log("exception encountered:" + e0.message) }
	
	var userHasAccess = false;
	if( userRole == 1025 && userDept == 35 ) { userHasAccess = true; } 
	if( userRole == 3    && String(nlapiGetContext().getEnvironment()) === "SANDBOX" ) {
		//for each (entry in arrayUsers) { if (entry == userId) { userHasAccess = true; }  }
		if (arrayUsers.indexOf(nlapiGetUser()) > -1) { userHasAccess = true; }
	} 

	response.write("userHasAccess: " +  userHasAccess  +  "<br/>" );
	
	response.write("Done." );
    return
    
    
    
	//var sSettingValue = appSettings.readAppSetting("General Settings", "Users with Administrator override in sandbox");
	
	
	var filters = [];
	var columns = [];
	filters[0] = new nlobjSearchFilter('name', null, 'is', 'Users with Administrator override in sandbox');
	columns[0] = new nlobjSearchColumn('custrecord_pri_as_value');
	var searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );//10pts
	var sSettingValue = searchresults[0].getValue('custrecord_pri_as_value');
	var arrayUsers = JSON.parse(sSettingValue);

	response.write("setting value: " +  sSettingValue  +  "<br/>" );
	
	response.write("array: " +  JSON.stringify(arrayUsers)  +  "<br/>" );
	response.write("array length: " +  arrayUsers.length  +  "<br/>" );
	
	response.write("Done." );
    return
    
    
    
    
	var rcdPaymentProcess = nlapiLoadRecord("customrecord_paymentprocess" ,260992 );
	
	var process_effective_date = rcdPaymentProcess.getFieldValue('custrecord_process_effective_date');
	
	response.write("process_effective_date: " + process_effective_date + "<br/>");
	
	if (process_effective_date) {
		response.write("effective date NOT empty" + "<br/>");
		var cMemo = nlapiCreateRecord('creditmemo', {recordmode: 'dynamic'});
		cMemo.setFieldValue('trandate', process_effective_date);
		
		var tranDate = cMemo.getFieldValue('trandate');
		response.write("tranDate: " + tranDate + "<br/>");
		
		
	} else { response.write("effective date empty" + "<br/>"); }
    
    
    
    
    response.write("Done.");
	return;
	
}