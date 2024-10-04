import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { Relay, generateSecretKey, getPublicKey, nip19, } from 'nostr-tools';
import type { IClientNostrLib, IClientNostrLibRelayConnectResponse } from '../types';

export class ClientNostrLib implements IClientNostrLib {
    private generate_key_bytes(): Uint8Array {
        const secret_key = generateSecretKey();
        return secret_key;
    };

    private get_key_hex(bytes: Uint8Array): string {
        const hex = bytesToHex(bytes);
        return hex;
    };

    private get_key_bytes(hex: string): Uint8Array {
        const bytes = hexToBytes(hex);
        return bytes;
    };

    public async relay_connect(url: string): Promise<IClientNostrLibRelayConnectResponse | undefined> {
        try {

            if (!url) return undefined;
            const conn = await Relay.connect(url);
            if (conn && typeof conn.connected === `boolean` && typeof conn.url === `string` && conn.url) return { url: conn.url, connected: conn.connected };
            return undefined;
        } catch (e) {
            return undefined;
        };
    }

    /**
     * 
     * @returns nostr secret key hex
     */
    public generate_key(): string {
        const bytes = this.generate_key_bytes();
        const hex = this.get_key_hex(bytes);
        return hex;
    };

    /**
     * 
     * @returns nostr public key hex
     */
    public public_key(secret_key_hex: string | undefined): string {
        if (!secret_key_hex) return ``;
        const bytes = this.get_key_bytes(secret_key_hex);
        const hex = getPublicKey(bytes)
        return hex;
    }

    /**
     * 
     * @returns nostr public key npub
     */
    public npub(public_key_hex: string | undefined, fallback_to_hex?: boolean): string {
        if (!public_key_hex) return ``;
        const npub = nip19.npubEncode(public_key_hex);
        return npub ? npub : fallback_to_hex ? public_key_hex : ``;
    }

    /**
     * 
     * @returns public key hex from npub
     */
    public npub_decode(npub: string): string {
        const hex = nip19.decode(npub);
        if (hex && hex.type === `npub` && hex.data) return hex.data
        return ``;
    }

    /**
     * 
     * @returns nostr secret key nsec
     */
    public nsec(secret_key_hex: string | undefined): string {
        if (!secret_key_hex) return ``;
        const bytes = this.get_key_bytes(secret_key_hex);
        const nsec = nip19.nsecEncode(bytes);
        return nsec;
    }

    /**
     * 
     * @returns nostr secret key hex from nsec
     */
    public nsec_decode(nsec: string): string | undefined {
        if (!nsec) return undefined;
        const decode = nip19.decode(nsec);
        if (decode && decode.type === `nsec` && decode.data && typeof decode.data === `string`) return decode.data
        return undefined;
    }

    /**
     * 
     * @returns nostr public key nprofile
     */
    public nprofile(public_key_hex: string, relays: string[]): string {
        if (!public_key_hex || !relays.length) return ``;
        const nprofile = nip19.nprofileEncode({ pubkey: public_key_hex, relays })
        return nprofile;
    }

    /**
     * 
     * @returns nostr public key nprofile
     */
    public nprofile_decode(nprofile: string): [string, string[]] | undefined {
        if (!nprofile) return undefined;
        const decode = nip19.decode(nprofile);
        if (decode && decode.type === `nprofile` && decode.data && decode.data.pubkey && decode.data.relays) return [decode.data.pubkey, decode.data.relays]
        return undefined;
    }
};
