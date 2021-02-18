
function manageFields()
{

//Get user info
 var context = nlapiGetContext();
var userInternalID = context.getUser();

var searchresults = null;
var filters= new Array();
var columns= new Array();

    filters[0] = new nlobjSearchFilter('internalid', null, 'is', 230725);
    filters[1] = new nlobjSearchFilter('internalid', 'groupmember', 'is', userInternalID);
    
    columns[0] = new nlobjSearchColumn('internalid', 'groupmember' ); // Member Id

    try {
        // Check for user
        searchresults = nlapiSearchRecord('entitygroup', null, filters, columns); 
        // Return true if we have results
        if (searchresults){
            //User is in the group and should be able to edit

   //enable fields
   var legalHoldStartDate = form.getField('custevent_legalhold_start_date');
   if (legalHoldStartDate != null) {
     legalHoldStartDate.setDisabled(false);
    }
    
    var legalHoldEndDate = form.getField('custevent_legalhold_end_date');
   if (legalHoldEndDate != null) {
     legalHoldEndDate.setDisabled(false);
    }
   
        }        
    } catch (e) {
        nlapiLogExecution('DEBUG', e.name, e.message);

    }  
    
    }