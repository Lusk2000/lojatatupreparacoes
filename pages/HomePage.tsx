import React, { useRef, useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import ProductModal from '../components/ProductModal';
import { Product } from '../types';

const ProductSection = lazy(() => import('../components/ProductSection'));
const CategorySection = lazy(() => import('../components/CategorySection'));
const HowItWorksSection = lazy(() => import('../components/HowItWorksSection'));
const FaqSection = lazy(() => import('../components/FaqSection'));
const LocationSection = lazy(() => import('../components/LocationSection'));
const ReviewsSection = lazy(() => import('../components/ReviewsSection'));
const ContactSection = lazy(() => import('../components/ContactSection'));
const GooglePlaceProvider = lazy(() =>
  import('../components/GooglePlaceProvider').then((m) => ({
    default: m.GooglePlaceProvider,
  }))
);

const SectionLoader = () => (
  <div className="py-16 flex justify-center items-center bg-[#111111]">
    <div className="w-8 h-8 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin" />
  </div>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const productsRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToProducts = useCallback(() => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToHowItWorks = useCallback(() => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToFaq = useCallback(() => {
    faqRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToReviews = useCallback(() => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToContact = useCallback(() => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSearchShortcut = useCallback(() => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 350);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  return (
    <div id="top" className="bg-[#111111] text-[#FFFFFF] min-h-screen flex flex-col">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        onTopClick={scrollToTop}
        onProductsClick={scrollToProducts}
        onSearchClick={handleSearchShortcut}
        onHowItWorksClick={scrollToHowItWorks}
        onReviewsClick={scrollToReviews}
        onContactClick={scrollToContact}
        onAccountClick={() => navigate('/minha-conta')}
      />

      <main className="flex-grow">
        <Hero onCtaClick={scrollToProducts} />

        <div ref={productsRef}>
          <Suspense fallback={<SectionLoader />}>
            <ProductSection
              searchInputRef={searchInputRef}
              onSelectProduct={setSelectedProduct}
            />
          </Suspense>
        </div>

        <Suspense fallback={<SectionLoader />}>
          <CategorySection
            category="Bonés"
            title="Coleção"
            highlightedTitle="Tatu Trucker"
            description="Bonés exclusivos com frente firme, aba curva revestida e acabamento premium."
            bgColor="bg-[#161616]"
            onSelectProduct={setSelectedProduct}
          />

          <CategorySection
            category="Camisetas"
            title="Coleção"
            highlightedTitle="Camisetas Tatu"
            description="Vista a marca da potência. Camisetas oficiais com design exclusivo e alta qualidade."
            bgColor="bg-[#111111]"
            hasBorderTop={true}
            onSelectProduct={setSelectedProduct}
          />

          <CategorySection
            category="Kits Churrasco"
            title="Coleção"
            highlightedTitle="Kit Churrasco"
            description="Tradição e qualidade também no seu churrasco. Ferramentas premium para quem entende de carne."
            bgColor="bg-[#161616]"
            hasBorderTop={true}
            onSelectProduct={setSelectedProduct}
          />

          <div ref={howItWorksRef}>
            <HowItWorksSection />
          </div>

          <div ref={faqRef}>
            <FaqSection />
          </div>

          <GooglePlaceProvider>
            <LocationSection />

            <div ref={reviewsRef}>
              <ReviewsSection />
            </div>
          </GooglePlaceProvider>

          <div ref={contactRef}>
            <ContactSection />
          </div>
        </Suspense>
      </main>

      <Footer />

      <MobileBottomNav
        onTopClick={scrollToTop}
        onProductsClick={scrollToProducts}
        onFaqClick={scrollToFaq}
      />

      <ProductModal
        product={selectedProduct}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default HomePage;
