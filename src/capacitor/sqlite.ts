import { SQLiteDBConnection, type capSQLiteChanges, type DBSQLiteValues } from "@radroots/capacitor-sqlite";
import { type IModelsQueryBindValue, type IModelsQueryBindValueTuple, type IModelsQueryParam, type IModelsQueryValue, type ModelsUniqueConstraintMessages, type ILocationGcsAddResolve,type ILocationGcsDeleteResolve,type ILocationGcsGetResolve,type ILocationGcsUpdateResolve, parse_location_gcs_form_fields, location_gcs_sort, type ILocationGcsGetList, type ILocationGcsGet, type ILocationGcsUpdate, type ILocationGcsQueryBindValues, type ILocationGcsQueryBindValuesKey, type ILocationGcsQueryBindValuesTuple, parse_location_gcs, parse_location_gcs_list, type LocationGcs, type LocationGcsFields, type LocationGcsFormFields, LocationGcsSchema, LocationGcsUpdateSchema, type ITradeProductAddResolve,type ITradeProductDeleteResolve,type ITradeProductGetResolve,type ITradeProductUpdateResolve, parse_trade_product_form_fields, trade_product_sort, type ITradeProductGetList, type ITradeProductGet, type ITradeProductUpdate, type ITradeProductQueryBindValues, type ITradeProductQueryBindValuesKey, type ITradeProductQueryBindValuesTuple, parse_trade_product, parse_trade_product_list, type TradeProduct, type TradeProductFields, type TradeProductFormFields, TradeProductSchema, TradeProductUpdateSchema, type INostrProfileAddResolve,type INostrProfileDeleteResolve,type INostrProfileGetResolve,type INostrProfileUpdateResolve, parse_nostr_profile_form_fields, nostr_profile_sort, type INostrProfileGetList, type INostrProfileGet, type INostrProfileUpdate, type INostrProfileQueryBindValues, type INostrProfileQueryBindValuesKey, type INostrProfileQueryBindValuesTuple, parse_nostr_profile, parse_nostr_profile_list, type NostrProfile, type NostrProfileFields, type NostrProfileFormFields, NostrProfileSchema, NostrProfileUpdateSchema, NostrProfileMetadataSchema, type INostrRelayAddResolve,type INostrRelayDeleteResolve,type INostrRelayGetResolve,type INostrRelayUpdateResolve, parse_nostr_relay_form_fields, nostr_relay_sort, type INostrRelayGetList, type INostrRelayGet, type INostrRelayUpdate, type INostrRelayQueryBindValues, type INostrRelayQueryBindValuesKey, type INostrRelayQueryBindValuesTuple, parse_nostr_relay, parse_nostr_relay_list, type NostrRelay, type NostrRelayFields, type NostrRelayFormFields, NostrRelaySchema, NostrRelayUpdateSchema } from "@radroots/models";
import { err_msg, time_created_on, uuidv4, type ErrorMessage } from "@radroots/utils";
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

    private append_logs(error_msg: ICapacitorClientSQLiteMessage, bind_values: any, query: string, e: any): ICapacitorClientSQLiteMessage {
        sqlite_svc.logs.push({
            key: error_msg,
            bind_values,
            query,
            e,
        });
        return error_msg;
    }

    private handle_errors(error_msg: ICapacitorClientSQLiteMessage, bind_values: IModelsQueryBindValue[], query: string, e: any): ErrorMessage<ICapacitorClientSQLiteMessage> {
        const err = this.append_logs(error_msg, bind_values, query, e);
        if (String(e).includes("UNIQUE constraint failed: location_gcs.geohash")) return err_msg("*-location-gcs-geohash-unique");
        else if (String(e).includes("UNIQUE constraint failed: nostr_relay.url")) return err_msg("*-nostr-relay-url-unique");
        return err_msg(err);
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
            return this.append_logs("*-exe", bind_values, query, e);
        };
    }

    private async select(query: string, bind_values: IModelsQueryBindValue[]): Promise<DBSQLiteValues | ICapacitorClientSQLiteMessage> {
        try {
            if (!this._conn) return "*-connection";
            const result = await this._conn.query(query, bind_values.length ? bind_values : undefined);
            if (result) return result;
            return this.append_logs("*-sel-result", bind_values, query, result);
        } catch (e) {
            return this.append_logs("*-sel", bind_values, query, e);
        };
    }

    private async open(opts: IISQLiteServiceOpenDatabase): Promise<undefined | ErrorMessage<ICapacitorClientSQLiteMessage>> {
        try {
            if (this._platform === "web") await sqlite_svc.init_web_store();
            await sqlite_svc.add_upgrade({
                database: opts.database,
                upgrade: opts.upgrade
            });
            const conn = await sqlite_svc.open_db(opts.database, opts.version, false);
            sqlite_version_svc.set_version(opts.database, opts.version);
            if (!conn) return err_msg("*-connection");
            if (opts.platform === "web") await sqlite_svc.save_to_store(opts.database);
            this._conn = conn;
        } catch (e) {
            return this.handle_errors("*-open", [], "open()", e);
        };
    }

    public async connect(): Promise<true | ErrorMessage<ICapacitorClientSQLiteMessage>> {
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
            return this.handle_errors("*-connect", [], "connect()", e);
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

    public async location_gcs_add(opts: LocationGcsFormFields): Promise<ILocationGcsAddResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.location_gcs_add_validate(opts);
        if (Array.isArray(err_s)) return { err_s };
        const fields = Object.entries(err_s);
        if (!fields.length) return err_msg("*-fields");
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
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id };      
            else if (typeof result === "string") return err_msg(result);
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["location_gcs_add", opts, e]);
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

    public async location_gcs_get(opts: ILocationGcsGet): Promise<ILocationGcsGetResolve<ICapacitorClientSQLiteMessage>> {
        const { query, bind_values } = this.location_gcs_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            const results = parse_location_gcs_list(response);
            if (Array.isArray(results)) return { results };
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["location_gcs_get", opts, e]);
        };
    }

    public async location_gcs_delete(opts: ILocationGcsQueryBindValues): Promise<ILocationGcsDeleteResolve<ICapacitorClientSQLiteMessage>> {
        const [bv_k, bv_v] = this.location_gcs_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM location_gcs WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["location_gcs_delete", opts, e]);
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

    public async location_gcs_update(opts: ILocationGcsUpdate): Promise<ILocationGcsUpdateResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.location_gcs_update_validate(opts.fields);
        if (Array.isArray(err_s)) return { err_s };
        const fields = this.filter_bind_value_fields(Object.entries(err_s));
        if (!fields.length) return err_msg("*-fields");
        const [bv_k, bv_v] = this.location_gcs_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE location_gcs SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["location_gcs_update", opts, e]);
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

    public async trade_product_add(opts: TradeProductFormFields): Promise<ITradeProductAddResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.trade_product_add_validate(opts);
        if (Array.isArray(err_s)) return { err_s };
        const fields = Object.entries(err_s);
        if (!fields.length) return err_msg("*-fields");
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
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id };      
            else if (typeof result === "string") return err_msg(result);
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["trade_product_add", opts, e]);
        };
    }


    private trade_product_query_bind_values = (opts: ITradeProductQueryBindValues): ITradeProductQueryBindValuesTuple => {
        return ["id", opts.id];
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

    public async trade_product_get(opts: ITradeProductGet): Promise<ITradeProductGetResolve<ICapacitorClientSQLiteMessage>> {
        const { query, bind_values } = this.trade_product_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            const results = parse_trade_product_list(response);
            if (Array.isArray(results)) return { results };
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["trade_product_get", opts, e]);
        };
    }

    public async trade_product_delete(opts: ITradeProductQueryBindValues): Promise<ITradeProductDeleteResolve<ICapacitorClientSQLiteMessage>> {
        const [bv_k, bv_v] = this.trade_product_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM trade_product WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["trade_product_delete", opts, e]);
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

    public async trade_product_update(opts: ITradeProductUpdate): Promise<ITradeProductUpdateResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.trade_product_update_validate(opts.fields);
        if (Array.isArray(err_s)) return { err_s };
        const fields = this.filter_bind_value_fields(Object.entries(err_s));
        if (!fields.length) return err_msg("*-fields");
        const [bv_k, bv_v] = this.trade_product_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE trade_product SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["trade_product_update", opts, e]);
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

    public async nostr_profile_add(opts: NostrProfileFormFields): Promise<INostrProfileAddResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.nostr_profile_add_validate(opts);
        if (Array.isArray(err_s)) return { err_s };
        const fields = Object.entries(err_s);
        if (!fields.length) return err_msg("*-fields");
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
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id };      
            else if (typeof result === "string") return err_msg(result);
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_profile_add", opts, e]);
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

    public async nostr_profile_get(opts: INostrProfileGet): Promise<INostrProfileGetResolve<ICapacitorClientSQLiteMessage>> {
        const { query, bind_values } = this.nostr_profile_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            const results = parse_nostr_profile_list(response);
            if (Array.isArray(results)) return { results };
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_profile_get", opts, e]);
        };
    }

    public async nostr_profile_delete(opts: INostrProfileQueryBindValues): Promise<INostrProfileDeleteResolve<ICapacitorClientSQLiteMessage>> {
        const [bv_k, bv_v] = this.nostr_profile_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM nostr_profile WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_profile_delete", opts, e]);
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

    public async nostr_profile_update(opts: INostrProfileUpdate): Promise<INostrProfileUpdateResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.nostr_profile_update_validate(opts.fields);
        if (Array.isArray(err_s)) return { err_s };
        const fields = this.filter_bind_value_fields(Object.entries(err_s));
        if (!fields.length) return err_msg("*-fields");
        const [bv_k, bv_v] = this.nostr_profile_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE nostr_profile SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_profile_update", opts, e]);
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

    public async nostr_relay_add(opts: NostrRelayFormFields): Promise<INostrRelayAddResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.nostr_relay_add_validate(opts);
        if (Array.isArray(err_s)) return { err_s };
        const fields = Object.entries(err_s);
        if (!fields.length) return err_msg("*-fields");
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
            if (typeof result !== "string" && typeof result.changes?.changes === "number" && result.changes.changes > 0) return { id };      
            else if (typeof result === "string") return err_msg(result);
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_relay_add", opts, e]);
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

    public async nostr_relay_get(opts: INostrRelayGet): Promise<INostrRelayGetResolve<ICapacitorClientSQLiteMessage>> {
        const { query, bind_values } = this.nostr_relay_get_parse_opts(opts);
        try {
            const response = await this.select(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            const results = parse_nostr_relay_list(response);
            if (Array.isArray(results)) return { results };
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_relay_get", opts, e]);
        };
    }

    public async nostr_relay_delete(opts: INostrRelayQueryBindValues): Promise<INostrRelayDeleteResolve<ICapacitorClientSQLiteMessage>> {
        const [bv_k, bv_v] = this.nostr_relay_query_bind_values(opts);
        const bind_values = [bv_v];
        const query = `DELETE FROM nostr_relay WHERE ${bv_k} = $1;`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_relay_delete", opts, e]);
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

    public async nostr_relay_update(opts: INostrRelayUpdate): Promise<INostrRelayUpdateResolve<ICapacitorClientSQLiteMessage>> {
        const err_s = this.nostr_relay_update_validate(opts.fields);
        if (Array.isArray(err_s)) return { err_s };
        const fields = this.filter_bind_value_fields(Object.entries(err_s));
        if (!fields.length) return err_msg("*-fields");
        const [bv_k, bv_v] = this.nostr_relay_query_bind_values(opts.on);
        const bind_values = [...fields.map(([_, v]) => v), bv_v];
        const query = `UPDATE nostr_relay SET ${fields.map(([k], index) => `${k} = $${1 + index}`).join(", ")} WHERE ${bv_k} = $${bind_values.length};`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["nostr_relay_update", opts, e]);
        };
    }

    public async set_nostr_profile_relay(opts: { nostr_profile: INostrProfileQueryBindValues; nostr_relay: INostrRelayQueryBindValues; }): Promise<true | ErrorMessage<ICapacitorClientSQLiteMessage>> {
        const bv_np = this.nostr_profile_query_bind_values(opts.nostr_profile)
        const bv_nr = this.nostr_relay_query_bind_values(opts.nostr_relay)
        const bind_values = [bv_np[1], bv_nr[1]];
        const query = `INSERT INTO nostr_profile_relay (tb_pr_rl_0, tb_pr_rl_1) VALUES ((SELECT id FROM nostr_profile WHERE ${bv_np[0]} = $1), (SELECT id FROM nostr_relay WHERE ${bv_nr[0]} = $2));`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["set_nostr_profile_relay", opts, e]);
        };
    };    

    public async unset_nostr_profile_relay(opts: { nostr_profile: INostrProfileQueryBindValues; nostr_relay: INostrRelayQueryBindValues; }): Promise<true | ErrorMessage<ICapacitorClientSQLiteMessage>> {
        const bv_np = this.nostr_profile_query_bind_values(opts.nostr_profile)
        const bv_nr = this.nostr_relay_query_bind_values(opts.nostr_relay)
        const bind_values = [bv_np[1], bv_nr[1]];
        const query = `DELETE FROM nostr_profile_relay WHERE tb_pr_rl_0 = (SELECT id FROM nostr_profile WHERE ${bv_np[0]} = $1) AND tb_pr_rl_1 = (SELECT id FROM nostr_relay WHERE ${bv_nr[0]} = $2);`;
        try {
            const response = await this.execute(query, bind_values);
            if (typeof response === "string") return err_msg(response);
            else if (typeof response.changes?.changes === "number" && response.changes.changes > 0) return true;
            return err_msg("*-result");
        } catch (e) {
            return this.handle_errors("*", bind_values, query, ["unset_nostr_profile_relay", opts, e]);
        };
    };
};