import { Geolocation, type Position } from '@capacitor/geolocation';
import type { IClientGeolocation, IClientGeolocationPosition } from '../types';
import { fmt_location_coords } from '../utils';

export class CapacitorClientGeolocation implements IClientGeolocation {
    private parse_geolocation_position(position: Position): IClientGeolocationPosition {
        const pos: IClientGeolocationPosition = {
            lat: fmt_location_coords(position.coords.latitude),
            lng: fmt_location_coords(position.coords.longitude),
            accuracy: position.coords.accuracy || undefined,
            altitude: position.coords.altitude || undefined,
            altitude_accuracy: position.coords.altitudeAccuracy || undefined
        };
        return pos;
    }

    private async get_current_position(): Promise<IClientGeolocationPosition | undefined> {
        try {
            const position = await Geolocation.getCurrentPosition();
            return this.parse_geolocation_position(position);
        } catch (e) { };
    }

    public async current(): Promise<IClientGeolocationPosition | undefined> {
        try {
            const position = await this.get_current_position();
            if (position) return position;
        } catch (e) { };
    }
}

