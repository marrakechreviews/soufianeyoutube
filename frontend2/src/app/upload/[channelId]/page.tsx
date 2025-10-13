'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useParams } from 'next/navigation';
import VideoMetadataForm from '../../../components/VideoMetadataForm';

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

interface Template {
  _id: string;
  name: string;
  description: string;
  tags: string;
}

interface Playlist {
  id: string;
  snippet: {
    title: string;
  };
}

const UploadPage = () => {
  const params = useParams();
  const channelId = params.channelId as string;
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    setToken(authToken);

    const fetchData = async () => {
      if (!authToken) return;
      try {
        const [templatesRes, playlistsRes] = await Promise.all([
          axios.get('/api/templates', { headers: { 'x-auth-token': authToken } }),
          axios.get('/api/youtube/playlists', { headers: { 'x-auth-token': authToken } }),
        ]);
        setTemplates(templatesRes.data);
        setPlaylists(playlistsRes.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchData();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadableFile[] = acceptedFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);

    newFiles.forEach((uploadableFile) => {
      const formData = new FormData();
      formData.append('video', uploadableFile.file);

      setFiles((prev) => prev.map((f) =>
        f.file === uploadableFile.file ? { ...f, status: 'uploading' } : f
      ));

      axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setFiles((prev) => prev.map((f) =>
            f.file === uploadableFile.file
              ? { ...f, progress: percentCompleted }
              : f
          ));
        },
      })
      .then((response) => {
        setFiles((prev) => prev.map((f) =>
          f.file === uploadableFile.file
            ? {
                ...f,
                status: 'completed',
                serverFilePath: response.data.filePath,
              }
            : f
        ));
      })
      .catch((err) => {
        setFiles((prev) => prev.map((f) =>
          f.file === uploadableFile.file
            ? { ...f, status: 'error', errorMessage: err.message }
            : f
        ));
      });
    });
  }, [token]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] },
  });

  const handleSaveMetadata = async (file: File, metadata: any) => {
    const fileToUpdate = files.find((f) => f.file === file);
    if (!fileToUpdate || !fileToUpdate.serverFilePath) return;

    try {
      const res = await axios.post('/api/videos', {
        ...metadata,
        filePath: fileToUpdate.serverFilePath,
        channelId: channelId,
      }, {
        headers: { 'x-auth-token': token },
      });
      setFiles((prev) => prev.map((f) =>
        f.file === file
          ? { ...f, status: 'saved', videoId: res.data._id }
          : f
      ));
    } catch (err) {
      console.error('Error saving metadata:', err);
    }
  };

  const handleUploadToYouTube = async (videoId: string) => {
    // ...
  };

  const handleCreatePlaylist = async (title: string): Promise<Playlist | null> => {
    // ...
    return null;
  };

  const handleFileSelection = (fileName: string) => {
    setSelectedFiles((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileName)) {
        newSelection.delete(fileName);
      } else {
        newSelection.add(fileName);
      }
      return newSelection;
    });
  };

  const fileList = files.map((wrapper) => (
    <li key={wrapper.file.name} className="mb-4 p-4 bg-gray-50 rounded-lg flex gap-4 items-start">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        checked={selectedFiles.has(wrapper.file.name)}
        onChange={() => handleFileSelection(wrapper.file.name)}
      />
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-800">
            {wrapper.file.name} - {(wrapper.file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          {/* ... status span */}
        </div>
        {/* ... progress bar */}
        {(wrapper.status === 'completed' || wrapper.status === 'saved') && wrapper.videoId && (
          <VideoMetadataForm
            initialTitle={wrapper.file.name}
            videoId={wrapper.videoId}
            token={token}
            playlists={playlists}
            onSave={(metadata) => handleSaveMetadata(wrapper.file, metadata)}
            onCreatePlaylist={handleCreatePlaylist}
          />
        )}
        {/* ... other statuses */}
      </div>
    </li>
  ));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Upload to Channel: {channelId}
          </h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer"
          >
            <input {...getInputProps()} />
            <p>Drag 'n' drop some files here, or click to select files</p>
          </div>
          <div className="mt-6 flex items-center justify-end gap-4">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Select a Template</option>
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedTemplateId || selectedFiles.size === 0}
              className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 disabled:bg-gray-400"
            >
              Apply Template to Selected
            </button>
            <button
              disabled={selectedFiles.size === 0}
              className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-white bg-red-600 disabled:bg-gray-400"
            >
              Publish Selected to YouTube
            </button>
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
