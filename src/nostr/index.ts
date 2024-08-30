import type { IClientNostr } from "../types";
import { ClientNostrEvents } from "./events";

export class ClientNostr implements IClientNostr {
    private _ev: ClientNostrEvents = new ClientNostrEvents();

    public get ev() {
        return this._ev;
    }
}