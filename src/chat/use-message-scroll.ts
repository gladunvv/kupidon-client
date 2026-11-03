import { useLayoutEffect, useRef } from 'react';

export function useMessageScroll(dialogId: string, ready: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const position = useRef<{
    dialogId: string;
    atBottom: boolean;
    anchorId?: string;
    offset?: number;
  }>({ dialogId, atBottom: true });

  function rememberPosition() {
    const container = containerRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    const anchor = Array.from(
      container.querySelectorAll<HTMLElement>('[data-message-id]'),
    ).find((element) => element.getBoundingClientRect().bottom > top);
    position.current = {
      dialogId,
      atBottom:
        container.scrollHeight - container.clientHeight - container.scrollTop <
        48,
      anchorId: anchor?.dataset.messageId,
      offset: anchor ? anchor.getBoundingClientRect().top - top : undefined,
    };
  }

  // Keep the visible message fixed when older rows or loading states appear.
  // Following the bottom is reserved for opening the chat and reading its tail.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return;
    const saved = position.current;
    if (saved.dialogId !== dialogId || saved.atBottom) {
      container.scrollTop = container.scrollHeight;
    } else if (saved.anchorId) {
      const anchor = Array.from(
        container.querySelectorAll<HTMLElement>('[data-message-id]'),
      ).find((element) => element.dataset.messageId === saved.anchorId);
      if (anchor) {
        container.scrollTop +=
          anchor.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          (saved.offset ?? 0);
      }
    }
    rememberPosition();
  });

  function followBottom() {
    position.current.atBottom = true;
  }

  return { containerRef, rememberPosition, followBottom };
}
