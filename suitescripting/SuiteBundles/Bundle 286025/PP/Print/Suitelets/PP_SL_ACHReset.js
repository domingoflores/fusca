
function suitelet(request,response){
		
	if(request.getMethod() == 'GET'){
		
		var form = createForm(request);
		$PPS.writeFlashMessagesToForm(form);
		var sublist = createSublist(form);
		try{
			
			var url = $PPS.nlapiOutboundSSO();
			url = $PPS.insertPathIntoURL(url,'payments/ach/processed_items');
			
			var ppsService = new $PPS.Service();
			var pagerSettings = {
					resourceUrl: url,
					itemsContainer: 'items',
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
		
	}
	else{
		var procdate = request.getParameter('custpage_procdate');
		var context = nlapiGetContext();
		
		if(!procdate){
			nlapiCreateError('PP_NO_PROCDATE','Missing the custpage_procdate parameter');
		}
		
		//TODO: SENDING PROCDATE AS BOTH post data and get query data
		// FIND CLEANER WAY THAT IS MORE CONSITANT WITH PPS
		var url = $PPS.nlapiOutboundSSO();
		url = $PPS.insertPathIntoURL(url,'payments/ach/reset_items');
		
		url += '&procdate=' + encodeURIComponent(procdate);
		
		// Send POST to PPS server to clear items
		var ppsService = new $PPS.Service();
		try{
			var respData = ppsService.sendRequest(url,{procdate: procdate},{'accept' : 'application/json'},'POST');
			nlapiLogExecution('AUDIT','Items Reset',respData.item_count+' items with procdate ' + respData.procdate + ' were successfully reset.');
			$PPS.Session.setFlash('success','The ACH items were successfully reset.');
		}
		catch(e){
			var resultObj = ppsService.getLastResult();
			
			if(resultObj){
				nlapiLogExecution('error', resultObj.errorType, resultObj.errorMessage);
			}
			else{
				$PPS.logException(e);
			}
			$PPS.Session.setFlash('error','There was an error resetting the ACH items.');
		}
		
		// Redirect to self
		nlapiSetRedirectURL('SUITELET',context.getScriptId(),context.getDeploymentId());
		
	}
			
}

function createForm(request){
	var form = nlapiCreateForm('ACH Filegen Reset');
	
	form.setScript('customscript_pp_cs_ach_reset');
	var procdateField = form.addField('custpage_procdate','text');
	procdateField.setDisplayType('hidden');
	
	form.addPageLink('crosslink', 'ACH File Generation', nlapiResolveURL('SUITELET','customscript_pp_sl_ach_file_gen','customdeploy_pp_sl_ach_file_gen'));
	
	return form;
}

function createSublist(form){
	var sublist = form.addSubList('custpage_filegens', 'list', 'ACH File Generations Jobs');
	
	sublist.addField('custpage_procdate', 'text', 'Procdate');
	sublist.addField('custpage_job_id', 'text', 'Job ID');
	sublist.addField('custpage_item_count', 'text', 'Item Count');
	sublist.addField('custpage_actions', 'text', 'Actions');
	
	return sublist;
}

function writeItemsToSublist(items,sublist){
	
	var rows = [];
	for(var i = 0; i < items.length; i++){
		var item = items[i];
		
		var obj = {
				custpage_procdate : item.procdate,
				custpage_job_id : item.job_id,
				custpage_item_count : item.item_count,
				custpage_actions : '<a href="javascript:submitForm(\''+item.procdate+'\')" >Reset ACH Items</a>'
		};
		
		rows.push(obj);
	}
	
	sublist.setLineItemValues(rows);
}
