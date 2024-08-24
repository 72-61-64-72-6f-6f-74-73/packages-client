import type { IClientPlatform } from "./types";

export function parse_platform(str: string): IClientPlatform {
    switch (str) {
        case `ios`:
        case `androiď`:
        case `web`:
            return str;
        default:
            return `web`;
    };
};

export function fmt_location_coords(number: number): number {
    return Math.round(number * 1e7) / 1e7;
};

