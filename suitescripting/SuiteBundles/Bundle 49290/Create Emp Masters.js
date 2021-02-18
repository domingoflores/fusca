function createkeymast(request,response)
{

//Designed for Shareholder Representative Services - April 2012
//Frank Foster - Grace Business Solutions
//ffoster@grace-solutions.com - 314-831-0078

//This is a Suitelet that will create Employee Master Key records with given Master Key components

//This is the GET method

if ( request.getMethod() == 'GET' )
{
	var message = 9
	createform(message)

}
else //This is the POST
{

	var message = 0
	var error = false
	var generation = request.getParameter('custpage_generation');
	var keyname = request.getParameter('custpage_keyname');
	var hex_key_master;

	//We are receiving 32 hex digits which must be translated into decimal
	var keyhex_entered = request.getParameter('custpage_keyhex');

	if (generation.length != 1 && generation.length != 2)
	{
		message = 1 //Must be 1 or 2 characters
		error = true
	}
	if (keyhex_entered.length != 32)
	{
		message = 2 //Must be at least 32
		error = true
	}

	//Set to lower case
	keyhex_entered = keyhex_entered.toLowerCase();

	//Let's make sure not a Dup
	var filter = new Array();
	filter[0] = new nlobjSearchFilter('firstname', null, 'is', generation);
	filter[1] = new nlobjSearchFilter('lastname', null, 'is', keyname);
	var results = nlapiSearchRecord('employee', null, filter, null);
	if ( results != null)
	{
		message = 6 //Must be at least 6
		error = true
	}

	if (!error )
	{
		//Go get decimal version of key	
		var keydec = ACE.digits_from_key(keyhex_entered)
		if (keydec.length != 48)
		{
			message = 5 //Must return 48
			error = true
		}
	}

	if (!error)
	{
		var key_split = new Array()
		key_split[0] = keydec.substring(0,9)
		key_split[1] = keydec.substring(9,18)
		key_split[2] = keydec.substring(18,27)
		key_split[3] = keydec.substring(27,36)
		key_split[4] = keydec.substring(36,45)
		key_split[5] = keydec.substring(45,48)
		
		var size = key_split.length
		for(x=0;x<=size-1;x++) 
		{
			var emprec = nlapiCreateRecord('employee')
			emprec.setFieldValue('firstname', generation)
			emprec.setFieldValue('middlename', x+1)
			emprec.setFieldValue('lastname', keyname)
			emprec.setFieldValue('socialsecuritynumber', key_split[x])
			emprec.setFieldValue('isinactive', 'T')
			emprec.setFieldValue('billpay', 'F')
			try
			{
				//Here we will set this as the current Key in this NS instance
				nlapiSubmitRecord(emprec)	
				message = 3
				
			}
			catch (e)
			{
				message = 4 //Error on creation
				error = true
				nlapiLogExecution('Error','Key Master Generation','Current = ' + e.toString() + ' ' + e.getCode());
				break;
			}		
			
		}	

		//Go get hex version of key	for the master to redisplay if successful
		if (!error)
		{
			
			try
			{
				var hex_key_master = ACE.key_from_digits(keydec)	
			}
			catch (e)
			{
				nlapiLogExecution('Error','Hex Key Conversion','Current = ' + e.toString() + ' ' + e.getCode());
			}
		}

		if (!error)
		{
			//First make sure the current key is unset
			var filter_key = new Array();
			filter_key[0] = new nlobjSearchFilter('custrecord_kp_currentkey', null, 'is', 'T');
			var key_results = nlapiSearchRecord('customrecord_piikeystable', null, filter_key, null);
			for (var x = 0; key_results != null && x < key_results.length; x++ )
			{
				nlapiSubmitField('customrecord_piikeystable', key_results[x].getId(), 'custrecord_kp_currentkey', 'F')
			}
			var currkey = nlapiCreateRecord('customrecord_piikeystable')
			currkey.setFieldValue('custrecord_kp_generation', generation)
			currkey.setFieldValue('custrecord_kp_keyname', keyname)
			currkey.setFieldValue('custrecord_kp_currentkey', 'T')
			nlapiSubmitRecord(currkey)
		}
					
	}


createform(message, generation, keyname, keydec, keyhex_entered, hex_key_master)

//nlapiSetRedirectURL('SUITELET', 'customscript_createkeymasters', 1, null, params);	
return;

}

}


function createform(message, generation, keyname, keydec, keyhex_entered, hex_key_master)
{
	var form = nlapiCreateForm('ACE Master Employee Generation');  //Setup the generation form

	var msgline = form.addField('custpage_msgline','inlinehtml', null, null)

	if (message == 1){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Keys Not Generated - Generation Must be 1-2 Characters</span>'}
	else
	if (message == 2){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Keys Not Generated - Key Digits (Hex) Must be 32 Characters In Length</span>'}
	else
	if (message == 3){var msgline = '<span style="font-weight:bold; font-size:110%; color:green">' + 'Keys Sucessfully Generated</span>'}
	else
	if (message == 4){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Fatal Error - Please See Error Message Log</span>'}
	else
	if (message == 5){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Fatal Error - 48 Decimal Digits Not Returned - Please See Error Message Log</span>'}
	else
	if (message == 6){var msgline = '<span style="font-weight:bold; font-size:110%; color:red">' + 'Duplicate Employee Master Key Exists</span>'}
	else
	var msgline = '<span style="font-weight:bold; font-size:110%; color:blue">' + 'Please enter required field to Generate Key </span>'

	
	//Lets begin formatting the form
	form.addField('custpage_generation','text','Key Generation').setDisplaySize(1).setMandatory(true).setLayoutType('normal','startcol')
	form.addField('custpage_keyname','text','Key Name').setMandatory(true)
	form.addField('custpage_keyhex','text','Key').setDisplaySize(60).setMandatory(true)
	
//	message = 3
	//If the key was successfully generated (3) reformat the page, otherwise send back the appropriate message
	if (message == 3)
	{
		form.addField('custpage_user','text','User Generating Key').setDisplayType('inline').setLayoutType('startrow','startcol')
		form.addField('custpage_datetime','text','Date/Time Stamp').setDisplayType('inline')
		form.addField('custpage_keymaster1','text','Master Key SSN1').setDisplayType('inline').setLayoutType('outsidebelow','startrow').setPadding(2)
		form.addField('custpage_keymaster2','text','Master Key SSN2').setDisplayType('inline').setLayoutType('outsidebelow','startrow')
		form.addField('custpage_keymaster3','text','Master Key SSN3').setDisplayType('inline').setLayoutType('outsidebelow','startrow')
		form.addField('custpage_keymaster4','text','Master Key SSN4').setDisplayType('inline').setLayoutType('outsidebelow','startrow')
		form.addField('custpage_keymaster5','text','Master Key SSN5').setDisplayType('inline').setLayoutType('outsidebelow','startrow')
		form.addField('custpage_keymaster6','text','Master Key SSN6').setDisplayType('inline').setLayoutType('outsidebelow','startrow')
		form.addField('custpage_specified','text','Specified Key').setDisplayType('inline').setLayoutType('outsidebelow','startrow').setPadding(1)
		form.addField('custpage_stored','text','Stored Key').setDisplayType('inline').setLayoutType('outsidebelow','startrow')
		form.addField('custpage_keymsg','inlinehtml', null, null).setLayoutType('outsidebelow','startrow').setPadding(1)

		var key_split = new Array()
		key_split[0] = keydec.substring(0,9)
		key_split[1] = keydec.substring(9,18)
		key_split[2] = keydec.substring(18,27)
		key_split[3] = keydec.substring(27,36)
		key_split[4] = keydec.substring(36,45)
		key_split[5] = keydec.substring(45,48)

		if (keyhex_entered == hex_key_master)
			var keymsgline = '<span style="font-weight:bold; font-size:140%; color:green">' + 'Keys Match!</span>'
		else
			var keymsgline = '<span style="font-weight:bold; font-size:140%; color:red">' + 'Failure: Keys Do Not Match</span>'
		
		var user=nlapiGetUser();
		var userName = nlapiLookupField('employee', user, 'entityid');
		var today = new Date()
		
		//Populate the page
		form.setFieldValues({custpage_msgline: msgline, custpage_generation: generation, custpage_keyname : keyname,
		custpage_keyhex: keyhex_entered, custpage_user: userName, custpage_datetime: today,
		custpage_specified: keyhex_entered,	custpage_stored: hex_key_master,
		custpage_keymaster1: generation + ' ' + 1 + ' ' + keyname + ' ' + key_split[0],
		custpage_keymaster2: generation + ' ' + 2 + ' ' + keyname + ' ' + key_split[1],
		custpage_keymaster3: generation + ' ' + 3 + ' ' + keyname + ' ' + key_split[2],
		custpage_keymaster4: generation + ' ' + 4 + ' ' + keyname + ' ' + key_split[3],
		custpage_keymaster5: generation + ' ' + 5 + ' ' + keyname + ' ' + key_split[4],
		custpage_keymaster6: generation + ' ' + 6 + ' ' + keyname + ' ' + key_split[5] + '999999',
		custpage_keymsg: keymsgline})

	}
	else
	form.setFieldValues({custpage_msgline: msgline, custpage_generation: generation, custpage_keyname : keyname,
		                 custpage_keyhex: keyhex_entered})
	
	form.addSubmitButton('Generate');
		
	response.writePage(form);
}