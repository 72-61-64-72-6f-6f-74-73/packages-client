import { Wifi } from '@radroots/capacitor-wifi';
import type { IClientWifi, IClientWifiConnectResult, IClientWifiCurrentResult, IClientWifiScanResult } from '../types';

export class CapacitorClientWifi implements IClientWifi {
    public scan = async (): Promise<IClientWifiScanResult | undefined> => {
        try {
            const res = Wifi.scanWifi();
            return res;
        } catch (e) { };
    };

    public current = async (): Promise<IClientWifiCurrentResult | undefined> => {
        try {
            const res = Wifi.getCurrentWifi();
            return res;
        } catch (e) { };
    };

    public connect = async (ssid: string, password: string): Promise<IClientWifiConnectResult | undefined> => {
        try {
            const res = Wifi.connectToWifiBySsidAndPassword({ ssid, password });
            return res;
        } catch (e) { };
    };

    public connect_prefix = async (ssidPrefix: string, password: string): Promise<IClientWifiConnectResult | undefined> => {
        try {
            const res = Wifi.connectToWifiBySsidPrefixAndPassword({ ssidPrefix, password });
            return res;
        } catch (e) { };
    };

    public disconnect = async (): Promise<void> => {
        try {
            await Wifi.disconnectAndForget();
        } catch (e) { };
    };

}
