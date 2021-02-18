function releaseDashboardSuitelet(request,response)
{

//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a replacement Suitelet for an original Portlet, designed to give a comprehensive list of cases and their release stag info.
//Primary replacement function is to provide inline edit type functionality on each individual case for the release stage detail.

//This is the GET method

if ( request.getMethod() == 'GET' )
{

	//Added provision to lock lines for a user, so other uses cannot override
	var user = nlapiGetUser()
	var lockit = request.getParameter('lockit');
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
	    caseResults = nlapiSearchRecord('supportcase', 'customsearch1039', filter_case);
	}
	else
	    caseResults = nlapiSearchRecord('supportcase', 'customsearch1039');

	
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

//	var form = nlapiCreateForm('Open Releases Dashboard');  //Setup the selection form
	var form = nlapiCreateForm('');  //Setup the selection form

	var msgline = form.addField('custpage_msgline','inlinehtml', null, null)
	form.addField('custpage_assignedtofilter','select','Select Support Rep', '-4')
	message = "Open Releases Dashboard"
	msgline = '<span style="font-weight:bold; font-size:200%; color:black"; class="right">' + message + '</span>'
	// add a sublist to the form
	var sublist = form.addSubList('custpage_releaselist','list','Release List');

	var lock = sublist.addField('custpage_locked','checkbox',"<a href='#' style=color:red title='Reserve For Udpate'>"+"Update"+"</a>").setDisplaySize(1)
//	sublist.addField('custpage_lockedind','text',"<a href='#' style=color:red title='Who'>"+"Who"+"</a>")
	var excla = sublist.addField('custpage_excalated','checkbox',"<a href='#' style=color:#3399FF title='Excalated to Compliance'>"+"!"+"</a>").setDisplayType(distype).setDisplaySize(1)
	sublist.addField('custpage_deal','textarea','Deal Name')
	sublist.addField('custpage_number','text','Case Number');
	sublist.addField('custpage_subject','text','Subject');
	sublist.addField('custpage_assignedto','text','Assigned To');
	sublist.addField('custpage_lastnotedate','textarea','Last Note Date')
//	sublist.addField('custpage_nextduedate','textarea','Expire');
	sublist.addField('custpage_expire','date','Expire').setDisplayType('entry').setDisplayType(distype); //STS ADDED 
	sublist.addField('custpage_releasetowho','text','To');
	sublist.addField('custpage_releaseamount','currency','$').setDisplayType('entry').setDisplayType(distype).setDisplaySize(10)
	sublist.addField('custpage_importantnotes','text', 'IMP Notes');
	sublist.addField('custpage_hid_internalid','integer').setDisplayType('hidden');

	//var expire = sublist.addField('custpage_expire','date',"<a href='#' style=color:#339933 title='Expire Date (Expire)'>"+"Expire"+"</a>")    //STS ADDED
	var eapa1 = sublist.addField('custpage_releasecontact','select',"<a href='#' style=color:#339933 title='Release Contact (EA)'>"+"EA"+"</a>").setDisplayType(distype).setDisplaySize(60)
	var eapa2 = sublist.addField('custpage_pareleasecontact1','select',"<a href='#' style=color:#339933 title='Release Contact (PA)'>"+"PA"+"</a>").setDisplayType(distype)
	var ee1  = sublist.addField('custpage_releaseexpensefundsdue','select',"<a href='#' style=color:#339933 title='Escrow Exchange (EE)'>"+"EE"+"</a>").setDisplayType(distype);
	var exp  = sublist.addField('custpage_release','select',"<a href='#' style=color:#339933 title='Expense Fund Location and Being Released (EXP$)'>"+"EXP$"+"</a>").setDisplayType(distype);
	var sch  = sublist.addField('custpage_releasescheduled','select',"<a href='#' style=color:#339933 title='Release Schedule (SCH)'>"+"SCH"+"</a>").setDisplayType(distype);
	var pm   = sublist.addField('custpage_releasepayoutmechanics','select',"<a href='#' style=color:#339933 title='Release Payout Mechanics (PM)'>"+"PM"+"</a>").setDisplayType(distype);
	var v1   = sublist.addField('custpage_releasemoveverified','select',"<a href='#' style=color:#339933 title='Funds / Shares Distributed (VER)'>"+"VER"+"</a>").setDisplayType(distype);
	var all  = sublist.addField('custpage_releaseallocated','select',"<a href='#' style=color:#339933 title='Booked, Allocated, Released, Negative Shareholder? (ALL)'>"+"ALL"+"</a>").setDisplayType(distype);
	var ql   = sublist.addField('custpage_releasequietletter','select',"<a href='#' style=color:#3399FF style=color:#3399FF title='Release Quiet Letter (QL)'>"+"QL"+"</a>").setDisplayType(distype);
	var el   = sublist.addField('custpage_releaseexpirationletter','select',"<a href='#' style=color:#3399FF title='Release Expiration Letter (EL)'>"+"EL"+"</a>").setDisplayType(distype);
	var il   = sublist.addField('custpage_releaseinstructionletter','select',"<a href='#' style=color:#3399FF title='Release Instruction Letter (IL)'>"+"IL"+"</a>").setDisplayType(distype);
	var sl1  = sublist.addField('custpage_releaseshareholderletter','select',"<a href='#' style=color:#3399FF title='Release Shareholder Letter (SL)'>"+"SL"+"</a>").setDisplayType(distype);
	var lgl  = sublist.addField('custpage_releaselegalapproval','select',"<a href='#' style=color:#3399FF title='Legal Approval (LA)'>"+"LA"+"</a>").setDisplayType(distype);
//	var rp   = sublist.addField('custpage_releasetoportal','select',"<a href='#' style=color:#3399FF title='Release to Portal (RP)'>"+"RP"+"</a>").setDisplayType(distype);
	var esn  = sublist.addField('custpage_releaseescrowstatementnews','select',"<a href='#' style=color:#3399FF title='Release Escrow Statement News (ESN)'>"+"ESN"+"</a>").setDisplayType(distype);

	exp.addSelectOption('1','B - (EXP)'); exp.addSelectOption('3','S - (EXP)'); exp.addSelectOption('2', 'N - (EXP)'); exp.addSelectOption('', '- - (EXP)');
	ee1.addSelectOption('1','- - (EE)'); ee1.addSelectOption('3','Y - (EE)'); ee1.addSelectOption('2', 'N - (EE)');
	all.addSelectOption('1','- - (ALL)'); all.addSelectOption('3','Y - (ALL)'); all.addSelectOption('2', 'N - (ALL)');
	sch.addSelectOption('1','- - (SCH)'); sch.addSelectOption('3','Y - (SCH)'); sch.addSelectOption('2', 'N - (SCH)');
	eapa1.addSelectOption('1','AST - (EA)'); eapa1.addSelectOption('2','BNY - (EA)'); eapa1.addSelectOption('3', 'Buy - (EA)'); eapa1.addSelectOption('4','Cap1 - (EA)'); eapa1.addSelectOption('5', 'Citi - (EA)');
	eapa1.addSelectOption('6','COM - (EA)'); eapa1.addSelectOption('7','CS - (EA)');  eapa1.addSelectOption('8', 'CST - (EA)'); eapa1.addSelectOption('9','DB - (EA)');  eapa1.addSelectOption('10', 'ESOP - (EA)');
	eapa1.addSelectOption('11','JPM - (EA)'); eapa1.addSelectOption('12','SGS - (EA)'); eapa1.addSelectOption('13', 'Sun - (EA)'); eapa1.addSelectOption('14','SVB - (EA)'); eapa1.addSelectOption('15', 'Union - (EA)');
	eapa1.addSelectOption('16','USB - (EA)'); eapa1.addSelectOption('17','Wilm - (EA)'); eapa1.addSelectOption('18', 'WF - (EA)'); eapa1.addSelectOption('19','Other - (EA)'); eapa1.addSelectOption('','- - (EA)');
	eapa2.addSelectOption('1','AST - (PA)'); eapa2.addSelectOption('2','BNY - (PA)'); eapa2.addSelectOption('3', 'Buy - (PA)'); eapa2.addSelectOption('4','Cap1 - (PA)'); eapa2.addSelectOption('5', 'Citi - (PA)');
	eapa2.addSelectOption('6','COM - (PA)'); eapa2.addSelectOption('7','CS - (PA)');  eapa2.addSelectOption('8', 'CST - (PA)'); eapa2.addSelectOption('9','DB - (PA)');  eapa2.addSelectOption('10', 'ESOP - (PA)');
	eapa2.addSelectOption('11','JPM - (PA)'); eapa2.addSelectOption('12','SGS - (PA)'); eapa2.addSelectOption('13', 'Sun - (PA)'); eapa2.addSelectOption('14','SVB - (PA)'); eapa2.addSelectOption('15', 'Union - (PA)');
	eapa2.addSelectOption('16','USB - (PA)'); eapa2.addSelectOption('17','Wilm - (PA)'); eapa2.addSelectOption('18', 'WF - (PA)'); eapa2.addSelectOption('19','Other - (PA)'); eapa2.addSelectOption('','-  - (PA)');
	pm.addSelectOption('1','- - (PM)'); pm.addSelectOption('3','Y - (PM)'); pm.addSelectOption('2', 'N - (PM)');
	v1.addSelectOption('1','- - (VER)'); v1.addSelectOption('3','Y - (VER)'); v1.addSelectOption('2', 'N - (VER)');
	ql.addSelectOption('1','D - (QL)'); ql.addSelectOption('3','S - (QL)'); ql.addSelectOption('2', 'N/A - (QL)'); ql.addSelectOption('', '- - (QL)');
	el.addSelectOption('1','D - (EL)'); el.addSelectOption('3','S - (EL)'); el.addSelectOption('2', 'N/A - (EL)'); el.addSelectOption('', '- - (EL)');
	il.addSelectOption('1','Auto - (IL)'); il.addSelectOption('2','D - (IL)'); il.addSelectOption('3', 'A - (IL)'); il.addSelectOption('4', 'S - (IL)'); il.addSelectOption('5', 'N/A - (IL)'); il.addSelectOption('', '- - (IL)');
	sl1.addSelectOption('1','D - (SL)'); sl1.addSelectOption('3','S - (SL)'); sl1.addSelectOption('2', 'N/A - (SL)'); sl1.addSelectOption('', '- - (SL)');
	lgl.addSelectOption('1','- - (LA)'); lgl.addSelectOption('3','Y - (LA)'); lgl.addSelectOption('2', 'N - (LA)');
//	rp.addSelectOption('1','-'); rp.addSelectOption('3','Y'); rp.addSelectOption('2', 'N');
	esn.addSelectOption('1','- - (ESN)'); esn.addSelectOption('3','Y - (ESN)'); esn.addSelectOption('2', 'N - (ESN)');

	//Hide Release Fields for later comparison for update in Client Script
	sublist.addField('custpage_hid_excalated','checkbox').setDisplayType('hidden');
	sublist.addField('custpage_hid_release','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseexpensefundsdue','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_expire','date').setDisplayType('hidden');    //STS ADDED
	sublist.addField('custpage_hid_releaseamount','text').setDisplayType('hidden');    //STS ADDED
	sublist.addField('custpage_hid_releaseallocated','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasescheduled','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasecontact','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_pareleasecontact1','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasepayoutmechanics','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasemoveverified', 'text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasequietletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseexpirationletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseinstructionletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseshareholderletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaselegalapproval','text').setDisplayType('hidden');
//	sublist.addField('custpage_hid_releasetoportal','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseescrowstatementnews','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_locked','text').setDisplayType('hidden');
	
	//loop through the case results and construct/add the portlet data record
	if(caseResults != null && caseResults.length > 0)
	{
		var hash = new Object();
		//Main Case Loop
		for(var s = 0; s < caseResults.length; s++)
		{
			
			var currCase = caseResults[s];
			if (s == 3)
			{
				break;
			}


			hash.deal = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('internalid','custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('companyname','custevent1')+'</a>';
			sublist.setLineItemValue('custpage_excalated', s+1, currCase.getValue('custevent_excalated') );
			sublist.setLineItemValue('custpage_deal', s+1, '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('internalid','custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('companyname','custevent1')+'</a>');
			sublist.setLineItemValue('custpage_number', s+1, '<a href="#" title="Click here to view the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getId(),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('casenumber')+'</a>');
			sublist.setLineItemValue('custpage_subject', s+1, currCase.getValue('title') );
			sublist.setLineItemValue('custpage_assignedto', s+1, '<a href="#" title="Click here to edit the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getId(),'VIEW')+'&l=T&e=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getText('assigned')+'</a>');
			//Release Fields
			sublist.setLineItemValue('custpage_hid_internalid', s+1, currCase.getId() );
			sublist.setLineItemValue('custpage_expire', s+1, currCase.getValue('custevent_release_expire_date') )   //STS ADDED
			sublist.setLineItemValue('custpage_releasetowho', s+1, currCase.getText('custevent_case_category') );
			sublist.setLineItemValue('custpage_releaseamount', s+1, currCase.getValue('custeventreleaseamount') ); 
			sublist.setLineItemValue('custpage_release', s+1, currCase.getValue('custeventrelease') );	
			sublist.setLineItemValue('custpage_releaseexpensefundsdue', s+1, currCase.getValue('custeventreleaseexpensefundsdue') )
			sublist.setLineItemValue('custpage_releaseallocated', s+1, currCase.getValue('custeventreleaseallocated') );
			sublist.setLineItemValue('custpage_releasescheduled', s+1, currCase.getValue('custeventreleasescheduled') );
			sublist.setLineItemValue('custpage_releasecontact', s+1, currCase.getValue('custeventreleasecontact') );
			sublist.setLineItemValue('custpage_pareleasecontact1', s+1, currCase.getValue('custeventreleasecontactpa') );
			sublist.setLineItemValue('custpage_releasepayoutmechanics', s+1, currCase.getValue('custeventreleasepayoutmechanics') );
			sublist.setLineItemValue('custpage_releasemoveverified', s+1, currCase.getValue('custeventreleasemoveverified') );
			sublist.setLineItemValue('custpage_releasequietletter', s+1, currCase.getValue('custeventreleasequietletter') );
			sublist.setLineItemValue('custpage_releaseexpirationletter', s+1, currCase.getValue('custeventreleaseexpirationletter') );
			sublist.setLineItemValue('custpage_releaseinstructionletter', s+1, currCase.getValue('custeventreleaseinstructionletter') );
			sublist.setLineItemValue('custpage_releaseshareholderletter', s+1, currCase.getValue('custeventreleaseshareholderletter') );
			sublist.setLineItemValue('custpage_releaselegalapproval', s+1, currCase.getValue('custeventreleaselegalapproval') );
//			sublist.setLineItemValue('custpage_releasetoportal', s+1, currCase.getValue('custeventreleasetoportal') );
			sublist.setLineItemValue('custpage_releaseescrowstatementnews', s+1, currCase.getValue('custeventreleaseescrowstatementnews') );

			//Hide Release Fields for later comparison for update in Client Script
			sublist.setLineItemValue('custpage_hid_excalated', s+1, currCase.getValue('custevent_excalated') );
			sublist.setLineItemValue('custpage_hid_release', s+1, currCase.getValue('custeventrelease') );
			sublist.setLineItemValue('custpage_hid_expire', s+1, currCase.getValue('custevent_release_expire_date') );	    //STS ADDED
			sublist.setLineItemValue('custpage_hid_releaseamount', s+1, currCase.getValue('custeventreleaseamount') );      //STS ADDED
			sublist.setLineItemValue('custpage_hid_releaseexpensefundsdue', s+1, currCase.getValue('custeventreleaseexpensefundsdue') )
			sublist.setLineItemValue('custpage_hid_releaseallocated', s+1, currCase.getValue('custeventreleaseallocated') );
			sublist.setLineItemValue('custpage_hid_releasescheduled', s+1, currCase.getValue('custeventreleasescheduled') );
			sublist.setLineItemValue('custpage_hid_releasecontact', s+1, currCase.getValue('custeventreleasecontact') );
			sublist.setLineItemValue('custpage_hid_pareleasecontact1', s+1, currCase.getValue('custeventreleasecontactpa') );
			sublist.setLineItemValue('custpage_hid_releasepayoutmechanics', s+1, currCase.getValue('custeventreleasepayoutmechanics') );
			sublist.setLineItemValue('custpage_hid_releasemoveverified', s+1, currCase.getValue('custeventreleasemoveverified') );
			sublist.setLineItemValue('custpage_hid_releasequietletter', s+1, currCase.getValue('custeventreleasequietletter') );
			sublist.setLineItemValue('custpage_hid_releaseexpirationletter', s+1, currCase.getValue('custeventreleaseexpirationletter') );
			sublist.setLineItemValue('custpage_hid_releaseinstructionletter', s+1, currCase.getValue('custeventreleaseinstructionletter') );
			sublist.setLineItemValue('custpage_hid_releaseshareholderletter', s+1, currCase.getValue('custeventreleaseshareholderletter') );
			sublist.setLineItemValue('custpage_hid_releaselegalapproval', s+1, currCase.getValue('custeventreleaselegalapproval') );
 //			sublist.setLineItemValue('custpage_hid_releasetoportal', s+1, currCase.getValue('custeventreleasetoportal') );
			sublist.setLineItemValue('custpage_hid_releaseescrowstatementnews', s+1, currCase.getValue('custeventreleaseescrowstatementnews') );
			sublist.setLineItemValue('custpage_hid_locked', s+1, currCase.getValue('custevent_openrellock') );


			//Let's see if there are anu Important Notes to signal
			var compid = currCase.getValue('company')
			var filter_note = new Array();
			filter_note[0] = new nlobjSearchFilter('internalid', null, 'anyof', compid);
			var usrnotes = nlapiSearchRecord('customer', 'customsearch_openrlnotes', filter_note, null);

			if (usrnotes != null)
			{
//				sublist.setLineItemValue('custpage_importantnotes', s+1, '<span style="font-weight:bold; font-size:100%; color:red"; class="right">' + "Yes" + '</span>');
				sublist.setLineItemValue('custpage_importantnotes', s+1, 'Yes');
			}
	
			//Check to see if we should flag as Rep & Warranty
//			nlapiLogExecution('DEBUG','SRSPortlets.OpenReleaseDashboard','Looking for R&W status 1 = yes: '+ currCase.getValue('custentity_rep_warranty_insurance','customer'));
			if(currCase.getValue('custentity_rep_warranty_insurance','customer') != null && (currCase.getValue('custentity_rep_warranty_insurance','customer') == 1)) 
			{
				hash.deal = '<font size="2" color="black">RW</font>&nbsp;'+hash.deal;
				sublist.setLineItemValue('custpage_deal', s+1, hash.deal)

			}

			//MAKE SURE TO ADD THESE FIELDS INTO THE SEARCH RESULTS IN ORDER TO CHECK FOR THIS STUFF BELOW		
			if((currCase.getValue('custevent_legalhold_start_date') != '') && (currCase.getValue('custevent_legalhold_end_date') == '')) 
			{
				hash.deal = '<font size="2" color="Red">LH</font>&nbsp;'+hash.deal;
				sublist.setLineItemValue('custpage_deal', s+1, hash.deal)   
			}


//new notes/memo hover text
//setup notes to get only last 4
			
//			var contactToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:400px;text-decoration:none;z-index:100;";	
			var contactToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:auto;width:400px;text-decoration:none;z-index:1;";	
            
//	        var id = currCase.getId();
	        var id = currCase.getId();
			var noteCount = 0;
			var noteMessage = '<span style="font-weight: bold;">Last 4 Case Notes for '+currCase.getValue('companyname','custevent1')+' - #'+currCase.getValue('casenumber')+ '</span><BR/><table id=notes>';
			var lastNoteDate = null;
			
			//get the case notes/memos
			var filter_memo = new Array();
			filter_memo[0] = new nlobjSearchFilter('internalid', 'case', 'anyof', id);
			memoResults = nlapiSearchRecord('phonecall','customsearch_support_dashboard_memos', filter_memo);
			
			 for (var t = 0; memoResults != null && t < memoResults.length; t++) 
             {
				var noteRow = memoResults[t];
				if (noteCount < 4)
				{				
					noteMessage = noteMessage + '<tr><td valign="top" width="10%" style="font-size:70%">' +  noteRow.getValue('startdate') + '</td><td valign="top" width="18%" style="font-size:70%">' + noteRow.getText('createdby') + '</td><td valign="top" width="72%" style="font-size:70%">' + noteRow.getValue('message') + '</td></tr>'
					if (noteCount == 0)  //Since the date is sorted by date desc, this should be the last contact date
					{
						//get most recent date
						lastNoteDate = noteRow.getValue('startdate');					
					}
					noteCount++
				}
			}
			  noteMessage = noteMessage + '</table>'
			  
				//setting the display for the date. set to -none- if no date, else set to the date. 
				if (lastNoteDate == '' || lastNoteDate == null)
					{
					 hash.lastnotedate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getId() + '&amp;record.invitee=' + currCase.getValue('internalid', 'custevent1') + '&amp;record.company=' + currCase.getValue('internalid', 'custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">-none-</a>';
					 sublist.setLineItemValue('custpage_lastnotedate', s+1, '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getId() + '&amp;record.invitee=' + currCase.getValue('internalid', 'custevent1') + '&amp;record.company=' + currCase.getValue('internalid', 'custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">-none-</a>');
					 noteMessage = 'No case notes have been entered. Click to enter a new case note.';
					 
					}
				else
					{
					hash.lastnotedate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getId() + '&amp;record.invitee=' + currCase.getValue('internalid', 'custevent1') + '&amp;record.company=' + currCase.getValue('internalid', 'custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">' + lastNoteDate + '</a>';
					sublist.setLineItemValue('custpage_lastnotedate', s+1, '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getId() + '&amp;record.invitee=' + currCase.getValue('internalid', 'custevent1') + '&amp;record.company=' + currCase.getValue('internalid', 'custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">' + lastNoteDate + '</a>');
					}
		
			//	var dateToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
			  //add hover feature to display up to 4 note records
	             
				 hash.lastnotedate = '<div onMouseOver="var x = document.getElementById(\''+s+1+'supcasenote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+15))};x.style.left=(event.clientX-(x.offsetWidth-300))+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+s+1+'supcasenote\');x.style.display=\'none\'">'+hash.lastnotedate+'<div id="'+s+1+'supcasenote" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>';

//				 Removed this as Notes were not organized correctly
//				 var hash1 = hash.lastnotedate.substring(0,1100)
//				 sublist.setLineItemValue('custpage_lastnotedate', s+1, '<div onMouseOver="var x = document.getElementById(\''+s+1+'supcasenote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+15))};x.style.left=(event.clientX-(x.offsetWidth-300))+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+s+1+'supcasenote\');x.style.display=\'none\'">'+hash1+'<div id="'+s+1+'supcasenote" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>');
				 sublist.setLineItemValue('custpage_lastnotedate', s+1, hash.lastnotedate)


			//end new memo hover text
						
			//Find any relevant Event and add that to the portlet data row, otherwise simply use a default value.
			/*hash.nextduedate = '<a href="#" title="Click here to add a new Important Date." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'?l=T&record.supportcase='+currCase.getId()+'&record.invitee='+currCase.getValue('internalid','custevent1')+'&record.company='+currCase.getValue('internalid','custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
			sublist.setLineItemValue('custpage_nextduedate', s+1, hash.nextduedate)  
			if(eventResults != null && eventResults.length > 0)
			{
				for(var er = 0; er < eventResults.length; er++)
				{
					if(eventResults[er].getValue('internalid','case','group') == currCase.getId()) 
					{
						hash.nextduedate = '<a href="#" title="'+eventResults[er].getValue(columnEventTitle)+' :: '+eventResults[er].getValue(columnEventMessage)+'" onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'?l=T&record.supportcase='+currCase.getId()+'&record.invitee='+currCase.getValue('internalid','custevent1')+'&record.company='+currCase.getValue('internalid','custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+eventResults[er].getValue(columnEventDate)+'</a>';
						sublist.setLineItemValue('custpage_nextduedate', s+1, hash.nextduedate)  
					}
				}
			}*/

		}
	}

form.setFieldValues({custpage_msgline: msgline})
form.addSubmitButton('Refresh');
var linkURL = nlapiResolveURL('SUITELET','customscript_srsopenreleases','customdeploy_srsopenrelease',null);
//var reset1 = form.addButton('custpage_reset','Reset',"document.location='"+linkURL+"'");

var lockit = 1
form.setScript('customscript_srsopenrlsclient');
//form.setScript('customscript_srsopenreleaseslist');
form.addButton('custpage_lockupdate','Unlock Cases For Update',"listmanage("+incontrol+");");
form.addButton('custpage_exportrelease','Export',"exportrelease("+incontrol+");");
//var lockforupdate = form.addButton('custpage_lockupdate','Unlock Records For Update',"document.location='"+linkURL+"&lockit="+lockit+"'");

var incontrol = 0

form.addButton('custpage_updreleses','Save Changes',"updatecases("+incontrol+");");

response.writePage(form);

}

else //OK, this is the Post
{
var params = new Object()
var a1 = request.getParameter('custpage_assignedtofilter');
params.assigedtofilter = request.getParameter('custpage_assignedtofilter');
params.lockit = 0

//Here we will create an export of the OPen Reakease Dashboard

//file attachment params
var headerRow = "CSV_Deal,Case,Subject,Assigned,Last Note,Expire,To, Amount, Imp Note, \n";
var filteredresults = headerRow;
var fileType='CSV';

var size = request.getLineItemCount('custpage_releaselist'); 
nlapiLogExecution('Error','Response','Count = ' + size);

//Lets loop thru all the line to see if we can find updates
for(z=1;z<=size;z++)
{
	var deal = request.getLineItemValue('custpage_releaselist', 'custpage_deal', z) 
	var casenm = request.getLineItemValue('custpage_releaselist', 'custpage_number', z) 
	var subject = request.getLineItemValue('custpage_releaselist', 'custpage_subject', z) 
	var assigned = request.getLineItemValue('custpage_releaselist', 'custpage_assignedto', z) 
	var lastnote = request.getLineItemValue('custpage_releaselist', 'custpage_lastnotedate', z) 
	var expire = request.getLineItemValue('custpage_releaselist', 'custpage_expire', z) 
	var to = request.getLineItemValue('custpage_releaselist', 'custpage_releasetowho', z) 
	var amt = request.getLineItemValue('custpage_releaselist', 'custpage_releaseamount', z) 
	var impnote = request.getLineItemValue('custpage_releaselist', 'custpage_importantnotes', z) 
	var eapa1 =	request.getLineItemValue('custpage_releaselist', 'custpage_releasecontact', z) 
	var eapa2 =	request.getLineItemValue('custpage_releaselist', 'custpage_pareleasecontact1', z) 
	var ee1 = request.getLineItemValue('custpage_releaselist', 'custpage_releaseexpensefundsdue', z) 
	var exp = request.getLineItemValue('custpage_releaselist', 'custpage_release', z) 
	var sch = request.getLineItemValue('custpage_releaselist', 'custpage_releasescheduled', z) 
	var pm = request.getLineItemValue('custpage_releaselist', 'custpage_releasepayoutmechanics', z) 
	var v1 = request.getLineItemValue('custpage_releaselist', 'custpage_releasemoveverified', z) 
	var all = request.getLineItemValue('custpage_releaselist', 'custpage_releaseallocated', z) 
	var ql = request.getLineItemValue('custpage_releaselist', 'custpage_releasequietletter', z) 
	var el = request.getLineItemValue('custpage_releaselist', 'custpage_releaseexpirationletter', z) 
	var il = request.getLineItemValue('custpage_releaselist', 'custpage_releaseinstructionletter', z) 
	var sl1 = request.getLineItemValue('custpage_releaselist', 'custpage_releaseshareholderletter', z) 
	var lgl = request.getLineItemValue('custpage_releaselist', 'custpage_releaselegalapproval', z) 
	var esn = request.getLineItemValue('custpage_releaselist', 'custpage_releaseescrowstatementnews', z) 

	filteredresults += deal + "," + casenm + "," + subject + "," + assigned + "," + lastnote +  "," + expire + "," + to + "," + amt + "," + impnote +
	"," + eapa1 + "," + eapa2 + "," + ee1 + "," + exp + "," + sch +  "," + pm + "," + v1 + "," + all + "," + ql + "," + el + "," + il +
	"," + sl1 + ","  + lgl +  "," + esn + "\n";

}

var nameofFile='Open Release Export' + '.csv';
var releasecsv = nlapiCreateFile(nameofFile,"CSV",filteredresults);
var folder = 623363
releasecsv.setFolder(folder)
var fileid = nlapiSubmitFile(releasecsv)

nlapiSetRedirectURL('SUITELET', 275, 1, null, params);	
return;
}

}

