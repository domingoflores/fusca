/*Create a user event beforeLoad function that takes type and form as parameters.
 *Later you will define the script execution context by providing a value for type.
 *The form argument instantiates a SuiteScript nlobjForm object, which allows you
 *to add fields and sublists later on in the script.
 */

/**
 * Module Description
 * Create a user event beforeLoad function that takes type and form as parameters.
 * Later you will define the script execution context by providing a value for type.
 * The form argument instantiates a SuiteScript nlobjForm object, which allows you
 * to add fields and sublists later on in the script.
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Apr 2017     Scott Streule	   LOOK!!!!  We need a BUTTON!!!!
 * 1.10       17 Jul 2018     Scott Streule	   Added the payment file type for the record to the URL parameters.  This little nugget 
 * 											   of data will be used in the suitelet to determine which searches to use, and which 
 * 											   file naming convention to use (ATP-265)
 *
 */
function launchEPPSuitelet(type, form) {
  var currentContext = nlapiGetContext();
  var currentRole = nlapiGetRole();
  //nlapiLogExecution('DEBUG', 'CURRENT ROLE is ', currentRole);
  var currentDepartment = nlapiGetDepartment();
  //nlapiLogExecution('DEBUG', 'CURRENT DEPARTMENT is ', currentDepartment);

  /*Define the value of the type argument. If the record is edited or viewed,
   *a field is added. Note that the script execution context is set to
   * userinterface. This ensures that this script is ONLY invoked from a user event
   *occurring through the UI.
   */
  if ((currentContext.getExecutionContext() == 'userinterface') && (type == 'edit' | type == 'view')) {
    // On Sample Tab, create a field of type inlinehtml.
    var createNewReqLink = form.addField('custpage_new_req_link', 'inlinehtml', null);

    // Define the parameters of the Suitelet that will be executed.
    var paymentFileCreation = nlapiGetRecordId();
    var payFileType = nlapiGetFieldValue('custrecord_pay_file_type');
    var linkURL = nlapiResolveURL('SUITELET', 'customscript_epp_suitelet', 'customdeploy_epp_suitelet') + '&custscript_payfilecreation=' + paymentFileCreation + '&custscript_payFileType=' + payFileType;
    // var linkURL = nlapiResolveURL('SUITELET', 'customscript_epp_suitelet', 'customdeploy_epp_suitelet') + '&custscript_payfilecreation=' + paymentFileCreation;

    // Create a link to launch the Suitelet.
    var newWindowParams = "width=1024, height=768,resizeable = 1, scrollbars = 1," +

      "toolbar = 0, location = 0, directories = 0, status = 0, menubar = 0, copyhistory = 0";
    //var setWindow = "window.open('" + linkURL + "','Suitelet Form 2','" + newWindowParams + "')";
    var setWindow = "window.location = '" + linkURL + "','Suitelet Form 2','" + newWindowParams + "';";

    var currentStatus = nlapiGetFieldValue('custrecord_pay_file_status');
    nlapiLogExecution('DEBUG', 'Suitelet Details', 'currentStatus is ' + currentStatus);

    // Add Button and attach suitelet to that button
    //if (currentStatus == null || currentStatus == 3  || currentStatus == 5){
    //currentDepartment 35 is Acquiom Operations
    //currentRole 1025 is Operations Manager
    if ((currentStatus == null) && ((currentDepartment == 35) || (currentRole == 1025) || (currentRole == 3)))
    {
    	form.addButton("custpage_redirect", "Payment File Search", setWindow);  
      
    } else {
      //DO NOT ADD THE BUTTON TO CREAT A PAYMENT FILE FROM THE EPP SUITELET
    }
    

  }
}