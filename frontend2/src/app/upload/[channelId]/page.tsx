'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useParams } from 'next/navigation';
import VideoMetadataForm from '../../../components/VideoMetadataForm';

// Define a more detailed structure for tracking file state
interface UploadableFile {
  file: File;
  status:
    | 'pending'
    | 'uploading'
    | 'completed'
    | 'error'
    | 'saved'
    | 'uploading to youtube'
    | 'published';
  progress: number;
  serverFilePath?: string;
  errorMessage?: string;
  videoId?: string;
}

const UploadPage = () => {
  const params = useParams();
  const channelId = params.channelId as string;
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadableFile[] = acceptedFiles.map((file) => ({
        file,
        status: 'pending',
        progress: 0,
      }));

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);

      // Start the upload for each new file
      newFiles.forEach((uploadableFile) => {
        const formData = new FormData();
        formData.append('video', uploadableFile.file);

        // Update file status to 'uploading'
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadableFile.file ? { ...f, status: 'uploading' } : f
          )
        );

        axios
          .post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-auth-token': localStorage.getItem('token'), // Add token for auth
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
              );
              setFiles((prev) =>
                prev.map((f) =>
                  f.file === uploadableFile.file
                    ? { ...f, progress: percentCompleted }
                    : f
                )
              );
            },
          })
          .then((response) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === uploadableFile.file
                  ? {
                      ...f,
                      status: 'completed',
                      serverFilePath: response.data.filePath,
                    }
                  : f
              )
            );
          })
          .catch((err) => {
            console.error('Upload error:', err);
            setFiles((prev) =>
              prev.map((f) =>
                f.file === uploadableFile.file
                  ? { ...f, status: 'error', errorMessage: err.message }
                  : f
              )
            );
          });
      });
    },
    [token]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    },
  });

  const handleSaveMetadata = async (
    file: File,
    metadata: {
      title: string;
      description: string;
      privacy: 'private' | 'unlisted' | 'public';
    }
  ) => {
    const fileToUpdate = files.find((f) => f.file === file);
    if (!fileToUpdate || !fileToUpdate.serverFilePath) return;

    try {
      const res = await axios.post(
        '/api/videos',
        {
          ...metadata,
          filePath: fileToUpdate.serverFilePath,
          channelId: channelId,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'saved', videoId: res.data._id }
            : f
        )
      );
    } catch (err) {
      console.error('Error saving metadata:', err);
    }
  };

  const handleUploadToYouTube = async (videoId: string) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.videoId === videoId
            ? { ...f, status: 'uploading to youtube' }
            : f
        )
      );
      await axios.post(
        `/api/videos/${videoId}/upload`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );
      setFiles((prev) =>
        prev.map((f) =>
          f.videoId === videoId ? { ...f, status: 'published' } : f
        )
      );
    } catch (err) {
      console.error('Error uploading to YouTube:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.videoId === videoId
            ? { ...f, status: 'error', errorMessage: 'YouTube upload failed' }
            : f
        )
      );
    }
  };

  const fileList = files.map((wrapper) => (
    <li key={wrapper.file.name} className="mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-800">
          {wrapper.file.name} - {(wrapper.file.size / 1024 / 1024).toFixed(2)} MB
        </span>
        <span
          className={`text-sm font-semibold ${
            wrapper.status === 'completed' ||
            wrapper.status === 'saved' ||
            wrapper.status === 'published'
              ? 'text-green-600'
              : wrapper.status === 'error'
              ? 'text-red-600'
              : 'text-indigo-600'
          }`}
        >
          {wrapper.status.charAt(0).toUpperCase() + wrapper.status.slice(1)}
        </span>
      </div>
      {(wrapper.status === 'uploading' ||
        wrapper.status === 'uploading to youtube') && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${wrapper.progress}%` }}
          ></div>
        </div>
      )}
      {(wrapper.status === 'completed' || wrapper.status === 'saved') && (
        <VideoMetadataForm
          initialTitle={wrapper.file.name}
          onSave={(metadata) => handleSaveMetadata(wrapper.file, metadata)}
        />
      )}
      {wrapper.status === 'saved' && wrapper.videoId && (
        <div className="mt-4 text-right">
          <button
            onClick={() => handleUploadToYouTube(wrapper.videoId!)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Upload to YouTube
          </button>
        </div>
      )}
      {wrapper.status === 'published' && (
         <p className="text-sm text-green-500 mt-1">Successfully published to YouTube!</p>
      )}
      {wrapper.status === 'error' && (
        <p className="text-sm text-red-500 mt-1">{wrapper.errorMessage}</p>
      )}
    </li>
  ));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Upload Videos for Channel ID: {channelId}
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
            <h4 className="text-lg font-semibold">Uploads</h4>
            {files.length > 0 ? (
              <ul>{fileList}</ul>
            ) : (
              <p className="text-sm text-gray-500">No files selected yet.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
