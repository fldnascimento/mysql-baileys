/// <reference types="long" />
/// <reference types="node" />
import { valueReplacer, valueReviver, AppDataSync } from '../Types';
export declare const fromObject: (args: AppDataSync) => {
    keyData: Uint8Array;
    fingerprint: {
        rawId: number;
        currentIndex: number;
        deviceIndexes: number[];
    };
    timestamp: number | import("long").Long;
};
export declare const BufferJSON: {
    replacer: (_: string, value: valueReplacer) => valueReplacer | {
        type: string;
        data: string;
    };
    reviver: (_: string, value: valueReviver) => Buffer | valueReviver;
};
export declare const initAuthCreds: () => {
    noiseKey: {
        private: Buffer;
        public: Buffer;
    };
    pairingEphemeralKeyPair: {
        private: Buffer;
        public: Buffer;
    };
    signedIdentityKey: {
        private: Buffer;
        public: Buffer;
    };
    signedPreKey: {
        keyPair: {
            private: Buffer;
            public: Buffer;
        };
        signature: any;
        keyId: number;
    };
    registrationId: number;
    advSecretKey: string;
    processedHistoryMessages: never[];
    nextPreKeyId: number;
    firstUnuploadedPreKeyId: number;
    accountSyncCounter: number;
    accountSettings: {
        unarchiveChats: boolean;
    };
    deviceId: string;
    phoneId: `${string}-${string}-${string}-${string}-${string}`;
    identityId: Buffer;
    backupToken: Buffer;
    registered: boolean;
    registration: never;
    pairingCode: undefined;
    lastPropHash: undefined;
    routingInfo: undefined;
};
