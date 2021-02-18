//========================================================================================================================================
//========================================================================================================================================
function getTaxFormDocumentsFolder(taxYear) {
	
	var taxYearFolderName   = taxYear + " Shareholder Tax Documents";
	var taxYearFolderId;

	var filters       = [];
	var columns       = [];
	filters[0]        = new nlobjSearchFilter('custrecord_pri_as_app' ,null ,'is' ,[24]);
	filters[1]        = new nlobjSearchFilter('name'                  ,null ,'is' ,'Parent Folder For Tax Forms');
	columns[0]        = new nlobjSearchColumn('custrecord_pri_as_value');
	var searchresults = nlapiSearchRecord('customrecord_pri_app_setting' ,null ,filters ,columns );
	var parentFolder  = JSON.parse(searchresults[0].getValue('custrecord_pri_as_value'));
    
    // see if Destination Folder exists, if not create it
	var col_internalid = new nlobjSearchColumn('internalid');
	var arrColumns = [col_internalid ];	
	var arrFilters = [];
	arrFilters.push( new nlobjSearchFilter('parent' ,null  ,'anyof' ,[parentFolder] ) );
	arrFilters.push( new nlobjSearchFilter('name'   ,null  ,'is'    ,[taxYearFolderName] ) );
	
	searchResults = nlapiSearchRecord('folder' ,null ,arrFilters ,arrColumns);
	
	if (searchResults.length == 0) {
		try {
			var folder = nlapiCreateRecord('folder');
			folder.setFieldValue('parent' ,parentFolder); // create root level folder
			folder.setFieldValue('name'   ,destinationFolderName);
			taxYearFolderId = nlapiSubmitRecord(folder);	
		}
		catch(e) {
			// try search again just in case 2 scripts were trying this simultaneously
			var searchResults2 = nlapiSearchRecord('folder',null, arrFilters, arrColumns);
			if (searchResults2.length > 0) { taxYearFolderId = searchResults2[0].getValue("internalid"); }
			else { throw "Exception when creating Tax Forms folder: " + JSON.stringify(e); }
		}
	}
	else { taxYearFolderId = searchResults[0].getValue("internalid"); }
	
	return taxYearFolderId;
}


//========================================================================================================================================
//========================================================================================================================================
