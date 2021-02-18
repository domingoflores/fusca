/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

// deployed

define(['N/file','N/ui/serverWidget'],

function(file, ui) {

    function onRequest(context) {
    	
    	var form = {};
    	
    	var chartistCSS = file.load({  // CSS file for the library
    		id: 'SuiteScripts/SW17/Assets/styles/chartist.min.css'
    	}).url;
    	
    	var chartistJS = file.load({   // script file for the library
    		id: 'SuiteScripts/SW17/Assets/scripts/chartist.min.js'
    	}).url;
    	
    	var chartCreator = file.load({  // client script
    		id: 'SuiteScripts/SW17/Client/create_chart.js'
    	}).url;
    	
    	var html = file.load({            // html template for Suitelet
    	    id: 'SuiteScripts/SW17/Assets/templates/charts.html'
    	}).getContents();      // file.load just gets File Cabinet object; need to call getContents()
    	
    // adding css header & script sources to our HTML template
    	var styles = '<link rel="stylesheet" type="text/css" href="' + chartistCSS + '">'; 	
    	html = styles + html;
    	html += '<script src="' + chartistJS + '"></script>'
            + '<script src="' + chartCreator + '"></script>';

    	form = ui.createForm({
    		title: 'Charts',
          	hideNavBar: true
    	});

    	var charts = form.addField({
    		id: 'custpage_upload',
    		label: 'charts',
    		type: 'INLINEHTML'
    	});
    	
    	charts.defaultValue = html;

    	context.response.writePage(form);

    };

    return {
        onRequest: onRequest
    };
    
});