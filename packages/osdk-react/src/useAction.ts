import type { ActionDefinition, ActionEditResponse } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";
import { ActionParameters, OntologyObservation } from "./ontology";
import { useMutation, UseMutationResult, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { updateObjectQueries } from "./useObject";
import { updateObjectsQueries } from "./useObjects";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAction<T extends ActionDefinition<any>>(
    type: T,
    mutationOpts?: Omit<
        UseMutationOptions<OntologyObservation, Error, ActionParameters<T>>,
        "mutationFn" | "mutationKey"
    >
): UseMutationResult<OntologyObservation, Error, ActionParameters<T>> {
    const { client } = useOsdkContext();
    const queryClient = useQueryClient();
    return useMutation({
        ...mutationOpts,
        mutationFn: async (parameters) => {
            // Not sure why we need this cast and such here.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const result = (await client(type).applyAction(parameters, {
                $returnEdits: true,
            })) as ActionEditResponse;
            const createdObjectsReferences = result.addedObjects ?? [];
            const modifiedObjectsReferences = result.modifiedObjects ?? [];
            // Wish there were a better way to get heterogenous lists of objects in OSDK...
            const createdObjectsPromise = Promise.all(
                createdObjectsReferences.map((reference) =>
                    client({ type: "object", apiName: reference.objectType }).fetchOne(reference.primaryKey)
                )
            );
            const modifiedObjectsPromise = Promise.all(
                modifiedObjectsReferences.map((reference) =>
                    client({ type: "object", apiName: reference.objectType }).fetchOne(reference.primaryKey)
                )
            );
            const [createdObjects, modifiedObjects] = await Promise.all([
                createdObjectsPromise,
                modifiedObjectsPromise,
            ]);
            return {
                knownObjects: [...createdObjects, ...modifiedObjects],
                deletedObjects: result.deletedObjects ?? [],
            };
        },
        onSuccess: (data) => {
            updateObjectQueries(queryClient, data);
            updateObjectsQueries(queryClient, data);
        },
    });
}
