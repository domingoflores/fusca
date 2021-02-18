//------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Function:         creProfileConfirmLineAncestry
//Script Type:         User Event
//Call:             Before Submit
//Date: 20150712
//------------------------------------------------------------------
function creProfileConfirmLineAncestry(parentName, visited) {
    "use strict";
    var j = 0;
    
    if (!parentName) 
    	return true;
    
    parentName = parentName.toLowerCase();
    if (parentName === nlapiGetFieldValue(creJSONroot.Records.CREProfile.fields.RecordName.fieldid).toLowerCase()) {
        return true;
    }
    if (visited.indexOf(parentName) >= 0) {
        return false;
    }
    visited.push(parentName);
    for (j = 1; j <= nlapiGetLineItemCount(CRE_PROFILE_LINE_ITEM_COLLECTION); j += 1) {
        if (parentName === nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.RecordName.fieldid, j).toLowerCase()) {
            return creProfileConfirmLineAncestry(nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentRecordName.fieldid, j), visited);
        }
    }
    return false;
}

//------------------------------------------------------------------
//Function:         creProfileBeforeLoad
//Description:      -- Create CRE Profile 'Test Profile' Button
//Example:            https://system.na1.netsuite.com/app/common/custom/custrecordentry.nl?rectype=194&id=4
//Script Type:         User Event
//Call:             Before Load
//Script:             customscript_pri_cre_profile_user_event
//                    https://system.na1.netsuite.com/app/common/scripting/script.nl?id=262
//Deployment         customdeploy_pri_cre_profile_event
//                    https://system.na1.netsuite.com/app/common/scripting/scriptrecord.nl?id=371
//Date: 20150712
//------------------------------------------------------------------
function creProfileBeforeLoad(type, form) {
    "use strict";
    if (String(type) === 'delete') {
        return;
    }
    
    if (String(type) === 'view') {
        //nlapiLogExecution('DEBUG', type, typeof(type));
        // show popup links for the template helper
        var url = nlapiResolveURL('SUITELET', CRE_PROFILE_TEST_SUITELET_ID, 1) + '&custpage_profile=' + nlapiGetRecordId();
        var scr = "nlOpenWindow('" + url + "', 'helper','width=1024,height=780,resizable=yes,scrollbars=yes');";
        form.addButton('custpage_test_profile', 'Test Profile', scr);
        
     // show popup links for the execute helper
        var url = nlapiResolveURL('SUITELET', CRE_PROFILE_EXECUTE_SUITELET_ID, 1) + '&custpage_profile=' + nlapiGetRecordId() + "&custpage_nav=F";
        var scr = "nlOpenWindow('" + url + "', 'helper','width=1024,height=350,resizable=yes,scrollbars=yes');";
        form.addButton('custpage_execute_profile', 'Execute Profile', scr);
    }

    if (String(type) === 'create' || String(type) === 'edit') {

	    //add employee lookup
		var fld = form.addField('custpage_employee', 'select', 'Sender Lookup', null, null).setHelpText('For ease of use, the Sender needs to be an employee integer. Because template syntax can be used, this field allows for the convenient lookup of the employee ID. This lookup field does not drive the profile. Only the saved values in the Sender field do.');	
		fld = form.insertField(fld, 'custrecord_pri_cre_profile_sender');
	
		//lookup employee list and load it up
		var filters = [];
		var columns = [];
		columns[0] = new nlobjSearchColumn('email');
		columns[1] = new nlobjSearchColumn('entityid').setSort();
		
		var searchresults = nlapiSearchRecord('employee', null, filters, columns);
		
		fld.addSelectOption('not a valid constant', '-- Select Sender Constant --');
		
		for (var i = 0; searchresults != null && i < searchresults.length; i++) {
			fld.addSelectOption(searchresults[i].getId(), searchresults[i].getValue('entityid') + ' : ' + searchresults[i].getValue('email'));
		};
    };

}; 

//-----------------------------------------------------------------------------------------------------------------------------------------//

//------------------------------------------------------------------
//Function:         creProfileBeforeSubmit
//Description:      validation:
//                        Rule: If profile type is Email, Sender, Recipient, and Subject are required
//                        Rule: If profile type is PDF, Document Name is required
//                        Rule: Each profile line must have Record Name <> Parent Record Name e.g. CUST <> SO
//                        Rule: Record Name must be used only once
//                        Rule: One Record Name Line must point to Header Record Name
//                              All other Record Name Lines must point to Parent Record Name Lines
//
//								2017.09:  Boban: Revision.  Parent may be blank, which means search will be performed without filters 
//Example:            https://system.na1.netsuite.com/app/common/custom/custrecordentry.nl?rectype=194&id=4
//Script Type:         User Event
//Call:             Before Submit
//Script:             customscript_pri_cre_profile_user_event
//                    https://system.na1.netsuite.com/app/common/scripting/script.nl?id=262
//Deployment         customdeploy_pri_cre_profile_event
//                    https://system.na1.netsuite.com/app/common/scripting/scriptrecord.nl?id=371
//Date: 20150712
//------------------------------------------------------------------

function creProfileBeforeSubmit(type) {
    "use strict";
  
    var func = "creProfileBeforeSubmit",
        i = 0,
        j = 0,
        recordName = "",
        parentName = "";

    try {

        // validate the internal integrity of all the profile line items

        for (i = 1; i <= nlapiGetLineItemCount(CRE_PROFILE_LINE_ITEM_COLLECTION); i += 1) {
            recordName = nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.RecordName.fieldid, i)
            parentName = nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentRecordName.fieldid, i);

            if (parentName) {
            	recordName = recordName.toLowerCase();
            	parentName = parentName.toLowerCase();

                if (!nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ChildKeyField.fieldid, i))
                    throw nlapiCreateError(func, "Line " + i + " requires a Child Key Field name because it specifies a Parent Record Name.");
                	
                if (!nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i))
                    throw nlapiCreateError(func, "Line " + i + " requires a Parent Key Field name because it specifies a Parent Record Name.");                	

                if (recordName === parentName) {
                    throw nlapiCreateError(func, "Line " + i + " refers to itself as the parent.  Record Name [" + recordName + "]");
                }
                // first, make sure that the recordName is unique in the list
                for (j = 1; j <= nlapiGetLineItemCount(CRE_PROFILE_LINE_ITEM_COLLECTION); j += 1) {
                    if (i !== j) {
                        if (recordName === nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.RecordName.fieldid, j).toLowerCase()) {
                            throw nlapiCreateError(func, "Multiple profile lines have the same Record Name [" + recordName + "]");
                        }
                    }
                }
                // finally, make sure that we don't have a recursive list, and that it can be traced back to the root
                if (!creProfileConfirmLineAncestry(parentName, [])) {
                    throw nlapiCreateError(func, "Line " + i + " with Record Name [" + recordName + "] refers to a Parent Record which does not exist [" + parentName + "], is part of a recursive loop, or it's ancestry doesn't trace back to the Root record.");
                }            	
            } else {
            	// no parent name, so make sure the other fields are blank
                if (nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ChildKeyField.fieldid, i))
                    throw nlapiCreateError(func, "Line " + i + " has no Parent, so it may not specify a Child Key Field.");
                	
                if (nlapiGetLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i))
                    throw nlapiCreateError(func, "Line " + i + " has no Parent, so it may not specify a Parent Key Field.");                	

            }
        }
    } catch (e) {
        if (e instanceof nlobjError) {
            nlapiLogExecution("ERROR", func, e.getCode() + " : " + e.getDetails());
        } else {
            nlapiLogExecution("ERROR", func, e.message);
        }
        throw nlapiCreateError(func, e);
    }
} // creProfileBeforeSubmit

//------------------------------------------------------------------
//Function:         creProfileClientFunctions
//Description:      Assist while using the CREProfile
//Author:			MZ 20160424
//------------------------------------------------------------------

function creProileFldChange(type, name, linenum){
	if (name == 'custpage_employee') {
		nlapiSetFieldValue('custrecord_pri_cre_profile_sender', nlapiGetFieldValue('custpage_employee'));
	};
};


