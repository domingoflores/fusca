/**
 * sftpLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/sftp', 'N/file', 'N/runtime'],


	/**
	 * -----------------------------------------------------------
	 * sftpLibrary.js
	 * ___________________________________________________________
	 * Create an SFTP connection and send data to the SFTP server
	 *
	 * Version 1.0
	 * Author: Peter Gail, TJ Tyrrell
	 * ___________________________________________________________
	 */

	function(sftp, file, runtime) {

		/**
		 * Create an SFTP connection and send data
		 * to the SFTP server
		 * @param  {Object} sftpFile The file to be uploaded to the SFTP server
		 * @return {null}         void
		 */
		function uploadFile(sftpFile ,sftpServerCreds ,targetDirectory) {

			var funcName = "uploadFile";
			var sftpConnection = null;
			var uploadFile = null;
			var uploadSuccessful = false;

			/* ----- STEP 1: Open SFTP connection to server ----- */

			// Credentials
//			var sftpServerCreds = {
//			username: 'netsuite',
//			passwordGuid: 'redacted',
//			hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDBRD/KOjiJSC53W4rsOJ/R+BaJnVlcbbuzWwrQZXicVoWy1LjNAbnOXW4MiqYq/j2STBHuorLFHWcyGB70nxhcpEMUYCaBigX+rJv/J7L+0s3ibntzGjnGUoBTKa2jk5MZKbOEI57x1AxFYtBr5F3hZjkwUBsBH3r+o+DhV/b+iToUpWlIYgJ94zPQDW5NoTlkqpecouXOiH9m0GPFyvH+ApJZmyYYmrlZXMuTJlRohTQ+CxujmfpLeJ3oqxxzoV59Lj7Hvea/WanS93LQ9QLN92bxlHGIeD1aO1f5zGtSWur2bn6b39Fv2bxsg7uOJRywrwA1m8fRIUYfCtZ5XAXn',
//			url: '146.20.146.9',
//			port: 22
//			};
// 			var hostKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDBRD/KOjiJSC53W4rsOJ/R+BaJnVlcbbuzWwrQZXicVoWy1LjNAbnOXW4MiqYq/j2STBHuorLFHWcyGB70nxhcpEMUYCaBigX+rJv/J7L+0s3ibntzGjnGUoBTKa2jk5MZKbOEI57x1AxFYtBr5F3hZjkwUBsBH3r+o+DhV/b+iToUpWlIYgJ94zPQDW5NoTlkqpecouXOiH9m0GPFyvH+ApJZmyYYmrlZXMuTJlRohTQ+CxujmfpLeJ3oqxxzoV59Lj7Hvea/WanS93LQ9QLN92bxlHGIeD1aO1f5zGtSWur2bn6b39Fv2bxsg7uOJRywrwA1m8fRIUYfCtZ5XAXn';

			try {
				//log.debug(funcName ,'sftpServerCreds.username '     + sftpServerCreds.username);
				//log.debug(funcName ,'sftpServerCreds.passwordGuid ' + sftpServerCreds.passwordGuid);
				
              log.debug('SFTP CONNECTION', JSON.stringify(sftpServerCreds) );
				//
				sftpConnection = sftp.createConnection({
					username: sftpServerCreds.username,
					passwordGuid: sftpServerCreds.passwordGuid,
					url: sftpServerCreds.url,
					hostKey: sftpServerCreds.hostKey
				});
			} catch (err) {
				log.error('SFTP CONNECTION ERROR', err.toString());
				return uploadSuccessful;
			}

			/* ----- STEP 2: Create File ----- */
			try {
				log.audit(funcName + ' STEP 2: Create File' ,'sftpFile.name ' + sftpFile.name +", fileType="+ sftpFile.fileType +  ",  contents:" + sftpFile.contents);
				// if it's a plaintext then why is File Type CSV? I guess this has worked previously for plaintext..
				uploadFile = file.create({
					name: sftpFile.name,
					fileType: file.Type.CSV,
					contents: sftpFile.contents
				});
			} catch (err) {
				log.error('SFTP FILE CREATION ERROR', err.toString());
				return uploadSuccessful;
			}

			/* ----- STEP 3: Upload file to SFTP server ----- */
			try {
				log.debug(funcName ,'targetDirectory ' + targetDirectory+ ', Environment='+runtime.envType );
				if ( runtime.envType == 'PRODUCTION' ){
					sftpConnection.upload({
						directory: targetDirectory,
						filename: sftpFile.name,
						file: uploadFile,
						replaceExisting: true
					});
					uploadSuccessful = true;							
				} else {
					uploadSuccessful = true; // Pretend upload was successful so code in sandbox behaves properly
					log.error(funcName,'NON-PRODUCTION upload attempt in env=' + runtime.envType );
				}

				log.audit('SFTP UPLOAD ATTEMPT', sftpFile.name);
			} catch (err) {
				log.error('SFTP UPLOAD ERROR', err.toString());
			}
			return uploadSuccessful;
		}

		function uploadFileBlackLine(blackLineFile, sftpServerCreds, targetDirectory){

			var sftpConnection = null;
			var uploadFile = null;

			log.debug('In the uploadFileBlackLine function');

			/* ----- STEP 1: Create File ----- */
			try {
				uploadFile = file.create({
					name: blackLineFile.name,
					fileType: blackLineFile.fileType,
					contents: blackLineFile.contents
				});
			} catch (err) {
				log.error('SFTP FILE CREATION ERROR', err.toString());
			}

			/* ----- STEP 2: Open SFTP connection to server ----- */

			try {

				sftpConnection = sftp.createConnection({
					username: sftpServerCreds.username,
					passwordGuid: sftpServerCreds.passwordGuid,
					url: sftpServerCreds.url,
					hostKey: sftpServerCreds.hostKey
				});
			} catch (err) {
				log.error('SFTP CONNECTION ERROR', err.toString());
			}

			/* ----- STEP 3: Upload file to SFTP server ----- */

			try {
				log.debug('uploadFileBlackLine' ,'targetDirectory ' + targetDirectory + ', Environment='+runtime.envType );
				if ( runtime.envType == 'PRODUCTION' ){
					if (blackLineFile.name.indexOf("Account_Escrows") > -1 ){	// ATP-1416 - temporarily disable this 1 fiel from sending
						log.debug('ATP-1416 : blackLineFile.name = Account_Escrows', 'Not uploading "'+ blackLineFile.name + '" to Blackline' );
					} else {
						sftpConnection.upload({
							directory: targetDirectory,
							filename: blackLineFile.name,
							file: uploadFile,
							replaceExisting: true
						});
						log.audit('SFTP UPLOAD ATTEMPT', blackLineFile.name);
					}
				} else {
					log.error('uploadFileBlackLine','NON-PRODUCTION upload attempt in env=' + runtime.envType );
				}

			} catch (err) {
				log.error('SFTP UPLOAD ERROR', err.toString());
			}
		}

		return {
			uploadFile: uploadFile,
			uploadFileBlackLine: uploadFileBlackLine
		};

	}); // Class