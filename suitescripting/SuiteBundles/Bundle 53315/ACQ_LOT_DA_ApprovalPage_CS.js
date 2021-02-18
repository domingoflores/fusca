!function(window, document, $, undefined) {

    var constructor = function() {
        var isFeeEdit = false,
            self = this;
        
        this.feeWrapper = $('#feeamt');
        this.feeContainer = this.feeWrapper.find('.fee-container');
        this.feeField = this.feeWrapper.find('.fee');
        this.feeInput = $('#feeamt_freetext');
        this.editIcon = this.feeWrapper.find('.fa-pencil-square');
        this.grossField = $('#gross');

        this.getIsFeeEdit = function() {
            return self.isFeeEdit;
        };

        this.setIsFeeEdit = function(val) {
            self.isFeeEdit = val;
        };
        
        this.getFee = function(){
        	return self.feeInput.val() || '';
        };

        this.getDefaultFee = function(){
        	return self.feeInput.data('default-fee') || '';
        };
        
        //Validate fee using regex and value range
        this.validateFee = function() {
            //TODO: Code regex check
            var regEx = /^(\d+|\d+\.\d\d)$/,
            	fee = self.feeInput.val(),
            	gross = self.grossField.attr('data-gross'),
            	feeInt = parseFloat(fee, 10) || 0,
            	grossInt = parseFloat(gross, 10) || 0;
            if (!fee) { fee = ""; }
            if (fee == '' || (regEx.test(fee) && feeInt >= 0 && feeInt <= 100 && feeInt <= grossInt)) {
            	return true;
            }
            else {
                return false;
            }
        };
        
        this.updateFeeLabel = function(){
        	self.feeField.text('$' + parseFloat(Math.abs(self.feeInput.val())).toFixed(2));
        };
        
        this.hideEditFee = function(){
        	self.editIcon.toggleClass('hide');
        	self.feeInput.attr('type', 'hidden');
        	self.feeField.toggleClass('hide');
        };
        
        //Alert that the fee was invalid; no validation logic
        this.alertFee = function(){
        	alert('Invalid fee. Please enter a value of ## or ##.## between 0 and 100 and less than the Payment Gross.');
        };
        
        //Launch confirmation screen for fee editing
        this.feeEditConfirmation = function() {
            if (window.confirm('Are you sure you want to edit Fee?')) {
                self.editFee();
            }
        };
        
        this.isOverDefaultFee = function(){
        	if(self.feeInput.val() > self.feeInput.data('default-fee')){
        		return true;
        	}
        	
        	return false;
        };
        
      //Launch confirmation screen for fee editing
        this.feeOverchargeConfirmation = function() {
            if (!window.confirm('Are you sure you want to raise the fee?')) {
            	var previousFee = self.feeInput.data('prev-fee');
            	self.feeInput.val(previousFee);
            	self.feeField.text(previousFee);
            }
        };

        //Make the the fee editable; hides label, shows input, and highlights/selects input value.
        this.editFee = function() {
            if (!self.getIsFeeEdit()) {
                self.feeInput.attr('type', 'text').attr('data-prev-fee', self.feeInput.val()).select();
                self.feeField.toggleClass('hide');
                self.editIcon.toggleClass('hide');
                self.setIsFeeEdit(true);
            }
        };

        //Show edit icon when entering fee
        this.feeContainer.on('mouseenter', function(e) {
            if (!self.getIsFeeEdit()) {
                self.editIcon.toggleClass('hide');
            }
        });

        //Hide edit icon when leaving fee
        this.feeContainer.on('mouseleave', function(e) {
            if (!self.getIsFeeEdit()) {
                self.editIcon.toggleClass('hide');
            }
        });

        //Launch fee edit when clicking on fee label
        this.feeField.on('click', function(e) {
            if(self.feeField.is(':visible')){
            	self.feeEditConfirmation();
            }
        });
        
        //Validate fee input when it loses focus
        this.feeInput.on('blur', function(e){
        	var validFee = self.validateFee();
        	
        	if(!validFee){
        		self.alertFee();
        	}
        	
        	if(validFee && self.isOverDefaultFee()){
        		self.feeOverchargeConfirmation();
        	}
        	
        	if(self.feeInput.val() === ''){
        		self.feeInput.val(0);
        	}
        	
        	self.setIsFeeEdit(false);
        	self.updateFeeLabel();
        	self.hideEditFee();
        });
    };

    //Expose module to window
    window.DAFeeValidator = new constructor();

}(window, document, jQuery);