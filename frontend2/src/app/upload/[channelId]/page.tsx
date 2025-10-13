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

interface Metadata {
  title: string;
  description: string;
  privacy: 'private' | 'unlisted' | 'public';
  publishAt?: string;
  playlistId?: string;
  newPlaylistTitle?: string;
}

type MetadataMap = { [key: string]: Metadata };

const UploadPage = () => {
  const params = useParams();
  const channelId = params.channelId as string;
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [metadataMap, setMetadataMap] = useState<MetadataMap>({});

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

    setMetadataMap((prevMap) => {
      const newMap = { ...prevMap };
      newFiles.forEach(f => {
        newMap[f.file.name] = { title: f.file.name, description: '', privacy: 'private' };
      });
      return newMap;
    });

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

  const handleMetadataChange = (fileName: string, newMetadata: Metadata) => {
    setMetadataMap((prevMap) => ({
      ...prevMap,
      [fileName]: newMetadata,
    }));
  };

  const handleSaveMetadata = async (fileName: string) => {
    const fileToUpdate = files.find((f) => f.file.name === fileName);
    const metadata = metadataMap[fileName];
    if (!fileToUpdate || !fileToUpdate.serverFilePath || !metadata) return;

    try {
      const res = await axios.post('/api/videos', {
        ...metadata,
        filePath: fileToUpdate.serverFilePath,
        channelId: channelId,
      }, {
        headers: { 'x-auth-token': token },
      });
      setFiles((prev) => prev.map((f) =>
        f.file.name === fileName
          ? { ...f, status: 'saved', videoId: res.data._id }
          : f
      ));
    } catch (err) {
      console.error('Error saving metadata:', err);
    }
  };

  const handleCreatePlaylist = async (title: string): Promise<Playlist | null> => {
    try {
      const res = await axios.post(
        '/api/youtube/playlists',
        { title },
        { headers: { 'x-auth-token': token } }
      );
      const newPlaylist = res.data;
      setPlaylists((prev) => [...prev, newPlaylist]);
      return newPlaylist;
    } catch (err) {
      console.error('Error creating playlist', err);
      return null;
    }
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

  const applyTemplateToSelected = () => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) return;

    setMetadataMap((prevMap) => {
      const newMap = { ...prevMap };
      selectedFiles.forEach((fileName) => {
        if (newMap[fileName]) {
          newMap[fileName] = {
            ...newMap[fileName],
            description: template.description,
            // Tags would be applied here if they were in the metadata state
          };
        }
      });
      return newMap;
    });
  };

  const handleBulkPublish = async () => {
    const videoIdsToPublish = files
      .filter((f) => selectedFiles.has(f.file.name) && f.videoId)
      .map((f) => f.videoId!);

    if (videoIdsToPublish.length === 0) {
      alert('No saved videos selected for publishing.');
      return;
    }

    try {
      setFiles((prev) =>
        prev.map((f) =>
          videoIdsToPublish.includes(f.videoId!)
            ? { ...f, status: 'uploading to youtube' }
            : f
        )
      );

      await axios.post(
        '/api/videos/bulk-publish',
        { videoIds: videoIdsToPublish },
        { headers: { 'x-auth-token': token } }
      );

      setFiles((prev) =>
        prev.map((f) =>
          videoIdsToPublish.includes(f.videoId!)
            ? { ...f, status: 'published' }
            : f
        )
      );
    } catch (err) {
      console.error('Error during bulk publish:', err);
    }
  };

  const fileList = files.map((wrapper) => {
    const metadata = metadataMap[wrapper.file.name];
    if (!metadata) return null;

    return (
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
          {(wrapper.status === 'completed' || wrapper.status === 'saved') && wrapper.videoId && (
            <VideoMetadataForm
              videoId={wrapper.videoId}
              token={token}
              playlists={playlists}
              metadata={metadata}
              onMetadataChange={(newMetadata) => handleMetadataChange(wrapper.file.name, newMetadata)}
              onSave={() => handleSaveMetadata(wrapper.file.name)}
              onCreatePlaylist={handleCreatePlaylist}
            />
          )}
          {wrapper.status === 'published' && (
             <p className="text-sm text-green-500 mt-1">Successfully published to YouTube!</p>
          )}
          {wrapper.status === 'error' && (
            <p className="text-sm text-red-500 mt-1">{wrapper.errorMessage}</p>
          )}
        </div>
      </li>
    );
  });

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
              onClick={applyTemplateToSelected}
              disabled={!selectedTemplateId || selectedFiles.size === 0}
              className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 disabled:bg-gray-400"
            >
              Apply Template to Selected
            </button>
            <button
              onClick={handleBulkPublish}
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
