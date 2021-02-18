/**
 * Module Description
 * 
 * Version    Date            Author           	Remarks
 * 1.00       30 Jul 2014     smccurry			This is a new start on Dual Entry using the DataTables jQuery plugin as the basis.
 * 1.01		  01 Aug 2014	  smccurry			Installed the initial working version on Production.
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var deStatus = {'de1':'Dual Entry 1', 'de2':'Dual Entry 2', 'admin':'Admin', 'review':'Review'};

function createDataTable(request, response){
	if(request.getMethod() == 'GET') {
		var mainPage = buildTable(request, response);
//		var mainPage = buildMaintenancePage(request, response);
        response.writePage(mainPage);
	}
}

function buildTable(request, response) {
	if(request.getMethod() == 'GET') {
		
		
		var dualEntryUsers = createDualEntryUsersObject();
		var curUser = nlapiGetContext().getUser();
		curUser = '_' + curUser;
		var userRole = dualEntryUsers[curUser].role;

		try { 
			var userRole = dualEntryUsers[curUser].role; 
		}
		catch(e){ 
			throw 'You are not on the custom record list: Exchange Dual Entry Users List to access this Suitelet.'; 
		}
		
		var form = nlapiCreateForm('Exchange Records for Dual Entry - ' + deStatus[userRole]);  //Setup the generation form
		
		if(userRole == 'admin') {
			var usersList = form.addField('custpage_userslink', 'inlinehtml', '');
			userslistHTML = '&nbsp;&nbsp;&nbsp;<a href="/app/common/custom/custrecordentrylist.nl?rectype=425" target="_blank" style="font-size:14px">Manage Dual Entry User Access</a><br>&nbsp;';
			usersList.setDefaultValue(userslistHTML);
			usersList.setLayoutType('normal', 'startcol');
		}
		
		var modalField = form.addField('custpage_modal', 'inlinehtml', '');
		modalField.setDefaultValue(buildModalHTML());
//		modalField.setDisplayType('hidden');
		modalField.setLayoutType('normal', 'startcol');
		
		var recList = form.addField('custpage_admin_list', 'inlinehtml', '');
		var listHTML = '';
		listHTML += '<div id="div_sample"></div>';
		listHTML += '<table id="example" class="table table-bordered table-condensed" cellspacing="0" width="100%" style="font-size:12px">'; //table-striped 
		listHTML += '<thead>';
		listHTML += '<tr>';
		listHTML += '<th>ID</th>';
		listHTML += '<th>Deal</th>';
		listHTML += '<th>Shareholder</th>';
		listHTML += '<th>Amount</th>';
		listHTML += '<th>Pay Type</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>DE1 Status</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>DE2 Status</th>';
		listHTML += '<th>Comment</th>';
		listHTML += '<th>LOT</th>';
		listHTML += '<th>VIEW</th>';
		listHTML += '<th>EDIT</th>';
		
		listHTML += '<th class="offsitede">Allow Off-Site Data Entry</th>';
		
		if(userRole == 'admin' || userRole == 'review' || userRole == 'de1' || userRole == 'de2') {
			listHTML += '<th>Reviewed By</th>';
			listHTML += '<th>REVIEW</th>';
			listHTML += '<th>RC</th>';
		}
		listHTML += '</tr>';
		listHTML += '</thead>';
		
		listHTML += '<thead class="testHead">';
		listHTML += '<tr>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>&nbsp;</th>';
		
		listHTML += '<th class="offsitede">&nbsp;</th>';
		
		if(userRole == 'admin' || userRole == 'review' || userRole == 'de1' || userRole == 'de2') {
			listHTML += '<th>&nbsp;</th>';
			listHTML += '<th>&nbsp;</th>';
			listHTML += '<th>&nbsp;</th>';
		}
		listHTML += '</tr>';
		listHTML += '</thead>';

		listHTML += '<tfoot>';
		listHTML += '<tr>';
		listHTML += '<th>ID</th>';
		listHTML += '<th>Deal</th>';
		listHTML += '<th>Shareholder</th>';
		listHTML += '<th>Amount</th>';
		listHTML += '<th>Pay Type</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>DE1 Status</th>';
		listHTML += '<th>&nbsp;</th>';
		listHTML += '<th>DE2 Status</th>';
		listHTML += '<th>Comment</th>';
		listHTML += '<th>LOT</th>';
		listHTML += '<th>VIEW</th>';
		listHTML += '<th>EDIT</th>';
		
		listHTML += '<th class="offsitede">Allow Off-Site Data Entry</th>';	
		
		if(userRole == 'admin' || userRole == 'review' || userRole == 'de1' || userRole == 'de2') {
			listHTML += '<th>Reviewed By</th>';
			listHTML += '<th>REVIEW</th>';
			listHTML += '<th>RC</th>';
		}
		listHTML += '</tr>';
		listHTML += '</tfoot>';
		
		listHTML += '<tbody>';
		listHTML += '</tbody>';

		listHTML += '</table>';
		
		
		recList.setDefaultValue(listHTML);
		recList.setLayoutType('outsidebelow');
		
		var cssField = form.addField('custpage_style', 'inlinehtml', '', null, '');
		var cssStyle = '<link rel="stylesheet" href="//cdn.datatables.net/1.10.1/css/jquery.dataTables.css" />';
		cssStyle += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css"/>';
		cssStyle += '<link rel="stylesheet" href="//cdn.datatables.net/plug-ins/725b2a2115b/integration/bootstrap/3/dataTables.bootstrap.css"/>';
		cssStyle += '<style>body { font-size: 80%; } .payAmount { text-align:right;} .ui-dialog { margin-left: 300px;margin-top: 300px;overflow: hidden;padding: 0.2em;position: absolute; width: 300px;}';
		cssStyle += '#overlay {    position: fixed;     top: 0;    left: 0;    width: 100%;    height: 100%;    background: #000;    opacity: 0.5;    filter: alpha(opacity=50);}#modal {    position:absolute;    background:url(tint20.png) 0 0 repeat;    background:rgba(0,0,0,0.2);    border-radius:14px;    padding:8px;}#content {    border-radius:8px;    background:#fff;    padding:20px;}#close {    position:absolute;    background:url(close.png) 0 0 no-repeat;    width:24px;    height:27px;    display:block;    text-indent:-9999px;    top:-7px;    right:-7px;}';
		cssStyle += '.modal {  role: dialog; aria-labelledby:myModalLabel }';
		cssStyle += '<link rel="stylesheet" href="//code.jquery.com/ui/1.11.0/themes/smoothness/jquery-ui.css">';
		cssStyle += '</style>';
		cssField.setDefaultValue(cssStyle);
		
		var scriptField = form.addField('custpage_script', 'inlinehtml', '', null, '');
		var htmlscript = '';
		htmlscript += '<script src="//code.jquery.com/jquery-1.11.1.min.js"></script>';
		htmlscript += '<script src="//cdn.datatables.net/1.10.1/js/jquery.dataTables.min.js"></script>';
		htmlscript += '<script src="//cdn.datatables.net/plug-ins/725b2a2115b/integration/bootstrap/3/dataTables.bootstrap.js"></script>';
		htmlscript += '<script src="//cdn.datatables.net/plug-ins/725b2a2115b/api/fnReloadAjax.js"></script>';
		htmlscript += '<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>';
		scriptField.setDefaultValue(htmlscript);
		
		// Set the userRole in a hidden field on the page in case we need it later.
		var userField = form.addField('custpage_userrole', 'text', '', null, '');
		userField.setDisplayType('hidden');
		userField.setDefaultValue(userRole);

		/*
		 * If the NetSuite role is NOT NS_ROLE_OFFSITE_DUALENTRY_ONLY (reference to ACQ_LOT_DE_Library.js) and
		 * if the user's Exchange Dual Entry User Type is 'admin' or 'review', add the 'Update Off-Site Data Entry Exchange Records' button.
		 */
		if(nlapiGetRole() != NS_ROLE_OFFSITE_DUALENTRY_ONLY && userRole == 'admin') {
    		/*
    		 * This button calls a function that updates the "allow off-site data entry" checkbox on exchange records that were changed.
    		 */
    		form.addButton('custpage_button_upadte_de', 'Update Off-Site Data Entry Exchange Records', 'updateExchangeRecords');
		}
		
		form.setScript('customscript_acq_lot_de_deuser_list_cs');
		
		return form;
	}
}

function buildModalHTML() {
	var mHTML = '';
//	var mHTML = '<button id="_view" class="btn btn-xs btn-success" data-toggle="modal" data-target="#myModal">VIEW</button>';
//	var mHTML = '<button id="'+ rowID +'_view" type="button" class="btn btn-xs btn-success viewBtn" style="margin:1px;">VIEW</button>';
//	mHTML += 'Launch demo modal';
//	mHTML += '</button>';

	mHTML += '<!-- Modal -->';
	mHTML += '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">';
	mHTML += '<div class="modal-dialog">';
	mHTML += '<div class="modal-content">';
	mHTML += '<div class="modal-header">';
	mHTML += '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>';
	mHTML += '<h4 class="modal-title" id="myModalLabel">Modal title</h4>';
	mHTML += '</div>';
	mHTML += '<div class="modal-body">';
	mHTML += '</div>';
	mHTML += '<div class="modal-footer">';
	mHTML += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
	mHTML += '<button type="button" class="btn btn-primary">Save changes</button>';
	mHTML += '</div>';
	mHTML += '</div>';
	mHTML += '</div>';
	mHTML += '</div>';
	return mHTML;
}


