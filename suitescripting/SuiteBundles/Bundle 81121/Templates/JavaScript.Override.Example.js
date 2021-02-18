//------------------------------------------------------------------------------------------------------------------------------------
//Purpose: 	the JavaScript Override file allows the developer to enhance the CRE structure for run time
//			execution features.  The goal is to prevent needing to modify the the creCrud.js layer which
//			is the primary engine
//------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------
//Example #1
//Function:		this.additionalFilters
//Parameters:   - Automatically passed in.  
//              - Parameter value: CRE Profile Line "Child Key Field"
//              - Each Child Key Field will be passed into this function

//Description:	 additionalFilters is predefined function that will be called during execution, if defined. 
//                       This function allows you to specify additional filters for each CRE Profile Line definition. 
//                       affording you more control over the underlying query / linking mechnanism
//                       Usage: 
//                       1. Follow pattern to define new case statement (as many as Profile Lines defined)
//                       2. Profile Line "recordName" is case value as it is a key to the profile line that is unique
//                       3. new nlobjSearchFilter(s) need to be pushed into array
//                       Note: Path to entire JSON structure is located here: creRecord.RawData["Your Record Name"]...
//------------------------------------------------------------------------------------------------------------------------------------
this.additionalFilters = function (profileline_recordName)
{
    creRecord = this;
    var filters = [];
    if (profileline_recordName)
    {
        switch(profileline_recordName) {
            case "entity":
                  filters.push (new nlobjSearchFilter('mainline', null, 'is', 'T'));
                  break;
            case "agg":
                  filters.push (new nlobjSearchFilter('amount', null, 'greaterthan', 1000000));
                  break;
            case "custitem_product_line":
                  // filters.push (new nlobjSearchFilter('pricelevel', 'pricing', 'anyof', creRecord.RawData.PRICEBOOK_REQUEST.custrecord_pricebook_request_pricelv.internalid));
                  break;
          }
    }
return filters;
};

//------------------------------------------------------------------------------------------------------------------------------------
//Example #2a
//Function: 					numberWithCommas
//Description:					Create new functions by extending JavaScript. 
//Usage in TrimPath:            ${summaries[0].columns.amount.numberWithCommas()} 
//------------------------------------------------------------------------------------------------------------------------------------
Number.prototype.numberWithCommas = function(){
	 return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
 };

//------------------------------------------------------------------------------------------------------------------------------------
//Example #2b
//Function: 					br, commas and words
//Description:					Create new functions and extend TrimPath Modifiers 
//Usage in TrimPath:            ${summaries[0].columns.amount|words} 
//Reference:					http://www.summitdowntown.org/site_media/media/javascript/private/trimpath-template-docs/JavaScriptTemplateModifiers.html
//------------------------------------------------------------------------------------------------------------------------------------

//define a JST modifier for our special handling
var modifiers = {
	"br" : function(str){
		return str.replace(/\n/g, '<br />');
	},
	"words" : toWords,
	"commas": Commas
};

function Commas(x){
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};

//Convert numbers to words
//copyright 25th July 2006, by Stephen Chapman http://javascript.about.com
//permission to use this Javascript on your web page is granted
//provided that all of the code (including this copyright notice) is
//used exactly as shown (you can change the numbering system if you wish)
function toWords(s){
	//American Numbering System
	var th = ['','thousand','million', 'billion','trillion'];
	
	//uncomment this line for English Number System
	//var th = ['','thousand','million', 'milliard','billion'];

	var dg = ['zero','one','two','three','four', 'five','six','seven','eight','nine']; 
	var tn = ['ten','eleven','twelve','thirteen', 'fourteen','fifteen','sixteen', 'seventeen','eighteen','nineteen']; 
	var tw = ['twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety']; 
	
	s = s.toString(); 
	s = s.replace(/[\, ]/g,''); 
	if (s != parseFloat(s)) return 'not a number'; 
	var x = s.indexOf('.'); if (x == -1) x = s.length; 	if (x > 15) return 'too big'; 
	var n = s.split(''); var str = ''; 	var sk = 0; 
	for (var i=0; i < x; i++) {if ((x-i)%3==2) {if (n[i] == '1') {str += tn[Number(n[i+1])] + ' '; i++; sk=1;} else if (n[i]!=0) {str += tw[n[i]-2] + ' ';sk=1;}} else if (n[i]!=0) {str += dg[n[i]] +' '; if ((x-i)%3==0) str += 'hundred ';sk=1;} if ((x-i)%3==1) {if (sk) str += th[(x-i-1)/3] + ' ';sk=0;}} if (x != s.length) {var y = s.length; str += 'point '; for (var i=x+1; i<y; i++) str += dg[n[i]] +' ';} return str.replace(/\s+/g,' ');
};

//here, we inject the Modifiers into the structure which TrimPath expects as a hook point "_MODIFIERS"
this.RawData._MODIFIERS = modifiers;



//------------------------------------------------------------------------------------------------------------------------------------
//Example #3
//Function:		this.javaScriptOverride
//Description:	javaScriptOverride is predefined function that will be called during execution, 
//				prior to data transformation. It gives opportunity to manipulate data; for example, sort. 
//				This example shows how to sort JSON by any columns. The result is then available to your
//				template for simple output
//------------------------------------------------------------------------------------------------------------------------------------
this.javaScriptOverride = function ()
{
	creRecord = this;  //required

	firstBy = (function() 
	{
    	function makeCompareFunction(f, direction)
		{
      		if(typeof(f)!=="function")
			{
        		var prop = f;
        		f = function(v1,v2){return v1[prop] < v2[prop] ? -1 : (v1[prop] > v2[prop] ? 1 : 0);};
      		}
      		if(f.length === 1) 
			{
        		// f is a unary function mapping a single item to its sort score
        		var uf = f;
        		f = function(v1,v2) {return uf(v1) < uf(v2) ? -1 : (uf(v1) > uf(v2) ? 1 : 0);};
      		}
      		if(direction === -1){return function(v1,v2){return -f(v1,v2);};}
      		return f;
    	}
    	/* mixin for the `thenBy` property */
    	function extend(f, d) 
		{
      		f=makeCompareFunction(f, d);
      		f.thenBy = tb;
      		return f;
    	}

    	/* adds a secondary compare function to the target function (`this` context)
       	which is applied in case the first one returns 0 (equal)
       	returns a new compare function, which has a `thenBy` method as well */
    	function tb(y, d) 
		{
	        var x = this;
        	y = makeCompareFunction(y, d);
        	return extend(function(a, b) {
            	return x(a,b) || y(a,b);
        	});
    	}
    	return extend;
	})();

	//here, we are working on the PRODUCTS node
	if (creRecord.RawData && creRecord.RawData.PRODUCTS)
	{
   		//nlapiLogExecution("AUDIT", "data ", JSON.stringify(creRecord.RawData));
		creRecord.RawData.PRODUCTS.forEach(function(el) 
		{
		
			//hardware model rules 
			if (!el.columns.custitem_ewn_hwmodel)
			{
				el.columns.custitem_ewn_hwmodel = {};
				el.columns.custitem_ewn_hwmodel.numericValue = "9999";
				el.columns.custitem_ewn_hwmodel.Display = "";
				el.columns.custitem_ewn_hwmodel.name = "";
			}
			else
			{
				if (isNaN(el.columns.custitem_ewn_hwmodel.name))
				{
					var firstChar = el.columns.custitem_ewn_hwmodel.name.match("[a-zA-Z]");
					var index = el.columns.custitem_ewn_hwmodel.name.indexOf(firstChar);
					if (index === 0)
					{
						el.columns.custitem_ewn_hwmodel.numericValue = "9999";
					}
					else		
					{
						el.columns.custitem_ewn_hwmodel.numericValue = el.columns.custitem_ewn_hwmodel.name.substring(0,index);
					}
					el.columns.custitem_ewn_hwmodel.Display = el.columns.custitem_ewn_hwmodel.name;
				}
				else
				{
					el.columns.custitem_ewn_hwmodel.numericValue = el.columns.custitem_ewn_hwmodel.name;
					el.columns.custitem_ewn_hwmodel.Display = el.columns.custitem_ewn_hwmodel.name;
				}
			}
		});

		creRecord.RawData.PRODUCTS.sort(
		firstBy(function (v) { return v.columns.HWModelEOS.value;})	
		.thenBy(function (v) { return v.columns.custitem_ewn_hwmodel.numericValue;})	
		.thenBy(function (v) { return v.columns.NumericCode.value;})	
		.thenBy(function (v) { return v.columns.custitem_ewn_prod_raw_material_type.name;},-1)	
		.thenBy(function (v) { return v.columns.T1Ports.value;})	
		.thenBy(function (v) { return v.columns.SIP.value;})	
        .thenBy(function (v) { return v.columns.LicenseKeyType.value;})	
		.thenBy(function (v) { return parseInt(v.columns.WANCalls.value, 10);})	
		);
	} 

};

//------------------------------------------------------------------------------------------------------------------------------------
//Example #4
//Function:      
//Parameters:  
//Description:	 Add Custom values to JSON for usage in Trimpath Template;
//------------------------------------------------------------------------------------------------------------------------------------

if (creRecord.RawData && creRecord.RawData.syntheticCompanyFields)
{
       creRecord.RawData.Environment = String(creRecord.RawData.syntheticCompanyFields.loginURL).indexOf('sandbox')>0 ? 'SANDBOX' : 'PRODUCTION';
}
//------------------------------------------------------------------------------------------------------------------------------------
//Example #5
//Function:      
//Parameters:  
//Description:	 Custom Function, call from trimpath like this: ${_.myFunction()}
//------------------------------------------------------------------------------------------------------------------------------------
_.myFunction = function(){
	 return "HELLO";
 };

var i = 3;
i++;
creRecord.RawData["i"] = i;

creRecord.RawData.Environment = (nlapiGetContext().getExecutionContext() === "suitelet") ? "SUITELET" : nlapiGetContext().getExecutionContext();