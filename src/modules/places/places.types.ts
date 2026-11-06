export type PlaceCategory =
  | 'viewpoint'
  | 'waterfall'
  | 'fort'
  | 'temple'
  | 'garden'
  | 'lake'
  | 'plateau';

export interface PlaceItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  vicinity: string;
  shortDescription: string;
  description: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  altitude?: string | null;
  images: string[];
  coverImage?: string | null;
  timings?: string | null;
  entryFee?: string | null;
  bestTimeToVisit?: string | null;
  highlights: string[];
  tips: string[];
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlaceInput {
  name: string;
  slug?: string;
  category: string;
  vicinity: string;
  shortDescription: string;
  description: string;
  address?: string;
  latitude: number;
  longitude: number;
  altitude?: string;
  images?: string[];
  coverImage?: string;
  timings?: string;
  entryFee?: string;
  bestTimeToVisit?: string;
  highlights?: string[];
  tips?: string[];
  isFeatured?: boolean;
  order?: number;
  isActive?: boolean;
}

export interface UpdatePlaceInput extends Partial<CreatePlaceInput> {}

export interface PlaceListQuery {
  category?: string;
  vicinity?: string;
  search?: string;
  featured?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

