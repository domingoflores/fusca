/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(['N/runtime', 'N/search'],
	/**
	 * -----------------------------------------------------------
	 * getEmployeeByFunction.js
	 * ___________________________________________________________
	 * Module 
	 * 
	 * Version 1.0
	 * Author: Ken Crossman
	 * ATP-538 - Fix bug creating requested function filter
	 * ___________________________________________________________
	 */
	function(runtime, search) {
		function onAction(scriptContext) {
			log.debug('Start Script', 'scriptContext: ' + JSON.stringify(scriptContext));
			var returnEmployee = null;
			var scriptObj = runtime.getCurrentScript();
			var requestedFunction = scriptObj.getParameter({
				name: 'custscript_function'
			});
			log.debug("onAction", 'Function parameter: ' + requestedFunction);
			if (requestedFunction) {
				var employeeList = getEmployee4Function(requestedFunction);
				log.debug("onAction", 'employeeList: ' + JSON.stringify(employeeList));
				if (employeeList.length > 0) {
					var firstEmployee = employeeList[0].getValue({
						name: 'custrecord_ef_employee'
					});
					log.debug("onAction", 'firstEmployee: ' + firstEmployee);
					returnEmployee = firstEmployee;
				} else {
					var responsibleEmployeeList = getResponsibleEmployee4Function(requestedFunction);
					log.debug("onAction", 'responsibleEmployeeList: ' + JSON.stringify(responsibleEmployeeList));
					if (responsibleEmployeeList.length > 0) {
						var respEmployee = responsibleEmployeeList[0].getValue({
							name: 'custrecord_func_responsible_employee'
						});
						log.debug("onAction", 'respEmployee: ' + respEmployee);
						returnEmployee = respEmployee;
					}
				}
			}
			return returnEmployee;
		}

		function getEmployee4Function(requestedFunction) {
			log.debug("getEmployee4Function", 'Function parameter: ' + requestedFunction);
			var emplFuncSearch = search.create({
				type: 'customrecord_employee_function',
				columns: [{
					name: 'custrecord_ef_employee'
				}],
				filters: [{
					name: 'custrecord_ef_function',
					operator: search.Operator.IS,
					values: requestedFunction
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});
			var searchResults = emplFuncSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		function getResponsibleEmployee4Function(requestedFunction) {
			log.debug("getResponsibleEmployee4Function", 'Function parameter: ' + requestedFunction);
			var respEmplSearch = search.create({
				type: 'customrecord_function',
				columns: [{
					name: 'custrecord_func_responsible_employee'
				}],
				filters: [{
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: requestedFunction
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});
			var searchResults = respEmplSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}
		return {
			onAction: onAction
		};
	});