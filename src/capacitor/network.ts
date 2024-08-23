import { Network } from '@capacitor/network';
import type { IClientNetwork, IClientNetworkConnection } from '../types';

export class CapacitorClientNetwork implements IClientNetwork {
    public async status(): Promise<IClientNetworkConnection | undefined> {
        try {
            const { connected, connectionType: connection_type } = await Network.getStatus();
            return { connected, connection_type };
        } catch (e) { };
    }

    public async close(): Promise<boolean> {
        try {
            await Network.removeAllListeners();
            return true;
        } catch (e) {
            return false;
        };
    }
}
