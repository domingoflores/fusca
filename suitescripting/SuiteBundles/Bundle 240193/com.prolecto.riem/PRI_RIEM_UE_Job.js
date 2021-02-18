//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Performs validationetc., on the Job record
 * 
 */

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/url', 'N/format', 'N/file', 'N/ui/serverWidget','./PRI_RIEM_Common', '/.bundle/132118/PRI_ShowMessageInUI'],
				
		function(record, search, runtime, error, url, format, file, serverWidget, riemCommon, priMessage) {
	
			var scriptName = "PRI_RIEM_UE_Job.";

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

		    	var REC = context.newRecord;

		    	
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.VIEW){
					var processType = search.lookupFields({type: riemCommon.CUSTOM_RECORD.JOB_TYPE, id: REC.getValue("custrecord_pri_riem_job_type"), columns: ["custrecord_pri_riem_jobt_process_type"]}).custrecord_pri_riem_jobt_process_type;
					if (processType && processType.length > 0 && processType[0].value == riemCommon.PROCESS_TYPE.IMPORT) {
	                    var buttonURL = url.resolveRecord({recordType: REC.type, recordId: REC.id, params: {rI: "T"}});
	                    
	                    var scr = "window.location.href='" + buttonURL + "'; console.log";
	                    
	                    context.form.addButton({
	                        id : "custpage_run_import",
	                        label : "Process Imports",
	                        functionName: scr
	                    });    				                    	
					}
										
    				var parms = context.request.parameters;
    				
    				if (parms["rI"] == "T") {
    					riemCommon.scheduleStagingImportScript();										
    					priMessage.showMessage(context, "Import Started", "The Record Import process has been initiated.", priMessage.TYPE.CONFIRMATION);
    				}
				}     					
    					
    			if (context.type == context.UserEventType.VIEW && 
    					(REC.getValue("custrecord_pri_riem_job_status") == riemCommon.JOB_STATUS.COMPLETED || REC.getValue("custrecord_pri_riem_job_status") == riemCommon.JOB_STATUS.EXPORT_READY_TO_CREATE_OUTPUT_FILE || REC.getValue("custrecord_pri_riem_job_status") == riemCommon.JOB_STATUS.EXPORT_OUTPUT_FILE_IN_PROGRESS)) {
    				
    				var jobTypeFields = search.lookupFields({type: riemCommon.CUSTOM_RECORD.JOB_TYPE, id: REC.getValue("custrecord_pri_riem_job_type"), columns: ["custrecord_pri_riem_jobt_process_type","custrecord_pri_riem_jobt_rec_type","custrecord_pri_riem_jobt_ref_field_name","custrecord_pri_riem_jobt_exp_sublistcols"]});
    				
    				// show sublist of record which were created with this export (max of 1000)
    				if (jobTypeFields.custrecord_pri_riem_jobt_process_type[0].value == riemCommon.PROCESS_TYPE.EXPORT && jobTypeFields.custrecord_pri_riem_jobt_rec_type && jobTypeFields.custrecord_pri_riem_jobt_ref_field_name && jobTypeFields.custrecord_pri_riem_jobt_exp_sublistcols) {
    					try {
        					var sFilters = [];
        					sFilters.push([jobTypeFields.custrecord_pri_riem_jobt_ref_field_name, search.Operator.ANYOF,[REC.id]]);
        					if (jobTypeFields.custrecord_pri_riem_jobt_ref_field_name.substring(0,8) == "custbody") {
        						sFilters.push("AND");
        						sFilters.push(["mainline",search.Operator.IS,true]);
        					};
        					        					
        					var ss = search.create({
        						type:		jobTypeFields.custrecord_pri_riem_jobt_rec_type,
        						filters:	sFilters,
        						columns: 	jobTypeFields.custrecord_pri_riem_jobt_exp_sublistcols.split(",")
        					}).run().getRange(0,1000);
        					        					
        					
        					if (ss.length > 0) {
        					
        						var tabId = "custpage_exporteded_records";
        						context.form.addTab({id : tabId,label : "Exported Records"});
        						
        			            var recs = context.form.addSublist({
        			    	    	id: "custpage_recs",
        			    	    	label: "Records (max 1,000 shown)",
        			    	    	type: serverWidget.SublistType.LIST,
        			    	    	tab: tabId
        			    	    });
        			    	        			            
        			    		var searchCols = ss[0].columns;

			    				recs.addField({id: "rownbr", type: serverWidget.FieldType.INTEGER, label: "#"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});

    			    			for (var x = 0; x < searchCols.length; x++) {
    			    				var colName = searchCols[x].name;
    			    				var colLabel = searchCols[x].label;

    			    				//if (x == 0) 
        			    			//	recs.addField({id: colName, type: serverWidget.FieldType.URL, label: colName}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    			    				//else   			    					
    			    					recs.addField({id: colName, type: serverWidget.FieldType.TEXT, label: colName}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    			    			}
    			    			
    			    			for (var i = 0; i < ss.length; i++) {

				    				recs.setSublistValue({id: "rownbr", line: i, value: parseInt(i+1).toString()});
    			    				
    				    			for (var x = 0; x < searchCols.length; x++) {
    				    				var colName = searchCols[x].name;
    				    				var joinName = searchCols[x].join;
    				    				
    				    				var colValue = ss[i].getText({name: colName, join: joinName});        				    				
    				    				if (!colValue)
    				    					colValue = ss[i].getValue({name: colName, join: joinName});        				    			
    				    				
    				    				// '<a href='+url.resolveRecord({'recordType':'salesorder','recordId':result[i].id})+'>'+refName+'</a>';
    				    				
    				    				if (x == 0) {
    				    					colValue = "<a href='" + url.resolveRecord({recordType: jobTypeFields.custrecord_pri_riem_jobt_rec_type, recordId: ss[i].id}) + "'>" + colValue + "</a>";
    				    					recs.setSublistValue({id: colName, line: i, value: colValue});
    				    				} else
    				    					recs.setSublistValue({id: colName, line: i, value: colValue || " "});
    				    			}				    			

    			    			}

        					}
    						
    					} catch (eList) {
    						var fld = context.form.addField({
    							id: "custpage_sublist_error",
    							type: serverWidget.FieldType.LONGTEXT,
    							label: "Sublist Error"
    						});
    						fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
    						fld.defaultValue = eList.toString();
    					}
    				}
    			} 
    			   			    				
    			
			} // beforeLoad
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeSubmit(context) {

		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

		    	var REC = context.newRecord;

    			if (context.type == context.UserEventType.EDIT || (context.type == context.UserEventType.XEDIT && REC.getValue("custrecord_pri_riem_job_status"))) {
    				if (REC.getValue("custrecord_pri_riem_job_status") != context.oldRecord.getValue("custrecord_pri_riem_job_status")) 
    					REC.setValue("custrecord_pri_riem_job_status_last_chgd", new Date());    				
    				
    			}


    			// if the Import JOB is being created in the UI, then unless the file is already in the Archive Folder, move it there immediately
				// if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.CREATE) {
    			if (context.type == context.UserEventType.CREATE) {
    				var jobTypeFields = search.lookupFields({type: riemCommon.CUSTOM_RECORD.JOB_TYPE, id: REC.getValue("custrecord_pri_riem_job_type"), columns: ["custrecord_pri_riem_jobt_process_type","custrecord_pri_riem_jobt_folder_id","custrecord_pri_riem_jobt_imp_archive_id"]});
    				if (jobTypeFields.custrecord_pri_riem_jobt_process_type[0].value == riemCommon.PROCESS_TYPE.IMPORT) {
    					
    					moveFileToArchiveFolder(REC.getValue("custrecord_pri_riem_job_file"), jobTypeFields.custrecord_pri_riem_jobt_imp_archive_id); 
    					
    					/*
    					var F = file.load({id: REC.getValue("custrecord_pri_riem_job_file")});

    					if (F.folder != jobTypeFields.custrecord_pri_riem_jobt_imp_archive_id) {
    						log.error(funcName, "Moving file from folder " + F.folder + " to Archive Folder " + jobTypeFields.custrecord_pri_riem_jobt_imp_archive_id);
    						F.folder = jobTypeFields.custrecord_pri_riem_jobt_imp_archive_id;
    						F.save(); 
    					}
    					*/
    					//if (F.folder == jobTypeFields.custrecord_pri_riem_jobt_folder_id)
    					//	throw "When manually creating an Import Job, you may NOT place the file in the FOLDER specified on the JOB TYPE record.  The RIEM system monitors that folder, and will AUTOMATICALLY create a job for it, and you will end up with duplicates.";    					
    				} 
					
				}

    			
    		} // beforeSubmit
    		
        	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    		function afterSubmit(context) {
		
    			var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

		    	var REC = context.newRecord;

    			if (context.type == context.UserEventType.CREATE) {
    				var jobTypeFields = search.lookupFields({type: riemCommon.CUSTOM_RECORD.JOB_TYPE, id: REC.getValue("custrecord_pri_riem_job_type"), columns: ["custrecord_pri_riem_jobt_process_type"]});

    				if (jobTypeFields.custrecord_pri_riem_jobt_process_type[0].value == riemCommon.PROCESS_TYPE.EXPORT) 
    					riemCommon.scheduleExportMapReduceScript();
					priMessage.prepareMessage("Export Started", "The script to process the export has been started.", priMessage.TYPE.CONFIRMATION);
    			}
    				
    			
    			// if user creates an import job in the UI, then try to kick off the parsing step immediately
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.CREATE) {
    				var jobTypeFields = search.lookupFields({type: riemCommon.CUSTOM_RECORD.JOB_TYPE, id: REC.getValue("custrecord_pri_riem_job_type"), columns: ["custrecord_pri_riem_jobt_process_type"]});
    				if (jobTypeFields.custrecord_pri_riem_jobt_process_type[0].value == riemCommon.PROCESS_TYPE.IMPORT) {
    					riemCommon.scheduleJobManagerScript();
    					priMessage.prepareMessage("Import Started", "The script to parse and process the file has been started.", priMessage.TYPE.CONFIRMATION);
    				} 					
				}


    		} // afterSubmit

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
    		

    		function moveFileToArchiveFolder(fileId, archiveFolderId) {
    			
    			var funcName = scriptName + "moveFileToArchiveFolder " + fileId; 
    			
    			var F = file.load(fileId);
    			
    			if (F.folder != archiveFolderId) {
    				var fileType = F.fileType;
    				F.folder = archiveFolderId;
    				F.Type = fileType;		// seems redundant, but sometimes i've noticed that during a simple folder update, the file type gets lost
    				F.save();				
    				
    				// now check whether it really got moved.  if not, it must be a duplicate; change its name and move it again

    				var F = file.load(fileId);
    				if (F.folder == archiveFolderId) 
    					log.debug(funcName, "File moved to folder " + archiveFolderId);
    				else {
    					F.Type = fileType;		// seems redundant, but sometimes i've noticed that during a simple folder update, the file type gets lost
    					
    					var fileName = F.name;
    					var p = fileName.lastIndexOf(".");

    					if (p)
    						fileName = fileName.substring(0,p) + "_" + new Date().getTime() + fileName.substring(p);
    					else
    					  fileName = new Date().getTime() + "_" + fileName;
    					  					
    					// F.name = new Date().getTime() + "_" + F.name;
    					F.name = fileName;
    					
    					F.folder = archiveFolderId;
    					F.save();				
    					log.debug(funcName, "File renamed and moved to folder " + archiveFolderId);					
    				}
    			}			
    		}
    		
    		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
			
		}
});

