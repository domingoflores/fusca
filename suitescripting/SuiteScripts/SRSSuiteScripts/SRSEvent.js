/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSEvent.js 
* @ AUTHOR        : Kapil Agarwal
* @ DATE          : 2008/04/03
* Updated by Ken Crossman 2/2/2018 to:
* 1) Remove the setting of the resource in onInit
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

function onInit(type, form, request)
{
	var context = nlapiGetContext();
	if(context.getExecutionContext() == 'userinterface' && type == 'create') //&& form == '32')
	{
		// The following code sets the resource to 2 which = 'Vacation/Away from Office Calendar'
		// Given that we no longer use the Netsuite calendar for this sort of thing anymore, 
		// I have commented this out - Ken 2018-02-02
		
		// nlapiSelectNewLineItem('resource');
		// nlapiSetCurrentLineItemValue('resource', 'resource','2');
		// nlapiCommitLineItem('resource');
		
		nlapiSetFieldValue('alldayevent','T');
		nlapiSetFieldValue("accesslevel","PUBLIC"); 
	}
}

function onChange(type,name)
{
	// skip this
	/*
	 var title;

	if ((name == 'company') || (name == 'custevent27'))
	{
		title = nlapiGetFieldText('company') + ' - ' + nlapiGetFieldText('custevent27');
		nlapiSetFieldValue('title', title, false);
	} //if
	*/		
} //end


function onSave()
{
	nlapiSetFieldValue('custevent_call_suitescript', 'T');	
		
	return true;
}


function setAttendee(type)
{

	var currentRecord;
	var company;
	var escrow;
	var pr;
	var sec;
	
	var actr;
	var prfound = 0;
	var secfound = 0;
	var aid;

	var rctr;
	var rmadded = 0;
	
	try	
	{

		if (( type == 'create') || ( type == 'edit')) 
   		{
			var currentRecord = nlapiGetNewRecord();
			
			if(currentRecord.getFieldValue('custevent_call_suitescript') != 'T')
			{
				// Not Escrow Activity
				return;
			}	 		
			company = currentRecord.getFieldValue('company');
			if(!(company))
			{
				return;
			}
			
			/*pr = getprimary(company);
			sec = getsecondary(company);

			if(!(pr))
			{
				pr = -1;
			}
		
			if(!(sec))
			{
				sec = -1;
			}

			if((pr != -1) || (sec != -1))
			{	
				actr  = currentRecord.getLineItemCount ('attendee') ;
				prfound = 0;
				secfound = 0;
				
				for(var x=1; (x<=actr) && ((prfound == 0) || (secfound == 0)); x++)
				{
					aid = currentRecord.getLineItemValue('attendee','attendee',x);
			
					if(aid == pr)
					{
						prfound = 1;
					} 

					if(aid == sec)
					{
						secfound = 1;
					}

				} //for actr

				// Add pr & sec
				if((pr != -1) && (prfound == 0))
				{
					actr++;
					currentRecord.insertLineItem('attendee',actr);
					currentRecord.setLineItemValue('attendee','attendee', actr, pr);
					currentRecord.setLineItemValue('attendee','sendemail', actr, 'F');
					currentRecord.setLineItemValue('attendee','response', actr, 'ACCEPTED');
				}
		
				if((sec != -1) && (secfound == 0))
				{
					actr++;
					currentRecord.insertLineItem('attendee',actr);
					currentRecord.setLineItemValue('attendee','attendee', actr, sec);
					currentRecord.setLineItemValue('attendee','sendemail', actr, 'F');
					currentRecord.setLineItemValue('attendee','response', actr, 'ACCEPTED');
				}

			} // if((pr) || (sec))
			*/
			
			rctr  = currentRecord.getLineItemCount ('resource');
			rmadded = 0;

			if (rctr == 0) 
			{	
				rmadded = 0;
			} // if rctr
			else
			{
				for(var x=1; x<=rctr; x++)
				{
					if(currentRecord.getLineItemValue('resource','resource',x) == '1')
					{
						rmadded = 1;
					} //if 
				} //for
			} // else

			if(rmadded == 0)
			{
				rctr++;
				currentRecord.insertLineItem('resource', rctr);
				currentRecord.setLineItemValue('resource', 'resource', rctr, '1');
			} //if rmadded

		} //if create 

	} //try
	catch ( e )
        {
            if ( e instanceof nlobjError )
                nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails() )
            else
                nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() )
        }
} //end


function getprimary(id)
{
	var retval = -1;
	var email;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', id, null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custentity42');
	
	var searchresults = nlapiSearchRecord( 'customer', null, filters, columns);
	
	if(searchresults)
	{
		if(searchresults[0].getValue('custentity42'))
		{
			retval =  searchresults[0].getValue('custentity42');
		}
	}
	return retval; 
} //end

function getsecondary(id)
{
	var retval = -1;
	var email;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', id, null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custentity43');
	
	var searchresults = nlapiSearchRecord( 'customer', null, filters, columns);
	
	if(searchresults)
	{
		if(searchresults[0].getValue('custentity43'))
		{
			retval =  searchresults[0].getValue('custentity43');
		}
	}
	return retval; 
} //end

function addResource(record,resourceId)
{
	var rcCnt = record.getLineItemCount('resource');

	// first let's see if the resource is already there
	for(var x = 0; x < rcCnt; x++)
	{
		if(record.getLineItemValue('resource','resource',(x + 1)) == resourceId)
			return; // found it, short circuit and get out
	} //for

	rcCnt++;
	record.insertLineItem('resource',rcCnt);
	record.setLineItemValue('resource', 'resource', rcCnt, resourceId);
}