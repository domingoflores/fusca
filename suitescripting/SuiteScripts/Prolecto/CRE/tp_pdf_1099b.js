var modifiers = {
		"numbersWithCommas": function(num){
			return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		},
		"formatDateMMDDYYYY": function(dateString){
			var MyDate = new Date(dateString);
			return ("0" + (MyDate.getMonth()+1)).slice(-2) + "/" + ("0" + MyDate.getDate()).slice(-2) + "/" + MyDate.getFullYear();
		},
		"escapeAmpersand" : function(str){
			return (str && str.replace(/&/g, "&amp;"))||"";
		},
		"removeNonDigits" : function(str){
			return (str && str.replace(/\D/g, ""))||"";
		},
		"formatFileName" : function(str)
		{
			var retValue = "";
			if (str)
			{
				str = str.replace(/[^0-9a-zA-Z]/g, " ");
				str = str.trim();
				retValue = str.replace(/\s+/g, " ");
			}
			return retValue;
		},
		"payToAddress" : function (addressee, attention, address1, address2, address3, city, state, zip, country, phone)
		{
			var template = "<$attention$>\n<$addressee$>\n<$address1$>\n<$address2$>\n<$address3$>\n<$city$> <$state$> <$zip$>\n<$country$>";
			var val = "";
			val = attention||"";
			template = template.replace("<$attention$>", val);
			  
			if ((val.trim() !== (addressee||"").trim()))
			{
				//if addressee and attention are the same, use just one of them. 
				val = addressee||"";
				template = template.replace("<$addressee$>", val);
			}
			val = phone;
			template = template.replace("<$phone$>", val);
		  
				val = address1||"";
			//nlapiLogExecution("debug", "address1", conf.getFieldValue("address1"));
			template = template.replace("<$address1$>", val);
		  
				val = address2||"";
			template = template.replace("<$address2$>", val);
		  
				val = address3||"";
			template = template.replace("<$address3$>", val);
		  
				val = city||"";
			template = template.replace("<$city$>", val);
		  
				val = state||"";
			template = template.replace("<$state$>", val);
		  
				val = zip||"";
			template = template.replace("<$zip$>", val);
		  
				val = country||"";
		  
				template = template.replace("<$country$>", val);
			template = template.replace(/<\$.*?\$>/g, "");
			template = template.replace(/(\n){2}/g, "\n");
			template = template.replace(/\n\s*/g, "\n");
			return template.trim();
		},
		"formatMultiLineText" : function(str){
			nlapiLogExecution("debug", "multiline text", str);
			return (str && str.replace(/\n/g, "<br/>" )) || "";
		},
		"applyMaskShowLastFour" : function(str)
		{
			var retValue = "";
			if (str)
			{
				var showCharacters = 4;
				var strToMask = str.substring(0, str.length-showCharacters);
				var remain = str.substring(str.length-showCharacters, str.length);
				retValue = (strToMask && strToMask.replace(/[0-9]/g, "*") + remain) || "";
			}
			return retValue;
		}
		
	};
if (creRecord.RawData)
{
	if (modifiers)
	{
		creRecord.RawData._MODIFIERS = modifiers;
	}
	creRecord.RawData.Errors = [];
	
	creRecord.RawData.constants = {};
    creRecord.RawData["constants"] = {};
    creRecord.RawData["constants"]["Form Version"] = {};
    creRecord.RawData["constants"]["Form Version"]["Original"] = 1;
    creRecord.RawData["constants"]["Form Version"]["Revised"] = 2;
    creRecord.RawData["constants"]["Form Version"]["Corrected"] = 3;
    creRecord.RawData["constants"]["Is Covered"] = {};
    creRecord.RawData["constants"]["Is Covered"]["Yes"] = 1;
    creRecord.RawData["constants"]["Is Covered"]["No"] = 2;
    creRecord.RawData["constants"]["Delivery Type"] = {};
    creRecord.RawData["constants"]["Delivery Type"]["E-Mail"] = 1;
    creRecord.RawData["constants"]["Delivery Type"]["Mail"] = 2;
    creRecord.RawData["constants"]["IRS Correction Type"] = {};
    creRecord.RawData["constants"]["IRS Correction Type"]["Type 1"] = 1;
    creRecord.RawData["constants"]["IRS Correction Type"]["Type 2"] = 2;
	
}

String.prototype.isCorrected = function(formversion, correctionType) 
{
	var retValue = false;
	if ((parseInt(formversion,10)=== parseInt(creRecord.RawData["constants"]["Form Version"]["Corrected"],10))
	&& (parseInt(correctionType,10)===parseInt(creRecord.RawData["constants"]["IRS Correction Type"]["Type 1"],10)))
	{
		retValue = true;
	}
	return retValue;
	
};
String.prototype.isShortTermGain = function(CoveredSecurity, AcquisitionDate,ClosingDate)
{
	var retValue = false;
	var year = 365; //days
	if (parseInt(CoveredSecurity,10)===parseInt(creRecord.RawData["constants"]["Is Covered"]["Yes"],10))
	{
		if (AcquisitionDate && ClosingDate)
		{
			var dAcquisitionDate = new Date(AcquisitionDate);
			var dClosingDate = new Date(ClosingDate);
			var Difference_In_Time = dClosingDate.getTime() - dAcquisitionDate.getTime(); 
			var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
			
			if (Difference_In_Days<=year)
			{
				retValue = true;
			}
		}
	}
	return retValue;
	
};
String.prototype.isLongTermGain = function(CoveredSecurity, AcquisitionDate,ClosingDate)
{
	var retValue = false;
	var year = 365; //days
	if (parseInt(CoveredSecurity,10)===parseInt(creRecord.RawData["constants"]["Is Covered"]["Yes"],10))
	{
		if (AcquisitionDate && ClosingDate)
		{
			var dAcquisitionDate = new Date(AcquisitionDate);
			var dClosingDate = new Date(ClosingDate);
			var Difference_In_Time = dClosingDate.getTime() - dAcquisitionDate.getTime(); 
			var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
			
			if (Difference_In_Days>year)
			{
				retValue = true;
			}
		}
	}
	return retValue;
};
String.prototype.passwordProtect = function() 
{
	var retValue = true; //default, always password protect 
//	if(String(nlapiGetContext().getEnvironment()) !== "PRODUCTION")
//    {
//		//remove passwords in sandbox 
//		retValue = false;
//    }
	if (parseInt(creRecord.RawData["passwordProtect"],10)===0)
	{
		//if 0 is passed in, default password protection is disabled 
		retValue = false;
	}
	return retValue;
	
};
String.prototype.checkForErrorMessage = function() 
{
	if (creRecord.RawData.Errors && creRecord.RawData.Errors.length>0)
	{
		nlapiLogExecution("debug", "creRecord.RawData.Errors.length", creRecord.RawData.Errors.length);
		return creRecord.RawData.Errors.join("<br/>");
	}
	return "";
	
};

String.prototype.addError = function(msg)
{
	if (msg)
	{
		if (creRecord.RawData.Errors)
		{
			creRecord.RawData.Errors.push(msg);
		}
	}
};