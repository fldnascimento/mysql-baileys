"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMySQLAuthState = void 0;
const promise_1 = require("mysql2/promise");
const Utils_1 = require("../Utils");
/**
 * Stores the full authentication state in mysql
 * Far more efficient than file
 * @param {string} host - The hostname of the database you are connecting to. (Default: localhost)
 * @param {number} port - The port number to connect to. (Default: 3306)
 * @param {string} user - The MySQL user to authenticate as. (Default: root)
 * @param {string} password - The password of that MySQL user
 * @param {string} password1 - Alias for the MySQL user password. Makes a bit more sense in a multifactor authentication setup (see "password2" and "password3")
 * @param {string} password2 - 2nd factor authentication password. Mandatory when the authentication policy for the MySQL user account requires an additional authentication method that needs a password.
 * @param {string} password3 - 3rd factor authentication password. Mandatory when the authentication policy for the MySQL user account requires two additional authentication methods and the last one needs a password.
 * @param {string} database - Name of the database to use for this connection. (Default: base)
 * @param {string} tableName - MySql table name. (Default: auth)
 * @param {number} retryRequestDelayMs - Retry the query at each interval if it fails. (Default: 200ms)
 * @param {number} maxtRetries - Maximum attempts if the query fails. (Default: 10)
 * @param {string} session - Session name to identify the connection, allowing multisessions with mysql.
 * @param {string} localAddress - The source IP address to use for TCP connection.
 * @param {string} socketPath - The path to a unix domain socket to connect to. When used host and port are ignored.
 * @param {boolean} insecureAuth - Allow connecting to MySQL instances that ask for the old (insecure) authentication method. (Default: false)
 * @param {boolean} isServer - If your connection is a server. (Default: false)
 */
let conn;
async function connection(config, force = false) {
    var _a;
    const ended = !!((_a = conn === null || conn === void 0 ? void 0 : conn.connection) === null || _a === void 0 ? void 0 : _a._closing);
    const newConnection = conn === undefined;
    if (newConnection || ended || force) {
        conn = await (0, promise_1.createConnection)({
            database: config.database || 'base',
            host: config.host || 'localhost',
            port: config.port || 3306,
            user: config.user || 'root',
            password: config.password,
            password1: config.password1,
            password2: config.password2,
            password3: config.password3,
            enableKeepAlive: true,
            keepAliveInitialDelay: 5000,
            ssl: config.ssl,
            localAddress: config.localAddress,
            socketPath: config.socketPath,
            insecureAuth: config.insecureAuth || false,
            isServer: config.isServer || false
        });
    }
    return conn;
}
const useMySQLAuthState = async (config) => {
    const sqlConn = await connection(config);
    const tableName = config.tableName || 'auth';
    const retryRequestDelayMs = config.retryRequestDelayMs || 200;
    const maxtRetries = config.maxtRetries || 10;
    const query = async (sql, values) => {
        for (let x = 0; x < maxtRetries; x++) {
            try {
                const [rows] = await sqlConn.query(sql, values);
                return rows;
            }
            catch (e) {
                await new Promise(r => setTimeout(r, retryRequestDelayMs));
            }
        }
        return [];
    };
    const readData = async (id) => {
        var _a;
        const data = await query(`SELECT value FROM ${tableName} WHERE id = ? AND session = ?`, [id, config.session]);
        if (!((_a = data[0]) === null || _a === void 0 ? void 0 : _a.value)) {
            return null;
        }
        const creds = typeof data[0].value === 'object' ? JSON.stringify(data[0].value) : data[0].value;
        const credsParsed = JSON.parse(creds, Utils_1.BufferJSON.reviver);
        return credsParsed;
    };
    const writeData = async (id, value) => {
        const valueFixed = JSON.stringify(value, Utils_1.BufferJSON.replacer);
        await query(`INSERT INTO ${tableName} (session, id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?`, [config.session, id, valueFixed, valueFixed]);
    };
    const removeData = async (id) => {
        await query(`DELETE FROM ${tableName} WHERE id = ? AND session = ?`, [id, config.session]);
    };
    const clearAll = async () => {
        await query(`DELETE FROM ${tableName} WHERE id != 'creds' AND session = ?`, [config.session]);
    };
    const removeAll = async () => {
        await query(`DELETE FROM ${tableName} WHERE session = ?`, [config.session]);
    };
    const creds = await readData('creds') || (0, Utils_1.initAuthCreds)();
    return {
        state: {
            creds: creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = (0, Utils_1.fromObject)(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const name = `${category}-${id}`;
                            if (value) {
                                await writeData(name, value);
                            }
                            else {
                                await removeData(name);
                            }
                        }
                    }
                }
            }
        },
        saveCreds: async () => {
            await writeData('creds', creds);
        },
        clear: async () => {
            await clearAll();
        },
        removeCreds: async () => {
            await removeAll();
        },
        query: async (sql, values) => {
            return await query(sql, values);
        }
    };
};
exports.useMySQLAuthState = useMySQLAuthState;
