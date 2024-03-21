import { debounce } from "lodash";
import React from "react";
import {
  Place,
  getPlacesFromMapboxClient,
} from "./lib/getPlacesFromMapboxClient";

export interface MapboxPlacesLookupProps {
  mapboxPublicKey: string;
  onPlaceSelected: (selection: Place) => void;
  placeholder?: string;
  inputClassName?: string;
  popupClassName?: string;
  inputValue?: string;
}

export const MapboxPlacesLookup: React.FC<MapboxPlacesLookupProps> = ({
  mapboxPublicKey,
  onPlaceSelected,
  placeholder = "Look up city or airport",
  inputClassName,
  popupClassName,
  inputValue: inputValueProp = "",
}) => {
  const [shouldShowPopover, setShouldShowPopover] =
    React.useState<boolean>(true);
  const [inputValue, setInputValue] = React.useState<string>(inputValueProp);
  const [lookupResults, setLookupResults] = React.useState<Place[]>([]);

  const getPlacesFromMapbox = getPlacesFromMapboxClient(mapboxPublicKey);

  const runLookup = debounce(async (newInputValue: string) => {
    setLookupResults(await getPlacesFromMapbox(newInputValue));
  }, 300);

  return (
    <div className="places-lookup">
      <input
        className={inputClassName}
        placeholder={placeholder}
        type="text"
        value={inputValue}
        onChange={(e) => {
          if (!shouldShowPopover) setShouldShowPopover(true);
          setInputValue(e.target.value);
          runLookup(e.target.value);
        }}
      />
      {shouldShowPopover &&
        inputValue.length > 0 &&
        lookupResults.length > 0 && (
          <div className={popupClassName}>
            {lookupResults.map((place) => (
              <button
                className="places-lookup-popover__item"
                key={place.shortName}
                onClick={() => {
                  setShouldShowPopover(false);
                  onPlaceSelected(place);
                  setInputValue(place.name);
                }}
              >
                <span className="places-lookup-popover__icon-and-name-container">
                  {place.name}
                </span>
              </button>
            ))}
          </div>
        )}
    </div>
  );
};
