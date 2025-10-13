'use client';

import React, { useState } from 'react';

interface Metadata {
  title: string;
  description: string;
  privacy: 'private' | 'unlisted' | 'public';
}

interface VideoMetadataFormProps {
  initialTitle: string;
  onSave: (metadata: Metadata) => void;
}

const VideoMetadataForm: React.FC<VideoMetadataFormProps> = ({
  initialTitle,
  onSave,
}) => {
  const [metadata, setMetadata] = useState<Metadata>({
    title: initialTitle,
    description: '',
    privacy: 'private',
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setMetadata({
      ...metadata,
      [e.target.name]: e.target.value,
    });
    setIsSaved(false); // Reset saved status on change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(metadata);
    setIsSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={metadata.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          name="description"
          id="description"
          value={metadata.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="privacy"
          className="block text-sm font-medium text-gray-700"
        >
          Privacy
        </label>
        <select
          name="privacy"
          id="privacy"
          value={metadata.privacy}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </select>
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
