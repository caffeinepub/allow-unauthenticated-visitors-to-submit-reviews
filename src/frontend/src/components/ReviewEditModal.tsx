import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2 } from 'lucide-react';
import { useEditReview } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Review } from '../types';

interface ReviewEditModalProps {
  review: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReviewEditModal({ review, open, onOpenChange }: ReviewEditModalProps) {
  const [name, setName] = useState(review.name);
  const [city, setCity] = useState(review.city);
  const [comment, setComment] = useState(review.comment);
  const [existingImages, setExistingImages] = useState<ExternalBlob[]>(review.images);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  const editReview = useEditReview();

  useEffect(() => {
    setName(review.name);
    setCity(review.city);
    setComment(review.comment);
    setExistingImages(review.images);
  }, [review]);

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      alert('Максимум 5 изображений');
      return;
    }

    setNewImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !city.trim() || !comment.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const allImages: ExternalBlob[] = [...existingImages];

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, [i]: percentage }));
        });
        allImages.push(blob);
      }

      await editReview.mutateAsync({
        id: review.id,
        name: name.trim(),
        city: city.trim(),
        comment: comment.trim(),
        images: allImages,
      });

      setNewImages([]);
      setNewImagePreviews([]);
      setUploadProgress({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error editing review:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать отзыв</DialogTitle>
          <DialogDescription>
            Измените информацию об отзыве
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              required
            />
          </div>

          <div>
            <Label htmlFor="city">Город *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Город"
              required
            />
          </div>

          <div>
            <Label htmlFor="comment">Отзыв *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Текст отзыва..."
              rows={5}
              required
            />
          </div>

          <div>
            <Label>Фотографии (до 5 шт.)</Label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-2">
                {existingImages.map((img, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={img.getDirectURL()}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Images */}
            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-sm">{uploadProgress[index]}%</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {existingImages.length + newImages.length < 5 && (
              <div className="mt-4">
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Добавить фото</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={editReview.isPending}>
              {editReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить изменения
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

