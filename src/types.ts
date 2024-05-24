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
   totalCount: number;
   errors: boolean;
   updateNeeded: boolean;
   errorDetails?: GenerateImageResult[];
   message: string;
}

export type GenerateMapImageParams = {
   type: 'png' | 'thumbnail' | 'both';
   directoryPath?: string;
   screenshotFileName?: string;
   thumbnailFileName?: string;
};

export interface ProcessDirectoryResult {
   results: GenerateImageResult[];
   processedCount: number;
   totalCount: number;
   updateNeeded: boolean;
}
