/**
 * @author durbano
 * Updated:    8/28/2013
 * UpdatedBy:  Scott Streule	Added and or statement to include the addEmailButton for form 120
 * UpdatedBy:  Scott Streule	8/21/2015	Removed the Load form and the logic to display the notification for specific forms only
 * 											This was done to increase performance of customer record loads
 */

function onBeforeLoad(type,form,request)
{

         //This didn't appear to be in use
		//form.addButton('custpage_email_contacts_btn','Email Contacts', "alert('Email Contacts');");
	
	 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'View Type: ' + type);
	 
	 if(type == 'view' || type == 'edit') {
	     
		 //
	     // Manage the last memo field
		 //
		 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'Processing memo firms and deals.');
		 var recType = null;
		 var targetVals = new Object();
		 
		 
		 	//Parse out the kind of entity record and send that appropriately.
		 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'About to test the kind of customer.  '+nlapiGetRecordId()+' is a customer record of type: '+nlapiGetFieldValue('category')+'/'+nlapiGetFieldText('category'));
		 
		 if(nlapiGetFieldValue('category') == 1) {
			 //This is a deal
			 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', nlapiGetRecordId()+' is a deal: '+nlapiGetFieldValue('category')+'/'+nlapiGetFieldText('category'));
			 recType = 'deal';
			 targetVals["deal"] = nlapiGetRecordId();
			 //A deal should have an opportunity... try and get it.
			 var filters = new Array();
			 var columns = new Array();
			 var results = null;
			 
			 filters[0] = new nlobjSearchFilter('entity',null,'anyOf',nlapiGetRecordId());
			 
			 columns[0] = new nlobjSearchColumn('internalid');
			 columns[0].setSort(true);
			 
			 results = nlapiSearchRecord('opportunity',null,filters,columns);
			 if(results != null) {
				 targetVals["opportunity"] = results[0].getId();
			 }
			 
		 } else {
			//If not a deal assume a firm.
			 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', nlapiGetRecordId()+' is assumed a firm: '+nlapiGetFieldValue('category')+'/'+nlapiGetFieldText('category'));
			 recType = 'firm';
			 targetVals["firm"] = nlapiGetRecordId();
		 }
		 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'Setting custentity_memo_log_html; finished with last memo processing');
		 
		 nlapiSetFieldValue('custentity_memo_log_html',getLastMemoFieldValue(recType,nlapiGetRecordId(),targetVals));
		 //
		 //  End of managing last memo field 
		 //
	 }
	 
  
		 if(type == 'view' || type == 'edit') //only run if view or editing a customer record
		{	
		 // check to see if this is a SRS Deal Form.  Need to load the record to get the form id on type = view
		 //var thisRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());  //STS Commented OUT on 8/21
		 //var thisForm = thisRecord.getFieldValue('customform');  //STS Commented OUT on 8/21

         //nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'Form ID: ' + thisForm);  //STS Commented OUT on 8/21
       //check to see if this is the deal form
         //if(thisForm == '14' || thisForm == '120')  //STS Commented OUT on 8/21
        	 //{  //STS Commented OUT on 8/21
        	 try {
             checkForNotifications();
             addEmailButton(form);
             loadEarnoutDealPoints();
        	 }
        	 catch (e) {
        		 nlapiLogExecution('ERROR', 'SRSDealForm.onBeforeLoad', 'Error: ' +e.message+"\n"+e.stack);
        		    }
        	 //}  	//STS Commented OUT on 8/21
         }
	




	 else
		 {
		 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'View type is not view or edit.');
		 }
	 
	 nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'Finished processing onBeforeLoad');
}

function loadEarnoutDealPoints()
{

		//Added Frank Foster - September 2013- Load the Deal Points field on the Earn-out tba if not present
		if (nlapiGetFieldValue('custentity_eo_dealpoints') == null || nlapiGetFieldValue('custentity_eo_dealpoints') == "")
		{
			if (type != 'create')
			{
				var custid = nlapiGetRecordId()
				var filter_eo = new Array();
				filter_eo[0] = new nlobjSearchFilter('custrecord_deal', null, 'anyof', custid);
				var results_eo = nlapiSearchRecord('customrecord_deal_points_study', null, filter_eo, null); 
				if (results_eo != null)
				{
					var dpid = results_eo[0].getId()
					nlapiSubmitField(nlapiGetRecordType(), custid, 'custentity_eo_dealpoints', dpid)
					//Refresh if View
					if (type == 'view')
						nlapiSetRedirectURL('RECORD',nlapiGetRecordType(), custid, false);
					else
						nlapiSetRedirectURL('RECORD',nlapiGetRecordType(), custid, true);

				}			
			}
		}


}
	function checkForNotifications()
	{
	    	 		    var recordID = nlapiGetRecordId();
						var dealID = nlapiLookupField('customer', recordID, 'internalID');
						nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'dealID: ' + dealID);
			
				        // Search case records for legal hold start date with empty end date
				        //
                        var notificationHTML = null;
                        notificationHTML = '<div id="notify" style="border-radius: 15px;color: #000000;background-color:#ffffc5;" align="center"><b>NOTIFICATION CENTER:&nbsp&nbsp';
				        var caseResults = null;
				        var caseFilters = new Array();
				        var caseColumns = new Array();
				   	
						caseFilters[0] = new nlobjSearchFilter('internalid', 'customer', 'is', dealID);
				        //get the results of the case search
				        caseResults = nlapiSearchRecord('supportcase','customsearch_legalhold_search',caseFilters, null);
				
				        if (caseResults != null)
				        {
				        //set notification center
                                         notificationHTML = notificationHTML +' <b> <font size="4" color="red"><strong>Legal Hold</strong></font>';
                                         }
                                         else
                                         {
                                           notificationHTML = notificationHTML + '<font size="4" color="green"><strong>All Clear</strong></font>';
                                          }

                        //finish html 
                         notificationHTML = notificationHTML + '</center></div>';
                         nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'checkForNotification value: ' + notificationHTML);
                         //add the html to the inlineHTML field			      
                         nlapiSetFieldValue('custentity_notification_center',notificationHTML);
	}
	
	function addEmailButton(form)
	{
				  var dealContactSublist = null;
			    	  dealContactSublist = form.getSubList('recmachcustrecord59'); //locate the Deal Contacts sublist form
			          nlapiLogExecution('DEBUG', 'SRSDealForm.onBeforeLoad', 'dealContactSublist: ' + dealContactSublist);
			          
			          if (dealContactSublist != null)  //check to see if the sublist exists
			          {
						//add a button to open email client with the contents of the email list
	   					dealContactSublist.addButton('custpage_btn_email', 'Email Engagement Agreement Contacts', 'emailButton.init()');
	   					var buttonAction = nlapiLoadFile('SuiteScripts/SRSSuiteScripts/Client/EngagementAgreementsEmailButton.js');
	   					nlapiLogExecution('DEBUG', 'DealForm V2', buttonAction.getValue());
	   					var html = '<script type="text/javascript">' + buttonAction.getValue() + '</script>'; 	
	   					var field0 = form.addField('custpage_alertmode_email', 'inlinehtml',null,null); 
	   						field0.setDefaultValue(html);		
			
				}
	}