/*
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Oct 2014     sstreule		   Create file in Staging
 * 1.01       30 Oct 2014     smccurry		   Fixed bugs, added numToHex, hexToNum functions and removed Deal Searches to be a dynamic function
 * 
 * 
 */


function checkTempDealName(type){
	//Set a variable to control the Execution Log Level
	var logLevel = 'ERROR';

	//Upon record Creation, and maybe scheduled, check to see if the Temp Deal Name is valid
	//Check to make sure this only runs if the type is create
	if(type != 'create'){
		//DO NOTHING
	}else{
		//The type is create so we need to check to see if the Temp Deal Name exists
		
		var newRec = nlapiGetNewRecord();
		var onlineRegRecID = newRec.getId();
		var onlineRegRec = nlapiLoadRecord('customrecord13', onlineRegRecID);
		var tempDealName = onlineRegRec.getFieldValue('custrecord_temp_deal_name');
		
		//Get the temp deal code and see if it matches any deal codes
		if((tempDealName != '') && (tempDealName != null)){
			//Put the HEX on.  Get the VooDoo going.
			//Need to change the tempDealName to be a number and compare it with the ID's of the Deals
			var tempNonHex = hexToNum(tempDealName);
			//Check to see if tempNonHex is NaN
			if(isNaN(tempNonHex) == true){
				var dealResults = null;
			}else{
				//The Search is on like donkey kong
				//Begin the search to gather all Deals (Category = 1)
				//filter2 = id  search on tempNonHex	
				var dealResults = new Array();
					dealResults = dealSearch('internalid', tempNonHex);
			}
			
			if((dealResults != null) && (dealResults != '')){
			
				if(dealResults.length == 1){
					//Get the Company Name from the results in the companyname column
					var companyName = dealResults[0].getValue('companyname');
					//Set the companyName to be the result
					onlineRegRec.setFieldValue('custrecord_temp_deal_name', companyName);
					//Submit the record with the custrecord_temp_deal_name set
					nlapiSubmitRecord(onlineRegRec);
				}else if(dealResults.length > 1){
					//Log the error
					nlapiLogExecution(logLevel, '', '');
				}else{
					//DO NOTHING
				}
				
			}else if((dealResults == null) || (dealResults == '')){
				//Do a search to see of the value in the Temp Deal Code equals any Deal Names
				//filter2 = companyname  search on tempDealName
				var dealResults2 = new Array();
					dealResults2 = dealSearch('companyname', tempDealName);
				
				if((dealResults2 != null) && (dealResults2 != '')){
					
					if(dealResults2.length == 1){
						//Get the Company Name from the results in the companyname column
						var companyName2 = dealResults2[0].getValue('companyname');
						//Set companyName2 to be the result
						onlineRegRec.setFieldValue('custrecord_temp_deal_name', companyName2);
						//Submit the record with the custrecord_temp_deal_name set
						nlapiSubmitRecord(onlineRegRec);
					}else if(dealResults2.length > 1){
						//Log the error
						nlapiLogExecution(logLevel, '', '');
					}else{
						//DO NOTHING
					}
						
				}else{
					//DO NOTHING
				}
			
			}else{
				//DO NOTHING
			}
			//If still no match, then just run away in defeat
		}else{
			//Log the error that there is no value in the Deal Name Field on the Online Registration Record
			nlapiLogExecution(logLevel, '', '');
		}
	}
}
	


function dealSearch(filter2, criteria2){
	var filters = new Array();
	filters.push(new nlobjSearchFilter('category', null, 'is', '1'));
	filters.push(new nlobjSearchFilter(filter2, null, 'is', criteria2));

	var columns = new Array();
		columns.push(new nlobjSearchColumn('companyname'));
	
	return nlapiSearchRecord('customer', null, filters, columns);
	
}

function numToHex(theNumber)
{
	return theNumber.toString(16);
}

function hexToNum(hexNumber)
{
	return parseInt(hexNumber,16);
}