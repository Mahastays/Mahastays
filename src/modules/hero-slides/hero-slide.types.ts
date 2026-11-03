export interface HeroSlide {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  paragraph?: string;
  image: string;
  cloudinaryPublicId?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

