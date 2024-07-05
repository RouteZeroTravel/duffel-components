import { SeatSelectionStandalone } from "@components/DuffelAncillaries/seats/SeatSelectionStandalone";
import { ErrorBoundary } from "@components/shared/ErrorBoundary";
import { FetchOfferErrorState } from "@components/shared/FetchOfferErrorState";
import { WithComponentStyles } from "@components/shared/WithComponentStyles";
import {
  CreateOrder,
  CreateOrderService,
  Offer,
  SeatMap,
} from "@duffel/api/types";
import { compileCreateOrderPayload } from "@lib/compileCreateOrderPayload";
import { createPriceFormatters } from "@lib/createPriceFormatters";
import { formatAvailableServices } from "@lib/formatAvailableServices";
import { formatSeatMaps } from "@lib/formatSeatMaps";
import { hasHighLuminance } from "@lib/hasHighLuminance";
import { isPayloadComplete } from "@lib/isPayloadComplete";
import { initializeLogger, logGroup } from "@lib/logging";
import { offerIsExpired } from "@lib/offerIsExpired";
import { retrieveOffer } from "@lib/retrieveOffer";
import * as Sentry from "@sentry/browser";
import * as React from "react";
import {
  CustomStyles,
  DuffelAncillariesMarkup,
  DuffelAncillariesPriceFormatters,
  OnPayloadReady,
  WithBaggageServiceInformation,
  WithSeatServiceInformation,
  WithServiceInformation
} from "../../types/DuffelAncillariesProps";
import { retrieveSeatMaps } from "@lib/retrieveSeatMaps";

export interface DuffelSeatSelectionProps {
  offer_id: string;
  client_key: string;
  styles?: CustomStyles;
  onPayloadReady: OnPayloadReady;
  passengers: CreateOrder["passengers"];
  markup?: DuffelAncillariesMarkup;
  priceFormatters?: DuffelAncillariesPriceFormatters;
  debug?: boolean;
}

export const DuffelSeatSelection: React.FC<DuffelSeatSelectionProps> = (props) => {
  initializeLogger(props.debug || false);

  logGroup("Properties passed into the component:", props);

  const [passengers, _setPassengers] = React.useState<CreateOrder["passengers"]>(
    props.passengers,
  );

  const [offer, setOffer] = React.useState<Offer | undefined>(
    (props as any).offer,
  );

  const [isOfferLoading, setIsOfferLoading] = React.useState(true);

  const [seatMaps, setSeatMaps] = React.useState<SeatMap[] | undefined>(undefined);

  const [isSeatMapLoading, setIsSeatMapLoading] = React.useState(true);

  const [error, setError] = React.useState<null | string>(null);

  const [baggageSelectedServices, _setBaggageSelectedServices] = React.useState<
    WithBaggageServiceInformation<CreateOrderService>[]
  >([]);
  const [seatSelectedServices, setSeatSelectedServices] = React.useState<
    WithSeatServiceInformation<CreateOrderService>[]
  >([]);
  const [cfarSelectedServices, _setCfarSelectedServices] = React.useState<
    WithServiceInformation<CreateOrderService>[]
  >([]);

  const priceFormatters = createPriceFormatters(
    props.markup,
    props.priceFormatters,
  );

  const updateOffer = (offer: Offer) => {
    const expiryErrorMessage = "This offer has expired.";
    if (offerIsExpired(offer)) {
      setError(expiryErrorMessage);
      return;
    } else {
      const msUntilExpiry = new Date(offer?.expires_at)?.getTime() - Date.now();

      // Only show the expiry error message if the offer expires in less than a day,
      // to prevent buffer overflows when showing offers for fixtures, which expire in
      // years.
      const milisecondsInOneDay = 1000 * 60 * 60 * 24;
      if (msUntilExpiry < milisecondsInOneDay) {
        setTimeout(() => setError(expiryErrorMessage), msUntilExpiry);
      }
    }

    const offerWithFormattedServices = formatAvailableServices(
      offer,
      priceFormatters,
    );
    setOffer(offerWithFormattedServices);
  };

  const updateSeatMaps = (seatMaps: SeatMap[]) => {
    const formattedSeatMaps = formatSeatMaps(seatMaps, priceFormatters.seats);
    setSeatMaps(formattedSeatMaps);
  };

  React.useEffect(() => {
    // whenever the props change, we'll set the sentry context to thse values
    // so that we can see them in the sentry logs and better support the users of the component library
    Sentry.setContext("props", {
      "props.passengers.length": (props as any).passengers.length,
      "props.offer_id": (props as any).offer_id,
      "props.client_key": (props as any).client_key,
      "props.offer?.id": (props as any).offer?.id,
      "props.seat_maps?.[0]?.id": (props as any).seat_maps?.[0]?.id,
    });

    retrieveOffer(
      props.offer_id,
      props.client_key,
      setError,
      setIsOfferLoading,
      (offer) => {
        updateOffer(offer);

        if (offer.passengers.length !== passengers.length) {
          throw new Error(
            `The number of passengers given to \`duffel-ancillaries\` (${props.passengers.length}) doesn't match ` +
              `the number of passengers on the given offer (${offer.passengers.length}).`,
          );
        }
      },
    );

    retrieveSeatMaps(
      props.offer_id,
      props.client_key,
      () => updateSeatMaps([]),
      setIsSeatMapLoading,
      updateSeatMaps,
    );
  }, [
    // `as any` is needed here because the list
    // of dependencies is different for each combination of props.
    // To satisfy typescript, we'd need to conditionally assign
    // the dependencies to the hook after checking its type,
    // however that is not possible in a react hook.
    (props as any).offer_id,
    (props as any).client_key,
    (props as any).offer?.id,
    (props as any).seat_maps?.[0]?.id,
  ]);

  React.useEffect(() => {
    if (!offer) return;

    const createOrderPayload = compileCreateOrderPayload({
      baggageSelectedServices,
      seatSelectedServices,
      cfarSelectedServices,
      offer,
      passengers,
      seatMaps,
    });

    if (isPayloadComplete(createOrderPayload)) {
      const metadata = {
        offer_total_amount: offer.total_amount,
        offer_total_currency: offer.total_currency,
        offer_tax_amount: offer.tax_amount,
        offer_tax_currency: offer.tax_currency,
        baggage_services: baggageSelectedServices,
        seat_services: seatSelectedServices,
        cancel_for_any_reason_services: cfarSelectedServices,
      };

      logGroup("Payload ready", {
        "Order creation payload": createOrderPayload,
        "Services metadata": metadata,
      });

      props.onPayloadReady(createOrderPayload, metadata);
    }
  }, [baggageSelectedServices, seatSelectedServices, cfarSelectedServices]);

  // There's only one service - seating.
  const serviceCount = 1;
  const nonIdealStateHeight = `${
    // 72 (card height) + 32 gap between cards
    72 * serviceCount + 32 * (serviceCount - 1)
  }px`;

  const duffelComponentsStyle = {
    // Adding inline styles here to avoid the cards jumping down
    // before the css is loaded duet to the missing "row gap".
    display: "flex",
    width: "100%",
    flexDirection: "column",
    rowGap: "12px",
    ...(props.styles?.accentColor && {
      "--ACCENT": props.styles.accentColor,
    }),
    ...(props.styles?.accentColor &&
      hasHighLuminance(props.styles.accentColor) && {
        "--SECONDARY": "var(--GREY-900)",
        "--TERTIARY": "var(--GREY-400)",
      }),
    ...(props.styles?.fontFamily && {
      "--FONT-FAMILY": props.styles.fontFamily,
    }),
    ...(props.styles?.buttonCornerRadius && {
      "--BUTTON-RADIUS": props.styles.buttonCornerRadius,
    }),
    // `as any` is needed here is needed because we want to set css variables
    // that are not part of the css properties type
  } as any;

  const state = {
    isOfferLoading,
    isSeatMapLoading,
    baggageSelectedServices,
    seatSelectedServices,
    cfarSelectedServices,
    offer,
    seatMaps,
    error,
  };

  logGroup("Component's internal state:", state);

  return (
    <WithComponentStyles>
      <div style={duffelComponentsStyle}>
        <ErrorBoundary>
          {error && (
            <FetchOfferErrorState
              height={nonIdealStateHeight}
              message={error}
            />
          )}

          {!error &&
            <SeatSelectionStandalone
              key="seats"
              isLoading={isOfferLoading || isSeatMapLoading}
              seatMaps={seatMaps}
              offer={offer}
              passengers={passengers}
              selectedServices={seatSelectedServices}
              onComplete={setSeatSelectedServices}
            />
          }
        </ErrorBoundary>
      </div>
    </WithComponentStyles>
  );
};
