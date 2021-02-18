/*
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.0       03 Jan 2013     Jay
 *
 */

// TODO: new iframe page to display accounts -- display a drop down "Bank Account" send off to iframe
// TODO: file recovery - process internal ids for processed checks
// TODO: email iframe
// TODO: persistent printer




function printTest(){
	var url = nlapiResolveURL('SUITELET', 'customscript_pp_sl_testprint', 'customdeploy_pp_sl_testprint');
	url = url + "&timestamp=" + (new Date().getTime()).toString();
	
	var HPO = nlapiGetFieldValue('custrecord_pp_horizontal_page_offest');
	var VPO = nlapiGetFieldValue('custrecord_pp_vertical_page_offset'); 
	var HMO = nlapiGetFieldValue('custrecord_pp_horizontal_micr_offset');
	var VMO = nlapiGetFieldValue('custrecord_pp_vertical_micr_offset');
	var name = nlapiGetFieldValue('custrecord_pp_printer_name');
	var id = nlapiGetRecordId() || "";
	var print = {
			'printer' : JSON.stringify({
				'printer_name':name + "-" + id,				
				"page_offsets":{ 'x':HPO, 'y':VPO },
				"micr_offsets":{ 'x':HMO, 'y':VMO }
			})
		};
	
	try{
		
		// poll status of job here
		var win = new Ext.Window({
			html: '<div id="custcontent_val">Initializing</div>',
            //layout:'fit',
            title: '',
            width:610,
            //height:400,
            modal: true,
            plain: true,
            listeners: {
            	afterrender: function(){
            		// this run function lives in pp_cs_status_progress
            		
            	}
            },
            buttons: [{
                text: 'Close',
                handler: function(){
                    win.close();
                }
            }]
        });
		
		win.show();
		
		
		// creates the job
	    nlapiRequestURL(url, print, null, function(d){
			var m = JSON.parse(d.getBody());
			if(m.jobID != ""){
				jQuery('#jobid').val(m.jobID);
				var printTest = true;
				run();
			}
	    });
	}catch(e){}
}