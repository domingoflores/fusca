/*Create a user event beforeLoad function that takes type and form as parameters.
 *Later you will define the script execution context by providing a value for type.
 *The form argument instantiates a SuiteScript nlobjForm object, which allows you
 *to add fields and sublists later on in the script.
 */
function launchdocselection(type, form) {
  var currentContext = nlapiGetContext();

  /* Note that the script execution context is set to
   * userinterface. This ensures that this script is ONLY invoked from a user event 
   * occurring through the UI.
   */
  if ((currentContext.getExecutionContext() == 'userinterface') && (type == 'edit' | type == 'view')) {

    //Define the parameters of the Suitelet that will be executed.
    var dealevent = nlapiGetRecordId();
    var linkURL = nlapiResolveURL('SUITELET', 'customscript_doc_selection', 'customdeploy_doc_selection') + '&custscript_dss_deal_event=' + dealevent;
    var setWindow = "window.open('" + linkURL + "')";

    //Add Button and attach suitelet to that button
    form.addButton("custpage_redirect", "Document Selection", setWindow);

  }
}