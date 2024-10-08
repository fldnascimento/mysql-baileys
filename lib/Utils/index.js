"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuthCreds = exports.BufferJSON = exports.fromObject = void 0;
const libsignal_1 = require("libsignal");
const crypto_1 = require("crypto");
const generateKeyPair = () => {
    const { pubKey, privKey } = libsignal_1.curve.generateKeyPair();
    return {
        private: Buffer.from(privKey),
        public: Buffer.from(pubKey.slice(1))
    };
};
const generateSignalPubKey = (pubKey) => {
    return pubKey.length === 33 ? pubKey : Buffer.concat([Buffer.from([5]), pubKey]);
};
const sign = (privateKey, buf) => {
    return libsignal_1.curve.calculateSignature(privateKey, buf);
};
const signedKeyPair = (identityKeyPair, keyId) => {
    const preKey = generateKeyPair();
    const pubKey = generateSignalPubKey(preKey.public);
    const signature = sign(identityKeyPair.private, pubKey);
    return { keyPair: preKey, signature, keyId };
};
const allocate = (str) => {
    let p = str.length;
    if (!p) {
        return new Uint8Array(1);
    }
    let n = 0;
    while (--p % 4 > 1 && str.charAt(p) === "=") {
        ++n;
    }
    return new Uint8Array(Math.ceil(str.length * 3) / 4 - n).fill(0);
};
const parseTimestamp = (timestamp) => {
    if (typeof timestamp === 'string') {
        return parseInt(timestamp, 10);
    }
    if (typeof timestamp === "number") {
        return timestamp;
    }
    return timestamp;
};
const fromObject = (args) => {
    const f = {
        ...args.fingerprint,
        deviceIndexes: Array.isArray(args.fingerprint.deviceIndexes) ? args.fingerprint.deviceIndexes : []
    };
    const message = {
        keyData: Array.isArray(args.keyData) ? args.keyData : new Uint8Array(),
        fingerprint: {
            rawId: f.rawId || 0,
            currentIndex: f.rawId || 0,
            deviceIndexes: f.deviceIndexes
        },
        timestamp: parseTimestamp(args.timestamp)
    };
    if (typeof args.keyData === "string") {
        message.keyData = allocate(args.keyData);
    }
    return message;
};
exports.fromObject = fromObject;
exports.BufferJSON = {
    replacer: (_, value) => {
        if ((value === null || value === void 0 ? void 0 : value.type) === 'Buffer' && Array.isArray(value === null || value === void 0 ? void 0 : value.data)) {
            return {
                type: 'Buffer',
                data: Buffer.from(value === null || value === void 0 ? void 0 : value.data).toString('base64')
            };
        }
        return value;
    },
    reviver: (_, value) => {
        if ((value === null || value === void 0 ? void 0 : value.type) === 'Buffer') {
            return Buffer.from(value === null || value === void 0 ? void 0 : value.data, 'base64');
        }
        return value;
    }
};
const initAuthCreds = () => {
    const identityKey = generateKeyPair();
    return {
        noiseKey: generateKeyPair(),
        pairingEphemeralKeyPair: generateKeyPair(),
        signedIdentityKey: identityKey,
        signedPreKey: signedKeyPair(identityKey, 1),
        registrationId: Uint16Array.from((0, crypto_1.randomBytes)(2))[0] & 16383,
        advSecretKey: (0, crypto_1.randomBytes)(32).toString('base64'),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSyncCounter: 0,
        accountSettings: {
            unarchiveChats: false
        },
        deviceId: Buffer.from((0, crypto_1.randomUUID)().replace(/-/g, ''), 'hex').toString('base64url'),
        phoneId: (0, crypto_1.randomUUID)(),
        identityId: (0, crypto_1.randomBytes)(20),
        backupToken: (0, crypto_1.randomBytes)(20),
        registered: false,
        registration: {},
        pairingCode: undefined,
        lastPropHash: undefined,
        routingInfo: undefined
    };
};
exports.initAuthCreds = initAuthCreds;
