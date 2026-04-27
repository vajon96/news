export type NewsStatus = 'draft' | 'published';

export interface NewsArticle {
  id?: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  featuredImageThumb?: string;
  featuredImageMedium?: string;
  images: string[];
  status: NewsStatus;
  views: number;
  tags?: string[];
  scheduledAt?: any;
  authorId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  contactEmail: string;
  accentColor: string;
}

export const NEWS_CATEGORIES = [
  'Politics',
  'World',
  'Business',
  'Technology',
  'Science',
  'Health',
  'Sports',
  'Entertainment',
  'Lifestyle'
];
