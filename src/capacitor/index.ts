
import { Capacitor } from "@capacitor/core";
import type { IClient, IClientKeystore, IClientPlatform } from "../types";
import { parse_platform } from "../utils";
import { CapacitorClientKeystore } from "./keystore";

export class ClientCapacitor implements IClient {
    private _platform: IClientPlatform = parse_platform(Capacitor.getPlatform());
    private _keystore: IClientKeystore = new CapacitorClientKeystore();

    public get platform() {
        return this._platform;
    }

    public get keystore() {
        return this._keystore;
    }
};