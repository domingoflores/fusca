/// <reference path="../../_references.js" />
/**
 * @author Jay
 * 10/8/2012 2:05:01 PM
*/
$PPS.debug = true;
$PPS.where = "PP_SL_FileDownloadProxy";
var test = true;

function PP_SL_FileDownloadProxy(request, response) {
    $PPS.log("*** Start ***");
    try{
        var id = request.getParameter('id');
        
        if (!$PPS.IsEmpty(id)) {
            //Setup PP SSO URL 
        	var url = $PPS.nlapiOutboundSSO() + "&jobID=" + id;

            var r = nlapiRequestURL(url);
            var body = r.getBody();
            
            var responseCode = r.getCode().toFixed(0);
            
            if(responseCode == '404'){
            	response.write('404 Error: File Not Found');
            	return;
            }
            var disposition = r.getHeader("Content-Disposition");
        
            if (test) {
                $PPS.log(disposition);
                $PPS.log(url);

                var arrHeaderNameList = r.getAllHeaders();
                var arrHeaders = {};
                for (var f in arrHeaderNameList)
                    arrHeaders[arrHeaderNameList[f]] = r.getHeader(arrHeaderNameList[f]);

                $PPS.log(JSON.stringify(arrHeaders));
            }

            if (disposition != null) {
                var filename = "";

                try {
                    filename = disposition.split("filename=")[1].replace(/"/g, "");
                    if (test) $PPS.log(filename);
                } catch (e) {
                    $PPS.log(e);
                }

                $PPS.log(body);
            
                response.setContentType('PDF', filename, 'attachment');
                response.write(body);
            } else {
                response.write(JSON.stringify({ error: "File error", msg: "No disposition." }));
            }
        }else
            response.write(JSON.stringify({ error: "No ID", msg: "No ID." }));
    } catch (e) {
        $PPS.log(e);
    }
    $PPS.log("*** End ***");
}