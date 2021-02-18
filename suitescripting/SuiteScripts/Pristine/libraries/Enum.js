/**
 * Enum.js
 * @NApiVersion 2.x
 * @NModuleScopt public
 */

 // include '/SuiteScripts/Pristine/libraries/Enum.js'

define([],
	function() {
		
		function Enum() {
			v = arguments;
			s = {
				all: [],
				keys: v
			};
			for (i = v.length; i--;) s[v[i]] = s.all[i] = i;
			return s
		}

		return {
			Enum: Enum
		};
	}
);