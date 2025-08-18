'use client';

import { useVisualEditor } from '@/hooks/useVisualEditor';
import { useEffect } from 'react';

export function VisualEditorProvider({ children }: { children: React.ReactNode }) {
  const editorState = useVisualEditor();

  useEffect(() => {
    if (editorState.enabled && editorState.isInIframe) {
      // Send initial page structure to parent
      const components = Array.from(document.querySelectorAll('*')).slice(0, 100).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        parent: el.parentElement?.tagName,
      }));

      window.parent.postMessage({
        type: 'page-structure',
        payload: components,
      }, '*');
    }
  }, [editorState.enabled, editorState.isInIframe]);

  // Show a small indicator when in editor mode
  if (editorState.enabled && !editorState.isInIframe) {
    return (
      <>
        {children}
        <div className="fixed top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs z-50">
          Visual Editor Mode
        </div>
      </>
    );
  }

  return <>{children}</>;
}