import React, { createContext, useContext, useState, useCallback } from 'react';

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressContextType {
  uploads: UploadProgress[];
  startUpload: (id: string, fileName: string) => void;
  updateProgress: (id: string, progress: number) => void;
  completeUpload: (id: string) => void;
  errorUpload: (id: string, error: string) => void;
}

const UploadProgressContext = createContext<UploadProgressContextType | undefined>(undefined);

export function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const startUpload = useCallback((id: string, fileName: string) => {
    setUploads(prev => [...prev, {
      id,
      fileName,
      progress: 0,
      status: 'uploading',
    }]);
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? { ...upload, progress: Math.min(100, Math.max(0, progress)) }
        : upload
    ));
  }, []);

  const completeUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? { ...upload, progress: 100, status: 'completed' }
        : upload
    ));

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setUploads(prev => prev.filter(upload => upload.id !== id));
    }, 3000);
  }, []);

  const errorUpload = useCallback((id: string, error: string) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? { ...upload, status: 'error', error }
        : upload
    ));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setUploads(prev => prev.filter(upload => upload.id !== id));
    }, 5000);
  }, []);

  return (
    <UploadProgressContext.Provider
      value={{
        uploads,
        startUpload,
        updateProgress,
        completeUpload,
        errorUpload,
      }}
    >
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const context = useContext(UploadProgressContext);
  if (!context) {
    throw new Error('useUploadProgress must be used within UploadProgressProvider');
  }
  return context;
}
