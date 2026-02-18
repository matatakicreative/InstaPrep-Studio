
export interface Hashtag {
  id: string;
  tag: string;
  selected: boolean;
}

export interface BusinessHours {
  open: string;
  close: string;
}

export interface GeneratedContent {
  caption: string;
  caption_jp: string;
  imagePhrase: string;
  imagePhrase_jp: string;
}

// Added missing StoryFont type definition
export type StoryFont = 'font-strong' | 'font-modern' | 'font-serif' | 'font-casual' | 'font-sans';

// Added missing FilterState type definition
export interface FilterState {
  name: string;
  filter: string;
  intensity: number;
}

// Added missing StoryElement type definition
export interface StoryElement {
  id: string;
  text: string;
  visible: boolean;
  x: number;
  y: number;
  size: number;
  color: string;
  font: StoryFont;
  hasBackground: boolean;
  bgOpacity: number;
  bgColor: string;
}