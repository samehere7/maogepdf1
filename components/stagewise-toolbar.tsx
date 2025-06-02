'use client';

import React from 'react';

export default function StagewiseToolbarWrapper() {
  const stagewiseConfig = {
    plugins: []
  };
  
  // Using dynamic import to ensure it only loads on client side
  // and to avoid issues with SSR
  try {
    const { StagewiseToolbar } = require('@stagewise/toolbar-next');
    return <StagewiseToolbar config={stagewiseConfig} />;
  } catch (error) {
    // Silently fail if the module is not available
    console.warn('Stagewise toolbar not available:', error);
    return null;
  }
} 