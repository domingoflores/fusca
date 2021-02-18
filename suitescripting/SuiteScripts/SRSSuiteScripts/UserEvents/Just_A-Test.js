function showContent(portlet, column)
{
    portlet.setTitle('Company Docs')
    var content = "<table align=center border=0 cellpadding=0 cellspacing=0 width=100%>"+
	                "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/app/reporting/reportrunner.nl?cr=335&reload=T&whence=\"><font size=\"1\">AR Aging Report</font></a></td></tr>"+
                    "<tr><td>&nbsp;</td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/app/common/media/mediaitemfolders.nl\"><font size=\"1\">All Documents</font></a></td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/app/common/media/mediaitemfolders.nl?folder=1899\"><font size=\"1\">Company Documents</font></a></td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/app/common/media/mediaitemfolders.nl?folder=542\"><font size=\"1\">Transactional Documents</font></a></td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/core/media/media.nl?id=11909&c=772390&h=a9817dbafd958b0752c9&_xt=.pdf\"><font size=\"1\">Wire Transfer Instructions</font></a></td></tr>"+
                    "<tr><td>&nbsp;</td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/app/common/search/searchresults.nl?searchid=592&whence=\"><font size=\"1\">Employee Directory</font></a></td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/core/media/media.nl?id=19197&c=772390&h=298882edd77725ff44e3&_xt=.pdf\"><font size=\"1\">Conference Calling</font></a></td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/core/media/media.nl?id=5395&c=772390&h=313716abc8cf52937f0a&_xt=.pdf\"><font size=\"1\">Operations Manual</font></a></td></tr>"+
                    "<tr><td> &nbsp; <a href=\"https://system.netsuite.com/app/common/search/searchresults.nl?searchid=1251&whence=\"><font size=\"1\">Global NDA List</font></a></td></tr>"+
                    "<tr><td></td></tr>"+
                    "</table>";
    content = '<td><span>'+ content + '</span></td>'
    portlet.setHtml( content );
}