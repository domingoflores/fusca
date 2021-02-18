/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSOnlineReg.js 
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

var fx = 'UpdateContact';


function UpdateContact(type)
{

	var currentRecord;
	var oldRecord;
	var cust;
	var cont;
	
	var fname;
	var lname;

	try{
		if(type == 'edit')
		{
			currentRecord = nlapiGetNewRecord();
			oldRecord = nlapiGetOldRecord();
	
			if(currentRecord.getFieldValue('custrecord34') == 'T')
			{
				if(oldRecord.getFieldValue('custrecord34') == 'T')
				{
					// if already added
					return;
				}	
				
				cust = currentRecord.getFieldValue('custrecord17');
				if(cust)
				{
					fname = currentRecord.getFieldValue('custrecord19'); 
					lname = currentRecord.getFieldValue('custrecord20');
					cont = getCont(cust, fname, lname);
		
					if(cont == -1)
					{
						//add contact
						var record = nlapiCreateRecord( 'contact');
						record.setFieldValue( 'firstname', fname);
						record.setFieldValue( 'lastname', lname);
						record.setFieldValue( 'company', cust);
						
						record.setFieldValue( 'email', currentRecord.getFieldValue('custrecord28'));
						record.setFieldValue( 'phone', currentRecord.getFieldValue('custrecord29'));
						record.setFieldValue( 'mobilephone', currentRecord.getFieldValue('custrecord30'));
						record.setFieldValue( 'fax', currentRecord.getFieldValue('custrecord31'));

						//address
						var addresslines = record.getLineItemCount('addressbook');
						addresslines++;

						record.insertLineItem('addressbook',addresslines);
						record.setLineItemValue('addressbook','defaultbilling',addresslines, 'T');
						record.setLineItemValue('addressbook','label',addresslines,(fname + lname));
						record.setLineItemValue('addressbook','addressee',addresslines, (fname + lname));	
						record.setLineItemValue('addressbook','addr1',addresslines, currentRecord.getFieldValue('custrecord22'));
						record.setLineItemValue('addressbook','addr2',addresslines, currentRecord.getFieldValue('custrecord23'));
						record.setLineItemValue('addressbook','city',addresslines, currentRecord.getFieldValue('custrecord24'));
						record.setLineItemValue('addressbook','state',addresslines, currentRecord.getFieldValue('custrecord25'));
						record.setLineItemValue('addressbook','zip',addresslines, currentRecord.getFieldValue('custrecord26'));
						record.setLineItemValue('addressbook','country',addresslines, currentRecord.getFieldValue('custrecord27'));

						nlapiSubmitRecord(record, true);
					}
				
					else
					{
						//update contact
						record = nlapiLoadRecord('contact', cont);
						
						record.setFieldValue( 'firstname', fname);
						record.setFieldValue( 'lastname', lname);
						
						if(currentRecord.getFieldValue('custrecord28'))
						{
							record.setFieldValue( 'email', currentRecord.getFieldValue('custrecord28'));
						}
						if(currentRecord.getFieldValue('custrecord29'))
						{
							record.setFieldValue( 'phone', currentRecord.getFieldValue('custrecord29'));
						}
						if(currentRecord.getFieldValue('custrecord30'))
						{
							record.setFieldValue( 'mobilephone', currentRecord.getFieldValue('custrecord30'));
						}
						if(currentRecord.getFieldValue('custrecord31'))
						{
							record.setFieldValue( 'fax', currentRecord.getFieldValue('custrecord31'));
						}

						//address
						var addresslines = record.getLineItemCount('addressbook');
						addresslines++;

						record.insertLineItem('addressbook',addresslines);
						record.setLineItemValue('addressbook','defaultbilling',addresslines, 'T');
						record.setLineItemValue('addressbook','label',addresslines,(fname + lname));
						record.setLineItemValue('addressbook','addressee',addresslines, (fname + lname));	
						record.setLineItemValue('addressbook','addr1',addresslines, currentRecord.getFieldValue('custrecord22'));
						record.setLineItemValue('addressbook','addr2',addresslines, currentRecord.getFieldValue('custrecord23'));
						record.setLineItemValue('addressbook','city',addresslines, currentRecord.getFieldValue('custrecord24'));
						record.setLineItemValue('addressbook','state',addresslines, currentRecord.getFieldValue('custrecord25'));
						record.setLineItemValue('addressbook','zip',addresslines, currentRecord.getFieldValue('custrecord26'));
						record.setLineItemValue('addressbook','country',addresslines, currentRecord.getFieldValue('custrecord27'));
						
						nlapiSubmitRecord(record, true);		

					} //if cont
				} //if cust
				
					
			} //if approved

			
		} // if type
	} //try 
	catch ( e )
        {
            if ( e instanceof nlobjError )
	    {
                msg = e.getCode() + '\n' + e.getDetails();
		nlapiLogExecution( 'ERROR', fx + '<999-01 Before Submit Script> type:'+ type, msg);
		
	
            }
	   else
	   {
		msg = e.toString();
                nlapiLogExecution( 'ERROR', fx + '<999-02 Before Submit Script> type:'+ type, msg);
	   }
	
		// Send Error Email to Mark
		nlapiSendEmail(-5, 'autoalert@shareholderrep.com', 'Online Registration Error', msg, null, null, null);
		currentRecord.setFieldValue('custrecord34', 'F');
		
        } //catch
			
} //end


function getCont(id, fname, lname)
{
	var retval = -1;
	var email;

	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'internalid', 'customer', 'anyof', id, null);
	filters[1] = new nlobjSearchFilter( 'firstname', null, 'contains', fname, null);
	filters[2] = new nlobjSearchFilter( 'lastname', null, 'contains', lname, null);

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var searchresults = nlapiSearchRecord( 'contact', null, filters, columns);
	
	if(searchresults)
	{
		retval =  searchresults[0].getValue('internalid');
	}
	return retval; 
} //end


