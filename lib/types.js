'use strict';
var ref = require('ref');

var WCString = (function () {
    var type = Object.create(ref.types.CString);
    var encoding = 'utf16le';
    type.name = 'WCString';
    type.toString = function toString(buffer) {
        // Strip trailing nul if present
        var length = buffer.length;
        if ((length > 2) && (buffer.readInt16LE(length - 2) === 0)) {
            length -= 2;
        }
        return buffer.toString(encoding, 0, length);
    };
    type.fromString = function fromString(input) {
        if ((input !== null) && (typeof (input) !== 'undefined')) {
            return Buffer.from(input + '\0', encoding);
        }
        return null;
    };
    type.get = function get(buf, offset) {
        var _buf = buf.readPointer(offset);
        if (_buf.isNull()) {
            return null;
        }
        var stringBuf = _buf.reinterpretUntilZeros(exports.size);
        return type.toString(stringBuf);
    };
    type.set = function set(buf, offset, val) {
        var _buf = Buffer.isBuffer(val) ? val : type.fromString(val);
        return buf.writePointer(_buf, offset);
    };
    return type;
})();

var types = {
    REGSAM: ref.types.ulong,
    DWORD: ref.types.uint32,
    ULONG: ref.types.ulong,
    HWND: ref.refType(ref.types.void),
    BYTE: ref.types.uint8,
    HKEY: ref.refType(ref.types.void),
    PVOID: ref.refType('pointer'),
    HANDLE: ref.refType(ref.types.void),
    HINSTANCE: ref.refType(ref.types.void),
    LPCSTR: ref.refType(ref.types.CString),
    LPCWSTR: WCString,
    STRING: ref.types.CString,
    INT: ref.types.int,
    LPVOID: ref.refType(ref.types.void)
};

types.PHKEY = ref.refType(types.HKEY);
types.LPBYTE = ref.refType(types.BYTE);
types.LPDWORD = ref.refType(types.DWORD);
module.exports = types;
