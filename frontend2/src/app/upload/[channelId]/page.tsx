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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    setToken(authToken);

    const fetchPlaylists = async () => {
      if (!authToken) return;
      try {
        const res = await axios.get('/api/youtube/playlists', {
          headers: { 'x-auth-token': authToken },
        });
        setPlaylists(res.data);
      } catch (err) {
        console.error('Error fetching playlists:', err);
      }
    };
    fetchPlaylists();
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

  const handleSaveMetadata = async (file: File, metadata: any) => {
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
    // ...
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

  const fileList = files.map((wrapper) => (
    <li key={wrapper.file.name} className="mb-4 p-4 bg-gray-50 rounded-lg">
      {/* ... file info */}
      {(wrapper.status === 'completed' || wrapper.status === 'saved') &&
        wrapper.videoId && (
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
    </li>
  ));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        {/* ... header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* ... dropzone */}
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
