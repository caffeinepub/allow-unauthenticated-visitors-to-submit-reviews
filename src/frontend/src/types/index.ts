import { ExternalBlob } from '../backend';

export interface Vehicle {
  id: bigint;
  brand: string;
  model: string;
  trim: string;
  year: bigint;
  color: string;
  mileage: bigint;
  horsepower: bigint;
  engineVolume: bigint;
  priceInYuan: bigint;
  description: string;
  images: ExternalBlob[];
}

export interface Review {
  id: bigint;
  name: string;
  city: string;
  comment: string;
  images: ExternalBlob[];
}

export interface ContactFormSubmission {
  id: bigint;
  name: string;
  phone: string;
  comment: string;
  timestamp: bigint;
}

