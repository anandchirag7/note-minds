export interface Source {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'file';
  color: string; // For UI decoration
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  transcript: string | null;
  error: string | null;
}

export interface AppState {
  sources: Source[];
  messages: ChatMessage[];
  isChatLoading: boolean;
  audioState: AudioState;
}

export interface MindMapData {
  label: string;
  description?: string;
  children?: MindMapData[];
}

export type ViewType = 'chat' | 'mindmap';
