import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ContactFormSubmission {
    id: bigint;
    name: string;
    comment: string;
    timestamp: bigint;
    phone: string;
}
export interface CurrencyRates {
    euro: number;
    yuan: number;
}
export interface CostSettings {
    selectionServiceCost: number;
    deliveryCost: number;
    epTsCost: number;
}
export interface CurrencyAndCostSettings {
    selectionServiceCost: number;
    euroRate: number;
    deliveryCost: number;
    yuanRate: number;
    epTsCost: number;
}
export interface Vehicle {
    id: bigint;
    model: string;
    mileage: bigint;
    color: string;
    trim: string;
    year: bigint;
    description: string;
    brand: string;
    engineVolume: bigint;
    priceInYuan: bigint;
    horsepower: bigint;
    images: Array<ExternalBlob>;
}
export interface UserProfile {
    name: string;
}
export interface Review {
    id: bigint;
    city: string;
    name: string;
    comment: string;
    images: Array<ExternalBlob>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addReview(review: Review): Promise<bigint>;
    addVehicle(vehicle: Vehicle): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteContactFormSubmission(id: bigint): Promise<boolean>;
    deleteReview(id: bigint): Promise<boolean>;
    deleteVehicle(id: bigint): Promise<boolean>;
    duplicateVehicle(id: bigint): Promise<bigint | null>;
    getActiveFilters(): Promise<{
        brands: Array<string>;
        models: Array<string>;
        colors: Array<string>;
    }>;
    getAllContactFormSubmissions(): Promise<Array<ContactFormSubmission>>;
    getAllReviews(): Promise<Array<Review>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getBrands(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getColors(): Promise<Array<string>>;
    getCostSettings(): Promise<CostSettings>;
    getCurrencyAndCostSettings(): Promise<CurrencyAndCostSettings>;
    getCurrencyRates(): Promise<CurrencyRates>;
    getModelsByBrand(brand: string): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVehicle(id: bigint): Promise<Vehicle | null>;
    getVehiclesByFilter(brand: string | null, model: string | null, color: string | null): Promise<Array<Vehicle>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCostSettings(delivery: number, selectionService: number, epTs: number): Promise<void>;
    setCurrencyAndCostSettings(yuan: number, euro: number, delivery: number, selectionService: number, epTs: number): Promise<void>;
    setCurrencyRates(yuan: number, euro: number): Promise<void>;
    submitContactForm(name: string, phone: string, comment: string): Promise<bigint>;
    updateReview(id: bigint, review: Review): Promise<boolean>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<boolean>;
}
