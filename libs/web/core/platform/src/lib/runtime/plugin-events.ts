import { Observable } from 'rxjs';

interface ListenerHandle {
  remove(): Promise<void>;
}

/**
 * Turns a Capacitor `addListener` call into a cold Observable.
 * The native listener is registered on subscribe and removed on unsubscribe.
 */
export function fromPluginEvent<TEvent>(
  addListener: (listener: (event: TEvent) => void) => Promise<ListenerHandle>,
): Observable<TEvent> {
  return new Observable<TEvent>((subscriber) => {
    const handle = addListener((event) => subscriber.next(event));

    return () => {
      void handle.then((listenerHandle) => listenerHandle.remove());
    };
  });
}
