import { SecureStorage } from "@radroots/capacitor-secure-storage";
import { IClientKeystore } from "../types";

export class CapacitorClientKeystore implements IClientKeystore {
    public async init() {
        await SecureStorage.setKeyPrefix("radroots-");
        await SecureStorage.setSynchronize(false);
    }

    public async set(key: string, val: string): Promise<boolean> {
        try {
            await SecureStorage.set(key, val, true, false);
            return true;
        } catch (e) {
            return false;
        }
    }

    public async get(key: string): Promise<string | undefined> {
        try {
            const res = await SecureStorage.get(key, true, false);
            if (typeof res === `string`) return res;
        } catch (e) { }
    }

    public async keys(): Promise<string[] | undefined> {
        try {
            const res = await SecureStorage.keys();
            if (res && res.length) return res;
        } catch (e) { }
    }


    public async remove(key: string): Promise<boolean> {
        try {
            const res = await SecureStorage.remove(key, false);
            return res;
        } catch (e) {
            return false;
        }
    }
}
