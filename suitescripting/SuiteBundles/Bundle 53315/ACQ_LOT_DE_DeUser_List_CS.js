/**
 * Module Description
 * 
 * Version 	Date 		Author 		Remarks 
 * 1.00 	30 Jul 2014 smccurry 	This is a new start on Dual Entry using the DataTables jQuery plugin as the basis.
 * 1.01 	01 Aug 2014 smccurry 	Installed the initial working version on Production.
 * 1.02 	04 Aug 2014 smccurry 	Reverted back to the version that uses Arrays for the row data because objects were not working on the Production version. This version is in local GIT
 * 1.03 	04 Aug 2014 smccurry 	Changed back to the Object version of the DataTable jQuery function.
 * 1.04 	19 Aug 2014 smccurry 	Copied the current version from Production to Development.
 *
 */

var NS_ROLE_OFFSITE_DUALENTRY = '1068';


$(document).ready(function() {
	reloadCount = 0;
	$.fn.dataTableExt.sErrMode = 'throw';
	var table = $('#example').DataTable({
	stateSave : false, //stateSave true does not work with filters. The filter states are not saved so it can get confusing.
	"ajax" : {
	"url" : "/app/site/hosting/restlet.nl?script=customscript_acq_lot_de_restful_proces_r&deploy=1",
	"type" : "GET",
	// "success": function() { reloadButtons(); } // this seems to break it.
    },
	"drawCallback" : function(settings) {
		// var api = this.api();
		// console.log( api.rows( {page:'current'} ).data() );
      reloadButtons();
  },
	"bProcessing" : false,
	"columns" : [ {
		"data" : "exrec"
	}, {
		"data" : "deal"
	}, {
		"data" : "sholder"
	}, {
		"data" : "certamt"
	}, {
	"data" : "paytype",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "de1statusid",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "de1statususer",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "de2statusid",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "de2statususer",
	"defaultContent" : "&nbsp;"
	}, {
		"data" : "comments"
	}, {
	"data" : "docurl",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "viewbtn",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "editbtn",
	"defaultContent" : "&nbsp;"
	}, {
		// OffSiteDataEntry Checkbox
		"data" : "allowOffSiteDataEntry"
	}, {
	"data" : "reviewuser",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "reviewbtn",
	"defaultContent" : "&nbsp;"
	}, {
	"data" : "reviewcomplete",
	"defaultContent" : "&nbsp;"
	} ],
    
	"fnCreatedRow" : function(nRow, data, iDataIndex) {
		// alert(data[5]);
		// if (data[5] == 3 && data[7] == 3) {
		// $(nRow).addClass( 'success' );
		// } else if (data[5] == 2 && data[7] == 1 || data[7] == 2 || data[7] == 3) {
		// $(nRow).addClass('warning');
		// } else if (data[7] == 2 && data[5] == 1 || data[5] == 2 || data[5] == 3) {
		// $(nRow).addClass('warning');
		// }
  	},
	"fnInitComplete" : function(oSettings, json) {
			addSelectFilters(table);

		/*
		 * When any checkbox is clicked, flag it as "changed/dirty" so that we know which records to update at the end.
		 * The statement had to be put here in the fnInitComplete attribute, otherwise it was occurring too early.
		 */
		jQuery(document).on('change', "input[name='allowOffSiteDataEntry']", function() {
			if (jQuery(this).hasClass('dirty')) {
				jQuery(this).removeClass('dirty');
			} else {
				jQuery(this).addClass('dirty');
			}

			/*
			 * Add a class isChecked or notChecked depending on the checkbox state
			 */
			if (jQuery(this).is(':checked')) {
				jQuery(this).removeClass('notChecked');
				jQuery(this).addClass('isChecked');
			} else {
				jQuery(this).removeClass('isChecked');
				jQuery(this).addClass('notChecked');
			}
		});

		manageOffSiteDataEntryPermissions();
			},
	
	"paging" : true,
	"ordering" : true,
	"info" : false,
	"iDisplayLength" : 100,
	"aoColumnDefs" : [ {
	"sClass" : "payAmount",
	"aTargets" : [ 0, 3 ]
	}, {
	"sClass" : "text-center",
	"aTargets" : [ 4, 5, 7, 9, 10, 11, 12, 14 ]
	}, {
	"bSortable" : false,
	"aTargets" : [ 9, 10, 11, 12, 13 ]
	}, {
	"aTargets" : [ 5 ],
	"data" : 5,
	"mRender" : function(data, type, full) {
		if (data == 3) {
            	return '<span class="glyphicon glyphicon-ok"></span>';
            } else if (data == 2) {
            	return '<span class="glyphicon glyphicon-adjust"></span>';
            } else {
            	return '&nbsp;';
            }
        }
	}, {
	"aTargets" : [ 7 ],
	"data" : 7,
	"mRender" : function(data, type, full) {
		if (data == 3) {
            	return '<span class="glyphicon glyphicon-ok"></span>';
            } else if (data == 2) {
            	return '<span class="glyphicon glyphicon-adjust"></span>';
            } else {
            	return '&nbsp;';
          }
        }
	} ]
	});

	/*
	 * MG Jan 12 2014: Removed time interval reloading as
	 * it interfered with updates to the Allow Off-Shore Data Entry checkbox.
	 */
	// setInterval(function() {
	// table.ajax.reload();
	// }, 60 * 1000);
    jQuery('#example').on("click", ".viewBtn", function() {
		var usrRole = nlapiGetFieldValue('custpage_userrole');
		if (usrRole == 'admin') {
			var modalID = '#modal_' + this.id;
			$(modalID).modal('show');
		} else {
			handleButton(this.id, null);
		}
    });

	jQuery('#example').on("click", ".editBtn", function() {
		var usrRole = nlapiGetFieldValue('custpage_userrole');
		if (usrRole == 'admin') {
			var modalID = '#modal_' + this.id;
			$(modalID).modal('show');
		} else {
			handleButton(this.id, null);
		}
	});

	jQuery("#example").on("click", ".reviewBtn", function() {
		// alert('Button clicked: ' + this.id);
		var usrRole = nlapiGetFieldValue('custpage_userrole');
		if (usrRole == 'admin') {
			handleButton(this.id, usrRole);
		} else {
			// return;
		}
	});
});

$(document).ajaxSuccess(function() {
	// alert("An individual AJAX call has completed successfully");
	setTimeout(function() {
		if (reloadCount > 1) {
			reloadButtons();
		}
	}, 500);
	  reloadCount += 1;
});

function addSelectFilters(table) {
	$("#example thead.testHead th").each(function(i) {
		if (i == 1 || i == 2 || i == 4 || i == 6 || i == 8) {
			var select = $('<select style="max-width:100px;"><option value=""></option></select>').appendTo($(this).empty()).on('change', function() {
				var val = $(this).val();
				table.column(i).search(val ? '^' + $(this).val() + '$' : val, true, false).draw();
			});
			
			table.column(i).data().unique().sort().each(function(d, j) {
				select.append('<option value="' + d + '">' + d + '</option>');
			});
		} else if (i == 13) { //Column 13 should be the Allow Off-Site Data Entry column.
			/*
			 * Add Mark/Unmark All checkbox, only if the Dual Entry User Type is Admin
			 */
			var usrRole = nlapiGetFieldValue('custpage_userrole');
			if (usrRole == 'admin') {
				$('<input type="checkbox" title="Mark/Unmark All" name="allowOffSiteDataEntryMarkUnmarkAll">&nbsp;Mark/Unmark All</input>').appendTo($(this).empty()).on('change', function() {
					var checkedValueToUpdate = true;

					/*
					 * If the Mark/Unmark All checkbox is checked, we want to update all checkboxes that are NOT checked to be checked.
					 */
					if ($(this).is(':checked')) {
						checkedValueToUpdate = false;
		}

					/*
					 * For each checkbox, click the checkbox if needed, to change its checked/unchecked value.
					 */
					jQuery("input[name='allowOffSiteDataEntry']").each(function() {
						if ($(this).is(':checked') == checkedValueToUpdate) {
							$(this).click();
						}
					});
				});
}

			/*
			 * Special filter for column 13, which should be the Allow Off-Site Data Entry column.
			 */
			var selectFilter = $('<select style="max-width:100px;"><option value=""></option></select>').appendTo($(this)).on('change', function() {

				//Only show columns with Yes or a checked checkbox
				var searchString = null;
				if ($(this).val() == 'Yes') {
					searchString = '^Yes$|isChecked';
				} else if ($(this).val() == 'No') {
					searchString = '^No$|notChecked';
				} else {
					searchString = '.*';
				}

				table.column(i).search(searchString, true, false).draw();

			});

			selectFilter.append('<option value="Yes">Yes</option>');
			selectFilter.append('<option value="No">No</option>');
		}
	});
}

function reloadButtons() {
	// THIS SECTION IS NOT NEEDED IF THE JQUERY IS LOADED CORRECTLY IN THE $(document).ready SECTION ABOVE. KEEP FOR NOW BUT DELETE EVENTUALLY
    jQuery('.commentsPopover').popover({
	trigger : "hover",
	placement : "left",
	title : "Comments",
	html : "true"
    });
	// jQuery(".viewBtn").click(function(event) {
	// var usrRole = nlapiGetFieldValue('custpage_userrole');
	// if(usrRole == 'admin') {
	// openPopUpWindow(this.id, usrRole);
	// } else {
	// handleButton(this.id, usrRole);
	// }
	// });
	// jQuery(".editBtn").click(function() {
	// var usrRole = nlapiGetFieldValue('custpage_userrole');
	// if(usrRole == 'admin') {
	// openPopUpWindow(this.id, usrRole);
	// } else {
	// handleButton(this.id, usrRole);
	// }
	// });
	// jQuery(".reviewBtn").click(function() {
	// // alert('Button clicked: ' + this.id);
	// var usrRole = nlapiGetFieldValue('custpage_userrole');
	// if(usrRole == 'admin') {
	// handleButton(this.id, usrRole);
	// } else {
	// alert('You do not have permission to be a reviewer.');
	// }
	// });
	// jQuery(".comBtn").click(function() {
	// alert('The comments button is not working yet.\nIf you see this symbol, coments have been made\nduring the Dual Entry process. Click on the \'View\' button \nto view the comments.');
	// });
}

function openPopUpWindow(btnId, btnUser) {
    var de1de2_window = window.open("", 'MsgWindow', 'height=200, width=300, toolbar=no, menubar=no, scrollbars=yes, resizable=no, top=400, left=400, directories=no, status=no', false);
    de1de2_window.document.write(buildModalHTML(btnId, btnUser));
    de1de2_window.focus();
}

function buildModalHTML(btnId, btnUser) {
	var mHTML = '';
	mHTML += '<script type="text/javascript">function chooseDE1() { var btnId = document.getElementById("btnId").innerHTML; window.opener.handleButton(btnId, "de1");window.close();return false; } </script>';
	mHTML += '<script type="text/javascript">function chooseDE2() { var btnId = document.getElementById("btnId").innerHTML; window.opener.handleButton(btnId, "de2");window.close();return false; } </script>';
	mHTML += '<style>';
	mHTML += '</style>';
	mHTML += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css"/>';
	mHTML += '<div class="panel panel-default">';
	mHTML += '<div class="panel-heading text-center">Choose DE1 or DE2</div>';
	mHTML += '<div class="panel-body text-center">';
	mHTML += '<p id="btnId" style="display:none;">' + btnId + '</p>';
	mHTML += '<p id="btnUser" style="display:none;">' + btnUser + '</p>';
	mHTML += '<button type="button" class="btn btn-primary" onClick="chooseDE1();return false;"> DE1 </button>&nbsp;&nbsp;';
	mHTML += '<button type="button" class="btn btn-primary" onClick="chooseDE2();return false;"> DE2 </button>&nbsp;&nbsp;';
	mHTML += '<button type="button" class="btn btn-default" onClick="window.close();">Close</button>';
	mHTML += '</div>';
	mHTML += '</div>';
	return mHTML;
}

function handleButton(btnId, modalID) {
	// alert('btnId: ' + btnId);
	var usrRole = nlapiGetFieldValue('custpage_userrole');
	// alert(usrRole);
	
	if (modalID != null && modalID != '') {
		$(modalID).modal('hide');
	}
	var btn = btnId.split('_');
	var txnid = btn[0];
	var btnType = btn[1];
	var btnUsr = null;
	var btnUsr = btn[2];
	if (btn[2]) {
		btnUsr = btn[2];
	} else if (usrRole != null && usrRole != '') {
		btnUsr = usrRole;
	} else {
		return alert('Cannot proceed User Role or Exchange Record ID is not set.');
	}
	
	// Create a unique id for the window that is going to be opened
	var windowID = txnid + btnType;
	
	// alert('txnid: ' + txnid);
	// alert('btnType: ' + btnType);
	var userrole_field = nlapiGetFieldValue('custpage_userrole');
	// alert('userrole_field: ' + userrole_field);
	
	if (txnid != null && btnType != null) {
		var url = nlapiResolveURL('SUITELET', 'customscript_acq_lot_de_entryform_s', 'customdeploy_acq_lot_de_entryform_s');
		url += '&txntype=' + 'customrecord_acq_lot';
		url += '&txnid=' + txnid;
		url += '&btnType=' + btnType; // This is used for display only, a double check will occur in the SUITELET to make sure user is authorized.
		// Need to pass 'de1' or 'de2' and not 'admin'. If an admin user clicked the view/edit buttons then they will have to choose 'de1' or 'de2' which is passed here.
		if (userrole_field == 'admin') {
			url += '&usr=' + btnUsr;
		} else {
			url += '&usr=' + userrole_field;
		}
		try {
			window.open(url);
		} catch (e) {
			console.log('ERROR: Problem opening the window or setting / retrieving localStorage.');
		}
	} else {
		alert('ERROR: Unable to load record.');
	}
}

/**
 * Preps data of exchange records to update, and sends it to a RESTlet for processing.
 */
function updateExchangeRecords() {
	alert('Note: Updating Exchange records may take several minutes, please do not close this window during the update process.\nA popup message will appear once complete.\nPlease click OK to begin the update process.');
	displayOverlay("Processing...");
	
	var exchangeRecords = {};
	exchangeRecords.exchangeRecordArray = [];

	/*
	 * The following jQuery line finds all "dirty" (i.e. who were changed) allowOffSiteDataEntry checkboxes and maps their id/checked value into a standard JavaScript array. We also wrap the array in an object to properly send it to the RESTlet.
	 */
	var exchangeRecords = {
		"exchangeRecordArray" : jQuery("input[name='allowOffSiteDataEntry'].dirty").map(function() {
			var checkboxValue = 'F';
			if (jQuery(this).is(":checked")) {
				checkboxValue = 'T';
			}
			return [ [ jQuery(this).attr('value'), [ 'custrecord_acq_lot_allow_offsite_de' ], [ checkboxValue ] ] ];
		}).get()
	};

	/*
	 * Ajax call to RESTlet, which updates the Exchange Custom Records
	 */
	jQuery.ajax({
	type : "post",
	dataType : "json",
	contentType : "application/json",
	url : "/app/site/hosting/restlet.nl?script=customscript_acq_lot_de_update_exchanges&deploy=1",
	data : JSON.stringify(exchangeRecords),
	success : function(data) {
		 $("#overlay").remove();
		alert('Update complete. Press OK to reload page.');
		location.reload(true);
	},
	error : function(data) {
		$("#overlay").remove();
		alert('Error updating Exchange records. ' + JSON.stringify(data));
	}
	});
}

/**
 * Hides/Shows/enables/disables elements of the page related to the allow off-site data entry functionality.
 */
function manageOffSiteDataEntryPermissions() {
	var exchangeDualEntryUserType = nlapiGetFieldValue('custpage_userrole');

	/*
	 * If the user is currently logged in as Off-Site Dual Entry, they can only see the exchange records that are marked as Allow for Off-Site.
	 * Also hide the update button and allow off-site checkbox column.
	 */
	if (nlapiGetRole() == NS_ROLE_OFFSITE_DUALENTRY) {
		jQuery('.offsitede').hide();
	} else if (exchangeDualEntryUserType == 'de1' || exchangeDualEntryUserType == 'de2') {
		/*
		 * Disable the Allow Off-Site Data Entry checkboxes if the user's Exchange Dual Entry User Type is de1 (dual entry 1) or de2 (dual entry 2).
		 */
		jQuery("input[name='allowOffSiteDataEntry']").attr('disabled', 'disabled');
	}
}

function displayOverlay(text) {
    $("<table id='overlay'><tbody><tr><td>" + text + "</td></tr></tbody></table>").css({
        "position": "fixed",
        "top": 0,
        "left": 0,
        "width": "100%",
        "height": "100%",
        "background-color": "rgba(0,0,0,.5)",
        "z-index": 10000,
        "vertical-align": "middle",
        "text-align": "center",
        "color": "#fff",
        "font-size": "30px",
        "font-weight": "bold",
        "cursor": "wait"
    }).appendTo("body");
}
