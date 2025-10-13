'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ... (interfaces)

interface VideoMetadataFormProps {
  // ...
  onApplyTemplate: (template: Template) => void;
}

const VideoMetadataForm: React.FC<VideoMetadataFormProps> = ({
  // ...
  onApplyTemplate,
}) => {
  // ...

  useEffect(() => {
    // This could be used to apply a template from the parent
  }, [onApplyTemplate]);

  // ... (rest of the component)
};

export default VideoMetadataForm;
