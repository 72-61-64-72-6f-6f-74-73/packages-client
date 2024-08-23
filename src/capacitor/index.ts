
import { Capacitor } from "@capacitor/core";
import type { IClient, IClientPlatform } from "../types";
import { parse_platform } from "../utils";

export class ClientCapacitor implements IClient {
    private _platform: IClientPlatform = parse_platform(Capacitor.getPlatform());

    public get platform() {
        return this._platform;
    }
};