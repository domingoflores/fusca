/**
 * @author durbano
 */
var SRSUtil = {};

SRSUtil.timeout = function()
{
	location.href = "https://checkout.netsuite.com/s.nl?c=772390&sc=4&logoff=T&ckabandon=xpDRYnhXAVTzc5Yi&ck=xpDRYnhXAVTzc5Yi&vid=xpDRYlpXAUYF8ufe&cktime=87929";
}

SRSUtil.setTimeout = function()
{
	window.setTimeout(SRSUtil.timeout,600000);
}

