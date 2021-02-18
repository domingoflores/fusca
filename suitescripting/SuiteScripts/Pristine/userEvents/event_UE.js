//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(['N/search', 'N/runtime'
        ,'/.bundle/132118/PRI_ShowMessageInUI'
	   ],
				
	function( search, runtime
            ,priMessage
        ) {

		var scriptName = "event_UE.";
		var assignedTo;
		var organizer;
		var owner;
		var ownerId;
        var ownerIsInactive;
        var ownerName;
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeLoad(context) {

	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	var REC = context.newRecord; 
	
	    	if (context.type == context.UserEventType.VIEW && runtime.executionContext == 'USERINTERFACE' ) {

    			var btn = context.form.getButton("edit");
                if (!btn) {
                    ownerId = REC.getValue('owner');
                    log.debug(funcName ,"ownerId: " + JSON.stringify(ownerId));
                    owner = getEmployee(ownerId);
                    ownerIsInactive = owner.isinactive;
                    ownerName = owner.firstname + ' ' + owner.lastname;
                    log.debug(funcName ,"owner: " + JSON.stringify(owner));
                    log.debug(funcName ,"owner.isinactive: " + JSON.stringify(ownerIsInactive));
                    log.debug(funcName, 'owner.department.length' + owner.department.length);
                    // If the owner is inactive then allow anyone to edit the event
                    if (owner.isinactive) {
                        log.debug(funcName, 'owner inactive - adding button ' + ownerIsInactive);
                        addEditButton(context);
                        return;
                    }
                    // Otherwise if the owner is active then use the owner's department to determine if user can edit    
                    if (owner.department.length > 0) {
                        var ownerDepartment = owner.department[0].value;
                        log.debug(funcName ,"ownerDepartment: " + JSON.stringify(ownerDepartment));
                        var permittedDepartments = getPermittedDepartments(ownerDepartment);
                        log.debug(funcName,"permittedDepartments: " + JSON.stringify(permittedDepartments));

                        if (userIsInPermittedDepartment(runtime.getCurrentUser().department,permittedDepartments)) {
                            addEditButton(context);
                        }  
                    // If the owner has no department then let user know event is not editable
                    } else {
                        priMessage.prepareMessage('View Only', 'Cannot determine whether this event is editable because the owner, ' + ownerName + ', has no department.', priMessage.TYPE.WARNING);
                        priMessage.showPreparedMessage(context);
                    }                    
                }

    		}  
		}

        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function addEditButton(context){
        	
            context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/eventClient.js';
            context.form.addButton({
                id: 'custpage_edit_event',
                label: 'Edit Event',
                functionName: 'setOrganizer('+JSON.stringify(owner)+')'
            });
            
        }
        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function getEmployee(employeeId) {
        	var employee; 
        	try {
        			employee = search.lookupFields({type: "employee", id: employeeId, columns: ["department","isinactive","firstname","lastname"]});                   
	          	} catch (e) {
	                // return;                                         
	         	}
	        return employee; 	
        }
        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function getPermittedDepartments(departmentId) {
        	try {
	                return search.lookupFields({type: "department", id: departmentId, columns: ["custrecord_event_permitted_dept"]});                    
	          } catch (e) {
	                return;                                         
	          }
        }
        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
        function userIsInPermittedDepartment(userDepartmentId,permittedDepartments) {
        	var funcName = scriptName + " --> userIsInPermittedDepartment ";
        	log.debug(funcName, 'userDepartmentId: ' + userDepartmentId);
			for (var i = 0; i < permittedDepartments.custrecord_event_permitted_dept.length; i++) {
				if (userDepartmentId == permittedDepartments.custrecord_event_permitted_dept[i].value) {
					return true;
				}
			}
			return false;
        }
        /* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		return {
			beforeLoad:		beforeLoad
		}
});

