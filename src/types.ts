export interface Color {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

export interface GenerateImageResult {
  status: boolean;
  filePath: string;
  fileAccessed: boolean;
  parseDataSuccess: boolean;
  wallArrayGenerated: boolean;
  imageBufferCreated: boolean;
  fileSaved: boolean;
  imageCreated: boolean;
  errorDetails?: {
    accessError?: string;
    parseError?: string;
    bufferError?: string;
    saveError?: string;
  };
  imageBuffer?: Buffer;
}

export interface GenerateMapImageResult {
  processedCount: number;
  errors: boolean;
  thumbnailsProcessed: boolean;
  pngsProcessed: boolean;
  updateNeeded: boolean;
  errorDetails?: GenerateImageResult[];
}

export type GenerateMapImageParams = {
  type: "png" | "thumbnail" | "both";
  directoryPath?: string;
  screenshotFileName?: string;
  thumbnailFileName?: string;
};
