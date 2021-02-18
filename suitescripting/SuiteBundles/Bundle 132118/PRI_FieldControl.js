/**
 *@NApiVersion 2.x
 * @NModuleScope Public
 */

//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: Field Display Control
//Description: 
//Developer: Vanessa Sampang            
//Date: 07/12/2016
//------------------------------------------------------------------

define(['N/log','N/record','N/runtime'],

	function(log,record,runtime){

		 /**
         * nsDisableField - Used to disable or enabled a field on CLIENT
         * @param {String} fldnam -The field ID
         * @param {Boolean} val - Indicated whether the field is disabled or not. true means DISABLED.
         * @returns void
         */
		function nsDisableField(fldnam,val){
			 var form = typeof(ftabs) != 'undefined' && ftabs[getFieldName(fldnam)] != null ? 
			 			document.forms[ftabs[getFieldName(fldnam)]+'_form'] : 
			 			document.forms['main_form'];

		    disableField(getFormElement(form, getFieldName(fldnam)),val);

		    if (typeof(ftabs) == 'undefined' || 
		    		ftabs[getFieldName(fldnam)] == null || 
		    			ftabs[getFieldName(fldnam)] == "main" ){
		        nsDisabledFields[fldnam] = val;
		    }
		}

		/**
         * nsDisableLineField - Used to disable or enabled a field on LINE LEVEL
         * @param {String} type -The sublist ID to focus
         * @param {String} fldnam -The field ID
         * @param {Boolean} val - Indicated whether the field is disabled or not. true means DISABLED.
         * @returns void
         */
		function nsDisableLineField(type,fldnam,val,linenum){
			var fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam));
		    if(fld == null){
		       fld = getFormElement( document.forms[type.toLowerCase()+'_form'], getFieldName(fldnam)+linenum);
		    }
		    disableField(fld,val);
		}

		/**
         * controlFields - Used to disable or enabled a set of fields at HEADER LEVEL
         * @param {Array} flds -Array of internal field IDs
         * @param {Boolean} val - Indicated whether the field is disabled or not. true means DISABLED.
         * @returns void
         */
		function controlFields(flds, val){
			for(var i = 0; i < flds.length; i++){
				nsDisableField(flds[i],val);
			}
		}

		/**
         * controlLineFields - Used to disable or enabled a set of fields at HEADER LEVEL
         * @param {Object} lines -Object of sublist ID with the Array of FIELD IDs. Example: {'item':['rate','amount','location','region']}
         * @param {Boolean} val - Indicated whether the field is disabled or not. true means DISABLED.
         * @returns void
        */
		function controlLineFields(lines,val,line){
			for(var l in lines){
				for(var i = 0; i < lines[l].length; i++){
					nsDisableLineField(l,lines[l][i], val, line);
				}
			}
		}

		return{
			nsDisableField 		:nsDisableField,
			nsDisableLineField	:nsDisableLineField,
			controlFields 		:controlFields,
			controlLineFields	:controlLineFields
		}
	}
)