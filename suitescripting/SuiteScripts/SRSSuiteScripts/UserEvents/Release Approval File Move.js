/**
 * Module Description
 * This Script is used to move Release Approval Files stored in the file cabinet
 * from a public folder that the release team has Edit right to, into a secure
 * folder in the file cabinet that only members of the Release Approval Locked Folder Admins
 * group in NetSuite.
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Nov 2016     Scott			   This is gonna work!!!!
 * 1.01       23 Dec 2017     Scott			   Added functionality in the for loop of the loadSetFolderSubmitFile function
 * 												to add a new folder in the secureFolder for each individual release approval
 * 												record.  Without having a unique folder for each release approval record we 
 * 												can end up overwritting files with the same name and file type.
 * 1.02       22 Feb 2018     Scott			   Added a line in the loadSetFolderSubmitFile function to set the group on the new folder 
 *  * 											to be blank so that users can still download documents.  The folder is within a parent
 *  * 											folder that has a group restriction, so users cannot find the unrestricted folders
 *  * 											within the restricted parent folder NS-1288
 * 
 *
 */

function moveFile(){

	// Lets set some variables.  YEAH!!!
	// Log Type for nlapiLogExecution
	var logType = 'DEBUG';
	
	// Get the current Release Approval Record
	var releaseRec = nlapiGetNewRecord();
	var releaseApprovalStatus = releaseRec.getFieldValue('custrecord_escrow_payment_status');
	var releaseRecName = releaseRec.getFieldValue('name');
	var releaseRecId = releaseRec.getId();
	// LOG
	nlapiLogExecution(logType, 'What is the Release Approval Status of this record?', releaseApprovalStatus);

	// Documents on the Release Approval Record
	var document1ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc1');
	var document2ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc2');
	var document3ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc3');
	var document4ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc4');
	var document5ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc5');
	var document6ID = releaseRec.getFieldValue('custrecord_escrow_payment_doc6');
	
	// Lets build an array of the documents that exist on this record
	var docsToBeMoved = [];
	var fieldsToBeBlanked = [];

	if(document1ID != ''){
		docsToBeMoved.push(document1ID);
		fieldsToBeBlanked.push('custrecord_escrow_payment_doc1');
	}
	if(document2ID != ''){
		docsToBeMoved.push(document2ID);
		fieldsToBeBlanked.push('custrecord_escrow_payment_doc2');
	}
	if(document3ID != ''){
		docsToBeMoved.push(document3ID);
		fieldsToBeBlanked.push('custrecord_escrow_payment_doc3');
	}
	if(document4ID != ''){
		docsToBeMoved.push(document4ID);
		fieldsToBeBlanked.push('custrecord_escrow_payment_doc4');
	}
	if(document5ID != ''){
		docsToBeMoved.push(document5ID);
		fieldsToBeBlanked.push('custrecord_escrow_payment_doc5');
	}
	if(document6ID != ''){
		docsToBeMoved.push(document6ID);
		fieldsToBeBlanked.push('custrecord_escrow_payment_doc6');
	}

	// Call the function that will Load, Set the Folder, and Submit the file
	if(docsToBeMoved != ''){
		loadSetFolderSubmitFile(docsToBeMoved, logType, releaseApprovalStatus, releaseRecName, releaseRecId, fieldsToBeBlanked);

		// Check to see if this is a REJECTED Release Approval Process record
		if(releaseApprovalStatus == 4){
			// Call the function to remove the links to the docs that have been moved the the REJECTED folder
			removeLinksToRejectedDocs(fieldsToBeBlanked, releaseRec, logType);
		}
	}
	
}

function loadSetFolderSubmitFile(docsToBeMoved, logType, releaseApprovalStatus, releaseRecName, releaseRecId, fieldsToBeBlanked){
	//LOG
	// nlapiLogExecution(logType, 'Just entered the loadSetFolderSubmitFile', 'releaseApprovalStatus = ' + releaseApprovalStatus);
	// nlapiLogExecution(logType, 'What is this array?', 'docsToBeMoved = ' + docsToBeMoved);
	// nlapiLogExecution(logType, 'What is this array?', 'fieldsToBeBlanked = ' + fieldsToBeBlanked);
	// nlapiLogExecution(logType, 'What is the Release Record ID', 'releaseRecId = ' + releaseRecId);

	// Lets loop through this array and and load the files then
	// set the folder based on the current status 
	// of the record and submit the files
	var secureFolder = '6696185'; // Secure Folder to move in process documents into
	var secureFolderDeleted = '6699892'; // Secure Folder to move rejected documents into
	var loadedFile = '';
	var fileName = '';

	//MAJOR ISSUE - Need to put the active / approved / completed files in their own folders within the securefolder
	//Do we need to set permissions on these folders, or do the inherit the settings from the root folder
	//Need to get the Release Approval Record internal Id to append it to the folder name
	//Need to search and see if the folder already exists
	if(releaseApprovalStatus == 2){
		var existingSecFolder = searchFolders(releaseRecName, releaseRecId, secureFolder, logType);
		nlapiLogExecution(logType, 'existingSecFolder is', existingSecFolder);
		if(existingSecFolder !== 0){
			var folderId = existingSecFolder;
		}else{
			var newSecFolder = nlapiCreateRecord('folder');
				newSecFolder.setFieldValue('parent', secureFolder); // create new folder in the secure folder
				newSecFolder.setFieldValue('name', releaseRecName + ': ID = ' + releaseRecId); //name the new folder the name of the release record
				newSecFolder.setFieldValue('group', ''); //set the group to be nothing so users can still preview the files
			var folderId = nlapiSubmitRecord(newSecFolder);	
		}
	}


	for (var i = 0; i < docsToBeMoved.length; i++) {
		(loadedFile = nlapiLoadFile(docsToBeMoved[i]));
		if(releaseApprovalStatus == 2){
			// LOG
			nlapiLogExecution(logType, 'first if of the for loop in the loadSetFolderSubmitFile', 'releaseApprovalStatus = ' + releaseApprovalStatus);
				
			loadedFile.setFolder(folderId);	

			//loadedFile.setFolder(secureFolder);	
		}else if(releaseApprovalStatus == 4){
			nlapiLogExecution(logType, 'in the elseif of the for loop in the loadSetFolderSubmitFile', 'releaseApprovalStatus = ' + releaseApprovalStatus);
			loadedFile.setFolder(secureFolderDeleted);
			//Gotta set the file name and add _REJECTED_ and a timestamp at the end
			fileName = loadedFile.getName();
			//Decided on 12/28/16 that we do not need the timestamp in the file name
			//timeStamp = Date();
			//loadedFile.setName(releaseRecName + '_REJECTED_' + timeStamp + '_' + fileName);
			//if(fileName.length > 189){

			//}else{
				loadedFile.setName(releaseRecName + '_REJECTED_' + fileName);
			//}		

		}
		
		nlapiSubmitFile(loadedFile);
	}
}

//This function searches the existing folders in the secure Folder to see if there is already a 
//subfolder existing for this release record
function searchFolders(releaseRecName, releaseRecId, secureFolder, logType){

	var folderName = releaseRecName + ': ID = ' + releaseRecId;

    var folderResults = null;
    var folderColumns = new Array();
    var folderFilters = new Array();
    

    folderFilters[0] = new nlobjSearchFilter('name',null,'is',folderName);
    folderFilters[1] = new nlobjSearchFilter('parent',null,'is',secureFolder);
    
    folderColumns[0] = new nlobjSearchColumn('internalid');
    
    folderResults = nlapiSearchRecord('folder',null,folderFilters,folderColumns);

    if((folderResults !== null)&&(folderResults.length > 0)){
    	return folderResults[0].getValue(folderColumns[0]);	
    }else{
    	return 0;
    }
    

    nlapiLogExecution(logType, 'in searchFolders FUNCTION', 'folderResults = ' + folderResults);

}


function removeLinksToRejectedDocs(fieldsToBeBlanked, releaseRec, logType){

	nlapiLogExecution(logType, 'Just entered the removeLinksToRejectedDocs', 'fieldsToBeBlanked = ' + fieldsToBeBlanked);
	var currentField = '';

	for (var i = 0; i < fieldsToBeBlanked.length; i++) {
		currentField = fieldsToBeBlanked[i];
		releaseRec.setFieldValue(fieldsToBeBlanked[i], null);
	}
}
