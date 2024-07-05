import { Modal } from "@components/shared/Modal";
import {
  CreateOrder,
  CreateOrderService,
  Offer,
  SeatMap,
} from "@duffel/api/types";
import { getCurrencyForSeatMaps } from "@lib/getCurrencyForSeatMaps";
import { getPassengerBySegmentList } from "@lib/getPassengerBySegmentList";
import { getPassengerMapById } from "@lib/getPassengerMapById";
import { getPassengerName } from "@lib/getPassengerName";
import { getSegmentList } from "@lib/getSegmentList";
import { getServicePriceMapById } from "@lib/getServicePriceMapById";
import React from "react";
import { WithSeatServiceInformation } from "src/types";
import { SeatSelectionModalBody } from "./SeatSelectionModalBody";
import { SeatSelectionModalFooter } from "./SeatSelectionModalFooter";
import { SeatSelectionModalHeader } from "./SeatSelectionModalHeader";

export type CreateOrderServiceWithSeatInformation =
  WithSeatServiceInformation<CreateOrderService>;

export interface SeatSelectionStandaloneProps {
  isLoading: boolean
  offer?: Offer;
  seatMaps?: SeatMap[];
  selectedServices: CreateOrderServiceWithSeatInformation[];
  passengers: CreateOrder["passengers"];
  onComplete: (selectedServices: CreateOrderServiceWithSeatInformation[]) => void;
}

export const SeatSelectionStandalone: React.FC<SeatSelectionStandaloneProps> = ({
  isLoading,
  offer,
  passengers,
  seatMaps,
  selectedServices,
  onComplete,
}) => {
  if (isLoading) {
    return <div/>;
  }

  const [currentPermutationIndex, setCurrentPermutationIndex] =
    React.useState(0);

  const [selectedServicesState, setSelectedServicesState] =
    React.useState<CreateOrderServiceWithSeatInformation[]>(selectedServices);
  const selectedServicesStateMap = selectedServicesState.reduce(
    (all, service) => ({ ...all, [service.id]: service }),
    {} as Record<string, CreateOrderServiceWithSeatInformation>,
  );

  if (!offer || !seatMaps) return null;

  const segments = getSegmentList(offer);
  const passengerMapById = getPassengerMapById(passengers);
  const servicePricesMap = getServicePriceMapById(offer.available_services);
  const segmentAndPassengerPermutations = getPassengerBySegmentList(segments);
  const {
    passenger: { passenger_id: currentPassengerId },
    passengerIndex: currentPassengerIndex,
    segment: { id: currentSegmentId },
  } = segmentAndPassengerPermutations[currentPermutationIndex];

  const currentSegment = segments.find(({ id }) => id === currentSegmentId)!;
  const currentPassenger = passengerMapById[currentPassengerId];
  const currentSeatMap = seatMaps.find(
    (seatMap) => seatMap.segment_id === currentSegmentId,
  )!;

  const currentPassengerName = getPassengerName(
    currentPassenger,
    offer.passengers[currentPassengerIndex],
    currentPassengerIndex + 1,
  );

  const onSeatToggle = (
    seatServiceToToggle: CreateOrderServiceWithSeatInformation,
  ) => {
    let newSeatServices = new Array<CreateOrderServiceWithSeatInformation>();

    for (const selectedServiceFromState of selectedServicesState) {
      const hasClickedSeatToToggleOff =
        selectedServiceFromState.id === seatServiceToToggle.id &&
        seatServiceToToggle.quantity === 0;

      const isSelectedServiceFromStateForTheSameSegmentAndPassengerPermutation =
        selectedServiceFromState.serviceInformation?.segmentId ===
          currentSegmentId &&
        selectedServiceFromState.serviceInformation?.passengerId ===
          currentPassengerId;

      if (
        !hasClickedSeatToToggleOff &&
        !isSelectedServiceFromStateForTheSameSegmentAndPassengerPermutation
      ) {
        newSeatServices = [...newSeatServices, selectedServiceFromState];
      }
    }

    if (seatServiceToToggle.quantity > 0) {
      newSeatServices = [...newSeatServices, seatServiceToToggle];
    }

    setSelectedServicesState(newSeatServices);
  };

  const currencyToUse =
    getCurrencyForSeatMaps(seatMaps) ?? offer.total_currency;

  return (
    <div>
      <SeatSelectionModalHeader
        segmentAndPassengerPermutationsCount={
          segmentAndPassengerPermutations.length
        }
        currentSegment={currentSegment}
        currentPassengerName={currentPassengerName}
        currentSegmentAndPassengerPermutationsIndex={currentPermutationIndex}
        setCurrentSegmentAndPassengerPermutationsIndex={
          setCurrentPermutationIndex
        }
      />
      <SeatSelectionModalBody
        selectedServicesMap={selectedServicesStateMap}
        seatMap={currentSeatMap}
        onSeatToggled={onSeatToggle}
        currentPassengerId={currentPassengerId}
        currentPassengerName={currentPassengerName}
        currentSegmentId={currentSegmentId}
      />
      <SeatSelectionModalFooter
        seatMaps={seatMaps}
        currency={currencyToUse}
        selectedServices={selectedServicesState}
        servicePrices={servicePricesMap}
        isFirstSegment={currentPermutationIndex === 0}
        isLastSegment={
          currentPermutationIndex + 1 === segmentAndPassengerPermutations.length
        }
        onNextSegmentButtonClicked={() => {
          setCurrentPermutationIndex(currentPermutationIndex + 1);
        }}
        onPreviousSegmentButtonClicked={() => {
          setCurrentPermutationIndex(currentPermutationIndex - 1);
        }}
        onClose={() => onComplete(selectedServicesState)}
      />
    </div>
  );
};
