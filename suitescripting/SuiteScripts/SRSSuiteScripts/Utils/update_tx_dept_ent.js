function updateTX(){
var context = nlapiGetContext();

var records = nlapiSearchRecord('transaction', 2055 , null, null);     //this is the internalID for the transaction search
//nlapiSearchRecord();
try{
for ( var i = 0; records != null && i < records.length; i++ )
{
  var record = nlapiLoadRecord( records[i].getRecordType(), records[i].getId() ); 
 //nlapiLogExecution('AUDIT', 'SRS_UpdateDeptClassLoc', 'Working on ID: ' + records[i].getId()); 
        if((record.getFieldValue('class') == null) || (record.getFieldValue('class') == '')){
            record.setFieldValue('class', '1');
            }
        
        record.setFieldValue('department', '8');  //10 is Finance and admin - 8 is Corporate
     //   record.setFieldValue('location', '8');
 
    var expense = record.getLineItemCount('expense');
 
    for ( var j = 1 ; j<= expense ; j++ ) 
    { 
        record.setLineItemValue('expense', 'department', j, '8');
        var currentClass = record.getLineItemValue('expense', 'class', j);
        if((currentClass == null) || (currentClass == '')){
            record.setLineItemValue('expense', 'class', j, '1');
        }
       // record.setLineItemValue('expense', 'location', j, '8');
   }
 
    nlapiSubmitRecord(record, false, true);
 
nlapiLogExecution('AUDIT', 'SRS_UpdateDeptClassLoc', 'Last Record ID Updated: ' + records[i].getId());    

 if ( context.getRemainingUsage() <= 100 )
      {
nlapiLogExecution('AUDIT', 'SRS_UpdateDeptClassLoc', 'Remaining: ' + context.getRemainingUsage());            
 var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId())
         if ( status == 'QUEUED' )
            break;     
      }
    }
    
}
catch(e){
nlapiLogExecution('ERROR', 'SRS_UpdateDeptClassLoc', 'Error: ' + e);
}
}