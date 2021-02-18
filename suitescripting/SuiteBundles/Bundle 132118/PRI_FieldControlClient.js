/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 * @NModuleScope Public
*/

//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: Field Display Control
//Description: 
//Developer: Vanessa Sampang            
//Date: 07/12/2016
//------------------------------------------------------------------
define(['N/runtime','N/search','./PRI_FieldControl.js','./PRI_AS_Engine.js'],
	function(runtime,search,ctrl,asEngine){
		var fields, mainFields, roles;
		var nsRecord, nsRecordType;
		var subList;

		var userRole, hasEx; 
		var data, recordObj;
		
		function pageInit(context){
			try{
				var ctxObj = new nlobjContext();
				userRole = String(ctxObj.role);
				nsRecord = context.currentRecord;
				nsRecordType = nsRecord.type;
				recordObj = [];
				hasEx = false;
				var nsForm = nsRecord.getValue({'fieldId':'customform'});


				fields = asEngine.readAppSetting('Prolecto Utilities','Field Control');
				fields = (fields==''||fields==null) ? {} : JSON.parse(fields);
				
				data = fields[nsRecordType];

				if(data == null) return;

				for(var i = 0; i < data.forms.length; i++){
					if(data.forms[i].id == nsForm || 
							data.forms[i].id == '*'){
						recordObj.push(data.forms[i]);
					}
				}

				console.log(recordObj);

				for(var x = 0; x < recordObj.length; x++){

					if (!restrictionApplies(recordObj[x])) 
						continue;
						
					/*	
				
					if(isRoleException(recordObj[x].roles, recordObj[x].roles[0], userRole)){
						continue;
					}

					if(validateApply(recordObj[x].roles, recordObj[x].roles[0], userRole)){
						continue;
					}

					*/
					
					mainFields = recordObj[x].main;
					subList = recordObj[x].line;
					console.log(subList);

					//Disable Header Level fields
					if(mainFields){
						ctrl.controlFields(mainFields,true);
					}

					//Disable Line Level fields
					if(subList){
						ctrl.controlLineFields(subList,true);
					}
					for(var s in subList){
						for(var i = 0; i < nsRecord.getLineCount(s); i++){
							for(var f = 0; f < subList[s].length; f++){
								ctrl.nsDisableLineField(s,subList[s][f], true, i);
							}
						}
					}
				}

			}catch(e){
				console.log(e);
			}

		}

		function lineInit(context){
			//Disable Line Level fields
			for(var x = 0; x < recordObj.length; x++){
				
				if (!restrictionApplies(recordObj[x])) 
						continue;

/*					
				if(isRoleException(recordObj[x].roles, recordObj[x].roles[0], userRole)){
					continue;
				}

				if(validateApply(recordObj[x].roles, recordObj[x].roles[0], userRole)){
					continue;
				}
*/
				ctrl.controlLineFields(recordObj[x].line,true);
			}
		}

		function postSourcing(context){
			//Disable Line Level fields
			if(context.fieldId != 'item') return;

			for(var x = 0; x < recordObj.length; x++){

				if (!restrictionApplies(recordObj[x])) 
					continue;

/*				
				if(isRoleException(recordObj[x].roles, recordObj[x].roles[0], userRole)){
					continue;
				}

				if(validateApply(recordObj[x].roles, recordObj[x].roles[0], userRole)){
					continue;
				}
*/
				ctrl.controlLineFields(recordObj[x].line,true);
			}
		}

		function restrictionApplies(obj) {
			
			var userRole = runtime.getCurrentUser().role;
			var userId = runtime.getCurrentUser().id;
			
			
			if (obj.roles && obj.roles.length > 0)  {
				if (Number(obj.roles[0]) > 0) {
					console.log("role list is a lockdown list");
					if (obj.roles.indexOf(userRole) >= 0) {
						console.log("role " + userRole + " is on the lockdown list; locking fields");
						return true;
					} else
						console.log("role " + userRole + " is NOT on the lockdown list; not locking down");
				} else {
					console.log("role list is an EXCEPTION list");
					if (Math.abs(Number(obj.roles[0])) == userRole || obj.roles.indexOf(userRole) >= 0) {
						console.log("role " + userRole + " is on the EXCEPTION  list; not locking fields");
					} else {
						console.log("role " + userRole + " is NOT on the EXCEPTION list; locking down");
						return true;
					}
				}
			}

			
			if (obj.users && obj.users.length > 0)  {
				console.log("USERS: " + JSON.stringify(obj.users));
				if (Number(obj.users[0]) > 0) {
					console.log("user list is a lockdown list");
					if (obj.users.indexOf(userId) >= 0) {
						console.log("user " + userId + " is on the lockdown list; locking fields");
						return true;
					} else
						console.log("user " + userId + " is NOT on the lockdown list; not locking down");
				} else {
					console.log("user list is an EXCEPTION list");
					if (Math.abs(Number(obj.users[0])) == userId || obj.users.indexOf(userId) >= 0) {
						console.log("user " + userId + " is on the EXCEPTION  list; not locking fields");
					} else {
						console.log("user " + userId + " is NOT on the EXCEPTION list; locking down");
						return true;
					}
				}
			}
			
			return false;
			
		}
		
		
		function isRoleException(roles, firstRole, userRole){
			console.log('isException: '+ roles + ' : ' + userRole);

			 return (Number(firstRole) < 0 && 
					roles.indexOf(userRole) > -1)
		}

		function validateApply(roles, firstRole, userRole){
			console.log('validateApply: '+ roles + ' : ' + userRole);
			return (Number(firstRole) > 0 && 
					roles.indexOf(userRole) <= -1)
		}

		return {
			pageInit	:pageInit,
			lineInit	:lineInit,
			postSourcing :postSourcing
        };
	}
);