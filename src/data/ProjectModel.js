// Project DNA and Annotation Data Models
// Persistent layer for architectural decisions

/**
 * Annotation Object
 * Represents a marked point/region in a scene with metadata
 */
export class Annotation {
  constructor({
    id = null,
    sceneId,
    geometry = null, // { type: 'point' | 'rect' | 'freehand', data: any }
    viewportPosition = { x: 0, y: 0 }, // normalized 0-1
    room = '',
    emoji = '??', // from PINS
    timestamp = null,
    linkedConversation = [], // array of AI exchanges
    linkedComments = [], // user notes
    status = 'active', // 'active' | 'resolved' | 'archived'
  } = {}) {
    this.id = id || `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sceneId = sceneId;
    this.geometry = geometry;
    this.viewportPosition = viewportPosition;
    this.room = room;
    this.emoji = emoji;
    this.timestamp = timestamp || new Date().toISOString();
    this.linkedConversation = linkedConversation;
    this.linkedComments = linkedComments;
    this.status = status;
  }

  toJSON() {
    return {
      id: this.id,
      sceneId: this.sceneId,
      geometry: this.geometry,
      viewportPosition: this.viewportPosition,
      room: this.room,
      emoji: this.emoji,
      timestamp: this.timestamp,
      linkedConversation: this.linkedConversation,
      linkedComments: this.linkedComments,
      status: this.status,
    };
  }

  static fromJSON(data) {
    return new Annotation(data);
  }
}

/**
 * ProjectDNA Object
 * Living model of architectural decisions and preferences
 */
export class ProjectDNA {
  constructor({
    designIntent = '',
    materials = [],
    lighting = { natural: 100, artificial: 0, notes: '' },
    privacy = { level: 'medium', zones: [] },
    atmosphere = { mood: '', keywords: [] },
    recurringPreferences = [],
    unresolvedQuestions = [],
    confidenceLevel = 0.5, // 0-1 scale
    renderPromptVersion = 1,
    renderPromptText = '',
  } = {}) {
    this.designIntent = designIntent;
    this.materials = materials; // [{ name, color, notes }]
    this.lighting = lighting;
    this.privacy = privacy;
    this.atmosphere = atmosphere;
    this.recurringPreferences = recurringPreferences;
    this.unresolvedQuestions = unresolvedQuestions;
    this.confidenceLevel = confidenceLevel;
    this.renderPromptVersion = renderPromptVersion;
    this.renderPromptText = renderPromptText;
    this.lastUpdated = new Date().toISOString();
  }

  updateFromAnnotation(annotation) {
    this.lastUpdated = new Date().toISOString();
    // DNA updates based on annotation context
    // This is called when AI processes an annotation
  }

  toJSON() {
    return {
      designIntent: this.designIntent,
      materials: this.materials,
      lighting: this.lighting,
      privacy: this.privacy,
      atmosphere: this.atmosphere,
      recurringPreferences: this.recurringPreferences,
      unresolvedQuestions: this.unresolvedQuestions,
      confidenceLevel: this.confidenceLevel,
      renderPromptVersion: this.renderPromptVersion,
      renderPromptText: this.renderPromptText,
      lastUpdated: this.lastUpdated,
    };
  }

  static fromJSON(data) {
    return new ProjectDNA(data);
  }
}

/**
 * SessionMemory
 * Manages runtime state of annotations and DNA
 * Can be persisted to Firestore or sessionStorage
 */
export class SessionMemory {
  constructor(projectId, userId) {
    this.projectId = projectId;
    this.userId = userId;
    this.annotations = new Map(); // id -> Annotation
    this.dna = new ProjectDNA();
    this.decisionTimeline = []; // chronological log
    this.createdAt = new Date().toISOString();
    this.lastModified = new Date().toISOString();
  }

  addAnnotation(annotation) {
    this.annotations.set(annotation.id, annotation);
    this.lastModified = new Date().toISOString();
    this.logDecision('annotation_created', annotation.id, annotation);
    return annotation.id;
  }

  updateAnnotation(annotationId, updates) {
    const ann = this.annotations.get(annotationId);
    if (!ann) return null;
    Object.assign(ann, updates);
    ann.timestamp = new Date().toISOString();
    this.lastModified = new Date().toISOString();
    this.logDecision('annotation_updated', annotationId, updates);
    return ann;
  }

  removeAnnotation(annotationId) {
    this.annotations.delete(annotationId);
    this.lastModified = new Date().toISOString();
    this.logDecision('annotation_removed', annotationId, {});
  }

  getAnnotationsByScene(sceneId) {
    return Array.from(this.annotations.values()).filter(a => a.sceneId === sceneId);
  }

  updateDNA(updates, reason = '') {
    Object.assign(this.dna, updates);
    this.dna.lastUpdated = new Date().toISOString();
    this.lastModified = new Date().toISOString();
    this.logDecision('dna_updated', reason, updates);
  }

  logDecision(type, id, data) {
    this.decisionTimeline.push({
      type,
      id,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  toJSON() {
    return {
      projectId: this.projectId,
      userId: this.userId,
      annotations: Array.from(this.annotations.values()).map(a => a.toJSON()),
      dna: this.dna.toJSON(),
      decisionTimeline: this.decisionTimeline,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
    };
  }

  static fromJSON(data) {
    const session = new SessionMemory(data.projectId, data.userId);
    data.annotations.forEach(annData => {
      const ann = Annotation.fromJSON(annData);
      session.annotations.set(ann.id, ann);
    });
    session.dna = ProjectDNA.fromJSON(data.dna);
    session.decisionTimeline = data.decisionTimeline;
    session.createdAt = data.createdAt;
    session.lastModified = data.lastModified;
    return session;
  }
}
