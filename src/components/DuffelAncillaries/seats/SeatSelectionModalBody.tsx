import { ModalBody } from "@components/shared/Modal";
import React from "react";
import { SeatMap, SeatMapProps } from "./SeatMap";

export interface SeatSelectionModalBodyProps extends SeatMapProps {
  expandFlex?: boolean
}

export const SeatSelectionModalBody: React.FC<SeatSelectionModalBodyProps> = (
  props,
) => (
  <ModalBody expandFlex={props.expandFlex}>
    <SeatMap {...props} />
  </ModalBody>
);
