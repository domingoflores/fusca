function earnouttabbl(type, form)
{

//Designed for Shareholder Representative Services - May 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a before load User Event script that will se the basis for setup of the Earn-OUt subtab and the value to be derived


//First - go get the Exp Fund Current Balance from the GL

if (type != 'create' && type != 'delete')
{
	
	var custid = nlapiGetRecordId()
	var filter = new Array();
	filter[0] = new nlobjSearchFilter('entity', null, 'anyof', custid);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('account');
	var results = nlapiSearchRecord('transaction', 'customsearch_eoglexpense', filter, columns);
	if (results != null)
	{
		var acct = results[0].getValue('account')
		var balance = nlapiLookupField('account', acct, 'balance')
		nlapiSetFieldValue('custentity_expfundbalance', balance, false)
	}
	//Set Engagement Fee and others
	nlapiSetFieldValue('custentity_engagementfee', nlapiGetFieldValue('custentity50'), false)
	nlapiSetFieldValue('custentity_expfundinit', nlapiGetFieldValue('custentity_expense_fund_amount'), false)


}

if (type == 'edit' || type == 'view') 
{
	
	var custid = nlapiGetRecordId()
	form.addField('custpage_contactbutton','inlinehtml','Add Contact', null, 'custom66'); //custom66 is the Earn Out main tab
	form.addField('custpage_memobutton','inlinehtml','Add Memo', null, 'custom66'); //custom66 is the Earn Out main tab
//	var contbutton = '<button style="border-radius:40px/24px; background-color:red" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&refresh=calls&company='+custid+'\');return false;">Add Contact</button>'
	var contbutton = '<button style="border-radius:40px/24px; border-width:8px"  onclick="Popup=window.open(\'/app/common/entity/contact.nl?refresh=contact&target=contact_main:contact&label=Contact&type=Contact&l=T&parentType=custjob&parent='+custid+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">Add New Contact</button>'
	var memobutton = '<button style="border-radius:40px/24px; border-width:8px"  onclick="Popup=window.open(\'/app/crm/calendar/call.nl?l=T&refresh=calls&company='+custid+'\',\'Popup\',\'toolbar=no, location=no,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">New Earn-Out Memo</button>'
	form.setFieldValues({custpage_contactbutton: contbutton, custpage_memobutton: memobutton})
	var custid = nlapiGetRecordId()	
	
	var escactivities = new Array(2, 5, 3, 16, 2, 10);
	//Create a tab for the Escorw (Events) realted to this customer
	var filter_esc = new Array();
	var custname = nlapiGetFieldValue('companyname')
	if (custname == null || custname == "")
	{
		var custname = 'anonymous'
	}
	filter_esc[0] = new nlobjSearchFilter('formulatext', null, 'startswith', custname)
	filter_esc[0].setFormula('({company})')
//	filter_esc[1] = new nlobjSearchFilter('custevent27', null, 'anyof', escactivities);  //Decided to put into search


	var columns_esc = new Array();
	columns_esc[0] = new nlobjSearchColumn('startdate');
	columns_esc[1] = new nlobjSearchColumn('title');
	columns_esc[2] = new nlobjSearchColumn('custevent27');
	columns_esc[3] = new nlobjSearchColumn('custevent30');
	columns_esc[4] = new nlobjSearchColumn('custevent29');
//	columns_esc[0] = new nlobjSearchColumn('amount');


//	form.addSubTab('custpage_eoescrow', 'Upcoming Escrow Events', 'custom66'); //custom66 is the Earn Out main tab
	var sublistesc = form.addSubList('custpage_eoescrow','list','Escrow and Earn-out Events', 'custom66'); //custom66 is the Earn Out main tab
	sublistesc.addField('custpage_esc_date','text','Date')
	sublistesc.addField('custpage_esc_event','text','Event Name')
	sublistesc.addField('custpage_esc_evtype','text','Event Type')
	sublistesc.addField('custpage_esc_releaseamt','text','Release Amount')
	sublistesc.addField('custpage_esc_notes','text','Notes')

	var results_esc = nlapiSearchRecord('calendarevent', 'customsearch_eventseo', filter_esc, columns_esc);
	for (var x = 0; results_esc != null && x < results_esc.length; x++ )
	{
//		sublistesc.setLineItemValue('custpage_esc_date', x+1, results_esc[x].getValue('startdate') );
		sublistesc.setLineItemValue('custpage_esc_date', x+1, '<a href="#" title="Click here to view the deal Event." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','calendarevent',results_esc[x].getId(),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+results_esc[x].getValue('startdate')+'</a>');
		sublistesc.setLineItemValue('custpage_esc_event', x+1, results_esc[x].getValue('title') );		
		sublistesc.setLineItemValue('custpage_esc_evtype', x+1, results_esc[x].getText('custevent27') );
		sublistesc.setLineItemValue('custpage_esc_releaseamt', x+1, results_esc[x].getValue('custevent29') );
		var note100 = results_esc[x].getValue('custevent30').substring(0,100)
		sublistesc.setLineItemValue('custpage_esc_notes', x+1, note100 );	
	}

	//Create Dynamic tabs for the Secondary Earn-outs
	var filter_eo = new Array();
	filter_eo[0] = new nlobjSearchFilter('custrecord_seo_deal', null, 'anyof', custid);
	filter_eo[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
	var columns_eo = new Array();
	columns_eo[0] = new nlobjSearchColumn('name');
	columns_eo[1] = new nlobjSearchColumn('custrecord_seo_description');
	columns_eo[2] = new nlobjSearchColumn('custrecord_seo_primaryeo');
	columns_eo[3] = new nlobjSearchColumn('custrecord_seo_totaleoconsider');
	columns_eo[4] = new nlobjSearchColumn('custrecord_seo_eouncappped');
	columns_eo[5] = new nlobjSearchColumn('custrecord_seo_reversionotes');
	columns_eo[6] = new nlobjSearchColumn('custrecord_seo_eomemos');
	columns_eo[7] = new nlobjSearchColumn('custrecord_seo_reporttype');
	columns_eo[8] = new nlobjSearchColumn('custrecord_seo_reportingprd');
	//If we have any Seconday Earn Outs, create dynamic tabs for each
	var results_eo = nlapiSearchRecord('customrecord_secondaryeo', null, filter_eo, columns_eo); 

	for (var i = 0; results_eo != null && i < results_eo.length; i++ )
	{

		var tabtitle = results_eo[i].getValue('name')
		var tab = 'seo' + i
		var tabname = 'custpage_' + tab;
		
		form.addSubTab(tabname, tabtitle, 'custom66'); //custom66 is the Earn Out main tab
		
		//Note - we're using setDefailValue instead of setFieldValues as we have dynamic field names
//		var subtab = form.addSubTab('custpage_subtab', 'Earn Out Sub Tab1', 'custom66');
		form.addField('custpage_deal' + tab,'text','Deal Name', null, tabname).setDefaultValue(results_eo[i].getValue('name'))
		form.addField('custpage_eodesc' + tab,'textarea','Earn-out Description', null, tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_description'))
		form.addField('custpage_primaryeo' + tab,'checkbox','Primary EO?', null, tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_primaryeo'))
		form.addField('custpage_totaleoconsider' + tab,'float','Total Defined EO Consideration', null, tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_totaleoconsider'))
		form.addField('custpage_eouncappped' + tab,'checkbox','EO Uncapped?', null, tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_eouncappped'))
		form.addField('custpage_reversionotes' + tab,'textarea','Reversion Rights Notes', null, tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_reversionotes'))
		form.addField('custpage_eomemos' + tab,'textarea','Earn-Out Memos', null, tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_eomemos'))
		form.addField('custpage_reporttype' + tab,'select','Report Type', 'customlist_reporttypes', tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_reporttype'))
		form.addField('custpage_reportingprd' + tab,'select','Reporting Period', 'customlist_reportingperiod', tabname).setDefaultValue(results_eo[i].getValue('custrecord_seo_reportingprd'))
//		form.addField('custpage_mostrecentreport' + tab,'textarea','Most Recent Report', null, tabname)
//		form.addField('custpage_nextreport' + tab,'textarea','Next Report Due', null, tabname)

		//Hide fields for later compare to see if an update occured
		form.addField('custpage_eodeschid' + tab,'textarea','Earn-out Description', null, tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_description'))
		form.addField('custpage_primaryeohid' + tab,'checkbox','Primary EO?', null, tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_primaryeo'))
		form.addField('custpage_totaleoconsiderhid' + tab,'float','Total Defined EO Consideration', null, tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_totaleoconsider'))
		form.addField('custpage_eouncapppedhid' + tab,'checkbox','EO Uncapped?', null, tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_eouncappped'))
		form.addField('custpage_reversionoteshid' + tab,'textarea','Reversion Rights Notes', null, tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_reversionotes'))
		form.addField('custpage_eomemoshid' + tab,'textarea','Earn-Out Memos', null, tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_eomemos'))
		form.addField('custpage_reporttypehid' + tab,'select','Report Type', 'customlist_reporttypes', tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_reporttype'))
		form.addField('custpage_reportingprdhid' + tab,'select','Reporting Period', 'customlist_reportingperiod', tabname).setDisplayType('hidden').setDefaultValue(results_eo[i].getValue('custrecord_seo_reportingprd'))

/*		var sublistms = form.addSubList('custpage_milestone' + tab, 'list', 'Milestonex', tabname); 
		sublistms.setLabel('Seconday Milestones')
		sublistms.addField('custpage_milestone_esc_date','text','Date')
		sublistms.addField('custpage_milestone_esc_desc','text','Desc')
		sublistms.setLineItemValue('custpage_milestone_esc_date', 1, '02/01/2013' );	
		sublistms.setLineItemValue('custpage_milestone_esc_desc', 1, 'This is it' );	*/


	}

	
}
}


function earnouttabsv(type, form)
{

//Designed for Shareholder Representative Services - May 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a afterSubmit User Event script that will see if any updates have been made to the earnout secondary subtabs

if (type == 'create' || type == 'edit') 
{
	var custid = nlapiGetRecordId()
	var submitfld = new Array();
	var submitdata = new Array();
	var update = false;
	var nosubs = -1

	var filter_eo = new Array();
	filter_eo[0] = new nlobjSearchFilter('custrecord_seo_deal', null, 'anyof', custid);
	var columns_eo = new Array();
	columns_eo[0] = new nlobjSearchColumn('name');
	columns_eo[1] = new nlobjSearchColumn('custrecord_seo_description');
	columns_eo[2] = new nlobjSearchColumn('custrecord_seo_primaryeo');
	columns_eo[3] = new nlobjSearchColumn('custrecord_seo_totaleoconsider');
	columns_eo[4] = new nlobjSearchColumn('custrecord_seo_eouncappped');
	columns_eo[5] = new nlobjSearchColumn('custrecord_seo_reversionotes');
	columns_eo[6] = new nlobjSearchColumn('custrecord_seo_eomemos');
	columns_eo[7] = new nlobjSearchColumn('custrecord_seo_reporttype');
	columns_eo[8] = new nlobjSearchColumn('custrecord_seo_reportingprd');
	//If we have any Seconday Earn Outs, they will show here
	var results_eo = nlapiSearchRecord('customrecord_secondaryeo', null, filter_eo, columns_eo); 

	for (var i = 0; results_eo != null && i < results_eo.length; i++ )
	{
		var tabtitle = results_eo[i].getValue('name')
		var tab = 'seo' + i
		var tabname = 'custpage_' + tab;
		
		//Check against hidden fields to see if there are updates
		if (nlapiGetFieldValue('custpage_eodesc' + tab) != nlapiGetFieldValue('custpage_eodeschid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_description'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_eodesc' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_primaryeo' + tab) != nlapiGetFieldValue('custpage_primaryeohid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_primaryeo'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_primaryeo' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_totaleoconsider' + tab) != nlapiGetFieldValue('custpage_totaleoconsiderhid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_totaleoconsider'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_totaleoconsider' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_eouncappped' + tab) != nlapiGetFieldValue('custpage_eouncapppedhid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_eouncappped'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_eouncappped' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_reversionotes' + tab) != nlapiGetFieldValue('custpage_reversionotes' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_reversionotes'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_reversionotes' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_eomemos' + tab) != nlapiGetFieldValue('custpage_eomemoshid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_eomemos'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_eomemos' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_reporttype' + tab) != nlapiGetFieldValue('custpage_reporttypehid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_reporttype'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_reporttype' + tab)
			update = true
		}
		if (nlapiGetFieldValue('custpage_reportingprd' + tab) != nlapiGetFieldValue('custpage_reportingprdhid' + tab))
		{
			nosubs = nosubs + 1
			submitfld[nosubs] = 'custrecord_seo_reportingprd'
			submitdata[nosubs] = nlapiGetFieldValue('custpage_reportingprd' + tab)
			update = true
		}
		
		if (update)
		{
			var seoid = results_eo[i].getId()
			nlapiSubmitField('customrecord_secondaryeo', seoid, submitfld, submitdata)
			update = false
			nosubs = -1	
		}

	}

	
}
}