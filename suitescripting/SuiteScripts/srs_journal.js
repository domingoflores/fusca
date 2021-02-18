/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : srs_journal.js 
* @ AUTHOR        : Kapil Agarwal
* @ DATE          : 2009/04/01
*
* Copyright (c) 2009 Upaya - The Solution Inc. 
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

var fx = 'srsvalidatedist';

function srsvalidatedist(type)
{
	var rec;

	nlapiLogExecution('DEBUG', fx + ' 100', type);

   	if ( type == 'delete')
   	{
		rec = nlapiGetOldRecord();
		
		var filters = new Array();
		filters[0] = new nlobjSearchFilter( 'custrecord_journal_id', null, 'anyof', rec.getId());
		filters[1] = new nlobjSearchFilter( 'isinactive', null, 'is', 'F', null);

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
	
		var searchresults = nlapiSearchRecord( 'customrecord18', null, filters, columns);
		if(searchresults)
		{
			throw 'You cannot delete this Journal Entry as it has Escrow Transactions associated with it.';
		}
	} // if delete

} //end


function onInit()
{
	if(nlapiGetRecordId())
	{
		nlapiDisableField('custbody_create_distribution', false);
	}
	else
	{
		nlapiDisableField('custbody_create_distribution', true);
	}
			
} //end