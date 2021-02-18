  /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This script is a tool to help develop SFTP connections  in Suitescript 2.0 
 ||                                                               
 ||                                                               
 ||  Version Date         Author        Remarks                   
 ||  1.0     Oct 03 2016  Adolfo Garza  Initial commit            
 ||  1.1     Oct 11 2016  Adolfo Garza  Casting Port and Timeout to Number                 
 ||  1.2     Dec 23 2016  Adolfo Garza  Added support for HostKey Port and Type             
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =*/
 
var https, sftp, sw;
var HOST_KEY_TOOL_URL = 'https://ursuscode.com/tools/sshkeyscan.php?url=';
 
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(["N/https", "N/sftp", "N/ui/serverWidget"], runSuitelet);
 
//********************** MAIN FUNCTION **********************
function runSuitelet(HTTPS, SFTP, SERVERWIDGET){
    https = HTTPS;
    sw    = SERVERWIDGET;
    sftp  = SFTP;
    
	var returnObj = {};
	returnObj.onRequest = execute;
	return returnObj;
}
 
//=============================================================================================================================
//=============================================================================================================================
function execute(context){
    var method = context.request.method;
    
  	var form = getFormTemplate(method);
    
    if (method == 'GET') {
        form = addSelectorFields(form);
    }
    
    if (method == 'POST') {
        var selectaction = context.request.parameters.selectaction;
        if(selectaction == 'getpasswordguid'){
            form = addPasswordGUID1Fields(form);            
        }
        else if(selectaction == 'gethostkey'){
            form = addHostKeyFields(form);
        }
        else if(selectaction == 'downloadfile'){
            form = addDownloadFileFields(form);
        } else {
            var password = context.request.parameters.password;
            var username = context.request.parameters.username;
            var passwordGuid = context.request.parameters.passwordguid;
            var url = context.request.parameters.url;
            var hostKey = context.request.parameters.hostkey;
            var hostKeyType = context.request.parameters.hostkeytype;
            var port = context.request.parameters.port;
            var directory = context.request.parameters.directory;
            var timeout = context.request.parameters.timeout;
            var filename = context.request.parameters.filename;
            var restricttoscriptids = context.request.parameters.restricttoscriptids;
            var restricttodomains = context.request.parameters.restricttodomains;
            
            if(restricttoscriptids && restricttodomains){
                form = addPasswordGUID2Fields(form, restricttoscriptids, restricttodomains);
            }
                        
            if(password){
                form.addField({ id:'passwordguidresponse' ,type:sw.FieldType.LONGTEXT ,label:'PasswordGUID Response' ,displayType:sw.FieldDisplayType.INLINE }).defaultValue = password;
            }
 
            if(url && passwordGuid && hostKey && filename){
                var sftpConnection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout);
                var downloadedFile = sftpConnection.download({ filename:filename }).getContents(); 
                form.addField({ id:'filecontents' ,type:sw.FieldType.LONGTEXT ,label:'Downloaded File Contents' ,displayType: sw.FieldDisplayType.INLINE }).defaultValue = downloadedFile;
            } else if (url) {
				var myUrl = HOST_KEY_TOOL_URL + url + "&port=" + port + "&type=" + hostKeyType; 
                var theResponse = https.get({url: myUrl}).body;
                form.addField({ id:'hostkeyresponse' ,type:sw.FieldType.LONGTEXT ,label:'Host Key Response' ,displayType:sw.FieldDisplayType.INLINE }).defaultValue = theResponse;        
            }
        }
    }
    
  	context.response.writePage(form);
  	return;
}

//=============================================================================================================================
//=============================================================================================================================
function addInstructionsText(form ,html) {
	
    var instructions = form.addField({ id:'custpage_instructions' ,type:sw.FieldType.INLINEHTML ,label:' ' });
    instructions.defaultValue = html;
    
}
 
//=============================================================================================================================
//=============================================================================================================================
function addSelectorFields(form){
    var select = form.addField({ id:'selectaction' ,type: sw.FieldType.SELECT ,label:'Select Action, then click submit' });
    select.addSelectOption({ value:'getpasswordguid' ,text:'Generate Password GUID' });  
    select.addSelectOption({ value:'gethostkey'      ,text:'Retrieve Host Key' });  
    select.addSelectOption({ value:'downloadfile'    ,text:'Download File Test' });
    
    var html = "<span style='font-size:14pt;'>";
    html = html + "Select an operation on the left and then click Submit<br/><br/>";
    html = html + "You will need to generate a Password GUID for which you will need the password for the userid you intend to use. <br/><br/>";
    html = html + "You will need to retrieve the Host Key from the FTP Server. <br/><br/>";
    html = html + "Then you may use the Dowload File operation to test your connection.  <br/><br/>";
    html = html + "</span>";
    addInstructionsText(form ,html);
    
    return form;
}
 
//=============================================================================================================================
//=============================================================================================================================
function addPasswordGUID1Fields(form){
    form.addField({ id:'restricttoscriptids' ,type:sw.FieldType.TEXT ,label:'Restrict To Script Ids' }).isMandatory = true;
    form.addField({ id:'restricttodomains'   ,type:sw.FieldType.TEXT ,label:'Restrict To Domains / IP Addresses' }).isMandatory = true;
    var html = "<div style='font-size:14pt;'>";
    html = html + "For the script id's you may enter a comma separated list of textual id's of the scripts that will be allowed to use this GUID.<br/><br/>";
    html = html + "For Domains/IP Addresses enter a comma separated list of those sites for which the GUID will be valid. <br/><br/>";
    html = html + "Then click submit to move on to the password entry part of this operation. <br/><br/>";
    html = html + "</div>";
    addInstructionsText(form ,html);
    
    return form;
}
 
//=============================================================================================================================
//=============================================================================================================================
function addPasswordGUID2Fields(form, restrictToScriptIds, restrictToDomains){
    form.addCredentialField({  id:'password' , label:'Password'
    	                    , restrictToScriptIds:restrictToScriptIds.replace(' ', '').split(',')
    	                    , restrictToDomains:restrictToDomains.replace(' ', '').split(',')    });
    var html = "<div style='font-size:14pt;'>";
    html = html + "The password you enter must be 36 characters or fewer<br/><br/>";
    html = html + "</div>";
    addInstructionsText(form ,html);

    var instructions = form.addField({ id:'custpage_maxlength' ,type:sw.FieldType.INLINEHTML ,label:' ' });
    instructions.defaultValue = "<script>var password=document.getElementById('password');password.maxLength=36;</script>";
    
    return form;
}
 
//=============================================================================================================================
//=============================================================================================================================
function addHostKeyFields(form){
    form.addField({ id:'url'         ,type:sw.FieldType.TEXT     ,label:'URL / IP Address (Required)' });	
    form.addField({ id:'port'        ,type:sw.FieldType.INTEGER  ,label:'Port (Optional)' });	
    form.addField({ id:'hostkeytype' ,type:sw.FieldType.TEXT     ,label : 'Type (Optional)'    });
    
    var html = "<div style='font-size:14pt;margin-top:20px;'>";
    html = html + "You only need to retrieve the Host Key once for a given URL or IP Address<br/><br/>";
    html = html + "</div>";
    addInstructionsText(form ,html);
    
    return form;
}
 
//=============================================================================================================================
//=============================================================================================================================
function addDownloadFileFields(form){
    form.addField({ id:'url',             type:sw.FieldType.TEXT,        label:'URL (Required)'          });
    form.addField({ id:'username',        type:sw.FieldType.TEXT,        label:'Username'                });
    form.addField({ id:'passwordguid',    type:sw.FieldType.LONGTEXT,    label:'PasswordGuid (Required)' });
    form.addField({ id:'hostkey',         type:sw.FieldType.LONGTEXT,    label:'Host Key (Required)'     });
    form.addField({ id:'hostkeytype',     type:sw.FieldType.TEXT,        label:'Host Key Type'           });
    form.addField({ id:'filename',        type:sw.FieldType.TEXT,        label:'File Name'               });
    form.addField({ id:'port',            type:sw.FieldType.INTEGER,     label:'Port'                    });
    form.addField({ id:'directory',       type:sw.FieldType.TEXT,        label:'Directory'               });
    form.addField({ id:'timeout',         type:sw.FieldType.INTEGER,     label:'Timeout'                 });
    return form;
}
 
//=============================================================================================================================
//=============================================================================================================================
function getFormTemplate(){
    var form = sw.createForm({ title:'SFTP Credentials Helper Tool' });
    form.addSubmitButton({ label:'Submit' });    
    return form;
}
 
//=============================================================================================================================
//=============================================================================================================================
function getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout){
    var preConnectionObj = {};
    preConnectionObj.passwordGuid = passwordGuid;
    preConnectionObj.url = url;
    preConnectionObj.hostKey = hostKey;
    if(username)    { preConnectionObj.username    = username;     }
    if(hostKeyType) { preConnectionObj.hostKeyType = hostKeyType;  }
    if(port)        { preConnectionObj.port        = Number(port); }
    if(directory)   { preConnectionObj.directory   = directory;    }
    if(timeout)     { preConnectionObj.timeout     = Number(timeout); }
    
    var connectionObj = sftp.createConnection(preConnectionObj);
    return connectionObj;
}