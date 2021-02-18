/**
 * @author durbano
 * Updated:    10/11/2011
 * UpdatedBy:  Marc Scremin
 */

function onBeforeLoad(type,form,request)
{

         //This didn't appear to be in use
		//form.addButton('custpage_email_contacts_btn','Email Contacts', "alert('Email Contacts');");
		
		var recordID = nlapiGetRecordId();
		var dealID = nlapiLookupField('customer', recordID, 'internalID');


        // Search major shareholder record contacts
        //
        var majorShareholderResults = null;
        var majorShareholderFilters = new Array();
        var majorShareholderColumns = new Array();
       
 
		majorShareholderFilters[0] = new nlobjSearchFilter('internalid', 'custrecord15', 'is', dealID);
        //get the results of the major shareholders
        majorShareholderResults = nlapiSearchRecord('customrecord12','customsearch_major_sh_email_list',majorShareholderFilters, null);

        if (majorShareholderResults != null)
        {
			var emailList = '<A HREF="mailto:';
			 var noneCount = 0;  //used to keep track of records that are grouped as None.  
			 
			 for (var k = 0;  majorShareholderResults != null && k <  majorShareholderResults.length; k++) 
			{
				var resultRow =  majorShareholderResults[k];
					   
				//var email = resultRow.getValue('email', 'custrecord_ms_contact', 'group');  //left this incase we change what we are pulling from
				var email = resultRow.getValue('custrecord38', null, 'group');
				 if(email != '' && email != null && email != '- None -')
				   {			
				    emailList = emailList + email + ',';
				   }
				 else
					 {
					 noneCount++;
					 }
			}
	
	        
			
		   if (emailList != '' && emailList != null && noneCount == 0)   
			    {
	             nlapiSetFieldValue('custentity_major_sh_email_list',emailList + '">Click to start an email to Major Shareholders</A>');
			    }
	        else
	            {
	              nlapiSetFieldValue('custentity_major_sh_email_list','No email addresses found for existing Major Shareholders');
	            }
        }
        else
        {
            nlapiSetFieldValue('custentity_major_sh_email_list','No major shareholders found, please add a Major Shareholder');
          }


}

