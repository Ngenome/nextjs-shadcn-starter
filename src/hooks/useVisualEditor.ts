'use client';

import { useEffect, useState } from 'react';

export interface EditorState {
  enabled: boolean;
  selectedElement: HTMLElement | null;
  isInIframe: boolean;
}

export function useVisualEditor() {
  const [editorState, setEditorState] = useState<EditorState>({
    enabled: false,
    selectedElement: null,
    isInIframe: false,
  });

  useEffect(() => {
    // Check if we're in editor mode
    const urlParams = new URLSearchParams(window.location.search);
    const editorMode = urlParams.get('editor') === 'true';
    const inIframe = window !== window.parent;

    setEditorState(prev => ({
      ...prev,
      enabled: editorMode || inIframe,
      isInIframe: inIframe,
    }));

    if (!editorMode && !inIframe) return;

    // Add visual editor capabilities
    const handleClick = (e: MouseEvent) => {
      if (!editorState.enabled) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      // Send selection info to parent if in iframe
      if (inIframe) {
        window.parent.postMessage({
          type: 'element-selected',
          payload: {
            tagName: target.tagName,
            className: target.className,
            id: target.id,
            text: target.textContent?.substring(0, 100),
          }
        }, '*');
      }
      
      // Add visual selection indicator
      document.querySelectorAll('.editor-selected').forEach(el => {
        el.classList.remove('editor-selected');
      });
      target.classList.add('editor-selected');
      
      setEditorState(prev => ({
        ...prev,
        selectedElement: target,
      }));
    };

    // Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      if (!inIframe) return;
      
      const { type, payload } = event.data;
      
      switch (type) {
        case 'update-styles':
          if (editorState.selectedElement) {
            Object.assign(editorState.selectedElement.style, payload.styles);
          }
          break;
          
        case 'update-content':
          if (editorState.selectedElement) {
            editorState.selectedElement.textContent = payload.content;
          }
          break;
      }
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('message', handleMessage);

    // Add editor styles
    const style = document.createElement('style');
    style.id = 'visual-editor-styles';
    style.textContent = `
      .editor-selected {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      
      [data-editor-mode="true"] * {
        cursor: pointer !important;
      }
      
      [data-editor-mode="true"] a,
      [data-editor-mode="true"] button {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // Mark body as in editor mode
    if (editorMode || inIframe) {
      document.body.setAttribute('data-editor-mode', 'true');
    }

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('message', handleMessage);
      document.getElementById('visual-editor-styles')?.remove();
      document.body.removeAttribute('data-editor-mode');
    };
  }, [editorState.enabled, editorState.selectedElement]);

  return editorState;
}