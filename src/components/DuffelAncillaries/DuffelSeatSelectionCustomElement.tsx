import { DuffelSeatSelection, DuffelSeatSelectionProps } from "@components/DuffelAncillaries/DuffelSeatSelection";
import { CreateOrder } from "@duffel/api/types";
import { createRoot, Root } from "react-dom/client";
import {
  OnPayloadReady,
  OnPayloadReadyMetadata
} from "../../types/DuffelAncillariesProps";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "duffel-seating": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

const CUSTOM_ELEMENT_TAG = "duffel-seating";

type DuffelSeatSelectionStandaloneCustomElementRenderArguments =
  Omit<DuffelSeatSelectionProps, "onPayloadReady">

class DuffelSeatSelectionCustomElement extends HTMLElement {
  /**
   * The React root for displaying content inside a browser DOM element.
   */
  private root!: Root;

  /**
   * `connectedCallback` is called to initialise the custom element
   */
  connectedCallback() {
    const container = document.createElement("div");
    this.attachShadow({ mode: "open" }).appendChild(container);

    this.root = createRoot(container);
  }

  /**
   * When this function is called, it will render/re-render
   * the `DuffelSeatSelection` component with the given props.
   */
  public render(withProps: DuffelSeatSelectionStandaloneCustomElementRenderArguments) {
    if (!this.root) {
      throw "It was not possible to render `duffel-seating` because `this.root` is missing.";
    }

    this.root.render(
      <DuffelSeatSelection
        {...withProps}
        onLoaded={() => {
          this.dispatchEvent(
            new CustomEvent("onLoaded", {
              // Propagate from shadow dom to standard dom
              composed: true,
            }),
          );
        }}
        onPayloadReady={(data, metadata) => {
          this.dispatchEvent(
            new CustomEvent("onPayloadReady", {
              detail: { data, metadata },
              // Propagate from shadow dom to standard dom
              composed: true,
            }),
          );
        }}
      />,
    );
  }
}

window.customElements.get(CUSTOM_ELEMENT_TAG) ||
  window.customElements.define(
    CUSTOM_ELEMENT_TAG,
    DuffelSeatSelectionCustomElement,
  );
