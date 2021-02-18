/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSShareholderEscrow.js
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


//Function to Update Escrow on Shareholder

var fx = 'updateEscrow';

function updateEscrow(type)
{
	var rec;
	var shareholder;
	var escrow;
	var parent;

	try
	{
		if((type == 'create') || (type == 'edit'))
		{ 
			rec = nlapiGetNewRecord();
			shareholder = rec.getFieldValue('custrecord_participating_shareholder');
			nlapiLogExecution( 'DEBUG', fx + '<100> type:'+ type, 'Shareholder: ' + shareholder);

			escrow = rec.getFieldValue('custrecord_participating_escrow');
			nlapiLogExecution( 'DEBUG', fx + '<150> type:'+ type, 'Escrow: ' + escrow);
			
			if((escrow) && (shareholder))
			{
				//Update Shareholder
				
				updateShareholder(shareholder, escrow);
				nlapiLogExecution( 'DEBUG', fx + '<180> type:'+ type, 'Update Shareholder Data');

				parent = getParent(shareholder);
				nlapiLogExecution( 'DEBUG', fx + '<200> type:'+ type, 'Parent: ' + parent);

				if(parent != -1 )
				{
					updateShareholder(parent, escrow);
				}
			} //if
		
		} // if type	

	} //try 
	catch ( e )
        {
            if ( e instanceof nlobjError )
	    {
                msg = e.getCode() + '\n' + e.getDetails();
	
            }
	   else
	   {
		msg = e.toString();
           }
	
		nlapiLogExecution( 'ERROR', fx + '<999> type:'+ type, msg);
        } //catch
			
} //end


function updateShareholder(id, esc)
{
	var cust = nlapiLoadRecord('customer', id);
	var escrows = new Array();
	var newescrows = new Array();
	var i;	

	escrows = cust.getFieldValues('custentity45');
	
	for(i=0;  escrows != null && i < escrows.length; i++)
	{	
		newescrows[i] = escrows[i];

		if (esc == escrows[i])
		{
			return;
		}
	} // for
		
	//Add Escrow
	if(escrows)
	{
		i = escrows.length;
	}
	else
	{	
		i = 0;
	}

	newescrows[i] = esc;
	cust.setFieldValues('custentity45', newescrows);
	nlapiSubmitRecord(cust, true);
	
	return;
}		
	

function getParent(id)
{
	var retval = -1;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'internalid', null, 'anyof', id, null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('parent');
	
	var searchresults = nlapiSearchRecord( 'customer', null, filters, columns);
	
	if(searchresults) 
	{
		if(searchresults[0].getValue('parent'))
		{
			retval = searchresults[0].getValue('parent');
		}
	}

	return retval; 
} //end


