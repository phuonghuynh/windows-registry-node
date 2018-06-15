/* global Buffer */
'use strict';
var ffi = require('ffi'),
    types = require('./types'),
    advApi = require('./native/adv_api'),
    Key = require('./key'),
    ref = require('ref'),
    error = require('./error'),
    windef = require('./windef'),
    debug = require('debug')('windows-registry');

var api = {
    openKeyFromPredefined: function (preDefinedKey, subKeyName, accessLevel) {
        if (preDefinedKey < 0x80000000 || preDefinedKey > 0x80000006) {
            throw 'The key ' + preDefinedKey + ' is not valid. Use the windef module for the list of predefined keys';
        }

        var pHkey = ref.alloc(types.PHKEY, new Buffer(ref.sizeof.pointer));
        debug('PHKEY LENGTH: ' + pHkey.deref().length);
        var result = advApi.RegOpenKeyExW(preDefinedKey, subKeyName, 0, accessLevel, pHkey);
        debug('result:' + result);
        if (result !== 0) {
            throw 'Failed to open key error: ' + error[result];
        }

        return new Key(pHkey, subKeyName);
    },
    openKeyFromKeyObject: function (keyObject, subKeyName, accessLevel) {
        var pHkey = ref.alloc(types.PHKEY, new Buffer(ref.sizeof.pointer));

        // RegOpenKeyEx can also take an HKEY in addition to a predefined value
        var advApi2 = ffi.Library('Advapi32', {
            RegOpenKeyExW: ['long', [types.HKEY, types.LPCWSTR, types.DWORD, types.REGSAM, types.PHKEY]]
        });
        var result = advApi2.RegOpenKeyExW(keyObject.handle.deref(), subKeyName, 0, accessLevel, pHkey);

        if (result !== 0) {
            throw 'Failed to open key error: ' + error[result];
        }

        return new Key(pHkey, subKeyName);
    },
    queryValueForKeyObject: function (key, valueName) {
        var pKeyDataLength = ref.alloc(types.LPDWORD, new Buffer(ref.sizeof.pointer)),
            pKeyType = ref.alloc(types.LPDWORD, new Buffer(ref.sizeof.pointer));
        // QUERY FOR VALUE SIZE & TYPE
        var result = advApi.RegQueryValueExW(key.handle.deref(), valueName, null, pKeyType, null, pKeyDataLength);
        // READ VALUE
        var value = new Buffer(pKeyDataLength.readUInt32LE()),
            valueType = pKeyType.readUInt32LE();
        switch (valueType) {
            case windef.REG_VALUE_TYPE.REG_SZ:
            case windef.REG_VALUE_TYPE.REG_EXPAND_SZ:
            case windef.REG_VALUE_TYPE.REG_LINK:
                value.type = types.LPCWSTR;
                break;
            case windef.REG_VALUE_TYPE.REG_BINARY:
                value.type = types.PVOID;
                break;
            case windef.REG_VALUE_TYPE.REG_DWORD:
            case windef.REG_VALUE_TYPE.REG_DWORD_BIG_ENDIAN:
            case windef.REG_VALUE_TYPE.REG_DWORD_LITTLE_ENDIAN:
                value.type = types.DWORD;
                break;
            default:
                throw 'The Value Type: ' + valueType + ' is currently unsupported';
        }

        // READ VALUE
        result = advApi.RegQueryValueExW(key.handle.deref(), valueName, null, pKeyType, value, pKeyDataLength);

        if (result !== 0) {
            throw 'Failed to open key error: ' + error[result];
        }

        if (value.type === types.LPCWSTR) {
            value = types.LPCWSTR.toString(value);
        }

        return value;
    },
    setValueForKeyObject: function (key, valueName, valueType, value) {
        if (valueType < 1 || valueType > 8) {
            throw 'Invalid valueType parameter: ' + valueType + ' use values from windef.REG_VALUE_TYPE';
        }
        var buffer,
            byte,
            result;

        switch (valueType) {
            case windef.REG_VALUE_TYPE.REG_SZ:
            case windef.REG_VALUE_TYPE.REG_EXPAND_SZ:
            case windef.REG_VALUE_TYPE.REG_LINK:
                buffer = types.LPCWSTR.fromString(value);
                byte = ref.alloc(types.LPBYTE, buffer);
                result = advApi.RegSetValueExW(key.handle.deref(), valueName, null, valueType, byte.deref(), buffer.length);
                break;
            case windef.REG_VALUE_TYPE.REG_BINARY:
                // we assume that the value is a buffer since it should be binary data
                buffer = value;
                byte = ref.alloc(types.LPBYTE, buffer);
                result = advApi.RegSetValueExW(key.handle.deref(), valueName, null, valueType, byte.deref(), buffer.length);
                break;
            case windef.REG_VALUE_TYPE.REG_DWORD:
            case windef.REG_VALUE_TYPE.REG_DWORD_BIG_ENDIAN:
            case windef.REG_VALUE_TYPE.REG_DWORD_LITTLE_ENDIAN:
                buffer = new Buffer(4, value);
                result = advApi.RegSetValueExW(key.handle.deref(), valueName, null, valueType, byte.deref(), buffer.length);
                break;
            default:
                throw 'The type ' + valueType + ' is currently unsupported';
        }

        if (result !== 0) {
            throw 'Failed to open key error: ' + error[result];
        }
    },
    createKey: function (key, subKeyName, accessLevel) {
        var pHkey = ref.alloc(types.PHKEY, new Buffer(ref.sizeof.pointer));

        var result = advApi.RegCreateKeyExW(key.handle.deref(), subKeyName, null, null, windef.REG_OPTION_NON_VOLATILE, accessLevel, null, pHkey, null);

        if (result !== 0) {
            throw 'Failed to open key error: ' + error[result];
        }
    },
    deleteKey: function (key, subKeyName) {
        var result = advApi.RegDeleteTreeW(key.handle.deref(), subKeyName);

        if (result !== 0) {
            throw 'Failed to delete key error ' + result + ':' + error[result];
        }
    },
    deleteValue: function (key, value) {
        var result = advApi.RegDeleteValueW(key.handle.deref(), value);

        if (result !== 0) {
            throw 'Failed to delete value error ' + result + ':' + error[result];
        }
    },
    closeKey: function (key) {
        var result = advApi.RegCloseKey(key.handle.deref());

        if (result !== 0) {
            throw 'Failed to open key error ' + result + ':' + error[result];
        }
    }
};

module.exports = api;
