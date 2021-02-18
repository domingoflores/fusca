//------------------------------------------------------------------------------------------------------------------------------------
//Purpose: 	the JavaScript Override file allows the developer to enhance the CRE structure for run time
//			execution features.  The goal is to prevent needing to modify the the creCrud.js layer which
//			is the primary engine
//------------------------------------------------------------------------------------------------------------------------------------

// Copyright (C) 2013 Richard Kettlewell
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

function numberToEnglish(n) {
  switch(n) {
  case 0: return "zero";
  case 1: return "one";
  case 2: return "two";
  case 3: return "three";
  case 4: return "four";
  case 5: return "five";
  case 6: return "six";
  case 7: return "seven";
  case 8: return "eight";
  case 9: return "nine";
  case 10: return "ten";
  case 11: return "eleven";
  case 12: return "twelve";
  case 13: return "thirteen";
  case 15: return "fifteen";
  case 18: return "eighteen";
  case 20: return "twenty";
  case 30: return "thirty";
  case 40: return "forty";
  case 50: return "fifty";
  case 80: return "eighty";
  default:
    if(n < 100) {
      if(n < 0)
        return "minus " + numberToEnglish(-n);
      if(n > 10 && n < 20)
        return numberToEnglish(n - 10) + "teen";
      if(n % 10)
        return numberToEnglish(n - n % 10) + " " + numberToEnglish(n % 10);
      return numberToEnglish(n / 10 >> 0) + "ty";
    }
    if(n < 1000) {
      if(n % 100 == 0) {
        return numberToEnglish(n / 100 >> 0) + " hundred";
      } else {
        //return numberToEnglish(n / 100 >> 0) + " hundred and " + numberToEnglish(n % 100);
    	  return numberToEnglish(n / 100 >> 0) + " hundred " + numberToEnglish(n % 100);
      }
    }
    if(n < 1000000) {
      if(n % 1000 == 0) {
        return numberToEnglish(n / 1000 >> 0) + " thousand";
      } else if(n % 1000 < 100) {
        //return numberToEnglish(n - n % 1000) + " and " + numberToEnglish(n % 1000);
        return numberToEnglish(n - n % 1000) + " " + numberToEnglish(n % 1000);
      } else {
        return numberToEnglish(n - n % 1000 >> 0) + " " + numberToEnglish(n % 1000); 
      }
    } 
    //Marko Obradovic: Adding handling for over 1 million, but less than 1 billion 
    if(n < 1000000000) 
    {
    	if(n % 1000000 == 0) 
    	{
    		return numberToEnglish(n / 1000000 >> 0) + " million";
    	} 
    	else if(n % 1000000 < 100000) 
    	{
    		//return numberToEnglish(n - n % 1000) + " and " + numberToEnglish(n % 1000);
    		return numberToEnglish(n - n % 1000000) + " " + numberToEnglish(n % 1000000);
    	} 
    	else 
    	{
    		return numberToEnglish(n - n % 1000000 >> 0) + " " + numberToEnglish(n % 1000000); 
    	}
    } 
    else
      return n;
    break;
  }
}



function toTitleCase(str) {
	try
	{
	    return str.replace(
	        /\w\S*/g,
	        function(txt) {
	            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	        }
	    );
	} 
	catch (e)
	{
		throw nlapiCreateError("SRS_TO_TITLE_CASE_ERROR", e.toString());
	}
}
if (!String.prototype.amountToEnglish) 
{
	String.prototype.amountToEnglish = function (amount)
	{
		try
		{
			var cents = Math.floor((amount-Math.floor(amount))*100+0.5);
			//var centstring = (cents < 10) ? "0"+cents.toString() : cents.toString();
			var centstring = cents.toString();
			var dollarstring = numberToEnglish(Math.floor(amount));
			
			var retValue = dollarstring.charAt(0).toUpperCase() + dollarstring.substr(1) + " and " + centstring + "/100";
			return toTitleCase(retValue);
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_AMOUNT_TO_ENGLISH_ERROR", e.toString());
		}
	};
}
if (!String.prototype.padAmount) 
{
	String.prototype.padAmount = function (amount)
	{
		try
		{
			var pad = "";
			
			if (Math.floor(amount)<10)
			{
				pad = "****";
			}
			else if (Math.floor(amount)<100)
			{
				pad = "***";
			}
			else if (Math.floor(amount)<1000)
			{
				pad = "**";
			}
			else if (Math.floor(amount)<10000)
			{
				pad = "*";
			}
			return pad  + amount.toString();
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_PAD_AMOUNT_ERROR", e.toString());
		}
	};
}

this.additionalFilters = function (profileline_recordName) {
	try
	{
	    creRecord = this;
	    var filters = [];
	    if (profileline_recordName) {
	        switch(profileline_recordName) {
	            case "CUSTOMERREFUNDS":
	            	var listIds = creRecord.RawData.PFC.custrecord_pay_file_tran_sequence_list
	            	if (listIds) {
	            		var objIds = JSON.parse(listIds);
	                	filters.push (new nlobjSearchFilter("internalid", null, "ANYOF", objIds ) );
	            	}
	                break;
	        }
	    }
		return filters;
	} 
	catch (e)
	{
		throw nlapiCreateError("SRS_ADDITIONAL_FILTERS_ERROR", e.toString());
	}
};
if (!String.prototype.formatMultiLineText) 
{
	String.prototype.formatMultiLineText = function(text)
	{
		try
		{
			nlapiLogExecution("audit", "multiline text", text);
			var retValue = text.replace(/\n/g, "</span></p><p class=\"c38\"><span class=\"c2\">" );
			retValue = "<p class=\"c38\"><span class=\"c2\">" + retValue + "</span></p>";
			nlapiLogExecution("audit", "retValue", retValue);
			return retValue;
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_FORMAT_MULTILINE_TEXT_ERROR", e.toString());
		}
	};
}
if (!String.prototype.getFileBase64Contents) 
{
	String.prototype.getFileBase64Contents = function(fileid)
	{
		try
		{
			var file = null;
			var retValue = "";
			nlapiLogExecution("audit", "fileid", fileid);
			if (!fileid)
			{
				if (creRecord.RawData.signatureFile)
				{
					file = nlapiLoadFile(creRecord.RawData.signatureFile);
					retValue = file.getValue();
				}
				else 
				{
					retValue = "[ERROR: Signature File Internal ID not provided...";
					creRecord.RawData.Errors.push(retValue);
				}
			}
			else 
			{
				file = nlapiLoadFile(fileid);
				retValue = file.getValue();
			}
			return retValue;
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_GET_FILE_BASE64_CONTENTS_ERROR", e.toString());
		}
	};
}

if (!String.prototype.checkReasonablePaymentAmount) 
{
	String.prototype.checkReasonablePaymentAmount = function(amount,max)
	{
		try
		{
			var value = "";
			if (isNaN(parseFloat(amount)))
			{
				value = "[ERROR: fxamount not provided ...";
				creRecord.RawData.Errors.push(value);
			}
			if (isNaN(parseFloat(max)))
			{
				value = "[ERROR: max amount not provided ...";
				creRecord.RawData.Errors.push(value);
			}
			if (parseFloat(amount)>parseFloat(max))
			{
				value = "[ERROR: UNREASONABLE AMOUNT FOR PAYMENT: " +parseFloat(amount)+ " is over max: " + parseFloat(max) + "...";
				creRecord.RawData.Errors.push(value);
			}
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_CHECK_REASONALBE_PAYEMNT_AMOUNT_ERROR", e.toString());
		}
	};
}

if (!String.prototype.addError) 
{
	String.prototype.addError = function(msg)
	{
		try
		{
			if (msg)
			{
				var Value = "[ERROR: " + msg + "...";
				creRecord.RawData.Errors.push(Value);
			}
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_ADD_ERROR_ERROR", e.toString());
		}
	};
}

if (!String.prototype.formatDateMMDDYYYY) 
{
	String.prototype.formatDateMMDDYYYY = function(dateString) 
	{
		try
		{
			var MyDate = new Date(dateString);
			return ("0" + (MyDate.getMonth()+1)).slice(-2) + "/" + ("0" + MyDate.getDate()).slice(-2) + "/" + MyDate.getFullYear();
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_FORMAT_DATE_MMDDYYY_ERROR", e.toString());
		}
	};
}
if (!String.prototype.payToAddress) 
{
	String.prototype.payToAddress = function()
	{
		try
		{
			if (!(creRecord 
				&& creRecord.RawData
				&& creRecord.RawData.CUSTOMERREFUNDS
				&& creRecord.RawData.CUSTOMERREFUNDS[0]))
			{
				return "";
			}
			var template = "<$attention$>\n<$addressee$>\n<$address1$>\n<$address2$>\n<$address3$>\n<$city$> <$state$> <$zip$>\n<$country$>";
			  var val = "";
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.Payee.value||"";
			  template = template.replace("<$attention$>", val);
			  
			  if ((val.trim() !== (creRecord.RawData.CUSTOMERREFUNDS[0].columns.MailTo.value||"").trim()))
			  {
				  //if addressee and attention are the same, use just one of them. 
				  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.MailTo.value||"";
				  template = template.replace("<$addressee$>", val);
			  }
			  val = conf.getFieldValue("phone")||"";
			  template = template.replace("<$phone$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.Address1.value||"";
			  //nlapiLogExecution("audit", "address1", conf.getFieldValue("address1"));
			  template = template.replace("<$address1$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.Address2.value||"";
			  template = template.replace("<$address2$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.Address3.value||"";
			  template = template.replace("<$address3$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.City.value||"";
			  template = template.replace("<$city$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.State.value||"";
			  template = template.replace("<$state$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.PostalCode.value||"";
			  template = template.replace("<$zip$>", val);
			  
			  val = creRecord.RawData.CUSTOMERREFUNDS[0].columns.Country.value||"";
			  
			  template = template.replace("<$country$>", val);
			  template = template.replace(/<\$.*?\$>/g, "");
			  template = template.replace(/(\n){2}/g, "\n");
			  template = template.replace(/\n\s*/g, "\n");
			  return template.trim();
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_PAY_TO_ADDRESS_ERROR", e.toString());
		}
	};
}
function formatAddressText(conf)
{
	try
	{
	  var template = "<$attention$>\n<$addressee$>\n<$address1$>\n<$address2$>\n<$address3$>\n<$city$> <$state$> <$zip$>\n<$country$>";
	  var val = "";
	  val = conf.getFieldValue("attention")||"";
	  template = template.replace("<$attention$>", val);
	  val = conf.getFieldValue("addressee")||"";
	  template = template.replace("<$addressee$>", val);
	  val = conf.getFieldValue("phone")||"";
	  template = template.replace("<$phone$>", val);
	  val = conf.getFieldValue("address1")||"";
	  //nlapiLogExecution("audit", "address1", conf.getFieldValue("address1"));
	  
	  template = template.replace("<$address1$>", val);
	  val = conf.getFieldValue("address2")||"";
	  template = template.replace("<$address2$>", val);
	  val = conf.getFieldValue("address3")||"";
	  template = template.replace("<$address3$>", val);
	  val = conf.getFieldValue("city")||"";
	  template = template.replace("<$city$>", val);
	  val = conf.getFieldValue("state")||"";
	  template = template.replace("<$state$>", val);
	  val = conf.getFieldValue("zip")||"";
	  template = template.replace("<$zip$>", val);
	  val = conf.getFieldText("country")||"";
	  template = template.replace("<$country$>", val);
	  template = template.replace(/<\$.*?\$>/g, "");
	  template = template.replace(/(\n){2}/g, "\n");
	  template = template.replace(/\n\s*/g, "\n");
	  
	  
	  return template.trim();
	} 
	catch (e)
	{
		throw nlapiCreateError("SRS_FORMAT_ADDRESS_TEXT_ERROR", e.toString());
	}
}

if (creRecord.RawData)
{
	nlapiLogExecution("audit", "payment bank");
	//Answer Id: 10248
	var conf = nlapiLoadConfiguration("companyinformation");
	
	var company_addressfields = [
	        	                     "attention","addressee","phone","address1","address2","address3","city","state","zip","country",
	        	                     "returnattention","returnaddressee","returnphone","returnaddress1","returnaddress2","returnaddress3","returncity","returnstate","returnzip","returncountry",
	        	                     "shippingattention","shippingaddressee","shippingphone","shippingaddress1","shippingaddress2","shippingaddress3","shippingcity","shippingstate","shippingzip","shippingcountry"
	        	                     ];
	creRecord.RawData["conf_comp_info"] = {};
	var field = null;
	for (field in company_addressfields) 
	{
		if (company_addressfields.hasOwnProperty(field)) 
		{
			creRecord.RawData["conf_comp_info"][company_addressfields[field]] = conf.getFieldValue(company_addressfields[field]);
			if (conf.getFieldText(company_addressfields[field]))
			{
				creRecord.RawData["conf_comp_info"][company_addressfields[field]+"_text"] = conf.getFieldText(company_addressfields[field]);
			}
		}
	}
	creRecord.RawData["conf_comp_info"]["addrtext"] = formatAddressText(conf);
	
}
if (!Number.prototype.numberWithCommas) {
	Number.prototype.numberWithCommas = function()
	{
		try
		{
			return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_NUMBER_WITH_COMMAS_ERROR", e.toString());
		}
	};
}


if (creRecord.RawData && (typeof creRecord.RawData.data_in === "undefined"))
{
	creRecord.RawData.data_in = {};
    creRecord.RawData.data_in["constants"] = {};
    creRecord.RawData.data_in["constants"]["PFT Account Options"] = {};
    creRecord.RawData.data_in["constants"]["PFT Account Options"]["Uses Omnibus Account"] = 1;
    creRecord.RawData.data_in["constants"]["PFT Account Options"]["GL Account Selection Required"] = 2;
}

var modifiers = {
		"escapeAmpersand" : function(str){
			return str.replace(/&/g, "&amp;");
		}
	};


if (creRecord.RawData)
{
	creRecord.RawData["pad_position"] = {
		"left" : 1,
		"right" : 2
	};
	
	creRecord.RawData["field_lengths"] = {
			"column1" : 12,
			"column2" : 20,
			"column3" : 11,
			"column4" : 1,
			"column5" : 20
		};
	
	if (modifiers)
	{
		creRecord.RawData._MODIFIERS = modifiers;
	}
	creRecord.RawData.Errors = [];
}

//pads left or pads right
//"".formatted_string("0000",123,pad_position.left);	-->	0123
//"".formatted_string("00000000",123,pad_position.right);	-->	12300000
String.prototype.formatted_string = function(pad, user_str, pad_pos)
{
	try
	{
		//we may need to enhance this function to automatically pad left or right based on alphanumeric string 
		var padleft = 1;
		var padright = 2;
		if (typeof user_str === "undefined")
		{ 
	  	return pad;
		}
		if (pad_pos === padleft)
	  {
	  	return (pad + user_str).slice(-pad.length);
	  }
		
		if (pad_pos === padright)
	  {
	  	return (user_str + pad).substring(0, pad.length);
	  }
	} 
	catch (e)
	{
		throw nlapiCreateError("SRS_FORMATTED_STRING_ERROR", e.toString());
	}
};

//produces empty string with length	
//var debugmode = true;
//"".createbuffer(10) -->	"##########"
//
String.prototype.createbuffer = function (len, character)
{
	try
	{
		var retvalue = "";
		var i = 0;
		if (!character)
		{
			character = " "; //default spacer is single space
		}
		if (!len)
		{
			return;
		}
		for (i = 0; i < len; i+=1)
		{
			retvalue += character;
		}
		return retvalue;
	} 
	catch (e)
	{
		throw nlapiCreateError("SRS_CREATE_BUFFER_ERROR", e.toString());
	}
};

if (!String.prototype.checkForErrorMessage) 
{
	String.prototype.checkForErrorMessage = function() 
	{
		try
		{
			nlapiLogExecution("audit", "creRecord.RawData.Errors.length", creRecord.RawData.Errors.length);
			if (creRecord.RawData.Errors.length>0)
			{
				return creRecord.RawData.Errors.join("<br/>");
			}
			return "";
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_CHECK_FOR_ERRORS_MESSAGE_ERROR", e.toString());
		}
	};
}
if (!String.prototype.renderVoidImage) 
{
	String.prototype.renderVoidImage = function() 
	{
		var voidimage = "<img vertical-align=\"top\" ALIGN=\"right\" width=\"200\" height=\"65\" border=\"0\" src=\"data:image/png;base64,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\"/>";
		try
		{
			nlapiLogExecution("audit", "creRecord.RawData.Errors.length", creRecord.RawData.Errors.length);
			if (creRecord.RawData.Errors.length>0)
			{
				return voidimage;
			}
			if(String(nlapiGetContext().getEnvironment()) !== "PRODUCTION")
		    {
				return voidimage;
		    }
			return "";
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_RENDER_VOID_IMAGE_ERROR", e.toString());
		}
	};
}

if (!String.prototype.getNonProductionSignature) 
{
	String.prototype.getNonProductionSignature = function() 
	{
		try
		{
			if(String(nlapiGetContext().getEnvironment()) !== "PRODUCTION")
		    {
				return "SIGNATURE FILE " + creRecord.RawData.signatureFile + " NOT DISPLAYED IN " + nlapiGetContext().getEnvironment();
		    }
		} 
		catch (e)
		{
			throw nlapiCreateError("SRS_GET_NON_PRODUCTION_SIGNATURE_ERROR", e.toString());
		}
	};
}
