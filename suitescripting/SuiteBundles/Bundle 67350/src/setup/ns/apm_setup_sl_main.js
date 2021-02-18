/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       21 Oct 2015     jmarimla         Roles access
 * 2.00       06 Nov 2015     jmarimla         Employees access
 * 3.00       11 Nov 2015     jmarimla         Changed help text; fix increment bug
 * 4.00       23 Sep 2016     jmarimla         Include SQM
 * 5.00       13 Jan 2017     jmarimla         Remove inactive employees
 * 6.00       31 Jan 2017     jmarimla         Fixed governance issue
 * 7.00       07 Jun 2017     jmarimla         Includee WSA and WSOD
 * 8.00       04 Aug 2017     jmarimla         Include SPA
 * 9.00       18 Aug 2017     jmarimla         Include SPD
 * 10.00      03 Nov 2017     jmarimla         Include SCPM     
 * 11.00      05 Jan 2017     jmarimla         Include SPJD 
 * 12.00      05 Jan 2017     jmarimla         Include CM 
 * 13.00      15 Feb 2018     jmarimla         Include CD  
 * 14.00      11 Jun 2018     jmarimla         Translation engine
 * 15.00      29 Jun 2018     jmarimla         Translation readiness
 * 16.00      28 Sep 2018     jmarimla         Include PRF
 *
 */

var translationStrings = psgp_apm.translation10.load();
var onServerLog = true;
var MSG_TITLE = 'APM SETUP SL MAIN';
var apmServLib = psgp_apm.serverlibrary;
var logger = new psgp_apm.serverlibrary.logger(MSG_TITLE, false);
logger.enable();

var SCRIPTID = {
        DB : '_apm_db_sl_main'
      , SIA : '_apm_sia_sl_main'
      , SPM : '_apm_spm_sl_main'
      , SSA : '_apm_ssa_sl_main'
      , SQM : '_apm_sqm_sl_main'
      , WSA : '_apm_wsa_sl_main'
      , WSOD : '_apm_wsod_sl_main' 
      , SPA : '_apm_spa_sl_main'
      , SPD : '_apm_spd_sl_main'
      , SCPM : '_apm_scpm_sl_main' 
      , SPJD : '_apm_spjd_sl_main'
      , CM : '_apm_cm_sl_main'
      , CD : '_apm_cd_sl_main'
      , PRF : '_apm_prf_sl_main'
};

function entryPoint(request, response){

    switch (request.getMethod()) {
    case 'GET':
        getData(request, response);
        MSG_TITLE = 'getData Return';
        break;
    case 'POST':
        postData(request, response);
        MSG_TITLE = 'postData Return';
        break;
    }
}

function getData(request, response) {
    var form = nlapiCreateForm(translationStrings.apm.setup.label.apmsetup());

    //define components
    var fHelp = form.addField('custpage_f_help', 'help', translationStrings.apm.setup.label.setuppermissionlabel());

    var permissionsTab = form.addTab('custpage_tab_permissions', 'Permissions');

    var slRolesAccess = form.addSubList('custpage_sl_access_roles', 'inlineeditor', translationStrings.apm.common.label.roles(), 'custpage_tab_permissions');
    var slRolesAccess_fRole = slRolesAccess.addField('custpage_sl_access_role', 'select', translationStrings.apm.common.label.role(), '-118');
    slRolesAccess_fRole.setMandatory(true);
    var slRolesAccess_ftop10 = slRolesAccess.addField('custpage_sl_access_role_top10', 'checkbox', translationStrings.apm.setup.top10mostutilized());
    slRolesAccess_ftop10.setDefaultValue('T');

    var slEmployeesAccess = form.addSubList('custpage_sl_access_employees', 'inlineeditor', translationStrings.apm.setup.label.employees(), 'custpage_tab_permissions');
    var slEmployeesAccess_fEmployee = slEmployeesAccess.addField('custpage_sl_access_employee', 'select', translationStrings.apm.setup.label.employee(), 'employee');
    slEmployeesAccess_fEmployee.setMandatory(true);
    var slEmployeesAccess_ftop10 = slEmployeesAccess.addField('custpage_sl_access_employee_top10', 'checkbox', translationStrings.apm.setup.top10mostutilized());
    slEmployeesAccess_ftop10.setDefaultValue('T');

    var bSubmit = form.addSubmitButton(translationStrings.apm.common.label.save());
    var apmDbLink = nlapiResolveURL('SUITELET', 'customscript'+SCRIPTID.DB, 'customdeploy'+SCRIPTID.DB);
    var cancelScript = "window.location = '"+apmDbLink+"'";
    var bCancel = form.addButton('custpage_b_cancel', translationStrings.apm.common.button.cancel(), cancelScript );

    //enter current settings
    var sc = new Array();
    sc.push(new nlobjSearchColumn('custrecord_apm_setup_ra_role'));
    sc.push(new nlobjSearchColumn('custrecord_apm_setup_ra_top10'));
    var searchResults = nlapiSearchRecord('customrecord_apm_setup_roles_access', null, null, sc);
    var slRow = 1;
    for (var i in searchResults) {
        var role = searchResults[i].getValue('custrecord_apm_setup_ra_role');
        var top10 = searchResults[i].getValue('custrecord_apm_setup_ra_top10');
        if (!role) continue;
        slRolesAccess.setLineItemValue('custpage_sl_access_role', slRow, role);
        slRolesAccess.setLineItemValue('custpage_sl_access_role_top10', slRow, top10);
        slRow++;
    }

    sc = new Array();
    sc.push(new nlobjSearchColumn('custrecord_apm_setup_ea_employee'));
    sc.push(new nlobjSearchColumn('custrecord_apm_setup_ea_top10'));
    searchResults = nlapiSearchRecord('customrecord_apm_setup_employees_access', null, null, sc);
    slRow = 1;
    var employees = new Array();
    for (var i in searchResults) {
        var employee = searchResults[i].getValue('custrecord_apm_setup_ea_employee');
        employees.push(employee);
    }
    employees = (employees && employees.length > 0) ? filterEmployeesWithAccess(employees) : new Array();
    logger.debug('filtered employees ids', employees);
    
    for (var i in searchResults) {
        var employee = searchResults[i].getValue('custrecord_apm_setup_ea_employee');
        var top10 = searchResults[i].getValue('custrecord_apm_setup_ea_top10');
        if (!employee || (employees.indexOf(employee) == -1)) continue;
        slEmployeesAccess.setLineItemValue('custpage_sl_access_employee', slRow, employee);
        slEmployeesAccess.setLineItemValue('custpage_sl_access_employee_top10', slRow, top10);
        slRow++;
    }

    response.writePage(form);

};

function postData(request, response) {
    
    
    //delete records with parent
    var parentSearchResults = nlapiSearchRecord('customrecord_apm_setup_parent', null, null, null);
    var deletedParents = new Array();
    for (var i in parentSearchResults) {
        var id = parentSearchResults[i].getId();
        var parent = nlapiLoadRecord('customrecord_apm_setup_parent', id);
        while (parent.getLineItemCount('recmachcustrecord_apm_setup_ea_parent') > 0) {
            parent.removeLineItem('recmachcustrecord_apm_setup_ea_parent', 1);
        }
        nlapiSubmitRecord(parent);
        deletedParents.push(nlapiDeleteRecord('customrecord_apm_setup_parent', id));
    }
    
    //delete existing
    var rolesSearchResults = nlapiSearchRecord('customrecord_apm_setup_roles_access', null, null, null);
    for (var i in rolesSearchResults) {
        var id = rolesSearchResults[i].getId();
        nlapiDeleteRecord('customrecord_apm_setup_roles_access', id);
    }

    var employeesSearchResults = nlapiSearchRecord('customrecord_apm_setup_employees_access', null, null, null);
    for (var i in employeesSearchResults) {
        var id = employeesSearchResults[i].getId();
        nlapiDeleteRecord('customrecord_apm_setup_employees_access', id);
    }

    //save new settings
    var rolesAccessCount = request.getLineItemCount('custpage_sl_access_roles');
    var rolesRecIds = new Array();
    var roles = new Array();
    for (var i = 1; i < rolesAccessCount + 1; i++) {
        var role = request.getLineItemValue('custpage_sl_access_roles', 'custpage_sl_access_role', i);
        var top10 = request.getLineItemValue('custpage_sl_access_roles', 'custpage_sl_access_role_top10', i);
        var record = nlapiCreateRecord('customrecord_apm_setup_roles_access');
        record.setFieldValue('custrecord_apm_setup_ra_role', role);
        record.setFieldValue('custrecord_apm_setup_ra_top10', top10);
        rolesRecIds.push(nlapiSubmitRecord(record));
        roles.push(role);
    }
    logger.debug('setup roles ids', rolesRecIds);

    var employeesAccessCount = request.getLineItemCount('custpage_sl_access_employees');
    var employees = new Array();
    for (var i = 1; i < employeesAccessCount + 1; i++) {
        var employee = request.getLineItemValue('custpage_sl_access_employees', 'custpage_sl_access_employee', i);
        employees.push(employee);
    }
    employees = (employees && employees.length > 0) ? filterEmployeesWithAccess(employees) : new Array();
    logger.debug('filtered employees ids', employees);
    
    var newParentRec = nlapiCreateRecord('customrecord_apm_setup_parent');
    //newParentRec.setFieldValue('name', 'pseudo parent record');
    for (var i = 1; i < employeesAccessCount + 1; i++) {
        var employee = request.getLineItemValue('custpage_sl_access_employees', 'custpage_sl_access_employee', i);
        var top10 = request.getLineItemValue('custpage_sl_access_employees', 'custpage_sl_access_employee_top10', i);
        newParentRec.selectNewLineItem('recmachcustrecord_apm_setup_ea_parent');
        newParentRec.setCurrentLineItemValue('recmachcustrecord_apm_setup_ea_parent', 'custrecord_apm_setup_ea_employee', employee);
        newParentRec.setCurrentLineItemValue('recmachcustrecord_apm_setup_ea_parent', 'custrecord_apm_setup_ea_top10', top10);
        newParentRec.commitLineItem('recmachcustrecord_apm_setup_ea_parent');
    }
    var parentId = nlapiSubmitRecord(newParentRec);    
    
    logger.debug('parent id', parentId);

    //set deployment settings
    var deployIds = getDeploymentIds();
    logger.debug('deploy ids', deployIds);

    if (deployIds && (deployIds.length <= Object.keys(SCRIPTID).length)) {
        var submitDeploy = new Array();
        for (var i in deployIds) {
            var sdRec = nlapiLoadRecord('scriptdeployment', deployIds[i]);

            sdRec.setFieldValue('allemployees', 'F');
            sdRec.setFieldValue('allpartners', 'F');
            sdRec.setFieldValue('allroles', 'F');

            sdRec.setFieldValues('audslctrole', roles);
            sdRec.setFieldValues('audemployee', employees);
            submitDeploy.push(nlapiSubmitRecord(sdRec));
        }
        logger.debug('submit deploy', submitDeploy);
    }

    nlapiSetRedirectURL('SUITELET', 'customscript'+SCRIPTID.DB, 'customdeploy'+SCRIPTID.DB, null, null);
};

function getDeploymentIds() {
    var sf = new Array();
    var sc = new Array();

    sf = [
        ['scriptid', 'is', 'customdeploy'+SCRIPTID.DB]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SIA]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SPM]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SSA]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SQM]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.WSA]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.WSOD]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SPA]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SPD]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SCPM]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.SPJD]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.CM]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.CD]
      , 'or'
      , ['scriptid', 'is', 'customdeploy'+SCRIPTID.PRF]
    ];

    var searchResults = nlapiSearchRecord('scriptdeployment', null, sf, sc);

    var ids = new Array();
    for (var i in searchResults) {
        ids.push(searchResults[i].getId());
    }

    return ids;
};

function filterEmployeesWithAccess( employees ) {
    var sf = new Array();
    var sc = new Array();

    sf.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    sf.push(new nlobjSearchFilter('giveaccess', null, 'is', 'T'));
    sf.push(new nlobjSearchFilter('internalid', null, 'anyof', employees));

    var searchResults = nlapiSearchRecord('employee', null, sf, sc);

    var ids =  new Array();
    for (var i in searchResults) {
        ids.push(searchResults[i].getId());
    }

    return ids;
};
