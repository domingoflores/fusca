//------------------------------------------------------------------
// Copyright 2015-2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------//
//- TEST SUITELET --------------------------------------------------------------------------------------------------------------------------//
//- Used to draw a testing debugging utility around the CRE engine																			//
//------------------------------------------------------------------------------------------------------------------------------------------//

var data_result_arr = [];

//clean the NS record into an object for JSON
function cleanRecord(record) {
    "use strict";
    var ret_obj = {};
    var fields = record.getAllFields();
    var fld = null;
    var field = null;
    var hold_val = null;
    var l = 0;
    var i = 0;
    var fld_val = null;
    var row = {};
    var list = null;
    var line_count = 0;

    fields.sort();
    for (fld in fields) {
        field = fields[fld];
        hold_val = cre_noempty(cre_noempty(record.getFieldText(fields[fld]), record.getFieldValue(fields[fld])), "");
        if (hold_val.length > 0) {
            ret_obj[field] = hold_val;
        }
    }
    // look for lists
    var lists = ["item", "contactroles", "addressbook", "creditcards", "currency", "salesteam", "expcost", "time", "line", "salesteam", "jobresources", "expense", "shipgroup", "assignee", "apply"];
    var llen = lists.length;
    for (l = 0; l < llen; l += 1) {
        list = lists[l];
        line_count = cre_noempty(record.getLineItemCount(list), 0);
//response.write(list + ":" + line_count+ "<br>");
        if (line_count > 0) {
            ret_obj[list] = [];
            for (i = 1; i <= line_count; i += 1) {
                fields = record.getAllLineItemFields(list);
                row = {};
                for (fld in fields) {
                    fld_val = cre_noempty(cre_noempty(record.getLineItemText(list, fields[fld], i), record.getLineItemValue(list, fields[fld], i)), "");
                    if (fld_val.indexOf("var ") >= 0) {
                        continue;
                    }
                    row[fields[fld]] = fld_val;
                }
                ret_obj[list].push(row);
            }
        }
    }
    return ret_obj;
}

//create a single composite object for Template merge
function buildNSRecord(type, record) {
    "use strict";
    var ret_obj = {};
    ret_obj[type] = cleanRecord(record);
    return ret_obj;
}
function drawSyntaxLinesRecursively(data, prefix_array) {
    "use strict";
    var html = "";
    var keys = null;
    var i = 0;
    var field = null;
    var fld_type = null;
    var val = null;
    var xxlen = null;
    var xxi = 0;
    var func = "drawSyntaxLinesRecursively";       

    try {
        keys = Object.keys(data);
   
	    var klen = keys.length;
	    for (i = 0; i < klen; i += 1) {
	        field = keys[i];
	        fld_type = (typeof data[field]);
	
	        if (fld_type !== "object") {
	            val = data[field];
	            // assume string or value we can now show
	            html += global_alt_row
	                ? "<tr class=alt>"
	                : "<tr>";
	            global_alt_row = !global_alt_row;
	            html += "<td>${" + prefix_array.join(".") + "." + field + "}</td><td>" + val + "</td></tr>";

	        } else {
	            if (Array.isArray(data[field])) {
	                xxlen = data[field].length;
	                for (xxi = 0; xxi < xxlen; xxi += 1) {
	                    prefix_array.push(field + "[" + xxi + "]");
	                    html += drawSyntaxLinesRecursively(data[field][xxi], prefix_array);
	                    prefix_array.pop();
	                }
	            } else {
	                prefix_array.push(field);
	                html += drawSyntaxLinesRecursively(data[field], prefix_array);
	                prefix_array.pop();
	            }
	        }
	    }
    } catch (e) {
        if (e instanceof nlobjError) {
        	nlapiLogExecution("ERROR", func + ": system error", e.getCode() + " : " + e.getDetails());
        } else {
        	nlapiLogExecution("ERROR", func + ": unexpected error", e.toString());
        }
        return "";
    }
    return html;
}
function buildSyntaxTable(bfoRecord) {
    "use strict";

    var html = "";
    var recordName = null;
    var childRecord = null;
    var data = null;
    var searchResultColumns = null;
    var i = 0;
    var tmpObj = {};
    var resultsObj = {};
    var column = null;
    var fieldName = null;
    var joinName = null;
    var groupName = null;
    var fieldValue = null;
    var func = "buildSyntaxTable";
        

    // getting all root-level objects
    for (recordName in bfoRecord) {
        childRecord = bfoRecord[recordName];

        // [object JavaObject] is the "root" object; all others are [object JavaArray] which are search results
        
        
        if (Object.prototype.toString.call(childRecord) === "[object JavaObject]") {
        	data = buildNSRecord(recordName, childRecord);
            html += drawSyntaxLinesRecursively(data, []);
        } else {
        	try
        	{
        		if (childRecord[0])
        		{
		        	searchResultColumns = childRecord[0].getAllColumns();
		            searchResultColumns.sort();
		            for (i = 0; i < Math.min(MAX_CHILD_RECORDS_TO_DISPLAY, childRecord.length); i += 1) {        // never draw more than the first few records
		
		                tmpObj = {};
		                resultsObj = {};
		
		                for (column in searchResultColumns) {
		                    fieldName = searchResultColumns[column].getName();
		                    joinName = searchResultColumns[column].getJoin();
		                    groupName = searchResultColumns[column].getSummary();
		                    fieldValue = cre_noempty(cre_noempty(childRecord[i].getText(fieldName, joinName, groupName), childRecord[i].getValue(fieldName, joinName, groupName)), "");
		                    // var hold_val = cre_noempty(cre_noempty(record.getFieldText(fields[fld]),record.getFieldValue(fields[fld])), "")
		                    // ret_obj[recordName + "[" + i + "]." + field ] = hold_val;
		                    if (joinName) {
		                        tmpObj[joinName + "." + fieldName] = fieldValue;
		                    } else {
		                        tmpObj[fieldName] = fieldValue;
		                    }
		                }
		                resultsObj[recordName + "[" + i + "]"] = tmpObj;
		
		                html += drawSyntaxLinesRecursively(resultsObj, []);
		            }
        		}
        	}
        	catch(e) 
			{
        		if (e instanceof nlobjError) {
                	nlapiLogExecution("ERROR", func + ": system error", e.getCode() + " : " + e.getDetails());
                } else {
                	nlapiLogExecution("ERROR", func + ": unexpected error", e.toString());
                }
			}
        }
    }
    return html;
}


function getSyntax(profile) {
	"use strict";
	var func = "getSyntax";
	var escape = true;
	var i = 0;
	var html = "<!-- -->";
	var len = 0;
	var f = null;
	var name = "";
	
	nlapiLogExecution("DEBUG", func, "Starting");
	
	var datanew = JSON.parse(JSON.stringify(profile.RawData)); 
	var syntax = jsonPath(datanew,"$..*" , {resultType:"PATH"}, MAX_CHILD_RECORDS_TO_DISPLAY, profile.TemplateEngine, escape);
	var syntaxToBeTranslated = jsonPath(datanew,"$..*" , {resultType:"PATH"}, MAX_CHILD_RECORDS_TO_DISPLAY, profile.TemplateEngine);
	
	len = syntax.length;
	
	for (i = 0; i < len; i+=1) 
	{
		name = syntax[i]||"";  
		if (name.indexOf("heading_text")>0)
		{
			html += "<tr><th class=\"fs\">"+syntaxToBeTranslated[i]+" Syntax</th><th class=\"fv\">Field Value</th></tr>";
			
		}
		else 
		{
			html += global_alt_row
			? "<tr class=alt>"
			: "<tr>";
			global_alt_row = !global_alt_row;
     
			html += "<td>" + name + " </td>\n";
			html += "<td>" + syntaxToBeTranslated[i] + "</td></tr>\n";
		}
	}
	
	if (request.getParameter("custpage_cachesyntax") !== "T")
	{
		nlapiLogExecution("DEBUG", "Non cached getSyntax version requested; no saving to file system");
		nlapiLogExecution("DEBUG", func, "Ending");
		return html; 
	}
	var tempfoldername = cre_getFolderName(TEMP_FOLDER_ID);
	var foldername = cre_getFolderName(TEMPLATE_FOLDER_ID);
	var filename = foldername +"/"+ tempfoldername + "/PID" + profile.internalid + "_"+request.getParameter("custpage_recid")+"_syntaxTemplate.txt";
	try
	{
		nlapiLogExecution("DEBUG", "Syntax File name ", filename );
		f = nlapiLoadFile(filename); 
        if (f) 
        { 
        	nlapiLogExecution("DEBUG", "Previous Syntax Found. ");
        	 //previous syntax template exists. compare that one with built one.
        	var previousSyntaxTemplate = f.getValue();
        	if (html === previousSyntaxTemplate)
        	{
        		nlapiLogExecution("DEBUG", "Comparison. Strings equal.");
        		//return null to notify to retrive previously generated output
        		nlapiLogExecution("DEBUG", func, "Ending");
        		return null;
        	}
        	else
        	{
        		nlapiLogExecution("DEBUG", "Strings different. Syntax changed. Return new template.");
        		nlapiLogExecution("DEBUG", func, "Ending");
        		return html;
        	}
        	
        }
        else
        {
        	nlapiLogExecution("DEBUG", "File exists, could not be loaded. Returning new one. ");
        	//syntax template does not exist. Return this one.
        	nlapiLogExecution("DEBUG", func, "Ending");
        	return html;
        }
	}
	catch(e) 
	{
			nlapiLogExecution("DEBUG", "File does not exist. Returning new one. ");
    	//	syntax template does not exist. Return this one.
			nlapiLogExecution("DEBUG", func, "Ending");
    		return html;
	}
	
}
function getArrayHTML(list, header, obj)
{
	"use strict";
	var retvalue = ""; 
	var field = null;
	var fieldName = "";
	
	retvalue = "<tr><th class=\"fs\">"+header+" Syntax</th><th class=\"fv\">Field Value</th></tr>";
    for (field in list) {
        fieldName = list[field];
        retvalue += global_alt_row
            ? "<tr class=alt>"
            : "<tr>";
        global_alt_row = !global_alt_row;
        if (isValidKey(fieldName))
        {
        	retvalue += "<td>&#36{"+obj+"." + fieldName + "}</td><td>${"+obj+"." + fieldName + "}</td></tr>";
        }
        else
        {
        	retvalue += "<td>&#36{"+obj+"[\""+fieldName+"\"]}</td><td>${"+obj+"[\""+fieldName+"\"]}</td></tr>";
        }
    }
    return retvalue;
		
}
function buildAutoIncludedFieldsTable(profile) {
    "use strict";

    var func = "buildAutoIncludedFieldsTable";
    var html = "";
    var cinfo = null;
    var uinfo = null;
    var pinfo = null;
    
    	// each transformation will go through try/catch block. If one fails, it will just be skipped. 
    	//RENDER SYNTHETIC FIELDS FIRST
	    try 
	    {
		     //COPMANY INFORMATION SYNTHETIC FIELDS
		    cinfo = getArrayHTML(syntheticCompanyFields, "Company Information (Synthetic Fields)", "companyinformation");
		    html += profile.translateValue(cinfo);
		    
	    } catch (ex1) {
			if (ex1 instanceof nlobjError) {
		    	nlapiLogExecution("ERROR", func + ": system error", ex1.getCode() + " : " + ex1.getDetails());
		    } else {
		    	nlapiLogExecution("ERROR", func + ": unexpected error", ex1.toString());
		    }
	    }
		 
	    try
	    {
	    	//USER INFORMATION SYNTHETIC FIELDS
		    uinfo = getArrayHTML(syntheticUserFields, "User Information (Synthetic Fields)", "user");
		    html += profile.translateValue(uinfo);
	    } catch (ex2) {
			if (ex2 instanceof nlobjError) {
		    	nlapiLogExecution("ERROR", func + ": system error", ex2.getCode() + " : " + ex2.getDetails());
		    } else {
		    	nlapiLogExecution("ERROR", func + ": unexpected error", ex2.toString());
		    }
	    }   
	    try 
	    {
	    	//PREFERENCES INFORMATION SYNTHETIC FIELDS
		    pinfo = getArrayHTML(syntheticPreferenceFields, "Preferences (Synthetic Fields)", "preferences");
		    html += profile.translateValue(pinfo);
	    } catch (ex) {
			if (ex instanceof nlobjError) {
		    	nlapiLogExecution("ERROR", func + ": system error", ex.getCode() + " : " + ex.getDetails());
		    } else {
		    	nlapiLogExecution("ERROR", func + ": unexpected error", ex.toString());
		    }
	    }   
		//RENDER COMPANY/USER/PREFERENCES OBJECT FIELDS NEXT
	    try
	    {
	    	//COPMANY INFORMATION FIELDS
		    var companyInfo = nlapiLoadConfiguration("companyinformation");
			var companyFields = companyInfo.getAllFields();
			cinfo = getArrayHTML(companyFields, "Company Information", "companyinformation");
			html += profile.translateValue(cinfo);
			
	    } catch (ex3) {
			if (ex3 instanceof nlobjError) {
		    	nlapiLogExecution("ERROR", func + ": system error", ex3.getCode() + " : " + ex3.getDetails());
		    } else {
		    	nlapiLogExecution("ERROR", func + ": unexpected error", ex3.toString());
		    }
	    }	
		
	    try
	    {
	    	//USER INFORMATION FIELDS
	    	var userInfo = nlapiLoadConfiguration("userpreferences");
		    var userFields = userInfo.getAllFields();
		    uinfo = getArrayHTML(userFields, "User Information", "user"); 
		    html += profile.translateValue(uinfo);
		    
	    } catch (ex4) {
			if (ex4 instanceof nlobjError) {
		    	nlapiLogExecution("ERROR", func + ": system error", ex4.getCode() + " : " + ex4.getDetails());
		    } else {
		    	nlapiLogExecution("ERROR", func + ": unexpected error", ex4.toString());
		    }
	    }
	    
	    try
	    {
	    	//mo 20160728. Because of error in freemarker, this section is printed directly instead of using getArrayHTML,
	    	//			 	so that couple of fields producing issue can be ingnored. 
	    	//PREFERENCES INFORMATION FIELDS
		    var companypreferencesInfo = nlapiLoadConfiguration("companypreferences");
		    //handle possible syntax problems by sringifying and then putting back together
		    var preferenceFields = companypreferencesInfo.getAllFields();
		    pinfo = getArrayHTML(preferenceFields, "Preferences Information", "preferences");
		    html += profile.translateValue(pinfo);
		    
	    } catch (ex6) {
			if (ex6 instanceof nlobjError) {
		    	nlapiLogExecution("ERROR", func + ": system error", ex6.getCode() + " : " + ex6.getDetails());
		    } else {
		    	nlapiLogExecution("ERROR", func + ": unexpected error", ex6.toString());
		    }
	    }
    return html;
    
}
function htmlDecode( input ) 
{
	"use strict";
	if (input)
	{
		input = String(input).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
		input = String(input).replace(/&amp;/g, "&");
		return input;
	}
	else
	{
		return;
	}
}

function getDownloadLink(profile, syntaxtemplate)
{
	"use strict";
	var retvalue = null;
	var fileid = null;
	var file = null;
	var url = null;
	var rawdata = "";
	var dateTime = nlapiDateToString(new Date(), "datetimetz");
	syntaxtemplate = ""; //clearing syntax template. Used for troubleshooting only.
	
	if (!request.getParameter("custpage_recid"))
	{
		return null;
	}
	if (profile.RawData)
	{
		rawdata = profile.RawData;
	}
	var accountid = nlapiGetContext().getCompany();
	var bundleid = nlapiGetContext().getBundleId();
	var environmenturl = "https://system.netsuite.com";
	
	if(String(nlapiGetContext().getEnvironment()) === "SANDBOX")
	{
		environmenturl = "https://system.sandbox.netsuite.com";
	}
	
//	if (cre_castInt(profile.TemplateEngine) === cre_castInt(creJSONroot.customLists.CRETemplateEngines.keys.HandleBars))
//	{
//	  	retvalue = "<html>\n";
//	  	retvalue = retvalue + "<head>\n";
//	  	retvalue = retvalue + "<script src='"+environmenturl+"/c."+accountid+"/suitebundle"+bundleid+"/js_libraries/underscore-min.js'></script>\n";
//	  	retvalue = retvalue + "<script src='"+environmenturl+"/c."+accountid+"/suitebundle"+bundleid+"/js_libraries/jquery-1.11.3.min.js'></script>\n";
//	  	retvalue = retvalue + "<script src='"+environmenturl+"/c."+accountid+"/suitebundle"+bundleid+"/js_libraries/handlebars-v3.0.3.js'></script>\n";
//	  	retvalue = retvalue + "<script language='javascript'>\n";
//	  	retvalue = retvalue + '\n var data =';
//	  	retvalue = retvalue + JSON.stringify(rawdata, null, '\t');
//	  	
//	  	retvalue = retvalue + ';\n';
//	  	retvalue = retvalue + '</script>\n';
//	  	
////	  	retvalue = retvalue + "//entry-template-syntax contains entire syntax. Included easier access. \n";
////	  	retvalue = retvalue + "<script id='entry-template-syntax' type='text/x-handlebars-template'>\n";
////	  	
////	  	retvalue = retvalue + syntaxtemplate;
////	  	
////	  	retvalue = retvalue + "</script>\n";
//	  	
//	  	retvalue = retvalue + "<script id='entry-template' type='text/x-handlebars-template'>\n";
//	  	
//	  	retvalue = retvalue + "<h2>Metadata Elements</h2>\n";
//	  	
//	  	_.each(profile.fields, function (field) {
//			if (field.translate === 'T') 
//      	    {
//				if (field.fieldtype !== 'Document')
//				{
//					retvalue = retvalue + field.fieldname + ": " + htmlDecode(field.Value) + "<br>\n"; 
//				}
//      	    }
//		});
//	  	
//	  	retvalue = retvalue + "<br><br>\n";
//	  	
//	  	retvalue = retvalue + "<h2>Template</h2>\n";
//	  	
//	  	retvalue = retvalue + htmlDecode(profile.fields.BodyTemplate.Document);
//	  	
//	  	retvalue = retvalue + "</script>\n";
//
//	  	retvalue = retvalue + "</head>\n";
//	  	retvalue = retvalue + "<body>\n";
//	  	retvalue = retvalue + "<div id='someOutputDiv'></div>\n";
//	  	retvalue = retvalue + "<script language='javascript'>\n";
//	  	    
//	  	retvalue = retvalue + 'var source = $("#entry-template").html();';
//	  	retvalue = retvalue + "\nvar template = Handlebars.compile(source);\n";
//	  	retvalue = retvalue + "var html    = template(data);\n";
//	  	retvalue = retvalue + "document.getElementById('someOutputDiv').innerHTML = html;\n";
//	  	retvalue = retvalue + "</script>\n";
//	  	retvalue = retvalue + "</body>\n";
//	  	retvalue = retvalue + "</html>\n";
//	  	
//	  	try
//	  	{
//		  	file = nlapiCreateFile('PID'+ profile.internalid + '_'+request.getParameter('custpage_recid')+'_HandleBars_' + dateTime + '.html', 'PLAINTEXT', retvalue);
//		  	file.setFolder(TEMP_FOLDER_ID);
//	        file.setName('PID'+ profile.internalid + '_'+request.getParameter('custpage_recid')+'_HandleBars_' + dateTime + '.html');
//	        fileid = nlapiSubmitFile(file);
//	        url = nlapiLoadFile(fileid).getURL();
//        }
//        catch(e) 
//		{
//	  		var err = "";
//			if (e instanceof nlobjError) {
//				err = e.getCode() + " : " + e.getDetails();
//	        	
//	        } else {
//	        	err = e.toString();
//	        }
//			//do nothing as we are only testing if file exists. Don't care if it does not. 
//			nlapiLogExecution("ERROR", "File " + fname + ' not created', err);
//		}
//	  	
//        nlapiLogExecution("DEBUG", "url", url);
//        retvalue = url;
//	  	
//		
//	}
//	else 
	if (cre_castInt(profile.TemplateEngine) === cre_castInt(creJSONroot.customLists.CRETemplateEngines.keys.TrimPath))
	{
		
		retvalue = "<html>\n";
		  	retvalue = retvalue + "<head>\n";
		  	retvalue = retvalue + "<script src='"+environmenturl+"/c."+accountid+"/suitebundle"+bundleid+"/js_libraries/trimpath-template-1.0.38.js'></script>\n";
		  	retvalue = retvalue + "<script language='javascript'>\n";
		  	retvalue = retvalue + "\n var data =";
		  	retvalue = retvalue + JSON.stringify(rawdata, null, "\t");
		  	retvalue = retvalue + ";\n";
		  	retvalue = retvalue + "</script>\n";
		  	retvalue = retvalue + "</head>\n";
		  	retvalue = retvalue + "<body>\n";
		  	
		  	
//		  	retvalue = retvalue + "//cart_jst_syntax entire syntax. Included easier access/troubleshooting. \n";
//		  	retvalue = retvalue + "<script id='cart_jst_syntax' type='text/x-trimpath-template'>\n";
//		  	retvalue = retvalue + syntaxtemplate;
//		  	retvalue = retvalue + "</script>";
		  	
		  	retvalue = retvalue + "<script id='cart_jst' type='text/x-trimpath-template'>\n";
		  	
		  	retvalue = retvalue + "<h2>Metadata Elements</h2>\n";
		  	
		  	_.each(profile.fields, function (field) {
				if (field.translate === "T") 
	      	    {
					if (field.fieldtype !== "Document")
					{
						retvalue = retvalue + field.fieldname + ": " + htmlDecode(field.Value) + "<br>\n"; 
					}
	      	    }
			});
		  	retvalue = retvalue + "<br><br>\n";
		  	retvalue = retvalue + "<h2>Template</h2>\n";
		  	
		  	
		  	
		  	retvalue = retvalue + htmlDecode(profile.fields.BodyTemplate.Document);
		  	retvalue = retvalue + "</script>";
		  	retvalue = retvalue + "<div id='someOutputDiv'></div>\n";
		  	retvalue = retvalue + "<script language='javascript'>\n";
		  	
		  	retvalue = retvalue + "// The one line processing call...\n";
		  	retvalue = retvalue + "var result = TrimPath.processDOMTemplate('cart_jst', data);\n";
		  	retvalue = retvalue + "// Voila!  That's it -- the result variable now holds \n";
		  	retvalue = retvalue + "// the output of our first rendered JST.\n";

		  	retvalue = retvalue + "// Alternatively, you may also explicitly parse the template...\n";
		  	retvalue = retvalue + "//var myTemplateObj = TrimPath.parseDOMTemplate('cart_jst');\n";

		  	retvalue = retvalue + "// Now, calls to myTemplateObj.process() won't have parsing costs...\n";
		  	retvalue = retvalue + "//var result  = myTemplateObj.process(data);\n";
		  	retvalue = retvalue + "//var result2 = myTemplateObj.process(differentData);\n";

		  	retvalue = retvalue + "// Setting an innerHTML with the result is a common last step...\n";
		  	retvalue = retvalue + "document.getElementById('someOutputDiv').innerHTML = result;\n";
		  	retvalue = retvalue + "// You might also do a document.write() or something similar...\n";
		  	retvalue = retvalue + "</script>\n";
		  
		  	retvalue = retvalue + "</body>\n";
		  	retvalue = retvalue + "</html>\n";
		  		
		  	var fname = "PID"+ profile.internalid + "_"+request.getParameter("custpage_recid")+"_TrimPath_" + dateTime + ".html";
		  	try
		  	{
		  		file = nlapiCreateFile(fname, "PLAINTEXT", retvalue);
			  	file.setFolder(TEMP_FOLDER_ID);
		        file.setName("PID"+ profile.internalid + "_"+request.getParameter("custpage_recid")+"_TrimPath_" + dateTime + ".html");
		        fileid = nlapiSubmitFile(file);
		        url = nlapiLoadFile(fileid).getURL();
		  	}
		  	catch(e) 
			{
		  		var err = "";
				if (e instanceof nlobjError) {
					err = e.getCode() + " : " + e.getDetails();
		        	
		        } else {
		        	err = e.toString();
		        }
				//do nothing as we are only testing if file exists. Don't care if it does not. 
				nlapiLogExecution("ERROR", "File " + fname + " not created", err);
			}
		        
	        nlapiLogExecution("DEBUG", "url", url);
	        retvalue = url;
	}
	
	return retvalue;
	
}
function getPreviousSyntaxOuput(profile)
{
	"use strict";
	var tempfoldername = cre_getFolderName(TEMP_FOLDER_ID);
	var foldername = cre_getFolderName(TEMPLATE_FOLDER_ID);
	var filename = foldername +"/"+ tempfoldername + "/PID" + profile.internalid + "_"+request.getParameter("custpage_recid")+"_syntax_template_ouput.txt";
	try 
	{
		var f = nlapiLoadFile(filename); 
	    if (f) 
	    {
	    	return f.getValue();
	    }
	    else
	    {
	    	nlapiLogExecution("ERROR", "Expected to see OUTPUT file, but did not find it. ", filename);
	    	return "";
	    }
	}
	catch(e) 
		{
			//do nothing as we are only testing if file exists. Don't care if it does not. 
			nlapiLogExecution("DEBUG", "getPreviousSyntaxOuput", "file " + filename + " does not exist");
		}
	return "";
}
//------------------------------------------------------------------
//Function: cre_isValidNumber
//Description: used to validate internal id. If string is passed "2", it returns true
//            however, NaN returns true for _.isNumber, therefore need for cre_isValidNumber function
//Input:
//Date: MO 20141219
//------------------------------------------------------------------
function cre_isValidNumber(num) 
{
	"use strict";
	var value = cre_castInt(num);
	if (_.isNaN(value)) {
	    return false;
	}
	if (!_.isNumber(value)) {
	    return false;
	}
	return true;
}
function saveSyntax(profile,syntaxtemplate,newSyntaxOutput)
{
	"use strict";
	var func = "saveSyntax";
	var file = nlapiCreateFile("PID" + profile.internalid + "_"+request.getParameter("custpage_recid")+"_syntaxTemplate.txt", "PLAINTEXT", syntaxtemplate);
	
	if (!cre_isValidNumber(TEMP_FOLDER_ID))
	{
		throw nlapiCreateError(func, "Invalid temp folder ID [" + TEMP_FOLDER_ID + "].");
	}
	
	file.setFolder(TEMP_FOLDER_ID);
	file.setName("PID" + profile.internalid + "_"+request.getParameter("custpage_recid")+"_syntaxTemplate.txt");
	nlapiSubmitFile(file);
	
	file = nlapiCreateFile("PID" + profile.internalid + "_"+request.getParameter("custpage_recid")+"_syntax_template_ouput.txt", "PLAINTEXT", newSyntaxOutput);
	file.setFolder(TEMP_FOLDER_ID);
	file.setName("PID" + profile.internalid +"_"+request.getParameter("custpage_recid")+"_syntax_template_ouput.txt");
	nlapiSubmitFile(file);
	
}

/*
 * In suitelet view only, we need to convert &amp; to &amp;amp; in the URL definition like this one:
 * 
 * https://system.na1.netsuite.com/core/media/media.nl?id=21725&amp;c=TSTDRV1092519&amp;h=9a981843f6d41a034859 becomes
 * 
 * https://system.na1.netsuite.com/core/media/media.nl?id=21725&amp;amp;c=TSTDRV1092519&amp;amp;h=9a981843f6d41a034859
 * 
 * Suitelet fails test preview if & ins not represented as &amp;amp; 
 * 
 * However, this way of representing amp when executing profile in real time does not work. &amp; is expected. 
 * 
 * So this solution is to work in suitelet only. 
 * 
 */
function htmlEncode( input ) 
{
	"use strict";
	if (input) 
	{
		return String(input).replace(/&/g, "&amp;");
	} else 
	{
		return "";
	}
}

//function concludes that str is an HTML template intended to work with templates that are full HTML pages
//that are complete pages.  Thus, we need to be careful that we don't render full HTML pages in other pages
//as the browser will complain.  We do this
//by verifying that it has <HTML> tag, as well as <form tag contained within str
function isHTML_HTTPTemplate(str)
{
	var retvalue = false;
	if (str)
	{
		
		//throw str.toString().substring(0,10);
		
		if (str.toString().toLowerCase().indexOf("<html")>=0)
		{
			retvalue = true;
		}
	}
	return retvalue;
}

//------------------------------------------------------------------
//Function:         creProfileBeforeLoad
//Description:      -- Generates the "Test" pop-up form for testing the CRE Profile record
//Example:            https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=263&deploy=1&custpage_profile=5
//Script Type:         Suitelet
//Call:
//Script:             customscript_pri_cre_profile_test
//                    https://system.na1.netsuite.com/app/common/scripting/script.nl?id=263
//Deployment         customdeploy_pri_comm_profile_suitelet
//                    https://system.na1.netsuite.com/app/common/scripting/scriptrecord.nl?id=372
//Date: 20150712
//------------------------------------------------------------------
function creProfileTesterSuitelet(request, response) {
    "use strict";

    var func = "creProfileTesterSuitelet";
    var field = null;
    var type = "";
    var syntaxtemplate = null;
    var rawdata = "";
    var url = "";
    var isHTMLTemplate = false;

    try 
    {

        nlapiLogExecution("DEBUG", func, "Starting");
        

        var form = nlapiCreateForm("CRE Profile IDE", true);
        form.setScript(CRE_PROFILE_USER_EVENT_SCRIPT_ID);

        var submit_button = "Preview";

        // get the profile id
        var profileId = request.getParameter("custpage_profile");
        if (!profileId) {
            throw (nlapiCreateError("MISSING_PARAMETER", "The CRE profile id is missing [" + profileId + "]. There was an error accessing this page."));
        }
        
        nlapiLogExecution("DEBUG", func + " profileId",profileId);
        
        var profile = new CREProfile(profileId);
        nlapiLogExecution("AUDIT", "CREProfile", "CREATED");
        form.addTab("custpage_inputtab", "Input/Selection");
        form.addTab("custpage_syntaxtab", "Syntax");
        form.addTab("custpage_outputmetadatatab", "Output Metadata");
        form.addTab("custpage_htmloutputtab", "Output Content");
        form.addTab("custpage_filepreviewtab", "Attachment Preview");
        form.addTab("custpage_htmlpreviewtab", "HTML Preview");
        

        var group = form.addFieldGroup("custpage_group1", "Input", "custpage_inputtab");
        group.setShowBorder(true);
        group.setSingleColumn(true);

        var outputGroup = form.addFieldGroup("custpage_group2", "Template", "custpage_inputtab");
        outputGroup.setSingleColumn(true);
        outputGroup.setShowBorder(true);
        
        
        var group3 = form.addFieldGroup("custpage_group3", "Results", "custpage_outputmetadatatab");
        
        group3.setShowBorder(true);
        
        var group4 = form.addFieldGroup("custpage_group4", "Output", "custpage_outpumetadatatab");
        group4.setSingleColumn(true);

        field = form.addField("custpage_profile", "text", "Profile");
        field.setDisplayType("hidden");
        field.setDefaultValue(profileId);

//        nlapiLogExecution("DEBUG", "Test CRE Suitelet ","1");
        
        // get the template id that we will be using
        var template = profile.fields.BodyTemplate.text;
        if (!template) {
            throw (nlapiCreateError("MISSING_TEMPLATE", "The CRE Profile is missing a template definition. Edit the profile and select the template."));
        }
        // load the record type from the form
        var recType = profile.DataRecordType;
        
        
//        if (profile.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.HandleBars)
//        {
//	        field = form.addField("custpage_cachesyntax", "checkbox", "Cache Syntax", null, "custpage_group1");
//	        field.setDefaultValue("T");
//	        field.setDisplayType("normal");
//        }
        
        nlapiLogExecution("DEBUG", "CRE Profile",JSON.stringify(profile));
        
        field = form.addField("custpage_recordtype", "text", "Record Type", null, "custpage_group1");
        field.setDefaultValue(profile.fields.DataRecordType.text + "&nbsp;(referenced as " + profile.RecordName + ")");
        field.setDisplayType("inline");

        field = form.addField("custpage_templateengine", "text", "Template Engine", null, "custpage_group1");
        field.setDefaultValue(profile.fields.TemplateEngine.text);
        field.setDisplayType("inline");

        //this is the record that will start the work
        var recId = request.getParameter("custpage_recid");

        field = form.addField("custpage_recid", "select", profile.fields.DataRecordType.text + " To Test (Prefix with % to ease lookup) ", recType, "custpage_group1");
        if (recId > 0) 
        {
            field.setDefaultValue(recId);
        } 
        field = form.addField("custpage_parm_1", "text", "CUSTOM PARAM 1 (if needed)", "", "custpage_group1");
        if (request.getParameter("custpage_parm_1"))
        {
        	profile.CustomParam1 = request.getParameter("custpage_parm_1");
        }
        field.setDefaultValue(htmlEncode(profile.CustomParam1));
        field.setDisplayType("normal");

        field = form.addField("custpage_parm_2", "text", "CUSTOM PARAM 2 (if needed)", "", "custpage_group1");
        if (request.getParameter("custpage_parm_2"))
        {
        	profile.CustomParam2 = request.getParameter("custpage_parm_2");
        }
        field.setDefaultValue(htmlEncode(profile.CustomParam2));
        field.setDisplayType("normal");

        // ------------------------------------------

        field = form.addField("custpage_email_sender", "textarea", "Sender", "", "custpage_group1");
        if (request.getParameter("custpage_email_sender"))
        {
        	profile.Sender = request.getParameter("custpage_email_sender");
        }
        field.setDefaultValue(htmlEncode(profile.Sender));
        field.setLayoutType("startrow");
        field.setDisplayType("normal");
        field.setDisplaySize(80, 1);
        
        field = form.addField("custpage_email_recipient", "textarea", "Recipient", "", "custpage_group1");
        if (request.getParameter("custpage_email_recipient"))
        {
        	profile.Recipient = request.getParameter("custpage_email_recipient");
        }
        field.setDefaultValue(htmlEncode(profile.Recipient));
        field.setDisplayType("normal");
        field.setLayoutType("endrow");
        field.setDisplaySize(80, 1);
        
        field = form.addField("custpage_email_cc", "textarea", "CC", "", "custpage_group1");
        if (request.getParameter("custpage_email_cc"))
        {
        	profile.CC = request.getParameter("custpage_email_cc");
        }
        field.setDefaultValue(htmlEncode(profile.CC));
        field.setDisplayType("normal");
        field.setDisplaySize(80, 1);
        
        
        field = form.addField("custpage_email_bcc", "textarea", "BCC", "", "custpage_group1");
        if (request.getParameter("custpage_email_bcc"))
        {
        	profile.BCC = request.getParameter("custpage_email_bcc");
        }
        field.setDefaultValue(htmlEncode(profile.BCC));
        field.setDisplayType("normal");
        field.setDisplaySize(80, 1);
        

        field = form.addField("custpage_email_reply_to", "textarea", "Reply To", "", "custpage_group1");
        if (request.getParameter("custpage_email_reply_to"))
        {
        	profile.ReplyTo = request.getParameter("custpage_email_reply_to");
        }
        field.setDefaultValue(htmlEncode(profile.ReplyTo));
        field.setDisplayType("normal");
        field.setDisplaySize(80, 1);
        

            
        field = form.addField("custpage_email_subject", "textarea", "Subject", "", "custpage_group1");
        if (request.getParameter("custpage_email_subject"))
        {
        	profile.Subject = request.getParameter("custpage_email_subject");
        }
        
        field.setDefaultValue(htmlEncode(profile.Subject));
        field.setDisplayType("normal");
        field.setDisplaySize(80, 1);
        
        field = form.addField("custpage_email_introduction", "longtext", "Body Message Introduction", "", "custpage_group1");
        if (request.getParameter("custpage_email_introduction"))
        {
        	profile.BodyMessageIntroduction = request.getParameter("custpage_email_introduction");
        }
        
        field.setDefaultValue(htmlEncode(profile.BodyMessageIntroduction));
        field.setDisplayType("normal");
        field.setDisplaySize(80);

        field = form.addField("custpage_document_name", "textarea", "Document Name", "", "custpage_group1");
        if (request.getParameter("custpage_document_name"))
        {
        	profile.DocumentName = request.getParameter("custpage_document_name");
        }
        field.setDefaultValue(htmlEncode(profile.DocumentName));
        field.setDisplayType("normal");
        field.setDisplaySize(80);

        
        field = form.addField("custpage_attachment_list", "textarea", "Additional Attachment(s)", "", "custpage_group1");
        if (request.getParameter("custpage_attachment_list"))
        {
        	profile.DocumentName = request.getParameter("custpage_attachment_list");
        }
        field.setDefaultValue(htmlEncode(profile.DocumentName));
        field.setDisplayType("normal");
        field.setDisplaySize(80);
        
        // ------------------------------------------

        var labelText = "Template Contents / Document Body";
        field = form.addField("custpage_template_body", "longtext", labelText, null, "custpage_group2");
        
//        nlapiLogExecution("DEBUG", "Test CRE Suitelet ","2");
        
        if (request.getParameter("custpage_template_body"))
        {
        	//load from the user"s HTTP POST
        	profile.fields.BodyTemplate.Document = request.getParameter("custpage_template_body");
        }
        else
        {
        	//load from the disk
        	var fileName = profile.BodyTemplate;
            var oFile = nlapiLoadFile(fileName);
            profile.fields.BodyTemplate.Document = oFile.getValue();
            
            
        }
        
       
         
    	//mz 20160508: Note, we want the file on the disk to be respecting the basic rule that require escaping
    	//however, for our SuiteLet Test Tool, we load the file into an HTML TextArea which will automatatically
    	//decode ampersands which have been encoded.  Our goal then is to present to the textarea what was given
    	//to us especiallyt because it is the template, not the data.  We thus Encode & ampersands.
    	
        //mz 20160508: Note, here we are expecting a HTTP Post back.  In this case, our &amp will
    	//get converted back to &.  So, like we we need to do for the disk, we must Encode
        
        //see article: http://blog.prolecto.com/2016/06/03/watch-your-braces-netsuite-handling-rules-for-html-suitescript-developers/
        
        field.setDefaultValue(htmlEncode(profile.fields.BodyTemplate.Document));
        field.setDisplaySize(80, 25);
        field.setDisplayType("normal");

        var html="";
        var file = null;
        var fileid = null;
        
        var fileRaw = null;
        var fileRawid = null;
        
        var temporary_filename = new Date().getTime(); 

        //at this point, we check if we are in a run mode
        if (recId) {

            try {
            	nlapiLogExecution("DEBUG", func + "recId", recId);
            	
            	isHTMLTemplate = isHTML_HTTPTemplate(profile.fields.BodyTemplate.Document);
            	
            	profile.Translate(recId);
            	
                //get the HTML on the file system so we can work with it.
                if (isHTMLTemplate)
                {
            		file = nlapiCreateFile(temporary_filename + ".html", "HTMLDOC", profile.fields.BodyTemplate.translatedValue);
            		//for debugging, review translated strings raw no matter what.
            		fileRaw = nlapiCreateFile(temporary_filename + "_RAW.txt", "PLAINTEXT", profile.fields.BodyTemplate.translatedValue);
            		
	                file.setFolder(TEMP_FOLDER_ID);
	                file.setName(temporary_filename + ".html");
	                
	                fileRaw.setFolder(TEMP_FOLDER_ID);
	                fileRaw.setName(temporary_filename + "_RAW.txt");

	                fileid = nlapiSubmitFile(file);
	                fileRawid = nlapiSubmitFile(fileRaw);
	                
	                nlapiLogExecution("DEBUG", func + "fileid ", fileid);
	                nlapiLogExecution("DEBUG", func + "fileRawid ", fileRawid);
            	}
            	
            	if ((profile.fields.DocumentName.translatedValue) && (profile.fields.BodyTemplate.translatedValue ))
            	{
            		//at this point, we have the transformed XML string.  Now we need to know if we are
            		//working to send it into BFO to turn it into PDF.  If not, then we simply want the
            		//output
            		if (profile.fields.DocumentName.translatedValue.toLowerCase().endsWith("pdf"))
            		{
            			file = nlapiXMLToPDF(profile.fields.BodyTemplate.translatedValue);
            		}
            		else 
            		{
            			file = nlapiCreateFile(profile.fields.DocumentName.translatedValue, "PLAINTEXT", profile.fields.BodyTemplate.translatedValue);
            		}
            		
            		//for debugging, review translated strings raw no matter what.
            		fileRaw = nlapiCreateFile(profile.fields.DocumentName.translatedValue + "_RAW.txt", "PLAINTEXT", profile.fields.BodyTemplate.translatedValue);
            		
	                file.setFolder(TEMP_FOLDER_ID);
	                file.setName(profile.fields.DocumentName.translatedValue);
	                
	                fileRaw.setFolder(TEMP_FOLDER_ID);
	                fileRaw.setName(profile.fields.DocumentName.translatedValue + "_RAW.txt");

	                nlapiLogExecution("DEBUG", func + " profile.fields.DocumentName.translatedValue", profile.fields.DocumentName.translatedValue);
	                nlapiLogExecution("DEBUG", func + " submitting file", "submitting file");
	                
	                fileid = nlapiSubmitFile(file);
	                fileRawid = nlapiSubmitFile(fileRaw);
	                
	                nlapiLogExecution("DEBUG", func + "fileid ", fileid);
	                nlapiLogExecution("DEBUG", func + "fileRawid ", fileRawid);
            	}
        	    
            	field = form.addField("custpage_email_sender_output", "textarea", "Sender", null, "custpage_group3");
        	    field.setDefaultValue((profile.fields.Sender.translatedValue||"") + "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80, 1);
                nlapiLogExecution("DEBUG", func + "sender", "");
                field = form.addField("custpage_email_recipient_output", "textarea", "Recipient", null, "custpage_group3");
                field.setDefaultValue((profile.fields.Recipient.translatedValue||"") + "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80, 1);
                
                field = form.addField("custpage_email_cc_output", "textarea", "CC", null, "custpage_group3");
        	    field.setDefaultValue((profile.fields.CC.translatedValue||"") + "<hr>");
        	    field.setDisplayType("inline");
                field.setDisplaySize(80, 1);
                    
                field = form.addField("custpage_email_bcc_output", "textarea", "BCC", null, "custpage_group3");
        	    field.setDefaultValue((profile.fields.BCC.translatedValue||"") + "<hr>");
        	    field.setDisplayType("inline");
        	    field.setDisplaySize(80, 1);

                field = form.addField("custpage_email_reply_to_output", "textarea", "Reply To", null, "custpage_group3");
        	    field.setDefaultValue((profile.fields.ReplyTo.translatedValue||"") + "<hr>");
        	    field.setDisplayType("inline");
        	    field.setDisplaySize(80, 1);

                field = form.addField("custpage_email_subject_output", "textarea", "Subject", null, "custpage_group3");
                field.setDefaultValue((profile.fields.Subject.translatedValue ||"")+ "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80, 1);
                
                field = form.addField("custpage_email_body_message_introduction", "longtext", "Body Message Introduction", null, "custpage_group3");
                field.setDefaultValue((profile.fields.BodyMessageIntroduction.translatedValue ||"")+ "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80);

                field = form.addField("custpage_document_name_output", "textarea", "Document Name", null, "custpage_group3");
                field.setDefaultValue((profile.fields.DocumentName.translatedValue||"") + "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80);
                
                field = form.addField("custpage_attachment_output", "textarea", "Additional Attachment(s)", null, "custpage_group3");
                field.setDefaultValue((profile.fields.FileAttachment.translatedValue||"") + "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80);
                
                field = form.addField("custpage_custom_parameter_1", "text", "CUSTOM PARAM 1", null, "custpage_group3");
        	    field.setDefaultValue((profile.fields.CustomParam1.translatedValue||"") + "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80);
                
                field = form.addField("custpage_custom_parameter_2", "text", "CUSTOM PARAM 2", null, "custpage_group3");
        	    field.setDefaultValue((profile.fields.CustomParam2.translatedValue||"") + "<hr>");
                field.setDisplayType("inline");
                field.setDisplaySize(80);
                
                var documentbody = "";
                var documentName = profile.fields.DocumentName.translatedValue||"";
                nlapiLogExecution("DEBUG", func + ": Document name", "<!--" + documentName + "-->");
                if (profile.fields.BodyMessageIntroduction.translatedValue)
                {
              		//body = "<pre>" + creRecord.fields.BodyMessageIntroduction.translatedValue + "</pre>";
                	documentbody = profile.fields.BodyMessageIntroduction.translatedValue;
                }
                nlapiLogExecution("DEBUG", func + ": documentbody", "<!--" + documentbody + "-->");
          	  	//  do not add Body Template Inline transformation if document Name attachment is requested. Only inline if attachment is not requested.
              	if ((!documentName) && (!isHTMLTemplate))
              	{
              		//if document name or HTMLTemplate is not specified, inline transformation.
              		documentbody = documentbody + profile.fields.BodyTemplate.translatedValue;
              	}
              	
              	
                
                
                field = form.addField("custpage_htmloutput", "inlinehtml", "", null, "custpage_htmloutputtab");
                html = "<div id=\"custpage_htmloutput_container\"><br />" + documentbody + "</div>";
                field.setDefaultValue(html);
                
                nlapiLogExecution("DEBUG", func + ": htmloutput", "<!--" + html + "-->");
                html = "";
            } catch (ex) {
            	if (ex instanceof nlobjError) {
                	nlapiLogExecution("ERROR", func + ": system error", ex.getCode() + " : " + ex.getDetails() + " : " + ex.getStackTrace());
                } else {
                	nlapiLogExecution("ERROR", func + ": unexpected error", ex.toString());
                }
            	
                html = "<font size=+2; color=red>Unexpected Error Processing Template</font><p>" + ex.message + "<p>This often happens when you reference an invalid field, or have incorrect Template Engine syntax...";
            }
            if (html)
            {
            	field = form.addField("custpage_html", "inlinehtml", "Error", null, "custpage_group2");
            	field.setDefaultValue(html); // + "  ' + profile.fields.BodyTemplate.translatedValue);
            	field.setDisplayType("inline");
            }

            html = "<span id=#msgbody>All Search Results limited to " + MAX_CHILD_RECORDS_TO_DISPLAY + " rows</span><table id=\"custpage_syntax_table\" cellpadding=\"0\" cellspacing=\"0\">";
            html += "<tr>";
            html += "<th class=\"fs fr\">Field Syntax</th><th class=\"fv fr\">Field Value</th>";
            html += "</tr>";

            if (profile.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.FreeMarker) {
            	//buildSyntaxTable relies on Netsuite calls and RawData to be of locked structure
            	//custom formula fields or other adjustments will need different syntax building table
            	html += buildSyntaxTable(profile.RawData);
            	html += buildAutoIncludedFieldsTable(profile); //return html for free marker
            	
            }
            if 
//            		((profile.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.HandleBars) || 
            		(profile.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.TrimPath)
//            	)
            {
            	syntaxtemplate = getSyntax(profile);
            	
         	   //mz: temporary submit data to see what is in the data causing an issue
               //discovered that the trimpath engine will choke when we try to send it 
               //back into the trimpath engine to get syntax output due to column names
               //that start with a number. Enhanced error messaging so the user
               //has a chance to resolve.
            	
            	if (syntaxtemplate)
            	{
            		var newSyntaxOutput = profile.translateValue(syntaxtemplate);
            		saveSyntax(profile,syntaxtemplate,newSyntaxOutput);
            		html += newSyntaxOutput;
            	}
            	else
            	{
            		nlapiLogExecution("DEBUG", "Return Previous output. ");
            		html += getPreviousSyntaxOuput(profile);
            	}
            	
            }
            

            nlapiLogExecution("DEBUG", "profile.RawData", JSON.stringify(profile.RawData));
            

            nlapiLogExecution("DEBUG", func, "Auto Included fields rendered");

            html += "</table>";
            html += "<style>";
            html += "#custpage_syntax_table td {border-bottom:1px solid black;padding:3px; font-size:+1; font-weight: bold;}";
            html += "#custpage_syntax_table th.fs {background-color: #F6F6F6; padding-top: 13px; padding-bottom: 13px; border-bottom: 2px solid; border-top: 1px solid; position: relative; overflow-y: hidden; }";
            html += "#custpage_syntax_table th.fv {background-color: #F6F6F6; padding-top: 13px; padding-bottom: 13px; border-left:2px; border-bottom: 2px solid; border-top: 1px solid; position: relative; overflow-y: hidden; }";
            
            html += "th.fr {border-top: 2px solid !important; }";
            
            html += "#custpage_syntax_table th {margin:2px;}";
            
            
            html += "#custpage_syntax_table tr.alt {background-color:#e7f3f5;}";
            html += "#custpage_syntax_table tr td:nth-child(2) {font-weight:normal}";
            html += "#msgbody {border:1px solid #ccc;padding:10px; font-weight:bold; font-size:12pt; font-decoration:italic;}";
            html += "</style>";

            field = form.addField("custpage_syntax", "inlinehtml", "", null, "custpage_syntaxtab");
            html = "<div id=\"custpage_syntax_container\"><br />" + html + "</div>\n";
            
            html += "\n<script>\n";
            html += "NS.jQuery(document).ready(function(){\n";
            	html += "var arr = document.getElementById(\"custpage_syntax_table\").rows;\n";
	            html += "for (var i = 0; i <= arr.length; i++)\n";
	            html += "{\n";
	            	html += "if (arr[i])\n";
	            	html += "{\n";
			            html += "if ((arr[i].innerHTML.indexOf(\"[object Object]\") > 0))\n";
			            html += "{\n";
			            	html += "arr[i].style.display = \"none\";\n";
			            html += "}\n";
			        html += "}\n";	
			    html += "}\n";
	            html += "var arr = document.getElementById(\"custpage_syntax_table\").rows;\n";
	            html += "var c=0;";
	            html += "for (var i = 0; i <= arr.length; i++)\n";
	            html += "{\n";
	            	html += "if (arr[i])\n";
	            	html += "{\n";
			            html += "if ((arr[i].innerHTML.indexOf(\"[object Object]\") < 0))\n";
			            html += "{\n";
				            html += "c++;\n";
				            html += "if ((c % 2) == 0) {\n";
				            	html += "arr[i].className=\"\";\n";
				            html += "}\n";
				            html += "else\n";
				            html += "{\n";
				            	html += "arr[i].className=\"alt\";\n";
				            html += "}\n";
			            html += "}\n";
		            html += "}\n";
		            html += "}\n";
            html += "});\n";	
            html += "</script>\n";
            

            
            field.setDefaultValue(html);

            type = cre_get_record_type(recType);
            // get transaction type based on record id
            if (type && type.toLowerCase() === "transaction") {
                type = cre_getRecordType("transaction", recId);
                if (type.length === 0) {
                    throw (nlapiCreateError("INVALID_TRANSACTION_TYPE", "Unable to find the transaction type for this id"));
                }
            }
        }
        outputGroup.setLabel("Template (" + (global_usageStart - nlapiGetContext().getRemainingUsage()) + "/" + global_usageStart + " usage points)");

        form.addSubmitButton(submit_button);
        form.addButton("custpage_close", "Close", "NS.form.setChanged(false);window.close();return false;");

        field = form.addField("custpage_template_data", "inlinehtml", "", null, "custpage_group2");
        
        if (profile.RawData)
    	{
    		rawdata = profile.RawData;
    	}
        
        html = "<span class=\"labelSpanEdit smallgraytextnolink\">DATA RAW</SPAN> <BR><textarea cols=\"80\" rows=\"25\" class=\"input textarea\">" + JSON.stringify(rawdata, null, "\t") + "</textarea>";
        field.setDefaultValue(html);
        
        
        if 
//        		((cre_castInt(profile.TemplateEngine) === cre_castInt(creJSONroot.customLists.CRETemplateEngines.keys.HandleBars)) || 
        		(cre_castInt(profile.TemplateEngine) === cre_castInt(creJSONroot.customLists.CRETemplateEngines.keys.TrimPath))
//        	)
    	{
	        	//render developer helper file 
		        url = getDownloadLink(profile, syntaxtemplate);
		        if (url)
		        {
		        	field = form.addField("custpage_download_template_link","url","Edit in Notepad / Preview in Chrome", null, "custpage_group2");
		        	field.setDisplayType("inline");
		        	field.setLinkText("Download");
		        	field.setDefaultValue(url);
		        	
		        }
    	}
        if ((profile.fields.DocumentName.translatedValue) && (profile.fields.BodyTemplate.translatedValue ))
    	{
        	nlapiLogExecution("DEBUG", func, "OK");
        	if (fileid)
        	{
        		
        		nlapiLogExecution("DEBUG", func, "fileid: " + fileid);
        		url = nlapiLoadFile(fileid).getURL();
        		var urlRaw = nlapiLoadFile(fileRawid).getURL();
        		nlapiLogExecution("DEBUG", "URL", url);
        		
        	    field = form.addField("custpage_document_name_output_2", "inlinehtml", "PDF", null, "custpage_filepreviewtab");
        	    html = "";
        	    
        	    if (profile.fields.DocumentName.translatedValue.toLowerCase().endsWith('pdf'))
        	    {
        	    	html = '<br><br><a href="'+url+'">' + (profile.fields.DocumentName.translatedValue||'') + '</A> <br><a href="'+urlRaw+'">' + (profile.fields.DocumentName.translatedValue + '_RAW.txt'||'') + '</A>' + "<hr><br>";
        	    	html = html + '<object data="'+url+'" type="application/pdf" width="75%" height="900">alt : <a href="'+url+'">'+profile.fields.DocumentName.translatedValue+'</a></object>';
        	    }
        	    else
        	    {
        	    	html = '<br><br><a href="'+url+'">' + (profile.fields.DocumentName.translatedValue||'') + '</A> <br><a href="'+urlRaw+'">' + (profile.fields.DocumentName.translatedValue + '_RAW.txt'||'') + '</A>' + "<hr><br>";
        	    	html = html + '<object data="'+url+'" width="75%" height="900">alt : <a href="'+url+'">'+profile.fields.DocumentName.translatedValue+'</a></object>';
        	    }

        	    
        	    field.setDefaultValue(html);
                field.setDisplaySize(80);
                
        	}
        	else
        	{
        		nlapiLogExecution("DEBUG", "file not found", "");
        		field = form.addField("custpage_filepreview", "inlinehtml", "", null, "custpage_filepreviewtab");
        		html = "NA";
                field.setDefaultValue(html);
        	}
        }
        
        if (isHTMLTemplate)
    	{
        	nlapiLogExecution("DEBUG", func, "OK");
        	if (fileid)
        	{
        		
        		nlapiLogExecution("DEBUG", func, "fileid: " + fileid);
        		url = nlapiLoadFile(fileid).getURL();
        		var urlRaw = nlapiLoadFile(fileRawid).getURL();
        		nlapiLogExecution("DEBUG", "URL", url);
        		
        	    field = form.addField("custpage_document_name_output_3", "inlinehtml", "HTML", null, "custpage_htmlpreviewtab");
        	    html = "";
        	    
    	    	html = '<br><br><br><a href="'+url+'">' + temporary_filename + '.html</A> <br><a href="'+urlRaw+'">' + temporary_filename + '_RAW.txt'||'' + '</A>' + "<hr><br>";
    	    	html = html + '<Br><Br><br><object type="text/html" data="'+url+'" width="75%" height="900">alt : <a href="'+url+'">'+temporary_filename+'.html</a></object><Br><Br>';
        	
        	    
        	    field.setDefaultValue(html);
                field.setDisplaySize(80);
                
        	}
        }
        
        //jQuery("td:contains('[object Object]')").closest('tr').hide();

        
        response.writePage(form);

        return;

    } catch (e) {
        //nlapiLogExecution("ERROR", func, e.message);
        if (e instanceof nlobjError) {
        	//nlapiLogExecution("ERROR", func + ': system error', e.getCode() + " : " + e.getDetails());
        	throw nlapiCreateError(func, e.getCode() + " : " + e.getDetails());
        } else {
        	//nlapiLogExecution("ERROR", func + ': unexpected error', e.toString());
        	throw nlapiCreateError(func, e.toString());
        }
    }
}