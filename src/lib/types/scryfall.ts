export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
      png?: string;
    };
  }>;
  [key: string]: unknown;
}
