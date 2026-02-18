import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAddVehicle, useEditVehicle, useDeleteVehicle, useDuplicateVehicle, useGetCurrencyAndCostSettings } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Vehicle } from '../types';
import { Loader2, Upload, X, Copy, Trash2, Calculator } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { calculateApproxCost, formatPrice } from '../lib/priceCalculator';
import { Badge } from '@/components/ui/badge';

interface VehicleFormModalProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
}

export default function VehicleFormModal({ vehicle, onClose }: VehicleFormModalProps) {
  const isEditing = !!vehicle;
  const addVehicle = useAddVehicle();
  const editVehicle = useEditVehicle();
  const deleteVehicle = useDeleteVehicle();
  const duplicateVehicle = useDuplicateVehicle();
  const { data: settings } = useGetCurrencyAndCostSettings();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    trim: vehicle?.trim || '',
    year: vehicle?.year.toString() || '',
    color: vehicle?.color || '',
    mileage: vehicle?.mileage.toString() || '',
    horsepower: vehicle?.horsepower.toString() || '',
    engineVolume: vehicle?.engineVolume.toString() || '',
    priceInYuan: vehicle?.priceInYuan.toString() || '',
    description: vehicle?.description || '',
  });

  const [images, setImages] = useState<ExternalBlob[]>(vehicle?.images || []);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const urls = images.map((img) => img.getDirectURL());
    setImageUrls(urls);
  }, [images]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: ExternalBlob[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array);
        newImages.push(blob);
      }
      setImages([...images, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleData = {
      brand: formData.brand,
      model: formData.model,
      trim: formData.trim,
      year: BigInt(formData.year),
      color: formData.color,
      mileage: BigInt(formData.mileage),
      horsepower: BigInt(formData.horsepower),
      engineVolume: BigInt(formData.engineVolume),
      priceInYuan: BigInt(formData.priceInYuan),
      description: formData.description,
      images,
    };

    if (isEditing && vehicle) {
      await editVehicle.mutateAsync({ id: vehicle.id, ...vehicleData });
    } else {
      await addVehicle.mutateAsync(vehicleData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (vehicle) {
      await deleteVehicle.mutateAsync(vehicle.id);
      onClose();
    }
  };

  const handleDuplicate = async () => {
    if (vehicle) {
      await duplicateVehicle.mutateAsync(vehicle.id);
      onClose();
    }
  };

  const isPending = addVehicle.isPending || editVehicle.isPending || deleteVehicle.isPending || duplicateVehicle.isPending;

  // Calculate approximate cost in real-time
  const approxCost = settings && formData.priceInYuan && formData.engineVolume
    ? calculateApproxCost(Number(formData.priceInYuan), Number(formData.engineVolume), settings)
    : 0;

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <form onSubmit={handleSubmit} className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Марка *</Label>
                  <Input id="brand" name="brand" value={formData.brand} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Модель *</Label>
                  <Input id="model" name="model" value={formData.model} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trim">Комплектация *</Label>
                <Input id="trim" name="trim" value={formData.trim} onChange={handleInputChange} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Год *</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Цвет *</Label>
                  <Input id="color" name="color" value={formData.color} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Пробег (км) *</Label>
                  <Input
                    id="mileage"
                    name="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horsepower">Мощность (л.с.) *</Label>
                  <Input
                    id="horsepower"
                    name="horsepower"
                    type="number"
                    value={formData.horsepower}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="engineVolume">Объем двигателя (cc) *</Label>
                  <Input
                    id="engineVolume"
                    name="engineVolume"
                    type="number"
                    value={formData.engineVolume}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceInYuan">Цена в юанях (¥) *</Label>
                  <Input
                    id="priceInYuan"
                    name="priceInYuan"
                    type="number"
                    value={formData.priceInYuan}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Real-time Approximate Cost Calculator */}
              {approxCost > 0 && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calculator className="h-4 w-4" />
                    <span>Расчет примерной стоимости</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{formatPrice(approxCost)} ₽</span>
                    <Badge variant="outline" className="text-xs">примерная стоимость</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Включает: конвертацию юаней, комиссию 2.5%, доставку, услуги подбора, ЭПТС/СБКТС и таможенную пошлину
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Фотографии</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploading ? 'Загрузка...' : 'Нажмите для загрузки фото'}
                    </span>
                  </label>
                </div>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isPending}
                  className="sm:mr-auto"
                >
                  {duplicateVehicle.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Дублировать
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Автомобиль будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

