var achUSA = getInt(nlapiGetContext().getSetting('SCRIPT', 'custscript_csc_ach_usa_form'));
	var achCAD = getInt(nlapiGetContext().getSetting('SCRIPT', 'custscript_csc_eft_cad_form'));
	var achIACH = getInt(nlapiGetContext().getSetting('SCRIPT', 'custscript_csc_iach_form'));
function validateCustomForm(type,name,i)
{
	
	//alert(' achUSA '+achUSA+' achCAD '+achCAD+' achIACH '+achIACH);
	if(name == 'custpage_custform')
	{
		var formNumber = nlapiGetFieldValue('custpage_custform');
		if(formNumber == achUSA)//for usa
		{
			//----------- set the field to null --------------
			nlapiSetFieldValue('custpage_ibancode','');
			nlapiSetFieldValue('custpage_sortcode','');
			nlapiSetFieldValue('custpage_bicorswift','');
			nlapiSetFieldValue('custpage_origincountries','');
			nlapiSetFieldValue('custpage_destinationcountries','');
			nlapiSetFieldValue('custpage_origincurrency','');
			nlapiSetFieldValue('custpage_destinationcurrency','');
			nlapiSetFieldValue('custpage_transitnumber','');
			nlapiSetFieldValue('custpage_bankbranchnumber','');
			nlapiSetFieldValue('custpage_paymenttype','');
			//------------------------------------------------
			
			
			nlapiDisableField('custpage_ibancode',true);
			nlapiDisableField('custpage_sortcode',true);
			nlapiDisableField('custpage_bicorswift',true);
			//------------- CAD ---------------------------------
			nlapiDisableField('custpage_origincountries',true);
			nlapiDisableField('custpage_destinationcountries',true);
			nlapiDisableField('custpage_origincurrency',true);
			nlapiDisableField('custpage_destinationcurrency',true);
			nlapiDisableField('custpage_transitnumber',true);
			nlapiDisableField('custpage_bankbranchnumber',true);
			nlapiDisableField('custpage_paymenttype',true);
			//----------- enable rest of the fields---------------
			nlapiDisableField('custpage_addenda',false);
			nlapiDisableField('custpage_entryclasscode',false);
			nlapiDisableField('custpage_bankaccounttype',false);
			nlapiDisableField('custpage_useraccounttype',false);
			nlapiDisableField('custpage_bankaccountnumber',false);
			nlapiDisableField('custpage_bankname',false);
			nlapiDisableField('custpage_bankroutingnumber',false);
			nlapiDisableField('custpage_nameonaccount',false);
			nlapiDisableField('custpage_displayname',false);
			nlapiDisableField('custpage_name',false);
		}
		else if(formNumber == achCAD)//for cad
		{
			nlapiDisableField('custpage_origincountries',false);
			nlapiDisableField('custpage_destinationcountries',false);
			nlapiDisableField('custpage_origincurrency',false);
			nlapiDisableField('custpage_destinationcurrency',false);
			nlapiDisableField('custpage_transitnumber',false);
			nlapiDisableField('custpage_bankbranchnumber',false);
			nlapiDisableField('custpage_paymenttype',false);
			
			nlapiDisableField('custpage_name',false);
			nlapiDisableField('custpage_displayname',false);
			nlapiDisableField('custpage_nameonaccount',false);
			nlapiDisableField('custpage_bankroutingnumber',false);
			nlapiDisableField('custpage_bankname',false);
			nlapiDisableField('custpage_bankaccountnumber',false);
			nlapiDisableField('custpage_paymenttype',false);
			//------------- set value to null if any -------------
			nlapiSetFieldValue('custpage_useraccounttype','');
			nlapiSetFieldValue('custpage_bankaccounttype','');
			nlapiSetFieldValue('custpage_entryclasscode','');
			nlapiSetFieldValue('custpage_addenda','');
			nlapiSetFieldValue('custpage_ibancode','');
			nlapiSetFieldValue('custpage_sortcode','');
			nlapiSetFieldValue('custpage_bicorswift','');
			//----------------------------------------------------
			nlapiDisableField('custpage_useraccounttype',true);
			nlapiDisableField('custpage_bankaccounttype',true);
			nlapiDisableField('custpage_entryclasscode',true);
			nlapiDisableField('custpage_addenda',true);
			nlapiDisableField('custpage_ibancode',true);
			nlapiDisableField('custpage_sortcode',true);
			nlapiDisableField('custpage_bicorswift',true);
		}
		else if(formNumber == achIACH)//for iach
		{
			//------------- set value to null if any -------------
			nlapiSetFieldValue('custpage_bankroutingnumber','');
			nlapiSetFieldValue('custpage_useraccounttype','');
			nlapiSetFieldValue('custpage_bankaccounttype','');
			nlapiSetFieldValue('custpage_entryclasscode','');
			nlapiSetFieldValue('custpage_transitnumber','');
			nlapiSetFieldValue('custpage_bankbranchnumber','');
			//----------------------------------------------------
			nlapiDisableField('custpage_bankroutingnumber',true);
			nlapiDisableField('custpage_useraccounttype',true);
			nlapiDisableField('custpage_bankaccounttype',true);
			nlapiDisableField('custpage_entryclasscode',true);
			nlapiDisableField('custpage_transitnumber',true);
			nlapiDisableField('custpage_bankbranchnumber',true);
			
			//---------- set the dispaly type to false--------
			nlapiDisableField('custpage_addenda',false);
			nlapiDisableField('custpage_ibancode',false);
			nlapiDisableField('custpage_sortcode',false);
			nlapiDisableField('custpage_bicorswift',false);
			
			nlapiDisableField('custpage_name',false);
			nlapiDisableField('custpage_displayname',false);
			nlapiDisableField('custpage_nameonaccount',false);
			nlapiDisableField('custpage_bankname',false);
			
			nlapiDisableField('custpage_bankaccountnumber',false);
			nlapiDisableField('custpage_paymenttype',false);
			nlapiDisableField('custpage_sortcode',false);
			nlapiDisableField('custpage_bicorswift',false);
			
			nlapiDisableField('custpage_origincountries',false);
			nlapiDisableField('custpage_destinationcountries',false);
			nlapiDisableField('custpage_origincurrency',false);
			nlapiDisableField('custpage_destinationcurrency',false);
		}
	
	}
}

function onLoad(type)
{
	//var achUSA = getInt(nlapiGetContext().getSetting('SCRIPT', 'custscript_csc_ach_usa_form'));
	//var achCAD = getInt(nlapiGetContext().getSetting('SCRIPT', 'custscript_csc_eft_cad_form'));
	//var achIACH = getInt(nlapiGetContext().getSetting('SCRIPT', 'custscript_csc_iach_form'));
	//alert(' achUSA '+achUSA+' achCAD '+achCAD+' achIACH '+achIACH);
	if(type == 'create')
	{
		nlapiDisableField('custpage_ibancode',true);
		nlapiDisableField('custpage_sortcode',true);
		nlapiDisableField('custpage_bicorswift',true);
		//------------- CAD ---------------------------------
		nlapiDisableField('custpage_origincountries',true);
		nlapiDisableField('custpage_destinationcountries',true);
		nlapiDisableField('custpage_origincurrency',true);
		nlapiDisableField('custpage_destinationcurrency',true);
		nlapiDisableField('custpage_transitnumber',true);
		nlapiDisableField('custpage_bankbranchnumber',true);
		nlapiDisableField('custpage_paymenttype',true);
	}
	else
	{
		if(name == 'custpage_custform')
		{
			var formNumber = nlapiGetFieldValue('custpage_custform');
			if(formNumber == achUSA)//usa
			{
				//----------- set the field to null --------------
				nlapiSetFieldValue('custpage_ibancode','');
				nlapiSetFieldValue('custpage_sortcode','');
				nlapiSetFieldValue('custpage_bicorswift','');
				nlapiSetFieldValue('custpage_origincountries','');
				nlapiSetFieldValue('custpage_destinationcountries','');
				nlapiSetFieldValue('custpage_origincurrency','');
				nlapiSetFieldValue('custpage_destinationcurrency','');
				nlapiSetFieldValue('custpage_transitnumber','');
				nlapiSetFieldValue('custpage_bankbranchnumber','');
				nlapiSetFieldValue('custpage_paymenttype','');
				//------------------------------------------------
				
				
				nlapiDisableField('custpage_ibancode',true);
				nlapiDisableField('custpage_sortcode',true);
				nlapiDisableField('custpage_bicorswift',true);
				//------------- CAD ---------------------------------
				nlapiDisableField('custpage_origincountries',true);
				nlapiDisableField('custpage_destinationcountries',true);
				nlapiDisableField('custpage_origincurrency',true);
				nlapiDisableField('custpage_destinationcurrency',true);
				nlapiDisableField('custpage_transitnumber',true);
				nlapiDisableField('custpage_bankbranchnumber',true);
				nlapiDisableField('custpage_paymenttype',true);
				//----------- enable rest of the fields---------------
				nlapiDisableField('custpage_addenda',false);
				nlapiDisableField('custpage_entryclasscode',false);
				nlapiDisableField('custpage_bankaccounttype',false);
				nlapiDisableField('custpage_useraccounttype',false);
				nlapiDisableField('custpage_bankaccountnumber',false);
				nlapiDisableField('custpage_bankname',false);
				nlapiDisableField('custpage_bankroutingnumber',false);
				nlapiDisableField('custpage_nameonaccount',false);
				nlapiDisableField('custpage_displayname',false);
				nlapiDisableField('custpage_name',false);
			}
			else if(formNumber == achCAD)// cad
			{
				nlapiDisableField('custpage_origincountries',false);
				nlapiDisableField('custpage_destinationcountries',false);
				nlapiDisableField('custpage_origincurrency',false);
				nlapiDisableField('custpage_destinationcurrency',false);
				nlapiDisableField('custpage_transitnumber',false);
				nlapiDisableField('custpage_bankbranchnumber',false);
				nlapiDisableField('custpage_paymenttype',false);
				
				nlapiDisableField('custpage_name',false);
				nlapiDisableField('custpage_displayname',false);
				nlapiDisableField('custpage_nameonaccount',false);
				nlapiDisableField('custpage_bankroutingnumber',false);
				nlapiDisableField('custpage_bankname',false);
				nlapiDisableField('custpage_bankaccountnumber',false);
				nlapiDisableField('custpage_paymenttype',false);
				//------------- set value to null if any -------------
				nlapiSetFieldValue('custpage_useraccounttype','');
				nlapiSetFieldValue('custpage_bankaccounttype','');
				nlapiSetFieldValue('custpage_entryclasscode','');
				nlapiSetFieldValue('custpage_addenda','');
				nlapiSetFieldValue('custpage_ibancode','');
				nlapiSetFieldValue('custpage_sortcode','');
				nlapiSetFieldValue('custpage_bicorswift','');
				//----------------------------------------------------
				nlapiDisableField('custpage_useraccounttype',true);
				nlapiDisableField('custpage_bankaccounttype',true);
				nlapiDisableField('custpage_entryclasscode',true);
				nlapiDisableField('custpage_addenda',true);
				nlapiDisableField('custpage_ibancode',true);
				nlapiDisableField('custpage_sortcode',true);
				nlapiDisableField('custpage_bicorswift',true);
			}
			else if(formNumber == achIACH)//iach
			{
				//------------- set value to null if any -------------
				nlapiSetFieldValue('custpage_bankroutingnumber','');
				nlapiSetFieldValue('custpage_useraccounttype','');
				nlapiSetFieldValue('custpage_bankaccounttype','');
				nlapiSetFieldValue('custpage_entryclasscode','');
				nlapiSetFieldValue('custpage_transitnumber','');
				nlapiSetFieldValue('custpage_bankbranchnumber','');
				//----------------------------------------------------
				nlapiDisableField('custpage_bankroutingnumber',true);
				nlapiDisableField('custpage_useraccounttype',true);
				nlapiDisableField('custpage_bankaccounttype',true);
				nlapiDisableField('custpage_entryclasscode',true);
				nlapiDisableField('custpage_transitnumber',true);
				nlapiDisableField('custpage_bankbranchnumber',true);
				
				//---------- set the dispaly type to false--------
				nlapiDisableField('custpage_addenda',false);
				nlapiDisableField('custpage_ibancode',false);
				nlapiDisableField('custpage_sortcode',false);
				nlapiDisableField('custpage_bicorswift',false);
				
				nlapiDisableField('custpage_name',false);
				nlapiDisableField('custpage_displayname',false);
				nlapiDisableField('custpage_nameonaccount',false);
				nlapiDisableField('custpage_bankname',false);
				
				nlapiDisableField('custpage_bankaccountnumber',false);
				nlapiDisableField('custpage_paymenttype',false);
				nlapiDisableField('custpage_sortcode',false);
				nlapiDisableField('custpage_bicorswift',false);
				
				nlapiDisableField('custpage_origincountries',false);
				nlapiDisableField('custpage_destinationcountries',false);
				nlapiDisableField('custpage_origincurrency',false);
				nlapiDisableField('custpage_destinationcurrency',false);
			}
		
		}
	}
}	
	
function getInt(id)
{
	var ret;
	ret = parseInt(id);
	if(isNaN(ret))
	{
		ret = 0;
	}
	return ret;

}// getnumber
	
