'use strict';



//DO NOT Export, keep private

var ENVIRONMENTS = {

	prod: "PRODUCTION",

	stage: "STAGING",

	dev: "DEV"

};



function OdsSyncReq(https,options){

	this.https = https;

	this.auth = null;

	this.odsEnv = null;

	this.headers = null;

	this.options = options;

	this.url = null;

	this.apiVersion = 2;

	this.envList = {

		prod: "PRODUCTION",

		stage: "STAGING",

		dev: "DEV"

	};

}



OdsSyncReq.prototype.setURL = function(){

	if(this.odsEnv === null){

		log.error({

			title: "Malformed ODS Sync Request",

			details: "Attempted to Set url Before Assigning ODS Environment"

		});

		return;

	}

	if(this.odsEnv === ENVIRONMENTS.prod){

		this.url = "https://prd.bpapi.srsiq.com/sync/fds/netsuite?";

	}else if(this.odsEnv === ENVIRONMENTS.stage){

		  this.url = "https://stg.bpapi.srsiq.com/sync/fds/netsuite?";

	} else if(this.odsEnv === ENVIRONMENTS.dev){

		this.url = "https://dev.bpapi.srsiq.com/sync/fds/netsuite?";

	}

	if(this.url !== null){

		this.addOptionsToURL();

	}

};



OdsSyncReq.prototype.setOdsEnv = function(odsEnv){

	this.odsEnv = odsEnv;

};



OdsSyncReq.prototype.setHeaders = function(headers){

	if(headers){

		if(!headers["Authorization"]){

			if(this.auth === null){

				log.error({

					title: "Malformed ODS Sync Request Header",

					details: "Attempted to Set Header Before Assigning Authorzation Key"

				});

				return;

			}

			headers["Authorization"] = this.auth;

		}

		this.headers = headers;

	} else {

		if(this.auth === null){

			log.error({

				title: "Malformed ODS Sync Request Header",

				details: "Attempted to Set Header Before Assigning Authorzation Key"

			});

			return;

		}

		this.headers = {"Authorization": this.auth};

	}

};



OdsSyncReq.prototype.setOptions = function(options){

	this.options = options;

	if(this.url === null){

		return;

	}

	this.addOptionsToURL();

};



OdsSyncReq.prototype.addOptionsToURL = function(){

	if(this.options){

		for (var option in this.options) {

			this.url += option + "=" + this.options[option] + "&";

		}

	}

	log.debug({

		title: "URL",

		details: this.url

	});

}



OdsSyncReq.prototype.setAuth = function(auth){

	this.auth = auth;

};



OdsSyncReq.prototype.isValid = function(){

	if(this.url === null){

		log.error({

			title: "Malformed ODS Sync Request",

			details: "Missing Argument: url"

		});

		return false;

	}

	if(this.odsEnv === null){

		log.error({

			title: "Malformed ODS Sync Request",

			details: "Missing Argument: odsEnv"

		});

		return false;

	}

	if(this.auth === null){

		log.error({

			title: "Malformed ODS Sync Request",

			details: "Missing Argument: auth"

		});

		return false;

	}

	if(!this.https){

		log.error({

			title: "Malformed ODS Sync Request",

			details: "Missing Argument: https"

		});

		return false;

	}

	return true;

}



OdsSyncReq.prototype.sendRequest = function(){

	this.setURL();

	if(!this.isValid()){

		return;

	}

	var response = this.https.get({

		url: this.url,

		headers: this.headers

	});

	

	log.debug({

		title: "RESPONSE",

		details: response

	});

	return response;

}







