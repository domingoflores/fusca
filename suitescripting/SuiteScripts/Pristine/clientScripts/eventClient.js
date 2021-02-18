/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/currentRecord', "N/url", 'N/ui/message', 'N/https'
	],
	/**
	 * -----------------------------------------------------------
	 * eventClient.js
	 * ___________________________________________________________
	 * Event client script
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2019-08-02	
	 * ___________________________________________________________
	 */
	function(runtime, currentRecord, url, message, https
		) {

		var scriptName = "eventClient.";
		var REC;
		var ctx = null;
		var assignedTo;
		var organizer;
	
		//=====================================================================================================
		function pageInit(context) {
			
		}
		//=====================================================================================================
		function setOrganizer(owner) {
			var funcName = scriptName + 'setOrganizer';
			var currentRec = currentRecord.get();
			var thisUser = runtime.getCurrentUser();
			console.log(funcName,'thisUser: ' + JSON.stringify(thisUser));

			if (owner.department.length > 0 || owner.isinactive) {

				var suiteletURL = url.resolveScript({
					scriptId: 'customscript_gen_utilities_sl',
					deploymentId: 'customdeploy_gen_utilities_sl',
					returnExternalUrl: false
				});

				var domain = url.resolveDomain({
					hostType: url.HostType.APPLICATION
				});
				console.log(funcName, "domain: " + domain);

				var fullSuiteletURL = "https://" + domain + suiteletURL + "&action=setEventOrganizer" + "&eventId=" + currentRec.id + "&userId=" + thisUser.id;
				console.log(funcName, "fullSuiteletURL: " + fullSuiteletURL);

				var response = https.get({
					url: fullSuiteletURL
				});

				var eventURL = null;
				
				eventURL = '/app/crm/calendar/event.nl?id=';
				eventURL += currentRec.id;
				eventURL += '&e=T';

				window.open(eventURL, "_self");
			}
			else {
				showMessage('Editing of this event not permitted','Cannot determine whether user can edit this event because owner has no department.');
			}	
		}

		function showMessage(msgTitle, msgText) {
			var myMsg = message.create({
				title: msgTitle,
				message: msgText,
				type: message.Type.WARNING
			});
			myMsg.show({
				duration: 7500
			});
		}

		return {
			pageInit: pageInit,
			setOrganizer: setOrganizer
		};
	});