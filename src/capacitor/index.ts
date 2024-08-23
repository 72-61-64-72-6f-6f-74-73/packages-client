
import { Capacitor } from "@capacitor/core";
import type { IClient, IClientDevice, IClientHaptics, IClientKeystore, IClientNetwork, IClientPlatform } from "../types";
import { parse_platform } from "../utils";
import { CapacitorClientDevice } from "./device";
import { CapacitorClientHaptics } from "./haptics";
import { CapacitorClientKeystore } from "./keystore";
import { CapacitorClientNetwork } from "./network";

export class ClientCapacitor implements IClient {
    private _platform: IClientPlatform = parse_platform(Capacitor.getPlatform());
    private _keystore: IClientKeystore = new CapacitorClientKeystore();
    private _device: IClientDevice = new CapacitorClientDevice();
    private _haptics: IClientHaptics = new CapacitorClientHaptics();
    private _network: IClientNetwork = new CapacitorClientNetwork();

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

    public get network() {
        return this._network;
    }
};