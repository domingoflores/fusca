function importDashboardSuitelet(request,response)
{

//Designed for Shareholder Representative Services - June 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Suitelet for an original Portlet, designed to allow bulk reporting and update of imported cases

//This is the GET method

if ( request.getMethod() == 'GET' )
{

	//Added provision to lock lines for a user, so other uses cannot override
	var user = nlapiGetUser()
	var lockit = request.getParameter('lockit');
//	var lockit = 1

	if (lockit == 0 || lockit == null)
	{
		var distype = 'disabled'
	}
	else
	{
		var distype = 'entry'
	}
	
	//
	//Start by getting the data.  3 searches, one for the cases, one for the memos and one for the dates.
	//
	
	//Get the cases.
	var caseResults = null;
	

	var assigedtofilter = request.getParameter('assigedtofilter');  //Check to see if we used a filter - if so apply
	
	if (assigedtofilter)
	{
		var filter_case = new Array();
		filter_case[0] = new nlobjSearchFilter('assigned', null, 'anyof', assigedtofilter);
	    caseResults = nlapiSearchRecord('supportcase', 'customsearch_import_suitelet', filter_case);
	}
	else
	    caseResults = nlapiSearchRecord('supportcase', 'customsearch_import_suitelet');

	
	//get the events
	var eventResults = null;
	eventResults = nlapiSearchRecord('calendarevent','customsearch_support_dashboard_events');
	//Hack to get around how NetSuite handles multiple formula fields of the same type in searches.
	var eventSample = eventResults[0];
	var eventCols = eventSample.getAllColumns();
	var eventColsLen = eventCols.length;
	var columnEventDate;
	var columnEventTitle;
	var columnEventMessage;
	
	// loop through all columns and pull UI labels, and values for columns
	
	for (i = 0; i < eventColsLen; i++) {
		var targetColumn = eventCols[i];
		if (targetColumn.getLabel() == 'event_date') {
			columnEventDate = targetColumn;
		}
		else 
			if (targetColumn.getLabel() == 'event_title') {
				columnEventTitle = targetColumn;
			} 
			else 
			    if (targetColumn.getLabel() == 'event_message') {
			    	columnEventMessage = targetColumn;
			    }
	}
    //end of hack.
	
	//
	// Now we have the data.  Assemble the layout and populate the portlet.
	//
	
	//setup display

//	var form = nlapiCreateForm('Import Dashboard');  //Setup the selection form
	var form = nlapiCreateForm('');  //Setup the selection form

	var msgline = form.addField('custpage_msgline','inlinehtml', null, null)
	form.addField('custpage_assignedtofilter','select','Select Support Rep', '-4')
	message = "Import Dashboard"
	msgline = '<span style="font-weight:bold; font-size:200%; color:black"; class="right">' + message + '</span>'
	// add a sublist to the form
	var sublist = form.addSubList('custpage_importlist','list','Release List');

	var lock = sublist.addField('custpage_locked','checkbox',"<a href='#' style=color:red title='Reserve For Udpate'>"+"Update"+"</a>").setDisplaySize(1)
	sublist.addField('custpage_deal','textarea','Deal Name')
	sublist.addField('custpage_number','text','Case Number');
//	sublist.addField('custpage_dateclosed','text','Date Closed');
	sublist.addField('custpage_datecreated','text','Date Case Created');
//	sublist.addField('custpage_category','text','Case Category');
	var acq = sublist.addField('custpage_acquiom','select','Acquiom').setDisplayType(distype)
	acq.addSelectOption('2','No'); acq.addSelectOption('1','Yes'); 
	var anal = sublist.addField('custpage_analyst','select','Guideline Analyst').setDisplayType(distype)
	anal.addSelectOption('1','-'); anal.addSelectOption('2','Austin Drury'); anal.addSelectOption('3','Austen Lovelace'); anal.addSelectOption('4','Glen Colthup');
	anal.addSelectOption('5','Jason Morris');anal.addSelectOption('6','Mitch Eckberg'); anal.addSelectOption('7','Andrew Foster'); anal.addSelectOption('8','Jessica Dunn');

	var who1 = sublist.addField('custpage_who','select','Who').setDisplayType('entry')
	who1.setDisplayType('disabled')
	var startdt = sublist.addField('custpage_datestarted','date','Date Started').setDisplayType('entry')
	startdt.setDisplayType('disabled')
	var compdate = sublist.addField('custpage_datecompleted','date','Completed Date').setDisplayType('entry')
	compdate.setDisplayType('disabled')
	var appdate = sublist.addField('custpage_dateapproved','date','Approved Date').setDisplayType('entry')
	appdate.setDisplayType('disabled')
	var rrddate = sublist.addField('custpage_datesendrrd','date','Date Sent to RRD').setDisplayType('entry')
	rrddate.setDisplayType('disabled')
	var s2sanal = sublist.addField('custpage_s2sanalyst','select','S2S Analyst').setDisplayType(distype)
	s2sanal.addSelectOption('1','-'); s2sanal.addSelectOption('2','Austin Drury'); s2sanal.addSelectOption('3','Austen Lovelace'); s2sanal.addSelectOption('4','Glen Colthup');
	s2sanal.addSelectOption('5','Jason Morris');s2sanal.addSelectOption('6','Mitch Eckberg'); s2sanal.addSelectOption('7','Andrew Foster'); s2sanal.addSelectOption('8','Jessica Dunn');
	
	var s2sanaldate = sublist.addField('custpage_s2sdatecomp','date','S2S Date Completed').setDisplayType('entry')
	s2sanaldate.setDisplayType('disabled')
	var compreview = sublist.addField('custpage_compreviewer','select','Compliance Reviewer').setDisplayType(distype)
	compreview.addSelectOption('1','-'); compreview.addSelectOption('2','Austin Drury'); compreview.addSelectOption('3','Austen Lovelace'); compreview.addSelectOption('4','Glen Colthup');
	compreview.addSelectOption('5','Jason Morris');compreview.addSelectOption('6','Mitch Eckberg'); compreview.addSelectOption('7','Andrew Foster'); compreview.addSelectOption('8','Jessica Dunn');
	
	var compreviewdt = sublist.addField('custpage_compreviewerdt','date','Date of Compliance Review').setDisplayType('entry')
	compreviewdt.setDisplayType('disabled')
	var compimpdt = sublist.addField('custpage_impdonedate','date','Import Done Date').setDisplayType('entry')
	compimpdt.setDisplayType('disabled')
	var bank1 = sublist.addField('custpage_impbank','select','Bank').setDisplayType('entry')
	bank1.setDisplayType('disabled')

	sublist.addField('custpage_hid_internalid','integer').setDisplayType('hidden');

	var glset = sublist.addField('custpage_glset','select',"GL Set Up").setDisplayType(distype)
//	var imprt = sublist.addField('custpage_imprt','date',"Import").setDisplayType('entry')
//	imprt.setDisplayType('disabled')
	var majorsh = sublist.addField('custpage_majorsh','date',"Major SH").setDisplayType('entry')
	majorsh.setDisplayType('disabled')
	var ssource = sublist.addField('custpage_ssource','select',"System to Source").setDisplayType(distype)
	var welcome = sublist.addField('custpage_welcome','select',"Welcome Letter").setDisplayType(distype)
	var banklt = sublist.addField('custpage_banklt','select',"Bank Letter").setDisplayType(distype)
	var deplt = sublist.addField('custpage_deplt','select',"Deposit Verification").setDisplayType(distype)
//	var eventgl = sublist.addField('custpage_eventlt','select',"Event/GL").setDisplayType(distype)
	var note1 = sublist.addField('custpage_notes1','text',"Notes").setDisplayType('entry').setDisplaySize(40)
	note1.setDisplayType('disabled')

	bank1.addSelectOption('1','AST - (EA)'); bank1.addSelectOption('2','BNY - (EA)'); bank1.addSelectOption('3', 'Buy - (EA)'); bank1.addSelectOption('4','Cap1 - (EA)'); bank1.addSelectOption('5', 'Citi - (EA)');
	bank1.addSelectOption('6','COM - (EA)'); bank1.addSelectOption('7','CS - (EA)');  bank1.addSelectOption('8', 'CST - (EA)'); bank1.addSelectOption('9','DB - (EA)');  bank1.addSelectOption('10', 'ESOP - (EA)');
	bank1.addSelectOption('11','JPM - (EA)'); bank1.addSelectOption('12','SGS - (EA)'); bank1.addSelectOption('13', 'Sun - (EA)'); bank1.addSelectOption('14','SVB - (EA)'); bank1.addSelectOption('15', 'Union - (EA)');
	bank1.addSelectOption('16','USB - (EA)'); bank1.addSelectOption('17','Wilm - (EA)'); bank1.addSelectOption('18', 'WF - (EA)'); bank1.addSelectOption('19','Other - (EA)'); bank1.addSelectOption('','- - (EA)');

	who1.addSelectOption('1','SRS'); who1.addSelectOption('2','RRD');
	glset.addSelectOption('2','No'); glset.addSelectOption('1','Yes');
//	imprt.addSelectOption('','-'); imprt.addSelectOption('1','Yes'); imprt.addSelectOption('2','No');
	ssource.addSelectOption('2','No'); ssource.addSelectOption('1','Yes'); ssource.addSelectOption('3','Submitted');
//	majorsh.addSelectOption('','-'); majorsh.addSelectOption('1','Yes'); majorsh.addSelectOption('2','No');
	welcome.addSelectOption('2','No'); welcome.addSelectOption('1','Yes'); 
	banklt.addSelectOption('2','No'); banklt.addSelectOption('1','Yes'); 
	deplt.addSelectOption('2','No'); deplt.addSelectOption('1','Yes'); 
//	eventgl.addSelectOption('2','No'); eventgl.addSelectOption('1','Yes'); 

	//Hide Release Fields for later comparison for update in Client Script
	sublist.addField('custpage_hid_analyst','select').setDisplayType('hidden');
	sublist.addField('custpage_hid_acquiom','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_datestarted','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_datecompleted','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_dateapproved','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_datesendrrd','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_s2sanalyst','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_s2sdatecomp','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_compreviewer','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_compreviewerd','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_impdonedate','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_impbank','select').setDisplayType('hidden');

	
	
	sublist.addField('custpage_hid_glset','text').setDisplayType('hidden');
//	sublist.addField('custpage_hid_imprt','date').setDisplayType('hidden');
	sublist.addField('custpage_hid_ssource','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_majorsh','date').setDisplayType('hidden');    
	sublist.addField('custpage_hid_welcome','text').setDisplayType('hidden');    
	sublist.addField('custpage_hid_banklt','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_deplt','text').setDisplayType('hidden');
//	sublist.addField('custpage_hid_eventlt','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_notes1','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_locked','text').setDisplayType('hidden');
	
	//loop through the case results and construct/add the portlet data record
	if(caseResults != null && caseResults.length > 0)
	{
		var hash = new Object();
		//Main Case Loop
		for(var s = 0; s < caseResults.length; s++)
		{
			
			var currCase = caseResults[s];
			if (s == 2)
			{
//				break;
			}


			hash.deal = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('internalid','custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('companyname','custevent1')+'</a>';
			sublist.setLineItemValue('custpage_excalated', s+1, currCase.getValue('custevent_excalated') );
			sublist.setLineItemValue('custpage_deal', s+1, '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('internalid','custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('companyname','custevent1')+'</a>');
			sublist.setLineItemValue('custpage_number', s+1, '<a href="#" title="Click here to view the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getId(),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('casenumber')+'</a>');
			

//			var closedat = nlapiDateToString(currCase.getValue('enddate'))
//			var createdate = nlapiDateToString(currCase.getValue('createddate'))
//			sublist.setLineItemValue('custpage_dateclosed', s+1, currCase.getValue('enddate') );
			sublist.setLineItemValue('custpage_datecreated', s+1, currCase.getValue('createddate') );
//			sublist.setLineItemValue('custpage_category', s+1, currCase.getText('custevent_case_category') );
			sublist.setLineItemValue('custpage_acquiom', s+1, currCase.getValue('custevent_imp_acquiom') );
			sublist.setLineItemValue('custpage_analyst', s+1, currCase.getValue('custevent_imp_analyst') );
			sublist.setLineItemValue('custpage_who', s+1, currCase.getValue('custevent_imp_who') );
			sublist.setLineItemValue('custpage_datestarted', s+1, currCase.getValue('custevent_imp_qadate') );

			sublist.setLineItemValue('custpage_datecompleted', s+1, currCase.getValue('custevent_imp_datecomp') );
			sublist.setLineItemValue('custpage_dateapproved', s+1, currCase.getValue('custevent_imp_dateapp') );
			sublist.setLineItemValue('custpage_datesendrrd', s+1, currCase.getValue('custevent_imp_datesentrrd') );
			sublist.setLineItemValue('custpage_s2sanalyst', s+1, currCase.getValue('custevent_imp_s2sanalyst') );
			sublist.setLineItemValue('custpage_s2sdatecomp', s+1, currCase.getValue('custevent_imp_s2sdatecomp') );
			sublist.setLineItemValue('custpage_compreviewer', s+1, currCase.getValue('custevent_imp_compreviewer') );
			sublist.setLineItemValue('custpage_compreviewerdt', s+1, currCase.getValue('custevent_imp_compreviewdate') );
			sublist.setLineItemValue('custpage_impdonedate', s+1, currCase.getValue('custevent_imp_impdonedate') );
			sublist.setLineItemValue('custpage_impbank', s+1, currCase.getValue('custevent_imp_bank') );


			//Import Fields
			sublist.setLineItemValue('custpage_hid_internalid', s+1, currCase.getId() );
			sublist.setLineItemValue('custpage_glset', s+1, currCase.getValue('custevent_imp_glsetup') );
//			sublist.setLineItemValue('custpage_imprt', s+1, currCase.getValue('custevent_imp_import') ); 
			sublist.setLineItemValue('custpage_ssource', s+1, currCase.getValue('custevent_imp_systemtosource') );	
			sublist.setLineItemValue('custpage_majorsh', s+1, currCase.getValue('custevent_imp_majorsh') )
			sublist.setLineItemValue('custpage_welcome', s+1, currCase.getValue('custevent_imp_welcome') );
			sublist.setLineItemValue('custpage_banklt', s+1, currCase.getValue('custevent_imp_banklet') );
			sublist.setLineItemValue('custpage_deplt', s+1, currCase.getValue('custevent_imp_depverification') );
//			sublist.setLineItemValue('custpage_eventlt', s+1, currCase.getValue('custevent_imp_eventgl') );
			sublist.setLineItemValue('custpage_notes1', s+1, currCase.getValue('custevent_imp_memo') );

			//Hide Release Fields for later comparison for update in Client Script
			sublist.setLineItemValue('custpage_hid_analyst', s+1, currCase.getValue('custevent_imp_analyst') );
			sublist.setLineItemValue('custpage_hid_acquiom', s+1, currCase.getValue('custevent_imp_acquiom') );
			sublist.setLineItemValue('custpage_hid_datestarted', s+1, currCase.getValue('custevent_imp_qadate') );
			sublist.setLineItemValue('custpage_hid_who', s+1, currCase.getValue('custevent_imp_who') );

			sublist.setLineItemValue('custpage_hid_datecompleted', s+1, currCase.getValue('custevent_imp_datecomp') );
			sublist.setLineItemValue('custpage_hid_dateapproved', s+1, currCase.getValue('custevent_imp_dateapp') );
			sublist.setLineItemValue('custpage_hid_datesendrrd', s+1, currCase.getValue('custevent_imp_datesentrrd') );
			sublist.setLineItemValue('custpage_hid_s2sanalyst', s+1, currCase.getValue('custevent_imp_s2sanalyst') );
			sublist.setLineItemValue('custpage_hid_s2sdatecomp', s+1, currCase.getValue('custevent_imp_s2sdatecomp') );
			sublist.setLineItemValue('custpage_hid_compreviewer', s+1, currCase.getValue('custevent_imp_compreviewer') );
			sublist.setLineItemValue('custpage_hid_compreviewerdt', s+1, currCase.getValue('custevent_imp_compreviewdate') );
			sublist.setLineItemValue('custpage_hid_impdonedate', s+1, currCase.getValue('custevent_imp_impdonedate') );
			sublist.setLineItemValue('custpage_hid_impbank', s+1, currCase.getValue('custevent_imp_bank') );

			
			
			sublist.setLineItemValue('custpage_hid_glset', s+1, currCase.getValue('custevent_imp_glsetup') );
//			sublist.setLineItemValue('custpage_hid_imprt', s+1, currCase.getValue('custevent_imp_import') ); 
			sublist.setLineItemValue('custpage_hid_ssource', s+1, currCase.getValue('custevent_imp_systemtosource') );	
			sublist.setLineItemValue('custpage_hid_majorsh', s+1, currCase.getValue('custevent_imp_majorsh') )
			sublist.setLineItemValue('custpage_hid_welcome', s+1, currCase.getValue('custevent_imp_welcome') );
			sublist.setLineItemValue('custpage_hid_banklt', s+1, currCase.getValue('custevent_imp_banklet') );
			sublist.setLineItemValue('custpage_hid_deplt', s+1, currCase.getValue('custevent_imp_depverification') );
//			sublist.setLineItemValue('custpage_hid_eventlt', s+1, currCase.getValue('custevent_imp_eventgl') );
			sublist.setLineItemValue('custpage_hid_notes1', s+1, currCase.getValue('custevent_imp_memo') );
			sublist.setLineItemValue('custpage_hid_locked', s+1, currCase.getValue('custevent_imp_openrellock') );
		}
	}


form.setFieldValues({custpage_msgline: msgline})
form.addSubmitButton('Refresh');
var linkURL = nlapiResolveURL('SUITELET','customscript_importdashsuitelet','customdeploy_importdashsuitelet',null);
//form.addButton('custpage_reset','Refresh',"document.location='"+linkURL+"'");

var lockit = 1
form.setScript('customscript_srsimportclient');
form.addButton('custpage_lockupdate','Unlock Cases For Update',"listmanage("+incontrol+");");

var incontrol = 0

form.addButton('custpage_updreleses','Save Changes',"updateimport("+incontrol+");");

response.writePage(form);

}

else //OK, this is the Post
{
	var today = nlapiDateToString( new Date() );
	var params = new Object()
	var a1 = request.getParameter('custpage_assignedtofilter');
	params.assigedtofilter = request.getParameter('custpage_assignedtofilter');
	params.lockit = 0

	nlapiSetRedirectURL('SUITELET', 478, 1, null, params);	
	return;
}

}