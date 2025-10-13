'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

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

interface VideoMetadataFormProps {
  initialTitle: string;
  videoId: string;
  token: string | null;
  playlists: Playlist[];
  onSave: (metadata: Metadata) => void;
  onCreatePlaylist: (title: string) => Promise<Playlist | null>;
}

const VideoMetadataForm: React.FC<VideoMetadataFormProps> = ({
  initialTitle,
  videoId,
  token,
  playlists,
  onSave,
  onCreatePlaylist,
}) => {
  const [metadata, setMetadata] = useState<Metadata>({
    title: initialTitle,
    description: '',
    privacy: 'private',
    publishAt: '',
    playlistId: '',
    newPlaylistTitle: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setThumbnailFile(file);
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
    setMetadata({
      ...metadata,
      [e.target.name]: e.target.value,
    });
    setIsSaved(false);
  };

  const handleCreatePlaylist = async () => {
    if (metadata.newPlaylistTitle) {
      const newPlaylist = await onCreatePlaylist(metadata.newPlaylistTitle);
      if (newPlaylist) {
        setMetadata((prev) => ({
          ...prev,
          playlistId: newPlaylist.id,
          newPlaylistTitle: '',
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(metadata);
    setIsSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label
              htmlFor={`title-${videoId}`}
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              id={`title-${videoId}`}
              value={metadata.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor={`description-${videoId}`}
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="description"
              id={`description-${videoId}`}
              value={metadata.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Thumbnail
          </label>
          <div
            {...getRootProps()}
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer"
          >
            <div className="space-y-1 text-center">
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="mx-auto h-24 w-auto"
                />
              ) : (
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <div className="flex text-sm text-gray-600">
                <p className="pl-1">
                  {thumbnailFile
                    ? thumbnailFile.name
                    : 'Upload a file or drag and drop'}
                </p>
              </div>
              <input {...getInputProps()} className="sr-only" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`privacy-${videoId}`}
            className="block text-sm font-medium text-gray-700"
          >
            Privacy
          </label>
          <select
            name="privacy"
            id={`privacy-${videoId}`}
            value={metadata.privacy}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div>
          <label
            htmlFor={`publishAt-${videoId}`}
            className="block text-sm font-medium text-gray-700"
          >
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            name="publishAt"
            id={`publishAt-${videoId}`}
            value={metadata.publishAt}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`playlistId-${videoId}`}
          className="block text-sm font-medium text-gray-700"
        >
          Add to Playlist (optional)
        </label>
        <select
          name="playlistId"
          id={`playlistId-${videoId}`}
          value={metadata.playlistId}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">None</option>
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.snippet.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-grow">
          <label
            htmlFor={`newPlaylistTitle-${videoId}`}
            className="block text-sm font-medium text-gray-700"
          >
            Or Create New Playlist
          </label>
          <input
            type="text"
            name="newPlaylistTitle"
            id={`newPlaylistTitle-${videoId}`}
            value={metadata.newPlaylistTitle}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCreatePlaylist}
          disabled={!metadata.newPlaylistTitle}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
        >
          Create
        </button>
      </div>

      <div className="flex items-center justify-end">
        {isSaved && (
          <span className="text-sm text-green-600 mr-3">Saved!</span>
        )}
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Save Metadata
        </button>
      </div>
    </form>
  );
};

export default VideoMetadataForm;
