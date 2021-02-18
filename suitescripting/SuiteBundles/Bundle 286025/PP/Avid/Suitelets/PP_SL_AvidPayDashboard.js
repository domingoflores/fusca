/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@NModuleScope Public
 */


 define(['N/log', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/file', 'N/record'],
 	function(log, search, ui, runtime, file, record) {
 		function onRequest(context) {
 			try {
	 			if (context.request.method == 'GET') {
	 				//create form
	 				var form = ui.createForm({
	 					title: 'Your Year of Activity through AvidXchange'
	 				});

	 				var chartField = form.addField({
	 					id: 'chartfield',
	 					type: ui.FieldType.INLINEHTML,
	 					label: 'Chart'
	 				});

	 				var keyField = form.addField({ //need to keep this for spacing/layout reasons, even though the key is handled in the chart now.
	 					id: 'key_html',
	 					type: ui.FieldType.INLINEHTML,
	 					label: 'HTML'
	 				});
	 				keyField.updateBreakType({
	 					breakType: ui.FieldBreakType.STARTCOL //moves the field over into the next column within the same fieldGroup.
	 				});

	 				var otherField = form.addField({
	 					id:'test_field',
	 					type: ui.FieldType.TEXTAREA,
	 					label: ' '
	 				});
	 				otherField.updateDisplayType({
	 					displayType: ui.FieldDisplayType.INLINE
	 				});
	 				otherField.defaultValue = '<br><br><br><br><br><br><br><br>Payments to the AvidPay Network and self-managed payments (checks and ACH) are represented here by monthly total dollar spend. The maximum rebate represents the rebate if all NetSuite payments were sent via the AvidPay network’s virtual credit cards and/or AvidPay ACH.';


	 				var comboField = form.addField({
	 					id:'combo',
	 					type: ui.FieldType.INLINEHTML,
	 					label: ' ' //label is required, so this is how to blank it out
	 				});


	 				//pull data
	 				//not all values will be represented, if the value for that month/payment combo was zero. In that case, we'll need to fill them out with zero values.
	 				var chartSearch = search.load({
	 					id: 'customsearch_avid_pay_dashboard',
	 					type: search.Type.VENDOR_PAYMENT
	 				});
	 				var chartInfo = [];

	 				var chartResultSet = chartSearch.run(); //pulling the result set lets us easily pull columns that are complicated formulas, as done below

	 				var results = chartResultSet.getRange({
	 					start: 0,
	 					end: 50
	 				});

	 				for (var a = 0; a < results.length; a++) {
	 					var result = results[a];
	 					//put info into arrays. We're using column 5 for a numerical value of the month. Column 2 is the avidPay payment method
	 					// log.debug({
	 					// 	title: result.getValue(chartResultSet.columns[5]) + ': ' + result.getText(chartResultSet.columns[2]),
	 					// 	details: result.getValue(chartResultSet.columns[3])
	 					// });
	 					var barInfo = {};
	 					barInfo.month = result.getValue(chartResultSet.columns[5]);
	 					barInfo.payMethod = result.getText(chartResultSet.columns[2]);
	 					barInfo.amount = result.getValue(chartResultSet.columns[3]);
	 					barInfo.name = result.getValue(chartResultSet.columns[0]);
	 					barInfo.potential = result.getValue(chartResultSet.columns[4]);
	 					chartInfo.push(barInfo);
	 				};

	 				var titles = [];
	 				var avidPay = [];
	 				var check = [];
	 				var ach = [];
	 				var discountArray = [];
	 				var discountTotal = 0;
	 				var avidTotal = 0;

	 				//sort what information we have into arrays, using the month as the index, so they're in proper order
	 				for (var b = 0; b < chartInfo.length; b++) {
	 					var info = chartInfo[b];
	 					var index = info.month;
	 					titles[index] = info.name;
	 					var method = info.payMethod;
	 					// log.debug({
	 					// 	title: 'b/index/method/potential check',
	 					// 	details: b + '/' + index + '/' + method + '/' + info.potential
	 					// });
	 					switch(method) {
	 						case 'AvidPay Network':
	 							avidPay[index] = parseFloat(info.amount).toFixed(2);
	 							break;
	 						case 'Check':
	 							check[index] = parseFloat(info.amount).toFixed(2);
	 							break;
	 						case 'ACH':
	 							ach[index] = parseFloat(info.amount).toFixed(2);
	 							// log.debug({
	 							// 	title: 'checking ach',
	 							// 	details: info.amount
	 							// });
	 							break;
	 						default:
	 							log.error({
	 								title: 'could not map amount',
	 								details: method
	 							});
	 					}
	 					if (discountArray[index] == undefined) {
	 						discountArray[index] = parseFloat(info.potential);
	 						// log.debug({
	 						// 	title: 'discountArray ' + index + ' set',
	 						// 	details: discountArray[index]
	 						// });
	 					} else {
	 						discountArray[index] = parseFloat(discountArray[index]) + parseFloat(info.potential);
	 						// log.debug({
	 						// 	title: 'discountArray ' + index + ' add',
	 						// 	details: discountArray[index]
	 						// });
	 					}
	 					discountTotal += parseFloat(info.potential);
	 					avidTotal += parseFloat(info.amount);
	 				}

	 				//we now have our information in order in various arrays. Where information is missing, we need to supply it - meaning $0 in case of the ach, avidPay, and check arrays
	 				for (c = 0; c < 12; c++) { //we want to fill out 12 months of data
	 					if (avidPay[c] == undefined) {
	 						avidPay[c] = 0;
	 					}
	 					if (check[c] == undefined) {
	 						check[c] = 0;
	 					}
	 					if (ach[c] == undefined) {
	 						ach[c] = 0;
	 					}
	 					if (discountArray[c] == undefined) {
	 						discountArray[c] = 0;
	 					}
	 					discountArray[c] = discountArray[c].toFixed(2); //rounding off value as needed.
	 				}

	 				//our amounts in our arrays are actually backwards! We're counting backwards from the current months, so we need to flip our arrays so they display in the proper order in the chart
					avidPay = avidPay.reverse();
					check = check.reverse();
					ach = ach.reverse();
					discountArray = discountArray.reverse();
					// log.debug({
					// 	title: 'ach array',
					// 	debug: ach.toString()
					// });


	 				//build labels - we want month names and 2 digit years for the past 12 months.
	 				var labels = [];
	 				var date = new Date();
	 				var day = date.getDate();
					if (day > 28) { //this will get around issues where march 30th tries to transform into Feb 30th, below, and then rolls over into a double march
						date.setDate(28);
					}
					var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	 				for (var i = 0; i < 12; ++i) {
						labels.unshift('"' + months[date.getMonth()] + '"');
						date.setMonth(date.getMonth() - 1);
					}


	 				//Create chart
	 				//This uses Google's charts library. More info here:  https://developers.google.com/chart/interactive/docs/gallery/columnchart
	 				
					chartHTML2 = "<html><head><title>Usage Chart</title>";
					chartHTML2 += '<style>';
					chartHTML2 += '#chart_div {';
					chartHTML2 += 'margin-left: -125px;';
					chartHTML2 += '}';
					chartHTML2 += '</style>';
	 				chartHTML2 += '<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>';
  					chartHTML2 += '<div id="chart_div"></div>';
  					chartHTML2 += '<script>';
  					chartHTML2 += "google.charts.load('current', {packages: ['corechart', 'bar']});";
					chartHTML2 += "google.charts.setOnLoadCallback(drawStacked);";

					chartHTML2 += "function drawStacked() {";
					chartHTML2 += "var data = google.visualization.arrayToDataTable([";
					chartHTML2 += "['Month', 'AvidPay', 'ACH', 'Check', {role: 'annotation'}],";
					chartHTML2 += "[" + labels[0] + ", "+ avidPay[0]+", "+ach[0]+", "+check[0]+",''],";
					chartHTML2 += "[" + labels[1] + ", "+ avidPay[1]+", "+ach[1]+", "+check[1]+",''],";
					chartHTML2 += "[" + labels[2] + ", "+ avidPay[2]+", "+ach[2]+", "+check[2]+",''],";
					chartHTML2 += "[" + labels[3] + ", "+ avidPay[3]+", "+ach[3]+", "+check[3]+",''],";
					chartHTML2 += "[" + labels[4] + ", "+ avidPay[4]+", "+ach[4]+", "+check[4]+",''],";
					chartHTML2 += "[" + labels[5] + ", "+ avidPay[5]+", "+ach[5]+", "+check[5]+",''],";
					chartHTML2 += "[" + labels[6] + ", "+ avidPay[6]+", "+ach[6]+", "+check[6]+",''],";
					chartHTML2 += "[" + labels[7] + ", "+ avidPay[7]+", "+ach[7]+", "+check[7]+",''],";
					chartHTML2 += "[" + labels[8] + ", "+ avidPay[8]+", "+ach[8]+", "+check[8]+",''],";
					chartHTML2 += "[" + labels[9] + ", "+ avidPay[9]+", "+ach[9]+", "+check[9]+",''],";
					chartHTML2 += "[" + labels[10] + ", "+ avidPay[10]+", "+ach[10]+", "+check[10]+",''],";
					chartHTML2 += "[" + labels[11] + ", "+ avidPay[11]+", "+ach[11]+", "+check[11]+",'']";
					chartHTML2 += "]);";

      				chartHTML2 += "var options = {";
      				chartHTML2 += "width: 1200,";
      				chartHTML2 += "height: 750,";
        			chartHTML2 += "legend: {position: 'top', maxLines: 3},"
        			chartHTML2 += "isStacked: true,";
        			chartHTML2 += "bar: {groupWidth: '75%'},";
        			chartHTML2 += "colors: ['#00A04D', '#024E68', '#0684C9']";
        			chartHTML2 += "};";
      				chartHTML2 += "var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));";
      				chartHTML2 += "chart.draw(data, options);";
    				chartHTML2 += "}";
    				chartHTML2 += "</script>";
	 				chartHTML2 += '</body>';
	 				chartHTML2 += "</html>";


					chartField.defaultValue = chartHTML2;
					avidTotal = parseFloat(avidTotal).toFixed(2);
					discountTotal = parseFloat(discountTotal).toFixed(2);
					log.debug({
						title: 'avidTotal.toFixed',
						details: avidTotal + ', ' + typeof avidTotal
					});
					avidTotal = addCommas(avidTotal);
					discountTotal = addCommas(discountTotal);
					log.debug({
						title: 'avidTotal.toLocaleString',
						details: avidTotal + ', ' + typeof avidTotal
					});

					comboText = '<html><head><style>';
					comboText += 'table#t01, th, tf {';
					comboText += 'border: 1px solid #00A04D;';
					comboText += 'border-collapse: collapse;';
					comboText += 'padding: 5px;';
					comboText += '}';
					comboText += '</style></head><body>';
					comboText += '<br><br>';
					comboText += '<font size = 2>Potential rebate by month:</font>';
					comboText += '<table id = "t01">';
					comboText += '<tr>';
					comboText += '<th>'+labels[0].slice(1, -1)+'</th><th>'+labels[1].slice(1, -1)+'</th><th>'+labels[2].slice(1, -1)+'</th><th>'+labels[3].slice(1, -1)+'</th><th>'+labels[4].slice(1, -1)+'</th><th>'+labels[5].slice(1, -1)+'</th><th>'+labels[6].slice(1, -1)+'</th><th>'+labels[7].slice(1, -1)+'</th><th>'+labels[8].slice(1, -1)+'</th><th>'+labels[9].slice(1, -1)+'</th><th>'+labels[10].slice(1, -1)+'</th><th>'+labels[11].slice(1, -1)+'</th>';//removing "" around label names
					comboText += '</tr><tr>';
					comboText += '<th>'+discountArray[0]+'</th><th>'+discountArray[1]+'</th><th>'+discountArray[2]+'</th><th>'+discountArray[3]+'</th><th>'+discountArray[4]+'</th><th>'+discountArray[5]+'</th><th>'+discountArray[6]+'</th><th>'+discountArray[7]+'</th><th>'+discountArray[8]+'</th><th>'+discountArray[9]+'</th><th>'+discountArray[10]+'</th><th>'+discountArray[11]+'</th>';
					comboText += '</tr></table>';
					comboText += '<font size = 3><br><br>Total amount processed through AvidXchange: <b>' + avidTotal + '*';// + ' ' + curSymbol;
					comboText += '</b><br>Potential maximum rebate through the AvidPay Network: <b>' + discountTotal + '*';// + ' ' + curSymbol;
					comboText += '</b></font>';
					comboText += "<br><font size = 2>* Amount displayed in your account's base currency.</font>";
					comboText += '</body></html>';
					comboField.defaultValue = comboText;


					context.response.writePage(form);
	 			} else {

	 			}
	 		} catch(ex) {
	 			log.error({
	 				title: 'Error in AvidPay Dashboard',
	 				details: ex.message
	 			});
	 		}
 		}

 		function addCommas(nStr) {
		    nStr += '';
		    var x = nStr.split('.');
		    var x1 = x[0];
		    var x2 = x.length > 1 ? '.' + x[1] : '';
		    var rgx = /(\d+)(\d{3})/;
		    while (rgx.test(x1)) {
		        x1 = x1.replace(rgx, '$1' + ',' + '$2');
		    }
		    return x1 + x2;
		}

 		return {
 			onRequest: onRequest
 		};
 	}
 );