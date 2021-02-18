/**
 * Module Description
 * This script is designed to run searches, get those search results, store those results in a string,
 * then send that string to the FTP library to create CSV files and send those files on a schedule 
 * via SFTP to Blackline for reconciliation.
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 May 2018     Scott Streule    I wanna go fast, but I really just wanna send files to Blackline via SFTP
 * 			  16 April 2019	  Paul Shea	       ATP-846 Blackline SFTP scripts we need to move the login credentials to an App Setting custom record.
* 2.0		  25 July 2019    Paul Shea        ATP-1059 Updates Saved Searches from being hardcoded to being in an App Setting to allow for easier updating
 */

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/file', 'N/runtime', '/SuiteScripts/Pristine/libraries/searchLibrary', '/SuiteScripts/Pristine/libraries/sftpLibrary', '/.bundle/132118/PRI_AS_Engine'],
	function(record, search, file, runtime, searchLibrary, SFTPLibrary, appSettings) {

		function execute(context) {

			//GET THE DATE COMPONENTS TO BE USED IN THE FILE NAMe
			var fileDate = new Date();
			var day = fileDate.getDate();
			var month = fileDate.getMonth();
			month = month + 1;
			var year = fileDate.getFullYear();
			//CONTRUCT THE DATE FORMAT FOR THE FILENAME
			var fileNameDate = month + '-' + day + '-' + year;

			// ATP-1059
			//------------------------------------------------------------------------------------------------------------

			// Pull in the array of Saved Search data
			var savedSearches = JSON.parse(appSettings.readAppSetting('Payment File Creation', 'Blackline SFTP Files'));

			for (var i = 0; i < savedSearches.length; i++) {

				// Replace the 'Date' string in the File Name and replace it with the actual month + day + year
				savedSearches[i].fileName = savedSearches[i].fileName.replace('Date', fileNameDate);

				// Set the correct enum value for the file type
				savedSearches[i].fileType = savedSearches[i].fileType == 'CSV' ? file.Type.CSV : file.Type.PLAINTEXT;

				// Set the correct includeHeader value
				savedSearches[i].includeHeader = savedSearches[i].includeHeader === 'Yes' ? 1 : 0;

				// END ATP-1059
				//------------------------------------------------------------------------------------------------------------

				var fileContents = loadAndRunSearch(savedSearches[i].fileType, savedSearches[i].internalId, savedSearches[i].includeHeader);
				//CREATE THE FILE
				var fileID = createFile(fileContents, savedSearches[i].fileName, savedSearches[i].fileType);
				//LOAD THE FILE
				var blackLineFile = file.load({
					id: fileID
				});
				//GET THE CONTENTS
				var fileContents = {
					name: blackLineFile.name,
					fileType: blackLineFile.fileType,
					contents: blackLineFile.getContents()
				};

				// ATP-846 Blackline SFTP scripts we need to move the login credentials to an App Setting custom record.
				//------------------------------------------------------------------------------------------------------------
				var sftpCredentials = JSON.parse(appSettings.readAppSetting('General Settings', 'Blackline SFTP Credentials'));

				var sftpServerCreds = {
					username: sftpCredentials.username,
					password: sftpCredentials.password,
					passwordGuid: sftpCredentials.passwordGuid,
					hostKey: sftpCredentials.hostKey,
					url: sftpCredentials.url,
					port: sftpCredentials.port
				};

				// End ATP-846
				//------------------------------------------------------------------------------------------------------------

				var targetDirectory = '/BL';
				SFTPLibrary.uploadFileBlackLine(fileContents, sftpServerCreds, targetDirectory);


				var scriptObj = runtime.getCurrentScript();
				log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
			}

		}

		return {
			execute: execute
		};

		function pause(waitTime) { //seconds
			try {
				var endTime = new Date().getTime() + waitTime * 1000;
				var now = null;
				do {
					//throw in an API call to eat time
					now = new Date().getTime(); //
				} while (now < endTime);
			} catch (e) {
				log.error({
					title: 'pause',
					details: 'ran out of sleep'
				});
			}
		}

		function loadAndRunSearch(fileType, savedSearchID, includeHeader) {
			//SET A VARIABLE TO USE FOR ALL THE RESULTS
			var outputRowString = '';
			//LOAD SEARCH
			var savedSearch = search.load({
				id: savedSearchID
			});
			//RUN SEARCH
			var searchResults = savedSearch.run();


			searchResults = searchLibrary.getSearchResultData(searchResults)


			log.debug({
				title: 'loadAndRunSearch',
				details: 'searchResults.length=' + searchResults.length
			});

			// var searchResults = savedSearch.run().getRange({start: 0, end: 1000});
			//GET THE COLUMNS FOR THE HEADER
			if (includeHeader == 1) {
				for (var i = 0; i < savedSearch.columns.length; i++) {
					//THIS IS THE HEADER ROW WHICH MAY OR MAY NOT BE NEEDED
					outputRowString += savedSearch.columns[i].label + ',';
				}
				//NEED TO REMOVE THE COMMA AT THE END OF THE HEADER ROW SO WE DON'T CREATE A BLANK COLUMN
				outputRowString = outputRowString.slice(0, -1);
				//ADD A LINE RETURN AFTER THE HEADER ROW
				outputRowString += '\r\n';
			}

			for (var x = 0; x < searchResults.length; x++) {

				for (var i = 0; i < savedSearch.columns.length; i++) {
					var colName = savedSearch.columns[i];
					//CALL FUNCTION TO FORMAT THE RESULTS STRING FOR EACH RESULT BASED ON THE FILETYPE
					var tempResult = searchResults[x].getText(colName);
					if (!tempResult) {
						tempResult = searchResults[x].getValue(colName);
					}
					outputRowString += formatOutputRowString(fileType, tempResult);
				}
				//IF THE FILE TYPE IS CSV WE NEED TO REMOVE THE LAST COMMA IN THE RESULT ROW
				if (fileType == file.Type.CSV) {
					outputRowString = outputRowString.slice(0, -1);
				}
				//ADD A LINE RETURN AFTER EACH RESULT
				outputRowString += '\r\n';
			}
			//SEND BACK ALL THE RESULTS
			return outputRowString;
		}

		//FORMAT EACH RESULT ROW BASED ON THE FILETYPE
		function formatOutputRowString(fileType, searchResultRow) {
			if (fileType == file.Type.CSV) {
				return '"' + searchResultRow + '"' + ',';
			} else if (fileType == file.Type.PLAINTEXT) {
				return searchResultRow + '\t';
			}
		}

		//CREATE A FILE
		function createFile(fileContents, fileName, fileType) {
			var myFile = file.create({
				name: fileName,
				fileType: fileType,
				contents: fileContents,
				folder: '10611965'
			});
			return myFile.save();
		}
	});
