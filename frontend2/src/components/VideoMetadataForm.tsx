'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// ... (interfaces)

interface VideoMetadataFormProps {
  videoId: string;
  token: string | null;
  playlists: any[]; // Simplified for now
  metadata: Metadata;
  onMetadataChange: (newMetadata: Metadata) => void;
  onSave: () => void;
  onCreatePlaylist: (title: string) => Promise<any | null>;
}

const VideoMetadataForm: React.FC<VideoMetadataFormProps> = ({
  videoId,
  token,
  playlists,
  metadata,
  onMetadataChange,
  onSave,
  onCreatePlaylist,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setThumbnailPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append('thumbnail', file);

        axios.post(`/api/videos/${videoId}/thumbnail`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token,
          },
        });
      }
    },
    [videoId, token]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', 'jpg'] },
    multiple: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    onMetadataChange({
      ...metadata,
      [e.target.name]: e.target.value,
    });
    setIsSaved(false);
  };

  const handleCreatePlaylist = async () => {
    if (metadata.newPlaylistTitle) {
      const newPlaylist = await onCreatePlaylist(metadata.newPlaylistTitle);
      if (newPlaylist) {
        onMetadataChange({
          ...metadata,
          playlistId: newPlaylist.id,
          newPlaylistTitle: '',
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
    setIsSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* ... (All form fields will now use the `metadata` prop for their value) */}

      {/* Example for Title field */}
      <div>
        <label htmlFor={`title-${videoId}`} className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          id={`title-${videoId}`}
          value={metadata.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      {/* (Description, Thumbnail, Privacy, Schedule, Playlists would follow the same pattern) */}

      <div className="flex items-center justify-end">
        {isSaved && <span className="text-sm text-green-600 mr-3">Saved!</span>}
        <button type="submit" className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600">
          Save Metadata
        </button>
      </div>
    </form>
  );
};

export default VideoMetadataForm;
