/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSCustomer.js 
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


//Function to Update Customer Balance

var fx = 'custBalance';

function custBalance(type)
{
	var bal = 0;
	var custbal = 0;
	var childbal = 0;
	var id;
	var rec;
	var cat = -1;

	try
	{
		rec = nlapiGetNewRecord();

		bal = parseFloat(rec.getFieldValue('balance'));
		if (isNaN(bal))
		{
			bal = 0;

		}
		
		custbal = parseFloat(rec.getFieldValue('depositbalance'));
		if (isNaN(custbal))
		{
			custbal = 0;

		}
		
		//nlapiLogExecution( 'ERROR', fx + '<100> type:'+ type, 'Bal: ' + bal );

		childbal =  getchildbal(rec.getId());

		//nlapiLogExecution( 'ERROR', fx + '<200> type:'+ type, 'Child Bal: ' + childbal );

		bal += childbal + custbal;

		// Added by DAU, 3/17/2009 to account for switch to debiting and crediting bank deposits, etc. correctly.
		cat = parseInt(rec.getFieldValue('category'));
		if (cat == 1 && bal < 0)
		{
			bal = bal * -1;
		}

		//nlapiLogExecution( 'ERROR', fx + '<300> type:'+ type, 'Total Bal: ' + bal );

		rec.setFieldValue('custentity7', bal);
			

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


function getchildbal(id)
{
	var retval = 0;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'parent', null, 'anyof', id, null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('balance');
	
	var searchresults = nlapiSearchRecord( 'customer', null, filters, columns);
	
	for (var j = 0; searchresults != null && j < searchresults.length && j <= 150; j++ )
	{
		if(id != searchresults[j].getId())
		{
			retval +=  parseFloat(searchresults[j].getValue('balance'));
		}
	}

	return retval; 
} //end


