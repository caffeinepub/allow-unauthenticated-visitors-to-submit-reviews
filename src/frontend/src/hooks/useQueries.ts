import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, CurrencyAndCostSettings, Vehicle as BackendVehicle, Review as BackendReview, ContactFormSubmission } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import type { Vehicle, Review } from '../types';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      toast.success('Профиль сохранен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Currency and Cost Settings Queries with enhanced caching
export function useGetCurrencyAndCostSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CurrencyAndCostSettings>({
    queryKey: ['currencyAndCostSettings'],
    queryFn: async () => {
      if (!actor) return { yuanRate: 0, euroRate: 0, deliveryCost: 0, selectionServiceCost: 0, epTsCost: 0 };
      return actor.getCurrencyAndCostSettings();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 15, // 15 minutes - settings don't change often
    gcTime: 1000 * 60 * 60, // 60 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useSetCurrencyAndCostSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { yuanRate: number; euroRate: number; deliveryCost: number; selectionServiceCost: number; epTsCost: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCurrencyAndCostSettings(data.yuanRate, data.euroRate, data.deliveryCost, data.selectionServiceCost, data.epTsCost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencyAndCostSettings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Настройки сохранены');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

// Vehicle Queries with enhanced caching and error handling
function convertBackendVehicleToFrontend(vehicle: BackendVehicle): Vehicle {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    trim: vehicle.trim,
    year: vehicle.year,
    color: vehicle.color,
    mileage: vehicle.mileage,
    horsepower: vehicle.horsepower,
    engineVolume: vehicle.engineVolume,
    priceInYuan: vehicle.priceInYuan,
    description: vehicle.description,
    images: vehicle.images,
  };
}

export function useGetAllVehicles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Vehicle[]>({
    queryKey: ['vehicles', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      const vehicles = await actor.getAllVehicles();
      return vehicles.map(convertBackendVehicleToFrontend);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Kept for backward compatibility but not used in catalog anymore
export function useGetVehiclesByFilter(filters: { brand?: string | null; model?: string | null; color?: string | null }) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Vehicle[]>({
    queryKey: ['vehicles', 'filtered', filters.brand, filters.model, filters.color],
    queryFn: async () => {
      if (!actor) return [];
      const vehicles = await actor.getVehiclesByFilter(
        filters.brand || null,
        filters.model || null,
        filters.color || null
      );
      return vehicles.map(convertBackendVehicleToFrontend);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useGetVehicle(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Vehicle | null>({
    queryKey: ['vehicles', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      const vehicle = await actor.getVehicle(id);
      return vehicle ? convertBackendVehicleToFrontend(vehicle) : null;
    },
    enabled: !!actor && !actorFetching && id !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Prefetch vehicle data for hover interactions
export function usePrefetchVehicle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return (id: bigint) => {
    if (!actor) return;
    
    queryClient.prefetchQuery({
      queryKey: ['vehicles', id.toString()],
      queryFn: async () => {
        const vehicle = await actor.getVehicle(id);
        return vehicle ? convertBackendVehicleToFrontend(vehicle) : null;
      },
      staleTime: 1000 * 60 * 5,
    });
  };
}

// Derive filter options from cached vehicles list
export function useGetActiveFilters() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ brands: string[]; models: string[]; colors: string[] }>({
    queryKey: ['activeFilters'],
    queryFn: async () => {
      if (!actor) return { brands: [], models: [], colors: [] };
      return actor.getActiveFilters();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useAddVehicle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      const backendVehicle: Omit<BackendVehicle, 'id'> = {
        brand: vehicle.brand,
        model: vehicle.model,
        trim: vehicle.trim,
        year: vehicle.year,
        color: vehicle.color,
        mileage: vehicle.mileage,
        horsepower: vehicle.horsepower,
        engineVolume: vehicle.engineVolume,
        priceInYuan: vehicle.priceInYuan,
        description: vehicle.description,
        images: vehicle.images,
      };
      return actor.addVehicle(backendVehicle as BackendVehicle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['activeFilters'] });
      toast.success('Автомобиль добавлен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

export function useUpdateVehicle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Vehicle) => {
      if (!actor) throw new Error('Actor not available');
      const backendVehicle: BackendVehicle = {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        trim: vehicle.trim,
        year: vehicle.year,
        color: vehicle.color,
        mileage: vehicle.mileage,
        horsepower: vehicle.horsepower,
        engineVolume: vehicle.engineVolume,
        priceInYuan: vehicle.priceInYuan,
        description: vehicle.description,
        images: vehicle.images,
      };
      return actor.updateVehicle(vehicle.id, backendVehicle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['activeFilters'] });
      toast.success('Автомобиль обновлен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

// Alias for backward compatibility
export const useEditVehicle = useUpdateVehicle;

export function useDeleteVehicle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVehicle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['activeFilters'] });
      toast.success('Автомобиль удален');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

export function useDuplicateVehicle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.duplicateVehicle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['activeFilters'] });
      toast.success('Автомобиль дублирован');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

// Review Queries
function convertBackendReviewToFrontend(review: BackendReview): Review {
  return {
    id: review.id,
    name: review.name,
    city: review.city,
    comment: review.comment,
    images: review.images,
  };
}

export function useGetAllReviews() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      if (!actor) return [];
      const reviews = await actor.getAllReviews();
      return reviews.map(convertBackendReviewToFrontend);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAddReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: Omit<Review, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      const backendReview: Omit<BackendReview, 'id'> = {
        name: review.name,
        city: review.city,
        comment: review.comment,
        images: review.images,
      };
      return actor.addReview(backendReview as BackendReview);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Отзыв добавлен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

// Alias for backward compatibility
export const useSubmitReview = useAddReview;

export function useUpdateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: Review) => {
      if (!actor) throw new Error('Actor not available');
      const backendReview: BackendReview = {
        id: review.id,
        name: review.name,
        city: review.city,
        comment: review.comment,
        images: review.images,
      };
      return actor.updateReview(review.id, backendReview);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Отзыв обновлен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

// Alias for backward compatibility
export const useEditReview = useUpdateReview;

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteReview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Отзыв удален');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

// Contact Form Queries
export function useGetAllContactFormSubmissions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ContactFormSubmission[]>({
    queryKey: ['contactFormSubmissions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContactFormSubmissions();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useSubmitContactForm() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; phone: string; comment: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitContactForm(data.name, data.phone, data.comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactFormSubmissions'] });
      toast.success('Заявка отправлена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}

export function useDeleteContactFormSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteContactFormSubmission(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactFormSubmissions'] });
      toast.success('Заявка удалена');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}
