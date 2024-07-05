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
        onPayloadReady={(data, metadata) => {
          this.dispatchEvent(
            new CustomEvent("onPayloadReady", {
              detail: { data, metadata },
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

function tryToGetDuffelSeatSelectionCustomElement(
  caller: string,
): DuffelSeatSelectionCustomElement {
  const element =
    document.querySelector<DuffelSeatSelectionCustomElement>(CUSTOM_ELEMENT_TAG);
  if (!element) {
    throw new Error(
      `Could not find duffel-seating element in the DOM. Maybe you need to call ${caller} after 'window.onload'?`,
    );
  }
  return element;
}

export function renderDuffelSeatSelectionCustomElement(
  props: DuffelSeatSelectionStandaloneCustomElementRenderArguments,
) {
  const element = tryToGetDuffelSeatSelectionCustomElement(
    "renderDuffelSeatSelectionCustomElement",
  );
  element.render(props);
}

type OnPayloadReadyCustomEvent = CustomEvent<{
  data: CreateOrder;
  metadata: OnPayloadReadyMetadata;
}>;

export function onDuffelSeatSelectionPayloadReady(
  onPayloadReady: OnPayloadReady,
) {
  const element = tryToGetDuffelSeatSelectionCustomElement(
    "onDuffelSeatSelectionPayloadReady",
  );
  const eventListener = (event: OnPayloadReadyCustomEvent) => {
    onPayloadReady(event.detail.data, event.detail.metadata);
  };

  // using `as EventListener` here because typescript doesn't know the event type for `onPayloadReady`
  // There's a few different suggestions to resolve this seemed good enough
  // You can learn more here: https://github.com/microsoft/TypeScript/issues/28357
  element.addEventListener("onPayloadReady", eventListener as EventListener);
}
