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
	message = "Open Releases Dashboard Update"
	msgline = '<span style="font-weight:bold; font-size:200%; color:red"; class="right">' + message + '</span>'
	// add a sublist to the form
	var sublist = form.addSubList('custpage_releaselist','list','Release List');

	sublist.addField('custpage_deal','textarea','Deal Name')
	sublist.addField('custpage_importantnotes','text', 'IMP Notes');
	sublist.addField('custpage_number','text','Case Number');
	sublist.addField('custpage_subject','text','Subject');
	sublist.addField('custpage_assignedto','text','Assigned To');
	sublist.addField('custpage_lastnotedate','textarea','Last Note Date');
	sublist.addField('custpage_nextduedate','textarea','Next Due Date');
	sublist.addField('custpage_releasetowho','text','To');
	sublist.addField('custpage_releaseamount','text','$');
	sublist.addField('custpage_hid_internalid','integer').setDisplayType('hidden');

	var exp  = sublist.addField('custpage_release','select',"<a href='#' title='Release Expense Funds (EXP $)'>"+"EXP$"+"</a>")
	var efd  = sublist.addField('custpage_releaseexpensefundsdue','select',"<a href='#' title='Release Expense Funds Due (EFD)'>"+"EFD"+"</a>")
	var all  = sublist.addField('custpage_releaseallocated','select',"<a href='#' title='Release Allocated (ALL)'>"+"ALL$"+"</a>")
	var sch  = sublist.addField('custpage_releasescheduled','select',"<a href='#' title='Release Scheduled (SCH)'>"+"SCH"+"</a>")
	var eapa = sublist.addField('custpage_releasecontact','select',"<a href='#' title='Release Contact (EA/PA)'>"+"EA/PA"+"</a>")
	var pm   = sublist.addField('custpage_releasepayoutmechanics','select',"<a href='#' title='Release Payout Mechanics (PM)'>"+"PM"+"</a>")
	var v1   = sublist.addField('custpage_releasemoveverified','select',"<a href='#' title='Release Move Verified (V)'>"+"V"+"</a>")
	var ql   = sublist.addField('custpage_releasequietletter','select',"<a href='#' title='Release Quiet Letter (QL)'>"+"QL"+"</a>")
	var el   = sublist.addField('custpage_releaseexpirationletter','select',"<a href='#' title='Release Expiration Letter (EL)'>"+"EL"+"</a>")
	var il   = sublist.addField('custpage_releaseinstructionletter','select',"<a href='#' title='Release Instruction Letter (IL)'>"+"IL"+"</a>")
	var y1   = sublist.addField('custpage_releaseshareholderletter','select',"<a href='#' title='Release Shareholder Letter (SL)'>"+"SL"+"</a>")
	var lgl  = sublist.addField('custpage_releaselegalapproval','select',"<a href='#' title='Release Escrow Statement News(LA)'>"+"LA"+"</a>")
	var rp   = sublist.addField('custpage_releasetoportal','select',"<a href='#' title='Release to Portal (RP)'>"+"RP"+"</a>")
	var rsn  = sublist.addField('custpage_releaseescrowstatementnews','select',"<a href='#' title='Release Escrow Statement News (ESN)'>"+"RSN"+"</a>")

	exp.addSelectOption('1','B'); exp.addSelectOption('3','O'); exp.addSelectOption('2', 'S'); exp.addSelectOption('', '-');
	efd.addSelectOption('1','-'); efd.addSelectOption('3','Y'); efd.addSelectOption('2', 'N');
	all.addSelectOption('1','-'); all.addSelectOption('3','Y'); all.addSelectOption('2', 'N');
	sch.addSelectOption('1','-'); sch.addSelectOption('3','Y'); sch.addSelectOption('2', 'N');
	eapa.addSelectOption('1','-'); eapa.addSelectOption('3','Y'); eapa.addSelectOption('2', 'N');
	pm.addSelectOption('1','-'); pm.addSelectOption('3','Y'); pm.addSelectOption('2', 'N');
	v1.addSelectOption('1','-'); v1.addSelectOption('3','Y'); v1.addSelectOption('2', 'N');
	ql.addSelectOption('1','-'); ql.addSelectOption('3','Y'); ql.addSelectOption('2', 'N');
	el.addSelectOption('1','-'); el.addSelectOption('3','Y'); el.addSelectOption('2', 'N');
	il.addSelectOption('1','Y'); il.addSelectOption('2','A'); il.addSelectOption('3', 'N'); il.addSelectOption('4', '-'); il.addSelectOption('', ' ');
	y1.addSelectOption('1','-'); y1.addSelectOption('3','Y'); y1.addSelectOption('2', 'N');
	lgl.addSelectOption('1','-'); lgl.addSelectOption('3','Y'); lgl.addSelectOption('2', 'N');
	rp.addSelectOption('1','-'); rp.addSelectOption('3','Y'); rp.addSelectOption('2', 'N');
	rsn.addSelectOption('1','-'); rsn.addSelectOption('3','Y'); rsn.addSelectOption('2', 'N');

	//Hide Release Fields for later comparison for update in Client Script
	sublist.addField('custpage_hid_release','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseexpensefundsdue','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseallocated','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasescheduled','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasecontact','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasepayoutmechanics','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasemoveverified', 'text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasequietletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseexpirationletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseinstructionletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseshareholderletter','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaselegalapproval','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releasetoportal','text').setDisplayType('hidden');
	sublist.addField('custpage_hid_releaseescrowstatementnews','text').setDisplayType('hidden');
	
	//loop through the case results and construct/add the portlet data record
	if(caseResults != null && caseResults.length > 0)
	{
		var hash = new Object();
		//Main Case Loop
		for(var s = 0; s < caseResults.length; s++)
		{
	
			
			var currCase = caseResults[s];

			hash.deal = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('internalid','custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('companyname','custevent1')+'</a>';
			sublist.setLineItemValue('custpage_deal', s+1, '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('internalid','custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('companyname','custevent1')+'</a>');
			sublist.setLineItemValue('custpage_number', s+1, '<a href="#" title="Click here to view the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getId(),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('casenumber')+'</a>');
			sublist.setLineItemValue('custpage_subject', s+1, currCase.getValue('title') );
			sublist.setLineItemValue('custpage_assignedto', s+1, '<a href="#" title="Click here to edit the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getId(),'VIEW')+'&l=T&e=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getText('assigned')+'</a>');
			//Release Fields
			sublist.setLineItemValue('custpage_hid_internalid', s+1, currCase.getId() );
			sublist.setLineItemValue('custpage_releasetowho', s+1, currCase.getValue('custeventreleasetowho') );
			sublist.setLineItemValue('custpage_releaseamount', s+1, currCase.getValue('custeventreleaseamount') ); 
			sublist.setLineItemValue('custpage_release', s+1, currCase.getValue('custeventrelease') );	
			sublist.setLineItemValue('custpage_releaseexpensefundsdue', s+1, currCase.getValue('custeventreleaseexpensefundsdue') )
			sublist.setLineItemValue('custpage_releaseallocated', s+1, currCase.getValue('custeventreleaseallocated') );
			sublist.setLineItemValue('custpage_releasescheduled', s+1, currCase.getValue('custeventreleasescheduled') );
			sublist.setLineItemValue('custpage_releasecontact', s+1, currCase.getValue('custeventreleasecontact') );
			sublist.setLineItemValue('custpage_releasepayoutmechanics', s+1, currCase.getValue('custeventreleasepayoutmechanics') );
			sublist.setLineItemValue('custpage_releasemoveverified', s+1, currCase.getValue('custeventreleasemoveverified') );
			sublist.setLineItemValue('custpage_releasequietletter', s+1, currCase.getValue('custeventreleasequietletter') );
			sublist.setLineItemValue('custpage_releaseexpirationletter', s+1, currCase.getValue('custeventreleaseexpirationletter') );
			sublist.setLineItemValue('custpage_releaseinstructionletter', s+1, currCase.getValue('custeventreleaseinstructionletter') );
			sublist.setLineItemValue('custpage_releaseshareholderletter', s+1, currCase.getValue('custeventreleaseshareholderletter') );
			sublist.setLineItemValue('custpage_releaselegalapproval', s+1, currCase.getValue('custeventreleaselegalapproval') );
			sublist.setLineItemValue('custpage_releasetoportal', s+1, currCase.getValue('custeventreleasetoportal') );
			sublist.setLineItemValue('custpage_releaseescrowstatementnews', s+1, currCase.getValue('custeventreleaseescrowstatementnews') );

			//Hide Release Fields for later comparison for update in Client Script
			sublist.setLineItemValue('custpage_hid_release', s+1, currCase.getValue('custeventrelease') );	
			sublist.setLineItemValue('custpage_hid_releaseexpensefundsdue', s+1, currCase.getValue('custeventreleaseexpensefundsdue') )
			sublist.setLineItemValue('custpage_hid_releaseallocated', s+1, currCase.getValue('custeventreleaseallocated') );
			sublist.setLineItemValue('custpage_hid_releasescheduled', s+1, currCase.getValue('custeventreleasescheduled') );
			sublist.setLineItemValue('custpage_hid_releasecontact', s+1, currCase.getValue('custeventreleasecontact') );
			sublist.setLineItemValue('custpage_hid_releasepayoutmechanics', s+1, currCase.getValue('custeventreleasepayoutmechanics') );
			sublist.setLineItemValue('custpage_hid_releasemoveverified', s+1, currCase.getValue('custeventreleasemoveverified') );
			sublist.setLineItemValue('custpage_hid_releasequietletter', s+1, currCase.getValue('custeventreleasequietletter') );
			sublist.setLineItemValue('custpage_hid_releaseexpirationletter', s+1, currCase.getValue('custeventreleaseexpirationletter') );
			sublist.setLineItemValue('custpage_hid_releaseinstructionletter', s+1, currCase.getValue('custeventreleaseinstructionletter') );
			sublist.setLineItemValue('custpage_hid_releaseshareholderletter', s+1, currCase.getValue('custeventreleaseshareholderletter') );
			sublist.setLineItemValue('custpage_hid_releaselegalapproval', s+1, currCase.getValue('custeventreleaselegalapproval') );
 			sublist.setLineItemValue('custpage_hid_releasetoportal', s+1, currCase.getValue('custeventreleasetoportal') );
			sublist.setLineItemValue('custpage_hid_releaseescrowstatementnews', s+1, currCase.getValue('custeventreleaseescrowstatementnews') );


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
			var noteMessage = '<span style="font-weight: bold;">Last 4 Case Notes for '+currCase.getValue('companyname','custevent1')+' - #'+currCase.getValue('casenumber')+ '</span><BR><table id=supcasenotes>';
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
	             
	             hash.lastnotedate = '<div onMouseOver="var x = document.getElementById(\''+s+'supcasenote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+15))};x.style.left=(event.clientX-(x.offsetWidth-300))+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+s+'supcasenote\');x.style.display=\'none\'">'+hash.lastnotedate+'<div id="'+s+'supcasenote" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>';
				 
				 var hash1 = hash.lastnotedate.substring(0,1100)
				 sublist.setLineItemValue('custpage_lastnotedate', s+1, '<div onMouseOver="var x = document.getElementById(\''+s+'supcasenote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+15))};x.style.left=(event.clientX-(x.offsetWidth-300))+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+s+'supcasenote\');x.style.display=\'none\'">'+hash1+'<div id="'+s+'supcasenote" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>');


			//end new memo hover text
						
			//Find any relevant Event and add that to the portlet data row, otherwise simply use a default value.
			hash.nextduedate = '<a href="#" title="Click here to add a new Important Date." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'?l=T&record.supportcase='+currCase.getId()+'&record.invitee='+currCase.getValue('internalid','custevent1')+'&record.company='+currCase.getValue('internalid','custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
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
			}

		}
	}

form.setFieldValues({custpage_msgline: msgline})
form.addSubmitButton('ReSelect');
var linkURL = nlapiResolveURL('SUITELET','customscript_srsopenreleases','customdeploy_srsopenrelease',null);
var reset1 = form.addButton('custpage_reset','Reset',"document.location='"+linkURL+"'");

var incontrol = 0
form.setScript('customscript_srsopenrlsclient');
form.addButton('custpage_updreleses','Update Dashboard',"updatecases("+incontrol+");");

response.writePage(form);

}

else //OK, this is the Post
{
var params = new Object()
var a1 = request.getParameter('custpage_assignedtofilter');
params.assigedtofilter = request.getParameter('custpage_assignedtofilter');

nlapiSetRedirectURL('SUITELET', 275, 1, null, params);	
return;
}

}

