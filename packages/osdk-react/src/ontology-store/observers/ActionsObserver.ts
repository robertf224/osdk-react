import { ActionDefinition } from "@osdk/api";
import { Client } from "@osdk/client";
import { ObjectReference, OntologyObservation } from "../OntologyObservation";

export class ActionsObserver {
    #client: Client;
    #broadcastObservation: (observation: OntologyObservation) => void;

    constructor(client: Client, broadcastObservation: (observation: OntologyObservation) => void) {
        this.#client = client;
        this.#broadcastObservation = broadcastObservation;
    }

    applyAction = async <T extends ActionDefinition>(
        type: T,
        parameters: Record<string, unknown>,
        opts?: {
            onCompleted?: () => void;
            onError?: (error: Error) => void;
        }
    ) => {
        try {
            // TODO: export Action parameters type from OSDK so this can be correct and strongly typed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await this.#client(type).applyAction(parameters as any, { $returnEdits: true });
            // TODO: upstream a better way to get heterogenous lists of objects in OSDK
            const fetchObjectsFromReferences = (references: ObjectReference[]) =>
                Promise.all(
                    references.map((reference) =>
                        this.#client({ type: "object", apiName: reference.objectType }).fetchOne(
                            reference.primaryKey
                        )
                    )
                );
            const createdObjectsPromise = fetchObjectsFromReferences(result.addedObjects ?? []);
            const modifiedObjectsPromise = fetchObjectsFromReferences(result.modifiedObjects ?? []);
            const [createdObjects, modifiedObjects] = await Promise.all([
                createdObjectsPromise,
                modifiedObjectsPromise,
            ]);
            this.#broadcastObservation({
                createdOrModifiedObjects: [...createdObjects, ...modifiedObjects],
                // TODO: actually return these references once we get upstream in API Gateway
                deletedObjects: [],
            });
            opts?.onCompleted?.();
        } catch (error) {
            opts?.onError?.(error as Error);
        }
    };
}
