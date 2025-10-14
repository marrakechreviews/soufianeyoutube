'use client';

import React, { useCallback, useState, useEffect } from 'react';
// ... (imports)

const UploadPage = () => {
  // ... (state and effects)

  const handleBulkPublish = async () => {
    const unsavedFiles = files.filter(
      (f) => selectedFiles.has(f.file.name) && f.status === 'completed'
    );

    if (unsavedFiles.length > 0) {
      // Create an array of promises for each save operation
      const savePromises = unsavedFiles.map((f) => handleSaveMetadata(f.file.name));

      // Wait for all of them to complete
      await Promise.all(savePromises);
    }

    // Now that saves are done, we need to get the *updated* state.
    // We will use a functional update with a callback to ensure we have the latest `files` state.
    setFiles((currentFiles) => {
      const videoIdsToPublish = currentFiles
        .filter((f) => selectedFiles.has(f.file.name) && f.videoId)
        .map((f) => f.videoId!);

      if (videoIdsToPublish.length === 0) {
        alert('No saved videos were found to publish.');
        return currentFiles; // Return original state
      }

      // IIFE to run async logic inside the synchronous setState callback
      (async () => {
        try {
          setFiles((prev) =>
            prev.map((f) =>
              videoIdsToPublish.includes(f.videoId!)
                ? { ...f, status: 'uploading to youtube' }
                -                : f
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
      })();

      return currentFiles; // Return original state, async operations will update it later
    });
  };

  // ... (rest of the component)
};

export default UploadPage;
