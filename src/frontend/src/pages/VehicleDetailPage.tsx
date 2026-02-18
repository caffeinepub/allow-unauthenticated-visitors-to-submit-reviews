import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useGetVehicle, useIsCallerAdmin, useGetCurrencyAndCostSettings } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Vehicle } from '../types';
import { calculatePriceBreakdown, formatPrice } from '../lib/priceCalculator';
import ProgressiveImage from '../components/ProgressiveImage';
import ImagePrefetcher from '../components/ImagePrefetcher';

// Lazy load modals
const VehicleFormModal = lazy(() => import('../components/VehicleFormModal'));
const ContactFormModal = lazy(() => import('../components/ContactFormModal'));

export default function VehicleDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false }) as any;
  
  // Get vehicle ID from URL params and convert to bigint
  const vehicleIdStr = (params as any).vehicleId as string | undefined;
  const vehicleId = vehicleIdStr ? BigInt(vehicleIdStr) : null;
  
  const { data: vehicle, isLoading } = useGetVehicle(vehicleId);
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: settings } = useGetCurrencyAndCostSettings();

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (vehicle) {
      const urls = vehicle.images.map((img) => img.getDirectURL());
      setImageUrls(urls);
      setSelectedImageIndex(0);
    }
  }, [vehicle]);

  // Handle ESC key and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft' && imageUrls.length > 1) {
        prevImage();
      } else if (e.key === 'ArrowRight' && imageUrls.length > 1) {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrls.length, selectedImageIndex]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      // Preserve filter state when navigating back to catalog
      const params: Record<string, string> = {};
      if (search?.brand) params.brand = search.brand;
      if (search?.model) params.model = search.model;
      if (search?.color) params.color = search.color;

      navigate({ 
        to: '/catalog',
        search: Object.keys(params).length > 0 ? params : undefined,
      });
    }, 200);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  const priceBreakdown = vehicle && settings
    ? calculatePriceBreakdown(Number(vehicle.priceInYuan), Number(vehicle.engineVolume), settings)
    : null;

  // Get next 3 images for prefetching
  const getUpcomingImages = () => {
    if (imageUrls.length <= 1) return [];
    const upcoming: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (selectedImageIndex + i) % imageUrls.length;
      upcoming.push(imageUrls[nextIndex]);
    }
    return upcoming;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Автомобиль не найден</p>
          <Button onClick={handleClose} variant="outline">
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dark overlay with fade-in animation */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isAnimatingOut ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Full-screen detail page with slide-up animation */}
      <div 
        className={`fixed inset-0 z-50 bg-background overflow-hidden transition-all duration-300 ${
          isAnimatingOut 
            ? 'opacity-0 translate-y-4' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Close button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClose}
          className="absolute top-4 right-4 z-[60] bg-background/95 hover:bg-background shadow-lg rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Prefetch upcoming images */}
        <ImagePrefetcher urls={getUpcomingImages()} />

        {/* Two-column layout: 65% image gallery, 35% details */}
        <div className="flex flex-col lg:flex-row h-full w-full">
          {/* Left Column - Image Gallery (65%) - Mobile: at top */}
          <div className="w-full lg:w-[65%] bg-muted/20 flex flex-col order-1 lg:order-1 h-[45vh] lg:h-full">
            {/* Main Image Viewer with progressive loading */}
            <div 
              className="relative flex-1 flex items-center justify-center bg-muted/30 overflow-hidden touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {imageUrls.length > 0 ? (
                <>
                  <ProgressiveImage
                    src={imageUrls[selectedImageIndex]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="max-w-full max-h-full w-full h-full"
                    key={selectedImageIndex}
                    priority={selectedImageIndex === 0}
                  />
                  
                  {/* Navigation Arrows */}
                  {imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background text-foreground p-2 lg:p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg z-10"
                        aria-label="Предыдущее фото"
                      >
                        <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background text-foreground p-2 lg:p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg z-10"
                        aria-label="Следующее фото"
                      >
                        <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {imageUrls.length > 1 && (
                    <div className="absolute bottom-2 lg:bottom-4 left-1/2 -translate-x-1/2 bg-background/90 text-foreground px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium shadow-lg">
                      {selectedImageIndex + 1} / {imageUrls.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground text-lg">Нет фото</div>
              )}
            </div>

            {/* Thumbnail Gallery - Hidden on mobile, progressive loading */}
            {imageUrls.length > 1 && (
              <div className="hidden lg:block bg-background border-t p-4">
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                          idx === selectedImageIndex
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <ProgressiveImage 
                          src={url} 
                          alt={`Миниатюра ${idx + 1}`} 
                          className="w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Right Column - Vehicle Details (35%) - Mobile: below images */}
          <div className="w-full lg:w-[35%] bg-background flex flex-col order-2 lg:order-2 flex-1 lg:h-full overflow-hidden">
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6">
                {/* Title */}
                <div>
                  <div className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wide mb-1 lg:mb-2">
                    {vehicle.brand}
                  </div>
                  <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
                    {vehicle.model}
                  </h1>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Цена в юанях: ¥{formatPrice(vehicle.priceInYuan)}
                  </div>
                  <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary">
                    {priceBreakdown ? formatPrice(priceBreakdown.total) : '—'} ₽
                  </div>
                  <div className="text-sm text-muted-foreground">примерная стоимость</div>
                </div>

                {/* Price Breakdown */}
                {priceBreakdown && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
                    <div className="text-sm font-semibold text-foreground mb-2">
                      Детализация стоимости:
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Цена авто</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.carPrice)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Таможня</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.customsDuty)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Доставка</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.delivery)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">СБКТС/ЭПТС</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.epTs)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Комиссия банка</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.bankCommission)} ₽</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Услуги подбора</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.selectionService)} ₽</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold">Итого</span>
                        <span className="font-bold text-primary">{formatPrice(priceBreakdown.total)} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Attributes */}
                <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-3 lg:pt-4 border-t">
                  {/* Color */}
                  <div className="space-y-1 lg:space-y-2">
                    <div className="text-xs lg:text-sm text-muted-foreground">Цвет</div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-border shadow-sm"
                        style={{ 
                          backgroundColor: vehicle.color.toLowerCase().includes('желт') || vehicle.color.toLowerCase().includes('yellow') 
                            ? '#FFD700' 
                            : vehicle.color.toLowerCase().includes('красн') || vehicle.color.toLowerCase().includes('red')
                            ? '#DC2626'
                            : vehicle.color.toLowerCase().includes('син') || vehicle.color.toLowerCase().includes('blue')
                            ? '#2563EB'
                            : vehicle.color.toLowerCase().includes('черн') || vehicle.color.toLowerCase().includes('black')
                            ? '#000000'
                            : vehicle.color.toLowerCase().includes('бел') || vehicle.color.toLowerCase().includes('white')
                            ? '#FFFFFF'
                            : vehicle.color.toLowerCase().includes('сер') || vehicle.color.toLowerCase().includes('gray')
                            ? '#6B7280'
                            : vehicle.color.toLowerCase().includes('зелен') || vehicle.color.toLowerCase().includes('green')
                            ? '#16A34A'
                            : '#9CA3AF'
                        }}
                      />
                      <span className="text-sm lg:text-base font-medium">{vehicle.color}</span>
                    </div>
                  </div>

                  {/* Mileage */}
                  <div className="space-y-1 lg:space-y-2">
                    <div className="text-xs lg:text-sm text-muted-foreground">Пробег</div>
                    <div className="text-sm lg:text-base font-semibold">{Number(vehicle.mileage).toLocaleString('ru-RU')} км</div>
                  </div>

                  {/* Trim */}
                  <div className="space-y-1 lg:space-y-2">
                    <div className="text-xs lg:text-sm text-muted-foreground">Комплектация</div>
                    <div className="text-sm lg:text-base font-semibold">{vehicle.trim}</div>
                  </div>

                  {/* Year */}
                  <div className="space-y-1 lg:space-y-2">
                    <div className="text-xs lg:text-sm text-muted-foreground">Год</div>
                    <div className="text-sm lg:text-base font-semibold">{vehicle.year.toString()}</div>
                  </div>
                </div>

                {/* Additional Specs */}
                <div className="pt-3 lg:pt-4 border-t space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm text-muted-foreground">Мощность</span>
                    <span className="text-sm lg:text-base font-medium">{Number(vehicle.horsepower)} л.с.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm text-muted-foreground">Объем двигателя</span>
                    <span className="text-sm lg:text-base font-medium">{Number(vehicle.engineVolume)} cc</span>
                  </div>
                </div>

                {/* Description */}
                {vehicle.description && (
                  <div className="pt-3 lg:pt-4 border-t space-y-2 lg:space-y-3">
                    <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Описание</div>
                    <p className="text-xs lg:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {vehicle.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 lg:pt-6 space-y-3 pb-6">
                  <Button onClick={() => setIsContactModalOpen(true)} className="w-full" size="lg">
                    Связаться с нами
                  </Button>
                  {isAdmin && (
                    <Button 
                      onClick={() => setEditingVehicle(vehicle)} 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                    >
                      Редактировать
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Lazy loaded modals */}
      {editingVehicle && (
        <Suspense fallback={null}>
          <VehicleFormModal
            vehicle={editingVehicle}
            onClose={() => setEditingVehicle(null)}
          />
        </Suspense>
      )}

      {isContactModalOpen && (
        <Suspense fallback={null}>
          <ContactFormModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
        </Suspense>
      )}
    </>
  );
}

