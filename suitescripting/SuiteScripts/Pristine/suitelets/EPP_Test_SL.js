//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

/*
 * 
 * suitelet for testing code
 *  
 */


define(['N/ui/serverWidget', 'N/record', 'N/runtime', 'N/search', 'N/format', 'N/url', 'N/http', 'N/https', 'N/sftp', 'N/file', 'N/util', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_ServerLibrary'],  
	function(ui, record, runtime, search, format, url, http, https, sftp, file, util, appSettings, priLibrary) {

	"use strict"; 
	
		var scriptName = "EPP_Test_SL.";

		var _context;
		
		
		function onRequest(context) {
			log.debug('Suitelet entered','');				
			var funcName = scriptName + ".onRequest ";
		
			_context = context;

			try {

              testFTP(); 

			} catch (e) {
				writeToScreen("******* ERROR ******");
				writeToScreen("******* ERROR ******");
				writeToScreen("******* ERROR ******");
				writeToScreen(JSON.stringify(e));
			}
			

			
		}
		
		// ================================================================================================================================

		function testFTP() {
			log.debug('testFTP entered','');	
			var connection = sftp.createConnection({
				username: "netsuite",
				passwordGuid: "e1154e5e94304dad8e75f0af562702d5",
				url: "146.20.146.9",
				// port: 22,
				hostKey: "AAAAB3NzaC1yc2EAAAADAQABAAABAQDBRD/KOjiJSC53W4rsOJ/R+BaJnVlcbbuzWwrQZXicVoWy1LjNAbnOXW4MiqYq/j2STBHuorLFHWcyGB70nxhcpEMUYCaBigX+rJv/J7L+0s3ibntzGjnGUoBTKa2jk5MZKbOEI57x1AxFYtBr5F3hZjkwUBsBH3r+o+DhV/b+iToUpWlIYgJ94zPQDW5NoTlkqpecouXOiH9m0GPFyvH+ApJZmyYYmrlZXMuTJlRohTQ+CxujmfpLeJ3oqxxzoV59Lj7Hvea/WanS93LQ9QLN92bxlHGIeD1aO1f5zGtSWur2bn6b39Fv2bxsg7uOJRywrwA1m8fRIUYfCtZ5XAXn"
			}); 
			log.debug('connection established','');	
			writeToScreen("connection established");

			writeToScreen(JSON.stringify(connection)); 

			// try {
			// 	var EPPFile = file.load({
			// 					id: 15767689
			// 					});
			// 	log.audit('FILE LOAD ATTEMPT', EPPFile);
			// } catch (err) {
			// 	log.error('FILE LOAD ERROR', err.toString());
			// }
			
			// try {
			// 	//log.debug(funcName ,'targetDirectory ' + targetDirectory );
			// 	sftpConnection.upload({
			// 		directory: "/",
			// 		filename: "AcquiomFinancialLLC_011-27_KEN.csv",
			// 		file: EPPFile,
			// 		replaceExisting: true
			// 	});
			// 	log.audit('SFTP UPLOAD ATTEMPT', "AcquiomFinancialLLC_011-27.csv");
			// } catch (err) {
			// 	log.error('SFTP UPLOAD ERROR', err.toString());
			// }
		}
		
		function writeToScreen(msg) {
			_context.response.write(msg + "<br>");				
		}

		// ================================================================================================================================
			

			return {
				onRequest : onRequest
			};
});

