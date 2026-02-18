import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Gauge, Fuel, Palette, Edit, MessageSquare } from 'lucide-react';
import type { Vehicle } from '../types';
import { useState, useEffect } from 'react';
import { useGetCurrencyAndCostSettings, usePrefetchVehicle } from '../hooks/useQueries';
import { calculateApproxCost, formatPrice } from '../lib/priceCalculator';
import ProgressiveImage from './ProgressiveImage';

interface VehicleCardProps {
  vehicle: Vehicle;
  onView: () => void;
  onEdit?: () => void;
  onContact?: () => void;
}

export default function VehicleCard({ vehicle, onView, onEdit, onContact }: VehicleCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const { data: settings } = useGetCurrencyAndCostSettings();
  const prefetchVehicle = usePrefetchVehicle();

  useEffect(() => {
    if (vehicle.images.length > 0) {
      setImageUrl(vehicle.images[0].getDirectURL());
    }
  }, [vehicle.images]);

  const approxCost = settings 
    ? calculateApproxCost(Number(vehicle.priceInYuan), Number(vehicle.engineVolume), settings)
    : 0;

  // Enhanced prefetch: vehicle data + first 3 images on hover
  const handleMouseEnter = () => {
    prefetchVehicle(vehicle.id);
    
    // Prefetch thumbnail and next 2 images for faster gallery loading
    if (vehicle.images.length > 1) {
      const imagesToPrefetch = vehicle.images.slice(1, 3);
      imagesToPrefetch.forEach((image) => {
        const img = new Image();
        img.src = image.getDirectURL();
      });
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow group"
      onMouseEnter={handleMouseEnter}
    >
      <div onClick={onView} className="relative h-48 bg-muted overflow-hidden cursor-pointer">
        {imageUrl ? (
          <ProgressiveImage
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            priority={false}
            fallback={
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Загрузка...
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Нет фото
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary text-primary-foreground">{vehicle.year.toString()}</Badge>
        </div>
      </div>
      <CardContent className="pt-4 cursor-pointer" onClick={onView}>
        <h3 className="text-xl font-bold mb-2">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{vehicle.trim}</p>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{vehicle.year.toString()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Gauge className="h-4 w-4" />
            <span>{Number(vehicle.mileage).toLocaleString('ru-RU')} км</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Fuel className="h-4 w-4" />
            <span>{Number(vehicle.engineVolume)} cc</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Palette className="h-4 w-4" />
            <span>{vehicle.color}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Цена в юанях: ¥{formatPrice(vehicle.priceInYuan)}
          </div>
          <div className="text-2xl font-bold text-primary">{formatPrice(approxCost)} ₽</div>
          <div className="text-xs text-muted-foreground">примерная стоимость</div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onView} className="flex-1">
          Подробнее
        </Button>
        {onContact && (
          <Button onClick={(e) => { e.stopPropagation(); onContact(); }} variant="outline" size="icon">
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button onClick={(e) => { e.stopPropagation(); onEdit(); }} variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

