/**
 * This module contains the client script that pairs with PP_LIB_FormFilters.js suitelet script.
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Nov 2015     MMenlove
 *
 */


function NSFormFilterClientHelper(){
	
	var filters = [];
	this.registerFilters = function(filtersToRegister){
		filters = filtersToRegister;
	};
	
	this.onFieldChange = function(type, name, linenum){
		var value =  nlapiGetFieldValue(name);
		
		var filter = findFilterByName(name);
		if(!filter){
			console.log('Filter not found for ' + name);
			return false;
		}

		switch(filter.type){
		case 'select':
		case 'date':
		case 'text':
		case 'checkbox':
			var params = {};
			if(typeof filter.connectedField == 'string'){
				
				if(filter.connectedRule == 'interconnected'){
					var otherValue = nlapiGetFieldValue(filter.connectedField);
					// only set params when both date filters are set or cleared
			    	if(value && otherValue || !value && !otherValue){
			    		params[name] = value;
			    		params[filter.connectedField] = otherValue;
			        		
			        	var p = insertParams(document.location.search,params);
			            setWindowChanged(window, false);
			            document.location.search = p;
			    	}
				}
				else if(filter.connectedRule == 'clearconnected'){
					params[name] = value;
		    		params[filter.connectedField] = '';
		        		
		        	var p = insertParams(document.location.search,params);
		            setWindowChanged(window, false);
		            document.location.search = p;
				}
		    	
			}
			else{
				params[name] = value;
				
				var p = insertParams(document.location.search,params);
		        setWindowChanged(window, false);
		        document.location.search = p;
			}
			
			break;
		}
		
		return true;
	};
	
	function insertParams(url,params){
		var kvp = url.substr(1).split('&');
		
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
		return kvp.join('&');
	}
	
	function findFilterByName(name){
		// try and find field in the list of filters
		for(var i = 0; i < filters.length; i++){
			if(filters[i].fieldId == name){
				return filters[i];
			}
		}
		return null;
	}
}