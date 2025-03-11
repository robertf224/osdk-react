import { AsyncValue } from "../utils";

export type PromiseObserverSnapshot<T> = AsyncValue<{
    data: T;
}>;

export class PromiseObserver<T> {
    #run: () => Promise<T>;

    #subscribers: Set<() => void>;
    #state: PromiseObserverSnapshot<T> | undefined;

    constructor(run: () => Promise<T>) {
        this.#run = run;
        this.#subscribers = new Set();
    }

    subscribe = (callback: () => void) => {
        this.#subscribers.add(callback);
        return () => this.#subscribers.delete(callback);
    };

    #notifySubscribers = () => {
        this.#subscribers.forEach((callback) => callback());
    };

    getSnapshot = (): PromiseObserverSnapshot<T> | undefined => {
        return this.#state;
    };

    refresh = async () => {
        const promise = this.#run();
        this.#state = { type: "loading", promise };
        const loadingState = this.#state;

        this.#notifySubscribers();

        try {
            const data = await promise;
            if (loadingState !== this.#state) {
                return;
            }

            this.#state = {
                type: "loaded",
                value: {
                    data,
                },
            };

            this.#notifySubscribers();
        } catch (error) {
            this.#state = { type: "error", error: error as Error };
            this.#notifySubscribers();
        }
    };
}
