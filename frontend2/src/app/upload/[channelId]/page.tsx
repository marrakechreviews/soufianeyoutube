'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface UploadProgress {
  [key: string]: number;
}

const UploadPage = ({ params }: { params: { channelId: string } }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);

    acceptedFiles.forEach((file) => {
      const formData = new FormData();
      formData.append('video', file);

      axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress((prevProgress) => ({
            ...prevProgress,
            [file.name]: percentCompleted,
          }));
        },
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    },
  });

  const uploadedFiles = files.map((file) => (
    <li key={file.name} className="mb-2">
      <span>
        {file.name} - {file.size} bytes
      </span>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${uploadProgress[file.name] || 0}%` }}
        ></div>
      </div>
    </li>
  ));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Upload Videos for Channel ID: {params.channelId}
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-indigo-600">Drop the files here ...</p>
            ) : (
              <p className="text-gray-500">
                Drag 'n' drop some video files here, or click to select files
              </p>
            )}
          </div>
          <aside className="mt-6">
            <h4 className="text-lg font-semibold">Files to Upload</h4>
            <ul>{uploadedFiles}</ul>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
