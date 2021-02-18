/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(['N/record'],
	/**
	 * -----------------------------------------------------------
	 * retryPromotionWorkflow.js
	 * ___________________________________________________________
	 * Module 
	 * 
	 * Version 1.0
	 * Author: Alana Thomas
	 *
	 * Forces a save of the Paymt Instr Submission record so that the User Event
	 * retriggers and tries to save/create a Payment Instruction and Paymt Instr
	 * History.
	 * ___________________________________________________________
	 */
	function(record) {
		function onAction(scriptContext) {
			//log.error("scriptContext", JSON.stringify(scriptContext));
			var thisRecord = record.load({
				type: scriptContext.newRecord.type,
				id: scriptContext.newRecord.id
			})
			thisRecord.save();
		}

		return {
			onAction: onAction
		};
	});