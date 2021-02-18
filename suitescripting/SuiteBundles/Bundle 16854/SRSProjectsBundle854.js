/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSProjects.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2010/12/16
 *
 * Copyright (c) 2010 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 
//
// copyTemplate: used to copy a template into a new project and link it to the 
// 				 appropriate customer (deal) and transaction (opportunity).
//				 The 'base' type is used for this purpose.  This function is
//               intended to be used as a custom workflow action.
//
function copyTemplate(){
    /*
     * do initial setup
     */
    //get NetSuite parameters and setup for new header level record types.
    var originatingTrans = nlapiGetNewRecord(); //Gets the transaction which was created and triggered the workflow for the project.
    var context = nlapiGetContext();
    var params = new Array();
    //NEW PROJECT PARAMS
    params['custscript_proj_orig_tran'] = originatingTrans.getId(); //Transaction to link to if creating a new project.
    params['custscript_proj_orig_tran_type'] = originatingTrans.getRecordType().toLowerCase(); //The type of record.
    
    //INSERT PROJECT INTO PARAMS
	params['custscript_subtemplate_proj_id'] = context.getSetting('SCRIPT', 'custscript_template_proj_id'); //The Internal ID of the template project
    params['custscript_master_proj_id'] = context.getSetting('SCRIPT', 'custscript_target_proj_id'); //The Internal ID of the existing project where tasks will be inserted.
    params['custscript_master_phase_id'] = context.getSetting('SCRIPT', 'custscript_target_phase_id'); //The existing task in the existing project that relates to the phase for the template copy.
    params['custscript_master_parent_name'] = context.getSetting('SCRIPT', 'custscript_target_parent_name'); //The summary task that will be created and is the base for the all copied template tasks.
    
    //PARAMS FOR BOTH NEW AND INSERT INTO PARAMS
    params['custscript_proj_placeholder_resource'] = context.getSetting('SCRIPT', 'custscript_proj_placeholder_resource'); //The summary task that will be created and is the base for the all copied template tasks.
    params['custscript_proj_linked_case_ref'] = context.getSetting('SCRIPT', 'custscript_proj_task_ref_case'); //A reference to a case record that will be associated with all copied tasks (that are assignable).
    
    var status = nlapiScheduleScript('customscript_proj_copy_scheduled', 'customdeploy_proj_copy_sheduled', params);
    if (status == 'QUEUED') 
        return 0;
    
} 
 

// 
// scheduleCopyTemplate:  A function for the custom workflow action as NetSuite query governance
//						  rules, in tandem with de facto required inefficient coding techniques, means that
//						  any sensible user supplied project templating engine that compensates for NetSuites
//						  failure to provide one is doomed to failure.  This function is called by a 
//                        custom workflow action and it in turn does the actual copy.
//
function scheduleCopyTemplate(){
	var isSubtemplateCopy = null;  //This value determines if the call is for a new project or if only a subtemplate will be copied.
	var originatingOpp = null; //Holder for the transaction record, if applicable.
    var targetProject = null; //Will hold the new project that's created for the opportunity.
    var targetProjectId = null; //Will hold the Internal ID of target project.
    var templateProject = null; //A reference to the template or sub-template project.
    var params = new Array(); //Will hold script parameters for rescheduling later in the function.
    var newTasks = new Array(); //Holds an array of new Project task records after saving (nlobjRecord)
    var taskMap = new Array(); //A mapping between template internal IDs to newly created record IDs.
    var newMap = new Array(); //A mapping between newly created record IDs to template IDs.
    var mainParentTask = null; //This holds the newly created parent task which will serve as the summary task for the inserted template.
    var mainParentTaskId = null; //This holds the newly created parent task ID which will serve as the summary task for the inserted template.
    var context = nlapiGetContext();
    var placeholderResourceId = context.getSetting('SCRIPT', 'custscript_proj_placeholder_resource'); //This is for the placeholder resource: valid for all copy types.
    var targetCaseId = context.getSetting('SCRIPT', 'custscript_proj_linked_case_ref'); //This field holds a reference to a target Case record ID which will be associated with assignable project task records.
    
    //Determine the context of the call: copy into or new project.
    if(context.getSetting('SCRIPT', 'custscript_subtemplate_proj_id') == null || context.getSetting('SCRIPT', 'custscript_subtemplate_proj_id') == undefined || context.getSetting('SCRIPT', 'custscript_subtemplate_proj_id') == '' ) {
		//New project so proceed accordingly.
    	originatingOpp = nlapiLoadRecord(context.getSetting('SCRIPT', 'custscript_proj_orig_tran_type'), context.getSetting('SCRIPT', 'custscript_proj_orig_tran'));
		templateProject = nlapiLoadRecord('job', originatingOpp.getFieldValue('custbody_opp_project_template'));
		isSubtemplateCopy = false;
		nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Creating new project based on template (internal ID):' + templateProject.getId());
        targetProject = createProjectFromTemplate(templateProject,originatingOpp.getFieldValue('trandate'),originatingOpp.getFieldValue('entity')); //create a new Project (job) record as a copy from the selected template.
        targetProjectId = targetProject.getId();
		nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Created new project (internal ID): ' + targetProjectId);
		
		//Since we've only just created the new project, associate the opportunity with it.
        originatingOpp.setFieldValue('job', targetProjectId);
        nlapiSubmitRecord(originatingOpp, false, false);
		
		//We also want to be sure that the deal project gets set appropriately as the main project for the deal.
		dealCustomer = nlapiLoadRecord('customer',parseInt(originatingOpp.getFieldValue('entity')));
		dealCustomer.setFieldValue('custentity_deal_deal_project',targetProjectId);
		nlapiSubmitRecord(dealCustomer,false,false);
    } else {
    	//Copy a sub-template into an existing project.
    	templateProject = nlapiLoadRecord('job', context.getSetting('SCRIPT', 'custscript_subtemplate_proj_id'));
		isSubtemplateCopy = true;
		if (templateProject != null) {
			nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Inserting project tasks baesd on template (internal ID):' + templateProject.getId());
			try {
				targetProject = nlapiLoadRecord('job', context.getSetting('SCRIPT', 'custscript_master_proj_id')); //load the target Project (job) record based on the parameter.
				targetProjectId = targetProject.getId();
			} 
			catch (err) {
				nlapiLogExecution('ERROR', 'SRSProjects.scheduleCopyTemplate', 'Problem loading target project: ' + err.description);
			}
			
		}
		else {
			nlapiLogExecution('ERROR', 'SRSProjects.scheduleCopyTemplate', 'There was no valid project template for id: ' + context.getSetting('SCRIPT', 'custscript_master_proj_id'));
			return -1; //return if there is no template. The calling workflow should check that there is a template defined for the opportunity prior to calling this function.
		}
		
		//Create the parent task for the inserted template. Set values, save, and get the new task's internal ID.
    	mainParentTask = nlapiCreateRecord('projecttask');
    	mainParentTask.setFieldValue('company', targetProject.getId());
    	mainParentTask.setFieldValue('title', context.getSetting('SCRIPT', 'custscript_master_parent_name'));
    	mainParentTask.setFieldValue('parent', context.getSetting('SCRIPT', 'custscript_master_phase_id'));
    	mainParentTaskId = nlapiSubmitRecord(mainParentTask, true, false);
    }
    
    /*
     * copy project tasks
     */
    //First get the template project tasks
    nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Starting task creation for target project internal id: ' + targetProjectId + ', template ' + templateProject.getId());
    var templateProjectTasksFilters = new Array();
    var templateProjectTasksColumns = new Array();
    templateProjectTasksFilters[0] = new nlobjSearchFilter('internalid', 'job', 'is', templateProject.getId());
    
    templateProjectTasksColumns[0] = new nlobjSearchColumn('custevent_proj_task_deal_team_role', null, null);
    templateProjectTasksColumns[1] = new nlobjSearchColumn('parent', null, null);
    templateProjectTasksColumns[2] = new nlobjSearchColumn('custevent_proj_task_target_time_est', null, null);
    templateProjectTasksColumns[3] = new nlobjSearchColumn('id', null, null);
    templateProjectTasksColumns[4] = new nlobjSearchColumn('predecessors', null, null);
	templateProjectTasksColumns[5] = new nlobjSearchColumn('custevent_proj_task_target_utilization', null, null);
	templateProjectTasksColumns[6] = new nlobjSearchColumn('custevent_proj_task_dont_report', null, null);
	templateProjectTasksColumns[7] = new nlobjSearchColumn('title', null, null);
	templateProjectTasksColumns[8] = new nlobjSearchColumn('custevent_proj_task_duration', null, null);
	templateProjectTasksColumns[9] = new nlobjSearchColumn('custevent_proj_task_est_hours_input', null, null);
	templateProjectTasksColumns[10] = new nlobjSearchColumn('custevent_proj_task_successor_close', null, null);
	templateProjectTasksColumns[11] = new nlobjSearchColumn('custevent_proj_task_is_active', null, null);
	
	templateProjectTasksColumns[3].setSort();
    
    var templateProjectTasks = null;
    templateProjectTasks = nlapiSearchRecord('projecttask', null, templateProjectTasksFilters, templateProjectTasksColumns);
	
    //
    //loop through the template project tasks and create/save new task records.
    //
    if (templateProjectTasks != null) {
        for (var i = 0; i < templateProjectTasks.length; i++) {
            var templateTask = templateProjectTasks[i];
            nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Project task: ' + templateTask.getValue('id') + ' predecessors value: ' + templateTask.getValue('predecessors') + ' predecessors text: ' + templateTask.getText('predecessors'));
            
            //Save new project task
            var tempNewTask = createProjectTaskFromTemplate(targetProjectId,templateTask,placeholderResourceId,targetCaseId); //just need a very temporary place to put the newly loaded task so we can build the map.
            if(isSubtemplateCopy) {
            	tempNewTask.setFieldValue('parent', mainParentTaskId+''); //Because this is being copied into an existing template, make sure all unowned tasks are owned.
            }
            taskMap[templateTask.getId()] = tempNewTask.getId();
			newMap[tempNewTask.getId()] = templateTask;
            newTasks[tempNewTask.getId()] = tempNewTask; //tempNewTask is no longer referenced after this.
            nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Checking remaining usage for target project internal id: ' + targetProjectId + ', usage: ' + nlapiGetContext().getRemainingUsage());
            
            if(templateTask.getValue('parent') != null && templateTask.getValue('parent') != '') {
				nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Target project internal id: ' + targetProjectId + ', template child task: ' + templateTask.getId() + ' has parent: ' + templateTask.getText('parent'));
				newTasks[taskMap[templateTask.getId()]].setFieldValue('parent', taskMap[templateTask.getValue('parent')]);
			}
        
            //End i loop
        }
        
        
        //Now loop through the templateTasks
        for (var k = 0; k < templateProjectTasks.length; k++) {
            var childTemplateTask = templateProjectTasks[k];
            //Now look for predecessors.
            if (childTemplateTask.getValue('predecessors') != null && childTemplateTask.getValue('predecessors') != '') {
                var tempChildTaskList = childTemplateTask.getValue('predecessors').replace(/\s/g, "");
                var predecessorList = tempChildTaskList.split(',');
                for (var u = 0; u < predecessorList.length; u++) {
                    nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Target project internal id: ' + targetProjectId + ', template dependent task: ' + childTemplateTask.getId() + ' has predecessor: ' + predecessorList[u]);
                    var predTemplateTaskEventId = null;
                    var predNewTask = null;
                    
                    //We have template task event ids for predecessors; now we find the internal id of the predecessor and make the assignment.
                    for (var l = 0; l < templateProjectTasks.length; l++) {
                        if (templateProjectTasks[l].getValue('id') == predecessorList[u]) {
                            nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Target project internal id: ' + targetProjectId + ', found new preceeding template task: ' + templateProjectTasks[l].getId());
                            newTasks[taskMap[childTemplateTask.getId()]].selectNewLineItem('predecessor');
                            newTasks[taskMap[childTemplateTask.getId()]].setCurrentLineItemValue('predecessor', 'task', taskMap[templateProjectTasks[l].getId()]);
                            newTasks[taskMap[childTemplateTask.getId()]].setCurrentLineItemValue('predecessor', 'type', 'FS'); //TODO: support Start-to-Start; much rarer, but we shouldn't limit templates.
                            newTasks[taskMap[childTemplateTask.getId()]].commitLineItem('predecessor');
                            break;
                        }
                    }
                }
            }
            //End k Loop	
        }
        
        //Finally loop through the newTasks and save them.
        for (var s in newTasks) {
			nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Attempting to save Project ID: ' + targetProjectId + ', task: ' + newTasks[s].getId() + '/' + newTasks[s].getFieldValue('title'));
            
			nlapiSubmitRecord(newTasks[s], true, false);
            nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Checking remaining usage for target project internal id: ' + targetProjectId + ', usage: ' + nlapiGetContext().getRemainingUsage()+ ' after saving task: '+ newTasks[s].getId() + '/' + newTasks[s].getFieldValue('title'));
        }
    }
    else {
        nlapiLogExecution('ERROR', 'SRSProjects.scheduleCopyTemplate', 'There was no valid target project template tasks for opportunity: ' + originatingOpp.getId() + ', template project: ' + templateProject.getId());
        return -1;
    }
	
	fullyReconcileProject(targetProject.getFieldValue('parent'),targetProjectId,true);
	
	//Update the status now that we're done/
    targetProject.setFieldValue('custentity_proj_task_copy_status', 'Ready');
    nlapiSubmitRecord(targetProject);
        
    nlapiLogExecution('DEBUG', 'SRSProjects.scheduleCopyTemplate', 'Finished copying project internal id: ' + targetProjectId + ' from template ' + templateProject.getId());
    return 0;
}

//
// completeTask: sets a time on a task to fully completed.  Used to facilitate
//				 just setting a status without having to book time related to the
//				 task.  Presumes that estimated time is fully used (no time variance) and 
//				 that the assigned resources are the ones that did the work.
//
function completeTask() {
	//Get passed parameters
	var context = nlapiGetContext();
	
	//Get instance of the task
	var targetTask = nlapiLoadRecord('projecttask',context.getSetting('SCRIPT','custscript_ct_trg_proj_tsk_id'));
	nlapiLogExecution('DEBUG', 'SRSProjects.completeTask', 'Completing project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' including booking time.');
	
	bookTimeOnTaskComplete(targetTask); 
	
	//change task status
	nlapiLogExecution('DEBUG', 'SRSProjects.completeTask', 'Do I need to change status to COMPLETE? Current status is: '+targetTask.getFieldValue('status'));
	if(targetTask.getFieldValue('status') != 'COMPLETE') {
		targetTask.setFieldValue('status','COMPLETE');
		nlapiSubmitRecord(targetTask);
	}
	
	nlapiLogExecution('DEBUG', 'SRSProjects.completeTask', 'Project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' completed with time bookings.');
	
	closeFlaggedPredecessors(targetTask);
	
	//Finally move active flags.
	progressActiveFlags(targetTask.getId());
}

//
// completeTaskcompleteTaskNoWork: Sets the status to complete without booking any time.  Use
//				 				   this in the case where work is effectively cancelled or not
//								   applicable.  Also sets the required work to zero as well.
//
function completeTaskNoWork() {
		//Get passed parameters
	var context = nlapiGetContext();
	
	//Get instance of the task
	var targetTask = nlapiLoadRecord('projecttask',context.getSetting('SCRIPT','custscript_na_trg_proj_tsk_id'));
	nlapiLogExecution('DEBUG', 'SRSProjects.completeTaskNoWork', 'Cancelling project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' by completing and setting est. time to 0.');
	
	//create time entries
	for(var i = 1; i <= targetTask.getLineItemCount('assignee');i++) {
		
		
		try {
			targetTask.selectLineItem('assignee',i);
			targetTask.setCurrentLineItemValue('assignee','estimatedwork',0.00);
			targetTask.commitLineItem('assignee');
			
			nlapiLogExecution('DEBUG', 'SRSProjects.completeTaskNoWork', 'Successfully cancelled task assignee line for task: '+ targetTask.getId() + ' and employee: '+targetTask.getLineItemValue('assignee','resource',i)+'.');
        } 
        catch (err) {
            nlapiLogExecution('ERROR', 'SRSProjects.completeTaskNoWork', 'Problem cancelling time for target task: ' +targetTask.getId()+' employee: '+targetTask.getLineItemValue('assignee','resource',i)+' with error '+ err.description);
        }
	}
	
	//change task status
	if(targetTask.getFieldValue('status') != 'COMPLETE') {
		targetTask.setFieldValue('status','COMPLETE');
		targetTask.setFieldValue('message','This task has been cancelled or is otherwise not applicable.');
		nlapiSubmitRecord(targetTask);
	}
	nlapiLogExecution('DEBUG', 'SRSProjects.completeTaskNoWork', 'Project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' successfully cancelled.');
	
	closeFlaggedPredecessors(targetTask);
	
	//Finally move active flags.
	progressActiveFlags(targetTask.getId());
}



function copySubTemplatePopup(request, response){
    if (request.getMethod() == 'GET') {
		nlapiLogExecution('DEBUG', 'Copy Sub-Template PopUp', 'Copy Sub-Template PopUp was called as a GET request.');
        //Lets be sure that we have all the required info for this form.
        var masterProjectId = request.getParameter('mpid');
        var templateTypeId = request.getParameter('tpid');
        var dealTeamSourceId = request.getParameter('dtsid');
        var dealTeamSourceType = request.getParameter('dtst');
        
		if (masterProjectId != null && masterProjectId != '' &&
        templateTypeId != null && templateTypeId != '' &&
        dealTeamSourceId != null && dealTeamSourceId != '' &&
        dealTeamSourceType != null && dealTeamSourceType != '') {
			//via a search, get the master project tasks
			var masterProjectTasks = null;
			var masterProjectTasksFilters = new Array();
			var masterProjectTasksColumns = new Array();
			
			masterProjectTasksFilters[0] = new nlobjSearchFilter('internalid', 'job', 'is', masterProjectId);
			masterProjectTasksFilters[1] = new nlobjSearchFilter('assignee', null, 'anyof','@NONE@');
			
			masterProjectTasksColumns[0] = new nlobjSearchColumn('internalid',null,null);
			masterProjectTasksColumns[1] = new nlobjSearchColumn('id',null,null);
			masterProjectTasksColumns[2] = new nlobjSearchColumn('title',null,null);
			masterProjectTasksColumns[1].setSort();
			
			masterProjectTasks = nlapiSearchRecord('projecttask',null,masterProjectTasksFilters,masterProjectTasksColumns);
			
			if(masterProjectTasks == null) {
				nlapiLogExecution('ERROR', 'Copy Sub-Template PopUp', 'Could not find project tasks for master project: '+masterProjectId);
				return -1;
			}
			
			//via a search get the available templates for the type
			var availTemplates = null;
			var availTemplatesFilters = new Array();
			var availTemplatesColumns = new Array();
			
			availTemplatesFilters[0] = new nlobjSearchFilter('custentity_proj_is_template',null,'is','T');
			availTemplatesFilters[1] = new nlobjSearchFilter('custentity_proj_template_type',null,'is',templateTypeId);
			
			availTemplatesColumns[0] = new nlobjSearchColumn('internalid',null,null);
			availTemplatesColumns[1] = new nlobjSearchColumn('companyname',null,null);
			availTemplatesColumns[2] = new nlobjSearchColumn('custentity_proj_template_type',null,null);
			availTemplatesColumns[1].setSort();
			
			availTemplates = nlapiSearchRecord('job',null,availTemplatesFilters,availTemplatesColumns);
			
			if(availTemplates == null) {
				nlapiLogExecution('ERROR', 'Copy Sub-Template PopUp', 'Could not find any available templates for type: '+templateTypeId);
				return -1;
			}
			//load a copy of the deal team source record.
			var dealTeamSourceRecord = null;
			dealTeamSourceRecord = nlapiLoadRecord(dealTeamSourceType.toLowerCase(),dealTeamSourceId,false);
			
			if(dealTeamSourceRecord == null) {
				nlapiLogExecution('ERROR', 'Copy Sub-Template PopUp', 'Could not find deal team source record: '+dealTeamSourceId+' of type '+dealTeamSourceType.toLowerCase());
				return -1;
			}
			
			//if we made it this far, create the form.
			nlapiLogExecution('DEBUG', 'Copy Sub-Template PopUp', 'Copy Sub-Template PopUp Get:  Begin form creation.');
            var form = nlapiCreateForm('Insert '+availTemplates[0].getText('custentity_proj_template_type')+' Tasks',true);
			
			var templateField = form.addField('custpage_template','select','Desired Template');
			templateField.setHelpText('This field determines which template project will be used as the source for the project tasks to copy.');
			templateField.setMandatory( true );
			templateField.setLayoutType('startrow', 'startcol');
			if(availTemplates.length == 1) {
				templateField.addSelectOption(availTemplates[0].getId(), availTemplates[0].getValue('companyname'), true);
			} else {
				templateField.addSelectOption('', '', true);
				for (var i = 0; i < availTemplates.length; i++) {
					templateField.addSelectOption(availTemplates[i].getId(), availTemplates[i].getValue('companyname'), false);
				}
			}
            
			var targetTaskField = form.addField('custpage_target_task', 'select', 'Deal Project Target Task');
			targetTaskField.setHelpText('This field determines which task in the deal project will be the parent task to the copyied tasks.  Think of this as the deal project phase to which the set of tasks your copying belongs.');
			targetTaskField.setMandatory( true );
			if(masterProjectTasks.length == 1) {
				targetTaskField.addSelectOption(masterProjectTasks[0].getId(), masterProjectTasks[0].getValue('companyname'), true);
			} else {
				targetTaskField.addSelectOption('', '', true);
				for (var i = 0; i < masterProjectTasks.length; i++) {
					targetTaskField.addSelectOption(masterProjectTasks[i].getId(), masterProjectTasks[i].getValue('id')+' '+masterProjectTasks[i].getValue('title'), false);
				}
			}
			
            var parentTaskNameField = form.addField('custpage_parent_name', 'text', 'Parent Task Name');
			parentTaskNameField.setHelpText('When a sub-template project is copied, a new task is created to hold the tasks in the template.  This new task is a child of the selected Deal Project Target Task selection.');
			parentTaskNameField.setMandatory(true);
			
			//add the fields from the original call to send them on
			var mpid = form.addField('custpage_mpid','text');
			mpid.setDefaultValue(masterProjectId);
			mpid.setDisplayType('hidden');
        	var dtsid = form.addField('custpage_dtsid','text');
			dtsid.setDefaultValue(dealTeamSourceId);
			dtsid.setDisplayType('hidden');
        	var dtst = form.addField('custpage_dtst','text');
			dtst.setDefaultValue(dealTeamSourceType);
			dtst.setDisplayType('hidden');
			
			form.addSubmitButton('Copy Sub-Template');
			form.addButton('custpage_close','Close','self.close();');
			nlapiLogExecution('DEBUG', 'Copy Sub-Template PopUp', 'Copy Sub-Template PopUp Get:  Form creation complete.');
			response.writePage(form);
			return 0;
        }
        else {
     
            var errorText = 'This form was called without the required parameters. <BR/>';
			errorText = errorText+'   Deal Project ID: '+masterProjectId+'<BR/>';
			errorText = errorText+'   Template Type ID: '+templateTypeId+'<BR/>';
			errorText = errorText+'   Deal Team Source Record ID: '+dealTeamSourceId+'<BR/>';
			errorText = errorText+'   Deal Team Source Record Type: '+dealTeamSourceType+'<BR/>';
			
			nlapiLogExecution('ERROR', 'Copy Sub-Template PopUp', errorText);
			var form = nlapiCreateForm("!!!Sub-Template Copy Call Problem!",true);
			var responseMsg = form.addField('custpage_response','textarea')
			responseMsg.setDefaultValue('This form cannot be called without parameters or another error as happened.  <BR/>Please report this error to <a href="mailto:itrequests@shareholderrep.com">itrequests@shareholderrep.com</a>.');
			responseMsg.setDisplayType('inline');
			form.addButton('custpage_close','Close','self.close();');
			response.writePage(form);
		    return -1;
        }
        
        
    }
    //POST call
    else {
		nlapiLogExecution('DEBUG', 'Copy Sub-Template PopUp', 'Copy Sub-Template PopUp was called as a POST request.');
	    /*
	     * do post method setup
	     */
		//Get the post parameters that have been submitted to us.
		var masterProjectId = request.getParameter('custpage_mpid');
    	var dealTeamSourceId = request.getParameter('custpage_dtsid');
    	var dealTeamSourceType = request.getParameter('custpage_dtst');
		var templateProject = request.getParameter('custpage_template');
		var targetTask = request.getParameter('custpage_target_task');
		var parentTaskName = request.getParameter('custpage_parent_name');
		
		//Set the status of the project since we may tie it up for a bit.
		var masterProject = nlapiLoadRecord('job',masterProjectId);
		masterProject.setFieldValue('custentity_proj_task_copy_status', 'Copying Tasks From Sub-Template... Don\'t Edit!');
		nlapiSubmitRecord(masterProject);
		
	    //Set script parameters and call the scheduled job.
	    var params = new Array();
	    
	    params['custscript_subtemplate_proj_id'] = templateProject; //The Internal ID of the template project
	    params['custscript_master_proj_id'] = masterProjectId; //The Internal ID of the existing project where tasks will be inserted.
	    params['custscript_master_phase_id'] = targetTask; //The existing task in the existing project that relates to the phase for the template copy.
	    params['custscript_master_parent_name'] = parentTaskName; //The summary task that will be created and is the base for the all copied template tasks.
	    params['custscript_ref_record_id'] = dealTeamSourceId; //The record ID of the source record for the deal team
	    params['custscript_ref_record_type'] = dealTeamSourceType; //The kind of record the deal team will be sourced from.
		
	    var status = nlapiScheduleScript('customscript_proj_copy_scheduled', 'customdeploy_proj_copy_sheduled', params);
	    if (status != null) {
			var errorText = 'Copy Sub-Template PopUp POST: Job submitted for-- <BR/>';
			errorText = errorText+'   Deal Project ID: '+masterProjectId+'<BR/>';
			errorText = errorText+'   Template Project ID: '+templateProject+'<BR/>';
			errorText = errorText+'   Deal Team Source Record ID: '+dealTeamSourceId+'<BR/>';
			errorText = errorText+'   Deal Team Source Record Type: '+dealTeamSourceType+'<BR/>';
			nlapiLogExecution('DEBUG', 'Copy Sub-Template PopUp', errorText);
			var form = nlapiCreateForm("Sub-Template Copy Job Submitted Successfully",true);
			var responseMsg = form.addField('custpage_response','textarea');
			responseMsg.setDefaultValue('Your copy sub-template tasks job has been successfully submitted.  <BR/>Please check the deal project in a few minutes to verify the tasks have properly been copied.');
			responseMsg.setDisplayType('inline');
			form.addButton('custpage_close','Close','self.close();');
			response.writePage(form);
			return 0;
		} else {
			var errorText = 'Copy Sub-Template PopUp POST: Job submitted for-- <BR/>';
			errorText = errorText+'   Deal Project ID: '+masterProjectId+'<BR/>';
			errorText = errorText+'   Template Project ID: '+templateProject+'<BR/>';
			errorText = errorText+'   Deal Team Source Record ID: '+dealTeamSourceId+'<BR/>';
			errorText = errorText+'   Deal Team Source Record Type: '+dealTeamSourceType+'<BR/>';
			nlapiLogExecution('ERROR', 'Copy Sub-Template PopUp', errorText);
			var form = nlapiCreateForm("!!!Sub-Template Copy Job Submition Failed!!!",true);
			var responseMsg = form.addField('custpage_response','textarea');
			responseMsg.setDefaultValue('There was a problem submitting your copy sub-template job.  <BR/>Please report this error to <a href="mailto:itrequests@shareholderrep.com">itrequests@shareholderrep.com</a>.');
			responseMsg.setDisplayType('inline');
			form.addButton('custpage_close','Close','self.close();');
			response.writePage(form);
		    return -1;
		}
    }
}

//
// copyDealTeam: When passed a default deal team, this will create new deal team member records for the deal.
//
function copyDealTeam() {
	nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','First line of function copyDealTeam... at least it got called.');
	
	//get the execution context and the parameters
	var context = nlapiGetContext();
	
	var defaultDealTeamId = context.getSetting('SCRIPT','custscript_def_deal_team_id');
	var targetDealId = context.getSetting('SCRIPT','custscript_def_dt_copy_deal_id');
	var targetDealName = context.getSetting('SCRIPT','custscript_def_dt_copy_deal_name');
	nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Copying default deal team to deal id: '+targetDealId+'/'+targetDealName+' from default deal team id: '+defaultDealTeamId+'.');
	
	//get the default deal team and loop through its members
	var defaultDealTeamFilters = new Array();
	var defaultDealTeamColumns = new Array();
	var defaultDealTeamResults = null;
	
	defaultDealTeamFilters[0] = new nlobjSearchFilter('internalid','custrecord_def_deal_team_ref','is',defaultDealTeamId);
	
	defaultDealTeamColumns[0] = new nlobjSearchColumn('custrecord_default_deal_team_member',null,null);
	defaultDealTeamColumns[1] = new nlobjSearchColumn('custrecord_default_team_member_roles',null,null);
	
	defaultDealTeamResults = nlapiSearchRecord('customrecord_default_deal_team_member',null,defaultDealTeamFilters,defaultDealTeamColumns);
	nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Search for default team members.  Copying default deal team to deal id: '+targetDealId+'/'+targetDealName+' from default deal team id: '+defaultDealTeamId+'.  Results found: '+defaultDealTeamResults.length);
	
	if(defaultDealTeamResults != null) {
		var combinedList = new Array();
		var currTeamMembers = new Object();
		var defaultTeamMembers = new Object();
		var allDefaultTeamRoles = new Array();
		
		var currTeamFilters = new Array();
		var currTeamColumns = new Array();
		var currTeamResults = null;
		
		currTeamFilters[0] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'is',targetDealId);
		
		currTeamColumns[0] = new nlobjSearchColumn('custrecord_deal_team_employee',null,null);
		
		currTeamResults = nlapiSearchRecord('customrecord_deal_project_team',null,currTeamFilters,currTeamColumns);
		if(currTeamResults != null && currTeamResults.length > 0) {
			//there are existing team members lets build a list of those records.
			for(var i = 0; i < currTeamResults.length;i++) {
				//load existing deal team records.
				nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Loading existing team member: '+currTeamResults[i].getValue('custrecord_deal_team_employee'));
				currTeamMembers[currTeamResults[i].getValue('custrecord_deal_team_employee')] = nlapiLoadRecord('customrecord_deal_project_team',currTeamResults[i].getId());
				combinedList.push(currTeamResults[i].getValue('custrecord_deal_team_employee')); //we'll need this later, to so we don't miss anybody.
			}
			
			//Add the deal team to the combined list.
			for(var i = 0; i < defaultDealTeamResults.length; i++)  {
				var tempRoles = defaultDealTeamResults[i].getValue('custrecord_default_team_member_roles').split(',');
				
				defaultTeamMembers[defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')] = defaultDealTeamResults[i];
				
				for(var t = 0; t < tempRoles.length; t++) {
					allDefaultTeamRoles.push(tempRoles[t]);
				}
				
				if(currTeamMembers[defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')] == null) {
					combinedList.push(defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member'));
				}
			}
			
			
			//Now start with the working through the deal team members.
			for(var i = 0; i < combinedList.length; i++) {
				var dealTeamMember = defaultTeamMembers[combinedList[i]];
				var currentTeamMember = currTeamMembers[combinedList[i]];
				
				if(currentTeamMember != null && dealTeamMember != null) {
					//The team member already exists so we need to be sure their roles are correct.
					var dtmRoles = dealTeamMember.getValue('custrecord_default_team_member_roles').split(',');
					var ctmRoles = currentTeamMember.getFieldValues('custrecord_deal_team_role');
					
					if(dtmRoles != null && dtmRoles.length > 0) {
						//First check that current team member has the correct roles already or add them.
						for(var dtmr = 0; dtmr < dtmRoles.length; dtmr++) {
							if(ctmRoles != null && ctmRoles.length > 0) {
								if(teamMemberHasRole(currentTeamMember,dtmRoles[dtmr]) == false) {
									nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Adding role:'+dtmRoles[dtmr]+' team member: '+currentTeamMember.getFieldValue('custrecord_deal_team_employee'));
									currTeamMembers[currentTeamMember.getFieldValue('custrecord_deal_team_employee')] = addTeamMemberRole(currentTeamMember,dtmRoles[dtmr]);
								}
							} else {
								// there are no existing team roles, this might be normal so just add the role in question.
								nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Team member has no roles, adding role:'+dtmRoles[dtmr]+' team member: '+currentTeamMember.getFieldValue('custrecord_deal_team_employee'));
								currTeamMembers[currentTeamMember.getFieldValue('custrecord_deal_team_employee')] = addTeamMemberRole(currentTeamMember,dtmRoles[dtmr]);
							}
						}
					} else {
						//there are no deal team roles.  This is a problem.
					}
					
					//Next check that they don't have any roles assigned to others according to the default deal team.
					for(var dtCount = 0; dtCount < defaultDealTeamResults.length;dtCount++) {
						var tempDtm = defaultDealTeamResults[dtCount];
						if(tempDtm.getValue('custrecord_default_deal_team_member') != currentTeamMember.getFieldValue('custrecord_deal_team_employee')) {
							var dtRoles = tempDtm.getValue('custrecord_default_team_member_roles').split(',');
							for(var dtrCount = 0; dtrCount < dtRoles.length;dtrCount++) {
								nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Ensuring role:'+dtRoles[dtrCount]+' is removed from team member: '+currentTeamMember.getFieldValue('custrecord_deal_team_employee'));
								currTeamMembers[currentTeamMember.getFieldValue('custrecord_deal_team_employee')] = removeTeamMemberRole(currentTeamMember,dtRoles[dtrCount]);
							}
						}	
					}
				} else if(currentTeamMember != null && dealTeamMember == null) {
					//There is a person on the team that is not part of the default deal team.  Remove and spurious roles they might have.
					for(var rr = 0; rr < allDefaultTeamRoles.length; rr++) {
						currTeamMembers[currentTeamMember.getFieldValue('custrecord_deal_team_employee')] = removeTeamMemberRole(currentTeamMember,allDefaultTeamRoles[rr]);
					}
					
				} else {
					//The team member does not already exist, so we'll just create them.
					nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','No existing member, creating deal team record with values: member='+dealTeamMember.getValue('custrecord_default_deal_team_member')+', roles='+dealTeamMember.getValue('custrecord_default_team_member_roles')+', name='+targetDealName+' : '+dealTeamMember.getText('custrecord_default_deal_team_member')+'.');
					var targetTeam = nlapiCreateRecord('customrecord_deal_project_team',null);
					targetTeam.setFieldValue('custrecord_deal_team_deal',targetDealId);
					targetTeam.setFieldValue('custrecord_deal_team_employee',dealTeamMember.getValue('custrecord_default_deal_team_member'));
					targetTeam.setFieldValues('custrecord_deal_team_role',dealTeamMember.getValue('custrecord_default_team_member_roles').split(','));
					targetTeam.setFieldValue('name',targetDealName+' : '+dealTeamMember.getText('custrecord_default_deal_team_member'));
				    try {
						nlapiSubmitRecord(targetTeam);
				    } catch(err) {
							if(err instanceof nlobjError) {
								nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem adding new deal team member '+targetDealId+'/'+defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')+' from default deal team: '+defaultDealTeamId+'. '+err.getCode()+'\n'+err.getDetails());
							} else {
								nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem adding new deal team member '+targetDealId+'/'+defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')+' from default deal team: '+defaultDealTeamId+'. '+err.message);
							}
				    }
					
				}  //End currentTeamMember != null Cond.
				//Probably where remove roles belongs
				
			} //End Main Deal Team Loop
			
			//Finally Save the current team.
			for(var s in currTeamMembers) {
				var saveTargetTm = currTeamMembers[s];
				if(saveTargetTm != null && saveTargetTm.getFieldValues('custrecord_deal_team_role') != null && saveTargetTm.getFieldValues('custrecord_deal_team_role').length > 0) {
					//There are still roles so just save the team member.
					try {
						nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Saving updated team member: '+saveTargetTm.getFieldValue('custrecord_deal_team_employee'));
						nlapiSubmitRecord(saveTargetTm);
				    } catch(err) {
							if(err instanceof nlobjError) {
								nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem saving updated team member. '+err.getCode()+'\n'+err.getDetails());
							} else {
								nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem saving updated team member. '+err.message);
							}
				    }
				} else {
					//There are no more remaining roles for the employee, so delete the deal team member record.
					try {
						nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','Deleting updated team member (for no roles): '+saveTargetTm.getFieldValue('custrecord_deal_team_employee')+'/'+saveTargetTm.getId());
						nlapiDeleteRecord('customrecord_deal_project_team',saveTargetTm.getId());
				    } catch(err) {
							if(err instanceof nlobjError) {
								nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem deleting updated team member. '+saveTargetTm.getId()+' '+err.getCode()+'\n'+err.getDetails());
							} else {
								nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem deleting updated team member. '+saveTargetTm.getId()+' '+''+err.message);
							}
				    }
				}
			}
		} else {
			//There are no existing team members, so create them without all the checks we'd do if there were.
			for(var i = 0; i < defaultDealTeamResults.length; i++) {
				//create a new deal project team member
				nlapiLogExecution('DEBUG','SRSProjects.copyDealTeam','No existing team, creating deal team record with values: member='+defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')+', roles='+defaultDealTeamResults[i].getValue('custrecord_default_team_member_roles')+', name='+targetDealName+' : '+defaultDealTeamResults[i].getText('custrecord_default_deal_team_member')+'.');
				var targetTeam = nlapiCreateRecord('customrecord_deal_project_team',null);
				targetTeam.setFieldValue('custrecord_deal_team_deal',targetDealId);
				targetTeam.setFieldValue('custrecord_deal_team_employee',defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member'));
				targetTeam.setFieldValues('custrecord_deal_team_role',defaultDealTeamResults[i].getValue('custrecord_default_team_member_roles').split(','));
				targetTeam.setFieldValue('name',targetDealName+' : '+defaultDealTeamResults[i].getText('custrecord_default_deal_team_member'));
			    try {
				nlapiSubmitRecord(targetTeam);
			    } catch(err) {
						if(err instanceof nlobjError) {
							nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem creating new deal team with member '+targetDealId+'/'+defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')+' from default deal team: '+defaultDealTeamId+'. '+err.getCode()+'\n'+err.getDetails());
						} else {
							nlapiLogExecution('ERROR','SRSProjects.copyDealTeam','Problem creating new deal team with member '+targetDealId+'/'+defaultDealTeamResults[i].getValue('custrecord_default_deal_team_member')+' from default deal team: '+defaultDealTeamId+'. '+err.message);
						}
			    }
			}
		}
	}
}

//
//deleteProjectWorkflow: A workflow frontend for the delete project function.
//
function deleteProjectWorkflow() {
	nlapiLogExecution('DEBUG','SRSProjects.deleteProjectWorkflow','Starting deleteProjectWorkflow...');
	//get NetSuite parameters and setup for new header level record types.
    var originatingTrans = nlapiGetNewRecord(); //Gets the transaction which was created and triggered the workflow for the project.
    deleteProject(originatingTrans.getFieldValue('job'), originatingTrans.getId());
}

//
//getPhaseByNameWorkflow: A workflow action front end to get the phase project task id from a task title.
//
function getPhaseByNameWorkflow() {
	var context = nlapiGetContext();
	
	var projectId = context.getSetting('SCRIPT', 'custscript_proj_phase_project_id');;
	var phaseName = context.getSetting('SCRIPT', 'custscript_proj_phase_phase_name');;
	
	nlapiLogExecution('DEBUG','SRSProjects.getPhaseByNameWorkflow','Starting getPhaseByNameWorkflow...');
	//get NetSuite parameters and setup for new header level record types.
	return getPhaseByName(projectId, phaseName);
}



