function updateDeptClassLocation(rec_type, rec_id) {

try{

   var record = nlapiLoadRecord( rec_type, rec_id);
   lines = record.getLineItemCount('line');

   for ( var j = 1 ; j<= lines ; j++ ) 
   { 
	    record.setLineItemValue('line', 'department', j, nlapiGetContext().getSetting('SCRIPT', 'custscript_dept_update'));
        record.setLineItemValue('line', 'class', j, nlapiGetContext().getSetting('SCRIPT', 'custscript_class_update'));
        record.setLineItemValue('line', 'location', j, nlapiGetContext().getSetting('SCRIPT', 'custscript_location_update'));
   }

    nlapiSubmitRecord(record, false, true);

nlapiLogExecution('AUDIT', 'SRS_UpdateDeptClassLoc', 'Last Record ID Updated: ' + rec_id);	
}
catch(e){
nlapiLogExecution('ERROR', 'SRS_UpdateDeptClassLoc', 'Error: ' + e);
}
}