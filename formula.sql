nlapiSubmitField
('customrecord_acq_lot',1077266,'custrecord_exrec_fx_conv_contract',12);



/*ORIGINAL WORKING FORMULA*/

CASE WHEN {custrecord_fx_conv_orig_amount}={custrecord_fx_conv_amt_certs} 
THEN
('<p style="font-weight:bold;background-color:#34eb7a;text-align: center;"> Match') 
ELSE
('<p style="font-weight:bold;background-color:#eb4934;text-align: center;"> Does Not Match')
END


/*FINISHED UPDATED FORMULA*/

CASE WHEN {custrecord_fx_conv_tieout_src}='Certificates' 
THEN
CASE WHEN {custrecord_fx_conv_orig_amount}={custrecord_fx_conv_amt_certs} 
THEN
('<p style="font-weight:bold;background-color:#34eb7a;text-align: center;"> Match') 
ELSE
('<p style="font-weight:bold;background-color:#eb4934;text-align: center;"> Does Not Match') 
END 
ELSE
CASE WHEN {custrecord_fx_conv_tieout_src}='Credit Memos'
THEN
CASE WHEN {custrecord_fx_conv_orig_amount}={custrecord_fx_conv_amt_cmemos} 
THEN
('<p style="font-weight:bold;background-color:#34eb7a;text-align: center;"> Match') 
ELSE
('<p style="font-weight:bold;background-color:#eb4934;text-align: center;"> Does Not Match')
END
END
END



CASE WHEN {custrecord_fx_conv_tieout_src}='Certificates' 
THEN
CASE WHEN {custrecord_fx_conv_orig_amount}={custrecord_fx_conv_amt_certs} 
THEN
('<p style="font-weight:bold;background-color:#34eb7a;text-align: center;"> Certificates Match') 
ELSE
('<p style="font-weight:bold;background-color:#eb4934;text-align: center;"> Certificates Do Not Match') 
END 
ELSE
CASE WHEN {custrecord_fx_conv_tieout_src}='Credit Memos'
THEN
CASE WHEN {custrecord_fx_conv_orig_amount}={custrecord_fx_conv_amt_cmemos} 
THEN
('<p style="font-weight:bold;background-color:#34eb7a;text-align: center;"> Credit Memos Match') 
ELSE
('<p style="font-weight:bold;background-color:#eb4934;text-align: center;"> Credit Memos Do Not Match')
END
END
END


