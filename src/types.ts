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
