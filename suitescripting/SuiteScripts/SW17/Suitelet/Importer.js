/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/file','N/ui/serverWidget'],

function(file, ui) {

    function onRequest(context) {
    	
    	if( context.request.method === 'GET' ) {
	    	
	    	var form = {}, upload = {}, stylesArray = [], styles = '', html = '', dropzone = '', uploader = '';
	
	    	stylesArray.push( file.load({
	    		id: 'SuiteScripts/SW17/Assets/styles/basic.min.css'
	    	}).url );
	    	stylesArray.push( file.load({
	    		id: 'SuiteScripts/SW17/Assets/styles/dropzone.min.css'
	    	}).url );
	
	    	dropzone = file.load({
	    		id: 'SuiteScripts/SW17/Assets/scripts/dropzone.js'
	    	}).url;
	    	
	    	uploader = file.load({
	    		id: 'SuiteScripts/SW17/Client/import_file.js'
	    	}).url;
	
	    	html = file.load({
	    	    id: 'SuiteScripts/SW17/Assets/templates/uploader.html'
	    	}).getContents();
	
	    	for( var i = 0; i < stylesArray.length; i++ ) {
	    		styles += '<link rel="stylesheet" type="text/css" href="' + stylesArray[i] + '">';
	    	}
	    	
	    	html = styles + html;
	    	html += '<script src="' + dropzone + '"></script>' + '<script src="' + uploader + '"></script>';
	
	    	form = ui.createForm({
	    		title: 'Upload'
	    	});
	    	
	    	upload = form.addField({
	    		id: 'custpage_upload',
	    		label: 'upload',
	    		type: 'INLINEHTML'
	    	});
	    	
	    	upload.defaultValue = html;
	    	
	    	context.response.writePage(form);
    	} else {
log.error( 'File', context.request );
    	    var fileObj = file.create({
    		    name: context.request.files.file.name,
    		    fileType: context.request.files.file.fileType,
    		    contents: context.request.files.file,
    		    description: 'This is a plain text file.',
    		    encoding: file.Encoding.UTF8,
    		    folder: 7463067,
    		    isOnline: true
    		});
    	    
    	    fileObj.save();
    	}
    };

    return {
        onRequest: onRequest
    };
    
});
