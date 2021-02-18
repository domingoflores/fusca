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

function custBalance(type) //cab beforeLoad main
{
	var bal = 0;
	var rec;
	var cat = -999;

	try
	{
		nlapiLogExecution('DEBUG', 'beforeLoad');
		
		rec = nlapiGetNewRecord();

		// Get the customer category: 1 = Escrow; 2 = Shareholder; 7 = Investor Group
		cat = parseInt(rec.getFieldValue('category'));

		if (cat == 7 || cat == 2)
		{	// Investor Group or Shareholder
			bal = getEscrowTransactionBalance(rec, cat);
		}
		else
		{   // All others
			bal = getTransactionBalance(rec);
		}
		
		nlapiLogExecution('DEBUG', 'balance', bal);
		
		// set the 'Escrow Balance' for the account
		rec.setFieldValue('custentity7', bal);
	
	} // try 
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
    } // catch	
} //end custBalance

/**
 * Use the following if we are dealing with an entity defined with the category as anything other than 'Investor Group' or 'Shareholder'
 */
function getTransactionBalance(rec, cat)
{
	var bal = 0;
	var custbal = 0;
	var childbal = 0;
	
	var cat = parseInt(rec.getFieldValue('category'));

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
	
	// for each child, get its balance
	childbal =  getchildbal(rec.getId());

	// add the child balance to this balance
	bal += childbal + custbal;

	// Added by DAU, 3/17/2009 to account for switch to debiting and crediting bank deposits, etc. correctly.
	if (cat == 1 && bal < 0)
	{
		bal = bal * -1;
	}
	
	return bal;
} // end getTransactionBalance

/**
 * Called by getTransactionBalance
 */
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
} //end getchildbal

/**
 * Used if the category of customer is 'Investor Group' or 'Shareholder'
 */
function getEscrowTransactionBalance(rec)
{
	var name = rec.getFieldValue('companyname');
	var cat = parseInt(rec.getFieldValue('category'));
	var id = rec.getId();

	// get the sum of the escrow transactions for the current id
	var filters = new Array();
	if ( cat == 7 )
	{	// investor group
		// companyname, entityid, internalid
		filters[0] = new nlobjSearchFilter( 'internalid', 'custrecord67', 'is', id, null); // investor group
	}
	else if ( cat == 2 )
	{	// shareholder
		filters[0] = new nlobjSearchFilter('custrecord67', null, 'startswith', name, null); // shareholder
	}
	else
	{
		return -999;
	}

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord70', null, 'sum');					// sum the amount field
	
	var searchresults = nlapiSearchRecord( 'customrecord18', null, filters, columns);	// escrow transactions
	if(searchresults == null) return -9999;												// short circuit loop
	
	// balance variable
	var bal = 0;
	for(var i = 0; i < searchresults.length; i++)
	{
		var searchresult = searchresults[i];
		bal += searchresult.getValue( 'custrecord70' );	// get the amount
	}
	
	return bal;
} // end getEscrowTransactionBalance

function getChildren(id)
{
	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'parent', null, 'anyof', id, null);
	filters[1] = new nlobjSearchFilter( 'category', null, 'is', 'Shareholder', null);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var searchresults = nlapiSearchRecord( 'customer', null, filters, columns);

	return searchresults; 
} //end getChildren
