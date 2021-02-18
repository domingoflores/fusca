/**
 * Module Description
 * This script finds the largest value in the 5-Digit Associated File ID field for all existing
 * Payment File Creation records, and then adds 1 to the value and stores it on the new 
 * Payment File Creation record that is being created.  If there is no number then this script
 * the 5-Digit Associated File ID field to 00001.  The requirement from Suntrust is that the
 * number must be 5 digits long.  This script also adds leading zeros if the number is not 
 * 5 digits long.
 * 
 * Version    Date            Author           Remarks
 * 1.00       1 Sep 2017      Scott Streule    I wanna go fast
 *
 */

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
	function(record, search) {

		function beforeSubmit(context) {
			if (context.type == context.UserEventType.CREATE) {

				//custrecord_pay_file_5_digit_file_id
				var newpayFileCreationRecord = context.newRecord;
				var newrecordID = newpayFileCreationRecord.id;
                
                var lastPayFile5DigitFileIDSearch = search.create({
                    type: 'customrecord_payment_file',
                    columns: [{
                        name: 'custrecord_pay_file_5_digit_file_id',
                        summary: 'MAX'
                    }]
                });

           	    var lastPayFile5DigitFileIDRunSearch = lastPayFile5DigitFileIDSearch.run().getRange(0, 1);
                log.debug('lastPayFile5DigitFileIDRunSearch[0]' + lastPayFile5DigitFileIDRunSearch[0], lastPayFile5DigitFileIDRunSearch);

                var lastPayFile5DigitFileID = lastPayFile5DigitFileIDRunSearch[0].getValue({
                    name: 'custrecord_pay_file_5_digit_file_id',
                    summary: 'MAX'
                });

            	if(lastPayFile5DigitFileID == '' || lastPayFile5DigitFileID == null){
            		var newPayFile5DigitFileID = '00001';
            	}else{
            		
                    var newPayFile5DigitFileID = Number(lastPayFile5DigitFileID) + 1;
                        newPayFile5DigitFileID = newPayFile5DigitFileID.toString();

            		if(newPayFile5DigitFileID.length < 5){
                        var missingZeros = newPayFile5DigitFileID.length - 5;
            			
                        for(var i = 0; i > missingZeros; missingZeros++){
            				newPayFile5DigitFileID = '0' + newPayFile5DigitFileID;
            			}
            		}
            	}
				
				newpayFileCreationRecord.setValue({
					fieldId: 'custrecord_pay_file_5_digit_file_id',
					value: newPayFile5DigitFileID, 
					ignoreFieldChange: true
				});
			}
		}

		return {
			beforeSubmit: beforeSubmit
		};
	});