//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 		constants and common code
 *  
 */


define(['N/record','N/search','N/runtime','N/format','N/task','N/xml'],
		
	function(record, search, runtime, format, task, nsXML) {

		"use strict";

		var scriptName = "PRI_RIEM_Common.";

    	var APP_NAME = "Prolecto Record Import/Export Manager"; 

    	var PLUGIN_TYPES = {
    			IMPORT: 		"customscript_pri_riem_plt_import",
    			EXPORT:			"customscript_pri_riem_plt_export"
    	}
    	
    	var CUSTOM_RECORD = {
    		JOB:					"customrecord_pri_riem_job",
    		JOB_TYPE:				"customrecord_pri_riem_job_type",
    		IMPORT_STAGING:			"customrecord_pri_riem_imp_staging"
    	};         

    	var JOB_STATUS = {
    			READY_TO_START:						1,
    			EXPORT_STARTED_RECORD_SELECTION:	2,
    			EXPORT_READY_TO_CREATE_OUTPUT_FILE:	3,
    			EXPORT_OUTPUT_FILE_IN_PROGRESS:		4,
    			IMPORT_FILE_IMPORTED_INTO_STAGING:	6,
    			IMPORT_PROCESSING_STAGING_RECORDS:	7,
    			COMPLETED:							8,
    			COMPLETED_WITH_ERRORS:				9,
    			COMPLETED_WITH_PARSING_ERRORS:		10
    	}

    	var STAGING_STATUS = {
    			PENDING:			1,
    			PROCESSED:			2,
    			SKIPPED:			3,
    			FAILED_RETRYING:	4,
    			FAILED_ABANDONED:	5
    	}
    	
    	
    	var PROCESS_TYPE = {
    			IMPORT:		1,
    			EXPORT:		2
    	}

    	var IMPORT_TYPE = {
    			COMMA_SEPARATED:	1,
    			TAB_SEPARATED:		2,
    			PIPE_SEPARATED:		3,	
    			XML:				4	
    	}

    	var XML_ROOT_NODE = "ROOT"; 
    	
    	var SCRIPTS = {
    			STAGING_IMPORT:				"customscript_pri_riem_mr_proc_imp_stg",
    			JOB_MANAGER:				"customscript_pri_riem_mr_imp_job_mgr",
    			CRE_EXPORT:					"customscript_pri_riem_sc_cre_export",
    			EXPORT_MAP_REDUCE:			"customscript_pri_riem_mr_export",
    			SCHEDULE_EXPORT_MAP_REDUCE:	"customscript_pri_riem_sc_sch_exporter"
    	}

    	var DEPLOYMENTS = {
    			STAGING_IMPORT:		"customdeploy_pri_riem_mr_proc_imp_stg_1",
    			JOB_MANAGER:		"customdeploy_pri_riem_mr_imp_job_mgr_1",
    			EXPORT_MAP_REDUCE:	"customdeploy_pri_riem_mr_export"
    	}

    	/* ======================================================================================================================================== */

		function extractMapReduceErrorMessages(summary) {
			var errorMsgs = [];
			
	    	var inputSummary = summary.inputSummary;
	    	if (inputSummary.error) {
	    		var msg = "STAGE=input" + " ERROR=" + inputSummary.error;
	    		errorMsgs.push(msg);
	    	}

	    	var a = extractErrorsFromStage("map", summary.mapSummary);
	    	if (a.length > 0)
	    		errorMsgs.push(a);

	    	a = extractErrorsFromStage("reduce", summary.reduceSummary);	    	
	    	if (a.length > 0)
	    		errorMsgs.push(a);

	    	return errorMsgs;
				
		}
		
		function extractErrorsFromStage(stage, summary) {
	    	var errorMsgs = [];
	    	summary.errors.iterator().each(function(key, value) {
	    		// var msg = 'Unable to process staging record ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
	    		var msg = "STAGE=" + stage + " KEY=" + key + " ERROR=" + JSON.parse(value).message;
	    		errorMsgs.push(msg);
	    		return true;
	    	});

	    	return errorMsgs;
		}


		// ================================================================================================================================

		// takes a CSV file, and converts it to a JSON object -- an array of objects, where each entry/object represents a row of the CSV, and the field names are the CSV headings
		//	without spaces (eg "Last Name" becomes LastName)
		
		function parseFile(fileData, missingColumnHeadingPrefix, fileType, groupingField) {

			// if not specified, assume CSV
			fileType = fileType || IMPORT_TYPE.COMMA_SEPARATED;
			
			if (fileType == IMPORT_TYPE.COMMA_SEPARATED)
				return parseDelimitedFile(fileData, missingColumnHeadingPrefix, ","); 

			if (fileType == IMPORT_TYPE.TAB_SEPARATED)
				return parseDelimitedFile(fileData, missingColumnHeadingPrefix, '\t');
					
			if (fileType == IMPORT_TYPE.PIPE_SEPARATED)
				return parseDelimitedFile(fileData, missingColumnHeadingPrefix, "|"); 
			
			if (fileType == IMPORT_TYPE.XML)
				return parseXMLFile(fileData, groupingField); 

			throw "Unknown/unexpected file type (layout): " + fileType
			
		}

		// ================================================================================================================================
		
		function parseXMLFile(fileData, xPath) {
			
			var funcName = scriptName + "parseXMLFile"; 
			
			fileData = fileData.replace(/>[\s]*?</g,"><"); 	// get rid of all whitespace between nodes
			
        	var xmlDoc = nsXML.Parser.fromString({text: fileData}); 

        	log.debug(funcName, fileData); 
        	log.debug(funcName, "xPath=" + xPath); 
        	
        	var docNodes = nsXML.XPath.select({node: xmlDoc, xpath: xPath});		// for example: "//Deliveries/Header"
        	
        	if (docNodes.length == 0)
        		throw "No elements found using xPath '" + xPath + "'";
        	

        	// for XML files, what we return in the array are really JSON objects which contain XML strings; the Map/Reduce job which called this
        	//		will then parse the XML into the final JSON.
        	//		trying to do it here may time out, because we found that some complex XMLs files took too long to parse by the xml2json function
			var jsonData = [];

			
        	for (var i = 0; i < docNodes.length; i++) {        		
        		var doc = nsXML.Parser.fromString({text: "<" + XML_ROOT_NODE + "/>"});
        		var newNode = doc.importNode({importedNode: docNodes[i], deep: true});
        		doc.childNodes[0].appendChild(newNode); 
        		
        		var obj = {};
        		
        		obj.xml = nsXML.Parser.toString({document: doc});
        		jsonData.push(obj); 
        	}

        	return jsonData; 

		}
			
		// ================================================================================================================================
			
		
		function xml2json(xml) {

			// Create the return object
			var obj = {};

			
			if (xml.nodeType == nsXML.NodeType.ELEMENT_NODE) { // element
/* Should work but doesn't 				
				// do attributes
				if (xml.attributes) {
					writeToScreen(JSON.stringify(xml.attributes)); 
					obj["@attributes"] = {};
					for (attrName in xml.attributes) {
						writeToScreen(attrName); 
						
						obj["@attributes"][attrName] = attrName; // xml.attributes[attrName].value;
						
						writeToScreen(JSON.stringify(obj)); 
						
					}
				}
*/				
/* Definitely Doesn't Work				
				if (xml.attributes.length > 0) {
					obj["@attributes"] = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
					}
				}
*/				 
			} else if (xml.nodeType == nsXML.NodeType.TEXT_NODE || xml.nodeType == nsXML.NodeType.CDATA_SECTION_NODE) { // text
				obj = xml.nodeValue;
			}

			// do children
			// If just one text node inside
			if (xml.hasChildNodes() && xml.childNodes.length === 1 && (xml.childNodes[0].nodeType === nsXML.NodeType.TEXT_NODE || xml.childNodes[0].nodeType === nsXML.NodeType.CDATA_SECTION_NODE)) {
				obj = xml.childNodes[0].nodeValue;
			}
			else if (xml.hasChildNodes()) {
				for(var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes[i]; 						// .item(i);
					var nodeName = item.nodeName;
					
					if (typeof(obj[nodeName]) == "undefined") {
						obj[nodeName] = xml2json(item);
					} else {
						if (typeof(obj[nodeName].push) == "undefined") {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(xml2json(item));
					}
				}
			} else
				 obj = "";
			
			return obj;
		}

		// ================================================================================================================================
		
		
		function parseDelimitedFile(fileData, missingColumnHeadingPrefix, fieldDelimiter) {
			
			var csvData = parseDelimited(fileData, fieldDelimiter);
			
			var csvHeadings = csvData[0];
			
			// for the headings, we will only take upper and lower letters, numbers, and the underscore
			for (var i = 0; i < csvHeadings.length; i++) {
				// csvHeadings[i] = csvHeadings[i].replace(/[^\x21-\x7F]/g,"").replace(/[ \_\-\#]/g,"").toLowerCase();
				csvHeadings[i] = csvHeadings[i].replace(/[^A-Za-z0-9]/g,"").toLowerCase();

				// log.audit("parseDelimitedFile","Heading " + i + " = [" + csvHeadings[i] + "]"); 
				
			}
			
			var jsonData = [];
			
			for (var i = 1; i < csvData.length; i++) {
				var csvRow = csvData[i];
			
				var obj = {};
				
				var rowEmpty = true;
				
				for (var x = 0; x < csvRow.length; x++) {
					var fieldName = ""; 
					if ((x >= csvHeadings.length || !csvHeadings[x]) && (csvRow[x] && csvRow[x].length > 0))	// only freak out if there is actual data in the field
						if (missingColumnHeadingPrefix) 
							fieldName = missingColumnHeadingPrefix.toLowerCase() + (x - csvHeadings.length).toString();
						else
							throw "Row " + (i+1) + " of the file contains more columns than there are headings (or the heading for the column is blank)"; 
					else 
						fieldName = csvHeadings[x]; 
					
					// log.debug("convert","row=" + i + "; field=" + fieldName + "; value=[" + csvRow[x] + "]"); 
					
					if (fieldName)
						obj[fieldName] = csvRow[x];
					if (csvRow[x] && csvRow[x].length > 0)
						rowEmpty = false;
				}
				
				// log.audit("parseDelimited","Row " + i + " = " + JSON.stringify(obj)); 
				
				if (!rowEmpty)
					jsonData.push(obj);				
			}
			
			return jsonData;
			
		}

		// ================================================================================================================================


		// turns a DELIMITED file string into a 2-dimensional array
		function parseDelimited(str, fieldDelimiter) {
			
			str = str.replace(/\r\n/g,'\n').replace(/\n\r/g,'\n').replace(/\r/g,'\n').replace(/\n\n/g,'\n');		// we want to end up with nothing but newline characters (get rid of the \r\n pattern, and the \r pattern
			
		    var arr = [];
		    var quote = false;  // true means we're inside a quoted field

		    // iterate over each character, keep track of current row and column (of the returned array)
		    for (var row = col = c = 0; c < str.length; c++) {
		        var cc = str[c], nc = str[c+1];        // current character, next character
		        arr[row] = arr[row] || [];             // create a new row if necessary
		        arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

		        		        
		        // If the current character is a quotation mark, and we're inside a
		        // quoted field, and the next character is also a quotation mark,
		        // add a quotation mark to the current column and skip the next character
		        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  

//		        // If it's just one quotation mark, begin/end quoted field
//		        if (cc == '"') { quote = !quote; continue; }

		        if (cc == '"') {
		        	// if we are in a quote, then end the quote
		        	if (quote)
		        		quote = !quote;
		        	else 
		        		// we are only getting into a quote if this is the FIRST character of the field
		        		if (arr[row][col].length == 0)
		        			quote = true;
		        		else 
		        			// this quote should be part of the string
		        			arr[row][col] += cc; 

		        	continue;
		        }
		        
		        // If it's a comma and we're not in a quoted field, move on to the next column
		        if (cc == fieldDelimiter && !quote) { ++col; continue; }
		        
		        // If it's a newline and we're not in a quoted field, move on to the next
		        // row and move to column 0 of that new row
		        if (cc == '\n' && !quote) { ++row; col = 0; continue; }

		        // if it's a return character, just skip over it
		        if (cc == '\r')
		        	continue;
		        
		        // Otherwise, append the current character to the current column
		        arr[row][col] += cc;
		    }
		    return arr;
		}

		// ================================================================================================================================


		// turns a CSV file string into a 2-dimensional array
		function old_version_of_parseDelimitedFile(str, delimiter) {
			
			str = str.replace(/\r\n/g,'\n').replace(/\n\r/g,'\n').replace(/\r/g,'\n').replace(/\n\n/g,'\n');		// we want to end up with nothing but newline characters (get rid of the \r\n pattern, and the \r pattern
			
		    var arr = [];
		    var quote = false;  // true means we're inside a quoted field

		    // iterate over each character, keep track of current row and column (of the returned array)
		    for (var row = col = c = 0; c < str.length; c++) {
		        var cc = str[c], nc = str[c+1];        // current character, next character
		        arr[row] = arr[row] || [];             // create a new row if necessary
		        arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

		        		        
		        // If the current character is a quotation mark, and we're inside a
		        // quoted field, and the next character is also a quotation mark,
		        // add a quotation mark to the current column and skip the next character
		        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  

		        // If it's just one quotation mark, begin/end quoted field
		        if (cc == '"') { quote = !quote; continue; }

		        // If it's a comma and we're not in a quoted field, move on to the next column
		        if (cc == delimiter && !quote) { ++col; continue; }
		        
		        // If it's a newline and we're not in a quoted field, move on to the next
		        // row and move to column 0 of that new row
		        if (cc == '\n' && !quote) { ++row; col = 0; continue; }

		        // Otherwise, append the current character to the current column
		        arr[row][col] += cc;
		    }
		    return arr;
		}

		// ================================================================================================================================
		
		function scheduleStagingImportScript() {

			var funcName = scriptName + "scheduleStagingImportScript";
			
			try {
				var scriptTask = task.create({'taskType' : task.TaskType.MAP_REDUCE, scriptId: SCRIPTS.STAGING_IMPORT, deploymentId: DEPLOYMENTS.STAGING_IMPORT});
				// scriptTask.scriptId = SCRIPTS.STAGING_IMPORT;
				var scriptTaskId = scriptTask.submit();
				log.audit(funcName, "Script scheduled");				
			} catch (e) {
				log.debug(funcName, "Unable to schedule script: " + e);
			}

			
		}

		// ================================================================================================================================
		    
		function scheduleJobManagerScript() {
			var funcName = scriptName + "scheduleJobManagerScript";
			
			try {
				var scriptTask = task.create({'taskType' : task.TaskType.MAP_REDUCE, scriptId: SCRIPTS.JOB_MANAGER, deploymentId: DEPLOYMENTS.JOB_MANAGER});
				// scriptTask.scriptId = SCRIPTS.JOB_MANAGER;
				var scriptTaskId = scriptTask.submit();
				log.audit(funcName, "Script scheduled");				
			} catch (e) {
				log.debug(funcName, "Unable to schedule script: " + e);
			}
		}


		// ================================================================================================================================
		    	
		function scheduleExportMapReduceScript() {
			var funcName = scriptName + "scheduleExportMapReduceScript";
			
			try {
				var scriptTask = task.create({'taskType' : task.TaskType.MAP_REDUCE, scriptId: SCRIPTS.EXPORT_MAP_REDUCE, deploymentId: DEPLOYMENTS.EXPORT_MAP_REDUCE});
				// scriptTask.scriptId = SCRIPTS.JOB_MANAGER;
				var scriptTaskId = scriptTask.submit();
				log.audit(funcName, "Script scheduled");				
			} catch (e) {
				log.debug(funcName, "Unable to schedule script: " + e);
			}
			
		}

		// ================================================================================================================================
    	
		function rescheduleExportMapReduceScript() {
			var funcName = scriptName + "rescheduleExportMapReduceScript";
			
			// we call this if the script wants to reschedule itself; since there is only a single deployment, then we have to do it a stupid way;
			// 		we kick off a scheduled script which does nothing but schedule the map/reduce script
			try {
				// var scriptTask = task.create({'taskType' : task.TaskType.MAP_REDUCE, scriptId: SCRIPTS.EXPORT_MAP_REDUCE, deploymentId: DEPLOYMENTS.EXPORT_MAP_REDUCE});
				var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT, scriptId: SCRIPTS.SCHEDULE_EXPORT_MAP_REDUCE});
				var scriptTaskId = scriptTask.submit();
				log.audit(funcName, "Script scheduled");				
			} catch (e) {
				log.debug(funcName, "Unable to schedule script: " + e);
			}
			
		}

		// ================================================================================================================================
    	

		function scheduleExportCREScript() {
			
			var funcName = scriptName + "scheduleExportCREScript";
			
			try {
				var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});
				scriptTask.scriptId = SCRIPTS.CRE_EXPORT;
				var scriptTaskId = scriptTask.submit();
				log.debug(funcName, "Script scheduled");				
			} catch (e) {
				log.debug(funcName, "Unable to schedule script: " + e);
			}

		}

		
		// ================================================================================================================================
    	

		return {
			APP_NAME:						APP_NAME,
			
			CUSTOM_RECORD:					CUSTOM_RECORD,
			PROCESS_TYPE:					PROCESS_TYPE,
			JOB_STATUS:						JOB_STATUS,
			STAGING_STATUS:					STAGING_STATUS,
			PLUGIN_TYPES:					PLUGIN_TYPES ,
			IMPORT_TYPE:					IMPORT_TYPE,
			XML_ROOT_NODE:					XML_ROOT_NODE,
			
			parseFile:						parseFile,
			xml2json:						xml2json,
			extractMapReduceErrorMessages:	extractMapReduceErrorMessages,
			
			// import scripts
			scheduleStagingImportScript:	scheduleStagingImportScript,
			scheduleJobManagerScript:		scheduleJobManagerScript,
	
			// export scripts
			scheduleExportMapReduceScript:	scheduleExportMapReduceScript,
			scheduleExportCREScript:		scheduleExportCREScript,
			rescheduleExportMapReduceScript:rescheduleExportMapReduceScript
			
		}

	}	

);