/**
 * File Upload Suitelet.
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function main(request, response) {
  if (request.getMethod() == 'GET') {

  } else {
    /* 
     * Executes when the form is submitted.
     * Saves the file on a folder in the File Cabinet
     */
    var file = request.getFile('file');
    var fileName = file.getName();

    file.setFolder(7463067);
    file.setEncoding('UTF-8');

    var fileId = nlapiSubmitFile(file);

  }
}