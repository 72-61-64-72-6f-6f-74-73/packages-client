import type { IClientNostr } from "../types";
import { ClientNostrEvents } from "./events";
import { ClientNostrLib } from "./lib";

export class ClientNostr implements IClientNostr {
    private _ev: ClientNostrEvents = new ClientNostrEvents();
    private _lib: ClientNostrLib = new ClientNostrLib();

    public get ev() {
        return this._ev;
    }

    public get lib() {
        return this._lib;
    }
}