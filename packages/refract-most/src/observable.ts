import { from, Stream, Subscriber as Listener } from 'most'

export { Listener }

export interface ObservableComponent {
    observe: <T>(propName: string) => Stream<T>
    mount: Stream<any>
    unmount: Stream<any>
}

export interface Subscription {
    unsubscribe(): void
}

export type EffectFactory<P, E> = (
    props: P
) => (component: ObservableComponent) => Stream<E>

export const subscribeToSink = <T>(
    sink: Stream<T>,
    next: (val: T) => void,
    error?: (error: any) => void
): Subscription =>
    sink.subscribe({
        next,
        error,
        complete: () => void 0
    })

export const createObservable = <T>(subscribe): Stream<T> => {
    const observable = {
        subscribe(listener: Listener<T>) {
            const unsubscribe = subscribe(listener)

            return { unsubscribe }
        }
    }

    return from(observable)
}