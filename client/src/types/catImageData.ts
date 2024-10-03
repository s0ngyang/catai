export interface CatImageData {
  id: string; // The unique identifier for the image
  url: string; // The URL of the image
  width: number; // The width of the image
  height: number; // The height of the image
  mime_type?: string; // The MIME type of the image (e.g., "image/jpeg")
  breeds: Array<Breed>; // An array representing breeds (currently empty)
  categories?: Array<any>; // An array representing categories (currently empty)
}

interface Breed {
  id: number; // The unique identifier for the breed
  name: string; // The name of the breed
  weight?: string; // The weight range of the breed
  height?: string; // The height range of the breed
  life_span?: string; // The life expectancy of the breed
  breed_group?: string; // The breed group (e.g., "Sporting")
}
