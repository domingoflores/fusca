/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [first year code created] Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

function getViewport() {
	var viewPortWidth;
	var viewPortHeight;
	if (typeof window.innerWidth != 'undefined') {
		viewPortWidth = window.innerWidth, viewPortHeight = window.innerHeight
	} else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
		viewPortWidth = document.documentElement.clientWidth, viewPortHeight = document.documentElement.clientHeight
	} else {
		viewPortWidth = document.getElementsByTagName('body')[0].clientWidth, viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
	}
	return [viewPortWidth, viewPortHeight];
}

var EchoSign = {};

var constrainHandler = function(){
	this.doConstrain();
};

EchoSign.showHostSigningModal = function(iframeSrc){
	//make iframe
	var hostSignIframe = document.getElementById('echosign-hostsigning-modal');
	var hostSignShown = false;

	if (!hostSignIframe) {
		hostSignIframe = document.createElement('iframe');
		hostSignIframe.id = 'echosign-hostsigning-modal';
		hostSignIframe.style.display = 'block';
		hostSignIframe.style.width = '100%';
		hostSignIframe.style.height = '100%';
		hostSignIframe.style.margin = 'auto auto';
		hostSignIframe.style.padding = '0';
		hostSignIframe.style.backgroundColor = 'transparent';
		hostSignIframe.style.border = '0';
		hostSignIframe.allowTransparency = 'true';
		hostSignIframe.style.overflow = 'hidden';
	}

	hostSignIframe.src = iframeSrc;

	//use ext if possible
	if (typeof Ext !== 'undefined' && Ext.Window) {
		var vp = getViewport();
		var x = vp[0] > 1000 ? 1000 : vp[0];
		var y = vp[1] > 690 ? 690 : vp[1];

		if (!this.hostSignWin) {
			this.hostSignWin = new Ext.Window({
				constrain: true,
				width: x,
				height: y,
				autoScroll: false,
				html: '',
				modal: true,
				maximizable: false,
				closeAction: 'hide',

				onShow: function() {
					hostSignShown = true;
					this.body.appendChild(hostSignIframe);

					this.on('move', constrainHandler);
				},

				onHide: function() {
					if(hostSignShown === true){
						hostSignShown = false;
						EchoSign.Manager.updateStatusInteractive();
					}

					this.removeListener('move', constrainHandler);
				}
			});
		}

		this.hostSignWin.show();

	} else {
		var wrapperDiv = document.createElement('div');
		wrapperDiv.id = 'echosign-hostsigning-modal-wrapper';
		wrapperDiv.style.position = 'absolute';
		wrapperDiv.style.top = '0px';
		wrapperDiv.style.right = '0px';
		wrapperDiv.style.left = '0px';
		wrapperDiv.style.bottom = '0px';
		wrapperDiv.style.zIndex = '100';
		wrapperDiv.style.backgroundColor = '#C0C0C0';
		wrapperDiv.style.opacity = '0.5';

		var iframeDiv = document.createElement('div');
		iframeDiv.id = 'eechosign-hostsigning-modal-container';
		iframeDiv.style.position = 'absolute';
		iframeDiv.style.top = '0px';
		iframeDiv.style.right = '0px';
		iframeDiv.style.left = '0px';
		iframeDiv.style.bottom = '0px';
		iframeDiv.style.paddingLeft = '80px';
		iframeDiv.style.paddingRight = '80px';
		iframeDiv.style.paddingTop = '80px';
		iframeDiv.style.paddingBottom = '80px';
		iframeDiv.style.zIndex = '100';
		iframeDiv.style.textAlign = 'center';

		iframe.style.display = 'block';
		iframeDiv.appendChild(iframe);
		document.body.appendChild(wrapperDiv);
		document.body.appendChild(iframeDiv);
	}
};

EchoSign.showInteractive = function(iframeSrc) {

	//make iframe
	var iframe = document.getElementById('echosign-sendDocument-interactvie-modal');

	if (!iframe) {
		iframe = document.createElement('iframe');
		iframe.id = 'echosign-sendDocument-interactvie-modal';
		iframe.style.display = 'block';
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.margin = 'auto auto';
		iframe.style.padding = '0';
		iframe.style.backgroundColor = 'transparent';
		iframe.style.border = '0';
		iframe.allowTransparency = 'true';
		iframe.style.overflow = 'hidden';
	}

	iframe.src = iframeSrc;
	var shown = false;
		updating = false;

	//use ext if possible
	if (typeof Ext !== 'undefined' && Ext.Window) {
		var vp = getViewport();
		var x = vp[0] > 1000 ? 1000 : vp[0];
		var y = vp[1] > 690 ? 690 : vp[1];

		if (!this.extWin) {
			this.extWin = new Ext.Window({
				constrain: true,
				width: x,
				height: y,
				autoScroll: false,
				html: '',
				modal: true,
				maximizable: false,
				closeAction: 'hide',

				onShow: function() {
					this.body.appendChild(iframe);
					shown = true;

					this.on('move', constrainHandler);
				},

				onHide: function() {
					if (shown === true) {
						//should also sign out at https://secure.echosign.com/public/logout
						//this is done only this way because IE does not support focus on hidden elements so the whole log out page actually needs to be shown
						var newIframe = document.createElement('iframe');
						newIframe.id = 'echosign-log-out';
						newIframe.style.height = 0;
						newIframe.style.width = 0;
						newIframe.style.zIndex = 99;
						newIframe.style.position = 'absolute';
						newIframe.src = 'https://secure.echosign.com/public/logout';

						var loadingWheelDiv = document.createElement('div');
						loadingWheelDiv.style.width = '100%';
						loadingWheelDiv.style.height = '100%';
						loadingWheelDiv.style.textAlign = 'center';
						loadingWheelDiv.style.backgroundImage = 'url("https://secure.echocdn.com/images/bg.interstitial.gif")';
						loadingWheelDiv.style.fontSize = '40px';
						loadingWheelDiv.style.color = '#FFFFFF';
						loadingWheelDiv.style.paddingTop = '10px';
						loadingWheelDiv.style.zIndex = 100;
						loadingWheelDiv.innerHTML = 'Updating Status...';
						//make a new extWindow
						var newExtWindow = new Ext.Window({
							layout: 'fit',
							width: 500,
							height: 80,
							autoScroll: false,
							modal: true,
							maximizable: false,
							frame:false,
							border: false,
							bodyBorder: false,
							bodyPadding: 0,
							closable: false,

							onShow: function() {
								newIframe.onload = function() {
									updating = true;
									EchoSign.Manager.updateStatusInteractive();
								};

								this.body.appendChild(loadingWheelDiv);
								document.body.appendChild(newIframe);
								//IE(8) does not support iframe onload, workaround wait for a few seconds and force an update
								setTimeout(function() {
									try{
										if(!updating)
											EchoSign.Manager.updateStatusInteractive();
									}catch(exx){
										alert(exx.message);
									}
								}, 2500);
							}
						});

						newExtWindow.show();
					}
					shown = false;
					this.removeListener('move', constrainHandler);
				}
			});
		}

		this.extWin.show();

	} else {
		var wrapperDiv = document.createElement('div');
		wrapperDiv.id = 'echosign-sendDocument-interactvie-modal-wrapper';
		wrapperDiv.style.position = 'absolute';
		wrapperDiv.style.top = '0px';
		wrapperDiv.style.right = '0px';
		wrapperDiv.style.left = '0px';
		wrapperDiv.style.bottom = '0px';
		wrapperDiv.style.zIndex = '100';
		wrapperDiv.style.backgroundColor = '#C0C0C0';
		wrapperDiv.style.opacity = '0.5';

		var iframeDiv = document.createElement('div');
		iframeDiv.id = 'echosign-sendDocument-interactvie-modal-container';
		iframeDiv.style.position = 'absolute';
		iframeDiv.style.top = '0px';
		iframeDiv.style.right = '0px';
		iframeDiv.style.left = '0px';
		iframeDiv.style.bottom = '0px';
		iframeDiv.style.paddingLeft = '80px';
		iframeDiv.style.paddingRight = '80px';
		iframeDiv.style.paddingTop = '80px';
		iframeDiv.style.paddingBottom = '80px';
		iframeDiv.style.zIndex = '100';
		iframeDiv.style.textAlign = 'center';

		iframe.style.display = 'block';
		iframeDiv.appendChild(iframe);
		document.body.appendChild(wrapperDiv);
		document.body.appendChild(iframeDiv);
	}
};

EchoSign.Manager = (function() { // private members

	function WindowOpener() {
		var that = this;
		var log = function() {
				if (typeof console === 'object') console.log.apply(console, Array.prototype.slice.call(arguments));
			};

		this.sendMessage = function(url) {
			var updateRes = nlapiRequestURL(url);
			return updateRes;
		};

		this.getDetailedErrorMessage = function(errorMsg){
			var detailedErrorMsg = "";
			if (errorMsg.indexOf('Invalid Access Token') > -1 ||
				errorMsg.indexOf('Access token provided is invalid or has expired') > -1) {
							 detailedErrorMsg = '<img src="https://system.netsuite.com/core/media/media.nl?id=5873&c=TSTDRV1332459&h=7f39dfa92c0f5e5ff30f" alt="echosign.png" width="198" height="53">' + '<H1>Access token provided is invalid or has expired. </H1>' + '<p>' + 'If you already have an Adobe eSign services account, please contact your account administrator.' + '<br/>' + 'If you do not have an Adobe eSign services account, <a href="https://secure.echosign.com/public/upgrade?type=enterprise_trial&cs=ns_bundle">Sign up now</a> for a FREE 30 day trial' + '</p>';

							
			} 
			else if(errorMsg.indexOf('Invalid user ID or email provided in x-user header') > -1){
				detailedErrorMsg = '<img src="https://system.netsuite.com/core/media/media.nl?id=5873&c=TSTDRV1332459&h=7f39dfa92c0f5e5ff30f" alt="echosign.png" width="198" height="53">' + '<H1>You do not have permission to send an agreement. </H1>' + '<p>' + 'If you already have an Adobe eSign services account, please contact your account administrator.' + '<br/>' + 'If you do not have an Adobe eSign services account, <a href="https://secure.echosign.com/public/upgrade?type=enterprise_trial&cs=ns_bundle">Sign up now</a> for a FREE 30 day trial' + '</p>';
			}
			else {
				detailedErrorMsg =  '<h3>Error<h3/><br/>' + errorMsg;
			}
			return detailedErrorMsg;
		};
		
		this.setSendAnimation = function() {
			var html = '';
			html += '<h3>Sending Agreement</h3><br/>';
			html += '<img src="https://system.netsuite.com/core/media/media.nl?id=5827&c=TSTDRV1332459&h=91aae45dce95ca820e0f" />';
			nlapiSetFieldValue('custpage_echosign_progress', html, false, true);

			// due to a NS bug
			if (nlapiGetFieldValue('custrecord_echosign_senddocinteractive') === 'T') {
				setTimeout(function() {
					nlapiSetFieldValue('custpage_echosign_progress', '', false, true);
				}, 5000);
			}
		};

		this.unsetSendAnimation = function() {
			nlapiSetFieldValue('custpage_echosign_progress', '', false, true);
		};

		this.sendReminder = function() {
			var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', false);
			url += '&echoaction=sendReminder';
			url += '&recid=' + nlapiGetRecordId();
			try {
				var res = nlapiRequestURL(url);
				res = JSON.parse(res.getBody());
				
				if (res && res.success) {

					alert(res.msg);

				} else {
					throw new Error(res.msg);
				}
			} catch (e) {
				log(e);
				if(e.message)
					alert(e.message);
				else
					alert('Error in response, API might not be available.');
			}
		};

		this.updateStatusInteractive = function() {
			//call update
			var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', false);
			url += '&echoaction=updateStatus';
			url += '&recid=' + nlapiGetRecordId();
			try {
				var updateResponse = nlapiRequestURL(url);
				var resObj = JSON.parse(updateResponse.getBody());
				if (!resObj.success || resObj.success !== true) throw resObj;

				window.location.reload();

			} catch (ex) {
				log(ex);
				alert('Error updating status from EchoSign');
			}
		};

		this.sendSign = function() {
			if (nlapiGetFieldValue('custpage_echosign_inter_url')) {
				EchoSign.showInteractive(nlapiGetFieldValue('custpage_echosign_inter_url'));
				return;
			}

			if (nlapiGetFieldValue('custrecord_echosign_dont_act') === 'F') {
				try {
					nlapiSetFieldValue('custrecord_echosign_dont_act', 'T', false, true);
				} catch (e) {
					alert('Error Setting Field');
				}
				that.setSendAnimation();

				var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', false);
				url += '&echoaction=sendDocument';
				url += '&recid=' + nlapiGetRecordId();
				var updateResponse = that.sendMessage(url);

				that.unsetSendAnimation();

				var jsonResponse = JSON.parse(updateResponse.getBody());
				log(jsonResponse);

				try {
					if (jsonResponse && jsonResponse.isInteractive && jsonResponse.success && jsonResponse.url) {
						nlapiSetFieldValue('custpage_echosign_inter_url', jsonResponse.url);
						nlapiSetFieldValue('custpage_echosign_inter_url_click', '<a href="#" onclick="EchoSign.showInteractive();">Interactive Document</a>');

						if (nlapiGetFieldValue('custpage_echosign_inter_url')) {
							EchoSign.showInteractive(nlapiGetFieldValue('custpage_echosign_inter_url'));
						}

						nlapiSetFieldValue('custrecord_echosign_dont_act', 'F');
						return;
					}
				} catch (ex) {
					throw ex;
				}

				//if success
				if (jsonResponse.success) {
					var esignUrl = nlapiLookupField('customrecord_echosign_agreement', nlapiGetRecordId(), 'custrecord_celigo_agreement_link');
					if (esignUrl) {
						var link = esignUrl.replace("<a onclick=\"EchoSign.showHostSigningModal('", "").replace("');\" href=\"#\">Host Signing for the Current Signer</a>", "");
						EchoSign.showHostSigningModal(link);
					}
					else{
						window.setTimeout("history.go(0);", 1000);
					}
				} else {
					//no success
					nlapiSetFieldValue('custpage_echosign_progress', that.getDetailedErrorMessage(jsonResponse.msg));
					if (jsonResponse.errorCode === 'SSS_REQUEST_TIME_EXCEEDED') {
						EchoSign.Manager.main = EchoSign.Manager.showPendingSendMessage;
					}
				}

				nlapiSetFieldValue('custrecord_echosign_dont_act', 'F');
			} else alert('This Record is processing');
		};

		this.closePopup = function() {
			self.close();
		};

		this.openUpdate = function() {
			if (nlapiGetFieldValue('custrecord_echosign_dont_act') === 'F') {
				try {
					nlapiSetFieldValue('custrecord_echosign_dont_act', 'T');
				} catch (e) {

				}
				var html = '';
				html += '<h3>Updating Agreement</h3><br/>';
				nlapiSetFieldValue('custpage_echosign_progress', html);
				html += '<img src="https://system.netsuite.com/core/media/media.nl?id=5827&c=TSTDRV1332459&h=91aae45dce95ca820e0f" />';
				nlapiSetFieldValue('custpage_echosign_progress', html);
				var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', false);
				url += '&echoaction=updateStatus';
				url += '&recid=' + nlapiGetRecordId();
				var updateResponse = nlapiRequestURL(url);
				var responseBody = JSON.parse(updateResponse.getBody());
				nlapiLogExecution('DEBUG', 'openUpdate suitelet responseBody', responseBody);
				if (responseBody.success === true) {
					window.location.reload();
				} else {
					nlapiSetFieldValue('custpage_echosign_progress', that.getDetailedErrorMessage(responseBody.msg));
				}
				nlapiSetFieldValue('custrecord_echosign_dont_act', 'F');
			}
		};

		this.openCancel = function() {
			if (nlapiGetFieldValue('custrecord_echosign_dont_act') === 'F') {
				try {
					nlapiSetFieldValue('custrecord_echosign_dont_act', 'T');
				} catch (e) {

				}
				var html = '';
				html += '<h3>Cancelling Agreement</h3><br/>';
				nlapiSetFieldValue('custpage_echosign_progress', html);
				html += '<img src="https://system.netsuite.com/core/media/media.nl?id=5827&c=TSTDRV1332459&h=91aae45dce95ca820e0f" />';
				nlapiSetFieldValue('custpage_echosign_progress', html);
				var url = nlapiResolveURL('SUITELET', 'customscript_echosign_service_manager', 'customdeploy_echosign_service_manager_de', false);
				url += '&echoaction=cancelAgreement';
				url += '&recid=' + nlapiGetRecordId();
				var updateResponse = nlapiRequestURL(url);
				var responseBody = JSON.parse(updateResponse.getBody());
				if (responseBody.success === true) {
					window.location.reload();
				} else {
					nlapiSetFieldValue('custpage_echosign_progress', that.getDetailedErrorMessage(responseBody.msg));
				}
				nlapiSetFieldValue('custrecord_echosign_dont_act', 'F');
			}
		};
	}

	function Validator() {
		var
		enablePassword = function() {
				nlapiDisableField('custpage_echosign_password', false);
				nlapiDisableField('custpage_echosign_confirm', false);
			},

			disablePassword = function() {
				nlapiDisableField('custpage_echosign_password', true);
				nlapiDisableField('custpage_echosign_confirm', true);
			},

			displayPassword = function() {
				if ((nlapiGetFieldValue('custpage_echosign_security_option') !== 'T' && nlapiGetFieldValue('custpage_echosign_security_option') !== 'password' || nlapiGetFieldValue('custpage_echosign_use_security_options') === 'F') && nlapiGetFieldValue('custrecord_echosign_protect_view') === 'F') disablePassword();
				else enablePassword();
			};


		this.validate = function(type, name, linenum) {
			if (name === 'custpage_echosign_sigorder') {
				if (nlapiGetFieldValue('custrecord_echosign_sender_signs') === 'T') {
					if (nlapiGetFieldValue('custpage_echosign_sigorder') === '3') return false;
					else return true;
				} else {
					if (nlapiGetFieldValue('custpage_echosign_sigorder') === '3') return true;
					else return false;
				}
			}

			//fax sign and host signing
			if (name === 'custpage_echosign_sigtype' || name === 'custrecord_celigo_host_agreement_signer') {
				if (nlapiGetFieldValue('custpage_echosign_sigtype') == '2' && nlapiGetFieldValue('custrecord_celigo_host_agreement_signer') === 'T') {
					alert('Cannot host signing for fax signature.');
					return false;
				}

				return true;
			}

			//change parent record
			if (name === 'custpage_echosign_parent_record') {

				if (!nlapiGetFieldValue('custrecord_echosign_parent_type')) return true;

				//check parent record has the same type
				try {
					if (nlapiGetFieldValue('custpage_echosign_parent_record') != nlapiLookupField(nlapiGetFieldValue('custrecord_echosign_parent_type'), nlapiGetFieldValue('custpage_echosign_parent_record'), 'internalid')) throw new Error();

					nlapiSetFieldValue('custrecord_echosign_parent_record', nlapiGetFieldValue('custpage_echosign_parent_record'));
					return true;
				} catch (ex) {
					alert('Cannot change parent record type.');
					return false;
				}

			}

			return true;
		};

		/* Added by Srikrishna - to display the host agreement checkbox only when there is a signer associated with the agreement*/
		this.changeField = function(type, name, linenum) {

			if (name === 'custpage_echosign_signer') {
				var contactId = nlapiGetCurrentLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer');
				if (contactId !== null && contactId.length !== 0) {
					var contactEmail = nlapiLookupField('contact', contactId, 'email');
					if (contactEmail !== null) nlapiSetCurrentLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_email', contactEmail);
				}
			}

			if (name === 'custrecord_celigo_agreement_expiration') {
				try {
					var expd = nlapiGetFieldValue('custrecord_celigo_agreement_expiration');
					if (!expd) {
						return;
					}
					var ed = nlapiStringToDate(expd);
					var cd = new Date();

					var daysdiff = (ed.getTime() - cd.getTime()) / (60 * 60 * 24 * 1000);
					var d = (parseInt(daysdiff, 10)) + 1;
					if (d > 0) {
						nlapiSetFieldValue('custrecord_celigo_allow_x_days_to_sign', d);
					}
				} catch (e) {
					nlapiLogExecution('DEBUG', 'Invalid Date' + e);
				}
			}

			if (name === 'custrecord_echosign_sender_signs' && nlapiGetFieldValue('custrecord_echosign_sender_signs') === 'T') {
				if (nlapiGetFieldValue('custpage_echosign_sigorder') === '3') {
					nlapiSetFieldValue('custpage_echosign_sigorder', '2', false);
				}
			}
			if (name === 'custrecord_echosign_sender_signs' && nlapiGetFieldValue('custrecord_echosign_sender_signs') === 'F') {
				if (nlapiGetFieldValue('custpage_echosign_sigorder') !== '3') {
					nlapiSetFieldValue('custpage_echosign_sigorder', '3', false);
				}
			}

			if (name === 'custpage_echosign_use_security_options') {
				if (nlapiGetFieldValue('custpage_echosign_use_security_options') === 'T') {
					nlapiDisableField('custpage_echosign_security_option', false);
				} else {
					nlapiSetFieldValue('custrecord_echosign_protect_sign', 'F');
					nlapiSetFieldValue('custrecord_echosign_kba_protect', 'F');
					nlapiSetFieldValue('custrecord_echosign_webid_protect', 'F');
					nlapiDisableField('custpage_echosign_security_option', true);
				}
				displayPassword();
			}

			if (name === 'custpage_echosign_security_option' || name === 'custrecord_echosign_protect_view') {
				//set the actual fields
				switch (nlapiGetFieldValue('custpage_echosign_security_option')) {
				case 'T':
					nlapiSetFieldValue('custrecord_echosign_protect_sign', 'T');
					break;
				case 'F':
					nlapiSetFieldValue('custrecord_echosign_protect_sign', 'F');
					break;

				case 'password':
					nlapiSetFieldValue('custrecord_echosign_protect_sign', 'T');
					nlapiSetFieldValue('custrecord_echosign_kba_protect', 'F');
					nlapiSetFieldValue('custrecord_echosign_webid_protect', 'F');
					break;

				case 'kba':
					nlapiSetFieldValue('custrecord_echosign_protect_sign', 'F');
					nlapiSetFieldValue('custrecord_echosign_kba_protect', 'T');
					nlapiSetFieldValue('custrecord_echosign_webid_protect', 'F');
					break;

				case 'webid':
					nlapiSetFieldValue('custrecord_echosign_protect_sign', 'F');
					nlapiSetFieldValue('custrecord_echosign_kba_protect', 'F');
					nlapiSetFieldValue('custrecord_echosign_webid_protect', 'T');
					break;

				default:
					break;
				}

				//figure out password
				displayPassword();
			}

		};

		this.recalc = function(type) {
			var hostSigner = false;
			//nlapiDisableField('custrecord_celigo_host_agreement_signer', true);
			var signersCount = nlapiGetLineItemCount('custpage_echosign_reclist');
			for (var i = 1; signersCount && i <= signersCount; i++) {
				if (parseInt(nlapiGetLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i), 10) === 1) hostSigner = true;
			}
			if (hostSigner) {
				//nlapiDisableField('custrecord_celigo_host_agreement_signer', false);
			}
			return true;
		};

		this.validateLine = function(type) {
			if (type === 'custpage_echosign_reclist') {
				/*if (parseInt(nlapiGetFieldValue('custrecord_echosign_status'), 10) === 1) {
                 if (parseInt(nlapiGetCurrentLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role'), 10) === 1) {
                 nlapiDisableField('custrecord_celigo_host_agreement_signer', false);
                 }
                 var signersCount = nlapiGetLineItemCount('custpage_echosign_reclist');
                 var hostSigner = false;
                 for (var i = 1; signersCount && i <= signersCount; i++) {
                 if (parseInt(nlapiGetLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i), 10) === 1)
                 hostSigner = true;
                 }
                 if (hostSigner) {
                 nlapiDisableField('custrecord_celigo_host_agreement_signer', false);
                 }
                 }*/
				if (nlapiGetCurrentLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_email') !== null && nlapiGetCurrentLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_email').length !== 0) {
					return true;
				} else {
					alert('Please enter in an email');
					return false;
				}
			} else return true;
		};

		this.saveRec = function() {
			if (((nlapiGetFieldValue('custpage_echosign_use_security_options') === 'T' || nlapiGetFieldValue('custpage_echosign_use_security_options') ==  null) && nlapiGetFieldValue('custrecord_echosign_protect_sign') === 'T') || nlapiGetFieldValue('custrecord_echosign_protect_view') === 'T') {
				if (nlapiGetFieldValue('custpage_echosign_password') !== null && nlapiGetFieldValue('custpage_echosign_password').length !== 0) {
					if (nlapiGetFieldValue('custpage_echosign_confirm') === null || nlapiGetFieldValue('custpage_echosign_confirm').length === 0) {
						alert('Please fill in confirm password field');
						return false;
					} else if (nlapiGetFieldValue('custpage_echosign_confirm') == nlapiGetFieldValue('custpage_echosign_password')) {
						return true;
					} else {
						alert("Password Fields Don't Match");
						return false;
					}
				}
				if (nlapiGetFieldValue('custpage_echosign_confirm') !== null && nlapiGetFieldValue('custpage_echosign_confirm').length !== 0) {
					if (nlapiGetFieldValue('custpage_echosign_password') === null || nlapiGetFieldValue('custpage_echosign_password').length === 0) {
						alert('Please fill in password field');
						return false;
					} else if (nlapiGetFieldValue('custpage_echosign_confirm') == nlapiGetFieldValue('custpage_echosign_password')) {
						return true;
					} else {
						alert("Password Fields Don't Match");
						return false;
					}
				}
				if (nlapiGetFieldValue('custrecord_echosign_password') === null || nlapiGetFieldValue('custrecord_echosign_password').length === 0) {
					if (nlapiGetFieldValue('custpage_echosign_password') === null || nlapiGetFieldValue('custpage_echosign_password').length === 0) {
						alert('Please fill in password field');
						return false;
					} else if (nlapiGetFieldValue('custpage_echosign_confirm') === null || nlapiGetFieldValue('custpage_echosign_confirm').length === 0) {
						alert('Please fill in confirm password field');
						return false;
					} else if (nlapiGetFieldValue('custpage_echosign_confirm') !== nlapiGetFieldValue('custpage_echosign_password')) {
						alert("Password Fields Don't Match");
						return false;
					} else return true;

				}
			}
			return true;
		};
	}

	return { // public members
		main: function() {
			(new WindowOpener()).sendSign();
		},
		updateStatusInteractive: function() {
			(new WindowOpener()).updateStatusInteractive();
		},
		sendReminder: function() {
			(new WindowOpener()).sendReminder();
		},
		update: function() {
			(new WindowOpener()).openUpdate();
		},
		cancel: function() {
			(new WindowOpener()).openCancel();
		},
		killall: function() {
			(new WindowOpener()).closePopup();
		},
		pageInit: function(type) {
			if (type === 'create' || type === 'edit') {
				if (nlapiGetFieldText('custrecord_echosign_status') === 'Draft') {
					var hostSigner = false;
					//nlapiDisableField('custrecord_celigo_host_agreement_signer', true);
					var signersCount = nlapiGetLineItemCount('custpage_echosign_reclist');
					for (var i = 1; signersCount && i <= signersCount; i++) {
						if (parseInt(nlapiGetLineItemValue('custpage_echosign_reclist', 'custpage_echosign_signer_role', i), 10) === 1) hostSigner = true;
					}
					if (hostSigner) {
						//nlapiDisableField('custrecord_celigo_host_agreement_signer', false);
					}
				} else {
					//nlapiDisableField('custrecord_celigo_host_agreement_signer', true);
					nlapiDisableField('custrecord_celigo_agreement_expiration', true);
				}
			}
			return true;
		},

		fieldChanged: function(type, name, linenum) {
			(new Validator()).changeField(type, name, linenum);
		},
		validateField: function(type, name, linenum) {
			return (new Validator()).validate(type, name, linenum);
		},
		validateLine: function(type) {
			return (new Validator()).validateLine(type);
		},
		recalc: function(type) {
			return (new Validator()).recalc(type);
		},
		saveRecord: function() {
			return (new Validator()).saveRec();
		},
		showPendingSendMessage: function() {
			var errMsg = ['Sending the agreement to Adobe EchoSign is in progress. You cannot', 'edit or resend this agreement at this moment. The agreement status', 'will be updated within several minutes.'].join('<br/>');

			nlapiSetFieldValue('custpage_echosign_progress', '<h3>Error</h3><br/>' + errMsg);
		}
	};
})();

pageInit = function(type) {
	EchoSign.Manager.pageInit(type);
};

fieldChanged = function(type, name, linenum) {
	EchoSign.Manager.fieldChanged(type, name, linenum);
};

validateField = function(type, name, linenum) {
	return EchoSign.Manager.validateField(type, name, linenum);
};

saveRecord = function() {
	return EchoSign.Manager.saveRecord();
};

validateLine = function(type) {
	return EchoSign.Manager.validateLine(type);
};

recalc = function(type) {
	return EchoSign.Manager.recalc(type);
};

// json2.js
this.JSON || (this.JSON = {});
(function() {
	function k(b) {
		return b < 10 ? "0" + b : b
	}
	function o(b) {
		p.lastIndex = 0;
		return p.test(b) ? '"' + b.replace(p, function(b) {
			var c = r[b];
			return typeof c === "string" ? c : "\\u" + ("0000" + b.charCodeAt(0).toString(16)).slice(-4)
		}) + '"' : '"' + b + '"'
	}
	function m(b, i) {
		var c, d, h, n, g = e,
			f, a = i[b];
		a && (typeof a === "object" && typeof a.toJSON === "function") && (a = a.toJSON(b));
		typeof j === "function" && (a = j.call(i, b, a));
		switch (typeof a) {
		case "string":
			return o(a);
		case "number":
			return isFinite(a) ? "" + a : "null";
		case "boolean":
		case "null":
			return "" + a;
		case "object":
			if (!a) return "null";
			e = e + l;
			f = [];
			if (Object.prototype.toString.apply(a) === "[object Array]") {
				n = a.length;
				for (c = 0; c < n; c = c + 1) f[c] = m(c, a) || "null";
				h = f.length === 0 ? "[]" : e ? "[\n" + e + f.join(",\n" + e) + "\n" + g + "]" : "[" + f.join(",") + "]";
				e = g;
				return h
			}
			if (j && typeof j === "object") {
				n = j.length;
				for (c = 0; c < n; c = c + 1) {
					d = j[c];
					if (typeof d === "string")(h = m(d, a)) && f.push(o(d) + (e ? ": " : ":") + h)
				}
			} else for (d in a) if (Object.hasOwnProperty.call(a, d))(h = m(d, a)) && f.push(o(d) + (e ? ": " : ":") + h);
			h = f.length === 0 ? "{}" : e ? "{\n" + e + f.join(",\n" + e) + "\n" + g + "}" : "{" + f.join(",") + "}";
			e = g;
			return h
		}
	}
	if (typeof Date.prototype.toJSON !== "function") {
		Date.prototype.toJSON = function() {
			return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + k(this.getUTCMonth() + 1) + "-" + k(this.getUTCDate()) + "T" + k(this.getUTCHours()) + ":" + k(this.getUTCMinutes()) + ":" + k(this.getUTCSeconds()) + "Z" : null
		};
		String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {
			return this.valueOf()
		}
	}
	var q = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		p = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		e, l, r = {
			"\u0008": "\\b",
			"\t": "\\t",
			"\n": "\\n",
			"\u000c": "\\f",
			"\r": "\\r",
			'"': '\\"',
			"\\": "\\\\"
		},
		j;
	if (typeof JSON.stringify !== "function") JSON.stringify = function(b, i, c) {
		var d;
		l = e = "";
		if (typeof c === "number") for (d = 0; d < c; d = d + 1) l = l + " ";
		else typeof c === "string" && (l = c);
		if ((j = i) && typeof i !== "function" && (typeof i !== "object" || typeof i.length !== "number")) throw Error("JSON.stringify");
		return m("", {
			"": b
		})
	};
	if (typeof JSON.parse !== "function") JSON.parse = function(b, e) {
		function c(b, d) {
			var g, f, a = b[d];
			if (a && typeof a === "object") for (g in a) if (Object.hasOwnProperty.call(a, g)) {
				f = c(a, g);
				f !== void 0 ? a[g] = f : delete a[g]
			}
			return e.call(b, d, a)
		}
		var d;
		q.lastIndex = 0;
		q.test(b) && (b = b.replace(q, function(b) {
			return "\\u" + ("0000" + b.charCodeAt(0).toString(16)).slice(-4)
		}));
		if (/^[\],:{}\s]*$/.test(b.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
			d = eval("(" + b + ")");
			return typeof e === "function" ? c({
				"": d
			}, "") : d
		}
		throw new SyntaxError("JSON.parse");
	}
})();