/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/record', 'N/ui/serverWidget', 'N/runtime',
    '/SuiteScripts/Pristine/libraries/toolsLibrary.js',
    '/.bundle/132118/PRI_AS_Engine'],

    /**
     * -----------------------------------------------------------
     * escrowStatementNews_UE.js
     * ___________________________________________________________
     * Escrow Statement News user event
     *
     * Version 1.0
     * Author: Brunno Putnam
     * Date: 2020-01-24
     * ATP-1069 - ATP-1595
     * ___________________________________________________________
     */

    function (record, serverWidget, runtime, tools, appSettings) {

        var userObj = runtime.getCurrentUser();
        var editorsList;
        var datesFuntionalityAccess = false;

        function beforeLoad(context) {
            
            var fields_to_hide = ['custrecord90', 'custrecordcom_sh_news', 'custrecordsameasmajor', 'custrecord_esn_case'];
            var trigger_field = 'custrecord88';
            var vip = 'custrecord_esn_vip_message';

			log.debug("beforeload", "In!")
			var executionContext = runtime.executionContext;
            log.debug("CONTEXT", executionContext);

            var approval_status = tools.getFieldValue(context, 'custrecordesnapproval');

            if (executionContext == 'CSVIMPORT'){ 
                throw "CSV imports are disabled for this record type";
            }

            publishedDatesEditors();

            log.debug("datesFuntionalityAccess: ", datesFuntionalityAccess);

            if (!datesFuntionalityAccess) {
                if (executionContext == 'USERINTERFACE' && approval_status == 4) { //published approval
                    tools.preventEdit(context, false, 'Approval is Published and the record cannot be edited. See App Settings.');
                }
            }
            //if this test fails, create a separate if for csvimport and throw same message

            if (executionContext == 'USERINTERFACE' && context.type == 'view') { 

                toggleDisplay(context, fields_to_hide, vip, trigger_field)

            }

        } // end of beforeLoad
        
        //==============================================helper functions============================================================

        function publishedDatesEditors() {
            editorsList = JSON.parse(appSettings.readAppSetting("Escrow Statement News", "ESN News and Final Date Editors List"));
            if (editorsList.indexOf(userObj.name) > -1) { datesFuntionalityAccess = true; }
        }

        function toggleDisplay(context, fields_to_hide, vip, trigger_field) {

            var fieldObject;
            var form = context.form;
            var trigger_field_value = context.newRecord.getValue(trigger_field);
            var vip_field_object = form.getField({
                 id: vip
            })

            if (trigger_field_value == 591324) {
                vip_field_object.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL
                });

                for (var i = 0; i < fields_to_hide.length; i++) {
                    fieldObject = form.getField({
                        id: fields_to_hide[i]
                    });

                    fieldObject.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }

            } else {
                vip_field_object.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                
                for (var i = 0; i < fields_to_hide.length; i++) {
                    fieldObject = form.getField({
                        id: fields_to_hide[i]
                    });

                    fieldObject.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.NORMAL
                    });
                }
            }
        }

		return {
			beforeLoad: beforeLoad,
		}

	});