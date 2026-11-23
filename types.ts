export interface Product {
  id: number | string;
  name: string;
  category: string;
  image: string;
  description?: string;
  price?: string | number;
  video?: string;
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

export type CampaignType =
  | 'product_presentation'
  | 'promotional_offer'
  | 'launch'
  | 'service_showcase'
  | 'sales_campaign'
  | 'combos_kits'
  | 'institutional';

export type CampaignFormat = '1080x1350' | '1080x1920' | '1080x1080';
export type GeneratedImageFormat = 'PNG' | 'JPG';
export type CampaignMediaType = 'image' | 'video';
export type CampaignGenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface CampaignMediaItem {
  id: string;
  kind: 'image' | 'video';
  url: string;
  label: string;
  source: 'product' | 'gallery' | 'admin';
  productId?: number | string;
  file?: File;
}

export interface CampaignCopy {
  variantId: string;
  variantLabel: string;
  attention: string;
  interest: string;
  desire: string[];
  action: string;
  price?: string;
  includeContactLink: boolean;
}

export interface GeneratedCampaignOutput {
  campaign_title: string;
  campaign_description: string;
  campaign_price: string;
  campaign_cta: string;
  original_product_image_id: string;
  generated_image_url: string;
  generated_image_format: GeneratedImageFormat;
  original_video_id: string | null;
  media_type: CampaignMediaType;
  generation_status: CampaignGenerationStatus;
  generatedFile?: File;
  generatedBlob?: Blob;
  errorMessage?: string;
}

export interface SavedCampaign {
  id: string;
  name: string;
  createdAt: string;
  approved: boolean;
  approvedAt?: string;
  campaignType: CampaignType;
  format: CampaignFormat;
  imageFormat: GeneratedImageFormat;
  selectedCategory: string;
  selectedProductIds: Array<number | string>;
  selectedMediaUrls: string[];
  copy: CampaignCopy;
  output?: {
    campaign_title: string;
    campaign_description: string;
    campaign_price: string;
    campaign_cta: string;
    original_product_image_id: string;
    generated_image_url: string;
    generated_image_format: GeneratedImageFormat;
    original_video_id: string | null;
    media_type: CampaignMediaType;
    generation_status: CampaignGenerationStatus;
  };
  generatedImageBlob?: Blob;
}



