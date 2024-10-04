import { ThreeDSecureSession, createClient } from "./client";
import { initEvervault } from "./initEvervault";
import { loadEvervaultScript } from "./loadEvervaultScript";

const DEFAULT_ENVIRONMENT_CONFIGURATION = {
  duffelUrl: "https://api.duffel.com",
  evervaultCredentials: {
    teamID: "team_a22f3ea22207",
    appID: "app_976f15bbdddd",
  },
};

type CreateThreeDSecureSessionFn = (
  clientKey: string,
  cardId: string,
  resourceId: string,
  services: Array<{ id: string; quantity: number }>,
  cardholderPresent: boolean,
  environmentConfiguration?: Partial<typeof DEFAULT_ENVIRONMENT_CONFIGURATION>,
) => Promise<ThreeDSecureSession>;

declare global {
  interface Window {
    createThreeDSecureSession: CreateThreeDSecureSessionFn;
  }
}

const GENERIC_ERROR_MESSAGE = "Failed to create 3DS session";

export const createThreeDSecureSession: CreateThreeDSecureSessionFn = async (
  clientKey,
  cardId,
  resourceId,
  services,
  cardholderPresent,
  environmentConfiguration = {},
) => {
  const env: typeof DEFAULT_ENVIRONMENT_CONFIGURATION = {
    ...DEFAULT_ENVIRONMENT_CONFIGURATION,
    ...environmentConfiguration,
  };

  // We want to load the Evervault script
  // onto the page as soon as this file is loaded.
  await loadEvervaultScript();

  return new Promise((resolve, reject) => {
    const client = createClient(env.duffelUrl, clientKey);

    client
      .create3DSSessionInDuffelAPI({
        card_id: cardId,
        resource_id: resourceId,
        services: services,
        cardholder_present: cardholderPresent,
      })
      .then((threeDSSession) => {
        if (!threeDSSession) {
          reject(new Error(GENERIC_ERROR_MESSAGE));
          return;
        }

        if (threeDSSession.status === "ready_for_payment") {
          resolve(threeDSSession);
          return;
        }

        if (threeDSSession.external_id === null) {
          reject(new Error(GENERIC_ERROR_MESSAGE));
          return;
        }

        const threeDSecure = initEvervault(
          threeDSSession.external_id,
          env.evervaultCredentials.teamID,
          env.evervaultCredentials.appID,
        );

        threeDSecure.on("failure", () => {
          client
            .refresh3DSSessionInDuffelAPI(threeDSSession.id)
            .then(reject)
            .catch(reject);
        });

        threeDSecure.on("error", () => {
          client
            .refresh3DSSessionInDuffelAPI(threeDSSession.id)
            .then(() => {
              reject(new Error(GENERIC_ERROR_MESSAGE));
            })
            .catch(() => {
              reject(new Error(GENERIC_ERROR_MESSAGE));
            });
        });

        threeDSecure.on("success", () => {
          client
            .refresh3DSSessionInDuffelAPI(threeDSSession.id)
            .then(resolve)
            .catch((error) => {
              reject(error);
            });
        });
      })
      .catch(reject);
  });
};

export default { createThreeDSecureSession };
