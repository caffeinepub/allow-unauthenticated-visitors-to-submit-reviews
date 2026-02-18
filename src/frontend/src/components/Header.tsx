import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useIsCallerAdmin, useGetCurrencyAndCostSettings, useSetCurrencyAndCostSettings } from '../hooks/useQueries';
import { Menu, X, Edit2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContactRequestsTab from './ContactRequestsTab';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: settings } = useGetCurrencyAndCostSettings();
  const setSettingsMutation = useSetCurrencyAndCostSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [yuanRate, setYuanRate] = useState('');
  const [euroRate, setEuroRate] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [selectionServiceCost, setSelectionServiceCost] = useState('');
  const [epTsCost, setEpTsCost] = useState('');
  const navigate = useNavigate();
  const routerState = useRouterState();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const currentPath = routerState.location.pathname;
  const isMainPage = currentPath === '/';

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setYuanRate(settings.yuanRate.toString());
      setEuroRate(settings.euroRate.toString());
      setDeliveryCost(settings.deliveryCost.toString());
      setSelectionServiceCost(settings.selectionServiceCost.toString());
      setEpTsCost(settings.epTsCost.toString());
    }
  }, [settings]);

  // Secret keyboard shortcut: Ctrl + Alt + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        setShowLoginModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      setShowLoginModal(false);
    } else {
      try {
        await login();
        setShowLoginModal(false);
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleSaveSettings = async () => {
    const yuan = parseFloat(yuanRate);
    const euro = parseFloat(euroRate);
    const delivery = parseFloat(deliveryCost);
    const selectionService = parseFloat(selectionServiceCost);
    const epTs = parseFloat(epTsCost);

    if (isNaN(yuan) || isNaN(euro) || yuan < 0 || euro < 0) {
      return;
    }

    if (isNaN(delivery) || isNaN(selectionService) || isNaN(epTs) || delivery < 0 || selectionService < 0 || epTs < 0) {
      return;
    }

    await setSettingsMutation.mutateAsync({ 
      yuanRate: yuan, 
      euroRate: euro, 
      deliveryCost: delivery, 
      selectionServiceCost: selectionService, 
      epTsCost: epTs 
    });
    setShowSettingsModal(false);
  };

  const scrollToSection = (sectionId: string) => {
    if (!isMainPage) {
      navigate({ to: '/' });
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleCatalogClick = () => {
    navigate({ to: '/catalog' });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Currency Rates */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/' })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl font-bold text-primary">AVTOMIR</span>
              </button>
              
              {/* Currency Rates Display */}
              {settings && (
                <div className="hidden lg:flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground">Юань:</span>
                    <span className="font-semibold">{settings.yuanRate.toFixed(2)}₽</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground">Евро:</span>
                    <span className="font-semibold">{settings.euroRate.toFixed(2)}₽</span>
                  </div>
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowSettingsModal(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => setShowSettingsModal(true)}
                      >
                        <FileText className="h-4 w-4" />
                        Заявки
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" onClick={handleCatalogClick}>
                Каталог авто
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('reviews')}>
                Отзывы
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('contacts')}>
                Контакты
              </Button>
            </nav>

            {/* Admin Badge (only visible when logged in as admin) */}
            <div className="hidden md:flex items-center gap-3">
              {isAdmin && (
                <Badge variant="destructive" className="px-3 py-1">
                  Админ
                </Badge>
              )}
              {/* Invisible login trigger area */}
              <div
                onClick={() => setShowLoginModal(true)}
                className="w-4 h-4 cursor-default opacity-0 hover:opacity-0"
                aria-hidden="true"
              />
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t">
              {/* Currency Rates on Mobile */}
              {settings && (
                <div className="flex flex-col gap-2 pb-3 border-b">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">Юань:</span>
                    <span className="text-sm font-semibold">{settings.yuanRate.toFixed(2)}₽</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">Евро:</span>
                    <span className="text-sm font-semibold">{settings.euroRate.toFixed(2)}₽</span>
                  </div>
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Изменить настройки
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Заявки
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              <Button variant="ghost" className="w-full justify-start" onClick={handleCatalogClick}>
                Каталог авто
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => scrollToSection('reviews')}>
                Отзывы
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => scrollToSection('contacts')}>
                Контакты
              </Button>
              {isAdmin && (
                <div className="pt-3 border-t flex items-center gap-3">
                  <Badge variant="destructive" className="px-3 py-1">
                    Админ
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hidden Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-background rounded-lg p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Вход администратора</h2>
            <p className="text-muted-foreground mb-6">
              {isAuthenticated ? 'Вы вошли в систему' : 'Войдите с помощью Internet Identity'}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleAuth} disabled={disabled} variant={isAuthenticated ? 'outline' : 'default'} className="flex-1">
                {disabled ? 'Вход...' : isAuthenticated ? 'Выйти' : 'Войти'}
              </Button>
              <Button onClick={() => setShowLoginModal(false)} variant="ghost">
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal with Tabs (Currency Rates + Cost Settings + Requests) */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Панель администратора</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="requests">Заявки</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-6 py-4">
              {/* Currency Rates Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Курсы валют</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yuan-rate">Курс юаня (₽)</Label>
                    <Input
                      id="yuan-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={yuanRate}
                      onChange={(e) => setYuanRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="euro-rate">Курс евро (₽)</Label>
                    <Input
                      id="euro-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={euroRate}
                      onChange={(e) => setEuroRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cost Settings Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Настройки стоимости</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-cost">Стоимость доставки (₽)</Label>
                    <Input
                      id="delivery-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selection-service-cost">Стоимость услуги подбора (₽)</Label>
                    <Input
                      id="selection-service-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={selectionServiceCost}
                      onChange={(e) => setSelectionServiceCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-ts-cost">Стоимость ЭПТС/СБКТС (₽)</Label>
                    <Input
                      id="ep-ts-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={epTsCost}
                      onChange={(e) => setEpTsCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={setSettingsMutation.isPending}
                >
                  {setSettingsMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="requests" className="py-4">
              <ContactRequestsTab />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

