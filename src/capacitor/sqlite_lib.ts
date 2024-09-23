import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, type capSQLiteUpgradeOptions, type capSQLiteVersionUpgrade, SQLiteConnection, SQLiteDBConnection } from "@radroots/capacitor-sqlite";
import type { IModelsQueryBindValueOpt } from "@radroots/models";
import { err_msg } from "@radroots/utils";

export type ISQLiteServiceDatabaseLog = { key: string, bind_values: IModelsQueryBindValueOpt[], query: string, e: any };
export type IISQLiteServiceOpenDatabase = {
    platform: string;
    database: string;
    upgrade: capSQLiteVersionUpgrade[];
    version: number;
};

export class CapacitorClientSQLiteVersionService {
    version_map: Map<string, number> = new Map();

    set_version(db_name: string, version: number) {
        this.version_map.set(db_name, version);
    }
    
    get_version(db_name: string): number | undefined {
        const version = this.version_map.get(db_name);
        return version;
    }
};

export class CapacitorClientSQLiteService {
    private _platform = Capacitor.getPlatform();
    private _plugin = CapacitorSQLite;
    private _conn = new SQLiteConnection(CapacitorSQLite);
    private _db_version_dict: Map<string, number> = new Map();
    private _logs: ISQLiteServiceDatabaseLog[] = [];

    public get logs() {
        return this._logs;
    }

    public get platform() {
        return this._platform;
    }
    
    public async init_web_store(): Promise<void> {
        try {
            await this._conn.initWebStore();
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService init_web_store: ${error}`);
        }
    }
    
    public async add_upgrade(options: capSQLiteUpgradeOptions): Promise<void> {
        try {
            await this._plugin.addUpgradeStatement(options);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService add_upgrade: ${error}`);
        }
    }

    public async open_db(db_name: string, loadToVersion: number, read_only: boolean, encryption_passphrase?: string): Promise<SQLiteDBConnection> {
        this._db_version_dict.set(db_name, loadToVersion);
        const mode = encryption_passphrase ? "secret" : "no-encryption";
        try {
            let db: SQLiteDBConnection;
            const ret_cc = (await this._conn.checkConnectionsConsistency()).result;
            const is_conn = (await this._conn.isConnection(db_name, read_only)).result;
            if (ret_cc && is_conn) db = await this._conn.retrieveConnection(db_name, read_only);
            else db = await this._conn
                .createConnection(db_name, !!encryption_passphrase, mode, loadToVersion, read_only);
            await db.open();
            const res = (await db.isDBOpen()).result!;
            if (!res) throw new Error('Error: CapacitorClientSQLiteService open_db: database not opened')
            return db;
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService open_db: ${error}`);
        }
    }
    
    public async close_db(db_name: string, read_only: boolean): Promise<void> {
        try {
            const is_conn = (await this._conn.isConnection(db_name, read_only)).result;
            if (is_conn) await this._conn.closeConnection(db_name, read_only);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService close_db: ${error}`);
        }
    }
    
    public async save_to_store(db_name: string): Promise<void> {
        try {
            await this._conn.saveToStore(db_name);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService save_to_store: ${error}`);
        }
    }
    
    public async save_to_disk(db_name: string): Promise<void> {
        try {
            await this._conn.saveToLocalDisk(db_name);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService save_to_disk: ${error}`);
        }
    }
    
    public async is_conn(db_name: string, read_only: boolean): Promise<boolean> {
        try {
            const is_conn = (await this._conn.isConnection(db_name, read_only)).result;
            if (is_conn !== undefined) return is_conn;
            throw new Error(`Error: CapacitorClientSQLiteService is_conn undefined`);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`Error: CapacitorClientSQLiteService is_conn: ${error}`);
        }
    }
};

export const sqlite_version_svc = new CapacitorClientSQLiteVersionService();
export const sqlite_svc = new CapacitorClientSQLiteService();