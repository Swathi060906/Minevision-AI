export interface Evidence {
  id: string;
  inspectionId: string;
  findingId?: string;
  fileName: string;
  fileType: string;
  fileSize: number; // In bytes
  fileSizeBytes?: number;
  description: string;
  capturedAt: string;
  uploadedBy: string;
  storageReference: string;
  createdAt: string;
}

export interface CreateEvidenceInput {
  inspectionId: string;
  mineId?: string;
  findingId?: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  fileSizeBytes?: number;
  description: string;
  capturedAt?: string;
  uploadedBy: string;
  storageReference?: string;
}
