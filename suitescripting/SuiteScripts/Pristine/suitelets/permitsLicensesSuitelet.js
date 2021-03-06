/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/file', 'N/url', 'N/record', 'N/format', 'N/runtime', 'N/redirect'],
	function (serverWidget, search, task, file, url, record, format, runtime, redirect) {
		function onRequest(context) {
			// GET AND POST REQUESTS

			var locations = listLocations();
			

			if (context.request.method === 'GET') {
				var form = serverWidget.createForm({
					title: 'Title : Location Pair: ' + JSON.stringify(locations),
				});
				var list = serverWidget.createList({
					title : 'Locations List' + JSON.stringify(locations),
				   });
				   
				var submitButton = form.addSubmitButton({
					label: 'Update'
				});

				context.response.writePage(form);

			} else { // context.request.method === 'POST'
				var form = serverWidget.createForm({
					title: 'Testing Suitelet'
				});

				context.response.writePage(form);
				log.debug('hey');
			}
			// END GET AND POST REQUESTS

			function listLocations() {
				var listLocations = [];
				log.audit("listlocations entered")
				var locationRows = search.create({
					type: "task",
					filters:
						[
							["formulatext: {externalid}", "isnotempty", ""]
						],
					columns:
						[
							search.createColumn({ name: "title", label: "Task Title" }),
							search.createColumn({name: "custevent_task_location", label: "Location"})
						/*
							search.createColumn({
							   name: "formuladate",
							   formula: "{today}",
							   label: "Today"
							}),
							search.createColumn({name: "custevent_valid_until", label: "Valid Until"}),
							search.createColumn({
							   name: "formulanumeric",
							   formula: "ROUND({custevent_valid_until} - {today})",
							   label: "valid until - today"
							}),
							search.createColumn({
							   name: "formulatext",
							   formula: "case when ROUND({custevent_valid_until} - {today}) > 30 then CONCAT(CONCAT('<p style=\"font-style:bold;color:#000000;background-color:#00FF00;text-align: center;\">', {custevent_valid_until}), '</p>') when ROUND({custevent_valid_until} - {today}) > 15 then CONCAT(CONCAT('<p style=\"font-style:bold;color:#000000;background-color:#FFBF00;text-align: center;\">', {custevent_valid_until}), '</p>') else CONCAT(CONCAT('<p style=\"font-style:bold;color:#FFFFFF;background-color:#FF0000;text-align: center;\">', {custevent_valid_until}), '</p>')end",
							   label: "valid until color code"
							}),
							search.createColumn({name: "custevent_task_location", label: "Location"}),
							search.createColumn({name: "externalid", label: "External ID"})
							*/
						]
				});
				locationRows.run().each(function (result) {
					listLocations.push({
						title: result.getValue({
							'name': 'title',
						}),	
						location: result.getText({
							'name': 'custevent_task_location'
						}),	
					})
					return true;
				});
				return listLocations;
			}}
	// TODO start creating the list search for the api call to create list and write to the page inserting search results

		return {
			onRequest: onRequest
		};
	});