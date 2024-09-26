import { type capSQLiteChanges, type DBSQLiteValues, SQLiteDBConnection } from "@radroots/capacitor-sqlite";
import { type IModelsQueryValue, type IModelsQueryParam, type IModelsQueryBindValue, type IModelsQueryBindValueTuple, type IModelsQueryBindValueOpt, parse_location_gcs_form_fields, location_gcs_sort, type ILocationGcsGetList, type ILocationGcsGet, type ILocationGcsUpdate, type ILocationGcsQueryBindValues, type ILocationGcsQueryBindValuesKey, type ILocationGcsQueryBindValuesTuple, parse_location_gcs, parse_location_gcs_list, type LocationGcs, type LocationGcsFields, type LocationGcsFormFields, LocationGcsSchema, parse_trade_product_form_fields, trade_product_sort, type ITradeProductGetList, type ITradeProductGet, type ITradeProductUpdate, type ITradeProductQueryBindValues, type ITradeProductQueryBindValuesKey, type ITradeProductQueryBindValuesTuple, parse_trade_product, parse_trade_product_list, type TradeProduct, type TradeProductFields, type TradeProductFormFields, TradeProductSchema, parse_nostr_profile_form_fields, nostr_profile_sort, type INostrProfileGetList, type INostrProfileGet, type INostrProfileUpdate, type INostrProfileQueryBindValues, type INostrProfileQueryBindValuesKey, type INostrProfileQueryBindValuesTuple, parse_nostr_profile, parse_nostr_profile_list, type NostrProfile, type NostrProfileFields, type NostrProfileFormFields, NostrProfileSchema, NostrProfileMetadataSchema} from "@radroots/models";
import { err_msg, time_created_on, uuidv4 } from "@radroots/utils";
import { sqlite_svc, sqlite_version_svc, type IISQLiteServiceOpenDatabase } from "./sqlite_lib";

export type ICapacitorClientSQLiteUpgrade = { toVersion: number; statements: string[]; };
export type ICapacitorClientSQLiteMessage = 
	| "*-location-gcs-geohash-unique"
	| "*-validate"
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

export class CapacitorClientSQLite {
    private _platform = sqlite_svc.platform;
    private _db_name: string | null = null;
    private _db: SQLiteDBConnection | null = null;
    private _upgrade: ICapacitorClientSQLiteUpgrade[];
    private _version: number;

    constructor(upgrade: ICapacitorClientSQLiteUpgrade[]) {
        this._upgrade = upgrade;
        this._version = upgrade[upgrade.length - 1].toVersion;
    }

    private append_logs(log_key: ICapacitorClientSQLiteMessage, bind_values: any, query: string, e: any): ICapacitorClientSQLiteMessage {
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

    private async execute(query: string, bv_o?: IModelsQueryBindValueOpt): Promise<capSQLiteChanges | ICapacitorClientSQLiteMessage> {
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
    }

    private async select(query: string, bv_o?: IModelsQueryBindValueOpt): Promise<DBSQLiteValues | ICapacitorClientSQLiteMessage> {
        try {
            if (!this._db) return "*-db";
            const result = await this._db.query(query, bv_o ? bv_o : undefined);
            if (result) return result;
            return this.append_logs("*-sel-result", bv_o, query, result);
        } catch (e) {
            const { error } = err_msg(e, "select");
            return this.append_logs("*-sel", bv_o, query, error);
        };
    }

    private async open(opts: IISQLiteServiceOpenDatabase): Promise<undefined | ICapacitorClientSQLiteMessage> {
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

    public get logs() {
        return sqlite_svc.logs;
    }

    public async connect(database: string): Promise<true | ICapacitorClientSQLiteMessage> {
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
    
    private location_gcs_add_validate(fields: LocationGcsFormFields): LocationGcsFields | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_location_gcs_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = LocationGcsSchema;
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async location_gcs_add(opts: LocationGcsFormFields): Promise<{ id: string; } | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.location_gcs_add_validate(opts);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = Object.entries(opts_v);
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
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id,  };      
            else if (typeof result === "string") return result;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["location_gcs_add", e]);
        };
    }

    private location_gcs_query_bind_values = (opts: ILocationGcsQueryBindValues): ILocationGcsQueryBindValuesTuple => {
        if ("id" in opts) return ["id", opts.id];
        else return ["geohash", opts.geohash];
    }

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
    }

    private location_gcs_get_parse_opts = (opts: ILocationGcsGet): IModelsQueryParam => {
        if ("list" in opts) return this.location_gcs_get_query_list(opts);
        else {
            const [bv_k, bv_v] = this.location_gcs_query_bind_values(opts);
            return {
                query: `SELECT * FROM location_gcs WHERE ${bv_k} = $1;`,
                bind_values: [bv_v]
            };
        };
    }

    public async location_gcs_get(opts: ILocationGcsGet): Promise<LocationGcs[] | ICapacitorClientSQLiteMessage> {
        const { query, bind_values } = this.location_gcs_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return response;
            else {
                const result = parse_location_gcs_list(response);
                if (result) return result;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", opts, query, ["location_gcs_get", e]);
        };
    }

    public async location_gcs_delete(opts: ILocationGcsQueryBindValues): Promise<true | ICapacitorClientSQLiteMessage> {
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
    }

    public async location_gcs_update(opts: ILocationGcsUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.location_gcs_add_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
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
    }
    
    private trade_product_add_validate(fields: TradeProductFormFields): TradeProductFields | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_trade_product_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = TradeProductSchema;
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async trade_product_add(opts: TradeProductFormFields): Promise<{ id: string; } | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.trade_product_add_validate(opts);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = Object.entries(opts_v);
        if (!fields.length) return "*-fields";
        const id = uuidv4();
        const bind_values_tup: IModelsQueryBindValueTuple[] = [
            ["id", id],
            ["created_at", time_created_on()]
        ];
        for (const field of this.filter_bind_value_fields(fields)) bind_values_tup.push(field);
        const bind_values = bind_values_tup.map(([_, v]) => v);
        const query = `INSERT INTO trade_product (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, num) => `$${1 + num}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id,  };      
            else if (typeof result === "string") return result;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["trade_product_add", e]);
        };
    }

    private trade_product_query_bind_values = (opts: ITradeProductQueryBindValues): ITradeProductQueryBindValuesTuple => {
        if ("id" in opts) return ["id", opts.id];
        else return ["url", opts.url];
    }

    private trade_product_get_query_list = (opts: ITradeProductGetList): IModelsQueryParam => {
        const sort = trade_product_sort[opts.sort || "newest"];
        let query = "";
        let bind_values = null;
        if (opts.list[0] === "all") {
            query = `SELECT * FROM trade_product ORDER BY ${sort};`;
        }
        if (!query) throw new Error("Error: Missing query (trade_product_get_query_list)")
        return {
            query,
            bind_values
        };
    }

    private trade_product_get_parse_opts = (opts: ITradeProductGet): IModelsQueryParam => {
        if ("list" in opts) return this.trade_product_get_query_list(opts);
        else {
            const [bv_k, bv_v] = this.trade_product_query_bind_values(opts);
            return {
                query: `SELECT * FROM trade_product WHERE ${bv_k} = $1;`,
                bind_values: [bv_v]
            };
        };
    }

    public async trade_product_get(opts: ITradeProductGet): Promise<TradeProduct[] | ICapacitorClientSQLiteMessage> {
        const { query, bind_values } = this.trade_product_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return response;
            else {
                const result = parse_trade_product_list(response);
                if (result) return result;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", opts, query, ["trade_product_get", e]);
        };
    }

    public async trade_product_delete(opts: ITradeProductQueryBindValues): Promise<true | ICapacitorClientSQLiteMessage> {
        const bv_tup = this.trade_product_query_bind_values(opts);
        const bind_values = [bv_tup[1]];
        const query = `DELETE FROM trade_product WHERE ${bv_tup[0]} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["trade_product_delete", e]);
        };
    }

    public async trade_product_update(opts: ITradeProductUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.trade_product_add_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
        if (!fields.length) return "*-fields";
        const bv_tup = this.trade_product_query_bind_values(opts.on);
        const bind_values = [bv_tup[1], ...fields.map(([_, v]) => v)];
        const query = `UPDATE trade_product SET ${fields.map(([k], num) => `${k} = $${1 + num}`).join(", ")} WHERE ${bv_tup[0]} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["trade_product_update", e]);
        };
    }
    
    private nostr_profile_add_validate(fields: NostrProfileFormFields): NostrProfileFields | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_nostr_profile_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = NostrProfileSchema.and(NostrProfileMetadataSchema);
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async nostr_profile_add(opts: NostrProfileFormFields): Promise<{ id: string; } | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.nostr_profile_add_validate(opts);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = Object.entries(opts_v);
        if (!fields.length) return "*-fields";
        const id = uuidv4();
        const bind_values_tup: IModelsQueryBindValueTuple[] = [
            ["id", id],
            ["created_at", time_created_on()]
        ];
        for (const field of this.filter_bind_value_fields(fields)) bind_values_tup.push(field);
        const bind_values = bind_values_tup.map(([_, v]) => v);
        const query = `INSERT INTO nostr_profile (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, num) => `$${1 + num}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id,  };      
            else if (typeof result === "string") return result;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["nostr_profile_add", e]);
        };
    }

    private nostr_profile_query_bind_values = (opts: INostrProfileQueryBindValues): INostrProfileQueryBindValuesTuple => {
        if ("public_key" in opts) return ["public_key", opts.public_key];
        else return ["nip05", opts.nip05];
    }

    private nostr_profile_get_query_list = (opts: INostrProfileGetList): IModelsQueryParam => {
        const sort = nostr_profile_sort[opts.sort || "newest"];
        let query = "";
        let bind_values = null;
        if (opts.list[0] === "all") {
            query = `SELECT * FROM nostr_profile ORDER BY ${sort};`;
        }
        if (!query) throw new Error("Error: Missing query (nostr_profile_get_query_list)")
        return {
            query,
            bind_values
        };
    }

    private nostr_profile_get_parse_opts = (opts: INostrProfileGet): IModelsQueryParam => {
        if ("list" in opts) return this.nostr_profile_get_query_list(opts);
        else {
            const [bv_k, bv_v] = this.nostr_profile_query_bind_values(opts);
            return {
                query: `SELECT * FROM nostr_profile WHERE ${bv_k} = $1;`,
                bind_values: [bv_v]
            };
        };
    }

    public async nostr_profile_get(opts: INostrProfileGet): Promise<NostrProfile[] | ICapacitorClientSQLiteMessage> {
        const { query, bind_values } = this.nostr_profile_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return response;
            else {
                const result = parse_nostr_profile_list(response);
                if (result) return result;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", opts, query, ["nostr_profile_get", e]);
        };
    }

    public async nostr_profile_delete(opts: INostrProfileQueryBindValues): Promise<true | ICapacitorClientSQLiteMessage> {
        const bv_tup = this.nostr_profile_query_bind_values(opts);
        const bind_values = [bv_tup[1]];
        const query = `DELETE FROM nostr_profile WHERE ${bv_tup[0]} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["nostr_profile_delete", e]);
        };
    }

    public async nostr_profile_update(opts: INostrProfileUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.nostr_profile_add_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
        if (!fields.length) return "*-fields";
        const bv_tup = this.nostr_profile_query_bind_values(opts.on);
        const bind_values = [bv_tup[1], ...fields.map(([_, v]) => v)];
        const query = `UPDATE nostr_profile SET ${fields.map(([k], num) => `${k} = $${1 + num}`).join(", ")} WHERE ${bv_tup[0]} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["nostr_profile_update", e]);
        };
    }
};