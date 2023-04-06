import { compileCreateOrderPayload } from "@lib/compileCreateOrderPayload";
import { isPayloadComplete } from "@lib/isPayloadComplete";
import { retrieveOffer } from "@lib/retrieveOffer";
import * as React from "react";
import { Offer } from "src//types/Offer";
import { CreateOrderPayload } from "src/types/CreateOrderPayload";
import { BaggageSelectionProps } from "./BaggageSelection";
import { BaggageSelectionCard } from "./BaggageSelectionCard";
import { ErrorBoundary } from "./ErrorBoundary";
import { FetchOfferErrorState } from "./FetchOfferErrorState";
import { Inspect } from "./Inspect";
import { SeatSelectionCard } from "./SeatSelectionCard";

const baggage = "baggage" as const;
const seats = "seats" as const;

// this can be a setting we expose to the user later, right now we only have one feature anyway.
type Features = typeof baggage | typeof seats;
const selectedFeatures = new Set<Features>([baggage, seats]);

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const version = require("../../package.json").version;

const COMPONENT_CDN = location.href.match("http://localhost:6262/")
  ? "http://localhost:8000/styles/"
  : `https://storage.googleapis.com/duffel-assets/ancillaries-component/${version}`;

const hrefToComponentStyles = `${COMPONENT_CDN}/global.css`;

interface DuffelCheckoutStyles {
  accentColor: string;
  buttonCornerRadius: string;
  fontFamily: string;
}

export interface DuffelCheckoutProps {
  offer_id: Offer["id"];
  client_key: Offer["client_key"];
  passengers: CreateOrderPayload["passengers"];
  onPayloadReady: (data: CreateOrderPayload) => void;
  styles?: DuffelCheckoutStyles;
}

export const DuffelCheckout: React.FC<DuffelCheckoutProps> = ({
  offer_id,
  client_key,
  passengers,
  onPayloadReady,
  styles,
}) => {
  const [offer, setOffer] = React.useState<Offer>();
  const [error, setError] = React.useState<null | string>(null);
  const isLoading = !offer && !error;

  const [baggageSelectedServices, setBaggageSelectionState] = React.useState<
    BaggageSelectionProps["selectedServices"]
  >([]);
  const [seatSelectedServices, setSeatSelectionState] = React.useState<
    BaggageSelectionProps["selectedServices"]
  >([]);

  React.useEffect(() => {
    if (!offer_id || !client_key) return;
    retrieveOffer(offer_id, client_key, setOffer, setError);
  }, [offer_id, client_key]);

  React.useEffect(() => {
    if (!offer) return;

    const createOrderPayload = compileCreateOrderPayload({
      baggageSelectedServices,
      seatSelectedServices,
      offer,
      passengers,
    });

    if (isPayloadComplete(createOrderPayload)) {
      onPayloadReady(createOrderPayload);
    }
  }, [baggageSelectedServices, seatSelectedServices]);

  const nonIdealStateHeight = `${
    // 72 (card height) + 32 gap between cards
    72 * selectedFeatures.size + 32 * (selectedFeatures.size - 1)
  }px`;

  const duffelComponentsStyle = {
    ...(styles?.accentColor && {
      "--ACCENT": styles.accentColor,
    }),
    ...(styles?.fontFamily && { "--FONT-FAMILY": styles.fontFamily }),
    ...(styles?.buttonCornerRadius && {
      "--BUTTON-RADIUS": styles.buttonCornerRadius,
    }),
    // `as any` is needed here is needed because we want to set css variables
    // that are not part of the css properties type
  } as any;

  return (
    <>
      <link rel="stylesheet" href={hrefToComponentStyles}></link>

      <div className="duffel-components" style={duffelComponentsStyle}>
        <ErrorBoundary>
          {location.hash.includes("inspect-duffel-checkout") && (
            <Inspect
              data={{
                offer_id,
                client_key,
                passengers,
                baggageSelectedServices,
                offer,
                error,
              }}
            />
          )}

          {error && <FetchOfferErrorState height={nonIdealStateHeight} />}

          {selectedFeatures.has("baggage") && (
            <BaggageSelectionCard
              isLoading={isLoading}
              offer={offer}
              passengers={passengers}
              selectedServices={baggageSelectedServices}
              setSelectedServices={setBaggageSelectionState}
            />
          )}

          {selectedFeatures.has("seats") && (
            <SeatSelectionCard
              isLoading={isLoading}
              offer={offer}
              passengers={passengers}
              selectedServices={seatSelectedServices}
              setSelectedServices={setSeatSelectionState}
            />
          )}
        </ErrorBoundary>
      </div>
    </>
  );
};
