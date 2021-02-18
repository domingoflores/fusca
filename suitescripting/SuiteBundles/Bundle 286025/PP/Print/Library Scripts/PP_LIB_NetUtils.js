/**
 * This library contains a collection of classes and static functions for dealing with internal and external web services.
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Mar 2016     Max Menlove
 *
 */

/**
 * Service class to help mainstream interactions with the PPS service.
 * 
 * Sample usage:
 * var service = new $PPS.Service();
 * 
 * try{
 * 		var result = service.sendRequest(url,null,null,'GET');
 * }
 * catch(e){
 * 		var resultObj = service.getLastResult();
 * 
 * 		nlapiLogExecution('error', resultObj.errorType, resultObj.errorMessage);
 * }
 */
$PPS.Service = function(){
	
	var lastResult = null;
	
	// Make this public so that the default can be overridden
	this.defaultResponseHandler = function(resp){
		var result = {
				wasError: false,
				response: resp,
				errorMessage: null,
				errorType: null,
				data : null // parsed data
		};
		
		if(result.response.getCode() != '200'){
			result.wasError = true;
			result.errorType = 'httpcode';
			result.errorMessage = "Error: HTTP code " + result.response.getCode();
			
			try{
				var parsedResult = JSON.parse(result.response.getBody());
				result.data = parsedResult;
			}
			catch(e){
				// unable to parse response body as json
				nlapiLogExecution('DEBUG','Response Code Not 200 and unable to parse response body as json',result.response.getBody());
			}
	    }
		else{
			try{
				var parsedResult = JSON.parse(result.response.getBody());
				if(parsedResult.commandstatus == 'Success'){
					result.data = parsedResult;
				}
				else if(parsedResult.commandstatus == 'Fail'){
					result.wasError = true;
					result.errorType = 'command_error';
					result.errorMessage = parsedResult.commanderrmsg || parsedResult.errmsg;
					result.data = parsedResult;
				}
				else{
					// command status not specified, treat as success for forward compatibility
					result.data = parsedResult;
				}
			}
			catch(e){
				result.wasError = true;
				result.errorType = 'parse_error';
				result.errorMessage = 'Error: unable to parse JSON in response body';
			}
		}
		
		lastResult = result;
		
		if(result.wasError){
			throw nlapiCreateError(result.errorType,result.errorMessage);
		}
		else{
			return result.data;
		}
	};
	
	this.getLastResult = function(){
		return lastResult;
	};
	
	this.sendRequest = function(url,postData,headersObj,httpMethod,responseHandler){
		
		var result = {
				wasError: false,
				response: null,
				errorMessage: null,
				errorType: null,
				data : null // parsed data
		};
		
		if(!headersObj){
			headersObj = {};
		}
		
		// application/json is default content-type
		if(!headersObj['Content-Type']){
			headersObj['Content-Type'] = 'application/json';
		}
		
		var postBody = postData;
		if(headersObj['Content-Type'] == 'application/json' && postData && typeof postData == 'object'){
			postBody = JSON.stringify(postData);
		}
		
		headersObj.Accept = 'application/json';
		
		if(!httpMethod){
			httpMethod = 'GET';
		}
		
		var resp = nlapiRequestURL(url,postBody,headersObj,httpMethod);
		
		if(responseHandler && typeof responseHandler == 'function'){
			return responseHandler.call(this,resp);
		}
		else{
			return this.defaultResponseHandler(resp);
		}
	};
	
	// Private Methods
	
};

/**
 * Data paging class for services that support an index with paging capabilities. This class also
 * attempts to follow HATEOS links where possible.
 * 
 * Sample Usage:
 * 
 *  var service = new $PPS.Service();
 *  
 *  var pagerSettings = {
 *					resourceUrl: url,
 *					itemsContainer: 'items',
 *					pagingContainerProperty: 'paging'
 *			};
 * 
 *  var pager = new $PPS.ResourcePager(pagerSettings,service);
 *  
 *  // get results by page number
 *  var items = pager.page(pageNumber);
 *  
 *  // get page details such as itemsPerPage
 *  var pageDetails = pager.getPageInfo();
 */
$PPS.ResourcePager = function(options,service){
	
	var pageNumber,pageCount,pageItems,totalItems,pageSize;
	var settings = null;
	var links = [];
	var me = this;
	
	var defaults = {
			pageSize: null,
			pagingContainerProperty: 'Paging',
			itemsContainer : 'Items',
			pagingProperties : {
				pageSize: 'PageSize',
				pageNumber: 'PageNumber',
				pageCount : ['PageCount','Pages'], //paging property can be array
				pageItems : 'PageItems',
				totalItems : 'TotalItems',
				links : 'Links'
			},
			pagingQueryParameters: {
				pageNumber : 'page',
				pageSize :  'pagesize'
			}
			
	};
	
	
	if(typeof options == 'string'){
		settings = defaults;
		settings.resourceUrl = options;
		settings.baseUrl = extractBaseUrl(settings.resourceUrl);
	}
	else if(typeof options == 'object'){
		settings = $PPS.extend(defaults,options);
		// extend nested pagingProperties
		if(options.pagingProperties){
			settings.pagingProperties = $PPS.extend(defaults.pagingProperties,options.pagingProperties);
		}
		
		if(options.pagingQueryParameters){
			settings.pagingQueryParameters = $PPS.extend(defaults.pagingQueryParameters,options.pagingQueryParameters);
		}
		
		if(options.resourceUrl){
			if(!options.baseUrl){
				settings.baseUrl = extractBaseUrl(settings.resourceUrl);
			}
		}
		else if(options.baseUrl && options.href){
			settings.baseUrl = options.baseUrl;
			settings.resourceUrl = options.baseUrl + options.href;
		}
		else{
			throw "Invalid options passed to ResourcePager";
		}
	}
	else{
		throw "Invalid first parameter passed to ResourcePager";
	}
	
	this.service = service;
	// set initial pageSize. The pageSize can be overwritten from server response if the server does not respect our pageSize
	pageSize = options.pageSize; 
	
	this.first = function(){
		var firstLink = findLink(links,'first');
		var url;
		if(firstLink){
			url = settings.baseUrl + firstLink.Href;
		}
		else{
			url = buildUrl(this.pageNumber);
		}
		var respObj = get(url);
		return respObj[settings.itemsContainer];
	};
	
	this.next = function(){
		//var details = this.getPageInfo();
		if(!pageNumber){
			return this.first();
		}
		else if(pageNumber + 1 > pageCount){
			return false;
		}
		else{
			var nextLink = findLink(links,'next');
			var url;
			if(nextLink){
				url = settings.baseUrl + nextLink.Href;
			}
			else{
				url = buildUrl(pageNumber + 1);
			}
			return get(url)[settings.itemsContainer];
		}
	};
	
	this.page = function(pageNum){
		var pn = parseInt(pageNum);
		if(isNaN(pn)){
			throw 'Page Number must be valid integer';
		}
		return get(buildUrl(pn))[settings.itemsContainer];
	};
	
	this.all = function(){
		var items = [];
		items = items.concat(this.first());
		
		
		var moreItems = false;
		while(moreItems = this.next()){
			items = items.concat(moreItems);
		}
		return items;
	};
	
	
	this.setPageSize = function(size){
		pageSize = size;
	};
	
	this.getPageInfo = function(){
		return {
			pageSize : pageSize,
			pageNumber : pageNumber,
			pageCount: pageCount,
			pageItems: pageItems,
			totalItems: totalItems,
			links: links
		};
	};
	
	function buildUrl(pageNumber){
		//TODO: build this smarter
		var url = settings.resourceUrl;
		var queryParams = {};
		if(pageNumber){
			queryParams[settings.pagingQueryParameters.pageNumber] = pageNumber;
		}
		if(pageSize){
			queryParams[settings.pagingQueryParameters.pageSize] = pageSize;
		}
		
		if(!isEmpty(queryParams)){
			url = $PPS.insertParams(url,queryParams);
		}
		
		nlapiLogExecution('DEBUG',url,url);
		return url;
	}
	
	function get(url){
		var resultObj = me.service.sendRequest(url,null,null,'GET');
		var pagingContainer = null;
		if(pagingContainer = resultObj[settings.pagingContainerProperty]){
			pageSize = getPagingPropertyValue(pagingContainer,settings.pagingProperties.pageSize);
			pageNumber = getPagingPropertyValue(pagingContainer,settings.pagingProperties.pageNumber);
			pageCount = getPagingPropertyValue(pagingContainer,settings.pagingProperties.pageCount);
			pageItems = getPagingPropertyValue(pagingContainer,settings.pagingProperties.pageItems);
			totalItems = getPagingPropertyValue(pagingContainer,settings.pagingProperties.totalItems);
			links = getPagingPropertyValue(pagingContainer,settings.pagingProperties.links);
			
			if(typeof pageCount == 'undefined'){
				pageCount = 0;
			}
			
			pageSize = parseInt(pageSize);
			pageNumber = parseInt(pageNumber);
			pageCount = parseInt(pageCount);
			pageItems = parseInt(pageItems);
			totalItems = parseInt(totalItems);
			
			if(typeof links == 'undefined'){
				links = [];
			}
		}
		else{
			// resource doesn't support paging yet..
			pageSize = 1000;
			pageNumber = 1;
			pageCount = 1;
			pageItems = resultObj[settings.itemsContainer].length || 0;
			totalItems = resultObj[settings.itemsContainer].length || 0;
		}
		
		if(!resultObj.hasOwnProperty(settings.itemsContainer)){
			throw nlapiCreateError('PP_Pager_Item_Container_Not_Found','The response object did not contain the expected item container.');
		}
		
		//links
		//query guid
		return resultObj;
	}
	
	/**
	 * Get the value of a paging property in the pagingContainer object.
	 * If an array of values is passed for the pagingProperty, it will return 
	 * the first property value it matches in the container
	 * 
	 * pagingContainer {object} 
	 * pagingProperty {mixed} - can be a string or an array
	 */
	function getPagingPropertyValue(pagingContainer,pagingProperty){
		if(Array.isArray(pagingProperty)){
			for(var i = 0; i < pagingProperty.length; i++){
				if(typeof pagingContainer[pagingProperty[i]] != 'undefined'){
					return pagingContainer[pagingProperty[i]];
				}
			}
		}
		else{
			return pagingContainer[pagingProperty];
		}
		return null;
	}
	
	function findLink(links,rel){
		for(var i = 0; i < links.length; i++){
			if(links[i].Rel == rel){
				return links[i];
			}
		}
	}
	
	function extractBaseUrl(url){
		var pathArray = url.split('/');
		var protocol = pathArray[0];
		var host = pathArray[2];
		return protocol + '//' + host;
	}
	
	
	// checks if object is empty
	function isEmpty(obj) {
	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }

	    return true && JSON.stringify(obj) === JSON.stringify({});
	}
};

/**
 * Insert query parameter object into a full URL. If the query parameters already exist they will be overwritten.
 * 
 * 
 * @param {string} url
 * @param {object} params
 * 
 * @returns {string}
 */
$PPS.insertParams = function(url,params){
	
	var urlParts = url.split('?',2);
	
	var kvp = urlParts[1].split('&');
	
	var keys = Object.keys(params);
	for(k in keys){
		key = encodeURIComponent(keys[k]);
		value = encodeURIComponent(params[keys[k]]);
		
		var i = kvp.length; var x; while (i--) {
	        x = kvp[i].split('=');

	        if (x[0] == key) {
	            x[1] = value;
	            kvp[i] = x.join('=');
	            break;
	        }
	    }

	    if (i < 0) { kvp[kvp.length] = [key, value].join('='); }
	}
	
	return urlParts[0] + '?' + kvp.join('&');
	//return kvp.join('&');
};

/**
 * Insert a path into a URL.
 * 
 * @param {string} ssoUrl
 * @param {string} path
 * 
 * @returns {string}
 * 
 * For Instance
 * 	var url = 'https://pps.piracle.com?oauth_token=afaketoken&accountid=TSTDRV1234';
 *  
 *  var newUrl = $PPS.insertPathIntoURL(url,'/jobs/files');
 *  //results in https://pps.piracle.com/jobs/files?oauth_token=afaketoken&accountid=TSTDRV1234
 *  
 */
$PPS.insertPathIntoURL = function(ssoUrl,path){
	var parts = ssoUrl.split('?',2);
	var pathStrCpy = path || "";
	
	parts[0] = parts[0].replace(/\/$/,'');
	pathStrCpy = pathStrCpy.replace(/^\//,'');
	
	return parts[0] + '/' + pathStrCpy + (parts.length > 1 ? '?' + parts[1] : '');
};