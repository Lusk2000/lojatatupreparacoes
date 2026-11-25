import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  APILoadingStatus,
  APIProvider,
  useApiLoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  GOOGLE_MAPS_SHARE_LINK,
  LOCATION_SEARCH_QUERY,
  STATIC_PLACE_DATA,
} from '../constants';
import { PlaceDetailsData, PlaceReviewData } from '../types';

interface GooglePlaceContextValue {
  place: PlaceDetailsData | null;
  isLoading: boolean;
  errorMessage: string | null;
  hasApiKey: boolean;
}

const MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

const MAPS_LIBRARIES: ('places' | 'marker')[] = ['places', 'marker'];

const isQuotaError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('OVER_QUERY_LIMIT') ||
    message.includes('429') ||
    message.toLowerCase().includes('quota')
  );
};

const GooglePlaceContext = createContext<GooglePlaceContextValue>({
  place: STATIC_PLACE_DATA,
  isLoading: false,
  errorMessage: null,
  hasApiKey: Boolean(MAPS_API_KEY),
});

export const useGooglePlace = (): GooglePlaceContextValue => useContext(GooglePlaceContext);

interface GooglePlaceFetcherProps {
  children: React.ReactNode;
}

const GooglePlaceFetcher: React.FC<GooglePlaceFetcherProps> = ({ children }) => {
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();
  const [place, setPlace] = useState<PlaceDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (
      apiStatus === APILoadingStatus.FAILED ||
      apiStatus === APILoadingStatus.AUTH_FAILURE
    ) {
      setErrorMessage('Não foi possível carregar os dados do Google Maps no momento.');
      setIsLoading(false);
    }
  }, [apiStatus]);

  useEffect(() => {
    if (!placesLib) return;

    let isCancelled = false;

    const loadPlace = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: LOCATION_SEARCH_QUERY,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'googleMapsURI',
            'regularOpeningHours',
            'rating',
            'userRatingCount',
            'reviews',
          ],
          language: 'pt-BR',
          region: 'BR',
          maxResultCount: 1,
        });

        if (isCancelled) return;

        const match = places?.[0];
        if (!match || !match.location) {
          setPlace(STATIC_PLACE_DATA);
          return;
        }

        const rawReviews = Array.isArray(match.reviews) ? match.reviews : [];
        const mappedReviews: PlaceReviewData[] = rawReviews
          .map((review) => {
            const text = (review.text || review.originalText || '').trim();
            return {
              authorName: review.authorAttribution?.displayName?.trim() || 'Cliente Google',
              authorPhotoUri: review.authorAttribution?.photoURI || null,
              authorUri: review.authorAttribution?.uri || null,
              rating: typeof review.rating === 'number' ? review.rating : null,
              relativeTime: review.relativePublishTimeDescription || '',
              text,
              publishTimeMs:
                review.publishTime instanceof Date ? review.publishTime.getTime() : null,
              googleMapsUri: review.googleMapsURI || null,
              flagContentUri: review.flagContentURI || null,
            };
          })
          .sort((a, b) => {
            const aHasText = a.text.length > 0 ? 1 : 0;
            const bHasText = b.text.length > 0 ? 1 : 0;
            if (aHasText !== bHasText) return bHasText - aHasText;
            return (b.publishTimeMs ?? 0) - (a.publishTimeMs ?? 0);
          });

        setPlace({
          id: match.id,
          displayName: match.displayName || 'Tatu Preparações',
          formattedAddress: match.formattedAddress || '',
          location: match.location.toJSON(),
          googleMapsUri: match.googleMapsURI || GOOGLE_MAPS_SHARE_LINK,
          rating: typeof match.rating === 'number' ? match.rating : null,
          userRatingCount:
            typeof match.userRatingCount === 'number' ? match.userRatingCount : null,
          weekdayDescriptions: match.regularOpeningHours?.weekdayDescriptions ?? [],
          reviews: mappedReviews,
        });
      } catch (err) {
        if (isCancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setPlace(STATIC_PLACE_DATA);
        setErrorMessage(
          'Não foi possível carregar os detalhes e avaliações do Google Maps agora.'
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPlace();
    return () => {
      isCancelled = true;
    };
  }, [placesLib]);

  return (
    <GooglePlaceContext.Provider
      value={{
        place,
        isLoading,
        errorMessage,
        hasApiKey: true,
      }}
    >
      {children}
    </GooglePlaceContext.Provider>
  );
};

export const GooglePlaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (!MAPS_API_KEY) {
    return (
      <GooglePlaceContext.Provider
        value={{
          place: STATIC_PLACE_DATA,
          isLoading: false,
          errorMessage: null,
          hasApiKey: false,
        }}
      >
        {children}
      </GooglePlaceContext.Provider>
    );
  }

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      libraries={MAPS_LIBRARIES}
      language="pt-BR"
      region="BR"
    >
      <GooglePlaceFetcher>{children}</GooglePlaceFetcher>
    </APIProvider>
  );
};
