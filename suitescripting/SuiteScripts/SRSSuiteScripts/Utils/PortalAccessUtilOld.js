/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />

var PORTAL_ACCESS_LOGIN = 17890;
var PORTAL_ACCESS_TEMPORARY_PASSWORD = 17889;

var PORTAL_ACCESS_INCORRECT_ANSWER_FIRST_ATTEMP = 26580;
var PORTAL_ACCESS_INCORRECT_ANSWER_SECOND_ATTEMP = 26582;
var PORTAL_ACCESS_INCORRECT_ANSWER_THIRD_ATTEMP = 26581;
//var PORTAL_ACCESS_INCORRECT_ANSWER_FIRST_ATTEMP = 26531;
//var PORTAL_ACCESS_INCORRECT_ANSWER_SECOND_ATTEMP = 26532;
//var PORTAL_ACCESS_INCORRECT_ANSWER_THIRD_ATTEMP = 26533;

/**
 * @author durbano
 */
function renderSearch(request)
{
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    
    var html = '';
    html += '<form name="contactSearch" action="' + portletUrl + '" method="get">';
    html += '<table>';
    html += '  <tr><th>Contact Email Address</th><td><input name="contactemail" type="text"/></td></tr>';
    html += '  <tr><td colspan="2"><input name="Search" type="submit"/></td></tr>';
    html += '  <tr><td><input type="hidden" name="script" value="81"/><input type="hidden" name="deploy" value="1"/><input type="hidden" name="page" value="searchResults"/></td></tr>'
    html += '</table>';
    html += '</form>';
    return html;
}

function getShareholderDataAccess(contact)
{
    var filters = new Array();
        filters.push(new nlobjSearchFilter('custrecord_user', null, 'is', contact.internalid));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        filters.push(new nlobjSearchFilter('custrecord_toplevelparent', null, 'is', contact.toplevelParent));
    var columns = [new nlobjSearchColumn('internalid',null,null)];
    var results = nlapiSearchRecord('customrecord_shareholder_data_access',null, filters, columns);            // escrow transactions
    
    if(results == null || results.length == 0) return null;
    if(results.length > 1) throw 'MULTIPLE_REPORT_RECORDS_FOUND';
    
    var id = results[0].getValue('internalid');
    return nlapiLoadRecord('customrecord_shareholder_data_access',id);
}

function getOrCreateShareholderDataAccess(contact,createRecord)
{
    var record = getShareholderDataAccess(contact);
    if(record != null) return record;
    
    // make sure we do not have an issue with an unset toplevelparent
    var filters = [new nlobjSearchFilter('custrecord_user', null, 'is', contact.internalid)];
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        filters.push(new nlobjSearchFilter('custrecord_toplevelparent', null, 'is', '@NONE@'));
    var columns = [new nlobjSearchColumn('internalid',null,null)];
    var results = nlapiSearchRecord('customrecord_shareholder_data_access',null, filters, columns);

    if(results == null && createRecord)
    {
        // create a record and set up properly
        record = nlapiCreateRecord('customrecord_shareholder_data_access');
        record.setFieldValue('custrecord_user',contact.internalid);
        record.setFieldValue('custrecord_toplevelparent',contact.toplevelParent);
        nlapiSubmitRecord(record);
        return getShareholderDataAccess(contact);
    }
    else if(results == null)
    {
        return null;
    }
    else if(results.length > 0)
    {
        // make the second, or greater records inactive
        for(var i = 1; i < results.length; i++)
        {
            tmpRecord = nlapiLoadRecord('customrecord_shareholder_data_access',results[i].getValue('internalid'));
            tmpRecord.setFieldValue('isinactive','T');
            nlapiSubmitRecord(tmpRecord);
        }
        
        // load the record
        record = nlapiLoadRecord('customrecord_shareholder_data_access',results[0].getValue('internalid'));
    }

    if(record.getFieldValue('custrecord_toplevelparent') == null)    // make sure the top level parent element is set properly
    {
        record.setFieldValue('custrecord_toplevelparent',contact.toplevelParent);
        nlapiSubmitRecord(record);
        return getShareholderDataAccess(contact);
    }

    return record;
}

function getAllShareholderDataAccessRecords(contact)
{
    var filters = new Array();
    filters.push(new nlobjSearchFilter('custrecord_user', null, 'is', contact.internalid));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    var columns = [new nlobjSearchColumn('internalid',null,null)];

    var results = nlapiSearchRecord('customrecord_shareholder_data_access',null, filters, columns);            // escrow transactions
    if(results == null || results.length == 0) return null;
    
    var records = new Array();
    for(var i = 0; i < results.length; i++)
        records.push(results[i].getValue('internalid'));
    return records;
}

function getFirstContact(email)
{
    var filters = [new nlobjSearchFilter('email', null, 'is', email)];
    var columns = new Array();
    columns[0] = new nlobjSearchColumn('entityid');
    columns[1] = new nlobjSearchColumn('internalid');
    var searchResults = nlapiSearchRecord('contact',null, filters, columns);

    if(searchResults == null || searchResults.length == 0) throw 'NO_CONTACT_FOUND';
    var result = searchResults[0];
    
    return {'internalid':result.getValue('internalid'),'name':result.getValue('entityid'),'email':email};
}

function getRootContact(email)
{
    if(email == null || email.lenth == 0) return null;
    
    var filters = [new nlobjSearchFilter('email', null, 'is', email)];
    var columns = new Array();
    columns[0] = new nlobjSearchColumn('entityid');
    columns[1] = new nlobjSearchColumn('internalid');
    columns[2] = new nlobjSearchColumn('giveaccess');
    columns[3] = new nlobjSearchColumn('custentity_initial_password');
    var searchResults = nlapiSearchRecord('contact',null, filters, columns);

    if(searchResults == null || searchResults.length == 0) throw 'NO_CONTACT_FOUND';
    if(searchResults.length > 1) throw 'DUPLICATE_CONTACTS_FOUND';
    
    var result = searchResults[0];
    
    var isHasChangedPassword = hasChangedPassword(email);
    if(isHasChangedPassword == null) isHasChangedPassword = false;
    
    return {
         'internalid':result.getValue('internalid')
        ,'name':result.getValue('entityid')
        ,'email':email
        ,'hasaccess':result.getValue('giveaccess')
        ,'initialpassword':result.getValue('custentity_initial_password')
        ,'hasChangedPassword':isHasChangedPassword
    };
}

function getContacts(parentId)
{
    if(parentId == null || parentId.lenth == 0) return null;
    
    var filters = [new nlobjSearchFilter('company', null, 'is', parentId)];
    var columns = new Array();
    columns[0] = new nlobjSearchColumn('entityid');
    columns[1] = new nlobjSearchColumn('internalid');
    columns[2] = new nlobjSearchColumn('giveaccess');
    columns[3] = new nlobjSearchColumn('email');
    columns[4] = new nlobjSearchColumn('firstname');
    columns[5] = new nlobjSearchColumn('lastname');
    var searchResults = nlapiSearchRecord('contact',null, filters, columns);

    if(searchResults == null || searchResults.length == 0) throw 'NO_CONTACTS_FOUND';

    var contacts = new Array();
    for(var i = 0; i < searchResults.length; i++)
    {
        var result = searchResults[i];
        
        var contact = {
             'internalid':result.getValue('internalid')
            ,'name':result.getValue('entityid')
            ,'firstname':result.getValue('firstname')
            ,'lastname':result.getValue('lastname')
            ,'email':result.getValue('email')
        };
        contacts.push(contact);
    }
    return contacts;
}

function hasChangedPassword(email)
{
    if(email == null || email.lenth == 0) return null;
    
    var filters = new Array();
        filters.push(new nlobjSearchFilter('custrecord_user_changed_pwd_email', null, 'is', email));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 

    var columns = [new nlobjSearchColumn('custrecord_user_changed_pwd_email')];
    
    var searchResults = nlapiSearchRecord('customrecord_users_changed_password',null, filters, columns);
    
    if(searchResults == null || searchResults.length == 0) return false;
    
    return true;
}

function inactivateChangedPassword(email)
{
    if(email == null || email.lenth == 0) return;
    
    var filters = new Array();
        filters.push(new nlobjSearchFilter('custrecord_user_changed_pwd_email', null, 'is', email));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 
    var columns = [new nlobjSearchColumn('internalid')];
    
    var searchResults = nlapiSearchRecord('customrecord_users_changed_password',null, filters, columns);
    
    if(searchResults == null || searchResults.length == 0) return;
    
    for(var i = 0; i < searchResults.length; i++)
    {
        var result = searchResults[i];
        var id = result.getValue('internalid');
        
        var record = nlapiLoadRecord('customrecord_users_changed_password',id)
        record.setFieldValue('isinactive','T');
        nlapiSubmitRecord(record,false,true);
    }
}

function getSecondLevelContact(contact,parent)
{
    // load top-level parent
    contact.allTopLevelParents = getTopLevelParents(contact);
    if(contact.allTopLevelParents == null || contact.allTopLevelParents.length == 0)
        throw 'NO_ASSOCIATED_PARENT';
    
    contact.toplevelParent == null;
    if(parent != null)
    {
        contact.toplevelParent = parent;
        contact.toplevelParentName = nlapiLoadRecord('customer',contact.toplevelParent).getFieldValue('entityid');
    }
    else if(contact.allTopLevelParents != null && contact.allTopLevelParents.length == 1)
    {
        contact.toplevelParent = contact.allTopLevelParents[0];
        contact.toplevelParentName = nlapiLoadRecord('customer',contact.toplevelParent).getFieldValue('entityid');
    }

    return contact;
}

function loadContact(email,parent)
{
    nlapiLogExecution("DEBUG", "loadContact", "email = " + email);
    var contact = getRootContact(email);
        contact = getSecondLevelContact(contact,parent);
    
    nlapiLogExecution("DEBUG", "loadContact", "toplevelParent = " + contact.toplevelParent);
    if(!contact.toplevelParent || contact.toplevelParent == null) return contact;
    
    nlapiLogExecution("DEBUG", "loadContact", "geting shareholder data access record");

    contact.report = getShareholderDataAccess(contact);

    nlapiLogExecution("DEBUG", "loadContact", "shareholder data access id = " + contact.report.getId());
    
    // get viewable and nonviewable deals and shareholders
    contact.viewableDeals = getViewableDeals(contact);
    contact.nonviewableDeals = getNonViewableDeals(contact,contact.viewableDeals);
    contact.viewableShareholders = getViewableShareholders(contact);
    contact.nonviewableShareholders = getNonViewableShareholders(contact,contact.viewableShareholders);

    return contact;
}

function render(request,response)
{
     var email = request.getParameter('contactemail');
    var parent = request.getParameter('contactparent');
    
    try
    {
        var contact = loadContact(email,parent);
        var content = '';
        if(!contact.toplevelParent || contact.toplevelParent == null)
            content = renderMultiParent(contact);                        // multiple parents found, but none selected
        else
            content = renderContact(contact);                            // 

        response.write(content);
        return;
    }
    catch(error)
    {
        if(error == 'NO_CONTACT_FOUND')
        {
            response.write('No results found for email address ' + email);
            return;
        }
        else if(error == 'DUPLICATE_CONTACTS_FOUND')
        {
            var firstContact = getFirstContact(email);
            var duplicateUrl = nlapiResolveURL('TASKLINK','LIST_DUPLICATES') + '&type=contact&id=' + firstContact.internalid;
            
            var content = 'Duplicate contact records found for email ' + firstContact.email + '.<br/>';
            content += '<a href="'+ duplicateUrl +'" target="_top">Merge duplicate records</a>. Access to the portal will not work until merge is complete.'
            
            response.write(content);
            return;
        }
        else if(error == 'NO_ASSOCIATED_PARENT')
        {
            response.write('Contact is not associated with any entity - shareholder nor investor group.');
            return;
        }
        else if(error == 'MULTIPLE_REPORT_RECORDS_FOUND')
        {
            contact = getRootContact(email);
            contact = getSecondLevelContact(contact,parent);
            
            /*var suitletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
                suitletUrl += '&page=emailReportAccess&contactemail=' + contact.email;
            if(contact.toplevelParent != null)    suitletUrl += '&contactparent=' + contact.toplevelParent;*/
            //response.write(createLinkAlt(suitletUrl,'forceSync','(Force Sync)',contact,null,null));

            response.write('Multiple Shareholder Data Access Records Found. Inactivate one or more shareholder data access records.<br/>');

            var contactUrl = nlapiResolveURL('RECORD','contact',contact.internalid,'VIEW');
            var contactLink = createLinkAlt(contactUrl,null,contact.name,null,null,'_top');
            
            response.write('View contact record - ' + contactLink);
            
            return;
        }
        
        throw error;
    }    
}

function renderMultiParent(contact)
{
    var suitletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    suitletUrl += '&page=searchResults&contactemail=' + contact.email + '&contactparent=';
    
    var html = '<table class="innerViewable"><tr><th>Contact</th><th></th><th>Parent Entity</th></tr>';
    for(var i = 0; i < contact.allTopLevelParents.length; i++)                                        // loop through each parent and display
    {
        var parentId = contact.allTopLevelParents[i];
        var parent = nlapiLoadRecord('customer',parentId);
        var link = '<a href="' + suitletUrl + parentId + '">' + parent.getFieldValue('entityid') + '</a>';
        
        html += '<tr><td class="innerViewable">' + contact.name + '</td><td>&nbsp; &nbsp;</td>';
        html += '<td class="innerViewable">' + link + '</td></tr>';
    }
    html += '</table>';
    
    return html;
}

function renderContact(contact)
{
    var suitletUrl  = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
        suitletUrl += '&page=addRemoveContact&contactemail=' + contact.email;
    
    if(contact.toplevelParent != null)
    {
        suitletUrl += '&contactparent=' + contact.toplevelParent;
    }
    
    var html = '';    // include css reference here
    
    // NOTE that this function builds the html out of order
    // sub table
    html += '<table class="outerDealShareholder">';                                                                        // outer table
    html += '<tr valign="top">';                                                              // outer table single row
    
    // get list of viewable deals
    html += '  <td>';                                                                         // viewable deals column
    html += '<table class="innerViewable"><tr><th colspan="2" class="innerViewable">Viewable Deals</th></tr>';                          // viewable deals inner table
    html += '<tr><th class="innerViewable">Name</th><th class="innerViewable">Action</th></tr>';
    
    for(var i = 0; i < contact.viewableDeals.length; i ++)
    {
        var dealLink = createLink(suitletUrl + '&srs_type=deal','Remove',contact,contact.viewableDeals[i]);
        html += '<tr><td class="innerViewable">' + contact.viewableDeals[i].name + '</td>';
        html += '<td class="innerViewable">' + dealLink + '</td></tr>';
    }
    if(contact.viewableDeals.length == 0)
    {
        html += '<tr><td class="innerViewable" colspan="2"><b><font color="red">NO DEALS ACCESSIBLE</font></b></td></tr>';
    }
    html += '  </table></td>';                                                                 // close of viewable deals column and inner table
    
    // get list of non-viewable deals
    html += '  <td>';                                                                         // non-viewable deals column
    html += '<table class="innerNonViewable"><tr><th colspan="2" class="innerNonViewable">Non-Viewable Deals</th></tr>';                      // non-viewable deals inner table
    html += '<tr><th class="innerNonViewable">Name</th><th class="innerNonViewable">Action</th></tr>';

    for(var i = 0; i < contact.nonviewableDeals.length; i ++)
    {
        var dealLink = createLink(suitletUrl + '&srs_type=deal','Add',contact,contact.nonviewableDeals[i]);
        html += '<tr><td class="innerNonViewable">' + contact.nonviewableDeals[i].name + '</td>';
        html += '<td class="innerNonViewable">' + dealLink + '</td></tr>';
    }
    html += '  </table></td>';                                                                 // close of non-viewable deals column and inner table
    
    // get list of viewable shareholders
    html += '  <td>';                                                                         // viewable shareholders column
    html += '<table class="innerViewable"><tr><th colspan="2" class="innerViewable">Viewable Shareholders</th></tr>';                      // viewable shareholders inner table
    html += '<tr><th class="innerViewable">Name</th><th class="innerViewable">Action</th></tr>';

    for(var i = 0; i < contact.viewableShareholders.length; i ++)
    {
        var shareholderLink = createLink(suitletUrl + '&srs_type=shareholder','Remove',contact,contact.viewableShareholders[i]);
        html += '<tr><td class="innerViewable">' + contact.viewableShareholders[i].name + '</td>';
        html += '<td class="innerViewable">' + shareholderLink + '</td></tr>';
    }
    if(contact.viewableShareholders.length == 0)
    {
        html += '<tr><td class="innerViewable" colspan="2"><b><font color="red">NO SHAREHOLDERS ACCESSIBLE</font></b></td></tr>';
    }
    html += '  </table></td>';                                                                 // close of viewable shareholders column and inner table
    
    // get list of non-viewable shareholders
    html += '  <td>';                                                                         // non-viewable shareholders column
    html += '<table class="innerNonViewable"><tr><th colspan="2" class="innerNonViewable">Non-Viewable Shareholders</th></tr>';                  // non-viewable shareholders inner table
    html += '<tr><th class="innerNonViewable">Name</th><th class="innerNonViewable">Action</th></tr>';

    for(var i = 0; i < contact.nonviewableShareholders.length; i ++)
    {
        var shareholderLink = createLink(suitletUrl + '&srs_type=shareholder','Add',contact,contact.nonviewableShareholders[i]);
        html += '<tr><td class="innerNonViewable">' + contact.nonviewableShareholders[i].name + '</td>';
        html += '<td class="innerNonViewable">' + shareholderLink + '</td></tr>';
    }
    html += '  </table></td>';                                                                 // close of non-viewable shareholders column and inner table

    // close out the table    
    html += '  </tr>';   // close of outer table single row
    html += '</table>';  // close of outer table
    
    var contactUrl = nlapiResolveURL('RECORD','contact',contact.internalid,'VIEW');
    var contactLink = createLinkAlt(contactUrl,null,contact.name,null,null,'_top');
    
    if(!contact.toplevelParent || contact.toplevelParent == null)
    {
        return 'Problem with contact. Multiple parent entities found.';
    }
    var customerUrl = nlapiResolveURL('RECORD','customer',contact.toplevelParent,'VIEW');
    var customerLink = createLinkAlt(customerUrl,null,contact.toplevelParentName,null,null,'_top');

    var customerEditUrl = nlapiResolveURL('RECORD','customer',contact.toplevelParent,'EDIT');
    var addRemoveAccessLink = '';
    if(contact.viewableDeals.length != 0 && contact.viewableShareholders.length != 0)
    {
        addRemoveAccessLink = (contact.hasaccess == 'T' ? 
                createLinkAlt(customerEditUrl,'REMOVE_ACCESS','(Remove Access)',contact,null,'_top') : 
                createLinkAlt(customerEditUrl,'ADD_ACCESS','(Add Access)',contact,null,'_top'));
    }

    var accessToAllParentContacts = createLinkAlt(customerEditUrl,'ADD_ACCESS_TO_ALL','(Give Access to All)',contact,null,'_top');
    
    // put the page together
    var tophtml = '<html>\n<head>\n<LINK REL=StyleSheet HREF="https://system.netsuite.com/core/media/media.nl?id=16339&c=772390&h=8cf1ac9e2791667ea641&_xt=.css"/>\n</head>\n<body>';
    tophtml += '<table class="contact">';
    tophtml += '  <tr><th align="right" class="contact">Name:</th><td class="contact">' + contactLink + '</td>ONLINE_REG_RECORDS</tr>';
    //tophtml += '  <tr><th align="right" class="contact">Parent:</th><td class="contact">' + customerLink + accessToAllParentContacts + '</td></tr>';
    tophtml += '  <tr><th align="right" class="contact">Parent:</th><td class="contact">' + customerLink + '</td></tr>';
    tophtml += '  <tr><th align="right" class="contact">Email:</th><td class="contact">' + contact.email + '</td></tr>';
    tophtml += '  <tr><th align="right" class="contact">Has Portal Access:</th><td class="contact">' + contact.hasaccess;
    tophtml += ' ' + addRemoveAccessLink + '</td></tr>';

    if(contact.initialpassword && contact.initialpassword != null && contact.hasaccess == 'T')
    {
        tophtml += '  <tr><th align="right" class="contact">Initial Password:</th><td class="contact">' + contact.initialpassword + '</td></tr>';
        tophtml += '  <tr><th align="right" class="contact">Password Emails:</th><td class="contact">'
        
        var action = request.getParameter('srs_action');
        if(contact.hasChangedPassword)
            tophtml += '<a href="' + suitletUrl + '&srs_action=SEND_PASSWORD_EMAILS">Send Login and Password Emails</a>'
        else
            tophtml += '<a href="' + suitletUrl + '&srs_action=FORCE_NEW_PASS_SEND_PASSWORD_EMAILS">Already logged in at least once. Send Login and Password Emails</a>';

        if(action != null) tophtml += ' | Password Emails Sent';
        tophtml += '</td></tr>';    
    }

    if(contact.report && contact.report != null)
    {
        var doNotReceiveStmts = contact.report.getFieldValue('custrecord_receive_no_statements');
        var sdaInternalId = contact.report.getId();
        nlapiLogExecution("DEBUG", "renderContact", "shareholder data access id = " + contact.report.getId());
        
        tophtml += '  <tr><th align="right" class="contact">Receive Statements:</th><td class="contact">';
        
        if(doNotReceiveStmts && doNotReceiveStmts == 'T')
            tophtml += '<a href="' + suitletUrl + '&sdaInternalId=' + sdaInternalId + '&srs_action=RECEIVE_STMTS_SET_TO_YES">No</a>';
        else
            tophtml += '<a href="' + suitletUrl + '&sdaInternalId=' + sdaInternalId + '&srs_action=RECEIVE_STMTS_SET_TO_NO">Yes</a>';
        tophtml += '</td></tr>';
    }
    
    tophtml += '  <tr><th align="right" class="contact">Email reports in-sync</th><td class="contact">';
    tophtml += renderEmailReportSync(contact) + '</td></tr>';
    
    tophtml += '</table>';
    
    // close out the page
    html += '\n</body>\n</html>';
    
    // search for online registrations. If any exist, replace '@ONLINE_REG_RECORDS@' with list of text
    var filters = new Array();
    var columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord28',null,'is',contact.email));
    
    columns.push(new nlobjSearchColumn('internalid',null,null));
    columns.push(new nlobjSearchColumn('created',null,null));
    columns.push(new nlobjSearchColumn('custrecord18',null,null));    // deal
    columns.push(new nlobjSearchColumn('custrecord_temp_deal_name',null,null));    // temp deal
    columns.push(new nlobjSearchColumn('custrecord58',null,null));    // temp shareholder
    columns.push(new nlobjSearchColumn('custrecord17',null,null));    // shareholder
    columns.push(new nlobjSearchColumn('custrecord_registration_status',null,null));
    columns.push(new nlobjSearchColumn('isinactive',null,null));
    
    var results = nlapiSearchRecord('customrecord13',null, filters, columns);
    if(results == null || results.length == 0) return tophtml.replace(/ONLINE_REG_RECORDS/g,'') + html;
    
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var pendingRegUrl = portletUrl + '&page=pendingRegistration&registrationid=';

    var replacementHtml = '<td rowspan="8" valign="top"><table class="outerDealShareholder"><tr><th>Id</th><th>Date Created</th><th>Deal</th><th>Shareholder</th><th>Status</th><th>Active/Inactive</th></tr>';
    for(var i = 0; i < results.length; i++)
    {
        var result = results[i];
        var registrationid = result.getValue('internalid');

        replacementHtml += '<tr><td>';
        replacementHtml += '<a href="' + pendingRegUrl + registrationid + '">' + registrationid + '</a></td>';        // Online Registration id
        replacementHtml += '<td>' + result.getValue('created') + '</td>';
        
        var deal = result.getText('custrecord18');
        if(deal == null || deal.length == 0) deal = result.getValue('custrecord_temp_deal_name');
        replacementHtml += '<td>' + deal + '</td>';

        var shareholder = result.getText('custrecord17');
        if(shareholder == null || shareholder.length == 0) shareholder = result.getValue('custrecord58');
        replacementHtml += '<td>' + shareholder + '</td>';
        replacementHtml += '<td>' + result.getText('custrecord_registration_status') + '</td>';
        
        var isInactive = result.getValue('isinactive');
        if(isInactive == 'T')    isInactive = "Inactive";
        else                    isInactive = "Active";
        replacementHtml += '<td>' + isInactive + '</td>';
        
        replacementHtml += '</tr>';
    }
    replacementHtml += '</table></td>';
    
    tophtml = tophtml.replace(/ONLINE_REG_RECORDS/g,replacementHtml);    

    return tophtml + html;
}

function sendPasswordEmails(request,inactiveOldPassword)
{
     var email = request.getParameter('contactemail');
    var parent = request.getParameter('contactparent');

    if(inactiveOldPassword)
    {
        inactivateChangedPassword(email);
    }

    var contact = loadContact(email,parent);
    
    // get both templates
    var loginFile = nlapiLoadFile(PORTAL_ACCESS_LOGIN).getValue();
    var pwdFile   = nlapiLoadFile(PORTAL_ACCESS_TEMPORARY_PASSWORD).getValue();
    
    // replace email and password token
    loginFile = loginFile.replace(/SHAREHOLDER_EMAIL/g,contact.email);
    pwdFile      = pwdFile.replace(/PASSWORD/g,contact.initialpassword);

    var records = new Object();
        records['entity'] = contact.internalid;
    
    // send emails (one for login information and second with the password information)
    var from = 21345;    // support employee
    var subj = 'SRS ComPort(TM) Login';
    
    nlapiSendEmail(from,email,subj,loginFile,null,null,records,null);
    nlapiSendEmail(from,email,subj,pwdFile,null,null,records,null);
}


function sendRequestForCorrectSecurityAnswersEmail(regId, FILE_ID)
{
    nlapiLogExecution("DEBUG", "sendRequestForCorrectSecurityAnswersEmail", "regId = " + regId);
    var rcd = nlapiLoadRecord('customrecord13',regId);
    
    var sId = rcd.getFieldValue('custrecord17');        // shareholder id
    var eId = rcd.getFieldValue('custrecord18');        // escrow id
    var eml = rcd.getFieldValue('custrecord28');        // email
    
    var sQuestion = 'Shares Held at Close';
    var sAnswer = rcd.getFieldValue('custrecord_shares_at_closing');
    if(sAnswer == null || sAnswer.length == 0)
    {
        sQuestion = 'Cash received at Close:';
        sAnswer = rcd.getFieldValue('custrecord_cash_paid_at_closing');
    }
    
    nlapiLogExecution("DEBUG", "sendRequestForCorrectSecurityAnswersEmail", "sId = " + sId);
    nlapiLogExecution("DEBUG", "sendRequestForCorrectSecurityAnswersEmail", "eId = " + eId);
    nlapiLogExecution("DEBUG", "sendRequestForCorrectSecurityAnswersEmail", "eml = " + eml);

    var records = new Object();
        records['entity'] = sId;
    
    var from = 21345;    // support employee
    //if(eId != null && eId.length > 0) from = eId;    // we prefer to send the email from the deal email address
    var subj = 'SRS ComPort(TM) Login: Answer to Security Question';
    
    var responseFile = nlapiLoadFile(FILE_ID).getValue();
    responseFile = responseFile.replace(/SECURITY_ACCESS_QUESTION/g,sQuestion).replace(/SECURITY_ACCESS_ANSWER/g,sAnswer);
    responseFile = responseFile.replace(/OLR_ID/g,regId);
    
    nlapiSendEmail(from,eml,subj,responseFile,null,null,records,null);
    //nlapiSendEmail(from,'durbano@shareholderrep.com',subj,responseFile,null,null,records,null);
    
    var sts = rcd.getFieldValue('custrecord_registration_status');
    nlapiLogExecution("DEBUG", "sendRequestForCorrectSecurityAnswersEmail", "sts = " + sts);
    var nxtSts = getNextStatus(parseInt(sts));

    rcd.setFieldValue('custrecord_registration_status',nxtSts);
    nlapiSubmitRecord(rcd,true,false);        
}

// 4 = Dormant
// 5 = First Request For Security Answers Made
// 6 = Second Request For Security Answers Made
// 7 = Final Request For Security Answers Made
function getNextStatus(statusId)
{
    if(statusId == null || statusId.length == 0) return -1;
    
    switch(statusId)
    {
        case 5: return 6;    // First Request, changed to Second Request Made
        case 6: return 7;    // Second Request, changed to Final Request Made
        case 7: return 4;    // Final Request, changed to Dormant status
        case 4:    return 4;    // I don't think this will happen, but...
        default: return 5;
    }
    return -1;    // shouldn't make it here, but if we do, fail gently...
}

function renderContactInfo(request)
{
    return 'renderContactInfo function';
}

function renderErrors(request)
{
    return 'renderErrors function';
}

function renderDuplicate(request)
{
    var filters = new Array();
    filters[0] = new nlobjSearchFilter('hasduplicates', null, 'is', 'T');
    filters[1] = new nlobjSearchFilter('giveaccess', null, 'is', 'T');
    filters[2] = new nlobjSearchFilter('email', null, 'isnotempty', null);

    var columns = new Array();
    columns[0] = new nlobjSearchColumn('internalid');
    columns[1] = new nlobjSearchColumn('entityid');
    columns[2] = new nlobjSearchColumn('email');

    var searchResults = nlapiSearchRecord('contact',null, filters, columns);
    
    if(!searchResults || searchResults == null || searchResults.length == 0)
    {
        return 'No duplicates found.';
    }
    
    var duplicateUrl = nlapiResolveURL('TASKLINK','LIST_DUPLICATES') + '&type=contact&id=';

    var html = 'Duplicate contact records found<br/>';
    html += '<table><tr><th>Name</th><th>Email</th><th>Action</th></tr>';
    for(var i = 0; i < searchResults.length; i++)
    {
        var con = searchResults[i];
        html += '<tr><td>' + con.getValue('entityid') + '</td>';
        html += '<td>' + con.getValue('email') + '</td>';
        html += '<td><a href="' + duplicateUrl + con.getValue('internalid') + '" target="_top">Merge</td></tr>';
    }
    html += '</table>';
    
    return html;
}

function getNextRegistrationId(regId)
{
    nlapiLogExecution("DEBUG", "getNextRegistrationId", "regId = " + regId);
    if(regId == null) return null;
    
    var filters = new Array();
    var columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_registration_status',null,'anyof',[1,2]));
    filters.push(new nlobjSearchFilter('internalidnumber',null,'greaterthan', parseInt(regId) ));
    
    columns.push(new nlobjSearchColumn('internalid',null,null));
    columns[0].setSort();    // sort by internalid

    var results = nlapiSearchRecord('customrecord13',null, filters, columns);
    if(results == null || results.length == 0) return null;
    
    var result = results[0];
    return result.getValue('internalid');
}

function renderPendingRegistrations(request)
{
    return renderPendingList(request,[1,2]);
}

function renderPendingIdConfirm(request)
{
    return renderPendingList(request,[5,6,7]);
}

function renderShareholderResponse(request)
{
    return renderPendingList(request,[8]);
}

function renderPendingList(request,statusList)
{
    var filters = new Array();
    var columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_registration_status',null,'anyof',statusList));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
    columns.push(new nlobjSearchColumn('internalid',null,null));
    columns.push(new nlobjSearchColumn('custrecord18',null,null));    // deal
    columns.push(new nlobjSearchColumn('custrecord_temp_deal_name',null,null));    // temp deal
    columns.push(new nlobjSearchColumn('custrecord58',null,null));    // temp shareholder
    columns.push(new nlobjSearchColumn('custrecord17',null,null));    // shareholder
    columns.push(new nlobjSearchColumn('custrecord28',null,null));    // email
    columns.push(new nlobjSearchColumn('custrecord_registration_status',null,null));
    columns.push(new nlobjSearchColumn('created',null,null));
    
    var results = nlapiSearchRecord('customrecord13',null, filters, columns);
    if(results == null || results.length == 0) return 'No Pending Registrations Found';
    
    var list = nlapiCreateList('Portal Access Util',true);
    list.addColumn('number','text','OLR ID','LEFT');
    list.addColumn('created','text','Date Created','LEFT');
    list.addColumn('deal','text','Deal','LEFT');
    list.addColumn('shareholder','text','Shareholder','LEFT');
    list.addColumn('email','text','Email','LEFT');
    list.addColumn('status','text','Status','LEFT');
    
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var pendingRegUrl = portletUrl + '&page=pendingRegistration&registrationid=';

    for(var i = 0; i < results.length; i++)
    {
        var result = results[i];
        var registrationid = result.getValue('internalid');
        
        var hash = new Array();
        hash.created = result.getValue('created');
        hash.number = '<a href="' + pendingRegUrl + registrationid + '">' + registrationid + '</a>';        // Online Registration id
        hash.email = result.getValue('custrecord28');
        hash.status = result.getText('custrecord_registration_status');

        hash.shareholder = result.getText('custrecord17');
        if(hash.shareholder == null || hash.shareholder.length == 0) hash.shareholder = result.getValue('custrecord58');
        
        hash.deal = result.getText('custrecord18');
        if(hash.deal == null || hash.deal.length == 0) hash.deal = result.getValue('custrecord_temp_deal_name');
        
        list.addRow(hash);
    }
    return list;
}

function approveRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if (regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var rcd = nlapiLoadRecord('customrecord13',regId);
    
    var currentUserId = nlapiGetContext().getUser();
    
    rcd.setFieldValue('custrecord34','T');
    rcd.setFieldValue('custrecord35',currentUserId);
    rcd.setFieldValue('custrecord_registration_status','2');
    nlapiSubmitRecord(rcd,true,false);
}

function completeRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if (regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var rcd = nlapiLoadRecord('customrecord13',regId);
    rcd.setFieldValue('custrecord34','T');
    rcd.setFieldValue('custrecord_registration_status','3');
    nlapiSubmitRecord(rcd,true,false);
}

function ignoreRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if (regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var rcd = nlapiLoadRecord('customrecord13',regId);
    rcd.setFieldValue('custrecord34','F');
    rcd.setFieldValue('custrecord_registration_status','4');
    nlapiSubmitRecord(rcd,true,false);
}

function renderPendingRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if(regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var rcd = nlapiLoadRecord('customrecord13',regId);
    
    var nextRegId = getNextRegistrationId(regId);                // get the next registration id
    if(nextRegId == null) nextRegId = getNextRegistrationId(0);    // get the first one

    var giveIgnoreOption = false;
    var deal = rcd.getFieldText('custrecord18');
    var dealId = null;
    if(deal == null || deal.length == 0)
    {
        giveIgnoreOption = true;
        deal = rcd.getFieldValue('custrecord_temp_deal_name');
        if(deal == null || deal.length == 0)    deal = '';
        else                                    deal += '<a href="' + portletUrl + '&page=matchDealRegistration&registrationid=' + regId + '">(find match)</a>';
    }
    else
    {
        dealId = rcd.getFieldValue('custrecord18');
        deal = '<a href="' + dealId + '">' + deal + '</a>';
    }
    
    var shareholder = rcd.getFieldText('custrecord17');
    var shareholderId = null;
    if(shareholder == null || shareholder.length == 0)
    {
        giveIgnoreOption = true;
        shareholder = rcd.getFieldValue('custrecord58');
        if(shareholder == null || shareholder.length == 0)    shareholder = '';
        else             shareholder += ' <a href="' + portletUrl + '&page=matchShareholderRegistration&registrationid=' + regId + '">(find match)</a>';
    } 
    else
    {
        shareholderId = rcd.getFieldValue('custrecord17');
        shareholder += ' <a href="' + portletUrl + '&page=copyShareholderRegistration&registrationid=' + regId + '">(copy data)</a>';
    }
    
    var email = rcd.getFieldValue('custrecord28');
    if (email == null || email.length == 0)
    {
        email = '';
        //giveIgnoreOption = true;
    }
    var firstName = rcd.getFieldValue('custrecord19');
    var lastName  = rcd.getFieldValue('custrecord20');
    var cashPaid  = rcd.getFieldValue('custrecord_cash_paid_at_closing');
    if(cashPaid == null || cashPaid == '0') cashPaid = '';
    var sharesHeld = rcd.getFieldValue('custrecord_shares_at_closing');
    if(sharesHeld == null || sharesHeld == '0') sharesHeld = '';
    var status   = rcd.getFieldText('custrecord_registration_status');
    var statusId = rcd.getFieldValue('custrecord_registration_status');    // 1 = Pending Review, 2 = Approved, but Password Needed, 3 = Complete
    var termsOfUse = rcd.getFieldValue('custrecord_terms_of_use');
    
    var approved = rcd.getFieldValue('custrecord34');
    var sendRequestForCorrectSecurityAnswersEmail = '';
    if(approved == 'F') // && !giveIgnoreOption)
    {
        var approveRegUrl = portletUrl + '&page=approveRegistration&registrationid=' + regId;
        approved = 'F <a href="' + approveRegUrl + '">(approve)</a>';
        
        var sendRequestForCorrectSecurityAnswersEmailUrl = portletUrl + '&page=sendRequestForCorrectSecurityAnswersEmail&registrationid=' + regId; 
        approved += ' <a href="' + sendRequestForCorrectSecurityAnswersEmailUrl + '">(send Security Question email)</a>';
    }
    if(giveIgnoreOption)
    {
        var ignoreRegUrl = portletUrl + '&page=ignoreRegistration&registrationid=' + regId;
        approved += ' <a href="' + ignoreRegUrl + '">(ignore)</a>';
    }
    
    var accessUrl  = portletUrl + '&page=emailReportAccess&contactemail=';
    var nextRegUrl = portletUrl + '&page=pendingRegistration&registrationid=' + nextRegId;
    var editUrl = nlapiResolveURL('RECORD','customrecord13', regId, 'EDIT');
    
    // display shareholder data as entered
    var html  = '<div style="float: left;"><table cellspacing="2">';
        html += '<tr><th colspan="2">Shareholder Data As Entered ';
        html += '<a href="' + editUrl + '" target="new">(edit)</a> '
        html += '<a href="' + nextRegUrl + '">(Next Record)</a></th></tr>';
        html += '<tr><th align="right">OLR ID:</th><td>' + regId + '</td></tr>';
        html += '<tr><th align="right">Deal:</th><td>' + deal + '</td></tr>';
        html += '<tr><th align="right">Shareholder:</th><td>' + shareholder + '</td></tr>';
        html += '<tr><th align="right">Email:</th><td><a href="' + accessUrl + email + '">' + email + '</a></td></tr>';
        html += '<tr><th align="right">First Name:</th>' + formTableLine(firstName) + '</tr>';
        html += '<tr><th align="right">Last Name:</th>' + formTableLine(lastName) + '</tr>';
        html += '<tr><th align="right">Cash Paid at Closing:</th><td>' + cashPaid + '</td></tr>';
        html += '<tr><th align="right">Shares Held at Closing:</th><td>' + sharesHeld + '</td></tr>';
        html += '<tr><th align="right">Approved:</th><td>' + approved + '</td></tr>';
        html += '<tr><th align="right">Terms of Use accepted:</th><td>' + termsOfUse + '</td></tr>';

    // check to see if the email matches any contacts in NS
    try
    {
        var contact = getRootContact(email);
        
        if(contact)
        {
            html += '<tr><th colspan="1" align="right">Portal Access:</th><td>' + contact.hasaccess + '</td></tr>';
            if(contact.hasaccess == 'T' && (statusId == '1' || statusId == '2'))
            {
                var completeRegUrl = portletUrl + '&page=completeRegistration&registrationid=' + regId;
                status += ' <a href="' + completeRegUrl + '">(complete)</a>';
            }
        }
        else
        {
            html += '<tr><th colspan="1" align="right">Portal Access:</th><td>Unknown</td></tr>';
        }
    }
    catch(e)
    {
        if(e == 'NO_CONTACT_FOUND')
            html += '<tr><th colspan="1" align="right">Portal Access:</th><td>Contact not found</td></tr>';
        else if(e == 'DUPLICATE_CONTACTS_FOUND')
            html += '<tr><th colspan="1" align="right">Portal Access:</th><td>Duplicate contacts found</td></tr>';
        else throw e;
    }

        html += '<tr><th align="right">Status:</th><td>' + status + '</td></tr>';        
        html += '</table></div>';
    
    // display imported shareholder data
        html += '<div style="float: left;"><table cellspacing="2" border="1">';
        html += '<tr><th colspan="5">Shareholder Data As Imported</th></tr>';
    
    if(dealId == null || shareholderId == null)
    {
        html += '<tr><th colspan="2">No Participating Shareholder Data Found to compare to</th></tr>';
        html += '</table></div>';
        return html;
    }
    
    // load participating shareholder data
    var filters = new Array();
    filters.push(new nlobjSearchFilter('custrecord_participating_escrow',null,'is',dealId));
    filters.push(new nlobjSearchFilter('custrecord_participating_shareholder',null,'anyof',shareholderId));
    var columns = new Array();
    columns.push(new nlobjSearchColumn('internalid',null,null));
    columns.push(new nlobjSearchColumn('custrecord64',null,null));    // cash at close
    columns.push(new nlobjSearchColumn('custrecord73',null,null));    // shares at closing
    columns.push(new nlobjSearchColumn('custrecord14',null,null));    // lot
    columns.push(new nlobjSearchColumn('custrecord8',null,null));    // pro rata text
    columns.push(new nlobjSearchColumn('custrecord_security_type',null,null));    // security type
        
    var results = nlapiSearchRecord('customrecord2',null,filters,columns);
    if(results == null || results.length == 0)
    {
        html += '<tr><th colspan="2">No Participating Shareholder Data Found to compare to</th></tr>';
        html += '</table></div>';
        return html;
    }

    var sharesAtClose = 0;
    var cashAtClose = 0.0;
    
    html += '<tr><th align="left">Lot</th><th align="left">Pro Rata</th><th align="left">Shares at Close</th><th align="left">Cash Paid at Close</th><th align="left">Security Type</th></tr>';
    for(var i = 0; i < results.length; i++)
    {
        var result = results[i];
        var lot = result.getValue('custrecord14');
        var proRata = result.getValue('custrecord8');
        var shClose = result.getValue('custrecord73');
        var csClose = result.getValue('custrecord64');
        var secType = result.getText('custrecord_security_type');
        
        html += '<tr>' + formTableLine(lot,'right');
        html += formTableLine(proRata);
        html += formTableLine(shClose,'right');
        html += formTableLine(csClose,'right');
        html += formTableLine(secType) + '</tr>';
        
        sharesAtClose += parseInt(shClose);
        cashAtClose += parseFloat(csClose);
    }
    
    html += '<tr><td></td>' + formTableLine('<b>Total:</b>','right') + formTableLine(sharesAtClose,'right') + formTableLine(cashAtClose,'right') + '</tr>';
    html += '</table>';
    
    // load deal documents
    if(dealId == null)
    {
        html += '</div>';
        return html;
    }
    
    var docFilters = new Array();
    docFilters.push(new nlobjSearchFilter('custrecord_escrow_customer',null,'is',dealId));
    docFilters.push(new nlobjSearchFilter('custrecord_doc_type',null,'anyof',[5]));        // Source Data File
    var docColumns = new Array();
    docColumns.push(new nlobjSearchColumn('internalid',null,null));
    docColumns.push(new nlobjSearchColumn('custrecord_file',null,null));
    docColumns.push(new nlobjSearchColumn('custrecord_doc_type',null,null));
    
    var docs = nlapiSearchRecord('customrecord_document_management',null,docFilters,docColumns);
    
    html += '<table>';
    if(results == null || results.length == 0)
    {
        html += '<tr><th colspan="2">No Documents Found</th></tr>';
        html += '</table></div>';
        return html;
    }
    
    var docUrl = nlapiResolveURL('TASKLINK','EDIT_CUST_',null,null) + '&rectype=61&id=';
    
    html += '<tr><th>Document Name</th></tr>';
    for (var i = 0; i < docs.length; i++)
    {
        var doc = docs[i];
        var name = doc.getText('custrecord_file');
        var type = doc.getText('custrecord_doc_type');
        var docId = doc.getText('internalid');
        
        html += '<tr>' + formTableLineLink(name,null,docUrl + docId,'_top') + '</a></tr>';
    }
        
    html += '</table></div>';
        
    return html;
}

function matchShareholderRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if(regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var rcd = nlapiLoadRecord('customrecord13',regId);

    var shareholder = rcd.getFieldText('custrecord17');
    if(shareholder != null && shareholder.length > 0) return 'Match for shareholder already made.';
    shareholder = rcd.getFieldValue('custrecord58');
    
    // break the shareholder name into parts based on the space and comma characters
    shareholder = shareholder.replace(/LP/g,'').replace(/L\.P\./g,'').replace(/LLC/g,'').replace(/Inc\./g,'');
    //shareholder = shareholder.replace(/\s[A-Z]{1}\s/g,'');
    var shParts = shareholder.split(/[\s,\.]+/);
    
    // try various combinations of the parts in a search
    var matchingList = wildCardCustomerFinder(shParts,['2','7']);

    var html  = '<table><tr><th>Action</th><th>Name</th></tr>';
    if(matchingList == null || matchingList.length == 0)
    {
        html += 'No matches found.';
        return html;
    }
    
        html += '<form id="registration_post" action="' + portletUrl + '" method="post">';
        html += '<input type="hidden" name="page"             value="postShareholderMatch"/>';
        html += '<input type="hidden" name="registrationid" value="' + regId + '"/>';
    
    // return a table of the search results
    for(var i = 0; i < matchingList.length; i++)
    {
        match = matchingList[i];
        
        html += '<tr>';
        html += '<td><input type="radio" name="shareholderid" value="' + match.internalid + '"/></td>';
        html += '<td>' + match.name + '</td>';
        html += '</tr>';
    }
    
    html += '<tr><td colspan="2"><input type="submit" value="Submit"/></td></tr>';
    html += '</form></table>';
    
    return html;
}

function copyOlrData(request)
{
    // the only we get into this function is if the OLR record has a shareholder associated with it
    var regId = request.getParameter('registrationid');
    if(regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var rcd = nlapiLoadRecord('customrecord13',regId);
    
    var shareholderId = rcd.getFieldValue('custrecord17');
    var shareholder = nlapiLoadRecord('customer',shareholderId);
    var contacts = null
    try
    {
        contacts = getContacts(shareholderId);        // get the list of contacts associated with this shareholder    
    }
    catch(e)
    {
        if(e != 'NO_CONTACTS_FOUND') throw e;
    }

    // get the parameters that need to change
    var copyToShareholderEmail = request.getParameter('copyToShareholderEmail');
    nlapiLogExecution("DEBUG", "copyOlrData", "copyToShareholderEmail = " + copyToShareholderEmail);
    if(copyToShareholderEmail != null)
    {
        shareholder.setFieldValue('email',copyToShareholderEmail);
        nlapiSubmitRecord(shareholder,false,true);
    }
    
    if(contacts == null || contacts.length == 0) return;    // short circuit
    
    // loop through the contacts and see what values need to be updated
    for(var i = 0; i < contacts.length; i++)
    {
        var contact = contacts[i];
        
        var copyToContactEmail = request.getParameter('copyToContactEmail' + i);
        var copyToContactFirstName = request.getParameter('copyToContactFirstName' + i);
        var copyToContactLastName = request.getParameter('copyToContactLastName' + i);
        
        if(copyToContactEmail == null && copyToContactFirstName == null && copyToContactLastName == null) continue;
        
        var conRcd = nlapiLoadRecord('contact',contact.internalid);
        
        if(copyToContactEmail != null) conRcd.setFieldValue('email',copyToContactEmail);
        if(copyToContactFirstName != null) conRcd.setFieldValue('firstname',copyToContactFirstName);
        if(copyToContactLastName != null) conRcd.setFieldValue('lastname',copyToContactLastName);
        
        nlapiSubmitRecord(conRcd,false,true);
    }
}

function createNewContactFromRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if(regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var rcd = nlapiLoadRecord('customrecord13',regId);

    var shareholderId = rcd.getFieldValue('custrecord17');
    var dealId = rcd.getFieldValue('custrecord18');
    if(shareholderId == null) return;    // can't do anything here until a shareholder record exists
    if(dealId == null) return;            // need dealId to attach record to
    
    var olrEmail = rcd.getFieldValue('custrecord28');
    var olrFirstName = rcd.getFieldValue('custrecord19');
    var olrLastName = rcd.getFieldValue('custrecord20');
    
    if(olrEmail == null && olrFirstName == null && olrLastName == null) return;

    var contact = nlapiCreateRecord('contact');
        contact.setFieldValue('email',olrEmail);
        contact.setFieldValue('company',shareholderId);
    
    if(olrFirstName != null) contact.setFieldValue('firstname',olrFirstName);
    if(olrLastName != null) contact.setFieldValue('lastname',olrLastName);
    
    var contactid = nlapiSubmitRecord(contact,false,true);

    var params = [];
    params['role'] = '-10';
    
    nlapiAttachRecord('contact',contactid,'customer',shareholderId,params);
    params['role'] = '24';
    nlapiAttachRecord('contact',contactid,'customer',dealId,params);
}

function copyShareholderRegistration(request)
{
    // the only we get into this function is if the OLR record has a shareholder associated with it
    var regId = request.getParameter('registrationid');
    if(regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var rcd = nlapiLoadRecord('customrecord13',regId);
    
    var shareholderId = rcd.getFieldValue('custrecord17');
    var shareholder = nlapiLoadRecord('customer',shareholderId);
    var contacts = null
    try
    {
        contacts = getContacts(shareholderId);        // get the list of contacts associated with this shareholder    
    }
    catch(e)
    {
        if(e != 'NO_CONTACTS_FOUND') throw e;
    }
    
    var html = '<b>' + rcd.getFieldText('custrecord17') + '</b>';
    html += '<form id="registration_post" action="' + portletUrl + '" method="post">';
    html += '<input type="hidden" name="page"             value="copyOlrData"/>';
    html += '<input type="hidden" name="registrationid" value="' + regId + '"/>';
    html += '<table border="1"><tr><th>Field</th><th>OLR Data</th><th>--></th><th>Shareholder Data</th>';
    
    // deal with email address
    var olrEmail = rcd.getFieldValue('custrecord28');
    var shrEmail = shareholder.getFieldValue('email');
    if(olrEmail == null) olrEmail = '';
    if(shrEmail == null) shrEmail = '';
    
    if(contacts == null)
    {
        var createContactURL = portletUrl + '&page=createNewContactFromRegistration&registrationid=' + regId;
        html += '<th>--></th><th>Contact Data <a href="' + createContactURL  + '">(create contact)</a></th>';
    }
    else
    {
        for(var i = 0; i < contacts.length; i++)                // add a new column per contact
            html += '<th>--></th><th>Contact Data</th>'; 
    }
    
    html += '</tr><tr><th>Email:</th>'
    html += '<td>' + olrEmail + '</td>';                    // OLR record, email address as entered
    if(olrEmail != null && olrEmail.length > 0)    html += '<td><input type="checkbox" name="copyToShareholderEmail" value="' + olrEmail + '"/></td>';
    else html += '<td></td>';
    html += '<td>' + shrEmail + '</td>';
    
    for(var i = 0; contacts != null && i < contacts.length; i++)                // loop through the list of contacts
    {
        var contact = contacts[i];
        if(olrEmail != null && olrEmail.length > 0)    html += '<td><input type="checkbox" name="copyToContactEmail' + i + '" value="' + olrEmail + '"/></td>';
        else html += '<td></td>';
        html += '<td>' + contact.email + '</td>';
    }
    
    // deal with the first name
    var olrFirstName = rcd.getFieldValue('custrecord19');
    if(olrFirstName == null) olrFirstName = '';
    html += '</tr><tr><th>First Name:</th><td>' + olrFirstName + '</td>';
    html += '<td></td><td></td>';        // skip customer, since no first name/last name
    for(var i = 0; contacts != null && i < contacts.length; i++)                // loop through the list of contacts
    {
        var contact = contacts[i];
        if(olrFirstName != null && olrFirstName.length > 0)    html += '<td><input type="checkbox" name="copyToContactFirstName' + i + '" value="' + olrFirstName + '"/></td>';
        else html += '<td></td>';
        html += '<td>' + contact.firstname + '</td>';
    }
    
    // deal with the first name
    var olrLastName = rcd.getFieldValue('custrecord20');
    if(olrLastName == null) olrLastName = '';
    html += '</tr><tr><th>Last Name:</th><td>' + olrLastName + '</td>';
    html += '<td></td><td></td>';        // skip customer, since no first name/last name
    for(var i = 0; contacts != null && i < contacts.length; i++)                // loop through the list of contacts
    {
        var contact = contacts[i];
        if(olrLastName != null && olrLastName.length > 0)    html += '<td><input type="checkbox" name="copyToContactLastName' + i + '" value="' + olrLastName + '"/></td>';
        else html += '<td></td>';
        html += '<td>' + contact.lastname + '</td>';
    }
    
    html += '</tr><tr><td colspan="6"><input type="submit" value="Submit"/></td></tr>';
    html += '</table></form>';    
    
    return html;
}

function matchDealRegistration(request)
{
    var regId = request.getParameter('registrationid');
    if(regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
    var rcd = nlapiLoadRecord('customrecord13',regId);

    var deal = rcd.getFieldText('custrecord18');
    if(deal != null && deal.length > 0) return 'Match for deal already made.';
    deal = rcd.getFieldValue('custrecord_temp_deal_name');
    
    // break the shareholder name into parts based on the space and comma characters
    deal = deal.replace(/Inc\./g,'').replace(/L\.P\./g,'').replace(/LLC/g,'');
    var dParts = deal.split(/[\s,\.]+/);
    
    // try various combinations of the parts in a search
    var matchingList = wildCardCustomerFinder(dParts,['1']);
    
    var html  = '<table><tr><th>Action</th><th>Name</th></tr>';

    if(matchingList == null || matchingList.length == 0)
    {
        html += 'No matches found.';
        return html;
    }
    
        html += '<form id="registration_post" action="' + portletUrl + '" method="post">';
        html += '<input type="hidden" name="page"             value="postDealMatch"/>';
        html += '<input type="hidden" name="registrationid" value="' + regId + '"/>';
    
    // return a table of the search results
    for(var i = 0; i < matchingList.length; i++)
    {
        match = matchingList[i];
        
        html += '<tr>';
        html += '<td><input type="radio" name="dealid" value="' + match.internalid + '"/></td>';
        html += '<td>' + match.name + '</td>';
        html += '</tr>';
    }
    
    html += '<tr><td colspan="2"><input type="submit" value="Submit"/></td></tr>';
    html += '</form></table>';
    
    return html;
}


function postShareholderMatch(request)
{
    var regId = request.getParameter('registrationid');
    if (regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    
    var shareholderId = request.getParameter('shareholderid');
    if (shareholderId == null || shareholderId.length == 0) return 'No Shareholder ID Found in Request';
    
    var rcd = nlapiLoadRecord('customrecord13',regId);
    rcd.setFieldValue('custrecord17',shareholderId);
    nlapiSubmitRecord(rcd,true,false);
}

function postDealMatch(request)
{
    var regId = request.getParameter('registrationid');
    if (regId == null || regId.length == 0) return 'No Registration ID Found in Request';
    
    var dealId = request.getParameter('dealid');
    if (dealId == null || dealId.length == 0) return 'No Deal ID Found in Request';
    
    var rcd = nlapiLoadRecord('customrecord13',regId);
    rcd.setFieldValue('custrecord18', dealId);
    nlapiSubmitRecord(rcd,true,false);    
}

function wildCardCustomerFinder(parts,types)
{
    // try various combinations of the parts in a search to find a list of matching customers
    var columns = new Array();
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(new nlobjSearchColumn('companyname'));

    var filters = new Array();
        filters.push(new nlobjSearchFilter('category', null, 'anyof', types));
        
    for(var i = 0; i < parts.length; i++)
    {
        var str = parts[i];
        if(str.length == 1) continue;    // skip single characters
        filters.push(new nlobjSearchFilter('companyname', null, 'contains', str));
    }
    
    var results = nlapiSearchRecord('customer',null, filters, columns);
    if(results != null && results.length > 0)
    {
        var rtn = new Array();
        for(var i = 0; i < results.length; i++)
        {
            var result = results[i];
            var match = {
                 'internalid': result.getValue('internalid')
                ,'name': result.getValue('companyname')
            }
            rtn.push(match);
        }
        return rtn;
    }
    return null;
}

function formTableLineLink(fullText, alignment, theUrl, target)
{
    if(theUrl == null) return formTableLine(fullText,alignment);
    if(fullText == null) fullText = '';
    if(alignment == null || alignment.length == 0) alignment = 'left';
    
    var displayValue = fullText;
    if(fullText.length > 70)    displayValue = displayValue.substring(0,70) + '...';
    
    var rtn  = '<td align="' + alignment + '">';
        rtn += '<a href="' + theUrl + '"';
    if(target != null)
    {
        rtn += ' target="' + target + '"';
    }
        rtn += '">';
        rtn += '<span title="' + fullText + '">' + displayValue + '</span></a></td>';
    
    //return '<td align="' + alignment + '"><a href="' + theUrl + '"><span title="' + fullText + '">' + displayValue + '</span></a></td>';
    return rtn;
}

function formTableLine(fullText, alignment)
{
    if(fullText == null) fullText = '';
    if(alignment == null || alignment.length == 0) alignment = 'left';
    
    var displayValue = fullText;
    if(fullText.length > 70)    displayValue = displayValue.substring(0,70) + '...';
    
    return '<td align="' + alignment + '"><span title="' + fullText + '">' + displayValue + '</span></td>';
}

function getViewableDeals(contact)
{    
    var filters = new Array();
        filters[0] = new nlobjSearchFilter('internalid', 'contact', 'is', contact.internalid);
        filters[1] = new nlobjSearchFilter('category', null, 'anyof', ['1']);
    
    var columns = new Array();
        columns[0] = new nlobjSearchColumn('internalid');
        columns[1] = new nlobjSearchColumn('companyname');

    var searchResults = nlapiSearchRecord('customer',null, filters, columns);
    if(!searchResults || searchResults == null)
    {
        return new Array();
    }

    var shareholders = getChildFunds([contact.toplevelParent],false);        // list of all child funds
    var allDeals = getShareholderDeals(shareholders);                        // list of all associated deals
    
    var deals = new Array();
    for(var i = 0; i < searchResults.length; i++)
    {
        var result = searchResults[i];
        var deal = {
             'internalid':result.getValue('internalid')
            ,'name':result.getValue('companyname')
        };
        for(var j = 0; j < allDeals.length; j++)
        {
            if(deal.internalid == allDeals[j].internalid)
            {
                deals.push(deal);
            }
        }
    }
    return deals;    
}

function getNonViewableDeals(contact,viewableDeals)
{
    // get the list of top level parents
    var parents = getTopLevelParents(contact);
    
    // for the list of parents, get all child shareholders
    var shareholders = getChildFunds(parents,false);

    // for the list of shareholders, get the list of deals
    var allDeals = getShareholderDeals(shareholders);

    // for the list of all deals, remove any that are already viewable
    for(var i = 0; i < allDeals.length; i++)
    {
        var deal = allDeals[i];
        for(var j = 0; j < viewableDeals.length; j++)
        {
            var viewDeal = viewableDeals[j];
            if(viewDeal.internalid == deal.internalid)
            {
                allDeals.splice(i,1);                    // remove the duplicative deal
                i--;
                break;
            }
        }
    }
    
    return allDeals;
}

function getViewableShareholders(contact)
{    
    var filters = new Array();
        filters[0] = new nlobjSearchFilter('internalid', 'contact', 'is', contact.internalid);
        filters[1] = new nlobjSearchFilter('category', null, 'anyof', ['2']);
    
    var columns = new Array();
        columns[0] = new nlobjSearchColumn('internalid');
        columns[1] = new nlobjSearchColumn('companyname');

    var searchResults = nlapiSearchRecord('customer',null, filters, columns);
    
    if(!searchResults || searchResults == null)
    {
        return new Array();
    }

    var childFunds = getChildFunds([contact.toplevelParent],false);        // list of all child funds
    
    var shareholders = new Array();
    for(var i = 0; i < searchResults.length; i++)
    {
        var result = searchResults[i];
        var shareholder = {
             'internalid':result.getValue('internalid')
            ,'name':result.getValue('companyname')
        };
        for(var j = 0; j < childFunds.length; j++)
        {
            if(shareholder.internalid == childFunds[j])
            {
                shareholders.push(shareholder);
            }
        }
    }
    return shareholders;    
}

function getNonViewableShareholders(contact,viewableShareholders)
{
    var allShareholders = getChildFunds([contact.toplevelParent],true);        // get all child shareholders
    
    // remove any shareholders that appear in the viewable list
    for(var i = 0; i < allShareholders.length; i++)
    {
        var shareholder = allShareholders[i];
        for(var j = 0; j < viewableShareholders.length; j++)
        {
            var viewShareholder = viewableShareholders[j];
            if(viewShareholder.internalid == shareholder.internalid)
            {
                allShareholders.splice(i,1);                    // remove the duplicative deal
                i--;
                break;
            }
        }
    }    
    return allShareholders;
}

function getTopLevelParents(contact)
{
    var filters = new Array();
    filters.push(new nlobjSearchFilter('internalid', 'contact', 'is', contact.internalid));
    filters.push(new nlobjSearchFilter('category', null, 'anyof', ['7','2']));

    var columns = [new nlobjSearchColumn('parent',null,'group')];    

    var parentResults = nlapiSearchRecord('customer',null, filters, columns);
    if(!parentResults || parentResults == null || parentResults.length == 0)
        return new Array();

    var parents = new Array();
    for(var i = 0; i < parentResults.length; i++)
    {
        var parentId = parentResults[i].getValue('parent',null,'group');
        parents.push(parentId);
    }
    
    return parents;    
}

function getChildFunds(parents,objectified)
{
    if(parents == null || parents.length == 0) return new Array();

    // for the list of parents, get all child shareholders
    var filters = [new nlobjSearchFilter('internalid', 'toplevelparent', 'anyof', parents)];
        filters.push(new nlobjSearchFilter('category', null, 'anyof', ['2']));
    
    var columns = [new nlobjSearchColumn('companyname',null,'group')];
        columns.push(new nlobjSearchColumn('internalid',null,'group'));
    
    var results = nlapiSearchRecord('customer',null, filters, columns);
    
    var shareholders = new Array();
    for(var i = 0; i < results.length; i++)
    {
        var shareholder = results[i];
        if(objectified)
        {
            shareholders.push(
                {'internalid':shareholder.getValue('internalid',null,'group')
                ,'name':shareholder.getValue('companyname',null,'group')});
        }
        else
        {
            shareholders.push(shareholder.getValue('internalid',null,'group'));
        }
    }
    
    return shareholders;
}

function getShareholderDeals(shareholders)
{
    if(shareholders == null || shareholders.length == 0) return new Array();

    var txFilters = [new nlobjSearchFilter('custrecord67', null, 'anyof', shareholders)];     // custrecord67 = shareholders
    var txColumns = [new nlobjSearchColumn('custrecord66',null,'group')];                    // custrecord66 = deals
    var txResults = nlapiSearchRecord('customrecord18',null, txFilters, txColumns);            // escrow transactions
    
    var deals = new Array();

    if(txResults == null)    txResults = new Array();
    for(var i = 0; i < txResults.length; i++)
    {
        var deal = {
             'internalid': txResults[i].getValue('custrecord66',null,'group')
            ,'name': txResults[i].getText('custrecord66',null,'group')
        };
        deals.push(deal);        
    }

    var prFilters = [new nlobjSearchFilter('custrecordshareholder',null,'anyof',shareholders)];                // only show deals related to these shareholders
    if(deals.length > 0)
    {
        prFilters.push(new nlobjSearchFilter('custrecordescrow',null,'noneof',internalIdToArray(deals)));    // filter out any deals already found
    }
    var prColumns = [new nlobjSearchColumn('custrecordescrow',null,'group')];
    var prResults = nlapiSearchRecord('customrecordespr',null, prFilters, prColumns);                        // shareholder pro rata

    if(prResults == null)    prResults = new Array();
    for(var j = 0; j < prResults.length; j++)
    {
        var deal = {
             'internalid': prResults[j].getValue('custrecordescrow',null,'group')
            ,'name': prResults[j].getText('custrecordescrow',null,'group')
        };
        deals.push(deal);        
    }
    
    if(deals == null || deals.length == 0) return new Array();

    var psFilters = [new nlobjSearchFilter('custrecord_participating_shareholder',null,'anyof',shareholders)];                // only show deals related to these shareholders
        psFilters.push(new nlobjSearchFilter('custrecord_participating_escrow',null,'noneof',internalIdToArray(deals)));    // filter out any deals already found
    var psColumns = [new nlobjSearchColumn('custrecord_participating_escrow',null,'group')];
    var psResults = nlapiSearchRecord('customrecord2',null, psFilters, psColumns);                            // participating shareholder data

    if(psResults == null || psResults.length == 0)    return deals;
    for(var k = 0; k < psResults.length; k++)
    {
        var deal = {
             'internalid': psResults[k].getValue('custrecord_participating_escrow',null,'group')
            ,'name': psResults[k].getText('custrecord_participating_escrow',null,'group')
        };
        deals.push(deal);        
    }
        
    return deals;
}

function createLink(url,action,contact,company)
{
    return createLinkAlt(url,action,action,contact,company);
}

function createLinkAlt(url,action,linkname,contact,company,target)
{
    if(action && action != null)
    {
        url += '&srs_action=' + action.toUpperCase()
    }
    if(contact && contact != null && contact.internalid)
    {
        url += '&srs_contact=' + contact.internalid
    }
    if(company && company != null)
    {
        if(company.toplevelParent)
        {
            url += '&srs_company=' + company.toplevelParent;
        }
        else if(company.internalid)
        {
            url += '&srs_company=' + company.internalid;
        }
    }
    if(target && target != null)
    {
        target = ' target="' + target + '"';
    }
    
    return '<a href="' + url + '"' + target + '>' + linkname + '</a>';    
}

function removeCompanyAccess(request)
{
    var contactInternalId = request.getParameter('srs_contact');
    var companyInternalId = request.getParameter('srs_company');
    var contactParentId   = request.getParameter('contactparent');
    nlapiDetachRecord('contact',contactInternalId,'customer',companyInternalId,null);
    
    // remove the company from the shareholder report access record
    var contact = {'internalid': contactInternalId
                  ,'toplevelParent': contactParentId};
    var record = getShareholderDataAccess(contact);
    if(record == null) return;
    
    // remove the company
    var type = request.getParameter('srs_type');
    if(type == 'deal')
    {
        var deals = getViewableDeals(contact);
        record.setFieldValues('custrecord_escrow',internalIdToArray(deals));
    }
    else if(type == 'shareholder')
    {
        shareholders = getViewableShareholders(contact);
        record.setFieldValues('custrecord_shareholder', internalIdToArray(shareholders));
    }
    nlapiSubmitRecord(record);
}

function addCompanyAccess(request)
{
    var contactInternalId = request.getParameter('srs_contact');
    var companyInternalId = request.getParameter('srs_company');
    var contactParentId   = request.getParameter('contactparent');
    nlapiAttachRecord('contact',contactInternalId,'customer',companyInternalId,null);

    // remove the company from the shareholder report access record
    var contact = {'internalid': contactInternalId
                  ,'toplevelParent': contactParentId};
    var record = getShareholderDataAccess(contact);
    if(record == null) return;

    // add the company
    var type = request.getParameter('srs_type');
    if (type == 'deal')
    {
        var deals = getViewableDeals(contact); 
        record.setFieldValues('custrecord_escrow',internalIdToArray(deals));
    }
    else if(type == 'shareholder')
    {
        // get the list of viewable and nonviewable shareholders.
        var viewableShareholders = getViewableShareholders(contact);
        var nonviewableShareholders = getNonViewableShareholders(contact,viewableShareholders);
        if(nonviewableShareholders != null && nonviewableShareholders.length > 0) // if it is non-null, simply add the new shareholder
        {
            record.setFieldValues('custrecord_shareholder',internalIdToArray(viewableShareholders));
        }
        else // if it is null, remove all shareholders and set the investor group
        {
            //var parents = getTopLevelParents(contact);
            if(contactParentId != null)
            {
                record.setFieldValues('custrecord_shareholder',[]);
                record.setFieldValue('custrecord_investor_group',contactParentId);
            }
            else
            {
                record.setFieldValues('custrecord_shareholder',internalIdToArray(viewableShareholders));
            }
        }
    }
    nlapiSubmitRecord(record);
}

function givethPortalAccess(contact)
{

nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccess','Begin givethPortalAccess');
nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccess','contact: ' + contact);

    for(var i = 1; i <= nlapiGetLineItemCount('contactroles'); i++)
    {
        if (nlapiGetLineItemValue('contactroles', 'contact',i) == contact)
        {
        nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccess','Access Line: ' + i);
            givethPortalAccessLine(contact,i);
            return;
        }
        else if(contact == null && nlapiGetLineItemValue('contactroles', 'giveaccess',i) == 'F')
        {
        nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccess','contact is null');
            givethPortalAccessLine(nlapiGetLineItemValue('contactroles', 'contact',i),i);
        }
    }
    
    if(contact && contact != null)
    {
        // contact was not found
        throw nlapiCreateError('Contact not found','Contact is not associated with the entity. Associate contact and then try again.');
    }
}

function givethPortalAccessLine(contact, rowNumber)
{

 nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccessLine','contact: ' + contact);
    nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccessLine','rowNumber: ' + rowNumber);
    
    
    nlapiSetLineItemValue('contactroles','giveaccesss',     rowNumber, 'T');
    nlapiSetLineItemValue('contactroles', 'accessrole',     rowNumber, 1000);            // SRS Customer Center
    nlapiSetLineItemValue('contactroles', 'sendemail',         rowNumber, 'F');
    
    var pwd = (Math.random()*1000).toFixed(0);
    var user = nlapiGetLineItemValue('contactroles', 'email',rowNumber).split('@')[0].toLowerCase();
    if(user.length > 12)
    {
        user = user.substring(0,12);
    }
    
    nlapiSetLineItemValue('contactroles', 'password',         rowNumber, user + pwd);
    nlapiSetLineItemValue('contactroles', 'passwordconfirm',     rowNumber, user + pwd);
    
    // update the contact's initial password
    
    nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccessLine','User: ' + user);
    nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccessLine','Pwd: ' + pwd);
    nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccessLine','Before record submit');
    
    var nsContact = nlapiLoadRecord('contact',contact);
    nsContact.setFieldValue('custentity_initial_password', user + pwd);
    nlapiSubmitRecord(nsContact, true);    
    
    nlapiLogExecution('DEBUG','PortalAccessUtil.givethPortalAccessLine','After record submit');
}

function takethPortalAccess(contact)
{
    for(var i = 1; i <= nlapiGetLineItemCount('contactroles'); i++)
    {
        if (nlapiGetLineItemValue('contactroles', 'contact',i) == contact)
        {
            nlapiSetLineItemValue('contactroles','giveaccesss', i, 'F');
        }
    }
}

function renderEmailReportSync(contact)
{
    var suitletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
        suitletUrl += '&page=emailReportAccess&contactemail=' + contact.email;
    if(contact.toplevelParent != null)    suitletUrl += '&contactparent=' + contact.toplevelParent;

    try
    {
        var record = getOrCreateShareholderDataAccess(contact,false);
        if(record == null)    return createLinkAlt(suitletUrl,'forceSync','No (Force Sync)',contact,null,null);

        // compare deals
        var reportDeals = record.getFieldValues('custrecord_escrow');
        if(!compareLists(reportDeals,internalIdToArray(contact.viewableDeals)))
        {
            return createLinkAlt(suitletUrl,'forceSync','No (Force Sync)',contact,null,null);
        }
        
        var reportShareholders = record.getFieldValues('custrecord_shareholder');
        var reportInvestorGroup = record.getFieldValue('custrecord_investor_group');
        if((reportShareholders == null || reportShareholders.length == 0) && reportInvestorGroup != null)
        {
            reportShareholders = getChildFunds([contact.toplevelParent],false);    // get all child funds
        }
        
        if(!compareLists(reportShareholders,internalIdToArray(contact.viewableShareholders)))
        {    // in this case we want to remove all of the shareholders and just set an investor group
            return createLinkAlt(suitletUrl,'forceSync','No (Force Sync)',contact,contact,null);    
        }
        
        return 'Yes';        // if the above two are fine, display "Yes" with no link
    }
    catch(error)
    {
        if(error == 'MULTIPLE_REPORT_RECORDS_FOUND')    return createLinkAlt(suitletUrl,'forceSync','No (Force Sync)',contact,null,null);
        else                                            throw error;
    }
    return 'Unknown Problem';
}

// loops through each list to see if they are in sync
function compareLists(listA,listB)
{
    if((listA == null || listA.length == 0) && (listB == null || listB.length == 0)) return true;
    if(listA == null || listA.length == 0) return false;
    if(listB == null || listB.length == 0) return false;
    if(listA.length != listB.length) return false;
    
    var removed = new Array();
    for(var i = 0; i < listA.length; i++)
    {
        for(var j = 0; j < listB.length; j++)
        {
            if(listA[i] == listB[j])
            {
                removed.push(listA[i]);
            }
        }
    }
    
    return listB.length == removed.length;
}

function doForceSync(request)    // force synchronization between portal access and shareholder data access
{
    var contactId = request.getParameter('srs_contact');
    var parentId = request.getParameter('contactparent');
    var investorGroupId = request.getParameter('srs_company');

    var contact = {
         'internalid': contactId
        ,'toplevelParent': parentId
    };
    var record = getOrCreateShareholderDataAccess(contact,true);
    
    // sync up the deals    
    var viewableDeals = internalIdToArray(getViewableDeals(contact));
    record.setFieldValues('custrecord_escrow',viewableDeals);
    
    // sync up the shareholders
    var viewableShareholders = getViewableShareholders(contact);
    var nonviewableShareholders = getNonViewableShareholders(contact,viewableShareholders);
    if(nonviewableShareholders == null || nonviewableShareholders.length == 0)
    {
        // set the investor group and set shareholders equal to null
        var customer = nlapiLoadRecord('customer',parentId)
        if(customer.getFieldValue('category') == '7')
        {
            record.setFieldValue('custrecord_investor_group',parentId);
            record.setFieldValues('custrecord_shareholder',[]);
        }
        else
        {
            record.setFieldValues('custrecord_shareholder',internalIdToArray(viewableShareholders));
        }
    }
    else if(nonviewableShareholders != null)
    {
        record.setFieldValues('custrecord_shareholder',internalIdToArray(viewableShareholders));
    }
    
    // if all shareholders selected, and investor group available, remove all shareholders and set investor group
    nlapiSubmitRecord(record);
}

function internalIdToArray(data)
{
    var newArray = new Array();
    
    for(var i = 0; i < data.length; i++)
    {
        nlapiLogExecution("DEBUG", "PortalAccessUtil.internalIdToArray", "data.internalid = " + data[i].internalid);
        newArray.push(data[i].internalid);
    }
    return newArray;
}

function changeEmailStatmentReceiptStatus(newStatus,sdaInternalId)
{
    var rcd = nlapiLoadRecord('customrecord_shareholder_data_access',sdaInternalId);
    rcd.setFieldValue('custrecord_receive_no_statements',newStatus);
    nlapiSubmitRecord(rcd);
}

