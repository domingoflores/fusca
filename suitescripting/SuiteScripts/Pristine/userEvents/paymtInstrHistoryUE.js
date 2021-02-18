/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * paymt_instr_history_ue.js
 * ___________________________________________________________
 * Description here
 *
 * Version 1.0  Ken Crossman
 *   			
 * ___________________________________________________________
 */

define(['N/runtime'],
	function(runtime) {

		function beforeLoad(context) {
			var eventType = context.type;
			var executionContext = runtime.executionContext;
			if((executionContext == 'USERINTERFACE' && eventType != 'view') || executionContext == 'CSVIMPORT') {
				throw 'Payment Instruction History records may be neither created nor edited in the User Interface or via CSV Import';
			}
		}

		return {
			beforeLoad: beforeLoad
		};
	}
);