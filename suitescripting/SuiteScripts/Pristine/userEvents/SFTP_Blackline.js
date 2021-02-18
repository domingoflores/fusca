/**
 * Module Description
 * This script is designed to run searches, get those search results, store those results in a string,
 * then send that string to the FTP library to create CSV files and send those files on a schedule 
 * via SFTP to Blacline for reconciliation.
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 May 2018     Scott Streule    I wanna go fast, but I really just wanna send files to Blackline via SFTP
 *
 */

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/file', 'N/runtime', '/SuiteScripts/Pristine/libraries/searchLibrary', '/SuiteScripts/Pristine/libraries/sftpLibrary'],
	function(record, search, file, runtime, searchLibrary, SFTPLibrary) {

		function afterSubmit(context) {
			
			//GET THE DATE COMPONENTS TO BE USED IN THE FILE NAME
			var fileDate = new Date();
			var day = fileDate.getDate();
			var month = fileDate.getMonth();
				month = month + 1;
			var year = fileDate.getFullYear();
			//CONTRUCT THE DATE FORMAT FOR THE FILENAME
			var fileNameDate = '';
				fileNameDate = month + '-' + day + '-' + year;
			
			//NEED TO CHECK ENVIRONMENTS FOR TESTING PURPOSES SINCE NOT ALL SEARCHES IN PRODUCTION ARE IN SANDBOX
			if (runtime.envType == 'SANDBOX'){
				var savedSearchIDArray = ['customsearch15048', 'customsearch15551', 'customsearch16077'];	
			}else if (runtime.envType == 'PRODUCTION'){
				var savedSearchIDArray = ['customsearch15048', 'customsearch15551', 'customsearch16621', 'customsearch16077', 'customsearch16671'];
			}
			
			var fileName = ''; //Set the fileName to be passed into the createFile function
			var fileType = ''; 
			var includeHeader = ''; 
			
			if (context.type == context.UserEventType.EDIT) {

				for (var ss = 0; ss < savedSearchIDArray.length; ss++){
					
					if(savedSearchIDArray[ss] == 'customsearch15048'){
						fileName = 'NS_Account_Paying_' + fileNameDate + '.txt';
						fileType = file.Type.PLAINTEXT;
						includeHeader = 0;
					}else if(savedSearchIDArray[ss] == 'customsearch15551'){
						fileName = fileNameDate + '_Transactions_NS.csv';
						fileType = file.Type.CSV;
						includeHeader = 1;	
					}else if(savedSearchIDArray[ss] == 'customsearch16621'){
						fileName = fileNameDate + '_Void_Transactions_NS.csv'; 
						fileType = file.Type.CSV;
						includeHeader = 1;	
					}else if(savedSearchIDArray[ss] == 'customsearch16077'){
						fileName =  fileNameDate + '_Stopped_Checks_NSV.csv'; 
						fileType =  file.Type.CSV;
						includeHeader = 1;	
					}else if(savedSearchIDArray[ss] == 'customsearch16671'){
						fileName = 'NS_Account_Escrows_' + fileNameDate + '.txt';
						fileType = file.Type.PLAINTEXT;	
						includeHeader = 0;
					}else{
						//WHAT IS GOING ON HERE????
					}
					var fileContents = loadAndRunSearch(fileType, savedSearchIDArray[ss], includeHeader);
					//CREATE THE FILE
					var fileID = createFile(fileContents, fileName, fileType);
					//LOAD THE FILE
					var blackLineFile = file.load({
						id: fileID
					});
					//GET THE CONTENTS
					fileContents = {
	                    name: blackLineFile.name,
	                    fileType: blackLineFile.fileType,
	                    contents: blackLineFile.getContents()
	                 };

					//SEND THE FILE OBJECT AND THE LOGIN CREDENTIALS TO THE SFTP LIBRARY
					// var sftpServerCreds = {
					// 	username: 'srsacquiom',
					// 	password: '9aySFtx9',
					// 	passwordGuid: '22369d6f615b4d9dad606598d4a1948e',
					// 	hostKey:'AAAAB3NzaC1yc2EAAAABEQAAAgEAwUis+xKf3Fg5Ywc27OQLosGWK4gkRrDy2x2nDZq2UWHE8lmgynlK6RGGQXFjnvT010jaIE+qysU18lPUxYo0TW4GJSXWdQ/NrcXDeCIGXEB+odt2EzZGm/B0xwUWD6PIR7MIAFZ5Q5VVB1VhtQC0D8h9C8nAxYpzGM7fpBPrv1vhGVNNzIYCOnLyCFTfY5w9TOUoIuS4xRr5pmH4r3FrQ8MeqSRPYeIY18w9Er8qDbC6U2fqNg5a6GCMfpn4LIkc8AQgA+WkwEqbyUUmQSpdkvsJx7Eg/mftySMzuW+DuxpkSkwdJ1gEZHlE/osv3IQCA29w84Tag74ibdhYyB+Fx5ebozAwIigAv495hloqx+aDgFz5uyblB4XKw86etV8D51HBeSO0etdzEVNmwbZAFM4B+jxVV45pL+gIvvZSRNfFP6d/+3KNvIU9wb3L85D/qhftRbG8emGzMjXHKJxjiPIYSdSpEYgaCMg9uMgNIrP2YkbQkaIl5voKCGS2LNz0dByGCR3AJLUW8KGvljUQzb9shxq+tO9NNmPcTPiq2StHXcVs3zaKXUNLT5f5LvFnoY/MEoCsOLQOjP71YB7Os3uocYWs0MTytOWmNJxoTN0kSoxRXiGUaQdkKyyujYTjVUCqqgzyKz/Luc6skj2HX/8/NY07UKomwdl9taPFij8=',
					// 	url: 'ftp.blackline.com',
					// 	port: 22
					// };
					// var targetDirectory = '/SBNA';
					var sftpServerCreds = {
						username: 'netsuite',
						password: 'rExbLKt8DJPXSdZvUgvtz9bxMZ6x7x7v',
						passwordGuid: '347ba44b190d422ca33c285c6b7a7cd7',
						hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDBRD/KOjiJSC53W4rsOJ/R+BaJnVlcbbuzWwrQZXicVoWy1LjNAbnOXW4MiqYq/j2STBHuorLFHWcyGB70nxhcpEMUYCaBigX+rJv/J7L+0s3ibntzGjnGUoBTKa2jk5MZKbOEI57x1AxFYtBr5F3hZjkwUBsBH3r+o+DhV/b+iToUpWlIYgJ94zPQDW5NoTlkqpecouXOiH9m0GPFyvH+ApJZmyYYmrlZXMuTJlRohTQ+CxujmfpLeJ3oqxxzoV59Lj7Hvea/WanS93LQ9QLN92bxlHGIeD1aO1f5zGtSWur2bn6b39Fv2bxsg7uOJRywrwA1m8fRIUYfCtZ5XAXn',
						url: '146.20.146.9',
						port: 22
					};
					var targetDirectory = '/BL';
					//SFTPLibrary.uploadFileBlackLine(fileContents, sftpServerCreds, targetDirectory);

				}

			}else{
			 	//DO NOTHING
			}
		}

		return {
			afterSubmit: afterSubmit
		};

		function loadAndRunSearch(fileType, savedSearchID, includeHeader){
			//SET A VARIABLE TO USE FOR ALL THE RESULTS
			var outputRowString = '';
			//LOAD SEARCH
			var savedSearch = search.load({
				id: savedSearchID
			});
			//RUN SEARCH 
			var searchResults = savedSearch.run();
			searchResults = searchLibrary.getSearchResultData(searchResults)

			// var searchResults = savedSearch.run().getRange({start: 0, end: 1000});
			//GET THE COLUMNS FOR THE HEADER
			if(includeHeader == 1){
				for (var i = 0; i < savedSearch.columns.length; i++) {
					//THIS IS THE HEADER ROW WHICH MAY OR MAY NOT BE NEEDED
					outputRowString += savedSearch.columns[i].label + ',';	
				}
              	//NEED TO REMOVE THE COMMA AT THE END OF THE HEADER ROW SO WE DON'T CREATE A BLANK COLUMN
              	outputRowString = outputRowString.slice(0,-1);
				//ADD A LINE RETURN AFTER THE HEADER ROW
				outputRowString += '\r\n';
			}

			for (var x = 0; x < searchResults.length; x++){
	
				for (var i = 0; i < savedSearch.columns.length; i++) {
					var colName = savedSearch.columns[i];
					//CALL FUNCTION TO FORMAT THE RESULTS STRING FOR EACH RESULT BASED ON THE FILETYPE
					var tempResult = searchResults[x].getText(colName);
					// var sts = 'getTEXT';
					// log.debug({
					// 	title: 'STS ' + colName + '_' + i,
					// 	details: sts + ': ' + JSON.stringify(tempResult)
					// });
					if(!tempResult) {
						//sts = 'getVALUE';
						tempResult = searchResults[x].getValue(colName);
					}
					// log.debug({
					// 	title: 'STS ' + colName + '_' + i,
					// 	details: sts + ': ' + JSON.stringify(tempResult)
					// });
					outputRowString += formatOutputRowString(fileType, tempResult);		 
				}
              	//IF THE FILE TYPE IS CSV WE NEED TO REMOVE THE LAST COMMA IN THE RESULT ROW
              	if(fileType == file.Type.CSV){
                 	outputRowString = outputRowString.slice(0,-1);
                }
				//ADD A LINE RETURN AFTER EACH RESULT
				outputRowString += '\r\n';
			}
			//SEND BACK ALL THE RESULTS
			return outputRowString;
		}

		//FORMAT EACH RESULT ROW BASED ON THE FILETYPE
		function formatOutputRowString(fileType, searchResultRow){
			if(fileType == file.Type.CSV){
				return '"' + searchResultRow + '"' + ',';
			}else if (fileType == file.Type.PLAINTEXT){
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
		};
	});
