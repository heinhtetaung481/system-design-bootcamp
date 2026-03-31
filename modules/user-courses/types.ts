export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  shape: 'rect' | 'cylinder' | 'diamond' | 'circle';
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface GeneratedDiagram {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface SavedDiagram {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  mode: 'mcp' | 'scratchpad';
  createdAt: string;
  diagram?: GeneratedDiagram;
  imageUrl?: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed_topics: string[];
  created_at: string;
  updated_at: string;
}
