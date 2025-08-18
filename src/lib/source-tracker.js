// Custom JSX transform to add source tracking
// This wraps React's createElement to inject source metadata

import React from 'react';

const originalCreateElement = React.createElement;

// Only in development mode
if (process.env.NODE_ENV === 'development') {
  React.createElement = function(type, props, ...children) {
    // Skip fragments and non-DOM elements
    if (!props || typeof type !== 'string') {
      return originalCreateElement(type, props, ...children);
    }

    // Get stack trace to find source location
    const stack = new Error().stack;
    const sourceMatch = stack?.match(/at.*\((.*?):(\d+):(\d+)\)/);
    
    if (sourceMatch) {
      const [, file, line, col] = sourceMatch;
      // Clean up the file path
      const cleanFile = file
        .replace(window.location.origin, '')
        .replace('/_next/static/chunks/', '')
        .replace('.js', '.tsx')
        .replace('/app/', '/src/app/');
      
      props = {
        ...props,
        'data-source': `${cleanFile}:${line}:${col}`
      };
    }

    return originalCreateElement(type, props, ...children);
  };
}

export default React;