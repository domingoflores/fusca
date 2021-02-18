/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 *
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Jun 2018     jmarimla         Initial
 * 2.00       16 Jul 2018     jmarimla         Extjs translation
 * 3.00       11 Sep 2018     jmarimla         Fixed language
 * 4.00       07 Dec 2018     jmarimla         Add language
 *
 */

var psgp_apm;
if (!psgp_apm) { psgp_apm = {}; }
if (!psgp_apm.translation10) { psgp_apm.translation10 = {}; }

var _resourceFolder = './resources/'; // path of folder where <locale>.js files are located. path is relative to this module
                                     // and can be set to a different location
var _namespaces = null;
var _locales = null;

var util = (function () {
    function isObjectWithProperty(value) {
        throwErrorWhenInvalidParameter();

        var ret = false;
        if(typeof(value) === 'object') {
            ret = !(value === null ||
                value instanceof Array ||
                value instanceof Date ||
                value instanceof String ||
                value instanceof Number ||
                value instanceof Boolean);

            if(hasConstructor()) {
                if (hasOwnKeys()) ret = true;
                else ret = hasKeysInPrototype();
            }
            else ret = false;
        }

        return ret;

        function throwErrorWhenInvalidParameter() {
            if (value === undefined) throw new Error('value is required.');
        }

        function hasConstructor() {
            return ret && value.constructor;
        }

        function hasOwnKeys() {
            return Object.keys(value).length > 0;
        }

        function hasKeysInPrototype() {
            return Object.keys(value.constructor.prototype).length > 0;
        }
    }

    function isPlainObject(value) {
        throwErrorWhenInvalidParameter();

        var ret = false;
        if(typeof(value) === 'object') {
            ret = !(value === null ||
                value instanceof Array ||
                value instanceof Date ||
                value instanceof String ||
                value instanceof Number ||
                value instanceof Boolean);

            if(hasConstructor() && !isConstructedFromObject()) ret = false;
        }

        return ret;

        function throwErrorWhenInvalidParameter() {
            if (value === undefined) throw new Error('value is required.');
        }

        function hasConstructor() {
            return ret && value.constructor;
        }

        function isConstructedFromObject() {
            return value.constructor === Object
        }
    }

    function isArray(value) {
        throwErrorWhenInvalidParameter();

        return Object.prototype.toString.call(value) === '[object Array]';

        function throwErrorWhenInvalidParameter() {
            if (value === undefined) throw new Error('value is required.');
        }
    }

    function convertDotDelimitedStringToObject(keyString) {
        throwErrorWhenInvalidParameter(arguments);

        var ret = {};
        var keyArr = keyString.split('.');
        var keyArrCopy = [].concat(keyArr);
        var firstKey = keyArrCopy[0];

        if(keyArr.length === 1) {
            if(firstKey === '*' || firstKey === '') ret = {};
            else ret[firstKey] = {};
        }
        else {
            keyArr.shift();
            ret[firstKey] = convertDotDelimitedStringToObject(keyArr.join('.'));
        }
        return ret;

        function throwErrorWhenInvalidParameter(arguments) {
            if (arguments.length === 0) throw new Error('keyString is required.');
            if (typeof(keyString) !== 'string') throw new Error('keyString must be a string.');
            var whitespaceRegex = /\s/;
            if (whitespaceRegex.test(keyString)) throw new Error('keyString must not have a whitespace.');
        }
    }

    function upsertDotDelimitedKeyOfObject(objectToUpdate, keyString, valueForKey) {
        throwErrorWhenInvalidParameter(arguments);

        var keyArr = keyString.split('.');
        var keyArrCopy = [].concat(keyArr);
        var firstKey = keyArrCopy[0];

        if(keyArr.length === 1) {
            objectToUpdate[firstKey] = valueForKey;
        }
        else {
            keyArr.shift();
            objectToUpdate[firstKey] = upsertDotDelimitedKeyOfObject(objectToUpdate[firstKey] || {},
                keyArr.join('.'), valueForKey);
        }

        return objectToUpdate;

        function throwErrorWhenInvalidParameter(arguments) {
            if (arguments.length === 0) throw new Error('objectToUpdate is required.');
            if (!isPlainObject(objectToUpdate)) throw new Error('objectToUpdate must be an object.');
            if (arguments.length === 1) throw new Error('keyString is required.');
            if (typeof(keyString) !== 'string') throw new Error('keyString must be a string.');
            var whitespaceRegex = /\s/;
            if (whitespaceRegex.test(keyString)) throw new Error('keyString must not have a whitespace.');
            if (arguments.length === 2) throw new Error('valueForKey is required.');
        }
    }

    return {
        isObjectWithProperty: isObjectWithProperty,
        isPlainObject: isPlainObject,
        isArray: isArray,
        convertDotDelimitedStringToObject: convertDotDelimitedStringToObject,
        upsertDotDelimitedKeyOfObject: upsertDotDelimitedKeyOfObject
    };
})();

function load(options) {
    _throwErrorWhenInvalidParameter();

    _locales = options.locales;
    _namespaces = options.keys;

    // only support one locale for now
    var firstLocale = _locales[0];

    return _generateTextRepository(firstLocale);

    function _throwErrorWhenInvalidParameter() {
        if (_hasPromise()) throw new Error('Can be invoked from server scripts only.');
        if (!options) throw new Error('options is required.');
        if (!util.isObjectWithProperty(options)) throw new Error('options must be an object with a property.');
        if (!options.keys) throw new Error('options.keys is required.');
        if (!util.isArray(options.keys)) throw new Error('options.keys must be an array.');
        if (options.keys.length !== 1) throw new Error('options.keys must have one key.');
        if (!_isValidKey(options.keys[0])) throw new Error('options.keys must end with \'.*\'.');
        if (!options.locales) throw Error('options.locales is required.');
        if (!util.isArray(options.locales)) throw new Error('options.locales must be an array.');
        if (options.locales.length !== 1) throw new Error('options.locales must have one locale.');
    }
}

function _hasPromise() {
    var ret = true;
    try {
        new Promise(function () {});
    } catch (e) {
        ret = false;
    }

    return ret;
}

function _isValidKey(key) {
    return /\.\*$/.test(key) || key === '' || key === '*';
}

function _generateTextRepository(locale) {
    var namespaceObj = _parseResourceModuleAndInsertNamespace(_loadResourceViaApi(locale));
    return new TextRepository(namespaceObj);
}

function _loadResourceViaServerSideRequire(locale) {
    var resourceObj = null;

    // require() is synchronous in server scripts
    require([_resourceFolder + locale], function (module) {
        resourceObj = module;
    });

    return resourceObj;
}

function _getResourceFolderId() {
    var bundleId = nlapiGetContext().getBundleId() || '89490';
    var bundleFolderId = null;
    var resourceFolderId = null;

    var filters = [
        ['predecessor', 'anyof', -16],  // SuiteBundles
        'and',
        ['name', 'is', 'Bundle '+ bundleId ]
    ];
    var searchRes = nlapiSearchRecord('folder', null, filters);
    if (searchRes === null) {
        throw 'searchRes === null; bundleId=' + bundleId;
    }
    if (searchRes.length > 1) {
        throw 'searchRes.length > 1; bundleId=' + bundleId;
    }
    bundleFolderId = searchRes[0].getId();

    filters = [
        ['predecessor', 'anyof', bundleFolderId],
        'and',
        ['name', 'is', 'resources' ]
    ];
    searchRes = nlapiSearchRecord('folder', null, filters);
    if (searchRes === null) {
        throw 'searchRes === null; bundleId=' + bundleId;
    }
    if (searchRes.length > 1) {
        throw 'searchRes.length > 1; bundleId=' + bundleId;
    }
    resourceFolderId = searchRes[0].getId();
    return resourceFolderId;
}

function _getResourceFileId(fileName) {
    fileName = fileName || 'en_US.js';
    var resourceFolderId = _getResourceFolderId();
    var fileId = null;

    var filters = [
        [ 'name', 'is', fileName ],
        'and',
        [ 'folder', 'anyof', resourceFolderId ]
    ];
    // file name only, so search it first
    var results = nlapiSearchRecord('file', null, filters);
    if (results === null) {
        throw 'results === null; fileName=' + fileName;
    }
    if (results.length > 1) {
        throw 'results.length > 1; fileName=' + fileName;
    }
    // we expect only 1 file
    fileId = results[0].getId();
    return fileId;
};

function _loadResourceViaApi(locale) {
    locale = locale || 'en_US';
    var fileId = _getResourceFileId(locale + '.js');
    var fileObj = nlapiLoadFile(fileId);
    var contents = fileObj.getValue();
    // dummy define
    function define(myFunc) {
        return myFunc();
    };
    return eval(contents);
}

function _parseResourceModuleAndInsertNamespace(resourceObj) {
    var namespaceObj;

    // only one namespace is supported for now
    var firstNamespace = _namespaces[0];
    firstNamespace = _stripAsteriskKey(firstNamespace);
    namespaceObj = util.convertDotDelimitedStringToObject(firstNamespace);

    if(resourceObj) {
        var leafNode = _findLeafObject(namespaceObj);
        Object.keys(resourceObj).map(function (value) {
            leafNode = util.upsertDotDelimitedKeyOfObject(leafNode, value, resourceObj[value]);
        });
    }

    return namespaceObj;
}

function _stripAsteriskKey(namespaceString) {
    namespaceString = namespaceString.substring(0, namespaceString.length - 2);
    return namespaceString;
}

function _findLeafObject(parentObject) {
    var leafObject = null;

    var parentKeys = Object.keys(parentObject);
    if(parentKeys.length === 0) return parentObject;

    parentKeys.map(function (value) {
        var childObject = parentObject[value];
        if(util.isPlainObject(childObject)) {
            var childKeys = Object.keys(childObject);
            if(childKeys.length === 0) leafObject = childObject;
            else leafObject = _findLeafObject(childObject);
        }
    });

    return leafObject;
}

var TextRepository = (function () {
    function TextRepository(namespaceObj) {
        _throwErrorWhenInvalidParameter(arguments);

        var me = this;
        me._keyCount = 0;

        _traverseObjectAndConvertLeafKeysToFunction(namespaceObj);
        _attachConvertedObjectToThis(namespaceObj);

        function _throwErrorWhenInvalidParameter(textRepositoryArguments) {
            if (textRepositoryArguments.length === 0) throw new Error('namespaceObj is required.');
            if (!util.isPlainObject(namespaceObj)) throw new Error('namespaceObj must be a plain object.');
        }

        function _traverseObjectAndConvertLeafKeysToFunction(outputNamespaceObj) {
            Object.keys(outputNamespaceObj).map(function (value) {
                var node = outputNamespaceObj[value];
                if(util.isPlainObject(node))
                    _traverseObjectAndConvertLeafKeysToFunction.call(me, node);
                else {
                    me._keyCount++;
                    outputNamespaceObj[value] = _convertLeafNodeToFunction(node);
                }
            });
        }

        function _attachConvertedObjectToThis(outputNamespaceObj) {
            var arrMainKeys = Object.keys(outputNamespaceObj);
            for(var i in arrMainKeys) {
                var key = arrMainKeys[i];
                me[key] = outputNamespaceObj[key];
            }
        }
    }

    function _convertLeafNodeToFunction(actualString) {
        return _replaceString(actualString);
    }

    // this is the function set to the keys of the leaf objects
    function _replaceString(actualString) {
        return function getString(options) {
            _throwErrorWhenInvalidParameter();

            var displayString = actualString;

            if (_hasReplacementTag(actualString)) displayString = _formatString(actualString, options.params);

            return displayString;

            function _throwErrorWhenInvalidParameter() {
                if (options && !util.isPlainObject(options)) throw new Error('options must be an object.');
                if (options && !options.params) throw new Error('options.params is required.');
                if (options && !util.isArray(options.params)) throw new Error('options.params must be an array.');
            }

            function _hasReplacementTag(inputString) {
                var regex = /{\d+}/g;
                return regex.test(inputString);
            }

            function _formatString(inputString, arguments) {
                var outputString = inputString;
                for (var i = 0; i < arguments.length; i++) {
                    var regex = new RegExp('{[' + i + ']}', 'g');
                    outputString = outputString.replace(regex, arguments[i]);
                }

                return outputString;
            }
        };
    }

    TextRepository.prototype.countKeys = function () {
        return this._keyCount;
    };

    return TextRepository;
})();

psgp_apm.translation10.availableLocaleModules = [
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

psgp_apm.translation10.identifyLocaleToUse = function() {
	var configObj = nlapiLoadConfiguration('userpreferences');
    var language = configObj.getFieldValue('LANGUAGE');
    return psgp_apm.translation10.availableLocaleModules.indexOf(language) !== -1 ? language : 'en_US';
};

psgp_apm.translation10.load = function(options) {
    return load({
        keys: ['*'],
        locales: [psgp_apm.translation10.identifyLocaleToUse()]
    });
};

psgp_apm.translation10.getExtLocaleFile = function() {
	var configObj = nlapiLoadConfiguration('userpreferences');
    var language = configObj.getFieldValue('LANGUAGE');
	var availableLanguage = psgp_apm.translation10.availableLocaleModules.indexOf(language) !== -1 ? language : 'en_US';
	var extjsLocaleFiles = {
			'cs_CZ':'apm-ext-lang-cs.js',
			'da_DK':'apm-ext-lang-da.js',
			'de_DE':'apm-ext-lang-de.js',
			'en':'apm-ext-lang-en.js',
			'en_AU':'apm-ext-lang-en_AU.js',
			'en_CA':'apm-ext-lang-en.js',
			'en_GB':'apm-ext-lang-en_GB.js',
			'en_US':'apm-ext-lang-en_US.js',
			'es_AR':'apm-ext-lang-es.js',
			'es_ES':'apm-ext-lang-es.js',
			'fi_FI':'apm-ext-lang-fi.js',
			'fr_CA':'apm-ext-lang-fr_CA.js',
			'fr_FR':'apm-ext-lang-fr.js',
			'id_ID':'apm-ext-lang-id.js',
			'it_IT':'apm-ext-lang-it.js',
			'ja_JP':'apm-ext-lang-ja.js',
			'ko_KR':'apm-ext-lang-ko.js',
			'nl_NL':'apm-ext-lang-nl.js',
			'no_NO':'apm-ext-lang-no_NB.js',
			'pt_BR':'apm-ext-lang-pt_BR.js',
			'ru_RU':'apm-ext-lang-ru.js',
			'sv_SE':'apm-ext-lang-sv_SE.js',
			'th_TH':'apm-ext-lang-th.js',
			'tr_TR':'apm-ext-lang-tr.js',
			'vi_VN':'apm-ext-lang-vn.js',
			'zh_CN':'apm-ext-lang-zh_CN.js',
			'zh_TW':'apm-ext-lang-zh_TW.js'
	}
	
	var fileName  = (extjsLocaleFiles[availableLanguage]) ? extjsLocaleFiles[availableLanguage] : extjsLocaleFiles['en_US'];
	
	return fileName;
}


