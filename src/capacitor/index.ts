
import { Capacitor } from "@capacitor/core";
import type { IClient, IClientDevice, IClientHaptics, IClientKeystore, IClientPlatform } from "../types";
import { parse_platform } from "../utils";
import { CapacitorClientDevice } from "./device";
import { CapacitorClientHaptics } from "./haptics";
import { CapacitorClientKeystore } from "./keystore";

export class ClientCapacitor implements IClient {
    private _platform: IClientPlatform = parse_platform(Capacitor.getPlatform());
    private _keystore: IClientKeystore = new CapacitorClientKeystore();
    private _device: IClientDevice = new CapacitorClientDevice();
    private _haptics: IClientHaptics = new CapacitorClientHaptics();

    public get platform() {
        return this._platform;
    }

    public get keystore() {
        return this._keystore;
    }

    public get device() {
        return this._device;
    }

    public get haptics() {
        return this._haptics;
    }
};