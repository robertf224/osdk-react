import { ActionDefinition, ActionEditResponse, ObjectTypeDefinition, Osdk } from "@osdk/api";
import { Client } from "@osdk/client";
import { ObjectReference, OntologyObservation } from "../OntologyObservation";
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
            onCompleted?: (edits: {
                createdObjects: Osdk.Instance<ObjectTypeDefinition>[];
                modifiedObjects: Osdk.Instance<ObjectTypeDefinition>[];
                deletedObjects: ObjectReference[];
            }) => void;
            onError?: (error: Error) => void;
        }
    ) => {
        try {
            // Not sure why we need this cast and such here.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const result = (await this.#client(type).applyAction(parameters, {
                $returnEdits: true,
            })) as ActionEditResponse;
            const createdObjectsReferences = result.addedObjects ?? [];
            const modifiedObjectsReferences = result.modifiedObjects ?? [];
            // TODO: upstream a better way to get heterogenous lists of objects in OSDK
            const createdObjectsPromise = Promise.all(
                createdObjectsReferences.map((reference) =>
                    this.#client({ type: "object", apiName: reference.objectType }).fetchOne(
                        reference.primaryKey
                    )
                )
            );
            const modifiedObjectsPromise = Promise.all(
                modifiedObjectsReferences.map((reference) =>
                    this.#client({ type: "object", apiName: reference.objectType }).fetchOne(
                        reference.primaryKey
                    )
                )
            );
            const [createdObjects, modifiedObjects] = await Promise.all([
                createdObjectsPromise,
                modifiedObjectsPromise,
            ]);
            // TODO: actually return these references once we get upstream in API Gateway
            const deletedObjects: ObjectReference[] = [];
            this.#broadcastObservation({
                knownObjects: [...createdObjects, ...modifiedObjects],
                deletedObjects,
            });
            opts?.onCompleted?.({
                createdObjects,
                modifiedObjects,
                deletedObjects,
            });
        } catch (error) {
            opts?.onError?.(error as Error);
        }
    };
}
