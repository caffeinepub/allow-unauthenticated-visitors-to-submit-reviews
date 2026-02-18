import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useSubmitContactForm } from '../hooks/useQueries';

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactFormModal({ open, onOpenChange }: ContactFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const submitContactForm = useSubmitContactForm();

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await submitContactForm.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        comment: comment.trim(),
      });

      // Reset form
      setName('');
      setPhone('');
      setComment('');
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setComment('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Связаться с нами</DialogTitle>
          <DialogDescription>
            Заполните форму, и мы свяжемся с вами в ближайшее время
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Имя <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="Ваше имя"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Телефон <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              placeholder="+7 (___) ___-__-__"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ваш комментарий или вопрос"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={submitContactForm.isPending} className="flex-1">
              {submitContactForm.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
