import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection, type DBSQLiteValues, type capSQLiteChanges, type capSQLiteUpgradeOptions, type capSQLiteVersionUpgrade } from '@radroots/capacitor-sqlite';
import { LocationGcsSchema, location_gcs_sort, models_initial_upgrade, parse_location_gcs_form_field_types, parse_location_gcss, type ILocationGcsGet, type ILocationGcsGetList, type ILocationGcsQueryBindValues, type ILocationGcsQueryBindValuesTuple, type ILocationGcsUpdate, type IModelsQueryBindValueOpt, type IModelsQueryBindValueTuple, type IModelsQueryParam, type LocationGcs, type LocationGcsFields, type LocationGcsFormFields } from "@radroots/models";
import { err_msg, time_created_on, uuidv4 } from '@radroots/utils';

const models_upgrades = [
    {
        toVersion: 1,
        statements: [
            ...models_initial_upgrade
        ]
    }
];

export type IISQLiteServiceDatabaseLog = { key: string, bind_values: IModelsQueryBindValueOpt[], query: string, e: any };
export type IISQLiteServiceOpenDatabase = {
    platform: string;
    database: string;
    upgrade: capSQLiteVersionUpgrade[];
    version: number;
};

export type IISQLiteServiceMessage =

    | "*-location-gcs-geohash-unique" | "*-validate"
    | "*-result"
    | "*-fields"
    | "*-open"
    | "*-connect"
    | "*-db"
    | "*-exe-result"
    | "*-exe"
    | "*-sel-result"
    | "*-sel"
    | "*";

class SQLiteVersionService {
    version_map: Map<string, number> = new Map();

    set_version(db_name: string, version: number) {
        this.version_map.set(db_name, version);
    };
    get_version(db_name: string): number | undefined {
        const version = this.version_map.get(db_name);
        return version;
    };
};
const sqlite_version_svc = new SQLiteVersionService();

export class SQLiteService {
    private _platform = Capacitor.getPlatform();
    private _plugin = CapacitorSQLite;
    private _conn = new SQLiteConnection(CapacitorSQLite);
    private _db_version_dict: Map<string, number> = new Map();
    private _logs: IISQLiteServiceDatabaseLog[] = [];

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
            throw new Error(`SQLiteService.init_web_store: ${error}`);
        }
    }
    public async add_upgrade(options: capSQLiteUpgradeOptions): Promise<void> {
        try {
            await this._plugin.addUpgradeStatement(options);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`SQLiteService.add_upgrade: ${error}`);
        }
    }
    public async open_db(db_name: string, loadToVersion: number, read_only: boolean, encryption_passphrase?: string): Promise<SQLiteDBConnection> {
        this._db_version_dict.set(db_name, loadToVersion);
        const mode = encryption_passphrase ? "secret" : "no-encryption";
        try {
            let db: SQLiteDBConnection;
            const retCC = (await this._conn.checkConnectionsConsistency()).result;
            const isConn = (await this._conn.isConnection(db_name, read_only)).result;
            if (retCC && isConn) {
                db = await this._conn.retrieveConnection(db_name, read_only);
            } else {
                db = await this._conn
                    .createConnection(db_name, !!encryption_passphrase, mode, loadToVersion, read_only);
            };
            await db.open();
            const res = (await db.isDBOpen()).result!;
            if (!res) {
                throw new Error('SQLiteService.open_db: database not opened')
            }
            return db;
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`SQLiteService.open_db: ${error}`);
        }
    }
    public async close_db(db_name: string, read_only: boolean): Promise<void> {
        try {
            const isConn = (await this._conn.isConnection(db_name, read_only)).result;
            if (isConn) {
                await this._conn.closeConnection(db_name, read_only);
            }
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`SQLiteService.close_db: ${error}`);
        }
    }
    public async save_to_store(db_name: string): Promise<void> {
        try {
            await this._conn.saveToStore(db_name);
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`SQLiteService.save_to_store: ${error}`);
        }
    }
    public async save_to_disk(db_name: string): Promise<void> {
        try {
            await this._conn.saveToLocalDisk(db_name);
            return;
        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`SQLiteService.save_to_disk: ${error}`);
        }
    }
    public async is_connected(db_name: string, read_only: boolean): Promise<boolean> {
        try {
            const is_connected = (await this._conn.isConnection(db_name, read_only)).result;
            if (is_connected !== undefined) {
                return is_connected;
            } else {
                throw new Error(`SQLiteService.is_connected undefined`);
            }

        } catch (e) {
            const { error } = err_msg(e);
            throw new Error(`SQLiteService.is_connected: ${error}`);
        }
    }
}
const sqlite_svc = new SQLiteService();

export class CapacitorClientSQLite {
    private _platform = sqlite_svc.platform;
    private _db_name: string | null = null;
    private _db: SQLiteDBConnection | null = null;
    private _upgrade = models_upgrades;
    private _version = models_upgrades[models_upgrades.length - 1].toVersion;

    public get logs() {
        return sqlite_svc.logs;
    }

    //
    // private
    private append_logs(log_key: IISQLiteServiceMessage, bind_values: any, query: string, e: any): IISQLiteServiceMessage {
        sqlite_svc.logs.push({
            key: "database-" + log_key,
            bind_values,
            query,
            e,
        })
        return log_key;
    }

    private filter_bind_value_fields(fields: IModelsQueryBindValueTuple[]): IModelsQueryBindValueTuple[] {
        return fields.filter(([_, v]) => !!v);
    }

    private async execute(query: string, bv_o?: IModelsQueryBindValueOpt): Promise<capSQLiteChanges | IISQLiteServiceMessage> {
        try {
            if (!this._db) return "*-db";
            const result = await this._db.run(query, bv_o ? bv_o : undefined);
            if (sqlite_svc.platform === "web" && this._db_name) await sqlite_svc.save_to_store(this._db_name);
            if (result) return result;
            return this.append_logs("*-exe-result", bv_o, query, result);
        } catch (e) {
            const { error } = err_msg(e, "execute");
            if (String(e).includes("UNIQUE constraint failed: location_gcs.geohash")) return "*-location-gcs-geohash-unique";
            return this.append_logs("*-exe", bv_o, query, error);
        };
    };

    private async select(query: string, bv_o?: IModelsQueryBindValueOpt): Promise<DBSQLiteValues | IISQLiteServiceMessage> {
        try {
            if (!this._db) return "*-db";
            const result = await this._db.query(query, bv_o ? bv_o : undefined);
            if (result) return result;
            return this.append_logs("*-sel-result", bv_o, query, result);
        } catch (e) {
            const { error } = err_msg(e, "select");
            return this.append_logs("*-sel", bv_o, query, error);
        };
    };

    private async open(opts: IISQLiteServiceOpenDatabase): Promise<undefined | IISQLiteServiceMessage> {
        try {
            if (this._platform === "web") await sqlite_svc.init_web_store();
            await sqlite_svc.add_upgrade({
                database: opts.database,
                upgrade: opts.upgrade
            });
            const db = await sqlite_svc.open_db(opts.database, opts.version, false);
            sqlite_version_svc.set_version(opts.database, opts.version);
            if (!db) return "*-db";
            if (opts.platform === "web") await sqlite_svc.save_to_store(opts.database);
            this._db = db;
            this._db_name = opts.database;
            return this.append_logs("*-open", [], "database opened", [new Date().toISOString()]);
        } catch (e) {
            const { error } = err_msg(e, "open");
            return this.append_logs("*-open", [], "catch", error);
        };
    }

    public async connect(database: string): Promise<true | IISQLiteServiceMessage> {
        try {
            this._db_name = database;
            await this.open({
                platform: this._platform,
                database,
                upgrade: this._upgrade,
                version: this._version,
            }).then(async () => {
                if (this._platform === "web") await sqlite_svc.save_to_store(database);
            });
            return true;
        } catch (e) {
            const { error } = err_msg(e, "connect");
            return this.append_logs("*-connect", [], "catch", error);
        };
    }

    private location_gcs_add_validate(opts: LocationGcsFormFields): LocationGcsFields | string[] {
        const opts_filtered = Object.entries(opts).reduce((acc: Record<string, (string | number)>, [key, value]) => {
            if (!!value) {
                switch (parse_location_gcs_form_field_types(key)) {
                    case "string":
                        acc[key] = value;
                        break;
                    case "number":
                        acc[key] = Number(value);
                        break;
                }
            };
            return acc;
        }, {});
        const location_gcs_v = LocationGcsSchema.safeParse(opts_filtered);
        if (!location_gcs_v.success) return location_gcs_v.error.issues.map(i => i.message);
        else return {
            ...location_gcs_v.data,
        };
    };

    public async location_gcs_add(opts: LocationGcsFormFields): Promise<{ id: string; } | string[] | IISQLiteServiceMessage> {
        const optsv = this.location_gcs_add_validate(opts);
        if (Array.isArray(optsv)) return optsv;
        const fields = Object.entries(optsv);
        if (!fields.length) return "*-fields";
        const id = uuidv4();
        const bind_values_tup: IModelsQueryBindValueTuple[] = [
            ["id", id],
            ["created_at", time_created_on()]
        ];
        for (const field of this.filter_bind_value_fields(fields)) bind_values_tup.push(field);
        const bind_values = bind_values_tup.map(([_, v]) => v);
        const query = `INSERT INTO location_gcs (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, num) => `$${1 + num}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id };
            else if (typeof result === "string") return result;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["location_gcs_add", e]);
        };
    };

    private location_gcs_query_bind_values = (opts: ILocationGcsQueryBindValues): ILocationGcsQueryBindValuesTuple => {
        if ("id" in opts) return ["id", opts.id];
        else return ["geohash", opts.geohash];
    };

    private location_gcs_get_query_list = (opts: ILocationGcsGetList): IModelsQueryParam => {
        const sort = location_gcs_sort[opts.sort || "newest"];
        let query = "";
        let bind_values = null;
        if (opts.list[0] === "all") {
            query = `SELECT * FROM location_gcs ORDER BY ${sort};`;
        }
        if (!query) throw new Error("Error: Missing query (location_gcs_get_query_list)")
        return {
            query,
            bind_values
        };
    };

    private location_gcs_get_parse_opts = (opts: ILocationGcsGet): IModelsQueryParam => {
        if ("list" in opts) return this.location_gcs_get_query_list(opts);
        else {
            const bv_tup = this.location_gcs_query_bind_values(opts);
            return {
                query: `SELECT * FROM location_gcs WHERE ${bv_tup[0]} = $1;`,
                bind_values: [bv_tup[1]]
            };
        };
    };

    public async location_gcs_get(opts: ILocationGcsGet): Promise<LocationGcs[] | IISQLiteServiceMessage> {
        const { query, bind_values } = this.location_gcs_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return response;
            else {
                const result = parse_location_gcss(response);
                if (result) return result;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", opts, query, ["location_gcs_get", e]);
        };
    };

    public async location_gcs_delete(opts: ILocationGcsQueryBindValues): Promise<true | IISQLiteServiceMessage> {
        const bv_tup = this.location_gcs_query_bind_values(opts);
        const bind_values = [bv_tup[1]];
        const query = `DELETE FROM location_gcs WHERE ${bv_tup[0]} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["location_gcs_delete", e]);
        };
    };

    public async location_gcs_update(opts: ILocationGcsUpdate): Promise<true | string[] | IISQLiteServiceMessage> {
        const optsv = this.location_gcs_add_validate(opts.fields);
        if (Array.isArray(optsv)) return optsv;
        const fields = this.filter_bind_value_fields(Object.entries(optsv));
        if (!fields.length) return "*-fields";
        const bv_tup = this.location_gcs_query_bind_values(opts.on);
        const bind_values = [bv_tup[1], ...fields.map(([_, v]) => v)];
        const query = `UPDATE location_gcs SET ${fields.map(([k], num) => `${k} = $${1 + num}`).join(", ")} WHERE ${bv_tup[0]} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["location_gcs_update", e]);
        };
    };
};