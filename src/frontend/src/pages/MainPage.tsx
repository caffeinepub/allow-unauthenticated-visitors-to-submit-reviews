import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, MapPin, MessageSquare, Phone, Edit } from 'lucide-react';
import { SiTelegram, SiVk } from 'react-icons/si';
import { useGetAllReviews, useIsCallerAdmin } from '../hooks/useQueries';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Review } from '../types';
import ProgressiveImage from '../components/ProgressiveImage';

// Lazy load modals for code splitting
const ReviewFormModal = lazy(() => import('../components/ReviewFormModal'));
const ReviewEditModal = lazy(() => import('../components/ReviewEditModal'));
const ContactFormModal = lazy(() => import('../components/ContactFormModal'));
const ImageLightbox = lazy(() => import('../components/ImageLightbox'));

export default function MainPage() {
  const { data: reviews = [], isLoading: reviewsLoading } = useGetAllReviews();
  const { data: isAdmin } = useIsCallerAdmin();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewImageUrls, setReviewImageUrls] = useState<string[][]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadReviewImages = async () => {
      const urls = await Promise.all(
        reviews.map(async (review) => {
          return review.images.map((img) => img.getDirectURL());
        })
      );
      setReviewImageUrls(urls);
    };

    if (reviews.length > 0) {
      loadReviewImages();
    }
  }, [reviews]);

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleCatalogClick = () => {
    navigate({ to: '/catalog' });
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="w-full">
      {/* Hero Section with progressive loading background image */}
      <section className="relative w-full h-[600px] flex items-center justify-center text-white overflow-hidden">
        {/* Background Image - Full width and centered */}
        <div className="absolute inset-0 w-full h-full">
          <ProgressiveImage
            src="/assets/picture_23684205555849c49829c2ca05bd646c-1.png"
            alt="Автомобили из Китая"
            className="w-full h-full object-cover object-center"
            priority={true}
          />
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
        
        {/* Content - Perfectly centered */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow">
            Автомобили из Китая — доставка по всей России
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleCatalogClick} className="text-lg px-8 py-6">
              Перейти в каталог
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setIsContactModalOpen(true)} 
              className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 text-white border-white"
            >
              Связаться с нами
            </Button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">О нас</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Мы специализируемся на доставке качественных автомобилей из Китая. Наша команда обеспечит полное сопровождение сделки от выбора автомобиля до его доставки в ваш город.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Широкий выбор</h3>
                <p className="text-muted-foreground">Большой ассортимент автомобилей на любой вкус</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Доставка по России</h3>
                <p className="text-muted-foreground">Доставим автомобиль в любой город России</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Надежные поставщики</h3>
                <p className="text-muted-foreground">Работаем только с проверенными партнерами</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Быстрое оформление</h3>
                <p className="text-muted-foreground">Минимум времени на документы и растаможку</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Section with progressive loading images */}
      <section id="reviews" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Отзывы клиентов</h2>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-6">Пока нет отзывов. Будьте первым!</p>
              <Button onClick={() => setIsReviewModalOpen(true)} size="lg">
                <MessageSquare className="h-5 w-5 mr-2" />
                Оставить отзыв
              </Button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Card className="p-8">
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{reviews[currentReviewIndex].name}</h3>
                        <p className="text-muted-foreground">{reviews[currentReviewIndex].city}</p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingReview(reviews[currentReviewIndex])}
                          className="ml-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-lg leading-relaxed">{reviews[currentReviewIndex].comment}</p>
                    {reviewImageUrls[currentReviewIndex] && reviewImageUrls[currentReviewIndex].length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        {reviewImageUrls[currentReviewIndex].map((url, idx) => (
                          <ProgressiveImage
                            key={idx}
                            src={url}
                            alt={`Review ${idx + 1}`}
                            className="w-full h-24 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(reviewImageUrls[currentReviewIndex], idx)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {reviews.length > 1 && (
                  <>
                    <button
                      onClick={prevReview}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-background border rounded-full p-3 hover:bg-muted transition-colors shadow-lg"
                      aria-label="Предыдущий отзыв"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextReview}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-background border rounded-full p-3 hover:bg-muted transition-colors shadow-lg"
                      aria-label="Следующий отзыв"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {reviews.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {reviews.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentReviewIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentReviewIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                      }`}
                      aria-label={`Перейти к отзыву ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="text-center mt-8">
                <Button onClick={() => setIsReviewModalOpen(true)} size="lg">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Оставить отзыв
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contacts Section */}
      <section id="contacts" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Контакты</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Адрес</h3>
                      <p className="text-muted-foreground">Республика Хакасия, г. Абакан, ул. Щетинкина, д. 71</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Телефон</h3>
                      <a href="tel:+79233782222" className="text-muted-foreground hover:text-primary transition-colors">
                        +7 923 378 22 22
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <SiTelegram className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Telegram</h3>
                      <a href="https://t.me/avtomircars" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        @avtomircars
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <SiVk className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">VK</h3>
                      <a href="https://vk.com/avtomircars" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        avtomircars
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=91.43760681152345%2C53.71840%2C91.44759318847656%2C53.72340&layer=mapnik&marker=53.7209%2C91.4426"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Карта местоположения AVTOMIR"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lazy loaded modals */}
      {isReviewModalOpen && (
        <Suspense fallback={null}>
          <ReviewFormModal open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen} />
        </Suspense>
      )}
      
      {isContactModalOpen && (
        <Suspense fallback={null}>
          <ContactFormModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
        </Suspense>
      )}
      
      {editingReview && (
        <Suspense fallback={null}>
          <ReviewEditModal
            review={editingReview}
            open={!!editingReview}
            onOpenChange={(open) => !open && setEditingReview(null)}
          />
        </Suspense>
      )}
      
      {lightboxOpen && (
        <Suspense fallback={null}>
          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxInitialIndex}
            onClose={() => setLightboxOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

