// types/types.ts
export interface BlogImage {
  id: string;
  caption?: string;
  position: number; // After which paragraph this image should appear
}

export interface Author {
  name: string;
  role: string;
}

export interface ArticleData {
  id: string;
  title: string;
  excerpt: string;
  department: string; // "Prayukti" | "Abohoman" | "Archive"
  date: string;
  readTime: string;
  author: Author;
  paragraphs: string[];
  images: BlogImage[];
  tags?: string; // Mapped from department
}

export interface BlogPost extends ArticleData {
  category?: string;
}

export interface Photographer {
  name: string;
  dept: string;
  year: string;
}

export interface Photograph {
  id: string;
  title: string;
  description: string;
  photographer: Photographer;
  image: string;
}

export interface DrawingParticipant {
  participant_name: string;
  department_or_class: string;
  year_level: string;
  department: string;
}

export interface DrawingFile {
  drive_id: string;
  filename: string;
  file_type: string;
  rank: string;
  inferred_details: DrawingParticipant;
}

export interface DrawingFolder {
  folder_context: string;
  files: DrawingFile[];
}
