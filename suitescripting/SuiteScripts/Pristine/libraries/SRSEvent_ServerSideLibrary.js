/**
 * @author durbano
 * Scott Streule - 4/14/18 - UPDATED to remove hard coded URL and replace with nlapiResolveURL
 */
function getListOfUpcomingEvents(portletSelection) {

    nlapiLogExecution('DEBUG', 'getListOfUpcomingEvents', portletSelection);

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
    columns[8] = new nlobjSearchColumn('custevent_srs_date_classification', null, null); // SRS Task Classification
    columns[9] = new nlobjSearchColumn('custevent_srs_date_managing_dept', null, null); // SRS Managing Department
    columns[10] = new nlobjSearchColumn('custevent_imp_date_assigned_to', null, null);

    columns[0].setSort();

    searchResults = nlapiSearchRecord('calendarevent', null, filters, columns); // set search results

    //This broke on 8/11/2016 due to a NetSuite Ninja Release.  Thanks NetSuite, it only took us 2 hrs to figure this out.
    //searchResults.sort(dateSortOrder);

    return searchResults;
}

function getListOfUpcomingEventsNoDepts(portletSelection) {

    nlapiLogExecution('DEBUG', 'getListOfUpcomingEventsNoDepts', portletSelection);

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
    //filters[1] = new nlobjSearchFilter('startdate', null, 'onorbefore', theDate);
    filters[1] = new nlobjSearchFilter('custevent_srs_date_managing_dept', null, 'noneof', "12", "14");

    columns[0] = new nlobjSearchColumn('startdate', null, null);
    columns[1] = new nlobjSearchColumn('company', null, null);
    columns[2] = new nlobjSearchColumn('status', null, null);
    columns[3] = new nlobjSearchColumn('custevent28', null, null); // Escrow Account
    columns[4] = new nlobjSearchColumn('custevent27', null, null); // Escrow Activity
    columns[5] = new nlobjSearchColumn('custevent29', null, null); // Release Pct
    columns[6] = new nlobjSearchColumn('custevent30', null, null); // Comments
    columns[7] = new nlobjSearchColumn('title', null, null); // Title
    columns[8] = new nlobjSearchColumn('custevent_srs_date_classification', null, null); // SRS Task Classification
    columns[9] = new nlobjSearchColumn('custevent_srs_date_managing_dept', null, null); // SRS Managing Department
    columns[10] = new nlobjSearchColumn('custevent_imp_date_assigned_to', null, null);

    columns[0].setSort();

    searchResults = nlapiSearchRecord('calendarevent', null, filters, columns); // set search results

    //This broke on 8/11/2016 due to a NetSuite Ninja Release.  Thanks NetSuite, it only took us 2 hrs to figure this out.
    //searchResults.sort(dateSortOrder);

    return searchResults;
}

function createEventList(searchResults, editUrl, completeUrl) {
    nlapiLogExecution("DEBUG", "SRSEvent_ServerSideLibrary.createEventList", " Rendering event list");
    var list = nlapiCreateList('Event List', true);

    list.addColumn('startdate', 'date', 'Date', 'RIGHT');
    var eventColumn = list.addColumn('company', 'text', 'Deal', 'LEFT');
    eventColumn.setURL(editUrl);
    eventColumn.addParamToURL('eventid', 'eventid', true);

    list.addColumn('custtitle', 'text', 'Title', 'LEFT');
    list.addColumn('comments', 'text', 'Comments', 'LEFT');
    list.addColumn('resource', 'text', 'Department', 'CENTER');
    list.addColumn('action_required', 'text', 'SRS Class.', 'CENTER');
    list.addColumn('assigned_to', 'text', 'Assigned To', 'CENTER');
    list.addColumn('cust_mark', 'text', 'Mark', 'LEFT');

    for (var i = 0; searchResults != null && i < searchResults.length; i++) // setup view url
    {
        var result = searchResults[i];

        var com = result.getText('company', null, null);
        var rsc = result.getText('custevent_srs_date_managing_dept');
        //if(rsc != '2' && (com == null || com.length == 0)) continue;
        if (com == null || com.length == 0) continue;

        var hash = new Array();

        // Get the Event Class ID so that you can highlight rows with a particular event class
        var eventClass = result.getValue('custevent_srs_date_classification');

        hash.eventid = result.getId();
        hash.company = com;
        hash.resource = rsc;
        if (eventClass === '1') {
            hash.resource = '<b>' + hash.resource + '</b>';
        }
        hash.startdate = result.getValue('startdate');
        if (eventClass === '1') {
            hash.startdate = '<b>' + hash.startdate + '</b>';
            // hash.startdate        = '<div style="background-color: red!important">' + result.getValue('startdate') + '</div>';
        }
        hash.escrowactivity = result.getText('custevent27');
        hash.action_required = result.getText('custevent_srs_date_classification');
        if (eventClass === '1') {
            hash.action_required = '<b>' + hash.action_required + '</b>';
        }
        hash.assigned_to = result.getText('custevent_imp_date_assigned_to');
        if (eventClass === '1') {
            hash.assigned_to = '<b>' + hash.assigned_to + '</b>';
        }
        hash.custtitle = result.getValue('title');
        if (eventClass === '1') {
            hash.custtitle = '<b>' + hash.custtitle + '</b>';
        }

        var status = result.getText('status');
        var escrowAcct = result.getText('custevent28');
        var releasePct = result.getValue('custevent29');

        var printComments = result.getValue('custevent30');
        if (printComments.length == 0) printComments = '(No comments entered)';
        var fullComments = printComments;
        if (printComments.length > 35) printComments = printComments.substring(0, 35) + "...";

        if (escrowAcct != null && escrowAcct.length > 0) fullComments = fullComments + '\nEscrow Account: ' + escrowAcct;
        if (releasePct != null && releasePct.length > 0) fullComments = fullComments + '\nRelease Pct: ' + releasePct;

        // add title text here to the comments...
        hash.comments = '<a title=\"' + fullComments + '\">' + printComments + '</a>';
        if (eventClass === '1') {
            hash.comments = '<b>' + hash.comments + '</b>';
        }
        var viewUrl = nlapiResolveURL('SUITELET', 'customscript_event_action_handler', 'customdeploy_event_action_handler'); // display the view link
        // var viewUrl = "https://system.na2.netsuite.com" + nlapiResolveURL ('SUITELET', 'customscript_event_action_handler', 'customdeploy_event_action_handler');    // display the view link
        // add eventId to the URl
        viewUrl = viewUrl + '&page=markcomplete&eventid=' + hash.eventid;
        hash.cust_mark = '<a href=\"' + viewUrl + '\" target=\"server_commands\">Complete</a>';
        if (eventClass === '1') {
            hash.cust_mark = '<b><a href=\"' + viewUrl + '\" target=\"server_commands\">Complete</a></b>';
        }
        list.addRow(hash);
    }

    return list;
}

function createEventForm(portletRequest) {
    nlapiLogExecution("DEBUG", "SRSEvent_ServerSideLibrary.createEventForm", " Rendering event form");
    var eventId = portletRequest.getParameter('eventid');

    nlapiLogExecution("DEBUG", "SRSEvent_ServerSideLibrary.createEventForm", " eventId = " + eventId);

    var event = nlapiLoadRecord('calendarevent', eventId);

    // setup the fields
    var form = nlapiCreateForm('Event Form', true);

    var companyField = form.addField('company', 'text', 'Deal', null, null); // company/deal
    companyField.setDisplayType('readonly');

    form.addField('title', 'text', 'Title', null, null); // title
    form.addField('startdate', 'date', 'Date', null, null); // startdate
    //var eventTypeField = form.addField('eventtype','select','Event Type',null,null);    // event type

    form.addField('cust_markcomplete', 'checkbox', 'Mark Complete', null, null); // status
    form.addField('comments', 'longtext', 'Comments', null, null); // comments

    var eventIdField = form.addField('eventid', 'integer', null, null, null); // eventid
    eventIdField.setDisplayType('hidden');
    var pageField = form.addField('page', 'text', null, null, null); // string
    pageField.setDisplayType('hidden');

    // set the values for the fields where applicable
    var hash = new Array();
    hash.company = event.getFieldText('company');
    hash.title = event.getFieldValue('title');
    hash.startdate = event.getFieldValue('startdate');
    hash.comments = event.getFieldValue('custevent30');
    //hash.eventtype    = event.getFieldValue('custevent27');
    hash.eventid = eventId;
    hash.page = 'updateevent';

    // add list of event types
    //eventTypeField.addSelectOption('foo',event.getFieldValue('custevent27'));

    form.setFieldValues(hash);

    form.addSubmitButton('Update');
    form.addResetButton('Reset');

    form.setScript('customscript_event_action_handler');

    return form;
}

function dateSortOrder(a, b) {
    var _x = a.getValue('startdate');
    var _y = b.getValue('startdate');

    if (_x == null) _x = 0;
    if (_y == null) _y = 0;

    var x = (new Date(_x)).getTime();
    var y = (new Date(_y)).getTime();

    if (x < y) {
        return -1;
    } else if (x > y) {
        return 1;
    } else {
        return -1;
    }
}