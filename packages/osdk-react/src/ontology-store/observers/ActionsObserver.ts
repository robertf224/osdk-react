import { ActionDefinition, ActionEditResponse } from "@osdk/api";
import { Client } from "@osdk/client";
import { OntologyObservation } from "../OntologyObservation";
import { ActionParameters } from "../ActionParameters";

export class ActionsObserver {
    #client: Client;
    #broadcastObservation: (observation: OntologyObservation) => void;

    constructor(client: Client, broadcastObservation: (observation: OntologyObservation) => void) {
        this.#client = client;
        this.#broadcastObservation = broadcastObservation;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyAction = async <T extends ActionDefinition<any>>(
        type: T,
        parameters: ActionParameters<T>,
        opts?: {
            onCompleted?: () => void;
            onError?: (error: Error) => void;
        }
    ) => {
        try {
            // Not sure why we need this cast and such here.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const result = (await this.#client(type).applyAction(parameters, {
                $returnEdits: true,
            })) as ActionEditResponse;
            const knownObjectReferences = [...(result.addedObjects ?? []), ...(result.modifiedObjects ?? [])];
            // TODO: upstream a better way to get heterogenous lists of objects in OSDK
            const knownObjects = await Promise.all(
                knownObjectReferences.map((reference) =>
                    this.#client({ type: "object", apiName: reference.objectType }).fetchOne(
                        reference.primaryKey
                    )
                )
            );
            this.#broadcastObservation({
                knownObjects,
                // TODO: actually return these references once we get upstream in API Gateway
                deletedObjects: [],
            });
            opts?.onCompleted?.();
        } catch (error) {
            opts?.onError?.(error as Error);
        }
    };
}
