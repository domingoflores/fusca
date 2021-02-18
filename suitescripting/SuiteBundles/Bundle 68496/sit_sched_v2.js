/**
* @NApiVersion 2.0
* @NScriptName My Example Script
*/
define(['N/config','N/runtime','N/file','N/record'], 
function (config,runtime,file,record) {
	return {
		config: {
			exitOnError: false // default
		},
		getInputData: function() {
			// logic goes here
		},
		map: function(context) {
	// logic goes here
		},
		reduce: function(context) {
	// logic goes here
		},
		summarize: function(context) {
			// logic goes here
		}
	};
});