export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  author: { _id: string; fullName: string; avatar?: string };
  tags?: string[];
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
}
