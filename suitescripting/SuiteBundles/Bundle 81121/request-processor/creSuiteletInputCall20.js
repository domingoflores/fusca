//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * @Description: This SuiteLet would be an indirect call to the
 *               creProceedSearch. It would take the same set of parameters.
 *               This way we can call the SuiteLet from client-code(POST).
 * @KnownIssue: if the search result contains more than 162 records, this
 *              SuiteLet will throw SSS_USAGE_LIMIT_EXCEEDED error. [TBD] Might
 *              need MAP REDUCE implementation postCreateTaskByFile help.
 */
define(
		[ 'N/error', 'N/redirect', 'N/runtime', './creSuiteletInput20_lib' ],
		/**
		 * @param {error}
		 *            error
		 * @param {redirect}
		 *            redirect
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(error, redirect, runtime, CREINPUTLIB) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest(context) {

				// Script Parameter
				var request = context.request;

				log.debug('creSuiteLetInputCall20.parameters', JSON
						.stringify(request.parameters));

				if (context.request.method === 'GET') {

				} else {

					// [1] Get parameters
					var param_intCRESearchId = request.parameters.custparam_searchid;
					var param_creProfile = request.parameters.custparam_creprofile;
					var param_creOptionGrp = request.parameters.custparam_creoptiongrp;
					var param_creRootFlder = request.parameters.custparam_rootfolder;
					var param_objOptions = request.parameters.custparam_stroptions ? JSON
							.parse(request.parameters.custparam_stroptions)
							: {};
					// Sample objOptions before stringify: {
					// arr_objFilters : arr_objFilters,
					// objHookSc : {
					// scriptId : 'customscript_prd_sc_proceedcreheader10',
					// deploymentId : ''
					// }
					// }

					// [2] Call CRE API
					var objDetailRecs = CREINPUTLIB.creProceedSearch(
							param_intCRESearchId, param_creProfile,
							param_creOptionGrp, param_creRootFlder,
							param_objOptions);

					var strReturnStr = (Boolean(objDetailRecs) && objDetailRecs.header) ? 'true'
							: 'false';

					context.response.writePage(strReturnStr);
				}

				return true;
			}

			/**
			 * Sample Call(testing SS1.0) in console zBTC4ERP
			 */
			function client_call_test() {

				nlapiRequestURL(
						'/app/site/hosting/scriptlet.nl?script=476&deploy=1',
						{
							custparam_searchid : 'customsearch_cre_profile_so_header',
							custparam_creprofile : '63',
							custparam_creoptiongrp : '1',
							custparam_rootfolder : '6185',
							custparam_stroptions : '{"arr_objFilters":[],"objHookSc":{"scriptId":"customscript_prd_sc_proceedcreheader10","deploymentId":""}}'
						});
			}

			return {
				onRequest : onRequest
			};

		});
