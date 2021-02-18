//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Looks for import job types and finds any files for any job types which are ready; for each one, it creates an import job
 * 
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */


define(['N/runtime','N/record','N/error','N/search','N/file','N/task','./PRI_RIEM_Common'],

		
	function(runtime,record,error,search,file,task,riemCommon) {
   
		var scriptName = "pri_RIEM_SC_FileImporter."
	   
		function execute(scriptContext) {
			
	
			var funcName = scriptName + "execute";
			
			try {
			
				var fileImported = false;
				
				var importSearch = search.create({
					type:			riemCommon.CUSTOM_RECORD.JOB_TYPE,
					filters:		[
					        		 	["isinactive",search.Operator.IS,false]
					        		 	,"AND",["custrecord_pri_riem_jobt_process_type",search.Operator.ANYOF,[riemCommon.PROCESS_TYPE.IMPORT]]
					        		 ],
					columns:		["custrecord_pri_riem_jobt_folder_id","custrecord_pri_riem_jobt_imp_archive_id","custrecord_pri_riem_jobt_imp_file_ptrn"]
				}).run().getRange(0,100);
				
				for (var i = 0; i < importSearch.length; i++) {
					var importResult = importSearch[i];
					
					// each row represents a job type; find all the files in the folder specified for this job type
					
					log.debug(funcName, "Looking for files for job: " + JSON.stringify(importResult));
					
					var fileSearch = search.create({
						type: 			"file",
						filters: 		[
						         		 	["folder",search.Operator.IS,[importResult.getValue("custrecord_pri_riem_jobt_folder_id")]]
						         		 ],
						columns: 		["name","folder"]
					}).run().getRange(0,1000);
					
					log.debug(funcName, "  - found " + fileSearch.length + " file(s)");
					
					
					for (var fx = 0; fx < fileSearch.length; fx++) {
						// does the name match the regular expression pattern we are looking for
						
						log.debug(funcName, "Looking at file: " + JSON.stringify(fileSearch[fx]));						
						
						if (fileSearch[fx].getValue("folder") == importResult.getValue("custrecord_pri_riem_jobt_folder_id")) {
							var fileName = fileSearch[fx].getValue("name");
							var filePattern = importResult.getValue("custrecord_pri_riem_jobt_imp_file_ptrn");


							if (!filePattern || fileName.match(new RegExp(filePattern,'i'))) {
								log.debug(funcName, "File " + fileName + " was selected based on pattern " + filePattern);
								
								createImportJob(fileSearch[fx].id, importResult.id, importResult.getValue("custrecord_pri_riem_jobt_imp_archive_id"));
								fileImported = true;
							}							
						}
						
						
					}
				}
				    			
				
				if (fileImported) {
					// run the import job manager
					// now try to reschedule this script
					riemCommon.scheduleJobManagerScript();

				}
    			// return importSearch;
				
			} catch (e) {
	    		log.error(funcName, e);				
			}
			
    		
	    } // execute
	
    	/* ======================================================================================================================================== */

		function createImportJob(fileId, jobType, archiveFolderId) {
			
			var funcName = scriptName + "createImportJob " + fileId + " | " + jobType;
			
/* 
 * 2019.05.13 Boban
 * Moving the file to the Archive Folder will now be done in the UE script of the Job record.  That way, regardless of whether the JOB is created in the UI, or via this script, 
 * 	the file will always be moved to Archive
 * 
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
*/
			
			var JOB = record.create({type: riemCommon.CUSTOM_RECORD.JOB});
			
			JOB.setValue("custrecord_pri_riem_job_type", jobType);
			JOB.setValue("custrecord_pri_riem_job_file", fileId);
			
			var jobId = JOB.save();
			
			log.debug(funcName, "Job " + jobId + " created.");
			
		}
		
    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */

		
        return {
            execute: execute
        };    
	}
);
