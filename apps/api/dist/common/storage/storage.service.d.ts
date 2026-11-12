import "multer";
export declare class StorageService {
    private readonly uploadDir;
    constructor();
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
    deleteFile(relativePath: string): Promise<boolean>;
}
