/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSPortlets.js
 * @ AUTHOR        : Daniel A. Urbano
 * @ DATE          : 2010/01/06
 * @ UPDATED DATE  : 2013/12/12
 * @ UPDATED BY    : Tiffani Willis
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
function opportunityPortlet(portlet, column)
{
    // perform the search
    var oppSearchResults = null; //search container for opportunity records.
    oppSearchResults = nlapiSearchRecord('opportunity', 'customsearch_srs_active_opp_portlet');
    // set search results
    if (oppSearchResults != null) {
        var columns = getColumnsByName(oppSearchResults);
        
        var columnLegalRep = columns["legal_rep"];
        var columnUserNoteText = columns["user_note_text"];
        var columnUserNoteDate = columns["user_note_date"];
        var columnUserNoteAuthor = columns["user_note_who"];
        
        //
        // Search deal (escrow) contacts
        //
        var dealContactResults = null;
        var dealContactFilters = new Array();
        var dealContactColumns = new Array();
        var targetDeals = new Array();
        
        //Loop through Opportunity results to get the deals involved.
        for (var j = 0; oppSearchResults != null && j < oppSearchResults.length; j++) {
            var tempResult = oppSearchResults[j];
            targetDeals[j] = tempResult.getValue('entity', null, 'group');
        }
        
        
        
        
        //TODO: Add additional filters based on the multi-select values to limit to the desired roles. Will avoid looping later.
        dealContactFilters[0] = new nlobjSearchFilter('custrecord59', null, 'anyof', targetDeals); // this searches for the deal 'customer' in the system (the escrow).
        dealContactColumns[0] = new nlobjSearchColumn('custrecord60', null, null); // The reference to the contact in the deal contact record.
        dealContactColumns[1] = new nlobjSearchColumn('custrecord_esc_con_roles', null, null); // the role of the contact
        dealContactColumns[2] = new nlobjSearchColumn('custrecord59', null, null); //the deal for the contact

        
        //get the results of the deal contacts and find the ones we want.
        dealContactResults = nlapiSearchRecord('customrecord16', null, dealContactFilters, dealContactColumns);
      
        //search for the list of notes
   
        var noteSearchResults = null; //search container for note records.
       noteSearchResults = nlapiSearchRecord('opportunity', 'customsearch_srs_active_opp_portlet_memo');
        
        //Finally get the deal team for the deals involved.
        var dealTeamResults = null;
        var dealTeamFilters = new Array();
        var dealTeamColumns = new Array();
        
        dealTeamFilters[0] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'anyof',targetDeals);
        dealTeamFilters[1] = new nlobjSearchFilter('custrecord_deal_team_role',null,'anyof',["-2","1"]);
        
        dealTeamColumns[0] = new nlobjSearchColumn('internalid',null,null);
        dealTeamColumns[1] = new nlobjSearchColumn('custrecord_deal_team_deal',null,null);
        dealTeamColumns[2] = new nlobjSearchColumn('custrecord_deal_team_employee',null,null);
        dealTeamColumns[3] = new nlobjSearchColumn('custrecord_deal_team_role',null,null);
        
        dealTeamResults = nlapiSearchRecord('customrecord_deal_project_team',null,dealTeamFilters,dealTeamColumns);
                        
        // setup the display
        portlet.setTitle('Active Opportunities');
        
        var companyName = portlet.addColumn('companynamecustomer', 'text', 'Opportunity Name', 'CENTER');
        companyName.setURL(nlapiResolveURL('RECORD', 'opportunity'));
        companyName.addParamToURL('id', 'id', true);
       // portlet.addColumn('companynamecustomer','text','Opportunity Name','CENTER');
        portlet.addColumn('lastcontactdate', 'text', 'Last Contact Date', 'CENTER');
        portlet.addColumn('primarycontact', 'text', 'Sales Contact','CENTER');
        portlet.addColumn('entityidsalesrep', 'text', 'Sales Rep', 'CENTER');
        portlet.addColumn('legalrep', 'text', 'Legal Rep', 'CENTER');
        portlet.addColumn('entitystatus', 'text', 'Status','CENTER');
        portlet.addColumn('memo', 'text', 'Details', 'LEFT');
        portlet.addColumn('dealstatus','text','Deal Status','CENTER');
        portlet.addColumn('projectedtotal', 'currency', 'Projected Total', 'RIGHT');

        
        //Loop through the results of the saved search
        for (var k = 0; oppSearchResults != null && k < oppSearchResults.length; k++) {
        
            var resultRow = oppSearchResults[k];
            var id = resultRow.getValue('internalid', null, 'group');
            var hash = new Array();
            var priContact = null;  //used to set primary contact value
            var otherContacts = '<span style="font-weight: bold;">Other Contacts</span><br />'; //used to compile list of all contacts except for primary sales
            var otherContactsCount = 0;
            
            //
            //  Search for related deal contact records.
            //
            
            hash.primarycontact = '<a href="#" onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_esc_con_roles=27\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            hash.legalcontact = '<a href="#" title="Click here to add a new legal contact." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_esc_con_roles=26\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
                        
            
            if (dealContactResults != null) 
            {
            
                for (var t = 0; dealContactResults != null && t < dealContactResults.length; t++) 
                {
                    var dealContactRow = dealContactResults[t];
                  
                    
                    //check to make sure contact is for current deal
                    if (dealContactRow.getValue('custrecord59', null, null) == resultRow.getValue('entity', null, 'group')) 
                    {
                        //Check to see if role is sales contact
                        if (isElementPresent(dealContactRow.getValue('custrecord_esc_con_roles', null, null).split(','),27))
                                {
                                    // opens contact record hash.primarycontact = '<a title="' + dealContactRow.getText('custrecord60', null, null) + '" href="' + nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group') + '">' + dealContactRow.getText('custrecord60', null, null) + '</a>';   
                            //this opens new window to add additional contacts    
                            hash.primarycontact = '<a href="#" onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group')+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">' + dealContactRow.getText('custrecord60', null, null) + '</a>';
                            
                                if(dealContactRow.getValue('custrecord_esc_con_roles', null, null).split(',').length > 1) {
                                    otherContacts = otherContacts + dealContactRow.getText('custrecord_esc_con_roles', null, null) + ' - ' + dealContactRow.getText('custrecord60', null, null)+'<br />';
                                    otherContactsCount = otherContactsCount + 1
                                }
                                }
    
                            else
                                {
                                   //Get all other contacts not in the sales role
                                    otherContacts = otherContacts + dealContactRow.getText('custrecord_esc_con_roles', null, null) + ' - ' + dealContactRow.getText('custrecord60', null, null)+'<br />';
                                        otherContactsCount = otherContactsCount + 1
                            
                             }
                    }
               }      
                
          }
            
            //check and see if there are no other contacts and set new value otherwise the Other Contacts heading appears
            if (otherContactsCount == 0) 
            {
            otherContacts = 'No other contacts have been entered. Click to enter a new deal contact.';
            }
            
          //set up display elements.
            var contactToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:400px;text-decoration:none;z-index:100;";    
            
            //add hover feature to display other contacts
              hash.primarycontact = '<div onMouseOver="var x = document.getElementById(\''+k+'contact\');x.style.display=\'block\';var offset = 20;x.style.left=(event.pageX+offset)+\'px\';x.style.top=(event.pageY+20)+\'px\';" onMouseOut="var x = document.getElementById(\''+k+'contact\');x.style.display=\'none\'">'+hash.primarycontact+'<div id="'+k+'contact" style="'+contactToolTipCss+'" align="left">'+otherContacts+'</div></div>';
            //
            // End deal contact retrieval
            //
            
  
            hash.id = id;
            hash.companynamecustomer = resultRow.getText('entity', null, 'group');
            //hash.companynamecustomer = '<a href="#" title="Click here to view the opportunity." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','opportunity',resultRow.getValue('entity', null, 'group'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+resultRow.getText('entity', null, 'group')+'</a>';
            
           
            //find when the most recent update happened.
  
           //Default sales and legal rep to none
            hash.entityidsalesrep =   '<a href="#" title="Click here to add a new SRS sales rep." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_119',null,'EDIT')+'&l=T&record.custrecord_deal_team_deal='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_deal_team_role=-2\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            hash.legalrep = '<a href="#" title="Click here to add a new SRS legal rep." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_119',null,'EDIT')+'&l=T&record.custrecord_deal_team_deal='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_deal_team_role=1\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            
            if(dealTeamResults != null) {
                for(var dteam = 0;dteam < dealTeamResults.length;dteam++) {
                    var dealTeamResult = dealTeamResults[dteam];
                    var memberRoles = dealTeamResult.getValue('custrecord_deal_team_role').split(',');
                    if(dealTeamResult.getValue('custrecord_deal_team_deal') == resultRow.getValue('entity', null, 'group')) {
                        for(var dresult = 0; dresult < memberRoles.length; dresult++) {
                            if(memberRoles[dresult] == '-2') {
                                hash.entityidsalesrep = dealTeamResult.getText('custrecord_deal_team_employee');
                            } else if(memberRoles[dresult] == '1') {
                                hash.legalrep = dealTeamResult.getText('custrecord_deal_team_employee');
                            }
                        }
                    }
                }
            }
            
            //setup notes to get only last 4
            var noteCount = 0;
            var noteMessage = '<span style="font-weight: bold;">Last 4 Deal Memos for '+resultRow.getText('entity', null, 'group')+'</span><BR><table id=notes>';
            var lastNoteDate = null;
            
              for (var t = 0; noteSearchResults != null && t < noteSearchResults.length; t++) 
             {
                  var noteRow = noteSearchResults[t];
                  if (noteRow.getValue('internalid') == id) 
                  {
                      if (noteCount < 4)
                          {
                          
                          noteMessage = noteMessage + '<tr><td valign="top" width="10%" style="font-size:70%">' +  noteRow.getValue('startdate','call',null) + '</td><td valign="top" width="18%" style="font-size:70%">' + noteRow.getText('createdby','call',null) + '</td><td valign="top" width="72%" style="font-size:70%">' + noteRow.getValue('message','call',null) + '</td></tr>'
                          if (noteCount == 0)  //Since the date is sorted by date desc, this should be the last contact date
                              {
                              //get most recent date
                              lastNoteDate = noteRow.getValue('startdate','call',null)
                              
                              }
                          noteCount++
                          }
                  }

             }
              noteMessage = noteMessage + '</table>'
            //setting the display for the date. set to -none- if no date, else set to the date. 
                if (lastNoteDate == '')
                    {
                     hash.lastcontactdate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;obj_custevent_memo_opportunity=' + id + '&amp;obj_invitee=' + resultRow.getValue('entity', null, 'group') + '&amp;obj_custevent_memo_deal=' + resultRow.getValue('entity', null, 'group') + '&amp;cf=35&amp;contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">-none-</a>';
                     noteMessage = 'No deal memos have been entered. Click to enter a new deal memo.';
                    }
                else
                    {
                    hash.lastcontactdate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;obj_custevent_memo_opportunity=' + id + '&amp;obj_invitee=' + resultRow.getValue('entity', null, 'group') + '&amp;obj_custevent_memo_deal=' + resultRow.getValue('entity', null, 'group') + '&amp;cf=35&amp;contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">'+ lastNoteDate + '</a>';
                    }
        
                var dateToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
              //add hover feature to display other contacts
            hash.lastcontactdate = '<div onMouseOver="var x = document.getElementById(\''+k+'note\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+offset))};x.style.left=(event.clientX-80)+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+k+'note\');x.style.display=\'none\'">'+hash.lastcontactdate+'<div id="'+k+'note" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>';
            
            //End notes setup
                 
              
            hash.entitystatus = resultRow.getText('entitystatus', null, 'group');
            //Details column = memo field
            hash.memo = resultRow.getValue('memo', null, 'group');
            hash.dealstatus = resultRow.getText('custbody_opp_deal_status',null,'group');
            hash.projectedtotal = resultRow.getValue('projectedtotal', null, 'group');
            //Per #1150  If an Opportunity is less that a week old, highlight it.
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Checking for dates... Record Date: '+nlapiStringToDate(resultRow.getValue('date',null,'group'))+', Test Date: '+(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)));
            if (nlapiStringToDate(resultRow.getValue('date',null,'group')) > (new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))) {
                nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Updating with span tags.');
                hash.companynamecustomer = '<span style="font-weight: bold; background-color: #ffff00;">'+resultRow.getText('entity', null, 'group')+'</span>';
            }
            
            // Search for deals that have been in proposal issued status for more than 3 days and highlight if true  
            var propIssuedResults = null;       
            var propIssuedFilters = new Array();
            propIssuedFilters[0] = new nlobjSearchFilter('internalid',null,'is',id);
            propIssuedResults = nlapiSearchRecord('opportunity', 'customsearch_opp_prop_issued_3days',propIssuedFilters);
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Checking for proposal issued dates greater than 3 days. ID: '+id);
            
            if(propIssuedResults != null) {
                var propColumns = getColumnsByName(oppSearchResults);
                //get most recent change to Proposal Issued
                for (var p = 0; propIssuedResults != null && p < 1; p++) 
               {
                    var propIssuedRow = propIssuedResults[p];
                    var propIssuedDays = propIssuedRow.getValue('formulanumeric',null,'group');
                    nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Prop Issued Days: '+ propIssuedDays);
                    if (propIssuedDays > 3){
                nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Updating with span tags. Proposal Issued highlight');
                hash.companynamecustomer = '<span style="font-weight: bold; background-color: #00ff00;">'+resultRow.getText('entity', null, 'group')+'</span>';
               } 
               }
               }
            //Setup the target/acquiring company names and display
            var partiesCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:300px;text-decoration:none;z-index:100;";
            var targetCompany = '----------'; //this will appear when permission is denied.
            var acquiringCompany = '----------'; //this will appear when permission is denied.
            if(resultRow.getValue('custbodycustbody_opp_target_name',null,'group') != null && resultRow.getValue('custbodycustbody_opp_target_name',null,'group') != '') {
                targetCompany = resultRow.getValue('custbodycustbody_opp_target_name',null,'group');
            }
            if(resultRow.getValue('custbody_opp_acquiring_comp_text',null,'group') != null && resultRow.getValue('custbody_opp_acquiring_comp_text',null,'group') != '') {
                acquiringCompany = resultRow.getValue('custbody_opp_acquiring_comp_text',null,'group');
            }
            var confidentialData = '<span style="font-weight: bold;">Target Company: </span>'+targetCompany+'<br/><span style="font-weight: bold;">Acquiring Company: </span>'+acquiringCompany;
            //Check to see if we should flag for EscrowExchange
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Is this EscrowExchange Eligible? '+resultRow.getValue(columns["escrowexchange_eligible"])+'/'+resultRow.getText(columns["escrowexchange_eligible"]));
            if(resultRow.getValue(columns["escrowexchange_eligible"]) != null && resultRow.getValue(columns["escrowexchange_eligible"]) == 1) {
                hash.companynamecustomer = '<img src="/images/icons/highlights/icon_lists_flag_green.png" />&nbsp;'+hash.companynamecustomer;
}
            //Check to see if we should flag for Shareholder Option
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Project ID 1059. Project ID: '+resultRow.getValue(columns["template_id"]));
            if(resultRow.getValue(columns["template_id"]) != null && ((resultRow.getValue(columns["template_id"]) == 1059))) {
                hash.companynamecustomer = '<font size="2" color="red">S(o)</font>&nbsp;'+hash.companynamecustomer;

}
            //Check to see if we should flag for Wind down deal entity model
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Project ID 276 wind downs entity model. Project ID: '+resultRow.getValue(columns["template_id"]));
            if(resultRow.getValue(columns["template_id"]) != null && ((resultRow.getValue(columns["template_id"]) == 276))) {
                hash.companynamecustomer = '<font size="2" color="blue">W(e)</font>&nbsp;'+hash.companynamecustomer;

}
            //Check to see if we should flag for Wind down deal Trust model
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Project ID 277 are wind downs trust model. Project ID: '+resultRow.getValue(columns["template_id"]));
            if(resultRow.getValue(columns["template_id"]) != null && ((resultRow.getValue(columns["template_id"]) == 277))) {
                hash.companynamecustomer = '<font size="2" color="blue">W(t)</font>&nbsp;'+hash.companynamecustomer;
            

}
            //Check to see if we should flag for Acquiom deal escrow exchange
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Project ID 1058 Acquiom deal escrow exchange. Project ID: '+resultRow.getValue(columns["template_id"]));
            if(resultRow.getValue(columns["template_id"]) != null && ((resultRow.getValue(columns["template_id"]) == 1058))) {
                hash.companynamecustomer = '<font size="2" color="green">A(e)</font>&nbsp;'+hash.companynamecustomer;


}

    //Check to see if we should flag for Acquiom deal

            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Acquiom deal field: '+resultRow.getValue(columns["acquiom"]));
            if(resultRow.getValue(columns["acquiom"]) != null && resultRow.getValue(columns["acquiom"]) == "T") {
                hash.companynamecustomer = '<font size="2" color="green">A(p)</font>&nbsp;'+hash.companynamecustomer;
            }
           else if(resultRow.getValue(columns["template_id"]) != null && (resultRow.getValue(columns["template_id"]) == 893)) {
                hash.companynamecustomer = '<font size="2" color="green">A (p)</font>&nbsp;'+hash.companynamecustomer;
            }

            hash.companynamecustomer = '<div onMouseOver="var x = document.getElementById(\''+k+'transpart\');x.style.display=\'block\';var offset = 0;x.style.left=(event.pageX+offset)+\'px\';x.style.top=(event.pageY+20)+\'px\';" onMouseOut="var x = document.getElementById(\''+k+'transpart\');x.style.display=\'none\'">'+hash.companynamecustomer+'<div id="'+k+'transpart" style="'+partiesCss+'" align="left">'+confidentialData+'</div></div>';
            portlet.addRow(hash);
        }
    }
}


//Lost Opportunity Portlet

function lostOpportunityPortlet(portlet, column)
{
    // perform the search
    var oppSearchResults = null; //search container for opportunity records.
    oppSearchResults = nlapiSearchRecord('opportunity', 'customsearch_srs_lost_opp_portlet');
    // set search results
    if (oppSearchResults != null) {
        var columns = getColumnsByName(oppSearchResults);
        
        var columnLegalRep = columns["legal_rep"];
        var columnUserNoteText = columns["user_note_text"];
        var columnUserNoteDate = columns["user_note_date"];
        var columnUserNoteAuthor = columns["user_note_who"];
        
        //
        // Search deal (escrow) contacts
        //
        var dealContactResults = null;
        var dealContactFilters = new Array();
        var dealContactColumns = new Array();
        var targetDeals = new Array();
        
        //Loop through Opportunity results to get the deals involved.
        for (var j = 0; oppSearchResults != null && j < oppSearchResults.length; j++) {
            var tempResult = oppSearchResults[j];
            targetDeals[j] = tempResult.getValue('entity', null, 'group');
        }
        
        
        
        
        //TODO: Add additional filters based on the multi-select values to limit to the desired roles. Will avoid looping later.
        dealContactFilters[0] = new nlobjSearchFilter('custrecord59', null, 'anyof', targetDeals); // this searches for the deal 'customer' in the system (the escrow).
        dealContactColumns[0] = new nlobjSearchColumn('custrecord60', null, null); // The reference to the contact in the deal contact record.
        dealContactColumns[1] = new nlobjSearchColumn('custrecord_esc_con_roles', null, null); // the role of the contact
        dealContactColumns[2] = new nlobjSearchColumn('custrecord59', null, null); //the deal for the contact

        
        //get the results of the deal contacts and find the ones we want.
        dealContactResults = nlapiSearchRecord('customrecord16', null, dealContactFilters, dealContactColumns);
      
        //search for the list of notes
   
        var noteSearchResults = null; //search container for note records.
       noteSearchResults = nlapiSearchRecord('opportunity', 'customsearch_lost_opp_portlet_memo');
        
        //Finally get the deal team for the deals involved.
        var dealTeamResults = null;
        var dealTeamFilters = new Array();
        var dealTeamColumns = new Array();
        
        dealTeamFilters[0] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'anyof',targetDeals);
        dealTeamFilters[1] = new nlobjSearchFilter('custrecord_deal_team_role',null,'anyof',["-2","1"]);
        
        dealTeamColumns[0] = new nlobjSearchColumn('internalid',null,null);
        dealTeamColumns[1] = new nlobjSearchColumn('custrecord_deal_team_deal',null,null);
        dealTeamColumns[2] = new nlobjSearchColumn('custrecord_deal_team_employee',null,null);
        dealTeamColumns[3] = new nlobjSearchColumn('custrecord_deal_team_role',null,null);
        
        dealTeamResults = nlapiSearchRecord('customrecord_deal_project_team',null,dealTeamFilters,dealTeamColumns);
                        
        // setup the display
        portlet.setTitle('SRS Lost Opportunities');
        
        var companyName = portlet.addColumn('companynamecustomer', 'text', 'Opportunity Name', 'CENTER');
        companyName.setURL(nlapiResolveURL('RECORD', 'opportunity'));
        companyName.addParamToURL('id', 'id', true);
       // portlet.addColumn('companynamecustomer','text','Opportunity Name','CENTER');
        portlet.addColumn('lastcontactdate', 'text', 'Last Contact Date', 'CENTER');
        portlet.addColumn('primarycontact', 'text', 'Sales Contact','CENTER');
        portlet.addColumn('entityidsalesrep', 'text', 'Sales Rep', 'CENTER');
        portlet.addColumn('legalrep', 'text', 'Legal Rep', 'CENTER');
       // portlet.addColumn('entitystatus', 'text', 'Status','CENTER');
       portlet.addColumn('winlossreason', 'text', 'Reason','CENTER');
        portlet.addColumn('memo', 'text', 'Details', 'LEFT');
        portlet.addColumn('dealstatus','text','Deal Status','CENTER');
        portlet.addColumn('projectedtotal', 'currency', 'Projected Total', 'RIGHT');

        
        //Loop through the results of the saved search
        for (var l = 0; oppSearchResults != null && l < oppSearchResults.length; l++) {
        
            var resultRow = oppSearchResults[l];
            var id = resultRow.getValue('internalid', null, 'group');
            var hash = new Array();
            var priContact = null;  //used to set primary contact value
            var otherContacts = '<span style="font-weight: bold;">Other Contacts</span><br />'; //used to compile list of all contacts except for primary sales
            var otherContactsCount = 0;
            
            //
            //  Search for related deal contact records.
            //
            
            hash.primarycontact = '<a href="#" onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_esc_con_roles=27\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            hash.legalcontact = '<a href="#" title="Click here to add a new legal contact." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_esc_con_roles=26\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
                        
            
            if (dealContactResults != null) 
            {
            
                for (var t = 0; dealContactResults != null && t < dealContactResults.length; t++) 
                {
                    var dealContactRow = dealContactResults[t];
                  
                    
                    //check to make sure contact is for current deal
                    if (dealContactRow.getValue('custrecord59', null, null) == resultRow.getValue('entity', null, 'group')) 
                    {
                        //Check to see if role is sales contact
                        if (isElementPresent(dealContactRow.getValue('custrecord_esc_con_roles', null, null).split(','),27))
                                {
                                    // opens contact record hash.primarycontact = '<a title="' + dealContactRow.getText('custrecord60', null, null) + '" href="' + nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group') + '">' + dealContactRow.getText('custrecord60', null, null) + '</a>';   
                            //this opens new window to add additional contacts    
                            hash.primarycontact = '<a href="#" onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+resultRow.getValue('entity', null, 'group')+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">' + dealContactRow.getText('custrecord60', null, null) + '</a>';
                            
                                if(dealContactRow.getValue('custrecord_esc_con_roles', null, null).split(',').length > 1) {
                                    otherContacts = otherContacts + dealContactRow.getText('custrecord_esc_con_roles', null, null) + ' - ' + dealContactRow.getText('custrecord60', null, null)+'<br />';
                                    otherContactsCount = otherContactsCount + 1
                                }
                                }
    
                            else
                                {
                                   //Get all other contacts not in the sales role
                                    otherContacts = otherContacts + dealContactRow.getText('custrecord_esc_con_roles', null, null) + ' - ' + dealContactRow.getText('custrecord60', null, null)+'<br />';
                                        otherContactsCount = otherContactsCount + 1
                            
                             }
                    }
               }      
                
          }
            
            //check and see if there are no other contacts and set new value otherwise the Other Contacts heading appears
            if (otherContactsCount == 0) 
            {
            otherContacts = 'No other contacts have been entered. Click to enter a new deal contact.';
            }
            
          //set up display elements.
            var contactLostToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:400px;text-decoration:none;z-index:100;";    
            
            //add hover feature to display other contacts
              hash.primarycontact = '<div onMouseOver="var x = document.getElementById(\''+l+'lostcontact\');x.style.display=\'block\';var offset = 20;x.style.left=(event.pageX+offset)+\'px\';x.style.top=(event.pageY+20)+\'px\';" onMouseOut="var x = document.getElementById(\''+l+'lostcontact\');x.style.display=\'none\'">'+hash.primarycontact+'<div id="'+l+'lostcontact" style="'+contactLostToolTipCss+'" align="left">'+otherContacts+'</div></div>';
            //
            // End deal contact retrieval
            //
            
  
            hash.id = id;
            hash.companynamecustomer = resultRow.getText('entity', null, 'group');
            //hash.companynamecustomer = '<a href="#" title="Click here to view the opportunity." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','opportunity',resultRow.getValue('entity', null, 'group'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+resultRow.getText('entity', null, 'group')+'</a>';
            
           
            //find when the most recent update happened.
  
           //Default sales and legal rep to none
            hash.entityidsalesrep =   '<a href="#" title="Click here to add a new SRS sales rep." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_119',null,'EDIT')+'&l=T&record.custrecord_deal_team_deal='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_deal_team_role=-2\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            hash.legalrep = '<a href="#" title="Click here to add a new SRS legal rep." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_119',null,'EDIT')+'&l=T&record.custrecord_deal_team_deal='+resultRow.getValue('entity', null, 'group')+'&record.custrecord_deal_team_role=1\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            
            if(dealTeamResults != null) {
                for(var dteam = 0;dteam < dealTeamResults.length;dteam++) {
                    var dealTeamResult = dealTeamResults[dteam];
                    var memberRoles = dealTeamResult.getValue('custrecord_deal_team_role').split(',');
                    if(dealTeamResult.getValue('custrecord_deal_team_deal') == resultRow.getValue('entity', null, 'group')) {
                        for(var dresult = 0; dresult < memberRoles.length; dresult++) {
                            if(memberRoles[dresult] == '-2') {
                                hash.entityidsalesrep = dealTeamResult.getText('custrecord_deal_team_employee');
                            } else if(memberRoles[dresult] == '1') {
                                hash.legalrep = dealTeamResult.getText('custrecord_deal_team_employee');
                            }
                        }
                    }
                }
            }
            
            //setup notes to get only last 4
            var noteCount = 0;
            var noteMessage = '<span style="font-weight: bold;">Last 4 Deal Memos for '+resultRow.getText('entity', null, 'group')+'</span><BR><table id=notes>';
            var lastNoteDate = null;
            
              for (var ll = 0; noteSearchResults != null && ll < noteSearchResults.length; ll++) 
             {
                  var noteRow = noteSearchResults[ll];
                  if (noteRow.getValue('internalid') == id) 
                  {
                      if (noteCount < 4)
                          {
                          
                          noteMessage = noteMessage + '<tr><td valign="top" width="10%" style="font-size:70%">' +  noteRow.getValue('startdate','call',null) + '</td><td valign="top" width="18%" style="font-size:70%">' + noteRow.getText('createdby','call',null) + '</td><td valign="top" width="72%" style="font-size:70%">' + noteRow.getValue('message','call',null) + '</td></tr>'
                          if (noteCount == 0)  //Since the date is sorted by date desc, this should be the last contact date
                              {
                              //get most recent date
                              lastNoteDate = noteRow.getValue('startdate','call',null)
                              
                              }
                          noteCount++
                          }
                  }

             }
              noteMessage = noteMessage + '</table>'
            //setting the display for the date. set to -none- if no date, else set to the date. 
                if (lastNoteDate == '')
                    {
                     hash.lastcontactdate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;obj_custevent_memo_opportunity=' + id + '&amp;obj_invitee=' + resultRow.getValue('entity', null, 'group') + '&amp;obj_custevent_memo_deal=' + resultRow.getValue('entity', null, 'group') + '&amp;cf=35&amp;contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">-none-</a>';
                     noteMessage = 'No deal memos have been entered. Click to enter a new deal memo.';
                    }
                else
                    {
                    hash.lastcontactdate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;obj_custevent_memo_opportunity=' + id + '&amp;obj_invitee=' + resultRow.getValue('entity', null, 'group') + '&amp;obj_custevent_memo_deal=' + resultRow.getValue('entity', null, 'group') + '&amp;cf=35&amp;contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">'+ lastNoteDate + '</a>';
                    }
        
                var dateLostToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
              //add hover feature to display other contacts
            hash.lastcontactdate = '<div onMouseOver="var x = document.getElementById(\''+l+'lostnote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+offset))};x.style.left=(event.clientX-80)+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+l+'lostnote\');x.style.display=\'none\'">'+hash.lastcontactdate+'<div id="'+l+'lostnote" style="'+contactLostToolTipCss+'" align="left">'+noteMessage+'</div></div>';
            
            //End notes setup
                 
              
            //hash.entitystatus = resultRow.getText('entitystatus', null, 'group');
            hash.winlossreason = resultRow.getText('winlossreason', null, 'group');
            //Details column = memo field
            hash.memo = resultRow.getValue('memo', null, 'group');
            hash.dealstatus = resultRow.getText('custbody_opp_deal_status',null,'group');
            hash.projectedtotal = resultRow.getValue('projectedtotal', null, 'group');
            //Per #1150  If an Opportunity is less that a week old, highlight it.
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Checking for dates... Record Date: '+nlapiStringToDate(resultRow.getValue('date',null,'group'))+', Test Date: '+(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)));
            if (nlapiStringToDate(resultRow.getValue('date',null,'group')) > (new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))) {
                nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Updating with span tags.');
                hash.companynamecustomer = '<span style="font-weight: bold; background-color: #ffff00;">'+resultRow.getText('entity', null, 'group')+'</span>';
            }
            
            // Search for deals that have been in proposal issued status for more than 3 days and highlight if true  
            var propIssuedResults = null;       
            var propIssuedFilters = new Array();
            propIssuedFilters[0] = new nlobjSearchFilter('internalid',null,'is',id);
            propIssuedResults = nlapiSearchRecord('opportunity', 'customsearch_opp_prop_issued_3days',propIssuedFilters);
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Checking for proposal issued dates greater than 3 days. ID: '+id);
            
            if(propIssuedResults != null) {
                var propColumns = getColumnsByName(oppSearchResults);
                //get most recent change to Proposal Issued
                for (var p = 0; propIssuedResults != null && p < 1; p++) 
               {
                    var propIssuedRow = propIssuedResults[p];
                    var propIssuedDays = propIssuedRow.getValue('formulanumeric',null,'group');
                    nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Prop Issued Days: '+ propIssuedDays);
                    if (propIssuedDays > 3){
                nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Updating with span tags. Proposal Issued highlight');
                hash.companynamecustomer = '<span style="font-weight: bold; background-color: #00ff00;">'+resultRow.getText('entity', null, 'group')+'</span>';
               } 
               }
               }
            //Setup the target/acquiring company names and display
            var partiesCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:300px;text-decoration:none;z-index:100;";
            var targetCompany = '----------'; //this will appear when permission is denied.
            var acquiringCompany = '----------'; //this will appear when permission is denied.
            if(resultRow.getValue('custbodycustbody_opp_target_name',null,'group') != null && resultRow.getValue('custbodycustbody_opp_target_name',null,'group') != '') {
                targetCompany = resultRow.getValue('custbodycustbody_opp_target_name',null,'group');
            }
            if(resultRow.getValue('custbody_opp_acquiring_comp_text',null,'group') != null && resultRow.getValue('custbody_opp_acquiring_comp_text',null,'group') != '') {
                acquiringCompany = resultRow.getValue('custbody_opp_acquiring_comp_text',null,'group');
            }
            var confidentialData = '<span style="font-weight: bold;">Target Company: </span>'+targetCompany+'<br/><span style="font-weight: bold;">Acquiring Company: </span>'+acquiringCompany;
            //Check to see if we should flag for EscrowExchange
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Is this EscrowExchange Eligible? '+resultRow.getValue(columns["escrowexchange_eligible"])+'/'+resultRow.getText(columns["escrowexchange_eligible"]));
            if(resultRow.getValue(columns["escrowexchange_eligible"]) != null && resultRow.getValue(columns["escrowexchange_eligible"]) == 1) {
                hash.companynamecustomer = '<img src="/images/icons/highlights/icon_lists_flag_green.png" />&nbsp;'+hash.companynamecustomer;
            }
            //Check to see if we should flag for Wind down deal
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Project ID 276 and 277 are wind downs. Project ID: '+resultRow.getValue(columns["template_id"]));
            if(resultRow.getValue(columns["template_id"]) != null && ((resultRow.getValue(columns["template_id"]) == 276) || (resultRow.getValue(columns["template_id"]) == 277))) {
                hash.companynamecustomer = '<font size="2" color="blue">W</font>&nbsp;'+hash.companynamecustomer;
            }

    //Check to see if we should flag for Acquiom deal
            nlapiLogExecution('DEBUG','SRSPortlets.opportunityPortlet','Acquiom deal field: '+resultRow.getValue(columns["acquiom"]));
            if(resultRow.getValue(columns["acquiom"]) != null && resultRow.getValue(columns["acquiom"]) == "T") {
                hash.companynamecustomer = '<font size="2" color="green">A</font>&nbsp;'+hash.companynamecustomer;
            }

            hash.companynamecustomer = '<div onMouseOver="var x = document.getElementById(\''+l+'losttranspart\');x.style.display=\'block\';var offset = 0;x.style.left=(event.pageX+offset)+\'px\';x.style.top=(event.pageY+20)+\'px\';" onMouseOut="var x = document.getElementById(\''+l+'losttranspart\');x.style.display=\'none\'">'+hash.companynamecustomer+'<div id="'+l+'losttranspart" style="'+partiesCss+'" align="left">'+confidentialData+'</div></div>';
            portlet.addRow(hash);
        }
    }
}

//End Lost Opportunity Portlet

function salesorderPortlet(portlet, column){
    // perform the search
    var salesSearchResults = null; //search container for transaction records.
    salesSearchResults = nlapiSearchRecord('transaction', 'customsearch_active_sales_order_portlet');
    // set search results
    if (salesSearchResults != null) {
        //Hack to get around how NetSuite handles multiple formula fields of the same type in searches.
        var sampleResult = salesSearchResults[0];
        var columns = sampleResult.getAllColumns();
        var columnLen = columns.length;
        var columnLegalRep;
        var columnUserNoteDate;
        var columnUserNoteText;
        var columnUserNoteAuthor;
        
        // loop through all columns and pull UI labels, and values for columns
        
        for (i = 0; i < columnLen; i++) {
            var targetColumn = columns[i];
            if (targetColumn.getLabel() == 'legal_rep') {
                columnLegalRep = targetColumn;
            }
            else 
                if (targetColumn.getLabel() == 'user_note_text') {
                    columnUserNoteText = targetColumn;
                }
                else 
                    if (targetColumn.getLabel() == 'user_note_date') {
                        columnUserNoteDate = targetColumn;
                    } else 
                        if (targetColumn.getLabel() == 'user_note_who') {
                            columnUserNoteAuthor = targetColumn;
                        }
        }
        
        //end of hack.    
        
        //
        // Search deal (escrow) contacts
        //
        var dealContactResults = null;
        var dealContactFilters = new Array();
        var dealContactColumns = new Array();
        var targetDeals = new Array();
        
        //Loop through Sales Order results to get the deals involved.
        nlapiLogExecution('DEBUG', 'SRSPortlets.salesorderPortlet','Attempting to get the deal contacts for the Active Sales Orders.');
        for (var j = 0; salesSearchResults != null && j < salesSearchResults.length; j++) {
            var tempResult = salesSearchResults[j];
            targetDeals[j] = tempResult.getValue('entity', null, 'group');
            nlapiLogExecution('DEBUG', 'SRSPortlets.salesorderPortlet', 'Added deal: '+tempResult.getValue('entity', null, 'group')+'/'+tempResult.getText('entity', null, 'group'));
        }
        
        
        
        
        //TODO: Add additional filters based on the multi-select values to limit to the desired roles. Will avoid looping later.
        dealContactFilters[0] = new nlobjSearchFilter('custrecord59', null, 'anyof', targetDeals); // this searches for the deal 'customer' in the system (the escrow).
        dealContactFilters[1] = new nlobjSearchFilter('custrecord_esc_con_roles', null, 'anyof', ["26", "27"]); //These are the list roles that we're trying to filter for.
        dealContactColumns[0] = new nlobjSearchColumn('custrecord60', null, null); // The reference to the contact in the deal contact record.
        dealContactColumns[1] = new nlobjSearchColumn('custrecord_esc_con_roles', null, null); // the role of the contact
        dealContactColumns[2] = new nlobjSearchColumn('custrecord59', null, null); //the deal for the contact
        
        //get the results of the deal contacts and find the ones we want.
        dealContactResults = nlapiSearchRecord('customrecord16', null, dealContactFilters, dealContactColumns);
        
        //Finally get the deal team for the deals involved.
        var dealTeamResults = null;
        var dealTeamFilters = new Array();
        var dealTeamColumns = new Array();
        
        dealTeamFilters[0] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'anyof',targetDeals);
        dealTeamFilters[1] = new nlobjSearchFilter('custrecord_deal_team_role',null,'anyof',["1"]);
        
        dealTeamColumns[0] = new nlobjSearchColumn('internalid',null,null);
        dealTeamColumns[1] = new nlobjSearchColumn('custrecord_deal_team_deal',null,null);
        dealTeamColumns[2] = new nlobjSearchColumn('custrecord_deal_team_employee',null,null);
        dealTeamColumns[3] = new nlobjSearchColumn('custrecord_deal_team_role',null,null);
        
        dealTeamResults = nlapiSearchRecord('customrecord_deal_project_team',null,dealTeamFilters,dealTeamColumns);
        
        //
        // setup the display
        //
        portlet.setTitle('Active Sales Orders');
        
        portlet.addColumn('addnote','text','Note','CENTER');
        var editRec = portlet.addColumn('editrow','text','Edit','CENTER');
        
        portlet.addColumn('entity', 'text', 'Deal', 'LEFT'); //the sales order was opened
        
        portlet.addColumn('dealname', 'text', 'Name', 'LEFT'); // project name
        portlet.addColumn('expectedclose', 'text', 'Expected Close', 'CENTER');
        portlet.addColumn('lastcontactdate', 'text', 'Last Update Date', 'CENTER');
        portlet.addColumn('expenselocation', 'text', 'Expense Fund Holder', 'LEFT');
        portlet.addColumn('expenseamount', 'currency', 'Expense Fund Amount', 'RIGHT');
        portlet.addColumn('legalcontact', 'text', 'Legal Contact', 'LEFT');
        portlet.addColumn('legalrep', 'text', 'Legal Rep', 'LEFT');
        portlet.addColumn('amount', 'currency', 'Engagment Fee', 'RIGHT');
        
        for (var i = 0; salesSearchResults != null && i < salesSearchResults.length; i++) // setup view url
        {
            var result = salesSearchResults[i];
            
            var id = result.getValue('entity',null,'group'); // Sales Order ID
            var hash = new Array();
            
            hash.id = id;
            hash.editrow = '<a href="#" title="Click here to edit the sales order." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','salesorder',result.getValue('internalid',null,'group'),'EDIT')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">edit</a>';
            hash.entity = '<a href="#" onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',result.getValue('entity',null,'group'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+result.getText('entity',null,'group')+'</a>';
            hash.dealname = '<a href="#" title="Click here to view the opportunity." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','opportunity',result.getValue('opportunity', null, 'group'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+result.getText('opportunity', null, 'group').replace(/([0-9]+).?/,'')+'</a>'
            hash.expectedclose = result.getValue('custbody_exp_close_date',null,'group');
            
            var salesDate = new Date(result.getValue('trandate', null, 'group'));
            
            if (result.getValue(columnUserNoteDate) != null) {
                var usrNoteDate = new Date(result.getValue(columnUserNoteDate));
            }
            else {
                var usrNoteDate = new Date(1970, 1, 1);
            }
            
            if (usrNoteDate >= salesDate) {
                //User notes date is the most recent
                displayDate = usrNoteDate;
                displayNote = cleanseHTML('('+result.getValue(columnUserNoteAuthor)+'):'+result.getValue(columnUserNoteText));
            }
            else {
                //As a last resort, use the record date
                displayDate = salesDate;
                displayNote = "Sales Order Created"
            }
            
            var disMonth = displayDate.getMonth();
            disMonth++;
            hash.lastcontactdate = '<a title="' + displayNote + '">' + disMonth + '/' + displayDate.getDate() + '/' + displayDate.getFullYear() + '</a>';
            
            if(result.getText('custbody_opp_exp_escrow_holder',null,'group') == '- None -') {
                hash.expenselocation = 'Unknown';
            } else {
                hash.expenselocation = result.getText('custbody_opp_exp_escrow_holder',null,'group');
            }
            
            hash.expenseamount = result.getValue('custbody_opp_expense_funds_amount',null,'group');
            
            //
            //  Search for related deal contact records.
            //
            hash.legalcontact = '<a href="#" title="Click here to add a new legal contact." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_16',null,'EDIT')+'&l=T&record.custrecord59='+result.getValue('entity',null,'group')+'&record.custrecord_esc_con_roles=26\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            if (dealContactResults != null) {
                for (var t = 0; dealContactResults != null && t < dealContactResults.length; t++) {
                    var dealContactRow = dealContactResults[t];
                    var contactRoles = dealContactRow.getValue('custrecord_esc_con_roles', null, null).split(",");
                    if (contactRoles != null) {
                        for (var u = 0; u < contactRoles.length; u++) {
                            if (contactRoles[u] == '26' && dealContactRow.getValue('custrecord59', null, null) == result.getValue('entity', null, 'group')) {
                                hash.legalcontact = '<a title="' + dealContactRow.getText('custrecord60', null, null) + '" href="' + nlapiResolveURL('RECORD', 'contact', dealContactRow.getValue('custrecord60', null, null), 'VIEW') + '">' + dealContactRow.getText('custrecord60', null, null) + '</a>';
                            }
                        }
                    }
                }
            }
            //
            // End deal contact retrieval
            //
            
            hash.legalrep = '<a href="#" title="Click here to add a new SRS legal rep." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_119',null,'EDIT')+'&l=T&record.custrecord_deal_team_deal='+result.getValue('entity',null,'group')+'&record.custrecord_deal_team_role=1\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            
            if(dealTeamResults != null) {
                for(var dteam = 0;dteam < dealTeamResults.length;dteam++) {
                    var dealTeamResult = dealTeamResults[dteam];
                    var memberRoles = dealTeamResult.getValue('custrecord_deal_team_role').split(',');
                    if(dealTeamResult.getValue('custrecord_deal_team_deal') == result.getValue('entity', null, 'group')) {
                        for(var dresult = 0; dresult < memberRoles.length; dresult++) {
                            if(memberRoles[dresult] == '1') {
                                hash.legalrep = dealTeamResult.getText('custrecord_deal_team_employee');
                            }
                        }
                    }
                }
            }
            //hash.legalrep = result.getValue(columnLegalRep);
            hash.amount = result.getValue('amount',null,'max');    
            hash.addnote = '<a href="#" title="Click here to add a new note."><img width="24" height="12" border="0" src="/images/nav/listoptionsup.gif?v=2010.2.0" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;transaction=' + result.getValue('internalid',null,'group') + '&amp;invitee=' + result.getValue('entity', null, 'group') + '&amp;company=' + result.getValue('entity', null, 'group') + '&amp;cf=35&amp;contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;"></a>';
            
            
            //Setup the target/acquiring company names and display
            var salespartiesCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:300px;text-decoration:none;z-index:100;";
            var targetCompany = '----------'; //this will appear when permission is denied.
            var acquiringCompany = '----------'; //this will appear when permission is denied.
            if(result.getValue('custbodycustbody_opp_target_name','opportunity','group') != null && result.getValue('custbodycustbody_opp_target_name','opportunity','group') != '') {
                targetCompany = result.getValue('custbodycustbody_opp_target_name','opportunity','group');
            }
            if(result.getValue('custbody_opp_acquiring_comp_text','opportunity','group') != null && result.getValue('custbody_opp_acquiring_comp_text','opportunity','group') != '') {
                acquiringCompany = result.getValue('custbody_opp_acquiring_comp_text','opportunity','group');
            }
            var confidentialData = '<span style="font-weight: bold;">Target Company: </span>'+targetCompany+'<br/><span style="font-weight: bold;">Acquiring Company: </span>'+acquiringCompany;
           hash.entity = '<div onMouseOver="var x = document.getElementById(\''+i+'sotranspart\');x.style.display=\'block\';var offset = 0;x.style.left=(event.pageX+offset)+\'px\';x.style.top=(event.pageY+20)+\'px\';" onMouseOut="var x = document.getElementById(\''+i+'sotranspart\');x.style.display=\'none\'">'+hash.entity+'<div id="'+i+'sotranspart" style="'+salespartiesCss+'" align="left">'+confidentialData+'</div></div>';
            
            portlet.addRow(hash);
        }
    }
}

function openClaimsPortlet(portlet, column) {
    //
    //Start by getting the data.  3 searches, one for the cases, one for the memos and one for the dates.
    //

nlapiLogExecution('DEBUG', 'SRSPortlets.OpenClaimsPortlet', 'Checking remaining usage, beginning: ' + nlapiGetContext().getRemainingUsage());    

    //Get the cases.
    var caseResults = null;
    var caseColumns = new Array();
    var caseFilters = new Array();
    

    caseFilters[0] = new nlobjSearchFilter('stage',null,'noneof','CLOSED');
    caseFilters[1] = new nlobjSearchFilter('custevent_case_type',null,'anyof',['1','3','4','7','9'],null,1,0,true,false);
    caseFilters[2] = new nlobjSearchFilter('custevent_case_department',null,'is',5,null,0,1,false,false);
    
    caseColumns[0] = new nlobjSearchColumn('formulatext').setFormula("lower({custevent1.companyname})");
    caseColumns[1] = new nlobjSearchColumn('casenumber');
    caseColumns[2] = new nlobjSearchColumn('internalid');
    caseColumns[3] = new nlobjSearchColumn('custevent1');
    caseColumns[4] = new nlobjSearchColumn('title');
    caseColumns[5] = new nlobjSearchColumn('assigned');
    caseColumns[6] = new nlobjSearchColumn('companyname','custevent1');
    caseColumns[7] = new nlobjSearchColumn('custentity_rep_warranty_insurance','customer');
    caseColumns[8] = new nlobjSearchColumn('custevent_legalhold_start_date');
    caseColumns[9] = new nlobjSearchColumn('custevent_legalhold_end_date');
    
    caseColumns[0].setSort();
    caseColumns[1].setSort();
    
    caseResults = nlapiSearchRecord('supportcase',null,caseFilters,caseColumns);
    
    //get the case notes/memos
    var memoResults = null;
    memoResults = nlapiSearchRecord('phonecall','customsearch_claims_dashboard_multi_memo');
    
    
    //get the events
    var eventResults = null;
    eventResults = nlapiSearchRecord('calendarevent','customsearch_claims_dashboard_events');
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
    portlet.setTitle('SRS Cases - Claims/Merger Activity');
    
    portlet.addColumn('deal','text','Deal','CENTER');
    portlet.addColumn('number','text','Number','CENTER');
    portlet.addColumn('subject','text','Subject','LEFT');
    portlet.addColumn('assignedto','text','Assigned To','CENTER');
    portlet.addColumn('lastnotedate','text','Last Note Date','CENTER');
    portlet.addColumn('nextduedate','text','Next Due Date','CENTER');
    
    
    
    //loop through the case results and construct/add the portlet data record
    if(caseResults != null && caseResults.length > 0) {
        //set up the portlet data record
        var hash = new Object();
        
        //Main Case Loop
        for(var r = 0; r < caseResults.length; r++) {
nlapiLogExecution('DEBUG', 'SRSPortlets.OpenClaimsPortlet', 'Checking remaining usage, case loop: ' + nlapiGetContext().getRemainingUsage());    
            currCase = caseResults[r];
            
              hash.deal = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getText('custevent1')+'</a>';
            hash.number = '<a href="#" title="Click here to view the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getValue('internalid'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('casenumber')+'</a>';
            hash.subject = currCase.getValue('title');
            hash.assignedto = '<a href="#" title="Click here to edit the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getValue('internalid'),'VIEW')+'&l=T&e=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getText('assigned')+'</a>';
            
            //Check to see if we should flag as Rep & Warranty
            //nlapiLogExecution('DEBUG','SRSPortlets.OpenClaimsPortlet','Looking for R&W status 1 = yes: '+ currCase.getValue('custentity_rep_warranty_insurance','customer'));
            if(currCase.getValue('custentity_rep_warranty_insurance','customer') != null && (currCase.getValue('custentity_rep_warranty_insurance','customer') == 1)) {
                hash.deal = '<font size="2" color="black">RW</font>&nbsp;'+hash.deal;
            }
        
  //nlapiLogExecution('DEBUG','SRSPortlets.OpenClaimsPortlet','LH Value: '+ hash.deal);
         if((currCase.getValue('custevent_legalhold_start_date') != '') && (currCase.getValue('custevent_legalhold_end_date') == '')) 
           {
                hash.deal = '<font size="2" color="Red">LH</font>&nbsp;'+hash.deal;
   // nlapiLogExecution('DEBUG','SRSPortlets.OpenClaimsPortlet','LH Value: '+ hash.deal);
            }
    
//new notes/memo hover text
//setup notes to get only last 4
            
            var contactToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:400px;text-decoration:none;z-index:100;";    
            
            var id = currCase.getValue('internalid');
            var noteCount = 0;
            var noteMessage = '<span style="font-weight: bold;">Last 4 Case Notes for '+currCase.getText('custevent1')+' - #'+currCase.getValue('casenumber')+ '</span><BR><table id=casenotes>';
            var lastNoteDate = null;
            
              for (var t = 0; memoResults != null && t < memoResults.length; t++) 
             {
                  var noteRow = memoResults[t];
                  if (noteRow.getValue('internalid','case',null) == id) 
                  {
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

             }
              noteMessage = noteMessage + '</table>'
              
                //setting the display for the date. set to -none- if no date, else set to the date. 
                if (lastNoteDate == '' || lastNoteDate == null)
                    {
                     hash.lastnotedate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getValue('internalid') + '&amp;record.invitee=' + currCase.getValue('custevent1') + '&amp;record.company=' + currCase.getValue('custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">-none-</a>';
                     noteMessage = 'No case notes have been entered. Click to enter a new case note.';
                     
                    }
                else
                    {
                    hash.lastnotedate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getValue('internalid') + '&amp;record.invitee=' + currCase.getValue('custevent1') + '&amp;record.company=' + currCase.getValue('custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">' + lastNoteDate + '</a>';
                    }
        
            //    var dateToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
              //add hover feature to display up to 4 note records
              
                 hash.lastnotedate = '<div onMouseOver="var x = document.getElementById(\''+r+'casenote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+15))};x.style.left=(event.clientX-(x.offsetWidth+60))+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+r+'casenote\');x.style.display=\'none\'">'+hash.lastnotedate+'<div id="'+r+'casenote" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>';
                 
              
            
            //end new memo hover text
            
            //Find any relevant Event and add that to the portlet data row, otherwise simply use a default value.
            hash.nextduedate = '<a href="#" title="Click here to add a new Important Date." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'&l=T&record.supportcase='+currCase.getValue('internalid')+'&record.invitee='+currCase.getValue('custevent1')+'&record.company='+currCase.getValue('custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
            if(eventResults != null && eventResults.length > 0) {
                for(var er = 0; er < eventResults.length; er++) {
                    if(eventResults[er].getValue('internalid','case','group') == currCase.getValue('internalid')) {
                        hash.nextduedate = '<a href="#" title="'+eventResults[er].getValue(columnEventTitle)+' :: '+eventResults[er].getValue(columnEventMessage)+'" onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'&l=T&record.supportcase='+currCase.getValue('internalid')+'&record.invitee='+currCase.getValue('custevent1')+'&record.company='+currCase.getValue('custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+eventResults[er].getValue(columnEventDate)+'</a>';
                    }
                }
            }
            
                          
            //Add the row to the portlet dataset and repeat.
            portlet.addRow(hash);
        }
    }
}

function openSupportPortlet(portlet, column) {
    //
    //Start by getting the data.  3 searches, one for the cases, one for the memos and one for the dates.
    //
    
    //Get the cases.
    var caseResults = null;
    
    caseResults = nlapiSearchRecord('supportcase','customsearch_srs_support_cases');
    
    //get the case notes/memos
    var memoResults = null;
    memoResults = nlapiSearchRecord('phonecall','customsearch_support_dashboard_memos');
    
    
    //get the events
    var eventResults = null;
    //eventResults = nlapiSearchRecord('calendarevent','customsearch_support_dashboard_events');
    eventResults = nlapiSearchRecord('activity','customsearch_support_activity_search');
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
    portlet.setTitle('SRS Cases - Support Activity');

    portlet.addColumn('tag','text','Status','RIGHT');    
    portlet.addColumn('deal','text','Deal','CENTER');
    portlet.addColumn('shareholder','text','Shareholder','CENTER');
    portlet.addColumn('number','text','Number','CENTER');
    portlet.addColumn('subject','text','Subject','LEFT');
    portlet.addColumn('assignedto','text','Assigned To','CENTER');
    portlet.addColumn('createddate','text','Created Date','CENTER');
    portlet.addColumn('lastnotedate','text','Last Note Date','CENTER');
    portlet.addColumn('nextduedate','text','Next Action Date','CENTER');
    
    
    
    //loop through the case results and construct/add the portlet data record
    if(caseResults != null && caseResults.length > 0) {
        //set up the portlet data record
        var hash = new Object();

        //Main Case Loop
        for(var s = 0; s < caseResults.length; s++) {
            currCase = caseResults[s];
            
            //Build the hash.tag by getting all values and text from the custentity_marketing_attributes field
            var customerTag = currCase.getText('custentity_marketing_attributes','custevent1');
            var contactTag = currCase.getText('custentity_marketing_attributes','contact');
            
            var marquisTag = customerTag.indexOf("Marquis Customer");
            var vipTag = contactTag.indexOf("VIP");
            
            if(marquisTag != '-1'){
                var marquisPic = '<img height="20" alt="Marquis Customer" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=606057&c=772390&h=ccd15c9e3ec56c697841">';
            }else{            
                var marquisPic = "";
            }  
            if(vipTag != '-1'){
                var vipPic = '<img height="20" alt="VIP Customer" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=606058&c=772390&h=c66371e44820ebb51fc6">';
            }else{
                var vipPic = "";
            }
            hash.tag = marquisPic + vipPic;
            
            var cautionTag = '<img height="20" alt="CAUTION" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=606059&c=772390&h=ed717809bd6af4554408">';
            var justDoItTag = '<img height="20" alt="CAUTION" src="https://system.sandbox.netsuite.com/core/media/media.nl?id=606060&c=772390&h=8b83fe758e5c67b9af97">';
        
              hash.deal = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',currCase.getValue('custevent1'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getText('custevent1')+'</a>';
              hash.shareholder = "<a href="+nlapiResolveURL('RECORD','customer',currCase.getValue('company'),'VIEW')+">"+currCase.getText('company')+"</a>";
            hash.number = '<a href=https://system.netsuite.com/app/crm/support/supportcase.nl?id='+currCase.getValue('internalid')+' title="Click here to view the case.">'+currCase.getValue('casenumber')+'</a>';
            //hash.number = '<a href="#" title="Click here to view the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getValue('internalid'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getValue('casenumber')+'</a>';
            hash.subject = currCase.getValue('title');
            hash.assignedto = '<a href="#" title="Click here to edit the case." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','supportcase',currCase.getValue('internalid'),'VIEW')+'&l=T&e=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currCase.getText('assigned')+'</a>';

            var caseCreatedDateFull = currCase.getValue('createddate');
            var caseCreatedDateSpaceSplit = caseCreatedDateFull.split(' ');
            hash.createddate = caseCreatedDateSpaceSplit[0];
                    
            //Check to see if we should flag as Rep & Warranty
            nlapiLogExecution('DEBUG','SRSPortlets.SupportCasesPortlet','Looking for R&W status 1 = yes: '+ currCase.getValue('custentity_rep_warranty_insurance','customer'));
            if(currCase.getValue('custentity_rep_warranty_insurance','customer') != null && (currCase.getValue('custentity_rep_warranty_insurance','customer') == 1)) {
                hash.deal = '<font size="2" color="black">RW</font>&nbsp;'+hash.deal;
            }
        
         if((currCase.getValue('custevent_legalhold_start_date') != '') && (currCase.getValue('custevent_legalhold_end_date') == '')) 
           {
                hash.deal = '<font size="2" color="Red">LH</font>&nbsp;'+hash.deal;
   
            }
    
//new notes/memo hover text
//setup notes to get only last 4
            
            var contactToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:400px;text-decoration:none;z-index:100;";    
            
            var id = currCase.getValue('internalid');
            var noteCount = 0;
            var noteMessage = '<span style="font-weight: bold;">Last 4 Case Notes for '+currCase.getText('custevent1')+' - #'+currCase.getValue('casenumber')+ '</span><BR><table id=supcasenotes>';
            var lastNoteDate = null;
            
              for (var t = 0; memoResults != null && t < memoResults.length; t++) 
             {
                  var noteRow = memoResults[t];
                  if (noteRow.getValue('internalid','case',null) == id) 
                  {
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

             }
              noteMessage = noteMessage + '</table>'
              
                //setting the display for the date. set to -none- if no date, else set to the date. 
                if (lastNoteDate == '' || lastNoteDate == null)
                    {
                     hash.lastnotedate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getValue('internalid') + '&amp;record.invitee=' + currCase.getValue('custevent1') + '&amp;record.company=' + currCase.getValue('custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">-none-</a>';
                     noteMessage = 'No case notes have been entered. Click to enter a new case note.';
                     
                    }
                else
                    {
                    hash.lastnotedate = '<a href="#" onclick="nlOpenWindow(\'/app/crm/calendar/call.nl?l=T&amp;record.supportcase=' + currCase.getValue('internalid') + '&amp;record.invitee=' + currCase.getValue('custevent1') + '&amp;record.company=' + currCase.getValue('custevent1') + '&amp;cf=35&amp;record.contact=\', \'activitypopup\',\'width=840,height=620,resizable=yes,scrollbars=yes\');return false;">' + lastNoteDate + '</a>';
                    }
        
            //    var dateToolTipCss = "border-radius: 15px;color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
              //add hover feature to display up to 4 note records
              
                 hash.lastnotedate = '<div onMouseOver="var x = document.getElementById(\''+s+'supcasenote\');x.style.display=\'block\';var topPosit = 0;var cHeight = document.body.clientHeight || document.documentElement.clientHeight;var offset = 20;if(event.clientY < ((cHeight/2)-offset)){topPosit=(event.pageY+((x.offsetHeight/2)-(offset/2)))}else{topPosit=(event.pageY-(x.offsetHeight+15))};x.style.left=(event.clientX-(x.offsetWidth+60))+\'px\';x.style.top=(topPosit)+\'px\';" onMouseOut="var x = document.getElementById(\''+s+'supcasenote\');x.style.display=\'none\'">'+hash.lastnotedate+'<div id="'+s+'supcasenote" style="'+contactToolTipCss+'" align="left">'+noteMessage+'</div></div>';
                 
              
            
            //end new memo hover text
            
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
            if(dd<10){dd='0'+dd} if(mm<10){mm='0'+mm} today = mm+'/'+dd+'/'+yyyy;
            
            var todaySplit = today.split('/');
            var todayMonth = todaySplit[0];
            var todayDay = todaySplit[1];
            var todayYear = todaySplit[2];

            var doesDueDateExist = '0';  //This var is set to 0 and is later set to 1 if any events exist
            
            hash.nextduedate = '<a href="#" title="Click here to add a new Important Date." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'?l=T&record.supportcase='+currCase.getValue('internalid')+'&record.invitee='+currCase.getValue('custevent1')+'&record.company='+currCase.getValue('custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';
                                    
            if(eventResults != null && eventResults.length > 0) {
                
                for(var er = 0; er < eventResults.length; er++) {
                    if(eventResults[er].getValue('internalid','case') == currCase.getValue('internalid')) {
                        hash.nextduedate = '<a href="#" title="Click here to add a new Important Date." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'&l=T&record.supportcase='+currCase.getValue('internalid')+'&record.invitee='+currCase.getValue('custevent1')+'&record.company='+currCase.getValue('custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+eventResults[er].getValue('startdate')+'</a>';
                        if(hash.nextduedate == 'null'){hash.nextduedate = '<a href="#" title="Click here to add a new Important Date." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_EVENT',null,'EDIT')+'&l=T&record.supportcase='+currCase.getValue('internalid')+'&record.invitee='+currCase.getValue('custevent1')+'&record.company='+currCase.getValue('custevent1')+'&record.contact=\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">-none-</a>';}
                        
                        var doesDueDateExist = '1';
                        
                        var dueDate = eventResults[er].getValue('startdate');
                        var dueDateSplit = dueDate.split('/');
                        var dueDateMonth = dueDateSplit[0];
                        var dueDateDay = dueDateSplit[1];
                        var dueDateYear = dueDateSplit[2];

                        var dueYearDiff = (todayYear - dueDateYear);
                        var dueMonthDiff = (todayMonth - dueDateMonth);
                        var dueDayDiff = (todayDay - dueDateDay);
                        
                        //if((marquisTag != '-1') || (vipTag != '-1')){
                            if(dueYearDiff < 0){
                                //Leave hash.tag alone
                            }else if(dueYearDiff > 0){
                                hash.tag = cautionTag + marquisPic + vipPic;
                            }else if(dueYearDiff == 0){
                                if(dueMonthDiff < 0){
                                    //Leave hash.tag alone
                                }else if(dueMonthDiff > 0){
                                    hash.tag = cautionTag + marquisPic + vipPic;
                                }else if((dueMonthDiff == 0)&&(dueYearDiff == 0)){
                                    if(dueDayDiff < 0){
                                        //Leave hash.tag alone
                                    }else if(dueDayDiff > 0){
                                        hash.tag = cautionTag + marquisPic + vipPic;
                                    }else if((dueMonthDiff == 0)&&(dueYearDiff == 0)&&(dueDayDiff == 0)){
                                        //hash.tag = cautionTag;
                                        hash.tag = justDoItTag + marquisPic + vipPic;
                                    }
                                }
                            }
                        //}                                
                    }
                }
            }
            //if((marquisTag != '-1') || (vipTag != '-1')){
                
                if(doesDueDateExist != '1'){
                
                    if(lastNoteDate != null){
                        //Compare the lastnotedate with todays date
                        var lastNoteDateSplit = lastNoteDate.split('/');
                        var lastNoteDateMonth = lastNoteDateSplit[0];
                        var lastNoteDateDay = lastNoteDateSplit[1];
                        var lastNoteDateYear = lastNoteDateSplit[2];

                        var lastNoteDateYearDiff = (todayYear - lastNoteDateYear);
                        var lastNoteDateMonthDiff = (todayMonth - lastNoteDateMonth);
                        var lastNoteDateDayDiff = (todayDay - lastNoteDateDay);
                        
                        if(lastNoteDateYearDiff < 0){
                            //Leave hash.tag alone
                        }else if(lastNoteDateYearDiff > 0){
                            hash.tag = cautionTag + marquisPic + vipPic;
                        }else if(lastNoteDateYearDiff == 0){
                            if(lastNoteDateMonthDiff < 0){
                                //Leave hash.tag alone
                            }else if(lastNoteDateMonthDiff > 0){
                                hash.tag = cautionTag + marquisPic + vipPic;
                            }else if((lastNoteDateMonthDiff == 0)&&(lastNoteDateYearDiff == 0)){
                                if(lastNoteDateDayDiff < 0){
                                    //Leave hash.tag alone
                                }else if(lastNoteDateDayDiff > 0){
                                    hash.tag = cautionTag + marquisPic + vipPic;
                                }else if((lastNoteDateMonthDiff == 0)&&(lastNoteDateYearDiff == 0)&&(lastNoteDateDayDiff == 0)){
                                    //hash.tag = cautionTag;
                                    hash.tag = justDoItTag + marquisPic + vipPic;
                                }
                            }
                        }
                        
                        //hash.tag = lastNoteDate;
                    }else{
                        //Compare the Case Creation Date with todays date
                        var caseCreatedDate = caseCreatedDateSpaceSplit[0];
                        var caseCreatedDateSplit = caseCreatedDate.split('/');
                        var caseCreatedDateMonth = caseCreatedDateSplit[0];
                        var caseCreatedDateDay = caseCreatedDateSplit[1];
                        var caseCreatedDateYear = caseCreatedDateSplit[2];

                        var caseCreatedDateYearDiff = (todayYear - caseCreatedDateYear);
                        var caseCreatedDateMonthDiff = (todayMonth - caseCreatedDateMonth);
                        var caseCreatedDateDayDiff = (todayDay - caseCreatedDateDay);
                        
                        //hash.tag = caseCreatedDateMonth + '/' + caseCreatedDateDay + '/' + caseCreatedDateYear;
                        
                        if(caseCreatedDateYearDiff < 0){
                            //Leave hash.tag alone                            
                        }else if(caseCreatedDateYearDiff > 0){
                            hash.tag = cautionTag + marquisPic + vipPic;
                        }else if(caseCreatedDateYearDiff == 0){
                            if(caseCreatedDateMonthDiff < 0){
                                //Leave hash.tag alone
                            }else if(caseCreatedDateMonthDiff > 0){
                                hash.tag = cautionTag + marquisPic + vipPic;
                            }else if((caseCreatedDateMonthDiff == 0)&&(caseCreatedDateYearDiff == 0)){
                                if(caseCreatedDateDayDiff < 0){
                                    //Leave hash.tag alone
                                }else if(caseCreatedDateDayDiff > 0){
                                    hash.tag = cautionTag + marquisPic + vipPic;
                                }else if((caseCreatedDateMonthDiff == 0)&&(caseCreatedDateYearDiff == 0)&&(caseCreatedDateDayDiff == 0)){
                                    //hash.tag = cautionTag;
                                    hash.tag = justDoItTag + marquisPic + vipPic;
                                }
                            }
                        }
                    }
                }
            //}
            
                          
            //Add the row to the portlet dataset and repeat.
            portlet.addRow(hash);
        }
    }
}


function upcomingEventsPortlet(portlet, column){

    // figure out date four weeks from now
    var theDate = new Date();
    
    //theDate.setMonth(theDate.getMonth() + 2);
    theDate.setDate(theDate.getDate() + 45);
    theDate = nlapiDateToString(theDate);
    
    // perform the search
    var searchResults = null;
    var filters = new Array();
    var columns = new Array();
    
    filters[0] = new nlobjSearchFilter('status', null, 'anyof', ['TENTATIVE', 'CONFIRMED']);
    filters[1] = new nlobjSearchFilter('startdate', null, 'onorbefore', theDate);
    
    columns[0] = new nlobjSearchColumn('startdate', null, null);
    columns[1] = new nlobjSearchColumn('company', null, null);
    columns[2] = new nlobjSearchColumn('status', null, null);
    columns[3] = new nlobjSearchColumn('custevent28', null, null); // Escrow Account
    columns[4] = new nlobjSearchColumn('custevent27', null, null); // Escrow Activity
    columns[5] = new nlobjSearchColumn('custevent29', null, null); // Release Pct
    columns[6] = new nlobjSearchColumn('custevent30', null, null); // Comments
    columns[7] = new nlobjSearchColumn('title', null, null); // Title
    columns[8] = new nlobjSearchColumn('resource', null, null); // Resource
    searchResults = nlapiSearchRecord('calendarevent', null, filters, columns); // set search results
    // setup the display
    portlet.setTitle('Upcoming Deal Events');
    
    portlet.addColumn('startdate', 'date', 'Date', 'CENTER');
    var customer = portlet.addColumn('company', 'text', 'Deal', 'LEFT'); // date the opportunity was opened
    customer.setURL(nlapiResolveURL('RECORD', 'calendarevent'));
    customer.addParamToURL('id', 'id', true);
    
    portlet.addColumn('escrowactivity', 'text', 'Title', 'LEFT');
    portlet.addColumn('comments', 'text', 'Comments', 'LEFT');
    portlet.addColumn('cust_mark', 'text', 'Mark', 'LEFT');
    
    for (var i = 0; searchResults != null && i < searchResults.length; i++) // setup view url
    {
        var result = searchResults[i];
        
        var com = result.getText('company', null, null);
        var rsc = result.getValue('resource', null, null);
        nlapiLogExecution("DEBUG", "SRSPortlets.upcomingEventsPortlet", "Resource:" + rsc);
        if (rsc != '2' && (com == null || com.length == 0)) 
            continue;
        
        var hash = new Array();
        hash.id = result.getId();
        hash.company = com;
        hash.startdate = result.getValue('startdate');
        hash.escrowactivity = result.getText('custevent27');
        hash.custtitle = result.getText('title');
        
        var status = result.getText('status');
        var escrowAcct = result.getText('custevent28');
        var releasePct = result.getValue('custevent29');
        
        var printComments = result.getValue('custevent30');
        if (printComments.length == 0) 
            printComments = 'No comments entered.';
        var fullComments = printComments;
        if (printComments.length > 80) 
            printComments = printComments.substring(0, 80) + "...";
        
        if (escrowAcct != null && escrowAcct.length > 0) 
            fullComments = fullComments + '\nEscrow Account: ' + escrowAcct;
        if (releasePct != null && releasePct.length > 0) 
            fullComments = fullComments + '\nRelease Pct: ' + releasePct;
        
        // add title text here to the comments...
        hash.comments = '<a title=\"' + fullComments + '\">' + printComments + '</a>';
        
        var viewUrl = "https://system.netsuite.com" + nlapiResolveURL('SUITELET', 'customscript_handle_event_action', 'customdeploy_handle_event_action_deploy'); // display the view link
        // add eventId to the URl
        viewUrl = viewUrl + '&eventId=' + hash.id;
        hash.cust_mark = '<a href=\"' + viewUrl + '\" target=\"server_commands\">Complete</a>';
        
        portlet.addRow(hash);
    }
}

function handleEventActions(request, response){
    // handle closure of event
    var eventId = request.getParameter('eventId');
    nlapiLogExecution("DEBUG", "SRSPortlets.handleEventActions", "EventId:" + eventId);
    
    // mark the event complete...
    nlapiSubmitField("calendarevent", eventId, "status", "COMPLETE");
}

function getnumber(id){
    var ret;
    ret = parseFloat(id);
    if (isNaN(ret)) {
        ret = 0;
    }
    return ret;
    
} // getnumber

function testPortletSavedSearchResults(){
    var results, columns, value, i, j;
    var column_names = [], column_joins = [], column_labels = [];
    
    portlet.setTitle('Test Saved Search Results');
    portlet.writeLine('Begin testPortletSavedSearchResults', null, 0);
    try {
        results = nlapiSearchRecord('opportunity', 'customsearch_srs_active_opp_portlet', null, null);
        portlet.writeLine('Results: ' + results.length, null, 0);
        
        if (results.length) {
            // get an array of the column names & joins
            columns = results[0].getAllColumns();
            if (columns.length) {
                portlet.writeLine('Columns: ' + columns.length, null, 0);
                
                // extract the names and joins into convenient data structures
                for (j = 0; columns != null && j < columns.length; j++) {
                    column_names[j] = columns[j].getName();
                    column_joins[j] = columns[j].getJoin();
                    column_labels[j] = columns[j].getLabel();
                }
            }
            
            // iterate over the results
            for (i = 0; results != null && i < results.length; i++) {
                for (j = 0; columns != null && j < columns.length; j++) {
                    value = results[i].getValue(column_names[j], column_joins[j]);
                    select_text = results[i].getText(column_names[j], column_joins[j]);
                    // do something with value and/or text ... e.g.:
                    portlet.writeLine('Row ' + i + ': Column ' + column_names[j] + ': Value: ' + value + ' Label: ' + column_labels[j] + ' Join: ' + column_joins[j], null, 0);
                }
            }
        }
    } 
    catch (err) {
        var err_message = err + (err.getDetails ? ': ' + err.getDetails() : '');
        nlapiLogExecution('ERROR', 'Error in testPortletSavedSearchResults', err_message);
    }
    
    portlet.writeLine('Completed testPortletSavedSearchResults', null, 0);
}

function cleanseHTML(targetString) {
    return targetString.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\'/g, '&#39;');

}

function highlightFields(targetRow) {
    for(targField in targetRow) {
        targetRow[targField] = '<span style="font-weight: bold; background-color: #ffff00;">'+targetRow[targField]+'</span>';
        nlapiLogExecution('DEBUG','SRSPortlets.highlightFields','Updating field: '+targField+' as '+targetRow[targField]);
    }
    return targetRow;
}

//
//isElementPresent:  This just tests to see if an element exists in an array already.
//                      Really this belongs in a generic utility library, but I don't have one now so that's a TODO
//
function isElementPresent(arr, obj) {
    nlapiLogExecution('DEBUG','SRSPortlets.isElementPresent','Starting isElementPresent...');
  for(var ep1 = 0; ep1 < arr.length; ep1++) {
      if (arr[ep1] == obj) {
          return true;
      }
  }
   return false;
}

//
//getColumnsByName:  This routine gets all of the columns in a search and creates a javascript pseudo-associate array based on the column's name.
//                      Really this belongs in a generic utility library, but I don't have one now so that's a TODO
//

function getColumnsByName(searchResult) {
    
    nlapiLogExecution('DEBUG','SRSProjectDashboards.getColumnsByName','Starting getColumnsByName...');
    
    if(searchResult == null || searchResult == undefined) {
        return null;
    }
    
    var returnArray = new Object();
    
    var sampleResult = searchResult[0];
    var columns = sampleResult.getAllColumns();
    
    for(var cbn = 0; cbn < columns.length; cbn++) {
        var testCol = columns[cbn];
        
        if(testCol.getLabel() != null && testCol.getLabel() != undefined && testCol.getLabel() != '') {
            returnArray[testCol.getLabel()] = testCol;
            nlapiLogExecution('DEBUG','SRSProjectDashboards.getColumnsByName','Setting column by label: '+testCol.getLabel());
        } else {
            returnArray[testCol.getName()] = testCol;
            nlapiLogExecution('DEBUG','SRSProjectDashboards.getColumnsByName','Setting column by name: '+testCol.getName());
        }
    }
    
    return returnArray;
    
}