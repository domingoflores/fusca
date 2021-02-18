/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Dec 2012     Jay
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */


// TODO: setTimeout(function(){console.log('hi')}, 0); <- async 


$PPS.debug = true;
$PPS.where = "Numbering";

var accountid = null;
var ctx = nlapiGetContext();
/*function multipleRun(request, response){
	$PPS.log("*** Start ***");
		
	try{
		var ids = request.getParameter('ids').toString().split(",");
		accountid = request.getParameter('accountid');
		
		var _i = request.getParameter('i');
		var startCheckNumber = getNextCheckNumber(accountid); // 20 Units
		for(var i = 0; i < ids.length; i++){ // 20 Units each time through the loop
			var d = ids[i].split(":");
		
			nlapiSubmitField(changeType(d[1]), d[0], 'tobeprinted', 'F');
			nlapiSubmitField(changeType(d[1]), d[0], 'tranid', startCheckNumber.toString());
			
			startCheckNumber++;
		}
		response.write(JSON.stringify({'success':'true', 'error':''}));
	}catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message}));
	}
	$PPS.log("*** End ***");
}*/


/* These session functions are used for creating gapless numbering */
/*function getSession() {
	var session = ctx.getSessionObject('number');
	return JSON.parse(session);
}
function setSession(data) {
	ctx.setSessionObject('number', JSON.stringify(data));
}*/


/*function singleRun(request, response){
	$PPS.log("*** SR Start ***");
	var _i = request.getParameter('i');
		
	try{
		var startTime = new Date();
		var ids = request.getParameter('ids');
		accountid = request.getParameter('accountid');
		
		var startCheckNumber = getNextCheckNumber(accountid); // 20 Units
		if(!startCheckNumber){
			startCheckNumber = 1;
		}
		var d = ids.split(":");
	
		nlapiSubmitField(changeType(d[1]), d[0], ['tobeprinted','tranid'],[ 'F',startCheckNumber.toString()]);
		
		//nlapiSubmitField(changeType(d[1]), d[0], 'tobeprinted', 'F');
		//nlapiSubmitField(changeType(d[1]), d[0], 'tranid', startCheckNumber.toString());
	
		response.write(JSON.stringify({ 'success':'true', 'error':'', 'i':_i, 'checknumber':startCheckNumber }));
		var endTime = new Date();
		nlapiLogExecution('DEBUG', 'time elapsed', endTime - startTime);
	}catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message, 'i':_i}));
	}
	$PPS.log("*** End ***");
}*/

/*function singleRun(request, response){
$PPS.log("*** SR Start ***");
var _i = request.getParameter('i');
	
try{
	var startTime = new Date();
	var ids = request.getParameter('ids');
	accountid = request.getParameter('accountid');
	var d = ids.split(":");
	
	var rec = nlapiLoadRecord(changeType(d[1]), d[0], {recordmode: 'dynamic'});
	rec.setFieldValue('tobeprinted', 'F');
	nlapiSubmitRecord(rec);

	response.write(JSON.stringify({ 'success':'true', 'error':'', 'i':_i, 'checknumber':rec.getFieldValue('tranid') }));
	var endTime = new Date();
	nlapiLogExecution('DEBUG', 'time elapsed', endTime - startTime);
}catch(e){
	response.write(JSON.stringify({'success':'false', 'error':e.message, 'i':_i}));
}
$PPS.log("*** End ***");
}*/

function singleRun(request, response){
	$PPS.log("*** SR Start ***");
	//var _i = request.getParameter('i');
	var data;
	try{
		var dataStr = request.getParameter('data');
		data = JSON.parse(dataStr);
	}
	catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message}));
		return;
	}
	
	var result = {
			succeeded: [],
			failed: []
	};
	nlapiLogExecution('DEBUG', 'data', JSON.stringify(data));
	
	if(typeof data.toUnnumber == 'object'){
		for(var i = 0; i < data.toUnnumber.length; i++){
			try{
				var obj = data.toUnnumber[i];
				var d = obj.id.split(":");
				
				var rec = nlapiLoadRecord(changeType(d[1]), d[0], {recordmode: 'dynamic'});
				rec.setFieldValue('tobeprinted', 'T');
				nlapiSubmitRecord(rec);
				result.succeeded.push({i: obj.i, checknumber: rec.getFieldValue('tranid')});
			}
			catch(e){
				nlapiLogExecution('ERROR', e.name, e.toString());
				result.failed.push({i: obj.i});
			}
			
		}
	}
	
	if(typeof data.toNumber == 'object'){
		for(var i = 0; i < data.toNumber.length; i++){ // uses 35 gov units per loop
			try{
				var obj = data.toNumber[i];
				var d = obj.id.split(":");
				// tried using recordmode dynamic here to improve speed and cut
				// governance usage, but it did not work for some customers for some unknown reason
				// var rec = nlapiLoadRecord(changeType(d[1]), d[0], {recordmode: 'dynamic'});
				var rec = nlapiLoadRecord(changeType(d[1]), d[0]);
				var account = nlapiLoadRecord('account',  rec.getFieldValue('account'));
				rec.setFieldValue('tobeprinted', 'F');
				rec.setFieldValue('tranid', account.getFieldValue('curdocnum'));
				nlapiSubmitRecord(rec);
				result.succeeded.push({i: obj.i, checknumber: rec.getFieldValue('tranid')});
			}
			catch(e){
				nlapiLogExecution('ERROR', e.name, e.toString());
				result.failed.push({i: obj.i});
			}
		}
	}
	
	response.write(JSON.stringify({ 'success':'true', 'error':'', 'result' :  result}));

	$PPS.log("*** End ***");
}



/*function singleRunUnnumber(request, response){
	$PPS.log("*** Start Unnumber***");
	var _i = request.getParameter('i');
		
	try{
		var ids = request.getParameter('ids');
		accountid = request.getParameter('accountid');
		
		var d = ids.split(":");
		$PPS.log(typeof changeType);
		//get the accounts next check number
		var transaction = nlapiLoadRecord(changeType(d[1]), d[0]);
		var account = nlapiLoadRecord('account', accountid);
		var curdocnum = account.getFieldValue('curdocnum');
		var transid = transaction.getFieldValue('tranid');
		
		//if was the last check numbered, decrement the curdocnum
		if(curdocnum - 1 == transid){
			nlapiSubmitField('account', accountid, 'curdocnum', curdocnum - 1);
		}
		
		
		nlapiSubmitField(changeType(d[1]), d[0], 'tobeprinted', 'T');
		nlapiSubmitField(changeType(d[1]), d[0], 'tranid', 'To Print');
	
		response.write(JSON.stringify({ 'success':'true', 'error':'', 'i':_i, 'checknumber':'To Print' }));
	}catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message, 'i':_i}));
	}
	$PPS.log("*** End Unnumber***");
}*/
