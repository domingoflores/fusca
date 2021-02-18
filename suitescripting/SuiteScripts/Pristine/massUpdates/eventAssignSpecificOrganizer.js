/**
 *@NApiVersion 2.0
 *@NScriptType MassUpdateScript
 */
define(['N/record', 'N/runtime'],
	/**
	 * -----------------------------------------------------------
	 * eventAssignSpecificOrganizer.js
	 * ___________________________________________________________
	 * This mass update script allows a user to change the organizer
	 * and assigned to 
	 * of a selected list of events to someone you nominate
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */
	function(record, runtime) {
		function each(params) {

			var rec = record.load({
				type: params.type,
				id: params.id
			});
			//get the script deployment parameter - new Organizer
			var scriptObj = runtime.getCurrentScript();
			var newOrganizer = scriptObj.getParameter({
				name: 'custscript_new_org'
			});
			if (newOrganizer) {
				rec.setValue({
					fieldId: 'organizer',
					value: newOrganizer
				});
				// Must set the Assigned To to ensure the Event does not get switched back by daily Mass Update
				// "Event - Reassign Organizer"
				// which selects Events with organizer Not = assigned to 
				// and sets the organizer = the assigned to
				rec.setValue({
					fieldId: 'custevent_imp_date_assigned_to',
					value: newOrganizer
				});
				
				rec.save();
			} else {
				log.debug('New Organizer blank', newOrganizer);
			}
		}
		return {
			each: each
		};
	});
