import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SessionMemory, Annotation } from '../data/ProjectModel';

const ProjectContext = createContext();

export const ProjectProvider = ({ children, projectId }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session memory
  useEffect(() => {
    if (!projectId) return;

    const initializeSession = () => {
      // Try to load from sessionStorage first
      const stored = sessionStorage.getItem(`iel_session_${projectId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setSession(SessionMemory.fromJSON(data));
          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to load session:', err);
        }
      }

      // Create new session
      const newSession = new SessionMemory(projectId, 'client');
      setSession(newSession);
      setLoading(false);
    };

    initializeSession();
  }, [projectId]);

  // Persist session to sessionStorage whenever it changes
  useEffect(() => {
    if (!session) return;
    try {
      sessionStorage.setItem(
        `iel_session_${session.projectId}`,
        JSON.stringify(session.toJSON())
      );
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, [session]);

  const addAnnotation = useCallback(
    (sceneId, { geometry, viewportPosition, room, emoji }) => {
      if (!session) return null;
      const annotation = new Annotation({
        sceneId,
        geometry,
        viewportPosition,
        room,
        emoji,
      });
      session.addAnnotation(annotation);
      setSession({ ...session }); // trigger re-render
      return annotation.id;
    },
    [session]
  );

  const updateAnnotation = useCallback(
    (annotationId, updates) => {
      if (!session) return null;
      session.updateAnnotation(annotationId, updates);
      setSession({ ...session });
    },
    [session]
  );

  const removeAnnotation = useCallback(
    (annotationId) => {
      if (!session) return;
      session.removeAnnotation(annotationId);
      setSession({ ...session });
    },
    [session]
  );

  const getAnnotationsByScene = useCallback(
    (sceneId) => {
      if (!session) return [];
      return session.getAnnotationsByScene(sceneId);
    },
    [session]
  );

  const updateDNA = useCallback(
    (updates, reason = '') => {
      if (!session) return;
      session.updateDNA(updates, reason);
      setSession({ ...session });
    },
    [session]
  );

  const value = {
    session,
    loading,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    getAnnotationsByScene,
    updateDNA,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
