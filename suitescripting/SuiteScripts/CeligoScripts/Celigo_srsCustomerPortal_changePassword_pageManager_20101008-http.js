/**
 * @author Shiva
 */
var SRS = {};
SRS.WWW = (function(){ //private members
    function PageManager(){
        var that = this;
        
		this.hideElements = function(){			
			var parentTable = jQuery("#currentpassword").parents("table:first");			
			jQuery(parentTable).find("tr").each(function(index){
				if(index >=2 && index <= 6){
					$(this).hide();
				}	 
			});
			jQuery("input#submitter").css({"margin-left": jQuery("#hint").position().left});			
		};
		
        this.changeHeader = function(){
            jQuery("td#main_title").html("Please change your password");
        };
        
        this.addFormSubmit = function(){
            jQuery("#main_form").removeAttr("onsubmit").submit(function(){
                if (window.isinited && window.isvalid && save_record(true)) {
					if (jQuery("#password").val().length == 0) {
						jQuery("#submitted").val("F");
						alert("Please enter value(s) for: New Password");						
						return false;
					}
					return true;
				}
				else {
					return false;
				}
            });
        };
        
        this.getUserInfo = function(){
			jQuery.ajax({
                type: "POST",
                url: "/app/site/hosting/scriptlet.nl?script=76&deploy=1",
                data: {"action": "ui"},
				dataType: "script",
				success: function(msg){
					userInfo = getUserInfo();
					jQuery("span#usrInfo").html(userInfo.name + (userInfo.company ? (", " + userInfo.company) : "") + (userInfo.name ? " | " : ""));
					jQuery("span#srsReconcileInfo").html((userInfo.reconciled ? ("Reconciled as of " + userInfo.reconciled) : ""));
				}
            });	
		};
		
		this.getUserInfoHome = function(){
			if (login_entity) {
				var script = document.createElement('script');
				script.type = 'text/javascript';

				var domain = window.location.hostname;
				if((!domain || domain == null) || (domain && domain != null && domain == "online.shareholderrep.com"))
				{
					domain = "checkout.netsuite.com";
				}

				script.src = "http://" + domain + "/app/site/hosting/scriptlet.nl?script=76&deploy=1&compid=772390&action=ui&page=home";
				
				document.getElementsByTagName('head')[0].appendChild(script);
			}				
		};        
    }
    return { //public members
        getPageManager: function(){
            try {
                return new PageManager();
            } 
            catch (e) {
                alert(e.name + ' : ' + e.message);
            }
        }
    }
})();
var pm = SRS.WWW.getPageManager();
var rExpChangeEmailPwd = new RegExp('(/app/center/changepwd.nl)', 'gi');
if (rExpChangeEmailPwd.exec(document.location.href)) {
	pm.hideElements();    
    pm.changeHeader();
    pm.addFormSubmit();
}
var rExpHome = new RegExp('(http://online.shareholderrep.com/)', 'gi');
if (rExpHome.exec(document.location.href)) {
	pm.getUserInfoHome();
}else{	
	pm.getUserInfo();
}
