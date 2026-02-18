import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { useGetAllVehicles, useIsCallerAdmin } from '../hooks/useQueries';
import VehicleCard from '../components/VehicleCard';
import VehicleFormModal from '../components/VehicleFormModal';
import ContactFormModal from '../components/ContactFormModal';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { Vehicle } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 12;

export default function CatalogPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as any;
  const scrollPositionRef = useRef<number>(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Initialize filters from URL query parameters
  const [selectedBrand, setSelectedBrand] = useState<string | null>(search?.brand || null);
  const [selectedModel, setSelectedModel] = useState<string | null>(search?.model || null);
  const [selectedColor, setSelectedColor] = useState<string | null>(search?.color || null);
  
  // Pagination state
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch all vehicles once
  const { 
    data: allVehicles = [],
    isLoading,
    error,
    refetch,
  } = useGetAllVehicles();

  const { data: isAdmin } = useIsCallerAdmin();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Client-side filtering
  const filteredVehicles = useMemo(() => {
    return allVehicles.filter((vehicle) => {
      const brandMatch = !selectedBrand || vehicle.brand === selectedBrand;
      const modelMatch = !selectedModel || vehicle.model === selectedModel;
      const colorMatch = !selectedColor || vehicle.color === selectedColor;
      return brandMatch && modelMatch && colorMatch;
    });
  }, [allVehicles, selectedBrand, selectedModel, selectedColor]);

  // Get displayed vehicles (paginated from filtered list)
  const displayedVehicles = useMemo(() => {
    return filteredVehicles.slice(0, displayedCount);
  }, [filteredVehicles, displayedCount]);

  const hasMore = displayedCount < filteredVehicles.length;

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [selectedBrand, selectedModel, selectedColor]);

  // Restore scroll position when returning from vehicle detail
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('catalogScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition, 10));
      sessionStorage.removeItem('catalogScrollPosition');
    }
  }, []);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite scroll implementation using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setIsLoadingMore(true);
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredVehicles.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, filteredVehicles.length]);

  // Derive filter options from loaded vehicles
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    allVehicles.forEach((vehicle) => {
      brandsSet.add(vehicle.brand);
    });
    return Array.from(brandsSet).sort();
  }, [allVehicles]);

  const availableModels = useMemo(() => {
    if (!selectedBrand) {
      const modelsSet = new Set<string>();
      allVehicles.forEach((vehicle) => {
        modelsSet.add(vehicle.model);
      });
      return Array.from(modelsSet).sort();
    }
    
    const modelsSet = new Set<string>();
    allVehicles.forEach((vehicle) => {
      if (vehicle.brand === selectedBrand) {
        modelsSet.add(vehicle.model);
      }
    });
    
    return Array.from(modelsSet).sort();
  }, [selectedBrand, allVehicles]);

  const availableColors = useMemo(() => {
    const colorsSet = new Set<string>();
    allVehicles.forEach((vehicle) => {
      colorsSet.add(vehicle.color);
    });
    return Array.from(colorsSet).sort();
  }, [allVehicles]);

  // Reset model when brand changes
  useEffect(() => {
    if (selectedBrand && selectedModel) {
      // Check if current model is still valid for the selected brand
      const isModelValid = availableModels.includes(selectedModel);
      if (!isModelValid) {
        setSelectedModel(null);
        updateUrlParams(selectedBrand, null, selectedColor);
      }
    }
  }, [selectedBrand, selectedModel, availableModels]);

  // Update URL query parameters when filters change
  const updateUrlParams = (brand: string | null, model: string | null, color: string | null) => {
    const params: Record<string, string> = {};
    if (brand) params.brand = brand;
    if (model) params.model = model;
    if (color) params.color = color;

    navigate({
      to: '/catalog',
      search: Object.keys(params).length > 0 ? params : undefined,
      replace: true,
    });
  };

  const handleViewVehicle = useCallback((vehicle: Vehicle) => {
    // Save current scroll position
    sessionStorage.setItem('catalogScrollPosition', scrollPositionRef.current.toString());
    
    // Navigate using vehicle's unique ID
    const params: Record<string, string> = {};
    if (selectedBrand) params.brand = selectedBrand;
    if (selectedModel) params.model = selectedModel;
    if (selectedColor) params.color = selectedColor;

    navigate({ 
      to: `/catalog/${vehicle.id.toString()}`,
      search: Object.keys(params).length > 0 ? params : undefined,
    });
  }, [navigate, selectedBrand, selectedModel, selectedColor]);

  const handleClearFilters = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedColor(null);
    updateUrlParams(null, null, null);
  };

  const handleBrandChange = (value: string) => {
    const newBrand = value === 'all' ? null : value;
    setSelectedBrand(newBrand);
    // Reset model when brand changes
    if (newBrand !== selectedBrand) {
      setSelectedModel(null);
      updateUrlParams(newBrand, null, selectedColor);
    } else {
      updateUrlParams(newBrand, selectedModel, selectedColor);
    }
  };

  const handleModelChange = (value: string) => {
    const newModel = value === 'all' ? null : value;
    setSelectedModel(newModel);
    updateUrlParams(selectedBrand, newModel, selectedColor);
  };

  const handleColorChange = (value: string) => {
    const newColor = value === 'all' ? null : value;
    setSelectedColor(newColor);
    updateUrlParams(selectedBrand, selectedModel, newColor);
  };

  const hasActiveFilters = selectedBrand || selectedModel || selectedColor;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Каталог автомобилей</h1>
        {isAdmin && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Добавить автомобиль
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Ошибка загрузки данных. Пожалуйста, попробуйте обновить страницу.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="ml-4"
            >
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Controls */}
      <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Фильтры:
          </span>
          <div className="flex flex-wrap gap-3 flex-1 w-full sm:w-auto">
            {/* Brand Filter */}
            <Select
              value={selectedBrand || 'all'}
              onValueChange={handleBrandChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Марка" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="all">Все марки</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model Filter - Shows only models for selected brand */}
            <Select
              value={selectedModel || 'all'}
              onValueChange={handleModelChange}
              disabled={availableModels.length === 0 || isLoading}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Модель" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="all">Все модели</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Color Filter - Shows actual colors */}
            <Select
              value={selectedColor || 'all'}
              onValueChange={handleColorChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Цвет" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="all">Все цвета</SelectItem>
                {availableColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {selectedBrand && (
              <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                <span className="font-medium">Марка:</span> {selectedBrand}
              </div>
            )}
            {selectedModel && (
              <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                <span className="font-medium">Модель:</span> {selectedModel}
              </div>
            )}
            {selectedColor && (
              <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                <span className="font-medium">Цвет:</span> {selectedColor}
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl text-muted-foreground">Загрузка автомобилей...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'По выбранным фильтрам автомобили не найдены'
              : 'Автомобили не найдены'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              Сбросить фильтры
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id.toString()}
                vehicle={vehicle}
                onView={() => handleViewVehicle(vehicle)}
                onEdit={isAdmin ? () => setEditingVehicle(vehicle) : undefined}
                onContact={() => setIsContactModalOpen(true)}
              />
            ))}
          </div>

          {/* Infinite scroll trigger and loading indicator */}
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-8">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Загрузка...</span>
                </div>
              )}
            </div>
          )}

          {/* Results summary */}
          <div className="text-center py-4 text-sm text-muted-foreground">
            Показано {displayedVehicles.length} из {filteredVehicles.length} автомобилей
          </div>
        </>
      )}

      {isAddModalOpen && <VehicleFormModal onClose={() => setIsAddModalOpen(false)} />}
      {editingVehicle && <VehicleFormModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} />}
      <ContactFormModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
    </div>
  );
}
