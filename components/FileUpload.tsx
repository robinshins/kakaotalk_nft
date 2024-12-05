'use client';

import { useCallback } from 'react';

interface FileUploadProps {
  onUpload: (content: string) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onUpload(content);
    };
    reader.readAsText(file);
  }, [onUpload]);

  return (
    <div
      className="border-2 border-dashed rounded-lg p-8 text-center transition-all border-gray-700"
      onDragOver={handleDrag}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files.length) {
          handleFiles(files);
        }
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-white">Drag and drop file here</p>
        <p className="text-sm text-gray-400">Limit 200MB per file • TXT, CSV</p>
        <input
          type="file"
          className="hidden"
          accept=".txt,.csv"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="mt-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg cursor-pointer transition-colors"
        >
          Browse files
        </label>
      </div>
    </div>
  );
} 