/**
 * Module Description
 *
 * THIS REPLACES SRSCaseSystem.js
 * 
 * This script is designed to run when a Case is submitted via an email.
 * This script first looks at the inbound email address of the new case.  
 * Then a search is run to find any Case Categorization Email Records that are setup with that specific 
 * email address.  If there are no results, then we will automatically assign this case to the 
 * default Customer support categorization of Operations & Technology : Client Operations - Uncategorized Support Email - Unreviewed Support Cases
 * 
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 NOV 2017      Scott Streule    I wanna go fast, but I really just wanna categorize support cases by inbound email address
 *
 */

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
	function(record, search) {

		function beforeSubmit(context) {

		log.debug({
			title: 'Context.Type is ',
			details: context.type
		});

			if (context.type == context.UserEventType.CREATE) {

				//custrecord_pay_file_5_digit_file_id
				var newSupportCase = context.newRecord;
				
				//var newSupportCaseID = newSupportCase.id;
				var inboundEmail = newSupportCase.getValue({
					fieldId: 'inboundemail'
				});

				//GOTTA CHECK TO SEE IF THERE IS AN INBOUND EMAIL
				//IF THERE IS NOT AN INBOUND EMAIL THEN SKIP EVERYTHING BUT
				//IF THERE IS AN INBOUND EMAIL THEN DO ALL THE CATEGORIZATION
				if(inboundEmail){


					log.debug({
	            		title: 'inboundEmail = ',
	            		details: inboundEmail
	            	});



					//TIME TO DO A SEARCH AND FIND ANY CASE CATEGORIZATION EMAIL RECORDS 
					//USE THE INBOUND EMAIL ADDRESS (inboundEmail) AS THE SEARCH CRITERIA
					var caseCatSearch = search.create({
						type: 'customrecord_case_categorization_email',
						columns: [{
							name: 'custrecord_case_cat_email'
						}, {
							name: 'custrecord_case_cat_department',
						}, {
							name: 'custrecord_case_cat_queue'
						}, {
							name: 'custrecord_case_cat_category'
						}, {
							name: 'custrecord_case_cat_assignee' //GOTT ADD THIS LITTLE NUGGET INTO THE RECORD
						}],
						filters: [{
							name: 'custrecord_case_cat_email',
							operator: search.Operator.IS,
							values: inboundEmail
                        }, {
							name: 'isinactive',
							operator: search.Operator.IS,
							values: 'F'
						}]
					});
					var searchResults = caseCatSearch.run().getRange({
						start: 0,
						end: 20
					});

					if(searchResults.length === 1){
						//Do the Categorization
						//var caseCatList = searchResults;
						var caseCatDepartment =  searchResults[0].getValue({
								name: 'custrecord_case_cat_department'
							});
						var caseCatQueue =  searchResults[0].getValue({
								name: 'custrecord_case_cat_queue'
							});
						var caseCatCategory =  searchResults[0].getValue({
								name: 'custrecord_case_cat_category'
							});
						var caseCatAssignee =  searchResults[0].getValue({
								name: 'custrecord_case_cat_assignee'
							});
						//SET THE FIELD VALUES ON THE NEW CASE
						newSupportCase.setValue({
							fieldId: 'custevent_case_department',
							value: caseCatDepartment, 
							ignoreFieldChange: true
						});
						newSupportCase.setValue({
							fieldId: 'custevent_case_queue',
							value: caseCatQueue, 
							ignoreFieldChange: true
						});
						newSupportCase.setValue({
							fieldId: 'custevent_case_category',
							value: caseCatCategory, 
							ignoreFieldChange: true
						});
						newSupportCase.setValue({
							fieldId: 'assigned',
							value: caseCatAssignee, 
							ignoreFieldChange: true
						});

					}else if(searchResults.length < 1){

						//SET THE FIELD VALUES ON THE NEW CASE TO THE DEFAULT VALUES OF
						//DEPARTMENT - 6 --- Operations & Technology : Client Operations
						//QUEUE ------ 7 --- Uncategorized Support Email
						//CATEGORY --- 449 - Unreviewed Support Cases
                      	//DEPARTMENT - 39 -- Operations & Technology : Client Experience
						//QUEUE ------ 113 - General
						//CATEGORY --- 527 - Miscellaneous
						newSupportCase.setValue({
							fieldId: 'custevent_case_department',
							value: 39, 
							ignoreFieldChange: true
						});
						newSupportCase.setValue({
							fieldId: 'custevent_case_queue',
							value: 113, 
							ignoreFieldChange: true
						});newSupportCase.setValue({
							fieldId: 'custevent_case_category',
							value: 527, 
							ignoreFieldChange: true
						});
						//NO ASSIGNEE FOR DEFAULT CUSTOMER SUPPORT
						
					}else{
						//THIS IS A VERY BAD SITUATION IF WE GOT INTO THIS "ELSE".  THIS MEANS THAT THERE IS 
						//MORE ONE RESULT IN THE caseCatSearch FROM ABOVE.  IF THERE IS MORE THAN ONE RESULT
						//THAT MEANS THAT THERE IS MORE ONE customrecord_case_categorization_email WITH THE 
						//SAME EMAIL ADDRESS.
						//
						//LET'S LOG IT AS IF WE WERE CONTRACTED TO TEAR DOWN A WHOLE FOREST AND LET'S LEAVE 
						//NO STONE UNTURNED.  ACTUALLY JUST WRITE OUT THE INBOUND EMAIL ADDRESS
						
						log.debug({
							title: 'MORE THAN 1 customrecord_case_categorization_email RECORD FOUND FOR THIS INBOUND EMAIL ADDRESS',
							details: inboundEmail
						});
					}
				}else{
					//NO INBOUND EMAIL ADDRESS
					log.debug({
						title: 'NO INBOUND EMAIL ADDRESS',
						details: ''
					});
				}
			}
		}
		

		return {
			beforeSubmit: beforeSubmit
		};
	});








