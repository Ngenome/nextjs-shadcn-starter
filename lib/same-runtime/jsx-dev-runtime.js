/**
 * Custom JSX Dev Runtime - Same.new Style Implementation
 * This wraps React's jsxDEV to add source tracking attributes
 * Exactly like Same.new does it - simple and effective!
 */

import { jsxDEV as originalJsxDEV } from 'react/jsx-dev-runtime';
export * from 'react/jsx-dev-runtime';
export { Fragment } from 'react/jsx-dev-runtime';

// Wrap React's jsxDEV to add source tracking
export const jsxDEV = (type, originalProps, key, isStatic, source, self) => {
  let props = originalProps;
  
  try {
    // Only add source tracking if:
    // 1. We have props object
    // 2. We have source information
    // 3. It's not a Fragment
    if (originalProps && typeof originalProps === 'object' && source && String(type) !== 'Symbol(react.fragment)') {
      // Add the data-react-source attribute exactly like Same.new
      props = {
        ...originalProps,
        'data-react-source': `${source.fileName}:${source.lineNumber}:${source.columnNumber}`
      };
    }
  } catch {
    // Silently fail if anything goes wrong, just like Same.new
  }
  
  // Call the original React jsxDEV with potentially modified props
  return originalJsxDEV(type, props, key, isStatic, source, self);
};