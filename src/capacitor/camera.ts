
import { Camera, CameraResultType } from '@capacitor/camera';
import { ErrorResponse, IClientCamera, OsPhoto, OsPhotoGallery, OsPhotoGallerySelectOptions, OsPhotoSelectOptions, OsPhotosPermissions } from '../types';
import { err_msg } from '../utils';


export class CapacitorClientCamera implements IClientCamera {
    private parse_camera_result_type(value: string): CameraResultType {
        switch (value) {
            case 'uri':
                return CameraResultType.Uri;
            case 'base64':
                return CameraResultType.Base64;
            case 'dataUrl':
                return CameraResultType.DataUrl;
            default:
                return CameraResultType.Uri;
        }
    }


    public async enabled(): Promise<OsPhotosPermissions | ErrorResponse> {
        try {
            const { camera, photos } = await Camera.checkPermissions();
            return {
                camera,
                photos
            };
        } catch (e) {
            return err_msg(e);
        };
    }

    public async request_enabled(): Promise<OsPhotosPermissions | ErrorResponse> {
        try {
            const { camera, photos } = await Camera.requestPermissions({
                permissions: ['camera', 'photos']
            });
            return {
                camera,
                photos
            };
        } catch (e) {
            return err_msg(e);
        };
    }

    public async get_photo(opts: OsPhotoSelectOptions): Promise<OsPhoto | ErrorResponse> {
        try {
            const {
                quality,
                allow_editing: allowEditing,
                result_type,
                save_to_gallery: saveToGallery,
                width,
                height,
                correct_orientation: correctOrientation,
                prompt_label_header: promptLabelHeader,
                prompt_label_cancel: promptLabelCancel,
                prompt_label_photo: promptLabelPhoto,
                prompt_label_picture: promptLabelPicture
            } = opts;


            const res = await Camera.getPhoto({
                quality,
                allowEditing,
                resultType: this.parse_camera_result_type(result_type),
                saveToGallery,
                width,
                height,
                correctOrientation,
                promptLabelHeader,
                promptLabelCancel,
                promptLabelPhoto,
                promptLabelPicture
            });

            const {
                base64String: base64_string,
                dataUrl: data_url,
                path,
                webPath: web_path,
                exif,
                format,
                saved
            } = res;

            return {
                base64_string,
                data_url,
                path,
                web_path,
                exif,
                format,
                saved
            };
        } catch (e) {
            return err_msg(e);
        };
    }

    public async get_photos(opts: OsPhotoGallerySelectOptions): Promise<OsPhotoGallery[] | ErrorResponse> {
        try {
            const {
                quality,
                width,
                height,
                correct_orientation: correctOrientation,
                limit,
            } = opts;

            const { photos } = await Camera.pickImages({
                quality,
                width,
                height,
                correctOrientation,
                limit,
            });

            return photos.map(i => ({
                path: i.path,
                web_path: i.webPath,
                exif: i.exif,
                format: i.format
            }));
        } catch (e) {
            return err_msg(e);
        };
    }
}
