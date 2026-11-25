export interface Product {
  id: number | string;
  name: string;
  category: string;
  image: string;
  description?: string;
  price?: string | number;
  video?: string;
  // Versão animada; "image" é sempre a capa parada e leve.
  animation?: string;
  // Só vêm do banco; o catálogo fixo não vende pelo carrinho.
  priceCents?: number;
  stock?: number;
  onQuote?: boolean;
}

export interface PlaceReviewData {
  authorName: string;
  authorPhotoUri: string | null;
  authorUri: string | null;
  rating: number | null;
  relativeTime: string;
  text: string;
  publishTimeMs: number | null;
  googleMapsUri: string | null;
  flagContentUri: string | null;
}

export interface PlaceDetailsData {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: google.maps.LatLngLiteral;
  googleMapsUri: string;
  rating: number | null;
  userRatingCount: number | null;
  weekdayDescriptions: string[];
  reviews: PlaceReviewData[];
}
