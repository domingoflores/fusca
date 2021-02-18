/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : DupeCase.js 
* @ AUTHOR        : Kapil Agarwal
* @ DATE          : 2008/03/07
*
* Copyright (c) 2007 Upaya - The Solution Inc. 
* 10530 N. Portal Avenue, Cupertino CA 95014
* All Rights Reserved.
*
* This software is the confidential and proprietary information of 
* Upaya - The Solution Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with Upaya.
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


//Function to close Duplicate Case

var fx = 'closedupe';


function closedupe(type)
{

	var dupestat = 7;
	var dupe;
	var duperec;
	var rec;

	var fields = new Array();
	var values = new Array();

	var msgarr = new Array();
	var msgrec;
	var msg;

	var subj;
	var ndate;
	var ndatestr;
	var findspace;
	var ntime;
	var authorid;
	var emp;

	try
	{
		
	if((type == 'create') || (type == 'edit'))
	{
		rec = nlapiGetNewRecord();

		if(rec.getFieldValue('custevent_dupe_processed') == 'T')
		{
			return;
		}

		dupe = rec.getFieldValue('custevent_dupe');
		
		if(!dupe)
		{
			return;
		}
		
		duperec = nlapiLoadRecord(rec.getRecordType(), dupe);
		
		if(!(duperec.getFieldValue('custevent1')))
		{
			duperec.setFieldValue('custevent1', rec.getFieldValue('custevent1'));
		}	
		
		if(!(duperec.getFieldValue('custevent24')))
		{
			duperec.setFieldValue('custevent24', rec.getFieldValue('custevent24'));
		}
		
		if(!(duperec.getFieldValue('contact')))
		{
			duperec.setFieldValue('contact', rec.getFieldValue('contact'));
		}

		if(!(duperec.getFieldValue('email')))
		{
			duperec.setFieldValue('email', rec.getFieldValue('email'));
		}		

		if(!(duperec.getFieldValue('phone')))
		{
			duperec.setFieldValue('phone', rec.getFieldValue('phone'));
		}		
	
		if(!(duperec.getFieldValue('custevent_case_type')))
		{
			duperec.setFieldValue('custevent_case_type', rec.getFieldValue('custevent_case_type'));
		}	

		if(!(duperec.getFieldValue('custevent_case_issue')))
		{
			duperec.setFieldValue('custevent_case_issue', rec.getFieldValue('custevent_case_issue'));
		}

		if(!(duperec.getFieldValue('priority')))
		{
			duperec.setFieldValue('priority', rec.getFieldValue('priority'));
		}

		if(!(duperec.getFieldValue('origin')))
		{
			duperec.setFieldValue('origin', rec.getFieldValue('origin'));
		}

		if(!(duperec.getFieldValue('assigned')))
		{
			duperec.setFieldValue('assigned', rec.getFieldValue('assigned'));
		}

		if(!(duperec.getFieldValue('custevent22')))
		{
			duperec.setFieldValue('custevent22', rec.getFieldValue('custevent22'));
		}	
		
		if(!(duperec.getFieldValue('custevent23')))
		{
			duperec.setFieldValue('custevent23', rec.getFieldValue('custevent23'));
		}

		if(!(duperec.getFieldValue('custevent25')))
		{
			duperec.setFieldValue('custevent25', rec.getFieldValue('custevent25'));
		}

		if(!(duperec.getFieldValue('custevent26')))
		{
			duperec.setFieldValue('custevent26', rec.getFieldValue('custevent26'));
		}

		if(!(duperec.getFieldValue('custevent26')))
		{
			duperec.setFieldValue('custevent26', rec.getFieldValue('custevent26'));
		}

		if(duperec.getFieldValue('custevent15') == 'F')
		{
			duperec.setFieldValue('custevent15', rec.getFieldValue('custevent15'));
		}

		if(duperec.getFieldValue('custevent16') == 'F')
		{
			duperec.setFieldValue('custevent16', rec.getFieldValue('custevent16'));
		}

		nlapiSubmitRecord(duperec, true);

						
		fields[0] = 'custevent_dupe_processed';
		values[0] = 'T';
 
		fields[1] = 'status';
		values[1] = dupestat;
 
		nlapiSubmitField(rec.getRecordType(), rec.getId(), fields, values, 'T');

		msgarr = getMessages(rec.getId());
		if(!(msgarr))
		{
			return;
		}
			
		for (i = 0; msgarr != null && i < msgarr.length; i++ )
		{
			msg = msgarr[i];
		
			msgrec = nlapiCreateRecord('note');
			msgrec.setFieldValue('note', msg.getValue('message', 'messages'));
	
			ndate = msg.getValue('messagedate', 'messages');
			nlapiLogExecution( 'DEBUG', fx + '<100>', 'ndate: ' + ndate);
			

			findspace = ndate.indexOf(' ');
			if(findspace > -1)
			{
				ndatestr = ndate.substr(0, findspace);
				ntime = ndate.substr(findspace + 1);
			}
			else
			{
				ndatestr = ndate;
				ntime = '';
			}
			nlapiLogExecution( 'DEBUG', fx + '<120>', 'ndatestr: ' + ndatestr + ' ntime: ' + ntime);
			

			msgrec.setFieldValue('notedate', ndatestr);
			msgrec.setFieldValue('time', ntime); 
			msgrec.setFieldValue('notetype', 3); 

			subj = msg.getValue('subject', 'messages');
			if(!subj)
			{
				subj = 'Copied from Case: ' + rec.getFieldValue('casenumber');

			}
			msgrec.setFieldValue('title', subj); 
			msgrec.setFieldValue('activity', duperec.getId()); 

			authorid = msg.getValue('author', 'messages');
			emp = getEmp(authorid);

			if (emp != -100)
			{
				msgrec.setFieldValue('author', emp);
				msgrec.setFieldValue('direction', 2);
			} 
			else
			{
				msgrec.setFieldValue('direction', 1);
			}
			nlapiSubmitRecord(msgrec, true);

		}// for		
		
			
	} //if type
	} //try 
	catch ( e )
        {
            if ( e instanceof nlobjError )
	    {
                errmsg = e.getCode() + '\n' + e.getDetails();
	
            }
	   else
	   {
		errmsg = e.toString();
           }
	
		nlapiLogExecution( 'ERROR', fx + '<999> type:'+ type, errmsg);
        } //catch
			
} //end	closedupe

function getMessages(id)
{
	var rec;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', id, null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('messagedate', 'messages');
	columns[1] = new nlobjSearchColumn('author', 'messages');
	columns[2] = new nlobjSearchColumn('recipient', 'messages');
	columns[3] = new nlobjSearchColumn('subject', 'messages');
	columns[4] = new nlobjSearchColumn('message', 'messages');
	columns[5] = new nlobjSearchColumn('internalid', 'messages');
	
	var searchresults = nlapiSearchRecord( 'supportcase', null, filters, columns);

	
/*	
	for (i = 0; searchresults != null && i < searchresults.length && i < 100; i++ )
	{
		rec = searchresults[i] 
		nlapiLogExecution( 'DEBUG', fx + '<100>', 'date: ' + rec.getValue('messagedate', 'messages'));
		nlapiLogExecution( 'DEBUG', fx + '<110>', 'author: ' + rec.getValue('author', 'messages'));
		nlapiLogExecution( 'DEBUG', fx + '<120>', 'recipient: ' + rec.getValue('recipient', 'messages'));
		nlapiLogExecution( 'DEBUG', fx + '<130>', 'subject: ' + rec.getValue('subject', 'messages'));
		nlapiLogExecution( 'DEBUG', fx + '<140>', 'message: ' + rec.getValue('message', 'messages'));
		nlapiLogExecution( 'DEBUG', fx + '<150>', 'id: ' + rec.getValue('internalid', 'messages'));
		
		ctr = 1;
		
	}
*/

	return searchresults;
	
	
 
} //end

function getEmp(id)
{
	var retval = -100;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', id, null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var searchresults = nlapiSearchRecord( 'employee', null, filters, columns);
	
	if(searchresults)
	{
		if(searchresults[0].getValue('internalid'))
		{
			retval = searchresults[0].getValue('internalid');
		}
	}
	return retval; 
} //end
 