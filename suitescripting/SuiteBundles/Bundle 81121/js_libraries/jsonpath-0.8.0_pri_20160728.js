/* JSONPath 0.8.0 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 * 
 * 20150808 MO: Modified for CRE Engine
 */
function isValidKey(key)
  {
	  //key=escape_special_characters(key);
	  var func="isValidKey";
	  switch(key) 
	  {
		  case "abstract":
		  case "arguments":
		  case "boolean":
		  case "break":
		  case "byte":
		  case "case":
		  case "catch":
		  case "char":
		  case "class":
		  case "const":
		  case "continue":
		  case "debugger":
		  case "default":
		  case "delete":
		  case "do":
		  case "double":
		  case "else":
		  case "enum":
		  case "export":
		  case "extends":
		  case "false":
		  case "final":
		  case "finally":
		  case "float":
		  case "for":
		  case "function":
		  case "goto":
		  case "if":
		  case "implements":
		  case "import":
		  case "in":
		  case "instanceof":
		  case "int":
		  case "interface":
		  case "let":
		  case "long":
		  case "native":
		  case "new":
		  case "null":
		  case "package":
		  case "private":
		  case "protected":
		  case "public":
		  case "return":
		  case "short":
		  case "static":
		  case "super":
		  case "switch":
		  case "synchronized":
		  case "this":
		  case "throw":
		  case "throws":
		  case "transient":
		  case "true":
		  case "try":
		  case "typeof":
		  case "var":
		  case "void":
		  case "volatile":
		  case "while":
		  case "with":
		  case "yield":
		  case "Array":
		  case "Date":
		  case "eval":
		  case "hasOwnProperty":
		  case "Infinity":
		  case "isFinite":
		  case "isNaN":
		  case "isPrototypeOf":
		  case "length":
		  case "Math":
		  case "NaN":
		  case "name":
		  case "Number":
		  case "Object":
		  case "prototype":
		  case "String":
		  case "toString":
		  case "undefined":
		  case "valueOf":
		  case "getClass":
		  case "java":
		  case "JavaArray":
		  case "javaClass":
		  case "JavaObject":
		  case "JavaPackage":
		  case "alert":
		  case "all":
		  case "anchor":
		  case "anchors":
		  case "area":
		  case "assign":
		  case "blur":
		  case "button":
		  case "checkbox":
		  case "clearInterval":
		  case "clearTimeout":
		  case "clientInformation":
		  case "close":
		  case "closed":
		  case "confirm":
		  case "constructor":
		  case "crypto":
		  case "decodeURI":
		  case "decodeURIComponent":
		  case "defaultStatus":
		  case "document":
		  case "element":
		  case "elements":
		  case "embed":
		  case "embeds":
		  case "encodeURI":
		  case "encodeURIComponent":
		  case "escape":
		  case "event":
		  case "fileUpload":
		  case "focus":
		  case "form":
		  case "forms":
		  case "frame":
		  case "innerHeight":
		  case "innerWidth":
		  case "layer":
		  case "layers":
		  case "link":
		  case "location":
		  case "mimeTypes":
		  case "navigate":
		  case "navigator":
		  case "frames":
		  case "frameRate":
		  case "hidden":
		  case "history":
		  case "image":
		  case "images":
		  case "offscreenBuffering":
		  case "open":
		  case "opener":
		  case "option":
		  case "outerHeight":
		  case "outerWidth":
		  case "packages":
		  case "pageXOffset":
		  case "pageYOffset":
		  case "parent":
		  case "parseFloat":
		  case "parseInt":
		  case "password":
		  case "pkcs11":
		  case "plugin":
		  case "prompt":
		  case "propertyIsEnum":
		  case "radio":
		  case "reset":
		  case "screenX":
		  case "screenY":
		  case "scroll":
		  case "secure":
		  case "select":
		  case "self":
		  case "setInterval":
		  case "setTimeout":
		  case "status":
		  case "submit":
		  case "taint":
		  case "text":
		  case "textarea":
		  case "top":
		  case "unescape":
		  case "untaint":
		  case "window":
		  case "onblur":
		  case "onclick":
		  case "onerror":
		  case "onfocus":
		  case "onkeydown":
		  case "onkeypress":
		  case "onkeyup":
		  case "onmouseover":
		  case "onload":
		  case "onmouseup":
		  case "onmousedown":
		  case "onsubmit":
			  return false;

	  }
	  if (/^\d/.test(key))
	  {
		  return false;	//starts with number
	  }
	  if (!(/^[a-z_$][0-9a-z_$]*$/i.test(key)))
	  {
		 return false; 	// Invalid character in variable
	  }
	  
	  return true;
	  
  }
function jsonPath(obj, expr, arg, depth, engine, escape) {
   var P = {
      resultType: arg && arg.resultType || "VALUE",
      result: [],
      normalize: function(expr) {
         var subx = [];
         return expr.replace(/[\['](\??\(.*?\))[\]']/g, function($0,$1){return "[#"+(subx.push($1)-1)+"]";})
                    .replace(/'?\.'?|\['?/g, ";")
                    .replace(/;;;|;;/g, ";..;")
                    .replace(/;$|'?\]|'$/g, "")
                    .replace(/#([0-9]+)/g, function($0,$1){return subx[$1];});
      },
      asPath: function(path) {
         var x = path.split(";"), p = "$";
         for (var i=1,n=x.length; i<n; i++)
            p += /^[0-9*]+$/.test(x[i]) ? ("["+x[i]+"]") : ("['"+x[i]+"']");
         return p;
      },
//     asHandlebarsPath: function(path) 
//     {
//    	 var x = path.split(";")
//    	 , p = "";
//         for (var i=1,n=x.length; i<n; i++)
//         {
//        	 if (!p)
//             {
//        		 //first time
//				if (escape)
//				{
//					p = "\\{{";
//				}
//				else
//				{
//					p = "{{";
//				}
//                p += /^[0-9]+$/.test(x[i]) ? ("["+x[i]+"]") : x[i];
//             }
//        	 else
//        	 {
//        		 //all other times
//        		 p += ".";
//        		 //p += /^[0-9]+$/.test(x[i]) ? ("["+x[i]+"]") : (x[i]);
//        		 p += /^[0-9]+$/.test(x[i]) ? ("["+x[i]+"]") : isValidKey(x[i]) ? (x[i]) : "["+x[i]+"]";
//        	 }
//         }
//         if (p)
//         {
//        	 p += "}}";
//         }
//         return p;
//      },
	asTrimPath: function(path) 
	{
         var x = path.split(";"), p = "";
         //nlapiLogExecution("DEBUG", 'path', path);
         for (var i=1,n=x.length; i<n; i++)
         {
        	 if (!p)
        	 {
        		 //first time, root node. Expected to be 
				if (escape)
				{
					p = "{cdata}${";	//field
				}
				else
				{
					p = "${";		// value
				}
                p += /^[0-9]+$/.test(x[i]) ? ("["+x[i]+"]") : x[i];
                
                //produces {ROOT.isinactive}
        	 }
        	 else
        	 {
//        		 if (x[i] == "*")
//        			 {
//        			 	nlapiLogExecution("AUDIT", 'Testing for * ', isValidKey(x[i]));
//        			 	nlapiLogExecution("AUDIT", 'Testing for /^[0-9*]+$/.test(x[i]) ', /^[0-9*]+$/.test(x[i]));
//        			 }
        		 //all other times
        		 
        		 //  /^[0-9]+$/.test(x[i]) -> this test validates if entry is a digit. If so, it is expected 
        		 //							  to produce following: aggregate_search[2]. where 2 is third entry in an array
        		 // else if it's valid key use 
        		 //	 ${aggregate_search[0].columns.Period.formula} 		=> dot notation
        		 // else for illegal key value, use name notation
        		 //		${aggregate_search[2].columns["DayOfDate@"].formula}	=> name notation
        		
				p += /^[0-9]+$/.test(x[i]) ? ("["+x[i]+"]") : isValidKey(x[i]) ? ("."+x[i]) : "[\""+x[i]+"\"]";	    
        	 }
         }
		 if (escape)
		 {
			p += "}{/cdata}";	
		 }
		 else
		 {
		 	p += "}";	
		 }
         return p;
      },
      store: function(p, v) 
      {
//    	  if (engine === creJSONroot.customLists.CRETemplateEngines.keys.HandleBars)
//    	  {
//    		  if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asHandlebarsPath(p) : v;
//    	  }
//    	  else 
    		  
          if (engine === creJSONroot.customLists.CRETemplateEngines.keys.TrimPath)
    	  {
    		 // nlapiLogExecution("AUDIT", 'p |||| v ', p + "  ||||  " + v);
    		  if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asTrimPath(p) : v;
    	  }
    	  else
    	  {
    		  if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asPath(p) : v;
    	  }
    	  return !!p;
      },
      trace: function(expr, val, path) {
         if (expr) {
            var x = expr.split(";"), loc = x.shift();
            x = x.join(";");
            if (val && val.hasOwnProperty(loc))
            {
            	P.trace(x, val[loc], path + ";" + loc);
            }
            else if (loc === "*")
            {
            	P.walk(loc, x, val, path, function(m,l,x,v,p) { P.trace(m+";"+x,v,p); });
            }
            else if (loc === "..") 
            {
            	P.trace(x, val, path);
            	P.walk(loc, x, val, path, function(m,l,x,v,p) { typeof v[m] === "object" && P.trace("..;"+x,v[m],p+";"+m); });
            }
            else if (/,/.test(loc)) 
            { // [name1,name2,...]
            	for (var s=loc.split(/'?,'?/),i=0,n=s.length; i<n; i++)
                  P.trace(s[i]+";"+x, val, path);
            }
            else if (/^\(.*?\)$/.test(loc)){ // [(expr)]
               P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(";")+1))+";"+x, val, path);
            }
            else if (/^\?\(.*?\)$/.test(loc)){ // [?(expr)]
               P.walk(loc, x, val, path, function(m,l,x,v,p) { if (P.eval(l.replace(/^\?\((.*?)\)$/,"$1"),v[m],m)) P.trace(m+";"+x,v,p); });
            }
            else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) // [start:end:step]  phyton slice syntax
            {
               P.slice(loc, x, val, path);
            }
         }
         else
            P.store(path, val);
      },
      walk: function(loc, expr, val, path, f) {
         if (val instanceof Array) {
            for (var i=0,n=Math.min(val.length, depth); i<n; i++)
               if (i in val)
                  f(i,loc,expr,val,path);
         }
         else if (typeof val === "object") {
            for (var m in val)
               if (val.hasOwnProperty(m))
               {
                 f(m,loc,expr,val,path);
               }
         }
      },
      slice: function(loc, expr, val, path) {
         if (val instanceof Array) {
            var len=val.length, start=0, end=len, step=1;
            loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function($0,$1,$2,$3){start=parseInt($1||start);end=parseInt($2||end);step=parseInt($3||step);});
            start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
            end   = (end < 0)   ? Math.max(0,end+len)   : Math.min(len,end);
            for (var i=start; i<end; i+=step)
               P.trace(i+";"+expr, val, path);
         }
      },
      eval: function(x, _v, _vname) {
         try { return $ && _v && eval(x.replace(/@/g, "_v")); }
         catch(e) { throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/@/g, "_v").replace(/\^/g, "_a")); }
      }
   };

   var $ = obj;
   if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH")) {
      P.trace(P.normalize(expr).replace(/^\$;/,""), obj, "$");
      return P.result.length ? P.result : false;
   }
} 