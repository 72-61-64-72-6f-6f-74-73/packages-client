import { type NDKEvent } from "@nostr-dev-kit/ndk";
import type { IClientNostrEvents } from "../types";

export class ClientNostrEvents implements IClientNostrEvents {
    public first_tag_value(event: NDKEvent, tag_name: string): string {
        const tag = event.getMatchingTags(tag_name)[0];
        return tag ? tag[1] : "";
    }
}