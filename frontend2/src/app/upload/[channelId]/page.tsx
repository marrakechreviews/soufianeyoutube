'use client';

import React, { useCallback, useState, useEffect } from 'react';
// ... (imports)

const UploadPage = () => {
  // ... (state and effects)

  const handleBulkPublish = async () => {
    const unsavedFiles = files.filter(
      (f) => selectedFiles.has(f.file.name) && f.status === 'completed'
    );

    // Use a callback with setFiles to get the most up-to-date state
    const savePromises = unsavedFiles.map((f) => handleSaveMetadata(f.file.name));

    // Wait for all save operations to complete
    await Promise.all(savePromises);

    // We need to read the LATEST state of the files after saving.
    // The state update from `handleSaveMetadata` is asynchronous.
    // A robust way is to use a `useEffect` or pass a callback,
    // but for now, we'll introduce a small delay to allow the state to settle.
    // This is still a simplification but is more reliable than the previous attempt.
    setTimeout(async () => {
      const videoIdsToPublish = files
        .filter((f) => selectedFiles.has(f.file.name) && f.videoId)
        .map((f) => f.videoId!);

      if (videoIdsToPublish.length === 0) {
        alert('No saved videos were found to publish.');
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
    }, 500); // 500ms delay to allow state to update
  };

  // ... (rest of the component)
};

export default UploadPage;
