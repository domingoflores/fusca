/**
 * Module Description
 * Custom tool to allow processing to happen before merge takes place
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Nov 2013     Pete
 * 1.01       10 Nov 2013     Pete
 * 1.02       30 May 2014     Pete             Only hide fields in UI context
 *
 */

// Before Load Deployed to Customer Records
// Hide the merge duplicates link if no duplicates exist or if it is a create operation
function BLHideLink(type, form){

	// Hiding links only matters in the UI - Added 5.30.14 (PRW)
	if (nlapiGetContext().getExecutionContext() != 'userinterface') return;
	
	var hideFld = false;
	if (type == 'create' || type == 'copy'){
		hideFld = true;
	} else {
		var duplicates = searchForDuplicates(nlapiGetRecordType(), nlapiGetRecordId());
		if (duplicates == null) hideFld = true;
	}
	
	if (hideFld) form.getField('custentity_qx_reviewandmergeduplicates').setDisplayType('hidden');
}

// Suitelet - Displays options for merging Duplicate records and a list of possible duplicates
function customMerge(request, response){
	
	// Create Form
	var mergeForm = nlapiCreateForm('Merge Records');
	var userMessage = '';

	// User is requesting the form
	if (request.getMethod() == 'GET') {

		// Get Parameters
		var recId = request.getParameter('recid');
		var recType = request.getParameter('rectype');
		if (recType == 'custjob') recType = 'customer';
		
		// Verify Parameters are valid
		if(recId != null && recId != '' && recType != null && recType != ''){

			// Search for Duplicates
			var duplResults = searchForDuplicates(recType, recId);

			// Add Fields
			var mergingRecFld = mergeForm.addField('mergingrec', 'select', 'Merging Record' , recType);
			mergingRecFld.setDefaultValue(recId);
			mergingRecFld.setDisplayType('inline');
			
			var mergeRecType = mergeForm.addField('mergerectype', 'text', 'Record Type');
			mergeRecType.setDefaultValue(recType);
			mergeRecType.setDisplayType('inline');
			
			var mergeInto = mergeForm.addField('mergeinto', 'select', 'Merge Into');
			mergeInto.addSelectOption('','');
			for(var i = 0; duplResults != null && i < duplResults.length; i++) 
				mergeInto.addSelectOption(duplResults[i].getId(),duplResults[i].getValue('entityid'));
			mergeInto.setMandatory(true);
			
			// Add Sublist
			var possDupl = mergeForm.addSubList('custpage_possibleduplicates', 'staticlist', 'Possible Duplicates');
			
			possDupl.addField('custpage_reclink', 'text', 'View|Edit');
			
			possDupl.addField('internalid', 'text', 'Internal Id');
			possDupl.addField('entityid', 'text', 'Entity Id');
			possDupl.addField('email', 'text', 'Email');
			possDupl.addField('category', 'select', 'Category', 'customercategory').setDisplayType('inline');
			
			possDupl.setLineItemValues(duplResults);
			
			if (duplResults != null) {
				for (var i = 1; i <= duplResults.length; i++) {
					var intId = possDupl.getLineItemValue('internalid', i);
					var viewRecURL = nlapiResolveURL('RECORD', recType, intId, 'VIEW');
					var editRecURL = nlapiResolveURL('RECORD', recType, intId, 'EDIT');
					possDupl.setLineItemValue('custpage_reclink', i, '<a target="_blank" href="' + viewRecURL + '">View</a>|' +
							'<a target="_blank" href="' + editRecURL + '">Edit</a>');
				}
			}
			
			
			mergeForm.addSubmitButton('Merge Records');
		} else {
			userMessage = 'Could not determine id or type of record to be merged';
		}
		
	// User is Submitting the form
	} else if (request.getMethod() == 'POST'){

		var startMergeRecType = request.getParameter('mergerectype');
		var startMergeMerging = request.getParameter('mergingrec');
		var startMergeInto  = request.getParameter('mergeinto');
		
		// Check that we have correct information
		if (startMergeMerging != null && startMergeMerging != '' && startMergeInto != null && startMergeInto != ''){
			
			// Search for existing merge approval record with these 2 entities
			var filters1 = new Array();
			filters1.push(new nlobjSearchFilter('custrecord_qx_mar_mergingrecord', null, 'anyof', startMergeMerging));
			filters1.push(new nlobjSearchFilter('custrecord_qx_mar_survivingrecord', null, 'anyof', startMergeInto));
			//filters1.push(new nlobjSearchFilter('custrecord_qx_mar_approvalstatus', null, 'noneof', '3')); // '3' = Rejected
			var matchingMAR1 = nlapiSearchRecord('customrecord_qx_mergeapproval', null, filters1);
			
			var filters2 = new Array();
			filters2.push(new nlobjSearchFilter('custrecord_qx_mar_mergingrecord', null, 'anyof', startMergeInto));
			filters2.push(new nlobjSearchFilter('custrecord_qx_mar_survivingrecord', null, 'anyof', startMergeMerging));
			//filters2.push(new nlobjSearchFilter('custrecord_qx_mar_approvalstatus', null, 'noneof', '3')); // '3' = Rejected
			var matchingMAR2 = nlapiSearchRecord('customrecord_qx_mergeapproval', null, filters2);
			
			// Only create new MAR Record if no other is found
			if (matchingMAR1 == null && matchingMAR2 == null){
				var mergeApprovalRec = nlapiCreateRecord('customrecord_qx_mergeapproval');
				
				mergeApprovalRec.setFieldValue('custrecord_qx_mar_recordtype', startMergeRecType);			
				mergeApprovalRec.setFieldValue('custrecord_qx_mar_mergingrecord', startMergeMerging);
				mergeApprovalRec.setFieldValue('custrecord_qx_mar_survivingrecord', startMergeInto);
				mergeApprovalRec.setFieldValue('custrecord_qx_mar_mergingrecordid', startMergeMerging);
				
				try {
					var newMAR = nlapiSubmitRecord(mergeApprovalRec);
					nlapiLogExecution('DEBUG', 'Successfully created MAR: ' + newMAR);
					userMessage = 'Successfully submitted merge for approval. Once approved, merge will happen automatically.';
				} catch (e) {
					var errResponse = 'Failed to create MAR: Merge Aborted. Please try again.';
					if (e instanceof nlobjError) errResponse += e.getCode() + ": " + e.getDetails();
					else errResponse += e.toString();
					nlapiLogExecution('ERROR', 'Failed to create MAR: Merge Aborted. Please try again.', errResponse);
					userMessage = errResponse;
				}
			} else {
				userMessage = 'There is already a Merge Approval Entered for these two records. Another merge cannot be created '
					+ ' for the same record combination.';
			}
			
		} else {
			userMessage = 'Could NOT Initiate Merge: One or more critical pieces of information is missing from this request. '
				+ 'Please restart the process by clicking the "Merge Duplicates" link on the original record.';
		}

	}
	
	// Display User Message
	if(userMessage != '') {
		var messagefld = mergeForm.addField('messagefld', 'text', 'Message:');
		messagefld.setDefaultValue(userMessage);
		messagefld.setDisplayType('inline');
	}
	
	// Add a link to view the merge approval records
	var linkToMAR = mergeForm.addField('linktomar', 'url', null);
	linkToMAR.setLinkText( 'View Merge Approval Records');
	linkToMAR.setDisplayType('inline');
	linkToMAR.setDefaultValue('/app/common/custom/custrecordentrylist.nl?rectype=406');
	
	// Return Page
	response.writePage(mergeForm);
}

// Scheduled Script - Review Merge Approval Records and process
function processMARRecords(){
	
	var manager = nlapiGetJobManager('DUPLICATERECORDS');

	var MARColumns = new Array();
	MARColumns.push(new nlobjSearchColumn('custrecord_qx_mar_recordtype'));
	MARColumns.push(new nlobjSearchColumn('custrecord_qx_mar_mergingrecord'));
	MARColumns.push(new nlobjSearchColumn('custrecord_qx_mar_survivingrecord'));
	MARColumns.push(new nlobjSearchColumn('custrecord_qx_mar_mergejobid'));	
	MARColumns.push(new nlobjSearchColumn('custrecord_qx_mar_mergingrecordid'));	
	
	// 1) Check if any jobs have finished and update the status
	var unfinishedFilters = new Array();
	unfinishedFilters.push(new nlobjSearchFilter('custrecord_qx_mar_mergejobid', null, 'isnotempty'));
	unfinishedFilters.push(new nlobjSearchFilter('custrecord_qx_mergestatus', null, 'noneof', ['3', '4'])); // 3 = Successful, 4 = Review
	
	var unfinishedMAR = nlapiSearchRecord('customrecord_qx_mergeapproval', null, unfinishedFilters, MARColumns);
	
	if (unfinishedMAR != null){

		for (var i = 0; i < unfinishedMAR.length; i++){
			
			var checkRecId = unfinishedMAR[i].getId();
			var checkJobId = unfinishedMAR[i].getValue('custrecord_qx_mar_mergejobid');
			var checkRecType = unfinishedMAR[i].getValue('custrecord_qx_mar_recordtype');
			var checkMergingRec = unfinishedMAR[i].getValue('custrecord_qx_mar_mergingrecord');
			var checkSurvivingRec = unfinishedMAR[i].getValue('custrecord_qx_mar_survivingrecord');
			var checkMergedRecId = unfinishedMAR[i].getValue('custrecord_qx_mar_mergingrecordid');
			
			// Check Status
			var jobFuture = manager.getFuture(checkJobId);
			if (jobFuture.isDone()){
				
				// Verify records have been merged by comparing ids
				var unfinishedMARMsg = '';
				var mergeStatus = '';
				
				if (checkMergingRec == checkSurvivingRec) {
					// Merge was successful, create SIE record
					var successCreatingSIE = createSIE(checkRecType, checkMergedRecId, checkSurvivingRec);
					
					if (successCreatingSIE){
						unfinishedMARMsg += 'SUCCESS: Record was merged successfully and a valid SIE record was generated. ';
						mergeStatus = '3'; // 3 = Successful
					} else {
						unfinishedMARMsg += 'ERROR: Record was merged successfully, however a valid SIE record could not be generated. '
							+ 'Please review and create the SIE record manually.';
						mergeStatus = '4'; // 4 = Review
					}
					
				} else {
					// Merge was not successful, record error
					unfinishedMARMsg += 'ERROR: Could not merge records, please review the Merge Operations Page for details';
					mergeStatus = '4'; // 4 = Review
				}
				
				var unfSubmitFields = [ 'custrecord_qx_mar_mergeprocessstatus', 'custrecord_qx_mergestatus' ];
				var unfSubmitValues = [ unfinishedMARMsg, mergeStatus ];
				nlapiSubmitField('customrecord_qx_mergeapproval', checkRecId, unfSubmitFields, unfSubmitValues);
				
			}
		}
	} else {
		nlapiLogExecution('AUDIT', 'No unfinished MAR records to process.');
	}
	

	
	// 2) Check if any MAR records have been approved and not yet submitted
	var approvedFilters = new Array();
	approvedFilters.push(new nlobjSearchFilter('custrecord_qx_mar_mergejobid', null, 'isempty'));
	approvedFilters.push(new nlobjSearchFilter('custrecord_qx_mar_approvalstatus', null, 'is', '2')); // 2 = Approved
	
	var approvedResults = nlapiSearchRecord('customrecord_qx_mergeapproval', null, approvedFilters, MARColumns);
	
	if (approvedResults != null){
		
		var ctx = nlapiGetContext();
		
		// Submit each approved record to the Merge Queue
		for (var j = 0; j < approvedResults.length; j++){
			
			// Verify that enough units remain, if not abandon script - remaining records will be processed in the next execution
			if (ctx.getRemainingUsage() < 102) {
				nlapiLogExecution('AUDIT', 'Delay Remaining Records', 'Not enough units remain to start the remaining merges. '
						+ 'Remaining records will be initiated in the next scheduled execution.');
				break;
			}
			
			var startRecId = approvedResults[j].getId();
			var startMergeMerging = approvedResults[j].getValue('custrecord_qx_mar_mergingrecord');
			var startMergeInto = approvedResults[j].getValue('custrecord_qx_mar_survivingrecord');
			var startMergeRecType = approvedResults[j].getValue('custrecord_qx_mar_recordtype');
			var approvedMARMsg = '';
			var approvedMergeStatus = '';
			var startedJobId = '';
			
			// Check that we have correct information
			if (startMergeMerging != null && startMergeMerging != '' && startMergeInto != null && startMergeInto != ''){

				// Initiate Merge
				var mergeJobRequest = manager.createJobRequest();

				// Set the entity type.
				switch(startMergeRecType) {
				case 'vendor':
					mergeJobRequest.setEntityType(mergeJobRequest.ENTITY_VENDOR);
					break;
				case 'contact':
					mergeJobRequest.setEntityType(mergeJobRequest.ENTITY_CONTACT);
					break;
				case 'partner':
					mergeJobRequest.setEntityType(mergeJobRequest.ENTITY_PARTNER);
					break;
				case 'customer':
					mergeJobRequest.setEntityType(mergeJobRequest.ENTITY_CUSTOMER);
					break;
				default:
					userMessage = 'Could not determine id or type of record to be merged';
					return;
				}
					
				// Define other Merge Parameters
				mergeJobRequest.setMasterSelectionMode(mergeJobRequest.MASTERSELECTIONMODE_SELECT_BY_ID);
				mergeJobRequest.setMasterId(startMergeInto);
				mergeJobRequest.setRecords([startMergeMerging]);
				mergeJobRequest.setOperation(mergeJobRequest.OPERATION_MERGE);

				// Place Job into the queue
				startedJobId = manager.submit(mergeJobRequest); // +100 Units
				
				if (startedJobId != null) {
					approvedMARMsg += 'PENDING: Job submitted successfully.';
					approvedMergeStatus = '2'; // 2 = Submitted
				} else {
					approvedMARMsg += 'ERROR: Could not initiate the merge operation. Will try again on the next execution';
					approvedMergeStatus = '1'; // 1 = Pending Approval
				}

			} else {
				approvedMARMsg += 'Do not have correct information to submit merge operation.';
			}
			
			// Record results of process
			var appSubmitFields = [ 'custrecord_qx_mar_mergeprocessstatus', 'custrecord_qx_mar_mergejobid', 'custrecord_qx_mergestatus' ];
			var appSubmitValues = [ approvedMARMsg, startedJobId, approvedMergeStatus];
			nlapiSubmitField('customrecord_qx_mergeapproval', startRecId, appSubmitFields, appSubmitValues); // +2
		}
	} else {
		nlapiLogExecution('DEBUG', 'No unapproved MAR records to initiate.');
	}
	
}


function createSIE(mergeRecType, mergingRec, mergeIntoRec){
	// Majority of this section is modified from the IntegrationLibrary.js script file by sbuttgereit
	
	//Now we need to get new Systems Integration Event instance, set the values and save it.
	var currSIERec = nlapiCreateRecord('customrecord_srs_sys_integration_event');
	var recordMergeXML = '::|SURVIVINGRECID|:|' + mergeIntoRec + '|:#'; 
	var integrationEventType = 0;
	
	switch(mergeRecType) {
		case 'contact':
			recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|CONTACT|:#';
			integrationEventType = '3';
			break;
		case 'customer':
			var currCat = nlapiLookupField(mergeRecType, mergeIntoRec, 'category');
			if(currCat == '1') {
				recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|DEAL|:#';
				integrationEventType = '4';
			} else if(currCat == '2') {
				recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|SHAREHOLDER|:#';
				integrationEventType = '2';
			} else {
				recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|FIRM|:#';
				integrationEventType = '1';
			}
			break;
		case 'vendor':
			recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|FIRM|:#';
			integrationEventType = '1';
			break;
		default:
			recordMergeXML = recordMergeXML+'::|RECORDTYPE|:|ERROR|:#';
			integrationEventType = '0';
			nlapiLogExecution('ERROR','createSIE','The function parameter must be either contact, customer, or vendor.  '+recordType+' is not a valid record type.');
	}
	
	recordMergeXML = recordMergeXML+'::|NETSUITE_MERGE_TEXT|:|' + mergingRec + '|:#';
	nlapiLogExecution('DEBUG','createSIE','The recordMergeXML value is: '+recordMergeXML);
	
	currSIERec.setFieldValue('custrecord_srs_sys_integration_payload', recordMergeXML);
	currSIERec.setFieldValue('custrecord_srs_sys_integration_type', integrationEventType);
	currSIERec.setFieldValue('custrecord_srs_sys_integration_event_sid', mergeIntoRec);
	currSIERec.setFieldValue('custrecord_srs_sys_integration_message','Custom merge operation conducted for record type: ' + mergeRecType);
	
	/* Do not submit Integration Sequence # - already assigned by user event scripts
	//Nasty hack to get the integration sequence set.
	var pad2 = '00';
	var pad4 = '0000';
	var hackDate = new Date();
	var dateStamp = (pad4+hackDate.getFullYear().toString()).slice(-pad4.length)+(pad2+(hackDate.getMonth()+1).toString()).slice(-pad2.length)+(pad2+hackDate.getDate().toString()).slice(-pad2.length)+(pad2+hackDate.getHours().toString()).slice(-pad2.length)+(pad2+hackDate.getMinutes().toString()).slice(-pad2.length)+(pad2+hackDate.getSeconds().toString()).slice(-pad2.length);

	currSIERec.setFieldValue('custrecord_srs_mcp_int_seq_sie', dateStamp);*/
	
	// Call to library function to set integration sequence
	currSIERec.setFieldValue('custrecord_srs_mcp_int_seq_sie', SRS.IntegrationLibrary.getDateBasedIntegrationSeq());
	
	
	//submit our newly created systems integration event record.
	var createdSuccessfully = false;
	try {
		var newSIE = nlapiSubmitRecord(currSIERec);
		nlapiLogExecution('DEBUG', 'Successfully created SIE: ' + newSIE);
		createdSuccessfully = true;
	} catch (e) {
		var errResponse = 'Reason: ';
		if (e instanceof nlobjError) errResponse += e.getCode() + ": " + e.getDetails();
		else errResponse += e.toString();
		nlapiLogExecution('ERROR', 'Failed to create SIE: Merge Aborted', errResponse);
	}
	
	return createdSuccessfully;
}


function searchForDuplicates(recType, recId){
	// Identify Duplicates
	
	var specCategories = ['1', '2']; // 'Deal' ID = 1, 'Shareholder' ID = 2
	
	var mergingRec = nlapiLookupField(recType, recId, ['email', 'category']);

	var duplFilters = new Array();
	duplFilters.push(new nlobjSearchFilter('internalid', null, 'noneof', recId));
	duplFilters.push(new nlobjSearchFilter('email', null, 'is', mergingRec.email));
	duplFilters.push(new nlobjSearchFilter('email', null, 'isnotempty'));

	// Additional Criteria for Customers
	if (recType == 'customer'){
		var specCategory = false;
		for (var i = 0; i < specCategories.length; i++)
			if (specCategories[i] == mergingRec.category) specCategory = true;
		if (specCategory) duplFilters.push(new nlobjSearchFilter('category', null, 'anyof', mergingRec.category));
		else duplFilters.push(new nlobjSearchFilter('category', null, 'noneof', specCategories));
	}
	
	var duplColumns = new Array();
	duplColumns.push(new nlobjSearchColumn('internalid'));
	duplColumns.push(new nlobjSearchColumn('entityid'));
	duplColumns.push(new nlobjSearchColumn('email'));
	duplColumns.push(new nlobjSearchColumn('category'));
	
	return nlapiSearchRecord(recType, null, duplFilters, duplColumns);
	
}



