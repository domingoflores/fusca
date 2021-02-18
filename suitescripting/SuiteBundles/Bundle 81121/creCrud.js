//-----------------------------------------------------------------
// Copyright 2015-2017, All rights reserved, Prolecto Resources, Inc.
//
// CRUD: Create, Read, Update, and Delete is the core CRE Engine. It
//	depends on related libraries in the script configuration including
//	Constants and JavaScript template engines
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


var lenth = 0;
var key = null;
var creJSONroot = JSON.parse(creJSON);

Object.cre_size = function(obj)
{

	// this object in only used for debugging purposes
	"use strict";
	var size = 0; // property counter 
	for (key in obj)
	{
		if (obj.hasOwnProperty(key))
		{
			size += 1;
		}
	}
	return size;
};

//initial setup
//1. copy default fields to all records
_.each(creJSONroot.Records, function (jsonrecord) {
    "use strict";
    _.extend(jsonrecord.fields, creJSONroot.DefaultFields);
});

//2. add all fields accessible as keys
nlapiLogExecution("DEBUG", "extending keys;", "");
_.each(creJSONroot.Records, function (jsonrecord) {
    "use strict";
    jsonrecord.fieldkeys = _.keys(jsonrecord.fields);
});

//3. add field name to each of the fields for easy access.
_.each(creJSONroot.Records, function (jsonrecord) {
    "use strict";
    lenth = jsonrecord.fieldkeys.length;
    /*var c;
    for (c = 0; c < lenth; c += 1) {
        key = jsonrecord.fieldkeys[c];
        jsonrecord.fields[key].fieldname = key; // add field name to the filed. so that it is easily accessible on that level
    }
    */
    jsonrecord.fieldkeys.forEach(function (key) {
        jsonrecord.fields[key].fieldname = key;
    });
});

//4. LastModifiedMS (milliseconds) to all fields
_.each(creJSONroot.Records, function (jsonrecord) {
    "use strict";
    lenth = jsonrecord.fieldkeys.length;
    jsonrecord.fieldkeys.forEach(function (key) {
        if (jsonrecord.fields[key].fieldtype !== "Internal") {
            jsonrecord.fields[key].LastModifiedMS = null;
        }
    });
    /*var c;
    for (c = 0; c < lenth; c += 1) {
        key = jsonrecord.fieldkeys[c];
        if (jsonrecord.fields[key].fieldtype !== "Internal") {
            jsonrecord.fields[key].LastModifiedMS = null;
        }
    }
    */
});

String.prototype.cre_trunc = String.prototype.cre_trunc ||
function(n){
	"use strict";
    return this.length>n ? this.substr(0,n-1) : this;
};

String.prototype.endsWith = function(suffix) {
	"use strict";
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

//------------------------------------------------------------------------------------------
//Object: cre_htmlDecode
//Description: In some special cases, Netsuite is not handling correctly < > signs. 
//				Transformation fails. This functions resolves that issue 
//Input:		
//Output:		 
//Date: BD 20150924
//------------------------------------------------------------------------------------------
//function cre_htmlDecode( input ) 
//{
//	"use strict";
//	if (input)
//	{
//		input = String(input).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
//		input = String(input).replace(/&amp;/g, "&");
//		return input;
//	}
//	else
//	{
//		return;
//	}
//}
//------------------------------------------------------------------
//Function: cre_castInt
//Description: returns integer if "2" is passed (insted of string). Note: parseInt("") === NaN
//Input:
//Date: Marko Obradovic 20141219
//------------------------------------------------------------------
function cre_castInt(value) {
  "use strict";
  if (_.isNull(value)) {
      return value;
  }
  return parseInt(value, CONST_RADIX_BASE10);

}
//------------------------------------------------------------------
//Function: cre_isValidNumber
//Description: used to validate internal id. If string is passed "2", it returns true
//              however, NaN returns true for _.isNumber, therefore need for cre_isValidNumber function
//Input:
//Date: Marko Obradovic 20141219
//------------------------------------------------------------------
function cre_isValidNumber(num) {
  "use strict";
  var value = cre_castInt(num);
  if (_.isNaN(value)) {
      return false;
  }
  if (!_.isNumber(value)) {
      return false;
  }
  return true;
}
function cre_getFolderName(folder_id) {
	"use strict";
	var ret_val = null;
	var filters = [];
	var func = "cre_getFolderName";
	
	if (!cre_isValidNumber(folder_id))
	{
		throw nlapiCreateError(func, "Invalid folder ID [" + folder_id + "].");
	}
	
	var columns = [new nlobjSearchColumn("name")];
	
	filters[0] = new nlobjSearchFilter("internalid", null, "is", folder_id);
	
	var results = nlapiSearchRecord("folder", null, filters, columns);
	if (results) {
		if (results.length)	{
			var result = results[0];
			//nlapiLogExecution("DEBUG", "result", JSON.stringify(result));
			ret_val = result.getValue("name");
		}
	}
	// folder was not found; create it
	return ret_val;
}

function cre_isValidEmail(value) 
{
	"use strict";
    var validEmailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var emails = [];
    var retvalue = false;
    var func = "cre_isValidEmail";
    
    if (value.constructor === Array)
    {
    	emails = value;
    }
    else
    {
    	emails = value.split(",");
    }
    nlapiLogExecution("DEBUG", "emails.length", emails.length);
    if (emails.length === 0)
    {
    	return retvalue;
    }
    
    _.each(emails, function (email) {
    	nlapiLogExecution("DEBUG", "email", email);
    	if (!email)
        {
    		retvalue = false;
        }
        if (email.length === 0) 
        {
        	retvalue = false;
        }
        else
        {
	        if (validEmailRegex.test(email)) {
	        	retvalue = true;
	        }
	        else
	        {
	        	throw nlapiCreateError(func, "Invalid email address [" + email + "].");
	        } 
        }
    });
    return retvalue;
}


function cre_today(input_param)
{
	"use strict";
	if (input_param.toLowerCase()==="today" || input_param.toLowerCase()==="sysdate" || input_param.toLowerCase()==="now"){
		if (input_param.toLowerCase()==="now"){
			input_param = nlapiDateToString(new Date(), "datetime").split("/").join("-");
		}else{
			input_param = nlapiDateToString(new Date(), "date").split("/").join("-");	
		}
	}
	if (input_param.toLowerCase()==="yesterday"){
		var d = new Date();
		d.setDate(d.getDate()-parseInt(1));
		input_param = nlapiDateToString(d, "date").split("/").join("-");
	}
	return input_param;
}

//------------------------------------------------------------------
//Function: cre_get_record_type
//Input: record id
//Output: Return the scriptable record type of the record id from the control to lookup records
//Date: SG 2014910
//------------------------------------------------------------------
function cre_get_record_type(id) {
"use strict";
var types = {
  "_-112": "account",
  "_-105": "accountingperiod",
  "_-22": "phonecall",
  "_-24": "campaign",
  "_-107": "campaignevent",
  "_-23": "supportcase",
  "_-101": "classification",
  "_-108": "competitor",
  "_-6": "contact",
  "_-122": "currency",
  "_-2": "customer",
  "_-109": "customercategory",
  "_-102": "department",
  "_-120": "emailtemplate",
  "_-4": "employee",
  "_-111": "employeetype",
  "_-104": "customerstatus",
  "_-20": "calendarevent",
  "_-124": "customfield",
  "_-26": "issue",
  "_-10": "item",
  "_-106": "itemtype",
  "_-103": "location",
  "_-116": "issuemodule",
  "_-31": "opportunity",
  "_-5": "partner",
  "_-115": "issueproduct",
  "_-114": "issueproductbuild",
  "_-113": "issueproductversion",
  "_-7": "job",
  "_-27": "projecttask",
  "_-121": "promotioncode",
  "_-25": "solution",
  "_-117": "subsidiary",
  "_-21": "task",
  "_-30": "transaction",
  "_-100": "transactiontype",
  "_-3": "vendor",
  "_-110": "vendorcategory"
};
return types["_" + id];
}
//------------------------------------------------------------------
//Function: cre_noempty
//Output: return the input_value if it has a value else the default value
//Description:
//Date: SG 20120311
//------------------------------------------------------------------
function cre_noempty(input_value, default_value) {
"use strict";
if (!input_value) {
    return default_value;
}
if (input_value.length === 0) {
    return default_value;
}
return input_value;
}

//------------------------------------------------------------------
//Function: cre_getRecordType
//Input: Transaction / Item internal id
//Output: Return the transaction type for the specified internalid
//Date: SG 2014910
//------------------------------------------------------------------
function cre_getRecordType(recType, recId) {
  "use strict";
  var filters = [new nlobjSearchFilter("internalidnumber", null, "equalto", recId)];
  var columns = [new nlobjSearchColumn("type")];
  var results = cre_noempty(nlapiSearchRecord(recType, null, filters, columns), {length: 0});

  if (results.length > 0) {
	  //nlapiLogExecution("DEBUG", "gettRANSACTIONType", results[0].getRecordType());
      return results[0].getRecordType();
  } else {
      return "";
  }
}
function cre_getCustomRecordType(internalId) {
  "use strict";
  var func = "cre_getCustomRecordType";
  try {
      var filters = [];
      filters.push(new nlobjSearchFilter("internalid", null, "anyof", internalId));

      var columns = [];
      columns.push(new nlobjSearchColumn("scriptid"));

      var results = nlapiSearchRecord("customrecordtype", null, filters, columns);

      if (results && results.length > 0) 
      {
    	  nlapiLogExecution("DEBUG", "cre_getCustomRecordType", "found " + results.length + " record(s) with internalId=" + internalId);
          return results[0].getValue("scriptid").toLowerCase();
      }
//      else
//      {
//    	  nlapiLogExecution("DEBUG", "cre_getCustomRecordType", "Custom Record Type not found");
//      }
//      nlapiLogExecution("DEBUG", "getAnyRecordTYpe", "found " + results.length + " record(s) with internalId=" + internalId);
//      for (var i = 0; i < results.length; i++) {
//          nlapiLogExecution("DEBUG", results[i].getRecordType() + "/" + results[i].getValue("scriptid"), results[i].getId() + "/" + results[i].getValue("name"));
//      }
  } catch (e) {
	  if (e instanceof nlobjError) 
	  {
		  throw nlapiCreateError(func, e.getCode() + " : " + e.getDetails());
      } 
	  else 
      {
		  throw nlapiCreateError(func, e.toString());
      }
  }
}


//------------------------------------------------------------------
//Function: cre_ResultsReceived
//Description: returns true if there are any elements in the response
//Input:
//Date: Marko Obradovic 20150211
//------------------------------------------------------------------
function cre_ResultsReceived(results) {
    "use strict";
    if (!results) {
        return false;
    }
    if (results.length === 0) {
        return false;
    }
    return true;

}
//------------------------------------------------------------------
//Function: cre_castFloat
//Description: returns float if "2.02" is passed (insted of string). Note: parseFloat("") === NaN
//Input:
//Date: Marko Obradovic 20141219
//------------------------------------------------------------------
function cre_castFloat(value) {
    "use strict";
    if (_.isNull(value)) {
        return value;
    }
    return parseFloat(value);

}
//------------------------------------------------------------------
//Function: cre_isValidCurrency
//Description: used to validate currency. If string is passed "2", it returns true
//                howver, NaN returns true for _.isNumber, therefore need for cre_isValidNumber function
//Input:
//Date: Marko Obradovic 20141219
//------------------------------------------------------------------
function cre_isValidCurrency(currency) {
    "use strict";
    var value = cre_castFloat(currency);
    if (_.isNaN(value)) {
        return false;
    }
    if (!_.isNumber(value)) {
        return false;
    }
    return true;
}

//------------------------------------------------------------------
//Object: CREProfileLineMethods
//Description: Methods available for custom collection queries
//Input:
//Date: Marko Obradovic 20141215
//------------------------------------------------------------------
function CREProfileLineMethods() {
    "use strict";
    // ------------------------------------------------------------------
    // Method: Latest
    // Description: Retrieves latest value
    // Date: Marko Obradovic 20141208
    // ------------------------------------------------------------------
    this.Latest = function () {
        return null;
    };
}

//------------------------------------------------------------------
//Object: cre_loadCollectionMethods
//Description: Creates Collection methods object on demand
//Input:
//Date: Marko Obradovic 20141215
//------------------------------------------------------------------
function cre_loadCollectionMethods(collection) {
    "use strict";
    var obj = null;
    switch (collection) {
    case "CREProfileLine":
        obj = new CREProfileLineMethods();
        break;
    }
    return obj;
}

//------------------------------------------------------------------
//Object: cre_LoadObject
//Description: used to create new objects if recordid is ommitted
//            used to load oobjects if recordid is provided
//used to load existing objects if recordid is provided
//Input: record name (constant)
//Date: Marko Obradovic 20141113
//------------------------------------------------------------------
function cre_LoadObject(recordid, recordname) {
"use strict";
var obj = null;
var isRelatedRecord = true;

switch (recordname) {
case "CREProfile":
    obj = new CREProfile(recordid, isRelatedRecord);
    break;
case "CREProfileLine":
    obj = new CREProfileLine(recordid, isRelatedRecord);
    break;

}
if (!_.isNull(obj)) {
    obj.isRelatedRecord = true; // if this is related record, set flag to true so collections for related records are not loaded
}

return obj;
}

//------------------------------------------------------------------
//Object: CRECollection
//Description: Main collection object.
//Input: Every collection has commit, All methods
//Date: Marko Obradovic 20141113
//------------------------------------------------------------------
function CRECollection() {
  "use strict";

  var creCollection = this;
  this.AllRecordsLoaded = false;
  // ------------------------------------------------------------------
  // Method: Latest
  // Description: Calculate which of the elements in collection is the most recent
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.Latest = function () {
      var internalid = null;

      if (this.arr.length === 0) {
          return null; // array is empty, return null
      }
      internalid = cre_castInt((_.max(this.arr, function (record) {

          return (record.Properties.LastModifiedMS);
      })).fields.InternalID.Value);

      if (!cre_isValidNumber(internalid)) {
          throw nlapiCreateError("ERROR", "Object must be saved prior to requesting Latest"); //object is not saved
      }
      return internalid;
  };
  // ------------------------------------------------------------------
  // Method: GetbyID
  // Description: Retrieves item in the array based on it's internal id
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.GetbyID = function (id) {
      if (this.arr.length === 0) {
          return null; // array is empty, return null
      }
      return _.find(this.arr, function (record) {
          return (record.fields.InternalID.Value === id.toString());
      });
  };

  // ------------------------------------------------------------------
  // Method: Add
  // Description: Adding New Record of collection's type to the array
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.Add = function (newRecordID) {
      var newRecord = new cre_LoadObject(newRecordID, this.collection_record_name);

      if (cre_isValidNumber(this.parent_internalid)) {
          newRecord.fields[this.parent_name].Value = this.parent_internalid; // update parerent object relationship asset master if it exists
      }
      newRecord.fields.InternalID.isDirty = true; // force dirty to all new objects
      newRecord.Properties.CreatedMS = Date.now(); // add created timestamp
      newRecord.Properties.LastModifiedMS = newRecord.Properties.CreatedMS;
      newRecord.fields.Created.Value = newRecord.Properties.CreatedMS;
      newRecord.fields.LastModified.Value = newRecord.Properties.CreatedMS;
      //        consolelog(newRecord);
      this.arr.push(newRecord);
      return newRecord;
  };
  // ------------------------------------------------------------------
  // Method: IsDirty
  // Description: returns true if size of array has changed or if any of the fields in the objects of array have been changed
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.IsDirty = function () {
      var dirty = false;
      var ldirty = false;
      var len = 0;
      var c = 0;
      if (this.init_size !== this.arr.length) {
          //            consolelog("Init Size of related records " + this.init_size + " is different than related records size of array " + this.arr.length);
          return true; // initial size of array has changed
      }
      // consolelog("checking " + arr.length + " related record(s)");
      if (_.find(this.arr, function (record) {

          len = record.fieldkeys.length;
          for (c = 0; c < len; c += 1) {
              key = record.fieldkeys[c];
              // consolelog("Checking key " + key + " " + record.fields[key].isDirty);
              // consoleklog(record);
              if (record.fields[key].isDirty === true) {
                  ldirty = true;
                  break;
              }
          }
          return ldirty;
      })) {
          dirty = true;
      }
      return dirty;
  };

  // ------------------------------------------------------------------
  // Method: Collection's all method
  // Description: retrive all related records from netsuite
  // Date: Marko Obradovic 20141120
  // ------------------------------------------------------------------
  this.all = function () {
      var relatedrecordid = creCollection.related_recordid;
      var parentinternalid = creCollection.parent_internalid;
      var related_record_parent_reference_field_id = creCollection.related_record_parent_reference_field_id;
      var record_name = creCollection.recordname;
      var filters = [];
      var columns = [];
      var multiselect = [];
      var results;
      var msg = "";
      var len = 0;
      var newRecordID = null; // constant to explain null
      var counter = 0;
      var counter2 = 0;
      var newRecord = null;

      nlapiLogExecution("DEBUG", "Required parentinternalid to load related records:", parentinternalid);
      if (!cre_isValidNumber(parentinternalid)) {
          nlapiLogExecution("DEBUG", "Required parentinternalid is invalid", parentinternalid);
          return false;        //parent id does not exist yet, has not been set yet
      }
      creCollection.AllRecordsLoaded = true;
      // since ware loading all records, drop all non dirty records from
      // collection

      //console.log("Found " + this.arr.length + " existing elements. ");
      //console.log ("parentinternalid " + parentinternalid);
      nlapiLogExecution("DEBUG", "array size ", this.arr.length);
      for (counter = this.arr.length - 1; counter >= 0; counter -= 1) {
          //            consolelog(counter + " is Dirty  " + this.arr[counter].IsDirty());
          if (!this.arr[counter].IsDirty()) {
              this.arr.splice(counter, 1);
          }
      }
      this.init_size = this.arr.length; // udpate init size
      // return;

      msg = "related_record_parent_reference_field_id " + related_record_parent_reference_field_id + " <br>";
      msg += "parentinternalid " + parentinternalid + " <br>";
      msg += "relatedrecordid " + relatedrecordid + " <br>";

      nlapiLogExecution("DEBUG", "Required Variables", msg);
//      console.log (msg);
//      return;
      //nlapiLogExecution("DEBUG", "this", JSON.stringify(this));

      _.each(this.fields, function (field) {

          if (field.fieldid === related_record_parent_reference_field_id) {// need to find related record parent reference field id
              //nlapiLogExecution("DEBUG", field.fieldid, field.fieldtype);
              if (field.fieldtype === "MultipleSelect") { // custom logic for multi select. For now, only single value is provided; however, this part may need to be re visited
                  multiselect.push(parentinternalid);
                  filters[0] = new nlobjSearchFilter(related_record_parent_reference_field_id, null, "anyof", multiselect);
              } else {
                  filters[0] = new nlobjSearchFilter(related_record_parent_reference_field_id, null, "is", parentinternalid);
                  //consolelog("Filters for " + relatedrecordid + "    " + JSON.stringify(filters));
              }
              filters[1] = new nlobjSearchFilter("isinactive", null, "is", "F"); //do not include inactive records in the calculation as they cannot be used as valid references

          }
      });

      counter = 0;
      _.each(this.fields, function (field) {
          if (field.fieldid === "id") {
              columns[counter] = new nlobjSearchColumn("internalid"); //when searching, must use internalid keyword
          } else {
              columns[counter] = new nlobjSearchColumn(field.fieldid);
          }
          counter += 1;
      });
      // at the end, save name and internal id

      //        consolelog("Columns for " + relatedrecordid + "    " + JSON.stringify(columns));

      // arr = this.arr;
      //        nlapiLogExecution("DEBUG", "SEARCHING RECORD", relatedrecordid);
      //console.log(filters);
      //console.log(columns);
      // try
      // {
      results = nlapiSearchRecord(relatedrecordid, null, filters, columns);
      // } catch (e) {
      // if (e instanceof nlobjError) {
      // nlapiLogExecution("ERROR", "load " + relatedrecordid + " Result", e.getCode()
      // + " : " + e.getDetails());
      // } else {
      // nlapiLogExecution("ERROR", "load " + relatedrecordid + " Result", "Unexpected
      // error : " + e.toString());
      // }
      // return false;
      // }
      //        nlapiLogExecution("DEBUG", "SEARCHING COMPLETED", "");
      if (results && (results.length > 0)) {
          len = results.length;
          //title = "Found " + len + " " + relatedrecordid + " related to " + related_record_parent_reference_field_id + ":" + parentinternalid;
          counter2 = 0;

          // consolelog(JSON.stringify(newRecord));

          for (counter = 0; counter < len; counter += 1) {
              newRecord = new cre_LoadObject(newRecordID, this.recordname);
              //                if (counter === 0) {
              //                    consolelog("seqarch result from netsuite " + typeof results[counter] + "   "+ JSON.stringify(results[counter]));
              //
              //                }
              //                nlapiLogExecution("DEBUG", "Related Record Search Result " + counter, JSON.stringify(results[counter]));
              // newRecord.createddate=results[counter].getValue("createddate");
              // newRecord.lastmodifieddate=results[counter].getValue("lastmodifieddate");
              _.each(this.fields, function (field) {

                  msg = msg + "[" + (counter + 1) + " of " + len + "] [" + (counter2 + 1) + "] " + field.fieldid + ": " + results[counter].getValue(field.fieldid) + "\n";
                  counter2 += 1;

                  if (field.fieldid === "id") {
                      newRecord.fields[field.fieldname].value = results[counter].getValue("internalid");
                  } else {
                      if (!_.isUndefined(field.listrecord)) {
                          if (nlapiGetContext().getExecutionContext() !== "userinterface") {
                              //                                nlapiLogExecution("DEBUG", "Required Variables", msg);
                              newRecord.fields[field.fieldname].text = results[counter].getText(field.fieldid);
                          }
                      }
//                      console.log (newRecord);
//              console.log (field);
                      newRecord.fields[field.fieldname].value = results[counter].getValue(field.fieldid); // initial setup. OK to use .value so to not trigger isDrity rule. all other setters should use .Value
                  }

              });
              //                consolelog(msg);
              msg = "";
              newRecord.internalid = cre_castInt(results[counter].getId());
              newRecord.Properties.CreatedMS = cre_castInt(nlapiStringToDate(results[counter].getValue("created")).getTime()) + newRecord.internalid;
              newRecord.Properties.LastModifiedMS = cre_castInt(nlapiStringToDate(results[counter].getValue("lastmodified")).getTime()) + newRecord.internalid; //necessary to add internal ID to get highest value as last modified date times turne dout to beexactly the same for simultaneously submitted records
              //                consolelog("Loading New Related Record with id " + newRecord.internalid + " into list ");
              // consolelog(JSON.stringify(newRecord));
              // consolelog(newRecord);
              this.arr.push(newRecord);
              msg += "<br>";
          }
          this.init_size = results.length; // udpate init to be all of returned values. If there are dirty items, array would remain dirty
          //nlapiLogExecution("DEBUG", title, msg);
      }
      return record_name;
  };

}

//------------------------------------------------------------------
//Object: CREHTTPRequest
//Description: Request Object for HTTP input operations.  Used to 
//allow CRE to work with requests and to draw pages.  Requires supporting
//SuiteLet to drive functionality.  See creExamples for pattern.
//Date: Marko Obradovic 20180210
//------------------------------------------------------------------

function CREHTTPRequest(id) 
{
    "use strict";
    var creHTTPRequest = this;
    creHTTPRequest.id = id;
    creHTTPRequest.regexmap = null;		//used to hold regex map passed into the object 
    creHTTPRequest.javascript_override_loaded = false; //used to load override file id only once
    
    //example core function to be bundled with CREHTTPRequest
    //Optimally, if we start using such functions, we need to move them to
    //some PRIUtilities objects within CRE  
    
    //Next section: Not included in implementation (MZ,MM 2018-08-08)
    /*creHTTPRequest.ObscureCreditCardNumbers = function (key, value)
    {
    	if (!value)
    	{
    		nlapiLogExecution("AUDIT", "ObscureCreditCardNumbers", "value not provided");
    		return value;
    	}
    	
    	nlapiLogExecution("AUDIT", "ObscureCreditCardNumbers", "starts, " + value);
    	//obscure visa numbers 
    	value = value.replace(/[^0-9]/i, "");
    	value = value.replace(/^4[0-9]{11}([0-9]{4})$/i, "************$1");
    	
    	//obscure  master crad numbers
    	value = value.replace(/^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{8}([0-9]{4})$/i, "************$1");
    	
    	//obscure American Express
    	value = value.replace(/^3[47][0-9]{9}([0-9]{4})$/i, "***********$1");
    	
    	//obscure American Express
    	value = value.replace(/^6(?:011|5[0-9]{2})[0-9]{8}([0-9]{4})$/i, "************$1");
    	
    	
    	return value;
    	
    };*/
    
    //20180724 Marko Obradovic Core Translate function
    //this function supports 4 different translation modes
    // read CRE documentation for more detail 
    creHTTPRequest.Translate = function (key, value)
    {
    	nlapiLogExecution("AUDIT", "Key", key);
    	//regex map must be defined 
    	if (!creHTTPRequest.regexmap)
    	{
    		return value;  
    	}
    	//nlapiLogExecution("AUDIT", "regexmap defined");
    	if(!creHTTPRequest.regexmap.hasOwnProperty(key))
    	{
    		
    		return value;
    	}
    	
    	//load any exteranl functions to execute here 
    	if (!creHTTPRequest.javascript_overrid_loaded)
    	{
    		nlapiLogExecution("AUDIT", "loading javascript override file", "");
    		var external_javascript_file_id = nlapiLookupField('customrecord_pri_cre_profile', creHTTPRequest.CREProfileID, 'custrecord_pri_cre_javascript_overrid');
    		if (external_javascript_file_id)
    		{
    			var oFile = nlapiLoadFile(external_javascript_file_id);
    			var contents = oFile.getValue();
	          	//nlapiLogExecution("DEBUG", "built-in override:", contents);
	          	eval(contents);
    		}
          	creHTTPRequest.javascript_overrid_loaded = true; 
    	}
    	
    	//Next section: Not included in implementation (MZ,MM 2018-08-08)
    	/*
    	//METHOD 1 search and replace 
    	//nlapiLogExecution("AUDIT", "RegExDefiend", JSON.stringify(creHTTPRequest.regexmap[key]));
    	//nlapiLogExecution("AUDIT", "typeof creHTTPRequest.regexmap[key]", typeof creHTTPRequest.regexmap[key]);
    	if ((typeof creHTTPRequest.regexmap[key] === "object") && creHTTPRequest.regexmap[key].search && creHTTPRequest.regexmap[key].replace)
    	{
//    		"custpage_card_num": 
//			{
//				"search": /^4[0-9]{11}([0-9]{4})$/i,
//				"replace": "************$1"
//			}
    		
    		nlapiLogExecution("AUDIT", "Translate: Search and Replace", "starts");
    		//handles regular search and replace 
    		return value.replace(creHTTPRequest.regexmap[key].search, creHTTPRequest.regexmap[key].replace);
    	}
    	
    	//METHOD 2 execute core function
    	//this is a function defined directly in CREHTTPRequest. It required CRE Bundle to be re-compiled
    	//can be used for any global value manipulations we want to provide to community 
    	//METHOD 3 since javascript override file was loaded already (if defined in cre profiele), this code will handle any external functions as well. 
    	var corefunction = creHTTPRequest.regexmap[key];
    	nlapiLogExecution("AUDIT", "Translate: corefunction ", corefunction);
    	nlapiLogExecution("AUDIT", "typeof creHTTPRequest[corefunction] ", typeof creHTTPRequest[corefunction]);
    	if (typeof creHTTPRequest[corefunction] === "function")  
        {
    		nlapiLogExecution("AUDIT", "Translate: Found function ", corefunction);
    		//in this case value of the key points to the function in this object.
    		//if the function is found, execute it. 
    		return creHTTPRequest[corefunction](key,value);
        }
    	*/
    	//METHOD 4 javascript directly in json
    	/*Ex.
    	var regExMap={
		'ccnum':'this.obscureCreditCardNumbers = function concealCC(key, value){value = value.replace(/[^0-9]/g, "");value = value.replace(/.(?=.{4,}$)/g,"*");return value;}',
		'cczip':'this.obscureText = function obscureText(key, value){value = value.replace(/./g, "*");return value;}',
		'cccvv':'this.obscureText = function obscureText(key, value){value = value.replace(/./g, "*");return value;}',
		'ccaddr':'this.obscureText = function obscureText(key, value){value = value.replace(/./g, "*");return value;}'
		httprequestid = creHTTPRequest.writeHTTPRequest(profileid, BusRecordSearchTypeID, businessid, jsonExtraData, regExMap);
	    };*/
    	var function_starts_with = "this.";
    	if (creHTTPRequest.regexmap[key].indexOf(function_starts_with)===0)
    	{
    		var equal_indexof = creHTTPRequest.regexmap[key].indexOf('=');
    		var function_name = creHTTPRequest.regexmap[key].substring(function_starts_with.length, equal_indexof); //expected that function is defined with 'this'
    		function_name = function_name.trim();
    		eval(creHTTPRequest.regexmap[key]);
    		if (typeof creHTTPRequest[function_name] === "function") 
    		{
    			return creHTTPRequest[function_name](key,value);
    		}
    	}
    
    	nlapiLogExecution("AUDIT", "Translate: Returning default value ", value);
    	return value; //if not other matches, return value
    	
    };
    
    
    
    //utility function to help convert data to JSON primarily to help us take NetSuite's request
    //object and make it JSON for our CRE operations
    //20180724 Marko Obradovic: Added intercept that sends key value through function / or regex so that 
    //value can be manipulated as needed before value is stored to database 
    //Example RegEx Map:
//    "RegExMap" : {
//		//method 1, provide search and replace values 
//		"custpage_card_num": 
//		{
//			"search": /^4[0-9]{11}([0-9]{4})$/i,
//			"replace": "************$1"
//		},
//		//method 2, define core CREHTTPRequest function
//		// downside of this approach is re-bundling
//		"custpage_card_num": "ObscureCreditCardNumbers",
//		//method 3, define needed function in Javascript Override file in CRE Profile    
//		//"custpage_card_num": "ObscureCreditCardNumbersWithDashes"
//		//method 4: javascript function directly in json. Took Javascript Override function, removed white spaces, and pasted here
//		//"custpage_card_num" : 'this.custom_function_directly_in_JSON = function (key, value){creRecord = this;if (!value){nlapiLogExecution("AUDIT", "custom_function_directly_in_JSON", "empty value");return value;}nlapiLogExecution("AUDIT", "custom_function_directly_in_JSON", "starts");value = value.replace(/[^0-9]/i, "");value = value.replace(/^4[0-9]{11}([0-9]{4})$/i, "****+****+****+$1");value = value.replace(/^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{8}([0-9]{4})$/i, "****-****-****-$1");return value;};'
//			
//		"custpage_card_zip" : 	{
//			"search": /\d+/i,
//			"replace": "*****"
//		},
//		"Host" : 	{
//			"search": "forms",
//			"replace": "prolecto"
//		}
//	}
    
  //Example Keys: custpage_card_num, custpage_card_zip, Host
  //Example Data found in 
    //	- customrecord_pri_cre_request_http.custrecord_pri_cre_request_http_header
    //	- customrecord_pri_cre_request_http.custrecord_pri_cre_request_http_params
    //  - customrecord_pri_cre_request_http.custrecord_pri_cre_request_http_extradat
    //	- customrecord_pri_cre_request_http.custrecord_pri_cre_request_http_body
    
    // NOTE: only top level node is supported for translation. Extra Data JSON can hold nested objects, while rest are top level 
    //		Developer has an opportunity to manipulated extra data as needed, so no need for this to live in the core engine
    creHTTPRequest.objectToJSON = function (obj)
    {
    	var retObj = {};
    	var key = "";
    	var value = "";
    	
    	for (key in obj) 
    	{
    		
//    		if(obj.hasOwnProperty(key))   
//            {
        		value = obj[key];
        		//nlapiLogExecution("AUDIT", "key ", key + JSON.stringify(creHTTPRequest.regexmap));
        		value = (creHTTPRequest.regexmap && creHTTPRequest.regexmap[key]) ? creHTTPRequest.Translate(key,value) : value; //if defined in regex, translate it.
        		retObj[key] = value;
//            }
    	}
    	return retObj;
    };
    
    //helper function to call main .write function
    creHTTPRequest.writeHTTPRequest = function(CREProfileID, BusRecordTypeID, RecID, ExtraJSONData, regExMap) {
    	//helper function to store the HTTP request.  You can bypass this function and
    	//call .write if you know the shape.  
    	
    	//note, when creating the CREHTTPRequest object, it assumes that you may have 
    	//passed in an ID.  No ID means you are in an insert operation.  Supplying
    	//an ID when creating the object will update.
    	
    	creHTTPRequest.CREProfileID = CREProfileID;
    	
    	var CREHTTPREquestID = "";
    	CREHTTPREquestID = creHTTPRequest.write(
    		{
    			"CREID" : CREProfileID,
    			"BusRecordTypeID" : BusRecordTypeID,
    			"BusRecordID" : RecID,
    			"extraJSONData" : ExtraJSONData,
    			"RegExMap" : regExMap	
    		}
    	);
    	return CREHTTPREquestID;
    };
    
    //function to call to do real work.
    creHTTPRequest.write = function (options)
    {
    	creHTTPRequest.CREProfileID = options.CREID;
    	var BusRecordTypeID = options.BusRecordTypeID;
    	var BusRecordID = options.BusRecordID;
    	var extraData = options.extraJSONData;
    	var rec = null;
    	
    	creHTTPRequest.regexmap = options.RegExMap;	//holds map provided by user. 
    	
    	if (creHTTPRequest.id)
		{
			nlapiLogExecution("AUDIT", "creHTTPRequest.write ", "UPDATE");
			//provide facility, optionally, to update an existing request
			rec = nlapiLoadRecord("customrecord_pri_cre_request_http", creHTTPRequest.id);
		}
    	else 
    	{
			nlapiLogExecution("AUDIT", "creHTTPRequest.write ", "INSERT");
    		// the logic is that you estabilish connection to the CRE and the business record type information during create only
			rec = nlapiCreateRecord("customrecord_pri_cre_request_http");
			rec.setFieldValue("custrecord_pri_cre_request_http_cre", creHTTPRequest.CREProfileID);
			rec.setFieldValue("custrecord_pri_cre_request_http_rectype", BusRecordTypeID);
    	}
			
    	//this solution makes the assumption that the call is happening the context of a SuiteLet for which
    	//we will have a netsuite request object.  However, if called and the request object is not there, we won't fail.
		request && rec.setFieldValue("custrecord_pri_cre_request_http_recid", BusRecordID);
    	request && rec.setFieldValue("custrecord_pri_cre_request_http_method", request.getMethod());
    	request && rec.setFieldValue("custrecord_pri_cre_request_http_header", JSON.stringify(creHTTPRequest.objectToJSON(request.getAllHeaders())));
    	request && rec.setFieldValue("custrecord_pri_cre_request_http_params", JSON.stringify(creHTTPRequest.objectToJSON(request.getAllParameters())));
    	
    	//nlapiLogExecution("AUDIT", "request.getAllParameters()", JSON.stringify(creHTTPRequest.objectToJSON(request.getAllParameters())));
    	
    	//body parameters must be sent through objectToJSON function
        request && rec.setFieldValue("custrecord_pri_cre_request_http_body", JSON.stringify(creHTTPRequest.objectToJSON(request.getBody())));

        //marko obradovic: adding objectToJSON around extraDAta. This will allow for translation of first level nodes if needed. 
        extraData && rec.setFieldValue("custrecord_pri_cre_request_http_extradat", JSON.stringify(creHTTPRequest.objectToJSON(extraData)));
		
		//test if we have file attachments to netsuite's Request object.
		//due to limitation of the SuiteScript 1.0 nlobjRequest.getFile function, we can't easily
		//discover the name of the files.  Our convention then is to look for a "file" parameter comma
		//separated.  If we have file value, we will add them do the CRE HTTP REQUEST Record as an attachment
		//and mark the flag that we have files
		var params = JSON.parse(rec.getFieldValue('custrecord_pri_cre_request_http_params'));
		var files = (params["file"]) ? params["file"] : "" ;
		nlapiLogExecution("AUDIT", "files found list", files);
		var filenames = files.split(",");
		var fileids = []; //hold array of file ids if found
		for (filename in filenames){
			var f = filenames[filename].trim();
			var file = request.getFile(f);
			if (file){
				nlapiLogExecution("AUDIT", "test for file " + f, (file) ? file.getName() : 'no file');
				
				file.setFolder(TEMP_FOLDER_ID);
				var fileid = nlapiSubmitFile(file);
				fileids.push(fileid);
			}
		}
		
		//check if we have files, only change if we never had before, they could be previously attached
		if (rec.getFieldValue("custrecord_pri_cre_request_http_hasfiles") == "F"){
			//indicate we have files
			rec.setFieldValue("custrecord_pri_cre_request_http_hasfiles", (fileids.length > 0) ? "T" : "F");
		}
		

		try {
			//write the record
			creHTTPRequest.id = nlapiSubmitRecord(rec);
			
			//attach and files
			for (fileid in fileids){
				nlapiAttachRecord("file", fileids[fileid], "customrecord_pri_cre_request_http", creHTTPRequest.id, null);
			}
		} catch (e) {
			if (e instanceof nlobjError)  {
			 throw nlapiCreateError(func, e.getCode() + " : " + e.getDetails() + "  parentKeys:" + parentKeys);
			} 
		else {
			throw nlapiCreateError(func, e.toString() + "  parentKeys:" + parentKeys);
		    }
		}
		return creHTTPRequest.id;
    };
};



//------------------------------------------------------------------
//Object: creRecord
//Description: Main object.
//Input: record - this is record name that lives in json Records structure.
//internalid - internalid of the record to be loaded. for example,
//Date: Marko Obradovic 20141113
//------------------------------------------------------------------

function CRERecord(record, internal_id) {
  "use strict";
  // consolelog(JSON.stringify(creJSONroot));
  // return;
  var name = "";
  var creRecord = this; // keeping copy for useage when this is out of scope
  var relatedrecordslist;

  //nlapiLogExecution("DEBUG", "Creating General REcord - ", internal_id);
//  console.log(record);
//  console.log(creJSONroot.Records[record]);
  
  
  _.extend(this, JSON.parse(JSON.stringify(creJSONroot.Records[record]))); // extend this object with requested record json structures

  creRecord = this; // keeping copy for useage when this is out of scope
  creRecord.InitialLoadComplete = false;
  creRecord.nsRecordObj = null;
  creRecord.isRelatedRecord = false;
  creRecord.Properties = {};
  creRecord.TransformedData = {};
  creRecord.Renderer = null;
  creRecord.RawData = {};	//strict format used for FreeMarker. Cannot add custom Formula fields.
  creRecord.RawData.httprequest = {};	//strict format used for FreeMarker. Cannot add custom Formula fields.
  creRecord.RawData.httprequest.headers = {};
  creRecord.RawData.httprequest.body = {};
  creRecord.RawData.httprequest.parameters = {};
  creRecord.RawData.httprequest.extradata = {};
  
  
  //Formula fields need to be added as default search results do not expose Custom Label information
  //and if multiple formula fields are used, only latest one ends with value. 
  // example:
  // Search Result for TWO custom formula fields returns:
  
//  "ITEM_FULLFILLMENT": [
//    {
//      "id": "13322",
//      "recordtype": "itemfulfillment",
//      "columns": {
//        "weight": 5,
//        "formulanumeric": 2.27
//      }
//    }
//  ],
//  
//  Expected (or similar):
//  	
//  "ITEM_FULLFILLMENT_formula_columns": [
//  {
//    "id": "13322",
//    "recordtype": "itemfulfillment",
//    "columns": {
//  	"weight": 5,
//      "LBS": {
//        "label": "LBS",
//        "value": "5",
//        "name": "formulanumeric"
//      },
//      "KG": {
//        "label": "KG",
//        "value": "2.27",
//        "name": "formulanumeric"
//      }
//    }
//  }
//],
  
  //If we programatically insert custom fields into columns object, calls like getAllColumns required during syntax printing fail. 
  //In addition, custom columns are not even part of the renderer, so free marker solution will fail.
  
  //solution: Use RawData as is for FreeMarker 
  //			Add custom fields to Handlebars/Trimpath, and enhance syntax to to use new structures 
  
  creRecord.RecordCommitted = false;
  creRecord.CREProfileDataRecordType = "";
  creRecord.CREProfileDataRecordID = "";
  //consolelog("creRecord " + internal_id);
  //consolelog(creRecord);

  //Every Record gets Record level LastModifiedMS
  // CRERecord.Properties.LastModifiedMS - calculated: max out of all CRERecord.fields[fieldname].LastModifiedMS
  // CRERecord.Properties.CreatedMS
  // CRERecord.Properties.lastModifiedMS - keeps track of latest. Get's updated via LastModifiedMS call.
  Object.defineProperty(creRecord.Properties, "LastModifiedMS", {
      set: function (x) {

          if (cre_isValidNumber(x)) {
              creRecord.Properties.lastModifiedMS = x;
          }
      },
      get: function () {

          var max = (_.max(creRecord.fields, function (field) {

              return field.LastModifiedMS;
          })).LastModifiedMS;

          if ((!_.isNull(max)) && (!_.isUndefined(max))) {
              creRecord.Properties.lastModifiedMS = max;

          }
          return creRecord.Properties.lastModifiedMS;
      }
  }); // default value for this.isDirty is true. After load times, initialize will set all values to false

  _.each(creRecord.fields, function (field) {

      //Every field receives isValid validation method
      Object.defineProperty(field, "isValid", {
          value: function (x) {

              field.msg = "";

              //                if (_.isUndefined(x))
              //                {
              //                    throw nlapiCreateError("ERROR", "Undefined value passed " +  JSON.stringify(field)) ;
              //                }

              if (_.isNull(x)) {
                  return true; // null is valid value
              }
              switch (field.fieldtype) {
              case "ListRecord":
                  if (!cre_isValidNumber(x)) {
                      field.msg = field.fieldname + " must be integer for type " + field.fieldtype;
                      return false; // list record must be numeric
                  }
                  break;
              case "Currency":
                  if (!cre_isValidCurrency(x)) {
                      field.msg = field.fieldname + " must be numeric for type " + field.fieldtype;
                      return false; // list record must be numeric
                  }
                  break;
              case "Date":
                  if (_.isNaN(nlapiStringToDate(x))) {
                      nlapiLogExecution("DEBUG", "Invalid value of type Date ", x);
                      field.msg = field.fieldname + " has invalid value for type " + field.fieldtype;
                      return false;
                  }
                  break;
              case "TextArea":
                  if (_.isUndefined(x)) {
                      throw nlapiCreateError("ERROR", "Value is undefined (text area) " + JSON.stringify(field));
                  }
                  if (x.length > 4000) {
                      field.msg = field.fieldname + " has " + x.length + " characters. Expected 4000 or less for type " + field.fieldtype;
                      //field.msg = " is invalid value for type Date";
                      return false;
                  }
                  break;
              case "DateTime":
                  if (_.isNaN(nlapiStringToDate(x, "datetimetz"))) {
                      field.msg = field.fieldname + " has invalid value for type " + field.fieldtype;
                      // nlapiLogExecution("DEBUG", "Invalid value of type
                      // DateTime ", x);
                      return false;
                  }
                  break;
              case "FreeFormText":
                  if (x.length > 300) {
                      field.msg = field.fieldname + " has " + x.length + " characters. Expected 300 or less for type " + field.fieldtype;
                      // nlapiLogExecution("DEBUG", "Invalid value of type
                      // DateTime ", x);
                      return false;
                  }
                  break;
              case "CheckBox":
                  if (!((x === "T") || (x === "F"))) {
                      field.msg = field.fieldname + " is expecting 'T' or 'F' values for type " + field.fieldtype + " but has been set to [" + x + "]";
                      // nlapiLogExecution("DEBUG", "Invalid value of type
                      // DateTime ", x);
                      return false;
                  }
                  break;
             }
              return true;
          },
          writable: true,
          configurable: true
      });

      //basic isDirty property for all fields
      Object.defineProperty(field, "isDirty", {
          value: false,
          writable: true,
          configurable: true
      });

      //default Value property for all fields
      //    - it must be valid based on fieldtype defined in json object
      //     - it must be different than previous value or else no change occurs
      //  - isDirty once set
      //  - LastModifiedMS is updated on change
      Object.defineProperty(field, "Value", {
          set: function (x) {
              if (field.isValid(x)) {
                  if (field.value !== x) {
                      field.value = x;
                      if (field.fieldtype !== "Internal") {
                          // only update if these are non internal/readonly fields
                          field.isDirty = true; // only save and marek isdirty if there is a change
						  var d = new Date();
                          field.LastModifiedMS = d.getTime();
                      }
                  }
              } else {
                  //                    consolelog(field.msg);
                  throw nlapiCreateError("ERROR", field.msg + " " + JSON.stringify(field));
              }
          },
          get: function () {
              return field.value;
          },
          configurable: true
      }); // default value for this.isDirty is true.
      // After load times, initialize will set all
      // values to false

  });


  // ------------------------------------------------------------------
  // Method: IsDirty
  // Description: returns true if object or collection has changed
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.IsDirty = function () {
      creRecord = this;
      return (creRecord.isDirtyObject() || creRecord.isDirtyCollection());
  };

  // ------------------------------------------------------------------
  // Method: Copy
  // Description: Adding ability to deep copy any object
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.Copy = function () {
      creRecord = this;
      var newRecord = new cre_LoadObject(null, this.recordname);
      _.each(creRecord.fields, function (field) {
          if (field.fieldtype !== "Internal") {
        	  //nlapiLogExecution("DEBUG", "Processing field: ", field.fieldname);
              if ((field.fieldtype === "CheckBox") || (field.fieldtype === "ListRecord")) {
                  if (!_.isEmpty(field.Value)) {
                      //for checkboxes and listRecords, values are expected
                      //if values have not been set (they are blank), skip such records
                      //from being copied, as blanks are illegal values for CheckBox/ListRecord
                      newRecord.fields[field.fieldname].Value = field.Value;
                  }
              } else {
                  newRecord.fields[field.fieldname].Value = field.Value;
              }
          }
      });
      return newRecord;

  };
  // ------------------------------------------------------------------
  // Method: isDirtyCollection
  // Description: returns true if any of the object's related records have been added, or if any of the object's related record's fields have been changed
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.isDirtyCollection = function () {
      creRecord = this;
      var dirty_collections = false;

      if (_.find(this.relatedrecordkeys, function (key) {
          return creRecord.relatedrecords[key].IsDirty() === true;
      })) {
          dirty_collections = true;
      }
      return dirty_collections;

  };

  // ------------------------------------------------------------------
  // Method: isDirtyObject
  // Description: returns true if any of the properties of the object has been changed (excluding related records)
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  this.isDirtyObject = function () {
      creRecord = this;
      var dirty_object = false;

      if (_.find(this.fieldkeys, function (key) {
          // consolelog('Processing ' + creRecord.fields[key].fieldid + '
          // isDirty: ' + creRecord.fields[key].isDirty );
          return creRecord.fields[key].isDirty === true;
      })) {
          dirty_object = true;
      }
      return dirty_object;
  };

  // ------------------------------------------------------------------
  // Method: Record's LoadRelatedRecords
  // Description: retrive all related records from netsuite
  // Date: Marko Obradovic 20141120
  // ------------------------------------------------------------------
  this.LoadRelatedRecords = function (index) {
      creRecord = this;
      var counter = 0;
      //    consolelog(this.internalid);
//      nlapiLogExecution("DEBUG", "this.internalid", creRecord.internalid);
//      nlapiLogExecution("DEBUG", "index", creRecord.internalid);
      if (!cre_isValidNumber(this.internalid)) {
          return false; // nothing to load. this is a brand new record as internalid is not a number
      }
      nlapiLogExecution("DEBUG", "creRecord.isRelatedRecord", creRecord.recordname + "  " + creRecord.isRelatedRecord);
      if (!creRecord.isRelatedRecord) {
          if (cre_isValidNumber(index) && (index >= 0)) { // index requested to load individual collection
              nlapiLogExecution("DEBUG", "found index ", index);
              _.each(this.relatedrecordkeys, function (key) {
                  if (counter === index) {
                      // RecordList
                      relatedrecordslist = creRecord.relatedrecords[key];
                      // nlapiLogExecution("DEBUG", key,
                      // relatedrecordslist.all);
                      name = relatedrecordslist.all();
                      relatedrecordslist.Loaded = true;
                      nlapiLogExecution("DEBUG", "Loading only collection with index ", index);
                      // relatedrecordslist.init_size =
                      // relatedrecordslist.arr.length;
                      nlapiLogExecution("DEBUG", "relatedrecordslist.init_size", name + "  " + relatedrecordslist.init_size);
                  }
                  counter += 1;
              });
          } else {
              nlapiLogExecution("DEBUG", "index not found ", "loading all collections");
              _.each(this.relatedrecordkeys, function (key) { // load all collections

                  // RecordList
                  relatedrecordslist = creRecord.relatedrecords[key];
                  // nlapiLogExecution("DEBUG", key, relatedrecordslist.all);
                  name = relatedrecordslist.all();
                  relatedrecordslist.Loaded = true;
                  nlapiLogExecution("DEBUG", key + " loaded ", name);
                  // relatedrecordslist.init_size =
                  // relatedrecordslist.arr.length;
                  nlapiLogExecution("DEBUG", "relatedrecordslist.init_size", name + "  " + relatedrecordslist.init_size);
              });
              counter += 1;
          }

      }
      //return true;
  };

  // ------------------------------------------------------------------
  // Method: initRelatedRecords
  // Description: retrive all related records from JSON. It does not call
  // netsuite.
  // Date: Marko Obradovic 20141120
  // ------------------------------------------------------------------
  this.initRelatedRecords = function (parentrecord) {
      creRecord = this;
      nlapiLogExecution("DEBUG", " Processing " + parentrecord, "");
      //var RelatedRecordsTmp = {}                                              // create temp object and extend it into main one
      var RelatedRecords = {}; // create object for holding Related Records
      var relatedrecordkeystmp = {}; // temporary structure to hold related record keys
      var relatedrecordkeys = []; //
      var collection = null; //
      var parent_internalid = creRecord.internalid; //
      var collectionmethods = null; // pass internal id locally into this function. this.internalid looses scope when in following function creation
      var prop = null;
      var related_records_collection_name = "";
      var arr = [];
      nlapiLogExecution("DEBUG", "creRecord.internalid", creRecord.internalid);

      _.each(creJSONroot.Records, function (jsonrecord) { // search all records defined under root records node

          related_records_collection_name = ""; // all related records will be stored in List arrays
          arr = []; // array placeholder for related records to be loaded

          // , relatedRecord = {}; //related record metadata. Will hold all
          // relevant information to load related object

          _.each(jsonrecord.fields, function (field) {
              if ((!_.isUndefined(field.listrecord)) && (!_.isUndefined(field.isrelatedrecord))) { // if this some related record field exists
                  // title = "Comparing " + field.listrecord + " and " + parentrecord;
                  // msg = (field.listrecord === parentrecord);
                  // nlapiLogExecution("DEBUG", " related_records_collection_name ",
                  // related_records_collection_name);
                  // nlapiLogExecution("DEBUG", title, msg);
                  //if (field.listrecord === parentrecord) // check to see if ti's the one we want
//              	console.log("processing field " + field.listrecord);
//              	console.log("looking for parent record " + parentrecord);
//              	console.log("field is related record " + parentrecord);
//              	console.log(field.isrelatedrecord);
//              	console.log("");
                  if ((field.listrecord === parentrecord) && (field.isrelatedrecord === "T")) { // check to see if it's the one we want
                  // if (field.listrecord === parentrecord) //check to see if it's the one we want
                      collection = new CRECollection();
                      if (field.listrecord === field.fieldname) {
                          related_records_collection_name = "Related" + jsonrecord.recordname + "List";
                      } else {
                          related_records_collection_name = "Related" + field.fieldname + "List";
                      }

                      // nlapiLogExecution("DEBUG", "
                      // related_records_collection_name|field.listrecord|parentrecord ",
                      // related_records_collection_name+"|"+field.listrecord+"|"+parentrecord);

                      collection.collection_record_name = jsonrecord.recordname;
                      collection.related_recordid = jsonrecord.recordid; // creating new property related_recordid with value e.g. customrecord_cre_prod_accept_warranty
                      collection.parent_internalid = parent_internalid; // creating new property parent_internalid with value of e.g. asset master internal internalid: 1
                      collection.parent_name = creRecord.recordname; // save reference to partent Name
                      collection.init_size = 0;
                      collection.related_record_parent_reference_field_id = field.fieldid;
                      collection.arr = arr; // creating new arr property
                      collection.recordname = jsonrecord.recordname; // creating new name property
                      collection.fields = jsonrecord.fields; // copy all fields to sub object, so they are all available (required for field metadata)
                      // _.extend(relatedRecord, collectionMethods);

                      collectionmethods = cre_loadCollectionMethods(collection.collection_record_name);

                      if (!_.isNull(collectionmethods)) {
                          for (prop in collectionmethods) {
                              if (collectionmethods.hasOwnProperty(prop)) {
                                  collection[prop] = collectionmethods[prop];
                              }
                          }
                      }

                      // nlapiLogExecution("DEBUG", "relatedRecord extended",
                      //console.log(JSON.stringify(collection));

                      RelatedRecords[related_records_collection_name] = collection; // save this related record object
                      relatedrecordkeys.push(related_records_collection_name); // storing collection name in the list of collection keys

                  }
              }
          });

      });
      
      if (Object.cre_size(RelatedRecords) >= 1) { // handles {}
      	// RelatedRecordsTmp.relatedrecords = RelatedRecords; //creating
          // placeholder for related records
          relatedrecordkeystmp.relatedrecordkeys = relatedrecordkeys; // creating placholder for related record keys, so that they can be traversed easily
          
          // _.extend(this, RelatedRecordsTmp); //collections of related
          // records. example:
          // "relatedrecords":{"ProductAcceptanceWarrantyList":{"recordid":"customrecord_cre_prod_accept_warranty","arr":[],"name":"ProductAcceptanceWarranty"},"ProductDependencyList":{"recordid":"customrecord_cre_product_dependency","arr":[],"name":"ProductDependency"}}

          this.relatedrecords = RelatedRecords;
          
          _.extend(this, relatedrecordkeystmp); // listkeys holds collection
          
          
          // names as keys. example:
          // "relatedrecordkeys":["ProductAcceptanceWarrantyList","ProductDependencyList"]

          //     nlapiLogExecution("DEBUG", (Object.cre_size(RelatedRecords)-1) + "
          //     related for parent " + parentrecord, JSON.stringify(this));
      }

  };
  // ------------------------------------------------------------------
  // Method: load
  // Description: load this record's information from netsuite
  // Date: Marko Obradovic 20141120
  // ------------------------------------------------------------------
  this.load = function (internalid) {
      creRecord = this;
      // try
      // {

      //        consolelog("loading record with id " + internalid);

      if (cre_isValidNumber(internalid)) {
          nlapiLogExecution("DEBUG", "Loading Record ", internalid);
          nlapiLogExecution("DEBUG", "nlapiGetContext().getExecutionContext()", nlapiGetContext().getExecutionContext());

          creRecord.internalid = internalid;
          //            nlapiLogExecution("DEBUG", "recordid|internalid", this.recordid + "|" + internalid);
          //            consolelog("recordid|internalid: " + creRecord.recordid + "|" + internalid);

          creRecord.nsRecordObj = nlapiLoadRecord(creRecord.recordid, internalid);
          //             consolelog(creRecord);
          
         
          //mz, 20160602; JSON view of the record does not give full view of the situation; but it is convenient in debugger
          nlapiLogExecution("DEBUG", this.recordid, JSON.stringify(creRecord.nsRecordObj));
          creRecord.name = creRecord.nsRecordObj.getFieldValue("name"); // add name to the structure dynamically
          _.each(creRecord.fields, function (field) {

              //mz, 20160602; important consideration; when we are loading values from the database, netsuite automatically
        	  //takes < and > and encodes these to &lt; and &gt;  Remember that we are not performing this type of load
        	  //operation for the template.  That comes from disk.  Since we are going to perform transformation on the values
        	  //on the CRE Profile for dynamic document elements, we need to give CRE decoded values from this part of the
        	  //app only.  Finally, the Test SuiteLet is handling this already as a standard function of html edit elements
      
        	  
        	  // initial setup. OK to use .value so to not trigger isDrity rule. all other setters should use .Value
        	  field.value = creRecord.nsRecordObj.getFieldValue(field.fieldid); 
              
        	  //now decode the field value, if needed 
        	  if (field.value){
        		  field.value = field.value.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        	  }
        	  
        	  
        	  if (!_.isUndefined(field.listrecord) || (field.fieldtype==="Document")) {
                  // consolelog (JSON.stringify(nsRecordObj));
                  // this is a record/list reference. Text is available

                  //nlapiLogExecution("DEBUG", " nlapiGetContext().getExecutionContext() ", nlapiGetContext().getExecutionContext());
                  //userinterface - Client SuiteScript or user event triggers invoked from the UI
                  //since ther is no way to distinguis betweek client script or euser event script invoked from UI, we will just use try catch
                  if (nlapiGetContext().getExecutionContext() !== "userinterface") {
                      field.text = creRecord.nsRecordObj.getFieldText(field.fieldid); // this operation only available in user event
                  }
                  //  nlapiLogExecution("DEBUG", "field.fieldid", field.fieldid );
                  //  nlapiLogExecution("DEBUG", "field.text", field.text );
                  //                    try
                  //                    {
                  //                        field.text = creRecord.nsRecordObj.getFieldText(field.fieldid); // this operation only available in user event
                  //                    }
                  //                    catch (e)
                  //                    {
                  //                        //do nothing
                  //                        // during testing both user even scripts and client scripts have getExecutionContext() === "userinterface" => true
                  //                        // It is not clear how to handle both testing and going live
                  //                    }

              }
          });
          //            consolelog(creRecord.nsRecordObj);
          //            consolelog(creRecord);
          if (!_.isNull(creRecord.fields.Created.Value)) {
              creRecord.Properties.CreatedMS = nlapiStringToDate(creRecord.fields.Created.Value).getTime();
          }
          if (!_.isNull(creRecord.fields.LastModified.Value)) {
              creRecord.Properties.LastModifiedMS = nlapiStringToDate(creRecord.fields.LastModified.Value).getTime();
          }
          creRecord.InitialLoadComplete = true;
          nlapiLogExecution("DEBUG", " creRecord ", JSON.stringify(creRecord));
          return creRecord.nsRecordObj.getId();
      }


  };

  if (cre_isValidNumber(internal_id)) {
      //set modified and crated to now for objects in memory
      creRecord.Properties.CreatedMS = Date.now();
      creRecord.Properties.LastModifiedMS = creRecord.Properties.CreatedMS;
  }

  // call .load automatically, if internalid is provided
  if (!creRecord.InitialLoadComplete) {
      //nlapiLogExecution("DEBUG", "internalid|name creAssetMaster(internalid) method used, name is blank, call .load function. ;", internal_id);
      this.load(internal_id);
  }

  // ------------------------------------------------------------------
  // Method: commit
  // Description: commit main object and dirty collections
  // Date: Marko Obradovic 20141120
  // ------------------------------------------------------------------
  this.commit = function () {
      var c = 0; //counter
      var c2 = 0; //counter
      var len = 0; //length
      var len2 = 0; //length
      var c3 = 0; //counter
      var len3 = 0; //length
      var fieldkey = ""; //key
      var rel_rec = null;
      creRecord = this;
      // save the root object, if it is dirty
      if (this.isDirtyObject()) {
          nlapiLogExecution("DEBUG", "CRERecord.commit", "Committing dirty record " + creRecord.recordname);
          var newRecord = false;
          // at this point there is one of 3 scenarios:
          //        1: record is brand new, so we must issue a CREATE
          //        2: record exists, but actual NS record hasn't been loaded into memory yet, so load it
          //        3: record exists and has been loaded (don't do anything)
          if (_.isNull(creRecord.nsRecordObj)) {
              if (cre_isValidNumber(creRecord.internalid)) {
                  creRecord.nsRecordObj = nlapiLoadRecord(creRecord.recordid, creRecord.internalid);
              } else {
                  nlapiLogExecution("DEBUG", "CRERecord.commit", "  - creating new empty record");
                  creRecord.nsRecordObj = nlapiCreateRecord(creRecord.recordid, {recordmode: "dynamic"});
                  newRecord = true;
              }
          } else {
              creRecord.nsRecordObj.setFieldValue("name", creRecord.name);
          }
          _.each(creRecord.fields, function (field) {
              if (field.fieldtype !== "Internal") {
                  if (field.isDirty === true) {
                      creRecord.nsRecordObj.setFieldValue(field.fieldid, field.Value);
                      field.isDirty = false;
                  }
              }
          });
          creRecord.internalid = cre_castInt(nlapiSubmitRecord(creRecord.nsRecordObj));
          creRecord.fields.InternalID.Value = creRecord.internalid;
          nlapiLogExecution("DEBUG", "CRERecord.commit", "Record written. ID is now " + creRecord.internalid);

          creRecord.RecordCommitted = true;

          if (newRecord) {
              creRecord.nsRecordObj = nlapiLoadRecord(creRecord.recordid, creRecord.internalid); // reload to preserve id for future updates
          }
      } // isDirtyObject()


      // update all related records with parent ID
      if (creRecord.relatedrecordkeys) {
          // if this is related record, this is irrelevant as related
          // records for now do not have related records
          len = creRecord.relatedrecordkeys.length;
          for (c = 0; c < len; c += 1) {
              key = creRecord.relatedrecordkeys[c];
              len2 = creRecord.relatedrecords[key].arr.length;

              //sort so that latest modified will be saved last
              //array in the modified date ascending order, so that last modified record get's committed last.
              creRecord.relatedrecords[key].arr.sort(function (a, b) {

                  return a.Properties.LastModifiedMS - b.Properties.LastModifiedMS;
              });

              for (c2 = 0; c2 < len2; c2 += 1) {
                  rel_rec = creRecord.relatedrecords[key].arr[c2];
                  if (creRecord.relatedrecords[key].arr[c2].isDirtyObject()) {
                      if (!_.isUndefined(rel_rec.fields[creRecord.recordname])) {
                          creRecord.relatedrecords[key].arr[c2].fields[creRecord.recordname].Value = creRecord.internalid; // udpate
                          // internalid field creRecord.relatedrecords[key].arr[c2].nsRecordObj.id = creRecord.internalid; //update netsuite's native id field
                      }
                      // related record now must be submitted if this is a new record, id must be retrieved and stored as a reference internal ID will be hardcoded as this is default
                      // value that all records should have creRecord.relatedrecords[key].arr[c2].fields.InternalID.value = creRecord.relatedrecords[key].arr[c2].commit();
                      nlapiLogExecution("DEBUG", "Commiting Related record", c2);
                      creRecord.relatedrecords[key].arr[c2].commit();
                  }
                  len3 = creRecord.relatedrecords[key].arr[c2].fieldkeys.length;
                  for (c3 = 0; c3 < len3; c3 += 1) {
                      fieldkey = creRecord.relatedrecords[key].arr[c2].fieldkeys[c3];
                      creRecord.relatedrecords[key].arr[c2].fields[fieldkey].isDirty = false;
                  }

              }
              creRecord.relatedrecords[key].init_size = creRecord.relatedrecords[key].arr.length; // reset init_size after commit
          }

      }
      return creRecord.internalid;
  };

  // ------------------------------------------------------------------
  // Method: cre_formatkey
  // Description: Removing characters from keys
  // Date: Marko Obradovic 20141208
  // ------------------------------------------------------------------
  function cre_formatkey(key) {
      return key.replace(/[\s\&\+\-\(\)]/g, "");
  }
  // ------------------------------------------------------------------
  // Method: RefreshConstants
  // Description: creJSONroot.customLists already contains predefined values. However,
  //                should they be out of date, this is a way to referesh them in memory
  //                creJSONroot.customLists should be updated with latest and greatest list
  //                Update: Since some lists were enhanced to custom records
  //                creJSONroot.customLists will now handle both lists and records
  // Date: Marko Obradovic 20141120
  // ------------------------------------------------------------------
  this.RefreshConstants = function () {
      var customListOrRecordID = null;
      var columns = [];
      var results = null;
      var i = 0;
      var res = null;
      var listValue = null;
      var listID = null;
      var tmpobj = {};

      columns[0] = new nlobjSearchColumn("name");
      columns[1] = new nlobjSearchColumn("internalId");

      _.each(creJSONroot.customLists, function (customList) {
          customListOrRecordID = customList.customListOrRecordID;
          customList.keys = {};
          //            nlapiLogExecution("DEBUG", "Processing " + customListOrRecordID, "");
          results = nlapiSearchRecord(customListOrRecordID, null, null, columns);
          for (i = 0; results !== null && i < results.length; i += 1) 
          {
              res = results[i];
              listValue = cre_formatkey(res.getValue("name"));
              listID = (res.getValue("internalId"));
              tmpobj = {};
              tmpobj[listValue] = listID;
              _.extend(customList.keys, tmpobj);
          }

      });
      return creJSONroot.customLists;
      //        consolelog(JSON.stringify(creJSONroot));
  };


//parameters:
//        optional: objResult: if this field is non-null, then it will be populated with the raw data (used for debugging)

//data is an object loaded with the various fields
//        data.Body
//        data.Subject
//        data.Sender
//        data.Recipient
//        data.DocumentName
//        data.Raw

  
 this.translateValue = function(value)
 {
	   creRecord = this;
	   var retvalue = "";
	   if (!value)
	   {
		   return value; //Marko Obradovic 20160728 nothing to translate
	   }
	   //	   var template = null;
	   //, data_stringified = JSON.parse(JSON.stringify(creRecord.RawData))
	   var func = "translateValue";
	   
	   
	   //mz: temporary submit data to see what is in the data causing an issue
	   //var tfile = nlapiCreateFile("trimpath-output.txt", "PLAINTEXT", JSON.stringify(data_stringified));
	   //tfile.setFolder(TEMP_FOLDER_ID);
	   //nlapiSubmitFile(tfile);
	   
	   nlapiLogExecution("DEBUG", "Translating via Template Engine:" + creRecord.TemplateEngine + " with value: ", value);
	   try {  
		   switch (creRecord.TemplateEngine) {
		   case creJSONroot.customLists.CRETemplateEngines.keys.TrimPath:
			   retvalue = value.process(creRecord.RawData);
			   // Boban 15-Aug-2017
			   //	if a transaction didn't have a locale set, and the CRE profile said that locale should be ${record.custbody_v_locale.internalid}   (for example)
			   //		then TrimPath, instead of returning nothing, would return an error string because you were asking for internalid from "nothing"
			   //		thus, later code thought that locale DID have a value (rather than being null), and so it never used the default locale
			    if (retvalue && retvalue.length > 7 && retvalue.substring(0,7) == "[ERROR:") {
                    nlapiLogExecution("ERROR", "retvalue before set to null: ",  retvalue);
              		retvalue = null;
               }
               
			   nlapiLogExecution("DEBUG", "TrimPath Translate ",  value +"-->"+ retvalue);
			   break;
//		   case creJSONroot.customLists.CRETemplateEngines.keys.HandleBars:
//			   template = Handlebars.compile(value);
//			   retvalue = template(creRecord.RawData);
//			   nlapiLogExecution("DEBUG", "HandleBars Translate ", value +"-->"+  retvalue);
//			   break;
		   case creJSONroot.customLists.CRETemplateEngines.keys.FreeMarker:
			   creRecord.Renderer.setTemplate(value);
			   retvalue = creRecord.Renderer.renderToString();
			   nlapiLogExecution("DEBUG", "FreeMarker Translate " , value+"-->"+ retvalue);
			   break;
		   default:
			   throw nlapiCreateError(func, "Template Engine ID [" + creRecord.TemplateEngine + "] is not defined.");
		   }
	   } 
	   catch (e) 
	   {
		   //nlapiLogExecution("DEBUG", "VALUE ", value);
		   var err_msg = null;
		   if (e instanceof nlobjError) {
			   err_msg = e.getCode() + " : " + e.getDetails() + " while translating value " + value.cre_trunc(100) + "...";
           } else {
        	   err_msg = e.toString() + " while translating value " + value.cre_trunc(100) + "...";
           }
		   nlapiLogExecution("ERROR", "Unexpected system error :", err_msg);
		   return err_msg;
	   }
	   return retvalue;
 };
 
 
//------------------------------------------------------------------
//Object: cre_generateFormulaFields
//Description: In freeMarker we are not able to expose custom formula fields. 
//			   This function extracts that data for usage in Trimpath/Handlebars
//				It preserves the structure of netsuite's JSON object
//				JSON has been parsed into new objects so that reference to Netsuite's object is lost.
//Input:		Netsuite's search results
//Output:		Array of JSON objects that preserve NetSuite's search result structure, along with formula fields 
//Date: Marko Obradovic 20150924
//------------------------------------------------------------------
 function cre_generateFormulaFields (results)
 {
 	  var result_new = {};
 	  var results_new = [];
 	  var result = null;
 	  var func = "cre_generateFormulaFields";
 	  var columns = null;
 	  var columnLen = 0;
 	  var column = null;
 	  var label = "";
   	  var text;
	  var formula = "";
	  var functionName = "";
 	  var value = "";
 	  var object = {};
 	  var j = 0;
 	  var i = 0;
 		
 	 nlapiLogExecution("DEBUG", func, "Start");
 	  
     
     for (j = 0; j < results.length; j += 1) {
   	  result = results[j];
//   	  nlapiLogExecution("DEBUG", func, "result: " + JSON.stringify(result));
         // return all columns associated with this search
         columns = result.getAllColumns();
         result_new = JSON.parse(JSON.stringify(result));
         columnLen = columns.length;
         // loop through all columns and pull UI labels, formulas, and functions that have
         // been specified for columns
          for (i = 0; i <= columnLen; i+=1)
         {
             column = columns[i];
             if (column)
             {
                 label = column.getLabel();
                 formula = column.getFormula();
                 functionName = column.getFunction();
                 name = column.getName();
                 value = result.getValue(column);
                 text = result.getText(column);

                 if (label)
                 {
               	  object = {};
               	  object.formula = formula;
               	  object.functionName = functionName;
               	  object.label = label;
               	  object.value = value;
               	  object.name = name;
                  object.text = text;
               	  result_new.columns[cre_formatkey(label)] = object;
                 }
                 
             }
         }
          results_new.push(result_new);
     }
     //nlapiLogExecution("DEBUG", func, "End");
     return results_new;
           
 }
 
 function cre_getResults(resultSet)
 {
	 var func = "cre_getResults";
     var length = 0;
     var count = 0;
     var pageSize = 1000; //1000 is max:  SSS_SEARCH_RESULT_LIMIT_EXCEEDED : No more than 1000 search results may be requested at one time from nlobjSearchResultSet.getResults(). Please narrow your range, or use nlobjSearchResultSet.forEachResult() instead
     var currentIndex = 0;
     var returnSet = [];
     var newResults = [];
     
     do
     {
    	 	
    	 	if (nlapiGetContext().getRemainingUsage() < GET_REMAINING_USAGE_LESS_THAN_GOVERNANCE_ERROR)
    	 	{
    	 		throw nlapiCreateError(func, "Only " + nlapiGetContext().getRemainingUsage() + "/" + global_usageStart + " governance units remain. Exiting.");
    	 	}
    	 	newResults = resultSet.getResults(currentIndex, currentIndex + pageSize);
    	 	count = newResults.length;
    	 	newResults.forEach(function (result_entry) 
    	 	{
    	 		returnSet.push(result_entry);
    	 	});
            
            currentIndex += pageSize;
            length += count;
     }
     while(count === pageSize);
     return returnSet;
 }
 
 
//------------------------------------------------------------------
//Object: loadRecursiveSavedSearch
//Description: Processes CRE Profile Lines 
//Input:		creRecord, thisRecordName, searchId, parentKeys, childKeyField, rawData
//Output:		 
//Date: BD 20150924 //MZ: 20160730
//	BD 20170927: if childKeyField is blank, then this is a search with no parent, and therefore no dynamic filters
//------------------------------------------------------------------
 this.loadRecursiveSavedSearch = function(thisRecordName, searchId, parentKeys, childKeyField, rawData)
 {
	 creRecord = this;
     var func = "loadRecursiveSavedSearch";
     var i = 0;
     var j = 0;
     var parentKeyField = null;
     var actualParentKeyField = null;
     var colName = null;
     var joinName = null;
     var groupName = null;
     var column = null;
     var linkColumn = null;
     var keys = [];
     var templateEngineID = creRecord.TemplateEngine;
     var recorhdName = "";
	 
     try {

          nlapiLogExecution("DEBUG", func, "thisRecordName=" + thisRecordName + ";  searchId=" + searchId + ";  childKeyField=" + childKeyField + ";  parentKeys=" + JSON.stringify(parentKeys) + ";");
   	  
          
          //nlapiLogExecution("DEBUG", func + " parentKeys type: ", (typeof parentKeys));
          
          if (!parentKeys && childKeyField)		// we should only have parent if childKeyField was passed in
          {
        	  nlapiLogExecution("DEBUG", func, " Exiting function. parentKeys is empty");
        	  return;
          }
          if (parentKeys.length === 0 && childKeyField)		// we should only have parent if childKeyField was passed in)
          {
        	  nlapiLogExecution("DEBUG", func, " Exiting function. parentKeys array is empty");
        	  return;
          }
         
         var search = nlapiLoadSearch(null, searchId);

         // search.addFilter(new nlobjSearchFilter(childKeyField, null, "anyof", parentKeys));
         // Boban 2017.03.31 - per Matth M., the previous addFilter was replaced by the following 8 lines of code (down to the new addFilter, to deal with child key joins
         
         if (childKeyField) {
             var childKeyFieldArray=childKeyField.split(".");
             var childKeyFieldJoin=null;
             if(childKeyFieldArray.length==2) {
            	 childKeyField=childKeyFieldArray[1];
            	 childKeyFieldJoin=childKeyFieldArray[0];
             }
             nlapiLogExecution("DEBUG","childKeyField, childKeyFieldJoin",childKeyField+", "+childKeyFieldJoin);
             search.addFilter(new nlobjSearchFilter(childKeyField, childKeyFieldJoin, "anyof", parentKeys));
             // Boban 2017.03.31 - end of code added         	 
         }
         
         
         if (typeof creRecord.additionalFilters === "function") 
         {
        	 var additionalFiltersArr = creRecord.additionalFilters(thisRecordName);
        	 if (additionalFiltersArr.constructor === Array)
             {
        		 additionalFiltersArr.forEach(function (filter_entry) 
        		 {
        			 nlapiLogExecution("DEBUG", "additionalFilters defined on record: + " + thisRecordName);
        			 search.addFilter(filter_entry);
        		 });
        		 
             }
         }
         
     	 var resultSet = search.runSearch();
     	 
         var results = cre_getResults(resultSet);
         nlapiLogExecution("DEBUG", "r-results", results.length);
         
         if (results.length == 0) {
        	 return;
         }
         
 		 var test_sort_option = cre_noempty(results[0].getAllColumns()[0].getLabel(),"").toLowerCase();
 		 if (test_sort_option === "sort")
 		 {
 				nlapiLogExecution("DEBUG", "Sorting results");
 				// now sort the results by the first column
 				results.sort(function(a, b) 
 				{
 					// sort by column 0 
 					var ac = a.getAllColumns();
 					var bc = b.getAllColumns();
 				    var va = a.getValue(ac[0]);
 				    var vb = b.getValue(bc[0]);
 				    return va < vb ? -1 : (va > vb ? 1 : 0);
 				});
 		 }
       	  
       	  
 		  
         if (templateEngineID === creJSONroot.customLists.CRETemplateEngines.keys.FreeMarker) 
         {
           	  //since rawData is only for Display for FreeMarker, adding formula fields to rawData will not work. 
            	 creRecord.Renderer.addSearchResults(thisRecordName, results);
                 rawData[thisRecordName] = results;
         }
         else
         {
           	  //for non FreeMarker engines (netsuite array operations like getAllColumns require strict dataRaw format)
           	  // , add custom formula fields to the DataRaw
           	  	rawData[thisRecordName] = cre_generateFormulaFields(results);
         }

         nlapiLogExecution("DEBUG", func, "rawData[thisRecordName]" + JSON.stringify(rawData[thisRecordName]));
         var searchResultColumns = results[0].getAllColumns();
         

         for (i = 1; i <= creRecord.nsRecordObj.getLineItemCount(CRE_PROFILE_LINE_ITEM_COLLECTION); i += 1) 
         {
                 // if the parent name is blank, then it is a child of the "root" record

                 if (creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentRecordName.fieldid, i) === thisRecordName) 
                 {

                     searchId = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.SavedSearchID.fieldid, i);
                     parentKeyField = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i);

                     childKeyField = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ChildKeyField.fieldid, i);
                     recorhdName = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.RecordName.fieldid, i);

                     nlapiLogExecution("DEBUG", func, "Line " + i + " is a child of the current search.  Extracting field " + parentKeyField);

                     actualParentKeyField = parentKeyField.split(".")[parentKeyField.split(".").length - 1];

                     nlapiLogExecution("DEBUG", func, "actualParentKeyField : " + actualParentKeyField);
                     
                     linkColumn = null;
                     colName = null;
                     joinName = null;
                     groupName = null;
                     for (column in searchResultColumns) 
                     {
                         //aggregate search results always return formula; so use the label name
                    	 if (searchResultColumns[column].getName() === actualParentKeyField || searchResultColumns[column].getLabel() == actualParentKeyField) 
                         {
                    		 linkColumn = column; //found the link
                    		 colName = searchResultColumns[column].getName();
                    		 joinName = searchResultColumns[column].getJoin();
                             groupName = searchResultColumns[column].getSummary();
                    		 nlapiLogExecution("DEBUG", func, "Column info for Obj: Name : Label : Join : Group = " + linkColumn + " : " + colName + " : " + searchResultColumns[column].getLabel() + " : " + joinName + " : " + groupName );
                             break;
                         }
                     }
                     
                     if (linkColumn){
                    	 nlapiLogExecution("DEBUG", func, "Found a match on linkColumn: " + searchResultColumns[linkColumn].getName());
                    	 keys = [];
	                     for (j = 0; j < results.length; j += 1) 
	                     {
   	                    	 key = (actualParentKeyField === "id")
	                    	 	? results[j].getId()
	                    	 	: results[j].getValue(results[0].getAllColumns()[linkColumn]);
	                    	 			
	                         if (key) 
	                         {
	                             if (keys.indexOf(key) < 0) 
	                             {
	                            	 //nlapiLogExecution("DEBUG", func, " adding key to the keys list : " + key);
	                                 keys.push(key);
	                             }
	                         }
	                     }
	                     creRecord.loadRecursiveSavedSearch(recorhdName, searchId, keys, childKeyField, rawData);
                     }
                 }
             }
         
     } 
     catch (e) 
     {
    	 if (e instanceof nlobjError) 
   	  	 {
    		 throw nlapiCreateError(func, e.getCode() + " : " + e.getDetails() + "  parentKeys:" + parentKeys);
         } 
   	     else 
         {
   	    	 throw nlapiCreateError(func, e.toString() + "  parentKeys:" + parentKeys);
         }
         
     }
 };
//------------------------------------------------------------------
//Function:         prepareSavedSearchData
//Called from:      Translate
//parameters:       
//                  id - internal id of the record being loaded. Record type is stored in CRE Profile ID
//Date: BD 20150712
//------------------------------------------------------------------
this.prepareSavedSearchData = function (id)
{
	creRecord = this;
	var func = "prepareSavedSearchData";
	var i = 0;
	var keys = [];
	var childKeyField = null;
	var recordName = null;
	var searchId = null;
	var ParentKeyField = "";
	var ParentKeyFieldType = "";
	
	nlapiLogExecution("DEBUG", func, "Preparing profile " + creRecord.internalid + " using record id " + id);
    //PROFILE ID IS REQUIRED
    if (!cre_isValidNumber(creRecord.internalid)) 
    {
        throw nlapiCreateError(func, "CRE: Invalid profile id  [" + creRecord.internalid + "]");
    }
    
    //RECORD ID IS REQUIRED 
    if (!cre_isValidNumber(id)) 
    {
        throw nlapiCreateError(func, "CRE: Invalid record id  [" + id + "]");
    }
	  
    nlapiLogExecution("DEBUG", func, "Using Template Engine ID: " + creRecord.TemplateEngine);

    //GET RECORD TYPE FROM RECORD ID
    var recType = cre_get_record_type(creRecord.DataRecordType);
    
    nlapiLogExecution("DEBUG", func, "recType text: " + recType);
    nlapiLogExecution("DEBUG", func, "recType value: " + creRecord.DataRecordType);
    
    if (creRecord.DataRecordType > 0) {
    	//GET CUSTOM RECORD TYPE FROM RECORD ID
        recType = cre_getCustomRecordType(creRecord.DataRecordType);
    }
    nlapiLogExecution("DEBUG", func, "recType " + recType);
    
    
    creRecord.CREProfileDataRecordType = recType; //MUST BE 'transaction' (NOT 'salesorder')
    creRecord.CREProfileDataRecordID = id;
    
    if ((recType === "transaction") || (recType === "item")) {
  	  recType = cre_getRecordType(recType, id).toLowerCase();
    }
    
    nlapiLogExecution("DEBUG", func, "recType " + recType);
    
    //PREPARE FREEMARKER RENDERER
    if (creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.FreeMarker) {
    	creRecord.Renderer = nlapiCreateTemplateRenderer();
    }

    nlapiLogExecution("DEBUG", func, "Loading record type [" + recType + "] id " + id);
    
    if (!recType)
    {
    	throw nlapiCreateError(func, "Invalid Record Type " + creRecord.DataRecordType);
    }
    
    var parms;
    if (creRecord.fields.FormID.value) 
        parms = {customform: creRecord.fields.FormID.value};
    
    //LOAD RECORD
    var ROOT = nlapiLoadRecord(recType, id, parms);
    
    //HANDLE CUSTOM PARAMETERS: CUSTOM PARAMETER 1 //need to switch to multi select custom param option
    if (creRecord.CustomParam1) {
        ROOT.setFieldValue(creRecord.fields.CustomParam1.fieldid,  cre_today(creRecord.CustomParam1));
        //nlapiLogExecution("DEBUG", "Root1", JSON.stringify(ROOT));
    }
    
    //HANDLE CUSTOM PARAMETERS: CUSTOM PARAMETER 2 //need to switch to multi select custom param option
    if (creRecord.CustomParam2) {
        ROOT.setFieldValue(creRecord.fields.CustomParam2.fieldid, cre_today(creRecord.CustomParam2));
    }
    
    //ADD LOADED RECORD TO RENDERER
    if (creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.FreeMarker) {
    	creRecord.Renderer.addRecord(creRecord.RecordName, ROOT);
    	//PREPARE RawData. If FreeMarker template, this is only used for easy review of data
        //if Handlebars/Trimpath, RawData is used during transformation
        creRecord.RawData[creRecord.RecordName] = ROOT;
    }
    else
    {
    	//non free marker engines need stringified version of data
    	creRecord.RawData[creRecord.RecordName] = JSON.parse(JSON.stringify(ROOT));
    }

    //  Marko Obradovic 20180210
    //  this is special handling for our CRE Request Input HTTP pattern.  We want to get
    //  the request information to look like regular JSON so that it is easy to work with 
    //  in the template.
    if (recType === HTTP_REQUEST_RECORD_INTERNAL_ID)
    {
    	if (creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_header"] && creRecord.RawData["httprequest"])
    	{
    		if (creRecord.RawData["httprequest"]["headers"])
    		{
    			var headers = JSON.parse(creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_header"]);
    			_.extend(creRecord.RawData["httprequest"]["headers"], headers);
    		}
    	}
    	if (creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_params"] && creRecord.RawData["httprequest"])
    	{
    		if (creRecord.RawData["httprequest"]["parameters"])
    		{
    			var parameters = JSON.parse(creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_params"]);
    			_.extend(creRecord.RawData["httprequest"]["parameters"], parameters);
    		}
    	}
    	if (creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_extradat"] && creRecord.RawData["httprequest"])
    	{
    		if (creRecord.RawData["httprequest"]["extradata"])
    		{
    			var extradata = JSON.parse(creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_extradat"]);
    			_.extend(creRecord.RawData["httprequest"]["extradata"], extradata);
    		}
    	}
    	if (creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_body"] && creRecord.RawData["httprequest"])
    	{
    		if (creRecord.RawData["httprequest"]["body"])
    		{
    			var body = JSON.parse(creRecord.RawData[creRecord.RecordName]["custrecord_pri_cre_request_http_body"]);
    			_.extend(creRecord.RawData["httprequest"]["body"], body);
    		}
    	}
    }
    
    //THIS TRY/CATCH BLOCK PREPARES COMPLETE SET OF REQUESTED DATA  
    try {
    
        nlapiLogExecution("DEBUG", func, "Json.stringify(ROOT)" + JSON.stringify(ROOT));

        nlapiLogExecution("DEBUG", func, "We have " + creRecord.nsRecordObj.getLineItemCount(CRE_PROFILE_LINE_ITEM_COLLECTION) + " search lines");

        for (i = 1; i <= creRecord.nsRecordObj.getLineItemCount(CRE_PROFILE_LINE_ITEM_COLLECTION); i += 1) {
            // if the parent name is blank, then it is a child of the "root" record

        	nlapiLogExecution("DEBUG", func, "recname=" + creRecord.RecordName + "  parent rec = " + creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentRecordName.fieldid, i));
            // if parent name is blank, then it is a "first level" child, so process it here
            if (creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentRecordName.fieldid, i) === creRecord.RecordName || 
            		!creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentRecordName.fieldid, i)) {

                searchId = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.SavedSearchID.fieldid, i);

                keys = [];
                  // THIS CODE HAD TO BE COMMENTED OUT AS IT WAS BREAKING. INCLUDED WHEN MERGED 'ITS' CODE INTO creProfile.js; THEN COMMENTED OUT.  
//                field_name = [ROOT.getFieldValue(creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i))];
//                if (field_name === 'internalid' || field_name === 'id'){
//	      				keys = [ROOT.getId()];
//	      			}else{
//	      				keys = [ROOT.getFieldValue(field_name)];	
//	      			}
//              
                
//                nlapiLogExecution("DEBUG", func, "CRE_PROFILE_LINE_ITEM_COLLECTION: " + CRE_PROFILE_LINE_ITEM_COLLECTION);
//                nlapiLogExecution("DEBUG", func, "creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid: " + creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid);
//                nlapiLogExecution("DEBUG", func, "Index i: " + i);
//                nlapiLogExecution("DEBUG", func, "creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i) : " + creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i));
//                nlapiLogExecution("DEBUG", func, "ROOT.getId(): " + ROOT.getId());
                
                ParentKeyField = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ParentKeyField.fieldid, i);
                nlapiLogExecution("DEBUG", func, " ParentKeyField Requested: " + ParentKeyField);
                if (ParentKeyField && ROOT.getField(ParentKeyField))
                {
                	
	                  ParentKeyFieldType = ROOT.getField(ParentKeyField).getType();
	                  //Marko Obradovic 20150829: Added ability to handle MultiSelect Matches that come back from CRE Profile loaded record id  
	                  // Example:
	                  // Goal: We must select only some order lines for processing
	                  // step1: Define custom record that keeps tracks of User-chosen lines that need to be processed. Suitelet Form is required for this step. 
	                  // Step2: Point CREProfile to the custom record. If user in step 1 selected multiple lines, following lines of code 
	                  // solve the problem of only picking selected values out of all. 
	                  if (ParentKeyFieldType === "multiselect")
	                  {
	                	  keys = ROOT.getFieldValues(ParentKeyField);  //returns array
	                	  
	                	  nlapiLogExecution("DEBUG", func, " found multi select field " + ParentKeyField + " keys: " + keys);
	                	  
	                  }
	                  else
	                  {
	                	  if (ROOT.getFieldValue(ParentKeyField))
	                	  {
	                		  keys = [ROOT.getFieldValue(ParentKeyField)]; //in order for recursive search to work, keys must be populated with some value
	                	  }
	                	  nlapiLogExecution("DEBUG", func, " found field " + ParentKeyField + " keys: " + keys);
	                  }
                }
                
//                nlapiLogExecution("DEBUG", func, "keys " + keys);
//                nlapiLogExecution("DEBUG", func, "keys.length " + keys.length);
//                nlapiLogExecution("DEBUG", func, "parentid " + parentid);
//                nlapiLogExecution("DEBUG", func, "ROOT: " + JSON.stringify(ROOT));
//                nlapiLogExecution("DEBUG", func, "FieldType " + ROOT.getField(parentid).getType());
//                nlapiLogExecution("DEBUG", func, "values " + JSON.stringify(values));

                childKeyField = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.ChildKeyField.fieldid, i);
                recordName = creRecord.nsRecordObj.getLineItemValue(CRE_PROFILE_LINE_ITEM_COLLECTION, creJSONroot.Records.CREProfileLine.fields.RecordName.fieldid, i);

                nlapiLogExecution("DEBUG", func, " recordName " + recordName);
                
                creRecord.loadRecursiveSavedSearch(recordName, searchId, keys, childKeyField, creRecord.RawData);
            }
        }
        
    } catch (e) {
   	 if (e instanceof nlobjError) 
  	  	 {
   		 throw nlapiCreateError(func, e.getCode() + " : " + e.getDetails() + " : Could not process profile lines.");
        } 
  	     else 
        {
  	    	 throw nlapiCreateError(func, e.toString() + " : Could not process profile lines.");
        }
   }
};
//------------------------------------------------------------------
//Function:        cre_getConfiguration
//Called from:     
//parameters:      null
//Description:	   Retrieves requested configuration and sends it back in json object. It adds heading text for 
//					easier display and reading of syntax data
//Date: 20150924
//Date: 20160515  mz: we found issues with trimpath choking on preferences with spaces and parenthesis.
//------------------------------------------------------------------
function cre_getConfiguration(configuration, heading)
{
	var conf = nlapiLoadConfiguration(configuration);
	var confFields = conf.getAllFields();
    var obj = null;
    var field = null;
    var fieldName = null;
    
    if (confFields)
    {
    	if (confFields.length>0)
    	{
    		obj = {};
    		obj.heading_text = heading;
	    	for (field in confFields) {
	            fieldName = confFields[field].replace(/([()\s])/g, "");
	            obj[fieldName] = conf.getFieldValue(fieldName);
	        }
    	}
    }
    return obj;
}
function cre_getRendererJSON(list, heading, obj )
{
	var field = null;
	var fieldName = "";
	var jsonobj = null;
    if (list)
    {
    	if (list.length>0)
    	{
    		jsonobj = {};
    		jsonobj.heading_text = heading;
	    	for (field in list) {
	            fieldName = list[field];
	            jsonobj[fieldName] = "${"+obj+"." + fieldName + "}";
	        }
    	}
    }
    
    return jsonobj;
		
}
function cre_getContextInfo()
{
	var objContext = {};
	objContext.heading_text = "Context Fields";
	objContext.AllowedUsage = global_usageStart;
	objContext.getRemainingUsage = nlapiGetContext().getRemainingUsage();
	objContext.getBundleId = nlapiGetContext().getBundleId();
	
	objContext.getCompany = nlapiGetContext().getCompany();
	objContext.getDepartment = nlapiGetContext().getDepartment();
	objContext.getDeploymentId = nlapiGetContext().getDeploymentId();
	objContext.getEmail = nlapiGetContext().getEmail();
	objContext.getEnvironment = nlapiGetContext().getEnvironment();
	objContext.getExecutionContext = nlapiGetContext().getExecutionContext();
	objContext.getLocation = nlapiGetContext().getLocation();
	objContext.getLogLevel = nlapiGetContext().getLogLevel();
	objContext.getName = nlapiGetContext().getName();
	
	
	objContext.getRole = nlapiGetContext().getRole();

	objContext.getRoleCenter = nlapiGetContext().getRoleCenter();
	objContext.getRoleId = nlapiGetContext().getRoleId();
	objContext.getScriptId = nlapiGetContext().getScriptId();
	objContext.getSubsidiary = nlapiGetContext().getSubsidiary();
	objContext.getUser = nlapiGetContext().getUser();
	objContext.getVersion = nlapiGetContext().getVersion();
	
	return objContext;
	
	
}
//------------------------------------------------------------------
//Function:         prepareAutoIncludeData
//Called from:         Translate
//parameters:        null
//                  
//Date: 20150712
//------------------------------------------------------------------
this.prepareAutoIncludeData = function ()
{
	creRecord = this;
    var func = "prepareAutoIncludeData";
    var renderer = null;
    var result = "";
    nlapiLogExecution("DEBUG", func, "Start");
    
    //PROVIDE SYNTHETIC AND OTHER COMPANY/USER/PREFERENCES FIELDS FOR NON FREEMARKER ENGINES
    if 
//    		((creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.HandleBars) || 
    		(creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.TrimPath)
//    	)
    {
    	renderer = nlapiCreateTemplateRenderer();
    	//Since synthetic fields are only available in freemarker, use freemarker to retrieve them, and make them available in JSON. 
    	try 
    	{
	    	
	    	var cinfo = JSON.stringify(cre_getRendererJSON(syntheticCompanyFields, "Company Information (Synthetic Fields)", "companyinformation"));
	    	renderer.setTemplate(cinfo);
	    	result = renderer.renderToString();
		 	   
	    	creRecord.RawData.syntheticCompanyFields = JSON.parse(result);
			
			//nlapiLogExecution("DEBUG", func + " adding syntheticCompanyFields ", result );
    	} catch (ex) {
    		if (ex instanceof nlobjError) {
    	    	nlapiLogExecution("ERROR", func + "INFO: Synthetic Company Info Syntax Data Prepare system error", ex.getCode() + " : " + ex.getDetails());
    	    } else {
    	    	nlapiLogExecution("ERROR", func + "INFO: Synthetic Company Info Syntax Data Prepare unexpected error", ex.toString());
    	    }
        }
    	
    	try 
    	{
	    	
	    	var uinfo = JSON.stringify(cre_getRendererJSON(syntheticUserFields, "User Information (Synthetic Fields)", "user"));
	    	renderer.setTemplate(uinfo);
	    	result = renderer.renderToString();
			creRecord.RawData.syntheticUserFields = JSON.parse(result);
    	} catch (ex1) {
    		if (ex1 instanceof nlobjError) {
    	    	nlapiLogExecution("ERROR", func + "INFO: Synthetic User Info Syntax Data Prepare system error", ex1.getCode() + " : " + ex1.getDetails());
    	    } else {
    	    	nlapiLogExecution("ERROR", func + "INFO: Synthetic User Info Syntax Data Prepare unexpected error", ex1.toString());
    	    }
        }
    	
    	try 
    	{
	    	
	    	//mz: 20160730: known bug.  We see issue with preference fields on signature with line breaks in data
    		var pinfo = JSON.stringify(cre_getRendererJSON(syntheticPreferenceFields, "Preferences (Synthetic Fields)", "preferences"));
	    	//mz: temporary submit data to see what is in the data causing an issue
	    	//var tfile = nlapiCreateFile("pinfo-output.txt", "PLAINTEXT", pinfo);
	    	//tfile.setFolder(TEMP_FOLDER_ID);
	    	//nlapiSubmitFile(tfile);
	    	
	    	renderer.setTemplate(pinfo);
	    	result = renderer.renderToString();
	 	   //var tfile = nlapiCreateFile("pinfo-result.txt", "PLAINTEXT", result);
	 	   //tfile.setFolder(TEMP_FOLDER_ID);
	 	   //nlapiSubmitFile(tfile);

	    	
	    	creRecord.RawData.syntheticPreferencesFields = JSON.parse(result);
    	} catch (ex2) {
    		if (ex2 instanceof nlobjError) {
    	    	nlapiLogExecution("ERROR", func + "INFO: Synthetic Preference Info Syntax Data Prepare system error", ex2.getCode() + " : " + ex2.getDetails());
    	    } else {
    	    	nlapiLogExecution("ERROR", func + "INFO: Synthetic Preference Info Syntax Data Prepare unexpected error", ex2.toString());
    	    }
        }
    	
    	try 
    	{
    		//COMPANY INFORMATION FIELDS
	    	var companyinformation =  cre_getConfiguration("companyinformation", "Company Information");
	    	if (companyinformation)
	        {
//	    		this.testTransform(companyinformation);
	        	creRecord.RawData.companyinformation = companyinformation;
	        }
    	} catch (ex3) {
    		if (ex3 instanceof nlobjError) {
    	    	nlapiLogExecution("ERROR", func + "INFO: Company Info Syntax Data Prepare system error", ex3.getCode() + " : " + ex3.getDetails());
    	    } else {
    	    	nlapiLogExecution("ERROR", func + "INFO: Company Info Syntax Data Prepare unexpected error", ex3.toString());
    	    }
        }
    	
    	try 
        {
    	     //USER INFORMATION FIELDS
	    	var userpreferences =  cre_getConfiguration("userpreferences", "User Information");
	    	if (userpreferences)
	        {
//	    			this.testTransform(userpreferences);
	    			creRecord.RawData.userpreferences = userpreferences;
	        }
        } catch (ex4) {
    		if (ex4 instanceof nlobjError) {
    	    	nlapiLogExecution("ERROR", func + "INFO: User Info Syntax Data Prepare  system error", ex4.getCode() + " : " + ex4.getDetails());
    	    } else {
    	    	nlapiLogExecution("ERROR", func + "INFO: User Info Syntax Data Prepare unexpected error", ex4.toString());
    	    }
        }
        
        try 
        {
    	     //COMPANY PREFERENCES FIELDS
	    	var companypreferences =  cre_getConfiguration("companypreferences", "Company Preferences");
	    	if (companypreferences)
	        {
//	    			this.testTransform(companypreferences);
	    			creRecord.RawData.companypreferences = companypreferences;
	        }
        } catch (ex5) {
    		if (ex5 instanceof nlobjError) {
    	    	nlapiLogExecution("ERROR", func + "INFO: Company Preference Info Syntax Data Prepare system error", ex5.getCode() + " : " + ex5.getDetails());
    	    } else {
    	    	nlapiLogExecution("ERROR", func + "INFO: Company Preference Syntax Data Prepare  unexpected error", ex5.toString());
    	    }
        }
    }
    nlapiLogExecution("DEBUG", func, "End");
};
//------------------------------------------------------------------
//Function:        testTransform
//Called from:     
//parameters:      null
//Description:	   Adding of user information to json for transformation in Trimpath or Handlebars
//					produced trandformation error. Something about user object is making trimpath fail.
//					This function test transforms data against template and will fail if data in not valid
//Date: 20150924
//Date: 20160729	Marko Obradovic: Turning off test transform as it should not be producing dependance on jsonPath 
//					Trusting that trimpath issues have been resolved. 
//------------------------------------------------------------------
//this.testTransform = function (data)
//{
//	creRecord = this;
//	var func = "testTransform";
//	var escape = true;
//	var i = 0;
//	var html = "<!-- -->";
//	var len = 0;
////		, a = new Date().getTime();
//		
//		nlapiLogExecution("DEBUG", func, "Starting");
//		
////		if (creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.HandleBars)
////		{
////			MAX_CHILD_RECORDS_TO_DISPLAY =2;
////		}
//		
//		var datanew = JSON.parse(JSON.stringify(data));
//		var syntax = jsonPath(datanew,"$..*" , {resultType:"PATH"}, MAX_CHILD_RECORDS_TO_DISPLAY, creRecord.TemplateEngine, escape);
//		var syntaxToBeTranslated = jsonPath(datanew,"$..*" , {resultType:"PATH"}, MAX_CHILD_RECORDS_TO_DISPLAY, creRecord.TemplateEngine);
//		
//		len = syntax.length;
//		
//		for (i = 0; i < len; i+=1) 
//		{
//				html += global_alt_row
//				? "<tr class=alt>"
//				: "<tr>";
//				global_alt_row = !global_alt_row;
//	     
//				html += "<td>" + syntax[i]+ " </td>\n";
//				html += "<td>" + syntaxToBeTranslated[i] + "</td></tr>\n";
//		}
//		creRecord.translateValue(html);
//
//};


//------------------------------------------------------------------
//Function:         translateTemplatedValues
//Called from:      Translate
//parameters:       null
//Description:		If any of the fields (except document) contains templated string, that needs to be translated. 
//					Only available for TrimPath/Handlebars; but probably, this could be enabled for FreeMarker if translation was saved into custom parameter                 
//Date: 20150712
//------------------------------------------------------------------
this.translateTemplatedValues = function ()
{
	creRecord = this;
	var func = "translateTemplatedValues";
	nlapiLogExecution("DEBUG", func, "Start");
	
  	if 
//  			((creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.HandleBars) || 
  			(creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.TrimPath)
//  		)
  	{
  		var obj = {};
  		obj.heading_text = "Template Fields";
		_.each(creRecord.fields, function (field) {
			if (field.translate === "T") 
    	    {
				if (field.fieldtype !== "Document")
				{
					//translate all values that are not template document, and save them into json object
					if (field.Value)
					{
						obj[field.fieldname] = creRecord.translateValue(field.Value);
					}
					else
					{
						obj[field.fieldname] = "";
					}
				}
    	    }
		});
		creRecord.RawData.TemplateFields = obj;
  	}
  	nlapiLogExecution("DEBUG", func, "End");
};
//------------------------------------------------------------------
//Function:         validateFields
//Called from:      Translate
//parameters:       null
//Description:		At design time, need to validate and throw error if any of the data is not valid.                 
//Date: 20150712
//------------------------------------------------------------------
this.validateFields = function ()
{
	 var func = "validateFields";
     var foldername = null;
     var f = null;
	 
	_.each(creRecord.fields, function (field) {
  	    if ((field.translate === "T") && (field.value)) 
  	    {
  	    	nlapiLogExecution("DEBUG", "Incoming field/value", field.fieldname + "/" + field.Value);
            //var datacontext = JSON.parse(JSON.stringify(creRecord.RawData));
            var value = field.value;
            if (field.fieldtype === "Document")
            {
          	  if (!field.Document) //if document has not been loaded already, load it now
          	  {
          	  	var fileNameID = field.value;
          	  	var oFile = nlapiLoadFile(fileNameID);
          	  	field.Document = oFile.getValue();
          	  }
                value = field.Document;
            }
            
            
    		field.translatedValue = creRecord.translateValue(value);
            
            //validate fields
            switch (field.fieldid)
            {
            	case creJSONroot.Records.CREProfile.fields.DocumentName.fieldid:
          		if (field.Value)
          		{
          			try
          			{
          				foldername = cre_getFolderName(TEMPLATE_FOLDER_ID);
          				nlapiLogExecution("DEBUG", "foldername",foldername);
                			f = nlapiLoadFile(foldername +"/" + field.translatedValue); 
                	        if (f) 
                	        { 
                	        	throw nlapiCreateError(func, "File [" + foldername + "/"+ field.translatedValue + "] already exists."); 
                	        }
          			}
          			catch(e) 
          			{
          				//do nothing as we are only testing if file exists. Don't care if it does not. 
          				nlapiLogExecution("DEBUG", func, "file " + field.translatedValue + " does not exist");
          			}
          	         
          			
          		}
          		break;
            	case creJSONroot.Records.CREProfile.fields.Sender.fieldid:
            		if ((field.Value) && (!cre_isValidNumber(field.translatedValue)))
            		{
            			throw nlapiCreateError(func, "Translated Value [" + field.translatedValue + "] for label [" +field.fieldname+ "] must be internalId of an employee record.");
            		}
            		break;
            	case creJSONroot.Records.CREProfile.fields.Recipient.fieldid:
            		if (field.translatedValue)
            		{
            			field.translatedValue = field.translatedValue.replace(/;/g, ",");
            			field.translatedValue = field.translatedValue.replace(/\s/g, ",");
            			field.translatedValue = field.translatedValue.replace(/,,/g, ",");
            			if (!cre_isValidEmail(field.translatedValue))
            			{
            				throw nlapiCreateError(func, "Translated Value [" + field.translatedValue + "], [" + field.Value + "] for label [" +field.fieldname+ "] is not a valid email.");
            			}
            		}
            		break;
            	case creJSONroot.Records.CREProfile.fields.CC.fieldid:
            	case creJSONroot.Records.CREProfile.fields.BCC.fieldid:
            		if (field.translatedValue) 
            		{	
            			field.translatedValue = field.translatedValue.replace(/;/g, ",");
            			field.translatedValue = field.translatedValue.replace(/\s/g, ",");
            			field.translatedValue = field.translatedValue.replace(/,,/g, ",");
            			field.translatedValue = field.translatedValue.split(","); //transformation into array per help instructions for cc and bcc
            			if (!cre_isValidEmail(field.translatedValue))
            			{
            				throw nlapiCreateError(func, "Translated Value [" + field.translatedValue + "] for label [" +field.fieldname+ "] is not a valid email.");
            			}
            		}
            		break;
            }
            
            
            
        }
    });
	
};





//------------------------------------------------------------------
//Function:         Translate
//Called from:       creProfileExecute, creProfileTesterSuitelet
//parameters:        prfileid - CRE Profile ID
//                    id - internal id of the record being loaded. Record type is stored in CRE Profile ID
//Date: 20150712
//------------------------------------------------------------------
this.Translate = function (id)
{
    creRecord = this;
    creRecord.ID = id;
    
    var func = "Translate";
    
    nlapiLogExecution("DEBUG", func, "Start");
    creRecord.prepareSavedSearchData(id);
    creRecord.prepareAutoIncludeData();		//Trimpath/Handlebars only
    
    
    
    

    
    
//    	if (creRecord.TemplateEngine === creJSONroot.customLists.CRETemplateEngines.keys.TrimPath)
//        {
//    		//for now, in trimpath, replace all & characters due to errors like The entity name must immediately follow the '&' in the entity reference.
//    		// example:
////    		"item": {
////				"name": "INK & TONER : HP 12A Toner - Black",
////				"internalid": "559"
////			},
//    		// confirmed on 9/29/2015 that this is valid solution for trimpath
//    		// mz, 20160602: suspect this is not right for trimpath.  But we need to ground
//    		
//    		creRecord.RawData = JSON.parse(JSON.stringify(creRecord.RawData).replace(/&/g, "&amp;"));
//        }
    	
	if (typeof creRecord.javaScriptOverride === "function") 
    {
		creRecord.javaScriptOverride();
    }
	
    	// we need to handle two of the fields here

    	
	creRecord.RawData.CurrencyId = creRecord.translateValue(creRecord.fields["CurrencyId"].Value);
	creRecord.RawData.LocaleId = creRecord.translateValue(creRecord.fields["LocaleId"].Value);
	
    creRecord.translateTemplatedValues(); 	//Trimpath/Handlebars only
	creRecord.validateFields();
    
	creRecord.RawData.Context = cre_getContextInfo();
	
	nlapiLogExecution("DEBUG", func + " GOVERNANCE USAGE POINTS", JSON.stringify(creRecord.RawData.Context));
	
	nlapiLogExecution("DEBUG", func, "End");
};

//call out to remote URL if supplied.
this.executeCompletionURLlogic = function (exeResult)
{
	var completionURL = creRecord.fields.CompletionURL.Value;
    if (completionURL)
    {
    	if (completionURL.indexOf('{profileID}')<0)
    	{
    		nlapiLogExecution("DEBUG", "Expected {profileID} placeholder not found in URL" , "URL: " + completionURL);
    		//placeholders not found in the URL. 
    		return; 
    	}
    	if (completionURL.indexOf('{ID}')<0)
    	{
    		nlapiLogExecution("DEBUG", "Expected {ID} placeholder not found in URL" , "URL: " + completionURL);
    		//placeholders not found in the URL. 
    		return; 
    	}
    	if (completionURL.indexOf('{status}')<0)
    	{
    		nlapiLogExecution("DEBUG", "Expected {status} placeholder not found in URL" , "URL: " + completionURL);
    		//placeholders not found in the URL. 
    		return; 
    	}
    	
    	completionURL = completionURL.replace(/{profileID}/, creRecord.internalid);
    	completionURL = completionURL.replace(/{ID}/, creRecord.ID);
    	
    	nlapiLogExecution("DEBUG", "Execute_URL: detail.fieldid" , exeResult.fieldid);
    	nlapiLogExecution("DEBUG", "Execute_URL: detail.EmailSent" , exeResult.EmailSent);
    	
    	if (exeResult.fileid || exeResult.EmailSent)
    	{
    		completionURL = completionURL.replace(/{status}/, CRE_STATUS.COMPLETED);
    	}
    	else 
    	{
    		completionURL = completionURL.replace(/{status}/, CRE_STATUS.FAILED);
    	}
    	
    	completionURL = completionURL + "&data=" + JSON.stringify(exeResult);
    	
    	nlapiLogExecution("DEBUG", "Execute_URL: completionURL" , completionURL);
    	nlapiRequestURL(completionURL,null,null,"GET");
    }
};

//------------------------------------------------------------------
//Function:         Execute
//Called from:      Restlet / Mass Update
//parameters: 
//Date: 20150802
//------------------------------------------------------------------
this.Execute = function (doNotSendEmail)
{
	  creRecord = this;
	  
//	  nlapiLogExecution("DEBUG", "CRE", "test");
	  
    var func = "Execute";
    var sender = creRecord.fields.Sender.translatedValue;
    var recipient= creRecord.fields.Recipient.translatedValue;
    var subject = creRecord.fields.Subject.translatedValue;
    var cc = creRecord.fields.CC.translatedValue;
	var bcc = creRecord.fields.BCC.translatedValue;
	var replyTo = creRecord.fields.ReplyTo.translatedValue;
    var documentName = creRecord.fields.DocumentName.translatedValue||"";
    var ignoreBouncedEmails = creRecord.fields.IgnoreBouncedEmails.translatedValue;
    
    var fileAttachments = creRecord.fields.FileAttachment.translatedValue; 
    
    
    var TemplateEngineID = creRecord.TemplateEngine;
    var file = null;
    var retvalue = "";
    var associative = {};
    var exeResult = {};
	var body = "";
	var fileid = null;
    var attachmentList = []; 
    
  	if (ignoreBouncedEmails == "T")
      ignoreBouncedEmails = true;
    else
      ignoreBouncedEmails = false;
  
  
	nlapiLogExecution("DEBUG", func, "Start");
    	
    body = creRecord.fields.BodyTemplate.translatedValue;
      	 
    try {
  	  
		nlapiLogExecution("DEBUG", func, "profile Translated");
		
		nlapiLogExecution("DEBUG", func, "Sender=[" + sender + "]");
        nlapiLogExecution("DEBUG", func, "Recipient=[" + recipient + "]");
        nlapiLogExecution("DEBUG", func, "Subject=[" + subject + "]");
        nlapiLogExecution("DEBUG", func, "BCC=[" + bcc + "]");
        nlapiLogExecution("DEBUG", func, "CC=[" + cc + "]");
        nlapiLogExecution("DEBUG", func, "Template Folder Id=[" + TEMPLATE_FOLDER_ID + "]");
		nlapiLogExecution("DEBUG", func, "Ignore Bounced Emails=[" + ignoreBouncedEmails + "]");
		nlapiLogExecution("DEBUG", func, "ReplyTo=[" + replyTo + "]");		  
        
        if (documentName) 
        {
      	  nlapiLogExecution("DEBUG", func, "DocumentName=[" + documentName + "]");
      	  nlapiLogExecution("DEBUG", func, "TemplateEngineID=[" + TemplateEngineID + "]");
      	  
      	  switch (cre_castInt(TemplateEngineID)) {
	              case cre_castInt(creJSONroot.customLists.CRETemplateEngines.keys.TrimPath):
	              case cre_castInt(creJSONroot.customLists.CRETemplateEngines.keys.FreeMarker):
	            	  if (body)
	                  {
	            		  if (documentName.toLowerCase().endsWith("pdf"))
	            		  {
	            			  file = nlapiXMLToPDF(body);
	            		  }
	            		  else
	            		  {
	            			  file = nlapiCreateFile(documentName, "PLAINTEXT", body);
	            		  }
		                  file.setFolder(TEMPLATE_FOLDER_ID);
		                  file.setName(documentName);
		                  nlapiLogExecution("DEBUG", func + " body", body);
		                  nlapiLogExecution("DEBUG", func + " documentName", documentName);
		                  nlapiLogExecution("DEBUG", func + " submitting file", "submitting file");
		                  fileid = nlapiSubmitFile(file);
		                  file = nlapiLoadFile(fileid);
		                  creRecord.fields.DocumentName.file = file;
		                  retvalue = retvalue + "Success. File " + documentName + " successfully created. ";
		                  exeResult.fileid = fileid;
	                  }
	                  //nlapiLogExecution("DEBUG", func + " retvalue", retvalue);
	                  break;
	              default:
	            	  throw nlapiCreateError(func, "Template Engine ID [" + TemplateEngineID + "] is not defined.");
            }
        }
        
        if (doNotSendEmail) 
        {
        	nlapiLogExecution("DEBUG", func, "doNotSendEmail parameter was passed in; bypassing send validation/execution.");        	
        }
        else if ((!sender) && (!recipient) && (!subject))
        {
      	  	nlapiLogExecution("DEBUG", func, "Sender, Recipient and Subject are empty", " Email fields are not set.");
        }
        else if (sender && recipient && subject)
        {
      	  	body = ""; //clear body variable for re-use for emailing
//      	  nlapiLogExecution("DEBUG", func + " cc ", (cc.constructor === Array));
//      	  nlapiLogExecution("DEBUG", func + " bcc ", (bcc.constructor === Array));
      	  	nlapiLogExecution("DEBUG", func, "record type=" + creRecord.CREProfileDataRecordType);

//      	  	nlapiLogExecution("DEBUG", func, "Assoc Tran=" + creRecord.fields.AssociateTransaction.translatedValue);
//      	  	nlapiLogExecution("DEBUG", func, "Assoc Entity=" + creRecord.fields.AssociateEntity.translatedValue);
//      	  	nlapiLogExecution("DEBUG", func, "Assoc Cust Rec Type=" + creRecord.fields.AssociateCustomRecordType.translatedValue);
//      	  	nlapiLogExecution("DEBUG", func, "Assoc Cust Rec ID=" + creRecord.fields.AssociateCustomRecordId.translatedValue);

      	  	// if the user specified where this email should get attached, then follow those instructions
      	  	if (creRecord.fields.AssociateTransaction.translatedValue || creRecord.fields.AssociateEntity.translatedValue || creRecord.fields.AssociateCustomRecordType.translatedValue) {
      	  		nlapiLogExecution("DEBUG", func, "Using Custom Associations");
      	  		if (creRecord.fields.AssociateTransaction.translatedValue)
					associative.transaction = creRecord.fields.AssociateTransaction.translatedValue;  
      	  		if (creRecord.fields.AssociateEntity.translatedValue)
					associative.entity = creRecord.fields.AssociateEntity.translatedValue;  
      	  		if (creRecord.fields.AssociateCustomRecordType.translatedValue && creRecord.fields.AssociateCustomRecordId.translatedValue) {
					associative.recordtype = creRecord.fields.AssociateCustomRecordType.translatedValue;  
					associative.record = creRecord.fields.AssociateCustomRecordId.translatedValue;        	  			
      	  		}
      	  	} else {
      	  		nlapiLogExecution("DEBUG", func, "Using Default Associations");
      	  		// otherwise try the defaults
    			if (creRecord.CREProfileDataRecordType.substring(0,12) === "customrecord") {
    				associative.recordtype=creRecord.CREProfileDataRecordType;
    				associative.record=creRecord.CREProfileDataRecordID;
    			} 
    			else 
    				if (creRecord.CREProfileDataRecordType.substring(0,8) === "customer" || creRecord.CREProfileDataRecordType.substring(0,6) === "vendor") 
    					associative["entity"]=creRecord.CREProfileDataRecordID;  
    				else 
    					associative[creRecord.CREProfileDataRecordType]=creRecord.CREProfileDataRecordID;        	  		
      	  	}
      	  	      	  	
						
      	  	nlapiLogExecution("DEBUG", func, "Email will get associated as follows: " + JSON.stringify(associative));
      	  
      	  	if (creRecord.fields.BodyMessageIntroduction.translatedValue)
            {
          		//body = "<pre>" + creRecord.fields.BodyMessageIntroduction.translatedValue + "</pre>";
          		body = creRecord.fields.BodyMessageIntroduction.translatedValue;
            }
	        	
      	  	//  do not add Body Template Inline transformation if document Name attachment is requested. Only inline if attachment is not requested. 
			if (!documentName)
			{
			//if documnet name is not specified, inline transformation.
				body = body + creRecord.fields.BodyTemplate.translatedValue;
			}
			        	
			if (!bcc) bcc = null;
			if (!cc) cc = null;
	
			if (file)
				attachmentList.push(file); 
			
			if (fileAttachments) {
				var fileList = fileAttachments.split(/[\D]+/); 
				
				for (i = 0; i < fileList.length; i++)
					if (fileList[i] && !isNaN(fileList[i])) {
						try {
							var f = nlapiLoadFile(fileList[i]); 
							if (f) 
								attachmentList.push(f); 
						} catch (eFile) {
							nlapiLogExecution("ERROR", func, "Unable to load referenced attachment file id " + fileList[i] + ": " + (eFile instanceof nlobjError) ? (eFile.getCode() + " : " + eFile.getDetails() + " : " + eFile.getStackTrace().join(":") + " : " + eFile.getUserEvent()) : (eFile.name + " : " + eFile.message)); 
						}
					}				
			}
			
			nlapiSendEmail(sender, recipient, subject, body, cc, bcc, associative, attachmentList, !ignoreBouncedEmails, CRE_SENDEMAIL_INTERNAL_ONLY, replyTo);
			exeResult.EmailSent = true;
			nlapiLogExecution("DEBUG", func, "CRE Profile " + creRecord.internalid + " sent an email to " + recipient);
			
			retvalue = retvalue + " Email Success.";
			        }
			        else
			        {
			      	  throw nlapiCreateError(func, "Sender: \""+sender+"\", Recipient:\""+recipient+"\" and Subject are required.");
			        }
        //nlapiLogExecution("DEBUG", func + " retvalue", retvalue);
        
        if (!retvalue)
        {
      	  if (creRecord.fields.BodyTemplate.translatedValue)
            {
      		  retvalue = creRecord.fields.BodyTemplate.translatedValue;
            }
      	  else 
            {
      		  throw nlapiCreateError(func, "Transformation not completed.");
            }
        }
        
        this.executeCompletionURLlogic(exeResult);
        
        return retvalue;

    } catch (e) {
    	
		nlapiLogExecution("ERROR", func + ".", (e instanceof nlobjError) ? (e.getCode() + " : " + e.getDetails() + " : " + e.getStackTrace().join(":") + " : " + e.getUserEvent()) : (e.name + " : " + e.message));
        if (e instanceof nlobjError) 
        {
        	var err = e.getCode() + " : " + e.getDetails();
        	exeResult.detail = err;
        	this.executeCompletionURLlogic(exeResult);
        	throw nlapiCreateError(func, err);
        } 
        else 
        {
        	exeResult.detail = e.toString();
        	this.executeCompletionURLlogic(exeResult);
        	throw nlapiCreateError(func, e.toString());
        }
    }
    
    creRecord.RawData.Context = cre_getContextInfo();	//ok to overwrite usage from Translate function (relevant in test suitelet) as Execute function usage is greater
	
	nlapiLogExecution("DEBUG", func + " GOVERNANCE USAGE POINTS", JSON.stringify(creRecord.RawData.Context));
	
    nlapiLogExecution("DEBUG", func, "End");
};




  
  this.initRelatedRecords(record); // initialize only creates structures based on metadata, but does not load records
}

function CREProfile(internalid) {
    "use strict";
    var extendRecord = "CREProfile";
    var creRecord = this;
    var record = new CRERecord(extendRecord, internalid);

    _.extend(creRecord, record);
    _.each(creRecord.fields, function (field) {
    	//nlapiLogExecution("DEBUG", "field", JSON.stringify(field));
        Object.defineProperty(creRecord, field.fieldname, {
            set: function (x) {

                creRecord.fields[field.fieldname].Value = x;
            },
            get: function () {

                return creRecord.fields[field.fieldname].Value;
            }
        });
    });
    
    
    //load the global javascript overrides
    if (GLOBAL_JAVASCRIPT_OVERRIDE){
        var oFile = nlapiLoadFile(GLOBAL_JAVASCRIPT_OVERRIDE);
      	var contents = oFile.getValue();
      	nlapiLogExecution("DEBUG", "built-in override:", contents);
      	eval(contents);
    }

  	//load the profile javascript overrides
    nlapiLogExecution("DEBUG", "creRecord.fields.JavascriptOverrideFileID.Value()", creRecord.fields.JavascriptOverrideFileID.Value);
    if (creRecord.fields.JavascriptOverrideFileID.Value)
    {
    	var oFile = nlapiLoadFile(creRecord.fields.JavascriptOverrideFileID.Value);
  	  	var contents = oFile.getValue();
  	  	nlapiLogExecution("DEBUG", "contents", contents);
  	  	eval(contents);
    	
  	  //nlapiLogExecution("DEBUG", "creRecord.JavaScriptOverride", creRecord.JavaScriptOverride());
    }
}

function CREProfileLine(internalid) {
    "use strict";
    var extendRecord = "CREProfileLine";
    var creProfileLine = this;
    var record = new CRERecord(extendRecord, internalid);

    _.extend(creProfileLine, record);
    _.each(creProfileLine.fields, function (field) {

        Object.defineProperty(creProfileLine, field.fieldname, {
            set: function (x) {

                creProfileLine.fields[field.fieldname].Value = x;
            },
            get: function () {

                return creProfileLine.fields[field.fieldname].Value;
            }
        });
    });
}

function cre_endsWith(str, suffix) {
    "use strict";
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}