var ocGlobal = ocGlobal || {};

function ocGetImageUrl(fileName) {
    var results = nlapiSearchRecord("file", null, [ 'name', 'is', fileName ]);
    if (results === null) {
        throw 'results === null; fileName=' + fileName;
    }
    if (results.length > 1) {
        throw 'results.length > 1; fileName=' + fileName;
    }
    // we expect only 1 file
    var fileId = results[0].getId();
    var url = nlapiResolveURL('mediaitem', fileId);
    return url;
}

/**
 * Returns the content of a file
 * 
 * @param {Object}
 *        fileName File name (excludes directory)
 */
function ocGetFileHtmlCode(fileName) {
    var logger = new ocobjLogger(arguments);    var fileId = null;    var file = null;    logger.log('fileName=' + fileName);
    if (fileName.indexOf('/') > -1) {        // full file path so load it        file = nlapiLoadFile(fileName);        fileId = file.getId();    } else {        // file name only, so search it first        var results = nlapiSearchRecord("file", null, [ 'name', 'is', fileName ]);        if (results === null) {            throw 'results === null; fileName=' + fileName;        }        if (results.length > 1) {            throw 'results.length > 1; fileName=' + fileName;        }        // we expect only 1 file        fileId = results[0].getId();    }    var url = nlapiResolveURL('mediaitem', fileId);
    var htmlCode = '';
    if (fileName.indexOf('.css') > -1) {
        htmlCode = '<link type="text/css" rel="stylesheet" href="' + url + '" />';
    }
    if (fileName.indexOf('.js') > -1) {
        htmlCode = '<script src="' + url + '"></script>';
    }
    if (fileName.indexOf('.html') > -1) {
        if (file === null) {            file = nlapiLoadFile(fileId);        }        htmlCode = file.getValue();
    }
    logger.end();
    return htmlCode;
}