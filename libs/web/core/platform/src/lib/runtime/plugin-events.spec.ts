import { fromPluginEvent } from './plugin-events';

describe('fromPluginEvent', () => {
  it('registers the listener on subscribe and removes it on unsubscribe', async () => {
    // Arrange
    const remove = vi.fn(async () => undefined);
    let emit: ((event: number) => void) | undefined;
    const addListener = vi.fn(async (listener: (event: number) => void) => {
      emit = listener;
      return { remove };
    });
    const received: number[] = [];

    // Act
    const subscription = fromPluginEvent(addListener).subscribe((event) =>
      received.push(event),
    );
    emit?.(1);
    emit?.(2);
    subscription.unsubscribe();
    await Promise.resolve();

    // Assert
    expect(addListener).toHaveBeenCalledOnce();
    expect(received).toEqual([1, 2]);
    expect(remove).toHaveBeenCalledOnce();
  });

  it('does not touch the plugin until someone subscribes', () => {
    // Arrange
    const addListener = vi.fn(async () => ({ remove: async () => undefined }));

    // Act
    fromPluginEvent(addListener);

    // Assert
    expect(addListener).not.toHaveBeenCalled();
  });
});
