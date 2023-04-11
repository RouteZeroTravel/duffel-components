import { moneyStringFormatter } from "@lib/formatConvertedCurrency";
import { getTotalAmountForServices } from "@lib/getTotalAmountForServices";
import { getTotalQuantity } from "@lib/getTotalQuantity";
import { hasService } from "@lib/hasService";
import { withPlural } from "@lib/withPlural";
import React from "react";
import {
  CreateOrderPayload,
  CreateOrderPayloadServices,
} from "src/types/CreateOrderPayload";
import { Offer } from "src/types/Offer";
import { AnimatedLoaderEllipsis } from "./AnimatedLoaderEllipsis";
import { Card } from "./Card";
import { SeatSelectionModal } from "./SeatSelectionModal";
import { Stamp } from "./Stamp";

export interface SeatSelectionCardProps {
  isLoading: boolean;
  offer?: Offer;
  passengers: CreateOrderPayload["passengers"];
  selectedServices: CreateOrderPayloadServices;
  setSelectedServices: (selectedServices: CreateOrderPayloadServices) => void;
}

export const SeatSelectionCard: React.FC<SeatSelectionCardProps> = ({
  isLoading,
  offer,
  passengers,
  selectedServices,
  setSelectedServices,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const containsSeatService = hasService(offer, "seats");
  const totalQuantity = getTotalQuantity(selectedServices);
  const areSeatsAdded = totalQuantity > 0;

  const totalAmount = getTotalAmountForServices(offer!, selectedServices);
  const totalAmountFormatted = offer
    ? moneyStringFormatter(offer?.base_currency)(totalAmount)
    : "0";

  const copy =
    containsSeatService && areSeatsAdded
      ? `${withPlural(
          totalQuantity,
          "seat",
          "seats"
        )} selected for ${totalAmountFormatted}`
      : "Specify where on the plane you’d like to sit";

  return (
    <>
      <Card
        title="Seat selection"
        copy={copy}
        icon="flight_class"
        onClick={containsSeatService ? () => setIsOpen(true) : null}
        isLoading={isLoading}
        disabled={!isLoading && !containsSeatService}
        isSelected={areSeatsAdded}
      >
        {isLoading && (
          <Stamp color="var(--GREY-900)" backgroundColor="var(--GREY-100)">
            Loading
            <AnimatedLoaderEllipsis />
          </Stamp>
        )}
        {!isLoading && !containsSeatService && (
          <Stamp color="var(--GREY-700)" backgroundColor="var(--GREY-200)">
            Not available
          </Stamp>
        )}
      </Card>

      {isOpen && offer && (
        <SeatSelectionModal
          offer={offer}
          passengers={passengers}
          onClose={(newSelectedServices) => {
            setSelectedServices(newSelectedServices);
            setIsOpen(false);
          }}
          selectedServices={selectedServices}
        />
      )}
    </>
  );
};