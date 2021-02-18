/**
 * Module Description
 * Script attempts to find the Next Approver in sequence based on the following input parameters:
 * 1) Vendor Bill Type
 * 2) Sequence of approval
 *
 * Version    Date            Author           Remarks
 * 1.00       26 Feb 2016     Ken Crossman
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function findvbnextapprover()
{
  // nlapiLogExecution('DEBUG','Whatever','Starting...');
  //retrieve context and passed parameters from the context.
	var context = nlapiGetContext();
	var vendorbilltype = context.getSetting('SCRIPT','custscript_vendor_bill_type'); //the vendor bill we're interested in
        var approvalseq = context.getSetting('SCRIPT','custscript_approval_sequence'); //the approval sequence of the current approver
        nlapiLogExecution('DEBUG','App Seq Before',approvalseq);
//	approvalseq = parseInt(approvalseq) + 1;
        nlapiLogExecution('DEBUG','App Seq After',approvalseq);
        nlapiLogExecution('DEBUG','VB Type',vendorbilltype);

  // Define search filters
  var filters = new Array();
  filters[0] = new nlobjSearchFilter('custrecord_vba_vendor_bill_type', null, 'anyof', vendorbilltype);
  filters[1] = new nlobjSearchFilter('custrecord_vba_approval_sequence', null, 'equalto', approvalseq);

  // nlapiLogExecution('DEBUG','filter',JSON.stringify(filters));
  // Define return columns
  var columns = new Array();
  columns[0] = new nlobjSearchColumn( 'custrecord_vba_approver_primary' );
  columns[1] = new nlobjSearchColumn( 'custentity_available_for_vb_approvals','custrecord_vba_approver_primary' );
  columns[2] = new nlobjSearchColumn( 'custrecord_vba_approver_backup' );
  columns[3] = new nlobjSearchColumn( 'custentity_available_for_vb_approvals','custrecord_vba_approver_backup' );
  // nlapiLogExecution('DEBUG','Columns',JSON.stringify(columns[0]));

  var results = nlapiSearchRecord('customrecord_vendor_bill_approver', null, filters, columns);
 nlapiLogExecution('DEBUG','Search Results',JSON.stringify(results));
  var nextapprover = 0;

  if(results && results.length > 0){
      primary_approver_available =  results[0].getValue('custentity_available_for_vb_approvals','custrecord_vba_approver_primary');
      backup_approver_available =  results[0].getValue('custentity_available_for_vb_approvals','custrecord_vba_approver_backup');
      nlapiLogExecution('DEBUG','Primary Approver Available',primary_approver_available);
      if(primary_approver_available == 'T') {
          nextapprover = results[0].getValue('custrecord_vba_approver_primary');
          }
      else {
             if(backup_approver_available == 'T') {
                nextapprover = results[0].getValue('custrecord_vba_approver_backup');
                 }
              else {
                  nextapprover = results[0].getValue('custrecord_vba_approver_primary');
                  }
           }
      nlapiLogExecution('DEBUG','Next Approver',nextapprover);
	return nextapprover;
      }
      return 0;
  }
