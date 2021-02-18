

function buildSuitelet(request, response) {
	if ( request.getMethod() == 'GET' ) {
	            //Create a form.
		try {
		    var context = nlapiGetContext();
				var form = nlapiCreateForm('Visualize Search');
	            
	            var url = nlapiOutboundSSO('customssoichartssso');
	            var destination  = context.getSetting('SCRIPT', 'custscriptichartsdestination');
	            nlapiLogExecution('debug', 'destination' , destination);
	            if (destination != null) {
	            	url = url + '&destination=' + destination;
	            }

	            var content = '<iframe src="'+url+'" align="center" style="width: 1250px; height: 700px; margin:0; border:0; padding:0"></iframe>';
	            
                var iFrame = form.addField('custpage_sso', 'inlinehtml', 'SSO');
                iFrame.setDefaultValue (content);
	            iFrame.setLayoutType('outsidebelow', 'startcol');
	            response.writePage( form );
		} 
		catch ( e )
		{
			if ( e instanceof nlobjError )
				nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
			else
				nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
		}
	}
}

