/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/url"],

function(search, url) {
	"use strict";
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	function foundDelimiters(str, delimiters) 
	{
		var i = 0;
		if (!str)
		{
			return false;
		}
		for (i = 0; i < delimiters.length; i+=1)
		{
			if (str.indexOf(delimiters[i]) > -1)
			{
				return true;
			}
		}
		return false;
	}
	function charcheck(str) {

		str = str.replace(/\t/g, " ");
		str = str.replace(/\r/g, " ");
		str = str.replace(/\n/g, " ");
		
		return str;
	}

	
	function getSearchColValue(objControlSrchResSet, objControlSrchRes,
			idx, intColIdx) {

		var strTmpTextVal = "";
		if (!objControlSrchRes[idx])
		{
			return strTmpTextVal;
		}
		// getText
		//log.debug("typeof " + JSON.stringify(objControlSrchRes[idx]));
		
		
		
		strTmpTextVal = objControlSrchRes[idx] && objControlSrchRes[idx].getText(objControlSrchResSet.columns[intColIdx]);
		// getValue
		if (!strTmpTextVal)
		{
			strTmpTextVal = objControlSrchRes[idx] &objControlSrchRes[idx]
					.getValue(objControlSrchResSet.columns[intColIdx]);
		}
		return strTmpTextVal;
	}
	
	function getSavedSearchContents(ssid)
	{
		var objControlSrch = search.load({
			id : ssid
		});

		var objControlSrchResSet = objControlSrch.run();

		// [2.1] Get header line
		var CONST_LINEDELIMITER = "\r\n";
		var column_delimiter = "\t";
		var arrHeaderLine = [];
		var colIdx = 0;
		arrHeaderLine.push("Internal ID");
		for (colIdx = 0; colIdx < objControlSrchResSet.columns.length; colIdx+=1) {
			arrHeaderLine.push(charcheck(objControlSrchResSet.columns[colIdx].label));
		}
		
		var strFileReqInput = arrHeaderLine.join(column_delimiter)+ CONST_LINEDELIMITER;

		// [2.2] Get data lines
		var objPagedData = objControlSrch.runPaged({
			pageSize : 1000
		});
		
		var intProceedCnt = 1;
		var idx = null;
		var arrCurDataline = [];
		var colIdx2 = 0;
		var row = null;
		var strTmpTextVal = "";
		var rowstring = "";
		var maxrowstoreturn = 15000;
		objPagedData.pageRanges.forEach(function(pageRange) 
		{

			var objMyCurPage = objPagedData.fetch({
				index : pageRange.index
			});

			for (idx in objMyCurPage.data) 
			{
				row = objMyCurPage.data[idx];

				if (!row)
				{
					continue;
				}
				rowstring = JSON.stringify(row);
				if (!rowstring)
				{
					continue;
				}
				
				try 
				{
					row = JSON.parse(rowstring);
				}
				catch (e)
				{
					throw "error. Expected row, found2: '" + rowstring + "'" + typeof rowstring;
					
				}
				
				arrCurDataline = [];
				arrCurDataline.push(row.id);
				for (colIdx2 = 0; colIdx2 < objControlSrchResSet.columns.length; colIdx2+=1) 
				{
					var column =  objControlSrchResSet.columns[colIdx2];
					//throw JSON.stringify(row);
					strTmpTextVal = row.values[column.name];
					//throw "column.name " + column.name + " row " + row[column.name] + " all " + JSON.stringify(row);
					arrCurDataline.push(charcheck(strTmpTextVal));
					
				}
				//throw strTmpTextVal;
					// Counting
				intProceedCnt=intProceedCnt+1;
				strFileReqInput += arrCurDataline.join(column_delimiter) + CONST_LINEDELIMITER;
				if (intProceedCnt>maxrowstoreturn)
				{
					return strFileReqInput;
				}
					//throw strFileReqInput + JSON.stringify(row);
			} // proceed each lines
		});
		//throw "strFileReqInput " + strFileReqInput;
		return strFileReqInput;
	}
	//-----------------------------------------------------------------------------------------------------------
	//function: 		replaceCanonicalValues
	//Description: 	Intended to produce map that can be used to word match via regex. 
	//Developer: 	Marko Obradovic
	//Date: 		1/2019
	//-----------------------------------------------------------------------------------------------------------
function replaceCanonicalValues(str)
		{
			var canonical_mapObj = {
					   "Timothy":"Tim"
					};
			
			
			var regex = "\b"+ Object.keys(canonical_mapObj).join("\\b|\\b") + "\b";
//			\bTimothy\b
			
			 var re = new RegExp(regex,"ig");

			 return str.replace(re, function(matched)
			 {
				 return canonical_mapObj[matched];
			 });
		}



function cleanString(value)
{
	if (value)
	{
		value = (value+"").trim(); //convert to string and trim
		value = value.toUpperCase();	//convert to upper case
		
		var colonindex = value.indexOf(":");
		if (colonindex>0)
		{
			value = value.substring(colonindex, value.length); //use everything after first column 
		}
		
		//turn of brackes logic for now
//				var brackedindexstart = value.indexOf("[");
//				var brackedindexend = value.indexOf("]");
//				if ((brackedindexstart>0) && (brackedindexend>0) && (brackedindexstart<brackedindexend))
//				{
//					value = value.substring(0, brackedindexstart) +  value.substring(brackedindexend+1, value.length)
//					//throw value;
//				}
		//begening of the string , remove dr, mrs 
		
		//***********
		//replace ' with empty
//				var value = "George D. O'Neill";
//				value = value.replace(/'/g, '');
//				console.log(value);
		//*********
		value = value.replace(/'/g, "");	//remove ' , don't replace them with space
		
		//Special Handling on LP LLC
		value = value.replace(/L\.L\.C\./ig, "LLC");
		value = value.replace(/L\.P\./ig, "LP");
		value = value.replace(/L\.L\.P\./ig, "LLP");
		
		
		//*************************
		//Eliminate Titles:  
//				var value = "Dr. George D. O'Neill";
//				value = value.replace(/^(Dr|Mr|Mrs|Ms)(\.|\s)+\s*/ig, '');
//				console.log("'"+value+"'");
//				//*************************
		value = value.replace(/^(Dr|Mr|Mrs|Ms)(\.|\s)+\s*/ig, "");
		
		
		//\bword\b
		//*************************
		//Eliminate suffix titles:  
//				var value = "Dr. George D. O'Neill";
//				value = value.replace(/(\bDDS\b|\bPhD\b)/ig, '');
//				console.log("'"+value+"'");
//				//*************************
		value = value.replace(/(\bDDS\b|\bPhD\b)/ig, "");
		
		value = value.replace(/[^0-9A-Z]/g, " ");	//replace non alpha numeric. Only look for uppercase as they are all already upper
		value = value.replace(/\s\s+/g, " ");	//replace one or more spaces with single space
	
		//20190103 turning off canonical values 
		// value = replaceCanonicalValues(value);
		
		value = value.trim();
	
	
	}
	return value;
}
Array.prototype.compareValuesStrictMatch = function() 
{
	var arr = this;
	var orig = arr[1];	//index 0 is internal id
	var retValue = true;
	var next = "";
	var i = 0;
	for(i = 2; i < arr.length; i+=1)
    {
		next = arr[i];
		if(next !== orig)
        {
    		retValue = false;
        }
    }
	return retValue;
}

Array.prototype.compareValues = function() 
{
	var arr = this;
	var retValue = true;
	var orig = cleanString(arr[1]); //index 0 is internal id
	var next = "";
	var cleaned_output = "";
	var i = 1;
	
	cleaned_output = "1. " + orig + "\n";
	//throw "length " + JSON.stringify(this);
    for(i = 2; i < arr.length; i+=1)
    {
    	//arrthrow arr[i];
    	next = cleanString(arr[i]);
    	
    	cleaned_output += (i+1)+". " + next + "\n";
    	if(next !== orig)
        {
    		retValue = false;
        }
    }
    return {
    	allmatch : retValue,
    	cleaned_values : cleaned_output
    };
};
    function onRequest(context) 
    {
    		
    	var contents = getSavedSearchContents("customsearch_name_columns_export");
    	var counter = 0;
    	var delimiter = "\t";
    	
    	var pattern = new RegExp(("(\\" + delimiter + "|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\" + delimiter + "\\r\\n]*))"), "gi");

    	var columnHeadings = [];
    	var columnRow = true;
    	//Counter for which column the script is on
    	var i=0;
    	var output = "";
    	var headerOuput = "";
    	var html = "";
    	var names = [];
    	var names_match = "";
    	var match_output = null;
    	var strMatchedValue = "";
    	var arrMatches;
    	var strMatchedDelimiter;
    	var strictlymatch = "";
    	// Keep looping over the regular expression matches
    	// until we can no longer find a match.
    	while (arrMatches = pattern.exec( contents ))
    	{
    		// Get the delimiter that was found.
    		strMatchedDelimiter = arrMatches[ 1 ];
    		// Check to see if the given delimiter has a length
    		// (is not the start of string) and if it matches
    		// field delimiter. If id does not, then we know
    		// that this delimiter is a row delimiter.
    		if (strMatchedDelimiter.length && (strMatchedDelimiter !== delimiter)){
    			//Reset the column count
    			i=0;
    			//Next line so it isn't the first row of column headings
    			columnRow=false;
    		}

    		// Now that we have our delimiter out of the way,
    		// let's check to see which kind of value we
    		// captured (quoted or unquoted).
    		if (arrMatches[ 2 ])
    		{
    			// We found a quoted value. When we capture
    			// this value, unescape any double quotes.
    			strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ), "\"");
    		} 
    		else 
    		{
    			strMatchedValue = arrMatches[ 3 ];
    		}

    		if(columnRow) 
    		{
    			columnHeadings.push( strMatchedValue );
    		} 
    		else 
    		{
    			
    			if (i> 0 && i % 6 === 0)
    			{
    				//throw i;
    				if (!headerOuput)
    				{
    					headerOuput = "<html>\n";
    					headerOuput += "<head>\n";
    					headerOuput += "<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js\"></script>";
    					headerOuput += "<style>\n";
    					headerOuput += "tr.match-on {\n";
    					headerOuput += "background-color:#90EE90; color:black;\n";
    					headerOuput += "}\n";
    					headerOuput += "tr.match-off {\n";
    					headerOuput += "background-color:#FFA500; color:black;\n";
    					headerOuput += "}\n";
    					headerOuput += "</style>\n";
    					headerOuput += "</head>\n";
    					headerOuput += "\n<body>\n";
    					headerOuput += "\n<div id='match' class='match-on'></div>\n";
    					headerOuput += "\n<div id='nomatch' class='match-off'></div>\n";
    					headerOuput += "<table border=\"1\">\n";
    					headerOuput += "<tr>";
    					headerOuput += "<td>Count</td>\n";
    					headerOuput += "<td>Mismatch?</td>\n";
    					headerOuput += "<td>Match After Fix?</td>\n";
    					headerOuput += "<td>"+columnHeadings[0]+"</td>\n";
    					headerOuput += "<td>"+columnHeadings[1]+"</td>\n";
    					headerOuput += "<td>"+columnHeadings[2]+"</td>\n";
    					headerOuput += "<td>"+columnHeadings[3]+"</td>\n";
    					headerOuput += "<td>"+columnHeadings[4]+"</td>\n";
    					headerOuput += "<td>"+columnHeadings[5]+"</td>\n";
    					headerOuput += "<td>"+columnHeadings[6]+"</td>\n";
    					headerOuput += "</tr>\n";
    				}
    				counter = counter+1;
    				
    				
    				
    				//throw "output " + output;
    				strMatchedValue && names.push(strMatchedValue);
    				output += (strMatchedValue) ? "<td>"+strMatchedValue+"</td>\n" : "<td>&nbsp;</td>\n";
    				
    				var matchafterfix = "";
    				match_output = names.compareValues();
    				if (match_output.allmatch)
    				{
    					names_match = "match-on";
    					matchafterfix = "Y";
    				}
    				else
    				{
    					matchafterfix = "N";
    					names_match = "match-off";
    				}
    				
    				html += "<tr class=\""+names_match+"\">\n";
    				html += "<td>" + counter + "</td>";
    				strictlymatch = names.compareValuesStrictMatch();
    				
    				strictlymatch = (strictlymatch) ? "N" : "Y"; //mismatch is revers eof match
    				html += "<td>" + strictlymatch + "</td>";
    				html += "<td>" + matchafterfix + "</td>";
    				
    				
    				
    				
    				html += output;
    				html += "<!--"+match_output.cleaned_values+" -->";
    				html += "</tr>\n";
    				output = "";
    				names = [];
    				//nlapiLogExecution("DEBUG"," names_match ", html);
    				//response.write(headerOuput + html);
    				//return;
    			}
    			else 
    			{
    				
    				strMatchedValue && names.push(strMatchedValue);
    				if (names.length === 1)
    				{
    					strQentryUrl = url.resolveRecord({
    						recordType : 'customrecord_acq_lot',
    						recordId : strMatchedValue,
    						isEditMode : false
    					});
    					strMatchedValue = "<a href='"+strQentryUrl+"' target='_blank'>"+strMatchedValue+"</a>";
    				}
    				output += (strMatchedValue) ? "<td>"+strMatchedValue+"</td>\n" : "<td>&nbsp;</td>\n";
    			}
    			
    			//throw "finished";
    			//Do something with the data
    		}
    		i=i+1;
    	}
    	html += "<script>\n";
    	html += "$( document ).ready(function() {\n";
    	html += "$( \"#match\" ).text('Match: '+ $('tr.match-on').length);\n";
    	html += "$( \"#nomatch\" ).text('No Match: '+ $('tr.match-off').length);\n";
    	
    	html += "});\n";
    	html += "</script>";
    	html += "</body></html>";
    	context.response.write(headerOuput + html);

			//return true;
    }

    return {
        onRequest: onRequest
    };
    
});
