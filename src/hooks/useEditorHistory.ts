import { useState, useCallback, useRef } from "react";

interface HistoryState {
  content: any;
  trainerInfo: any;
  designConfig: any;
}

interface UseEditorHistoryOptions {
  maxHistory?: number;
}

export function useEditorHistory(options: UseEditorHistoryOptions = {}) {
  const { maxHistory = 50 } = options;
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Push a new state to history
  const pushState = useCallback((state: HistoryState) => {
    // Don't push if this is an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setHistory((prev) => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(state);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  // Initialize history with first state
  const initHistory = useCallback((state: HistoryState) => {
    setHistory([state]);
    setCurrentIndex(0);
  }, []);

  // Undo - go back one state
  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null;
    
    isUndoRedoAction.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canUndo, currentIndex, history]);

  // Redo - go forward one state
  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null;
    
    isUndoRedoAction.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canRedo, currentIndex, history]);

  // Get current history info
  const historyInfo = {
    current: currentIndex + 1,
    total: history.length,
  };

  return {
    pushState,
    initHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyInfo,
  };
}
