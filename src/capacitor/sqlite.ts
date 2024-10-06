import { SQLiteDBConnection, type capSQLiteChanges, type DBSQLiteValues } from "@radroots/capacitor-sqlite";
import { location_gcs_sort, LocationGcsSchema, LocationGcsUpdateSchema, nostr_profile_sort, nostr_relay_sort, NostrProfileMetadataSchema, NostrProfileSchema, NostrProfileUpdateSchema, NostrRelaySchema, NostrRelayUpdateSchema, parse_location_gcs_form_fields, parse_location_gcs_list, parse_nostr_profile_form_fields, parse_nostr_profile_list, parse_nostr_relay_form_fields, parse_nostr_relay_list, parse_trade_product_form_fields, parse_trade_product_list, trade_product_sort, TradeProductSchema, TradeProductUpdateSchema, type ILocationGcsGet, type ILocationGcsGetList, type ILocationGcsQueryBindValues, type ILocationGcsQueryBindValuesTuple, type ILocationGcsUpdate, type IModelsQueryBindValue, type IModelsQueryBindValueTuple, type IModelsQueryParam, type IModelsQueryValue, type INostrProfileGet, type INostrProfileGetList, type INostrProfileQueryBindValues, type INostrProfileQueryBindValuesTuple, type INostrProfileUpdate, type INostrRelayGet, type INostrRelayGetList, type INostrRelayQueryBindValues, type INostrRelayQueryBindValuesTuple, type INostrRelayUpdate, type ITradeProductGet, type ITradeProductGetList, type ITradeProductQueryBindValues, type ITradeProductQueryBindValuesTuple, type ITradeProductUpdate, type LocationGcs, type LocationGcsFields, type LocationGcsFormFields, type ModelsUniqueConstraintMessages, type NostrProfile, type NostrProfileFields, type NostrProfileFormFields, type NostrRelay, type NostrRelayFields, type NostrRelayFormFields, type TradeProduct, type TradeProductFields, type TradeProductFormFields } from "@radroots/models";
import { err_msg, time_created_on, uuidv4 } from "@radroots/utils";
import { sqlite_svc, sqlite_version_svc, type IISQLiteServiceOpenDatabase } from "./sqlite_lib";

export type ICapacitorClientSQLiteMessage =
    | ModelsUniqueConstraintMessages
    | "*-validate"
    | "*-result"
    | "*-fields"
    | "*-open"
    | "*-connect"
    | "*-connection"
    | "*-exe-result"
    | "*-exe"
    | "*-sel-result"
    | "*-sel"
    | "*";

export type ICapacitorClientSQLiteUpgrade = { toVersion: number; statements: string[]; };
export type ICapacitorClientSQLite = {
    database: string;
    upgrade: ICapacitorClientSQLiteUpgrade[];
};

export class CapacitorClientSQLite {
    private _platform = sqlite_svc.platform;
    private _conn: SQLiteDBConnection | null = null;
    private _database: string;
    private _upgrade: ICapacitorClientSQLiteUpgrade[];
    private _version: number;

    constructor(opts: ICapacitorClientSQLite) {
        const { database, upgrade } = opts;
        this._database = database;
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

    private handle_errors(e: any, bind_values: IModelsQueryBindValue[], query: string): ICapacitorClientSQLiteMessage {
        const { error } = err_msg(e, "execute");
        if (String(e).includes("UNIQUE constraint failed: location_gcs.geohash")) return "*-location-gcs-geohash-unique";
        else if (String(e).includes("UNIQUE constraint failed: nostr_relay.url")) return "*-nostr-relay-url-unique";
        return this.append_logs("*-exe", bind_values, query, error);
    }

    private filter_bind_value_fields(fields: IModelsQueryBindValueTuple[]): IModelsQueryBindValueTuple[] {
        return fields.filter(([_, v]) => !!v);
    }

    private async execute(query: string, bind_values: IModelsQueryBindValue[]): Promise<capSQLiteChanges | ICapacitorClientSQLiteMessage> {
        try {
            if (!this._conn) return "*-connection";
            const result = await this._conn.run(query, bind_values.length ? bind_values : undefined);
            if (sqlite_svc.platform === "web" && this._database) await sqlite_svc.save_to_store(this._database);
            if (result) return result;
            return this.append_logs("*-exe-result", bind_values, query, result);
        } catch (e) {
            return this.handle_errors(e, bind_values, query);
        };
    }

    private async select(query: string, bind_values: IModelsQueryBindValue[]): Promise<DBSQLiteValues | ICapacitorClientSQLiteMessage> {
        try {
            if (!this._conn) return "*-connection";
            const result = await this._conn.query(query, bind_values.length ? bind_values : undefined);
            if (result) return result;
            return this.append_logs("*-sel-result", bind_values, query, result);
        } catch (e) {
            const { error } = err_msg(e, "select");
            return this.append_logs("*-sel", bind_values, query, error);
        };
    }

    private async open(opts: IISQLiteServiceOpenDatabase): Promise<undefined | ICapacitorClientSQLiteMessage> {
        try {
            if (this._platform === "web") await sqlite_svc.init_web_store();
            await sqlite_svc.add_upgrade({
                database: opts.database,
                upgrade: opts.upgrade
            });
            const conn = await sqlite_svc.open_db(opts.database, opts.version, false);
            sqlite_version_svc.set_version(opts.database, opts.version);
            if (!conn) return "*-connection";
            if (opts.platform === "web") await sqlite_svc.save_to_store(opts.database);
            this._conn = conn;
            return this.append_logs("*-open", [], "database opened", [new Date().toISOString()]);
        } catch (e) {
            const { error } = err_msg(e, "open");
            return this.append_logs("*-open", [], "catch", error);
        };
    }

    public async connect(): Promise<true | ICapacitorClientSQLiteMessage> {
        try {
            const {
                _platform: platform,
                _database: database,
                _upgrade: upgrade,
                _version: version
            } = this;
            await this.open({ platform, database, upgrade, version }).then(async () => {
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
        const query = `INSERT INTO location_gcs (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, index) => `$${1 + index}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id, };
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
        const bind_values: IModelsQueryBindValue[] = [];
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
        const [bv_k, bv_v] = this.location_gcs_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM location_gcs WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["location_gcs_delete", e]);
        };
    }

    private location_gcs_update_validate(fields: Partial<LocationGcsFormFields>): Partial<LocationGcsFields> | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_location_gcs_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = LocationGcsUpdateSchema;
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async location_gcs_update(opts: ILocationGcsUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.location_gcs_update_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
        if (!fields.length) return "*-fields";
        const [bv_k, bv_v] = this.location_gcs_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE location_gcs SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
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
        const query = `INSERT INTO trade_product (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, index) => `$${1 + index}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id, };
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
        const bind_values: IModelsQueryBindValue[] = [];
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
        const [bv_k, bv_v] = this.trade_product_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM trade_product WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["trade_product_delete", e]);
        };
    }

    private trade_product_update_validate(fields: Partial<TradeProductFormFields>): Partial<TradeProductFields> | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_trade_product_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = TradeProductUpdateSchema;
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async trade_product_update(opts: ITradeProductUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.trade_product_update_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
        if (!fields.length) return "*-fields";
        const [bv_k, bv_v] = this.trade_product_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE trade_product SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
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
        const query = `INSERT INTO nostr_profile (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, index) => `$${1 + index}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id, };
            else if (typeof result === "string") return result;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["nostr_profile_add", e]);
        };
    }

    private nostr_profile_query_bind_values = (opts: INostrProfileQueryBindValues): INostrProfileQueryBindValuesTuple => {
        if ("id" in opts) return ["id", opts.id];
        else return ["public_key", opts.public_key];
    }

    private nostr_profile_get_query_list = (opts: INostrProfileGetList): IModelsQueryParam => {
        const sort = nostr_profile_sort[opts.sort || "newest"];
        let query = "";
        const bind_values: IModelsQueryBindValue[] = [];
        if (opts.list[0] === "all") {
            query = `SELECT * FROM nostr_profile ORDER BY ${sort};`;
        } else if (opts.list[0] === "on_relay") {
            query = `SELECT pr.* FROM nostr_profile pr JOIN nostr_profile_relay np_rl ON pr.id = np_rl.tb_pr_rl_0 WHERE np_rl.tb_pr_rl_1 = $1;`;
            bind_values.push(opts.list[1].id);
        } else if (opts.list[0] === "off_relay") {
            query = `SELECT pr.* FROM nostr_profile pr WHERE NOT EXISTS (SELECT 1 FROM nostr_profile_relay pr_rl WHERE pr_rl.tb_pr_rl_0 = pr.id AND pr_rl.tb_pr_rl_1 = $1);`;
            bind_values.push(opts.list[1].id);
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
        const [bv_k, bv_v] = this.nostr_profile_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM nostr_profile WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["nostr_profile_delete", e]);
        };
    }

    private nostr_profile_update_validate(fields: Partial<NostrProfileFormFields>): Partial<NostrProfileFields> | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_nostr_profile_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = NostrProfileUpdateSchema.and(NostrProfileMetadataSchema);
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async nostr_profile_update(opts: INostrProfileUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.nostr_profile_update_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
        if (!fields.length) return "*-fields";
        const [bv_k, bv_v] = this.nostr_profile_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE nostr_profile SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["nostr_profile_update", e]);
        };
    }

    private nostr_relay_add_validate(fields: NostrRelayFormFields): NostrRelayFields | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_nostr_relay_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = NostrRelaySchema;
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async nostr_relay_add(opts: NostrRelayFormFields): Promise<{ id: string; } | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.nostr_relay_add_validate(opts);
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
        const query = `INSERT INTO nostr_relay (${bind_values_tup.map(([k]) => k).join(", ")}) VALUES (${bind_values_tup.map((_, index) => `$${1 + index}`).join(", ")});`;
        try {
            const result = await this.execute(query, bind_values);
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id, };
            else if (typeof result === "string") return result;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["nostr_relay_add", e]);
        };
    }

    private nostr_relay_query_bind_values = (opts: INostrRelayQueryBindValues): INostrRelayQueryBindValuesTuple => {
        if ("id" in opts) return ["id", opts.id];
        else return ["url", opts.url];
    }

    private nostr_relay_get_query_list = (opts: INostrRelayGetList): IModelsQueryParam => {
        const sort = nostr_relay_sort[opts.sort || "newest"];
        let query = "";
        const bind_values: IModelsQueryBindValue[] = [];
        if (opts.list[0] === "all") {
            query = `SELECT * FROM nostr_relay ORDER BY ${sort};`;
        } else if (opts.list[0] === "on_profile") {
            query = `SELECT rl.* FROM nostr_relay rl JOIN nostr_profile_relay pr_rl ON rl.id = pr_rl.tb_pr_rl_1 JOIN nostr_profile pr ON pr.id = pr_rl.tb_pr_rl_0 WHERE pr.public_key = $1 ORDER BY ${sort};`;
            bind_values.push(opts.list[1].public_key);
        } else if (opts.list[0] === "off_profile") {
            query = `SELECT rl.* FROM nostr_relay rl LEFT JOIN nostr_profile_relay pr_rl ON rl.id = pr_rl.tb_pr_rl_1 LEFT JOIN nostr_profile pr ON pr.id = pr_rl.tb_pr_rl_0 WHERE pr.public_key <> $1 ORDER BY ${sort};`;
            bind_values.push(opts.list[1].public_key);
        }
        if (!query) throw new Error("Error: Missing query (nostr_relay_get_query_list)")
        return {
            query,
            bind_values
        };
    }

    private nostr_relay_get_parse_opts = (opts: INostrRelayGet): IModelsQueryParam => {
        if ("list" in opts) return this.nostr_relay_get_query_list(opts);
        else {
            const [bv_k, bv_v] = this.nostr_relay_query_bind_values(opts);
            return {
                query: `SELECT * FROM nostr_relay WHERE ${bv_k} = $1;`,
                bind_values: [bv_v]
            };
        };
    }

    public async nostr_relay_get(opts: INostrRelayGet): Promise<NostrRelay[] | ICapacitorClientSQLiteMessage> {
        const { query, bind_values } = this.nostr_relay_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return response;
            else {
                const result = parse_nostr_relay_list(response);
                if (result) return result;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", opts, query, ["nostr_relay_get", e]);
        };
    }

    public async nostr_relay_delete(opts: INostrRelayQueryBindValues): Promise<true | ICapacitorClientSQLiteMessage> {
        const [bv_k, bv_v] = this.nostr_relay_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM nostr_relay WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["nostr_relay_delete", e]);
        };
    }

    private nostr_relay_update_validate(fields: Partial<NostrRelayFormFields>): Partial<NostrRelayFields> | string[] {
        const fields_r = Object.entries(fields).filter(([_, v]) => !!v).reduce((acc: Record<string, IModelsQueryValue>, i) => {
            const [key, val] = parse_nostr_relay_form_fields(i);
            acc[key] = val;
            return acc;
        }, {});
        const schema = NostrRelayUpdateSchema;
        const parsed_schema = schema.safeParse(fields_r);
        if (!parsed_schema.success) return parsed_schema.error.issues.map(i => i.message);
        else return {
            ...parsed_schema.data
        };
    }

    public async nostr_relay_update(opts: INostrRelayUpdate): Promise<true | string[] | ICapacitorClientSQLiteMessage> {
        const opts_v = this.nostr_relay_update_validate(opts.fields);
        if (Array.isArray(opts_v)) return opts_v;
        const fields = this.filter_bind_value_fields(Object.entries(opts_v));
        if (!fields.length) return "*-fields";
        const [bv_k, bv_v] = this.nostr_relay_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE nostr_relay SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return response;
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return "*-result";
        } catch (e) {
            return this.append_logs("*", [], query, ["nostr_relay_update", e]);
        };
    }

    public async set_nostr_profile_relay(opts: { nostr_profile: INostrProfileQueryBindValues; nostr_relay: INostrRelayQueryBindValues; }): Promise<true | ICapacitorClientSQLiteMessage> {
        const bv_np = this.nostr_profile_query_bind_values(opts.nostr_profile)
        const bv_nr = this.nostr_relay_query_bind_values(opts.nostr_relay)
        const bind_values = [bv_np[1], bv_nr[1]];
        const query = `INSERT INTO nostr_profile_relay (tb_pr_rl_0, tb_pr_rl_1) VALUES ((SELECT id FROM nostr_profile WHERE ${bv_np[0]} = $1), (SELECT id FROM nostr_relay WHERE ${bv_nr[0]} = $2));`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") {
                return response;
            } else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) {
                return true;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["set_nostr_profile_relay", e]);
        };
    };

    public async unset_nostr_profile_relay(opts: { nostr_profile: INostrProfileQueryBindValues; nostr_relay: INostrRelayQueryBindValues; }): Promise<true | ICapacitorClientSQLiteMessage> {
        const bv_np = this.nostr_profile_query_bind_values(opts.nostr_profile)
        const bv_nr = this.nostr_relay_query_bind_values(opts.nostr_relay)
        const bind_values = [bv_np[1], bv_nr[1]];
        const query = `DELETE FROM nostr_profile_relay WHERE tb_pr_rl_0 = (SELECT id FROM nostr_profile WHERE ${bv_np[0]} = $1) AND tb_pr_rl_1 = (SELECT id FROM nostr_relay WHERE ${bv_nr[0]} = $2);`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") {
                return response;
            } else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) {
                return true;
            }
            return "*-result";
        } catch (e) {
            return this.append_logs("*", bind_values, query, ["unset_nostr_profile_relay", e]);
        };
    };
};