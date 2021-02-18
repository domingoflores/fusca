/**
 * Module Description
 * Script runs designated search with filter for Exchange Records with
 * the same Exchange Hash.
 *
 * Version    Date            Author           Remarks
 * 1.00       29 Oct 2015     Ken Crossman
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function findpoemployee(vendorbill)
{
  // nlapiLogExecution('DEBUG','Whatever','Starting...');
  //retrieve context and passed parameters from the context.
	var context = nlapiGetContext();
	var vendorbill = context.getSetting('SCRIPT','custscript_vendor_bill'); //the vendor bill we're interested in

  nlapiLogExecution('DEBUG','VB Parameter',vendorbill);

  // Define search filters
  var filters = new Array();
  filters[0] = new nlobjSearchFilter('type', null, 'anyof', 'VendBill');
  filters[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
  filters[2] = new nlobjSearchFilter('transactionnumber', null, 'is', vendorbill);
  // nlapiLogExecution('DEBUG','filter',JSON.stringify(filters));
  // Define return columns
  var columns = new Array();
  columns[0] = new nlobjSearchColumn( 'createdfrom' );
  // nlapiLogExecution('DEBUG','Columns',JSON.stringify(columns[0]));

  var results = nlapiSearchRecord('transaction', null, filters, columns);
  // var results = nlapiSearchRecord('transaction', 'customsearch4067');

  var createdFrom = 0;

  if(results.length > 0){
      createdFrom = results[0].getValue('createdfrom');

      if(createdFrom){
        var poRecord = nlapiLoadRecord('purchaseorder', createdFrom);

        //TODO: Return value from porecord
        nlapiLogExecution('DEBUG','Return val',poRecord.getFieldValue('employee'));
        return poRecord.getFieldValue('employee');
      }

      return 0;
  }

  return 0;

}
