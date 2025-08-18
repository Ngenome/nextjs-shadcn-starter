/**
 * Visual Editor Client Script
 * Injected into the app iframe to handle visual selection and editing
 * Communicates with parent frame via postMessage
 */

(function() {
  'use strict';
  
  // Check if we're in an iframe
  if (window.parent === window) return;
  
  const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  
  class VisualEditorClient {
    constructor() {
      this.isActive = false;
      this.selectedElement = null;
      this.highlightOverlay = null;
      this.selectionBox = null;
      
      this.init();
    }
    
    init() {
      // Listen for messages from parent
      window.addEventListener('message', this.handleMessage.bind(this));
      
      // Notify parent that client is ready
      this.postToParent({
        type: 'VISUAL_EDITOR_READY',
        timestamp: Date.now()
      });
    }
    
    handleMessage(event) {
      // Verify origin
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;
      
      const message = event.data;
      if (!message || typeof message !== 'object') return;
      
      switch (message.type) {
        case 'ACTIVATE_VISUAL_EDITOR':
          this.activate();
          break;
        case 'DEACTIVATE_VISUAL_EDITOR':
          this.deactivate();
          break;
        case 'UPDATE_ELEMENT_TEXT':
          this.updateElementText(message.payload);
          break;
      }
    }
    
    activate() {
      if (this.isActive) return;
      
      this.isActive = true;
      this.createOverlay();
      
      // Add event listeners
      document.addEventListener('click', this.handleClick, true);
      document.addEventListener('mouseover', this.handleMouseOver);
      document.addEventListener('mouseout', this.handleMouseOut);
      
      // Add styles
      this.addStyles();
      
      this.postToParent({
        type: 'VISUAL_EDITOR_ACTIVATED',
        timestamp: Date.now()
      });
    }
    
    deactivate() {
      if (!this.isActive) return;
      
      this.isActive = false;
      this.removeOverlay();
      
      // Remove event listeners
      document.removeEventListener('click', this.handleClick, true);
      document.removeEventListener('mouseover', this.handleMouseOver);
      document.removeEventListener('mouseout', this.handleMouseOut);
      
      // Remove styles
      this.removeStyles();
      
      this.postToParent({
        type: 'VISUAL_EDITOR_DEACTIVATED',
        timestamp: Date.now()
      });
    }
    
    handleClick = (event) => {
      if (!this.isActive) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const element = event.target;
      this.selectElement(element);
    }
    
    handleMouseOver = (event) => {
      if (!this.isActive) return;
      
      const element = event.target;
      if (element === this.highlightOverlay || element === this.selectionBox) return;
      
      this.highlightElement(element);
    }
    
    handleMouseOut = (event) => {
      if (!this.isActive) return;
      
      this.unhighlightElement();
    }
    
    selectElement(element) {
      this.selectedElement = element;
      
      // Get source location from data attributes
      const sourceData = this.getSourceData(element);
      
      // Show selection box
      this.showSelectionBox(element);
      
      // Make text editable if it's a text element
      if (this.isTextElement(element)) {
        element.contentEditable = 'true';
        element.focus();
        
        // Listen for changes
        element.addEventListener('input', this.handleTextEdit);
        element.addEventListener('blur', this.handleTextEditComplete);
      }
      
      // Send selection to parent
      this.postToParent({
        type: 'ELEMENT_SELECTED',
        payload: {
          tagName: element.tagName.toLowerCase(),
          className: element.className,
          id: element.id,
          text: element.textContent,
          source: sourceData,
          rect: element.getBoundingClientRect()
        },
        timestamp: Date.now()
      });
    }
    
    getSourceData(element) {
      // Try different source attributes
      const sourceAttrs = ['data-react-source', 'data-source', 'data-replit-metadata'];
      
      for (const attr of sourceAttrs) {
        const value = element.getAttribute(attr);
        if (value) {
          const [file, line, column] = value.split(':');
          return {
            file,
            line: parseInt(line) || 0,
            column: parseInt(column) || 0,
            raw: value
          };
        }
      }
      
      // Walk up the tree to find source
      if (element.parentElement) {
        return this.getSourceData(element.parentElement);
      }
      
      return null;
    }
    
    isTextElement(element) {
      const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'A', 'BUTTON', 'LI', 'TD', 'TH'];
      return textTags.includes(element.tagName) && 
             element.children.length === 0 &&
             element.textContent.trim().length > 0;
    }
    
    handleTextEdit = (event) => {
      const element = event.target;
      const newText = element.textContent;
      
      // Send live updates to parent
      this.postToParent({
        type: 'ELEMENT_TEXT_EDITING',
        payload: {
          text: newText,
          source: this.getSourceData(element)
        },
        timestamp: Date.now()
      });
    }
    
    handleTextEditComplete = (event) => {
      const element = event.target;
      element.contentEditable = 'false';
      element.removeEventListener('input', this.handleTextEdit);
      element.removeEventListener('blur', this.handleTextEditComplete);
      
      const newText = element.textContent;
      const sourceData = this.getSourceData(element);
      
      // Send final text to parent
      this.postToParent({
        type: 'ELEMENT_TEXT_EDITED',
        payload: {
          text: newText,
          source: sourceData
        },
        timestamp: Date.now()
      });
    }
    
    updateElementText(payload) {
      if (!this.selectedElement) return;
      
      const { text } = payload;
      this.selectedElement.textContent = text;
    }
    
    highlightElement(element) {
      if (!this.highlightOverlay) return;
      
      const rect = element.getBoundingClientRect();
      Object.assign(this.highlightOverlay.style, {
        display: 'block',
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
    }
    
    unhighlightElement() {
      if (!this.highlightOverlay) return;
      
      this.highlightOverlay.style.display = 'none';
    }
    
    showSelectionBox(element) {
      if (!this.selectionBox) return;
      
      const rect = element.getBoundingClientRect();
      Object.assign(this.selectionBox.style, {
        display: 'block',
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
    }
    
    createOverlay() {
      // Create highlight overlay
      this.highlightOverlay = document.createElement('div');
      this.highlightOverlay.className = 'visual-editor-highlight';
      this.highlightOverlay.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 2px dashed #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        z-index: 999998;
        display: none;
      `;
      document.body.appendChild(this.highlightOverlay);
      
      // Create selection box
      this.selectionBox = document.createElement('div');
      this.selectionBox.className = 'visual-editor-selection';
      this.selectionBox.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 2px solid #ef4444;
        background: rgba(239, 68, 68, 0.05);
        z-index: 999999;
        display: none;
      `;
      document.body.appendChild(this.selectionBox);
    }
    
    removeOverlay() {
      if (this.highlightOverlay) {
        this.highlightOverlay.remove();
        this.highlightOverlay = null;
      }
      
      if (this.selectionBox) {
        this.selectionBox.remove();
        this.selectionBox = null;
      }
    }
    
    addStyles() {
      const style = document.createElement('style');
      style.id = 'visual-editor-styles';
      style.textContent = `
        .visual-editor-active * {
          cursor: pointer !important;
        }
        .visual-editor-active a,
        .visual-editor-active button {
          pointer-events: none !important;
        }
        [contenteditable="true"] {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
      document.body.classList.add('visual-editor-active');
    }
    
    removeStyles() {
      const style = document.getElementById('visual-editor-styles');
      if (style) style.remove();
      document.body.classList.remove('visual-editor-active');
    }
    
    postToParent(message) {
      window.parent.postMessage(message, '*');
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new VisualEditorClient());
  } else {
    new VisualEditorClient();
  }
})();