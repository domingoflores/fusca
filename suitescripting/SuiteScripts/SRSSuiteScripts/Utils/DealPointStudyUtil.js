/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />

var Field = 
{
	YES_NO: {YES: 1, NO: 2},
	YES_NO_NA: {YES:1, NO:2, NA:3},
	YES_NO_INDMN: {YES:1, NO:2, YES_INDEMN:3},
	YES_NO_CONVERSE: {YES:1, NO:3, CONVERSE:2},
	YES_NO_NOT_INCLUDED: {YES:1, NO:2, NOT_INCLUDED:3},
	YES_NO_BUYER_SELLER_FAVORABLE: {NO:1},
	YES_NO_YES_BUT_NOT_DETERMINABLE: {YES:1,NO:2,YES_BUT_NOT_DETERMINABLE:3},
	EXCLUSIVE_REMEDY_TYPES: {EXCLUSIVE_REMEDY:1,NON_EXCLUSIVE_REMEDY:2,SILENET:3},
	LIABILITY_CAP: {YES_LESS_THAN_PUR_PRC:1,YES_EQUAL_PUR_PRC:2,YES_BUT_NOT_DETERMINABLE:3,SILENT:4},
	REMEDY_FRAUD_CARVEOUT_TYPES: {FRAUD:'1',INTENT_MISREP:'2',EQUIT_REMEDIES:'3',BREACH_COVE:'4',WILL_BREACH_COVE:'5',INTENT_BREACH_COVE:'6'},
	SANDBAGGING: {PRO:1,ANTI:2,SILENT:3},
	BASKET_TYPES: {NONE:1,DEDUCTIBLE:2,FIRST_DOLLAR:3,COMBINATION:4},
	TENB_FIVE_KNOW_QUAL: {BOTH:1, TENB_FIVE_ONLY:2, FULL_DISCLOSURE_ONLY:3, NIETHER:4},
	COV_TARG_DUTY: {EXPRESS_DUTY_TO_UPDATE:1,SILENT:2},
	CLOSE_SIGN_BOTH: {AT_CLOSE_ONLY:1,AT_SIGN_ONLY:2,BOTH:3},
	IN_ALL_MATERIAL_RESPECTS: {IN_ALL_MATERIAL_RESPECTS:1, IN_ALL_RESPECTS:2, MAE:3},
	RIGHTS: {NOT_EXECISED:1,NOT_AVAILABLE:2,EITHER_BOTH:3},
	PPA_DETAILS: {WORKING_CAPITAL:5}
}

var ccFields = [
	'custrecord_cc_key_employees',
	'custrecord_cc_aor_when_tar_rep_accurate',
	'custrecord_cc_aor_sign_accuracy_of_reps',
	'custrecord_cc_aor_sign_close_acc_of_reps',
	'custrecord_cc_aor_mae_sign_cap_carveout',
	'custrecord_cc_aor_mae_sign_close_cap_car',
	'custrecord_cc_aor_maemat_sign_dbl_mat_sc',
	'custrecord_cc_aor_maemat_sigclose_dbl_ma',
	'custrecord_cc_misc_mac_condition',
	'custrecord_cc_misc_no_legal_chall_tx_inc',
	'custrecord_cc_misc_no_legal_proc_cond_a',
	'custrecord_cc_misc_no_legal_proc_cond_b',
	'custrecord_cc_misc_opin_ltr_target_couns',
	'custrecord_cc_ar_conditions_included',
	'custrecord_cc_ar_avail_excercised',
	'custrecord_cc_thres_if_app_rights_convrs',
	'custrecord_cc_ar_not_excercised',
	'custrecord_cc_ar_not_available',
	'custrecord_cc_ar_either_both'
];

var cvFields = [
	'custrecord_cv_tar_duty_up_breach_sc',
	'custrecord_cv_lmt_info_req_disc_sig',
	'custrecord_cv_but_rt_indm_ltd_up_mt',
	'custrecord_cv_tar_req_not_breaches',
	'custrecord_cv_no_shop_no_talk'
];

var finPPAFields = [
	'custrecord_fin_ppa_details',				// FIN Purchase Price Adjustment Details
	'custrecord_fin_ppa_inc_est_pmt_at_close',	// FIN Estimated PPA Included at Closing
	'custrecord_fin_ppa_est_pmt_buy_rt_apprv',	// FIN Buyer has Right to Approve Est. PPA
	'custrecord_fin_ppa_wc_exc_tax_rel_items', 	// FIN NWC Calc. Excludes Tax Related Items
	'custrecord_fin_ppa_who_prep_close_bs',		// FIN Who Prepares Final Balance Sheet
	'custrecord_fin_ppa_method_used_prep_bs',	// FIN Method Used to Prep Final Bal. Sheet
	'custrecord_fin_ppa_separate_escrow',		// FIN PPA - Separate Escrow
	'custrecord_fin_ppa_no_sep_escrow_pmt',		// FIN PPA If No Sep. Escrow Meth. of Pmt
	'custrecord_fin_ppa_adjustment_threshold'	// FIN PPA - Adjustment Threshold
];

var finEARNFields = [
	'custrecord_fin_earn_metric_used',				// FIN Earnout Metric
	//'custrecordfin_earn_earnout_periods',			// FIN Earnout Periods (will be removed...)
	'custrecord_fin_earnout_period',				// FIN Earnout Period 
	'custrecord_fin_earn_buy_cov_run_bus_past',		// FIN EA Inc Buyer Cov Run Bus Cons w PP 
	'custrecord_fin_earn_cov_run_bus_max_earn',		// FIN EA Inc Buyer Cov to Max Earnout
	'custrecord_fin_earn_exp_accel_chg_contr',		// FIN EA Exp Accel Upon Change of Control
	'custrecord_fin_earn_offset_indem_ag_earn',		// FIN Buyer may Offset EA Payments
	'custrecord_fin_earn_not_security_provisi',		// FIN EA Contains Not a Security Prov
	'custrecord_fin_earn_exp_disc_fid_rel_ear'		// FIN Earnout Express Discl. Fid. Relation 
];

var srsTriggerFields = [
	'custrecord_cc_simultaneous_sign_close',
	'custrecord_cc_aor_when_tar_rep_accurate',
	'custrecord_cc_aor_sign_accuracy_of_reps',
	'custrecord_cc_aor_sign_close_acc_of_reps',
	'custrecord_cc_ar_conditions_included',
	'custrecord_cc_ar_avail_excercised',
	'custrecord_cv_tar_duty_up_breach_sc',
	'custrecord_dr_general_adr_included',
	'custrecord_indm_sb_sand_bag_provision',
	'custrecord_indm_survival_carveouts',
	'custrecord_indm_basket_type',
	'custrecord_indm_basket_inc_elig_claim_tr',
	'custrecord_indm_basket_disregard_dbl_mat',
	'custrecord_indm_liability_cap',
	'custrecord_indm_escrow_holdback_included',
	'custrecord_indm_sole_excl_remedy_type',
	'custrecord_indm_remedy_carveouts',
	'custrecord_pq_mae_carveouts_included',
	'custrecord_fin_ppa_included',
	'custrecord_fin_earn_included',
	'custrecord_rw_no_undisc_lia_included',
	'custrecord_rw_no_undisc_lia_included',
	'custrecord_rw_10b5_full_disc_rep',
	'custrecord_term_fee',
	'custrecord_indm_basket_coverage_details',
	'custrecord_indm_basket_carveout_details'
];

/**
 * @author durbano
 */

function onBeforeLoad(type, form)
{
	if(type != 'edit') return;

	nlapiLogExecution('DEBUG','DealPointStudyUtil.onBeforeLoad()','type is ' + type);
	nlapiLogExecution('DEBUG','DealPointStudyUtil.onBeforeLoad()','form is ' + form);
	
	// run onFieldChange for each field that will/should trigger something...
	for(var i = 0; i < srsTriggerFields.length; i++)
	{
		var triggerField = srsTriggerFields[i];
		nlapiLogExecution('DEBUG','DealPointStudyUtil.onBeforeLoad()','triggerField is ' + triggerField);
		onFieldChange('onBeforeLoad',triggerField);
	}
	nlapiLogExecution('DEBUG','DealPointStudyUtil.onBeforeLoad()','DONE');
}

function onFieldChange(type,name)
{	
	nlapiLogExecution('DEBUG','DealPointStudyUtil.onFieldChange()','type is ' + type);
	nlapiLogExecution('DEBUG','DealPointStudyUtil.onFieldChange()','name is ' + name);

	if(name.length < 14) return;
	var fieldType = name.substring(10,14);
	
	if 		(fieldType == '_cc_')			handleCCFields(type,name);		// closing condition fields
	else if (fieldType == '_cv_')			handleCVFields(type,name);		// covenant fields
	else if (fieldType == '_dr_')			handleDRFields(type,name);		// dispute resolution fields
	else if (fieldType == '_fin')			handleFNFields(type,name);		// financial fields
	else if (fieldType == '_ind')			handleINFields(type,name);		// indemnification fields
	else if (fieldType == '_pq_')			handlePQFields(type,name);		// pervasive qualifier fields
	else if (fieldType == '_rw_')			handleRWFields(type,name);		// rep and warranty fields
	else if (fieldType == '_ter')			handleTERMFields(type,name);		// Termination fields
}

function handleCCFields(type,name)
{
	handleSimultField(type,name);
	handleWhenTargRepsAccField(type,name);
	handleSignAccuracyOfRepsField(type,name);
	handleSignCloseAccuracyOfRepsField(type,name);
	handleAppRightsConditionIncludedField(type,name);
	handleAppRightsAvailableExercisedField(type,name);
	handleNoLegalChallengeToTransField(type,name);
}
	
function handleSimultField(type,name)
{
	if(name != 'custrecord_cc_simultaneous_sign_close') return;
	var signClose = nlapiGetFieldValue('custrecord_cc_simultaneous_sign_close');
	
	var visible = true;
	if(signClose == Field.YES_NO.YES) 	visible = false;		// disable CNV and CC fields

	changeFieldsView(type,ccFields,visible);
	changeFieldsView(type,cvFields,visible);
	
	// make sure the trigger field is not disabled
	//nlapiDisableField(name,false);
	srsDisableField(type,name,false);
}

function handleWhenTargRepsAccField(type,name)
{
	if(name != 'custrecord_cc_aor_when_tar_rep_accurate') return;
	
	var answer = nlapiGetFieldValue('custrecord_cc_aor_when_tar_rep_accurate');
	
	var group1Visible = true;
	var group2Visible = true;
	
	if(answer == Field.CLOSE_SIGN_BOTH.AT_SIGN_ONLY)		group2Visible = false;
	else if(answer == Field.CLOSE_SIGN_BOTH.AT_CLOSE_ONLY)	group1Visible = false;
	else if(answer == Field.CLOSE_SIGN_BOTH.BOTH)			group1Visible = false;
	
	//Removed Per Tracker 2734
	//srsDisableField(type,'custrecord_cc_aor_sign_accuracy_of_reps', !group1Visible);
	srsDisableField(type,'custrecord_cc_aor_mae_sign_cap_carveout', !group1Visible);
	//Removed Per Tracker 2734
	//srsDisableField(type,'custrecord_cc_aor_maemat_sign_dbl_mat_sc',!group1Visible);

	srsDisableField(type,'custrecord_cc_aor_sign_close_acc_of_reps',!group2Visible);
	srsDisableField(type,'custrecord_cc_aor_mae_sign_close_cap_car',!group2Visible);
	srsDisableField(type,'custrecord_cc_aor_maemat_sigclose_dbl_ma',!group2Visible);
}

function handleSignAccuracyOfRepsField(type,name)
{
	if(name != 'custrecord_cc_aor_sign_accuracy_of_reps') return;
	var answer = nlapiGetFieldValue('custrecord_cc_aor_sign_accuracy_of_reps');
	
	var visible = true;
	
	if(answer == Field.IN_ALL_MATERIAL_RESPECTS.IN_ALL_RESPECTS)				visible = false;
	else if(answer == Field.IN_ALL_MATERIAL_RESPECTS.IN_ALL_MATERIAL_RESPECTS)	visible = false;
	
	srsDisableField(type,'custrecord_cc_aor_mae_sign_cap_carveout', !visible);
}

function handleSignCloseAccuracyOfRepsField(type,name)
{
	if(name != 'custrecord_cc_aor_sign_close_acc_of_reps') return;
	var answer = nlapiGetFieldValue('custrecord_cc_aor_sign_close_acc_of_reps');
	
	var visible = true;
	
	if(answer == Field.IN_ALL_MATERIAL_RESPECTS.IN_ALL_RESPECTS)				visible = false;
	else if(answer == Field.IN_ALL_MATERIAL_RESPECTS.IN_ALL_MATERIAL_RESPECTS)	visible = false;
	
	srsDisableField(type,'custrecord_cc_aor_mae_sign_close_cap_car', !visible);
}

function handleAppRightsConditionIncludedField(type,name)
{
	if(name != 'custrecord_cc_ar_conditions_included') return;
	var answer = nlapiGetFieldValue('custrecord_cc_ar_conditions_included');
	
	var visible = true;
	var appRightsConverseVisible = false;
	
	if(answer == Field.YES_NO_CONVERSE.NO) visible = false;
	else if(answer == Field.YES_NO_CONVERSE.CONVERSE)
	{
		visible = false;
		appRightsConverseVisible = true;
	}
	
	srsDisableField(type,'custrecord_cc_ar_avail_excercised', !visible);
	srsDisableField(type,'custrecord_cc_ar_not_excercised', !visible);
	srsDisableField(type,'custrecord_cc_ar_not_available', !visible);
	srsDisableField(type,'custrecord_cc_ar_either_both', !visible);
	srsDisableField(type,'custrecord_cc_thres_if_app_rights_convrs', !appRightsConverseVisible);
}

function handleAppRightsAvailableExercisedField(type,name)
{
	if(name != 'custrecord_cc_ar_avail_excercised') return;
	var answer = nlapiGetFieldValue('custrecord_cc_ar_avail_excercised');
	
	var notAvailableVisible = true;
	var bothVisible = true;
	var notExercisedVisible = true;
	
	if(answer == Field.RIGHTS.NOT_EXECISED)
	{
		notAvailableVisible = false;
		bothVisible = false;
	}
	else if(answer == Field.RIGHTS.NOT_AVAILABLE)
	{
		notExercisedVisible = false;
		bothVisible = false;
	}
	else if(answer == Field.RIGHTS.EITHER_BOTH)
	{
		notAvailableVisible = false;
		notExercisedVisible = false;
	}
	
	srsDisableField(type,'custrecord_cc_ar_either_both', !bothVisible);
	srsDisableField(type,'custrecord_cc_ar_not_available', !notAvailableVisible);
	srsDisableField(type,'custrecord_cc_ar_not_excercised', !notExercisedVisible);
}

function handleNoLegalChallengeToTransField(type,name)
{
	if(name != 'custrecord_cc_misc_no_legal_chall_tx_inc') return;
	
	var answer = nlapiGetFieldValue('custrecord_cc_misc_no_legal_chall_tx_inc');
	var visible = true;

	if(answer == Field.YES_NO.NO)	visible = false;
	
	srsDisableField(type,'custrecord_cc_misc_no_legal_proc_cond_a',!visible);
	srsDisableField(type,'custrecord_cc_misc_no_legal_proc_cond_b',!visible);
}

function handleCVFields(type,name)
{
	if(name != 'custrecord_cv_tar_duty_up_breach_sc') return;
	
	var answer = nlapiGetFieldValue('custrecord_cv_tar_duty_up_breach_sc');
	var visible = true;

	if(answer == Field.COV_TARG_DUTY.SILENT)	visible = false;
	
	srsDisableField(type,'custrecord_cv_lmt_info_req_disc_sig',!visible);
	srsDisableField(type,'custrecord_cv_but_rt_indm_ltd_up_mt',!visible);
}

function handleDRFields(type,name)
{
	if(name != 'custrecord_dr_general_adr_included') return;
	
	var answer = nlapiGetFieldValue('custrecord_dr_general_adr_included');
	var visible = true;

	if(answer == Field.YES_NO.NO)	visible = false;
	
	srsDisableField(type,'custrecord_dr_type_of_adr_included',!visible);
	srsDisableField(type,'custrecord_dr_adr_inc_whos_arbitor',!visible);
	srsDisableField(type,'custrecord_dr_adr_inc_who_pays_expenses',!visible);
}

function handleINFields(type,name)
{
	handleSandbaggingField(type,name);
	handleSurvivalCarveoutsField(type,name);
	handleBasketTypeField(type,name);
	handleBasketIncThresholdField(type,name);
	handleBasketIncDblMatScrapeField(type,name);
	handleLiabilityCapField(type,name);
	handleEscrowHoldbackIncField(type,name);
	handleIndmSoleExclusiveRemedyField(type,name);
	handleCarveoutSoleExclusiveRemedyField(type,name);
	handleBasketCarveoutDetailsField(type,name);
	handleBasketCoverageDetailsField(type,name);
}

function handleSandbaggingField(type,name)
{
	if(name != 'custrecord_indm_sb_sand_bag_provision') return;
	var answer = nlapiGetFieldValue('custrecord_indm_sb_sand_bag_provision');
	
	var visible = true;
	
	if(answer == Field.SANDBAGGING.PRO) visible = false;
	else if(answer == Field.SANDBAGGING.SILENT) visible = false;
	
	srsDisableField(type,'custrecord_indm_sb_type_of_knowledge', !visible);
	srsDisableField(type,'custrecord_indm_sb_timing_of_knowledge', !visible);
}

function handleSurvivalCarveoutsField(type,name)
{
	if(name != 'custrecord_indm_survival_carveouts') return;
	var answer = nlapiGetFieldValue('custrecord_indm_survival_carveouts');
	
	var visible = true;
	
	if(answer == Field.YES_NO.NO) visible = false;
	
	srsDisableField(type,'custrecord_indm_survival_carveout_detail', !visible);
}

function handleBasketTypeField(type,name)
{
	if(name != 'custrecord_indm_basket_type') return;
	var answer = nlapiGetFieldValue('custrecord_indm_basket_type');
	
	var visible = true;
	
	if(answer == Field.BASKET_TYPES.NONE) visible = false;
	
	srsDisableField(type,'custrecord_indm_basket_amount', !visible);
	srsDisableField(type,'custrecord_indm_basket_inc_elig_claim_tr', !visible);
	srsDisableField(type,'custrecord_indm_basket_el_claim_amount', !visible);
	srsDisableField(type,'custrecord_indm_basket_coverage_details', !visible);
	srsDisableField(type,'custrecord_indm_basket_disregard_dbl_mat', !visible);
	srsDisableField(type,'custrecord_indm_basket_for_deter_damages', !visible);	// INDM Basket Includes Dbl Mat Details
	srsDisableField(type,'custrecord_indm_basket_carveout_details', !visible);	
}

function handleBasketIncThresholdField(type,name)
{
	if(name != 'custrecord_indm_basket_inc_elig_claim_tr') return;
	var answer = nlapiGetFieldValue('custrecord_indm_basket_inc_elig_claim_tr');
	
	var visible = true;
	
	if(answer == Field.YES_NO.NO) visible = false;
	
	srsDisableField(type,'custrecord_indm_basket_el_claim_amount', !visible);
}
function handleBasketIncDblMatScrapeField(type,name)
{
	if(name != 'custrecord_indm_basket_disregard_dbl_mat') return;
	var answer = nlapiGetFieldValue('custrecord_indm_basket_disregard_dbl_mat');
	
	var visible = true;
	
	if(answer == Field.YES_NO.NO) visible = false;
	
	srsDisableField(type,'custrecord_indm_basket_for_deter_damages', !visible);	// INDM Basket Includes Dbl Mat Details
}
function handleLiabilityCapField(type,name)
{
	if(name != 'custrecord_indm_liability_cap') return;
	var answer = nlapiGetFieldValue('custrecord_indm_liability_cap');
	
	var visible = true;
	var capAmountVisibile = true;
	
	if(answer == Field.LIABILITY_CAP.SILENT)
	{
		visible = false;
		capAmountVisibile = false;
	}
	else if(answer == Field.LIABILITY_CAP.YES_BUT_NOT_DETERMINABLE) capAmountVisibile = false;
	
	srsDisableField(type,'custrecord_indm_caps_cap_amount', !capAmountVisibile);
	srsDisableField(type,'custrecord_indm_caps_if_cap_pct_tx_value', !visible);
	srsDisableField(type,'custrecord_indm_cap_carveout_none', !visible); 
}
function handleEscrowHoldbackIncField(type,name)
{
	if(name != 'custrecord_indm_escrow_holdback_included') return;
	var answer = nlapiGetFieldValue('custrecord_indm_escrow_holdback_included');
	
	var visible = true;
	
	if(answer == Field.YES_NO.NO) visible = false;
	
	srsDisableField(type,'custrecord_indm_esc_dollar_amt_esc_holdb', !visible);
	srsDisableField(type,'custrecord_indm_escrow_if_esc_pct_tx_val', !visible);
	//srsDisableField(type,'custrecord_indm_esc_dollar_amt_not_deter', !visible);
}
function handleIndmSoleExclusiveRemedyField(type,name)
{
	if(name != 'custrecord_indm_sole_excl_remedy_type') return;
	var answer = nlapiGetFieldValue('custrecord_indm_sole_excl_remedy_type');
	
	var visible = true;
	
	if(answer == Field.EXCLUSIVE_REMEDY_TYPES.NON_EXCLUSIVE_REMEDY) visible = false;
	else if(answer == Field.EXCLUSIVE_REMEDY_TYPES.SILENET) visible = false;
	
	srsDisableField(type,'custrecord_indm_remedy_carveouts', !visible);		// INDM Carveouts to Sole/Exclusive Remedy
	srsDisableField(type,'custrecord_indm_remedy_fraud_definition', !visible);	// INDM Definition of Fraud if Carved Out
}
function handleCarveoutSoleExclusiveRemedyField(type,name)
{
	if(name != 'custrecord_indm_remedy_carveouts') return;
	var answer = nlapiGetFieldValues('custrecord_indm_remedy_carveouts');
	
	var visible = true;
	
	if(answer == null || answer.indexOf(Field.REMEDY_FRAUD_CARVEOUT_TYPES.FRAUD) == -1 ) visible = false;
	
	srsDisableField(type,'custrecord_indm_remedy_fraud_definition', !visible);		// INDM Definition of Fraud if Carved Out	
}

function handleBasketCarveoutDetailsField(type,name)
{
	checkBasketCarveoutCoverageDetailsField();
}
	
function handleBasketCoverageDetailsField(type,name)
{
	checkBasketCarveoutCoverageDetailsField();
}

function checkBasketCarveoutCoverageDetailsField(type,name)
{
nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','Begin handle BasketCD');
var coverageListValue = 2;  //Breaches of Seller/Target Covenants - customlist_basket_coverage_types  
var carveoutListValue = 3;  //Breach of Seller's/Target's Covenants - customlist_carveout_types 

var coverage = new Array();
	coverage = coverage.concat(nlapiGetFieldValues('custrecord_indm_basket_coverage_details'));

var carveout = new Array();
    carveout = carveout.concat(nlapiGetFieldValues('custrecord_indm_basket_carveout_details'));


var coverageHasValue = false;
var carveoutHasValue = false;

if((carveout.length > 0) && (coverage.length > 0))
{

nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','coverage length:' + coverage.length);
nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','carveout length:' + carveout.length);
 	
 	for(var i=0; i <= coverage.length; i++)
 	 {
   	if(coverage[i] == coverageListValue)
  	   {
  	    coverageHasValue = true;
   	   }
	 }

	for(var j=0; j <= carveout.length; j++)
	{
   	 if(carveout[j] == carveoutListValue)
 	    {
 	    carveoutHasValue = true;
 		 }
	}

	if(coverageHasValue && carveoutHasValue)
	{
	alert('Breaches of Seller/Target Covenants is already selected for Basket Coverage Details and should not be selected for Basket Carveout Details.  The selection will be removed.');
			//need to remove from Carveout
		nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','Remove from Carveout');
		nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','Carveout before remove: ' + carveout);
			var newListOfValues = new Array();
			for(var k=0; k <= carveout.length; k++)
			{
				  if(carveout[k] != carveoutListValue)
  				 {
  	 				 newListOfValues.push(carveout[k]);
  	 				 nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','Carveout New Values length ' + newListOfValues.length);
  	 			 }
			}
			
			 if(newListOfValues.length > 0)
  	 				 {
 	  				 nlapiSetFieldValues('custrecord_indm_basket_carveout_details',newListOfValues);
 	  				 nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','Carveout New Values ' + newListOfValues);
 	  				 //return;
 	  				 }
			
	}

}
 nlapiLogExecution('DEBUG','DealPointStudyUtil.handleBasketCarveoutDetails','END carveout coverage check ' );
}
	


function handlePQFields(type,name)
{
	handlePQMAECarveoutsIncluded(type,name);
	handlePQMAEIsForwardLooking(type,name);
}

function handlePQMAECarveoutsIncluded(type,name)
{
	if(name != 'custrecord_pq_mae_carveouts_included') return;
	
	var crvInc = nlapiGetFieldValue('custrecord_pq_mae_carveouts_included');
	
	var visible = true;
	if(crvInc == Field.YES_NO.NO)
		visible = false;
	
	srsDisableField(type,'custrecord_pq_mae_carveout_details',!visible);
}

function handlePQMAEIsForwardLooking(type,name)
{
	if(name != 'custrecord_pq_mae_forward_looking') return;
	
	var answer = nlapiGetFieldValue('custrecord_pq_mae_forward_looking');
	
	var visible = true;
	if(answer == Field.YES_NO.NO) visible = false;
	
	srsDisableField(type,'custrecord_pq_fwd_looking_mae_details',!visible);
}

function handleFNFields(type,name)
{
	handleFNPPAFields(type,name);
	handleFNEARNFields(type,name);
	handleFNPPAEstimateField(type,name);
	handleFNPPASeparateEscrow(type,name);
	handleFNPPADetailsField(type,name);
}

function handleFNPPAFields(type,name)
{
	if(name != 'custrecord_fin_ppa_included')	return;
	
	var ppaInc = nlapiGetFieldValue('custrecord_fin_ppa_included');
	var visible = true;
	
	if(ppaInc == Field.YES_NO_INDMN.NO)	visible = false;		// hide the fields
	
	changeFieldsView(type,finPPAFields,visible);
}

function handleFNEARNFields(type,name)
{
	if(name != 'custrecord_fin_earn_included')	return;
	
	var earnInc = nlapiGetFieldValue('custrecord_fin_earn_included');
	var visible = true;
	if(earnInc == Field.YES_NO.NO)		visible = false;		// hide the fields

	changeFieldsView(type,finEARNFields,visible);
}

function handleFNPPAEstimateField(type,name)
{
	if(name != 'custrecord_fin_ppa_inc_est_pmt_at_close')	return;

	var answer = nlapiGetFieldValue('custrecord_fin_ppa_inc_est_pmt_at_close');
	var visible = true;
	if(answer == Field.YES_NO.NO)		visible = false;		// hide the fields

	srsDisableField(type,'custrecord_fin_ppa_est_pmt_buy_rt_apprv',!visible);
}

function handleFNPPASeparateEscrow(type,name)
{
	if(name != 'custrecord_fin_ppa_separate_escrow')	return;

	var answer = nlapiGetFieldValue('custrecord_fin_ppa_separate_escrow');
	var visible = true;
	//modified Per Tracker 2734
	//Old if(answer == null || answer.indexOf(Field.REMEDY_FRAUD_CARVEOUT_TYPES.FRAUD) == -1 ) visible = false;
	if(answer == null || answer == '' ) visible = false;	

	srsDisableField(type,'custrecord_fin_ppa_no_sep_escrow_pmt',!visible);
}

function handleFNPPADetailsField(type,name)
{
	if(name != 'custrecord_fin_ppa_details')	return;

	var answer = nlapiGetFieldValue('custrecord_fin_ppa_details');
	var visible = true;
	if(answer == null || answer.indexOf(Field.PPA_DETAILS.WORKING_CAPITAL) == -1 ) visible = false;

	srsDisableField(type,'custrecord_fin_ppa_wc_exc_tax_rel_items',!visible);
}

// custrecord_fin_ppa_details

function handleRWFields(type,name)
{
	handleRWNoUndiscField(type,name);				// RW No Undisclosed Liability Rep Included
	handleRW10b5FullField(type,name);				// RW 10b5 or Full Disclosure Reps Included
	handleRWComliWithLawKnowQualField(type,name);	// RW Compliance with Law Rep Knowledge Qualified
}

function handleRWNoUndiscField(type,name)
{
	if(name != 'custrecord_rw_no_undisc_lia_included')	return;

	var answer = nlapiGetFieldValue('custrecord_rw_no_undisc_lia_included');
	var visible = true;
	if(answer == Field.YES_NO.NO)		visible = false;		// hide the fields

	srsDisableField(type,'custrecord_rw_no_undisc_know_qualified',!visible);
	srsDisableField(type,'custrecord_rw_no_undisc_rep_favors',!visible);
}

function handleRW10b5FullField(type,name)
{
	if(name != 'custrecord_rw_10b5_full_disc_rep')	return;
	
	var answer = nlapiGetFieldValue('custrecord_rw_10b5_full_disc_rep');

	var fullDiscVisible = true;
	var tenBFiveOnlyVisible = true;
	
	if(answer == Field.TENB_FIVE_KNOW_QUAL.NIETHER)
	{
		fullDiscVisible = false;
		tenBFiveOnlyVisible = false;
	}
	else if(answer == Field.TENB_FIVE_KNOW_QUAL.TENB_FIVE_ONLY)
	{
		fullDiscVisible = false;
	}
	else																				// BOTH OR FULL_DISCLOSURE
	{
		tenBFiveOnlyVisible = false
	}

	srsDisableField(type,'custrecord_rw_10b5_o_fulldiscl_knowlqual',!fullDiscVisible);		// RW 10b5 and Full Discl - Knowl Qual		
	srsDisableField(type,'custrecord_rw_10b5_only_know_qualified',!tenBFiveOnlyVisible);	// RW If Only 10b-5 Rep is it Knowl Qual?
}

function handleRWComliWithLawKnowQualField(type,name)
{
	if(name != 'custrecord_rw_rep_knowledge_qualified')	return;
	
	var answer = nlapiGetFieldValue('custrecord_rw_rep_knowledge_qualified');
	var visible = true;
	if(answer == Field.YES_NO_NOT_INCLUDED.NOT_INCLUDED)		visible = false;		// hide the fields

	srsDisableField(type,'custrecord_rw_cover_past_present_compli',!visible);
	srsDisableField(type,'custrecord_rw_inc_notice_o_investigation',!visible);
	srsDisableField(type,'custrecord_rw_inc_notice_of_violation',!visible);
}

function handleTERMFields(type,name)
{
	handleTERMFee(type,name);				// Termination Fee
}

function handleTERMFee(type,name)
{
	if(name != 'custrecord_term_fee')	return;
	
	var answer = nlapiGetFieldValue('custrecord_term_fee');
	var visible = true;
	if(answer == Field.YES_NO_BUYER_SELLER_FAVORABLE.NO)		visible = false;		// hide the fields

	srsDisableField(type,'custrecord_term_amt',!visible);
	srsDisableField(type,'custrecord_term_pct',!visible);
	
}

// my little helper functions
function srsDisableField(type,field,disable)
{
	if(field == null || disable == null) return;
	
	if(type == null || type == 'null')
	{
		nlapiDisableField(field,disable);
		return;
	}
	
	if(type == 'onBeforeLoad' && disable)
	{
		var nField = nlapiGetField(field);
		if(nField == null) throw 'The field ' + field + ' is missing.';
			nField.setDisplayType('disabled');
	}
}

function changeFieldsView(type,fields,visible)
{
	for(var i = 0; i < fields.length; i++)
	{
		var field = fields[i];
		
		//nlapiDisableField(field,!visible);
		srsDisableField(type,field,!visible);
	}	
}
