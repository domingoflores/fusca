/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       11 Jun 2018     jmarimla         Initial
 * 2.00       11 Sep 2018     jmarimla         Fixed language
 * 3.00       07 Dec 2018     jmarimla         Add languages
 *
 */

/**
 * @NModuleScope Public
 */
define([
    './translation_external',
    'N/config'
], function (
    translation_external,
    config
) {
    
    function identifyLocaleToUse() {
        var availableLocaleModules = [
        	'cs_CZ',
        	'da_DK',
        	'de_DE',
        	'en_US',
        	'es_AR',
        	'es_ES',
        	'fi_FI',
        	'fr_CA',
        	'fr_FR',
        	'id_ID',
        	'it_IT',
        	'ja_JP',
        	'ko_KR',
        	'nl_NL',
        	'no_NO',
        	'pt_BR',
        	'ru_RU',
        	'sv_SE',
        	'th_TH',
        	'tr_TR',
        	'vi_VN',
        	'zh_CN',
        	'zh_TW'
        ];
        
        var configObj = config.load({
        	type: config.Type.USER_PREFERENCES
        });
        var language = configObj.getValue({
        	fieldId: 'LANGUAGE'
        });
        
        return availableLocaleModules.indexOf(language) !== -1 ? language : 'en_US';
    }
    
    function load(options) {
        return translation_external.load({
            keys: ['*'],
            locales: [identifyLocaleToUse()]
        });
    }
    
    return {
        load: load,
        identifyLocaleToUse: identifyLocaleToUse
    };
});