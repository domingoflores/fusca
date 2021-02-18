/**
 * @author durbano
 * example call for this script: https://checkout.netsuite.com/app/site/hosting/scriptlet.nl?script=75&deploy=1
 */
function main(request,response)
{
	// all events
	// https://checkout.netsuite.com/app/site/hosting/scriptlet.nl?script=38&deploy=1&compid=772390&custpage_search_type=calendarevent&custpage_search_id=709
	
	// account balances
	// https://checkout.netsuite.com/app/site/hosting/scriptlet.nl?script=38&deploy=1&compid=772390&custpage_search_type=customrecord18&custpage_search_id=290
	
	var eventJSON = nlapiRequestURL('https://checkout.netsuite.com/app/site/hosting/scriptlet.nl?script=38&deploy=1&compid=772390&custpage_search_type=calendarevent&custpage_search_id=709');
	
	var balanceJSON = nlapiRequestURL('https://checkout.netsuite.com/app/site/hosting/scriptlet.nl?script=38&deploy=1&compid=772390&custpage_search_type=customrecord18&custpage_search_id=290');
	
	response.write(balanceJSON.getBody());
}
