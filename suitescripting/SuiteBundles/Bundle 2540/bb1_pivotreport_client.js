function Client_Form_PageInit()
{
BuildSettings(true);
}


function Client_Form_SaveRecord()
{
nlapiSetFieldValue("custrecord_pt_columns",ListText("custpage_columns"));
nlapiSetFieldValue("custrecord_pt_rows",ListText("custpage_rows"));
nlapiSetFieldValue("custrecord_pt_pages",ListText("custpage_pages"));
nlapiSetFieldValue("custrecord_pt_data",ListText("custpage_data"));
return true;
}


function ListText(fld)
{
return nlapiGetFieldText(fld).split(String.fromCharCode(5)).join(", "); // .split.join is fix for 2009.1 AG 30-Mar-09
}


function Client_Form_FieldChanged(type,name)
{
if (name=="custrecord_pt_savedsearch") BuildSettings(false);
}


function BuildSettings(doselect)
{
DisableSettings(true);

if (!doselect)
	{
	nlapiSetFieldValue("custrecord_pt_columns","");
	nlapiSetFieldValue("custrecord_pt_rows","");
	nlapiSetFieldValue("custrecord_pt_pages","");
	nlapiSetFieldValue("custrecord_pt_data","");
	}

nlapiRemoveSelectOption("custpage_columns",null); // empty all list fields
nlapiRemoveSelectOption("custpage_rows",null);
nlapiRemoveSelectOption("custpage_pages",null);
nlapiRemoveSelectOption("custpage_data",null);

var searchid=nlapiGetFieldValue("custrecord_pt_savedsearch");
if (searchid=="") return;

var el=document.getElementById("loadstatus");
el.innerHTML="Please wait - loading search results...";

try
	{
	var csvpage=nlapiRequestURL(
		"https://"+document.location.host+"/app/common/search/searchresults.nl?csv=Export&searchid="+searchid);
	}
catch(err)
	{
	el.innerHTML="&nbsp;";
	return;
	}

el.innerHTML="&nbsp;";
var headers=CSVToArray(csvpage.getBody())[0];

for(var i in headers) // build lists
	{
	nlapiInsertSelectOption("custpage_columns",i,headers[i],false);
	nlapiInsertSelectOption("custpage_rows",i,headers[i],false);
	nlapiInsertSelectOption("custpage_pages",i,headers[i],false);
	nlapiInsertSelectOption("custpage_data",i,headers[i],false);
	}

if (doselect)
	{
	SelectValues("custpage_columns","custrecord_pt_columns",headers);
	SelectValues("custpage_rows","custrecord_pt_rows",headers);
	SelectValues("custpage_pages","custrecord_pt_pages",headers);
	nlapiSetFieldText("custpage_data",nlapiGetFieldValue("custrecord_pt_data"));
	}
		
DisableSettings(false);		
}


function DisableSettings(status)
{
nlapiDisableField("custpage_data",status);
nlapiDisableField("custpage_columns",status);
nlapiDisableField("custpage_rows",status);
nlapiDisableField("custpage_pages",status);
}


function TextToIndexes(t,values)
{
if (!t) return [];

var d=t.split(", ");
var v=[];
for(var i in d) 
	{
	var p=ArrayIndexOf(values,d[i]);
	if (p>-1) v.push(p);
	}

return v;
}


function SelectValues(fld,src,values)
{
var v=TextToIndexes(nlapiGetFieldValue(src),values);
try
	{ nlapiSetFieldValues(fld,v); }
catch(err)
	{ nlapiSetFieldValue(fld,v); } // fix for 2009.1 AG 30-Mar-09
}


function CSVToArray(csvstring)
{
var i, s, table = [], a = csvstring.split(/\r*\n/);

var pattern = new RegExp("(^|\\t|,)(\"*|'*)(.*?)\\2(?=,|\\t|$)", "g");

for (i=0; i<a.length; i++) {
	s = a[i].replace(/""/g, "'");
	s = s.replace(pattern, "$3\t");
	s = s.replace(/\t(?=\t)/g, "\t "); //replace empty cells with spaces
	s = s.replace(/\t$/, "");
	if (s) {table[i] = s.split("\t")}
	}
	
return table;
}


function ArrayIndexOf(a,v)
{
for(var i in a) if (a[i]==v) return i;
return -1;
}