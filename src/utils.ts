import type { IClientPlatform } from "./types";

export function parse_platform(str: string): IClientPlatform {
    switch (str) {
        case `ios`:
        case `androiď`:
        case `web`:
            return str;
        default:
            return `web`;
    }
}