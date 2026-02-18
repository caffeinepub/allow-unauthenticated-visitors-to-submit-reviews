import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2 } from 'lucide-react';
import { useSubmitReview } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';

interface ReviewFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReviewFormModal({ open, onOpenChange }: ReviewFormModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  const submitReview = useSubmitReview();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert('Максимум 5 изображений');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !city.trim() || !comment.trim()) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (images.length > 5) {
      alert('Максимум 5 изображений');
      return;
    }

    try {
      const externalBlobs: ExternalBlob[] = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, [i]: percentage }));
        });
        externalBlobs.push(blob);
      }

      await submitReview.mutateAsync({
        name: name.trim(),
        city: city.trim(),
        comment: comment.trim(),
        images: externalBlobs,
      });

      // Reset form
      setName('');
      setCity('');
      setComment('');
      setImages([]);
      setImagePreviews([]);
      setUploadProgress({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Оставить отзыв</DialogTitle>
          <DialogDescription>
            Поделитесь своим опытом покупки автомобиля
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
            />
          </div>

          <div>
            <Label htmlFor="city">Город *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ваш город"
              required
            />
          </div>

          <div>
            <Label htmlFor="comment">Отзыв *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте..."
              rows={5}
              required
            />
          </div>

          <div>
            <Label>Фотографии (до 5 шт.)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Нажмите для загрузки</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={images.length >= 5}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={submitReview.isPending}>
              {submitReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Отправить отзыв
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
