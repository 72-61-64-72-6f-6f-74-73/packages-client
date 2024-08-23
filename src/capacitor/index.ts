
import { Capacitor } from "@capacitor/core";
import type { IClient, IClientBrowser, IClientDatePicker, IClientDevice, IClientDialog, IClientGeolocation, IClientHaptics, IClientHttp, IClientKeystore, IClientNetwork, IClientPlatform, IClientPreferences, IClientShare, IClientWifi } from "../types";
import { parse_platform } from "../utils";
import { CapacitorClientBrowser } from "./browser";
import { CapacitorClientDatePicker } from "./date-picker";
import { CapacitorClientDevice } from "./device";
import { CapacitorClientDialog } from "./dialog";
import { CapacitorClientGeolocation } from "./geolocation";
import { CapacitorClientHaptics } from "./haptics";
import { CapacitorClientHttp } from "./http";
import { CapacitorClientKeystore } from "./keystore";
import { CapacitorClientNetwork } from "./network";
import { CapacitorClientPreferences } from "./preferences";
import { CapacitorClientShare } from "./share";
import { CapacitorClientWifi } from "./wifi";

export class ClientCapacitor implements IClient {
    private _platform: IClientPlatform = parse_platform(Capacitor.getPlatform());
    private _keystore: IClientKeystore = new CapacitorClientKeystore();
    private _device: IClientDevice = new CapacitorClientDevice();
    private _haptics: IClientHaptics = new CapacitorClientHaptics();
    private _network: IClientNetwork = new CapacitorClientNetwork();
    private _preferences: IClientPreferences = new CapacitorClientPreferences();
    private _share: IClientShare = new CapacitorClientShare();
    private _wifi: IClientWifi = new CapacitorClientWifi();
    private _dialog: IClientDialog = new CapacitorClientDialog();
    private _browser: IClientBrowser = new CapacitorClientBrowser();
    private _dates: IClientDatePicker = new CapacitorClientDatePicker();
    private _geo: IClientGeolocation = new CapacitorClientGeolocation();
    private _http: IClientHttp = new CapacitorClientHttp();

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

    public get preferences() {
        return this._preferences;
    }

    public get share() {
        return this._share;
    }

    public get wifi() {
        return this._wifi;
    }

    public get dialog() {
        return this._dialog;
    }

    public get browser() {
        return this._browser;
    }

    public get dates() {
        return this._dates;
    }

    public get geo() {
        return this._geo;
    }

    public get http() {
        return this._http;
    }
};