/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Jan 2013     Jason Foglia
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

var errors = [];



function suitelet(request, response){
	
	
	var form = createForm(request);
	var sublist = createSublist(form);
	
	try{
		
		var url = $PPS.nlapiOutboundSSO();
		
		var ppsService = new $PPS.Service();
		var pagerSettings = {
				resourceUrl: url,
				itemsContainer: 'files',
				pagingContainerProperty: 'paging'
		};
		
		var formFilterOptions = {
				 filters : [{
				       	field: 'page',
						label: 'Page',
						type: 'select',
						defaultValue : 1,
						options: function(){return buildPageOptions();},
				       	storeInSession: false
					}]
		};
		
		var nsFormFilter = new NSFormFilter(formFilterOptions,form);
		var filterParams = nsFormFilter.getFilterValues();
		
		var pager = new $PPS.ResourcePager(pagerSettings,ppsService);
		var pageParam = filterParams['page'] || 1;
		var items = pager.page(pageParam);
		
		// Chicken and Egg with setting up form filters; so we call buildPageOptions from anonymous function which
		// gets called after we call filterValues.
		var pageDetails = pager.getPageInfo();
		function buildPageOptions(){
			var options = [];
			for(var i = 1; i <= pageDetails.pageCount; i++){
				options.push([i,"Page " + i]);
			}
			return options;
		}

		nsFormFilter.renderFilters();
		
		writeItemsToSublist(items,sublist);
	}
	catch(e){
		$PPS.logException(e);
		$PPS.addMessageToForm(form,'error',e.toString());
	}
	
	response.writePage(form);
	
	/*var url = $PPS.nlapiOutboundSSO();
	url = url + "&downloaded=0";
	
	nlapiLogExecution('debug', '', url);
	
	var resp = nlapiRequestURL(url);
	var body = resp.getBody();
	
	//nlapiLogExecution('debug', ' ', body.toString().replace("<", "<_"));
	
	parseBody(body);
	
	var error = form.addField('custpage_error', 'inlinehtml');
	error.setDefaultValue(errors.join('<br />'));
	
	response.writePage(form);*/
}


function createForm(request){
	var form = nlapiCreateForm('AvidXchange Self-Managed File Recovery', false);
	
	form.setScript('customscript_pp_cs_file_recovery');
	
	return form;
}

function createSublist(form){
	var sublist = form.addSubList('custpage_pending_jobs', 'list', 'Pending Print Jobs');
	
	sublist.addField('custpage_id', 'text', 'Job ID');
	sublist.addField('custpage_job_type', 'text', 'Job Type');
	sublist.addField('custpage_item_count', 'text', 'Item Count');
	sublist.addField('custpage_ach_count', 'text', 'ACH Count');
	sublist.addField('custpage_void_count', 'text', 'Void Count');
	sublist.addField('custpage_overflow_count', 'text', 'Overflow Count');
	sublist.addField('custpage_created', 'text', 'Created');
	sublist.addField('custpage_url', 'text', 'URL');
	
	return sublist;
}

function writeItemsToSublist(items,sublist){
	var rows = [];
	var reqFileUrl = nlapiResolveURL('SUITELET', 'customscript_pp_sl_filedownloadproxy', 'customdeploy_pp_sl_filedownloadproxy');
	
	for(var i = 0; i < items.length; i++){
		var item = items[i];
		
		var obj = {
				custpage_id : item.id,
				custpage_job_type : item.job_type,
				custpage_item_count : item.item_count,
				custpage_ach_count : item.ach_count,
				custpage_void_count : item.void_count,
				custpage_overflow_count: item.overflow_count,
				custpage_created: item.created,
				custpage_url: '<a href="' + reqFileUrl + "&id=" + item.id  + "&timestamp=" + (new Date().getTime()).toString() + '">File: ' + item.id + '</a>'
		};
		
		rows.push(obj);
	}
	sublist.setLineItemValues(rows);
	
}

function parseError(e){
	if( e instanceof nlobjError ){
		return {
			'message':e.getDetails(),
			'stack':e.getStackTrace()
		};
	}else{
		return {
			'message':e.message,
			'stack': (e.stack || e.stacktrace).split("at").join("<br />")
		};
	}
}