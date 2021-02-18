var CONST_ADMIN_ROLE = 3;                  // full permission when evaluating if user is administrator; 

//------------------------------------------------------------------
//Function:         BL001_Download_File_Suitelet
//Record:			 customrecord_bl001_nsconnector_status          
//Subtab:
//Script Type:      Suitelet to download a file
//Script ID:
//Deployment ID:
//Description:		A Unique Key is provided as a QueryString parameter
//					This key allows us to lookup a profile record to download the latest file
//					Match source IP Address to allowed-list is 2nd level of security
//Task:
//Date:             SG 20130213
//------------------------------------------------------------------
function BL001_Download_File_Suitelet(request, response)
{
  var sFunc = 'BL001_Download_File_Suitelet';
  var sMethod = request.getMethod();
  nlapiLogExecution('AUDIT', sFunc + ' Starting. method, userid', sMethod);

  // get the valid IP address; this is the only allowed IP address that can download the file
  var context = nlapiGetContext();
  var role = context.getRole();
  var email = context.getEmail();
  
  // if this is anonymous suitelet or not admin, check the IP address / match against IP list in suitelet
  if (email.indexOf('onlineformuser')>=0 || parseInt(role)!=CONST_ADMIN_ROLE){
	  var blackline_ip = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_ip_restriction'), '');
	  if (blackline_ip.length==0)return;
	  // make sure the ip address matches the blackline data center
	  var params = request.getAllHeaders();
	  var remote_ip = params['NS-Client-IP'];
	  if (!bl001_checkips(remote_ip, blackline_ip))return;
  }

  // get the querystring variables
  var unique_key = bl_noempty(request.getParameter('key'),'');	// the key to the profile record
  var file_type = bl_noempty(request.getParameter('type'),'A');	// the file type to download
  if (unique_key.length==0)return;
  if (file_type.length==0)return;
  
  // lookup the profile based on the file api key
  var filters = new Array();
  filters[0] = new nlobjSearchFilter('custrecord_bl001_profile_file_api_key', null, 'is', unique_key);
  var columns = new Array();
  columns[0] = new nlobjSearchColumn('custrecord_bl001_account_download');
  columns[1] = new nlobjSearchColumn('custrecord_bl001_entitytype_download');
  columns[2] = new nlobjSearchColumn('custrecord_bl001_entity_download');
  columns[3] = new nlobjSearchColumn('custrecord_bl001_multicurr_download');
  columns[4] = new nlobjSearchColumn('custrecord_bl001_saved_search_id');
  columns[5] = new nlobjSearchColumn('custrecord_bl001_saved_search_headers');
  var results = nlapiSearchRecord('customrecord_bl001_nsconnector_status', null, filters, columns);
  if (!results)return;
  if (results.length==0)return;
  
  
  // the ip matches; now open the most recent file and download it
  // we need to get the file ID out of the URL
  var file_url = ''; // https://system.na1.netsuite.com/core/media/media.nl?id=1047&c=TSTDRV985077&h=948371a93f73ce428c0d&mv=hdgp31eg&_xt=.txt&_xd=T&e=T
  switch (file_type){
  case 'A':
	  file_url = results[0].getValue('custrecord_bl001_account_download');
	  break;
  case 'E':
	  file_url = results[0].getValue('custrecord_bl001_entity_download');
	  break;
  case 'ET':
	  file_url = results[0].getValue('custrecord_bl001_entitytype_download');
	  break;
  case 'MC':
	  file_url = results[0].getValue('custrecord_bl001_multicurr_download');
	  break;
  case 'SS':
	  var ss = bl_noempty(results[0].getValue('custrecord_bl001_saved_search_id'),'');
	  if (ss.length==0)return;
	  var inc_headers = bl_noempty(results[0].getValue('custrecord_bl001_saved_search_headers'),'F');
	  var ret_val = bl001_run_saved_search(ss, (inc_headers=='T'));
	  response.write(ret_val);
	  return;
  default:
	 return;
  }
  var fileid = bl001_id_from_url(file_url);
  if (!bl_isNonZeroNumber(fileid))return;
  
  var oFile = nlapiLoadFile(fileid);
  response.write(oFile.getValue());
  
  return;
  
}
//------------------------------------------------------------------
//Function:         bl001_run_saved_search
//Record:			customrecord_bl001_nsconnector_status          
//Description:		Run specified saved search and return CSV of results
//Date:             SG 20140820
//------------------------------------------------------------------
function bl001_run_saved_search(ss, inc_headers)
{
	var content = '';
	var savedsearch_list = ss.split(',');
	var slen = savedsearch_list.length;
	if (slen>0){
		for (var i=0; i<slen; i++){
			if (i>0){
				content += '\n';
			}
			var savedsearch = savedsearch_list[i].trim();
			var search_list = new bl001_search_list(savedsearch);
			if (inc_headers && i==0){
				content += search_list.header + '\n';
			}
			content += search_list.items.join('\n');
		}
	}
	return content;
}
// function to process the specified saved search and store the header and the rows
function bl001_search_list(savedsearch)
{
	this.items = new Array();
	this.lastid = 0;
	this.header = '';
	this.savedsearch = savedsearch;
	this.delim = '\t';
	
	this.load = function(){
		var keep_looking = true;
		var loop_safety = 0;
		while (keep_looking == true){
			keep_looking = false;
			loop_safety++;
			if (loop_safety>10){
				return;
			}
			var num_records = this.runsearch();
			if (num_records == 1000){
				keep_looking = true;
			}
			nlapiLogExecution('DEBUG', 'id009_vendor_list.load() num_records', num_records);
		}
	};
	
	this.runsearch = function(){
		var filters = null; 
		if (parseInt(this.lastid)>0){
			filters = new Array();
			filters[filters.length] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', this.lastid);
		}
		var results = bl_noempty(nlapiSearchRecord(null, this.savedsearch, filters),{length:0});
		nlapiLogExecution('DEBUG', 'results.length', results.length);
		if (results.length>0){
			var rlen = results.length;
			for (var i=0; i<rlen; i++){
				var result = results[i];
				if (i==0){
					if (this.header.length==0){
						// create the header row
						var newCols = new Array();
						var hcols = result.getAllColumns();
						var hlen = hcols.length;
						for (var hc=0; hc<hlen; hc++){
							newCols[hc] = bl_noempty(hcols[hc].getLabel(),hcols[hc].getName());
						}
						this.header = newCols.join(this.delim);
					}
				}
				this.lastid = result.getId();
				var cols = result.getAllColumns();
				var clen = cols.length;
				var row = new Array();
				for (var c = 0; c < clen; c++){
					row[c] = result.getValue(cols[c]).replace(/(\r\n|\n|\r)/gm," ");
					//nlapiLogExecution('DEBUG', 'column '+c, cols[c].getName() + '|' + cols[c].getLabel() + '|' + result.getValue(cols[c]));
				}
				this.items[this.items.length] = row.join(this.delim);	
			}
		}
		return results.length;
	};
	
	// load results automatically
	this.load();
}
function bl001_encode(inp){
	return escape(inp).split('%20').join(' ');
}

function bl001_id_from_url(file_url){
	  var ret_id = 0;
	  var iPos = file_url.indexOf('?id='); 
	  if (iPos<0)iPos = file_url.indexOf('&id=');
	  if (iPos<0)return;
	  file_url = file_url.substring(parseInt(iPos)+parseInt(4));
	  iPos = file_url.indexOf('&');
	  if (iPos>0){
		  ret_id = file_url.substring(0,iPos);
	  }	
	  return ret_id;
}
// see if one of the IPs matches
function bl001_checkips(remote_ip, blackline_ip){
	  if (!blackline_ip)return false;
	  if (!(typeof blackline_ip == 'string'))return;
	  var aValidList = blackline_ip.split(',');
	  var i = 0;
	  len = aValidList.length;
	  for (i=0;i<len;i++){
		  var valid_ip = aValidList[i];
		  if (bl001_matchip(remote_ip, valid_ip)){
			  return true;
		  }
	  }
	  return false;
}
// make sure ipaddress matches the mask; any position may contain a *
function bl001_matchip(ipaddress, mask) {
	var aIP = ipaddress.split('.');
	var aMask = mask.split('.');
	for (var i=0;i<4;i++){
		if (aMask[i]!='*'){
			if ( aIP[i] != aMask[i]){
				return false;
			}			
		}
	}
	return true;
}

//------------------------------------------------------------------
//Function: _noempty
//Output: return the input_value if it has a value else the default value
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function bl_noempty(input_value, default_value)
{
    if (!input_value)
    {
        return default_value;
    }
    if (input_value.length==0)
    {
        return default_value;
    }
    return input_value;
};
//------------------------------------------------------------------
//Function: _isNumber
//Input: string
//Output: true if this is a numeric value 
//Description: 
//Date: MO 20110904
//------------------------------------------------------------------
function bl_isNumber(n) 
{
	
	var bNan = isNaN(parseFloat(n));
	var bFin =  isFinite(n);
	if (bNan){
		return false;
	}
	if (bFin){
		return true;
	}
	return false;
	//return (!(isNaN(parseFloat(n)) && isFinite(n)));
}
//------------------------------------------------------------------
//Function: _isNonZeroNumber
//Input: a number or string to test
//Output: true if this is a non zero number
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function bl_isNonZeroNumber(n)
{
    if (typeof n != "undefined")
    {
        if (n) {
            if ( bl_isNumber(n) )
            {
                if ( parseFloat( n ) != 0)
                {
                    return true;
                }
            }
        }
    }
    return false;
}