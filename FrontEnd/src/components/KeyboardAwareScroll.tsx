import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  type KeyboardEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// A ScrollView that keeps the text box you are typing in visible above the keyboard.
//
// Why this exists: React Native's KeyboardAvoidingView does nothing on Android unless you give
// it behavior="padding", and then it pushes the WHOLE screen up. This does it per field:
//   1. while the keyboard is open, extra space is added at the bottom so everything can scroll up
//   2. whenever the focused text box would sit behind the keyboard, the list scrolls just enough
//
// Use it instead of <ScrollView> on any screen that has text boxes. Props are the same.
const MARGIN_ABOVE_KEYBOARD = 24; // breathing room between the text box and the keyboard
const POLL_MS = 200; // how often to notice that focus moved to another text box

export const KeyboardAwareScroll = forwardRef<ScrollView, ScrollViewProps>(function KeyboardAwareScroll(
  { contentContainerStyle, onScroll, onContentSizeChange, children, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null); // screen y where the keyboard starts (null = closed)
  const lastFocused = useRef<unknown>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const setRefs = useCallback(
    (node: ScrollView | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  // Scroll so the focused text box ends above the keyboard (only if it is currently hidden).
  const revealFocused = useCallback(() => {
    const top = keyboardTop.current;
    const input = TextInput.State.currentlyFocusedInput?.();
    if (top === null || !input || !innerRef.current) return;
    input.measureInWindow((_x, y, _w, height) => {
      const overlap = y + height + MARGIN_ABOVE_KEYBOARD - top;
      if (overlap > 0) innerRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
    });
  }, []);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
      // Wait one moment so the extra bottom space exists before scrolling into it.
      setTimeout(revealFocused, 60);
    };
    const onHide = () => {
      keyboardTop.current = null;
      lastFocused.current = null;
      setKeyboardHeight(0);
    };
    const subs = [
      Keyboard.addListener('keyboardDidShow', onShow),
      Keyboard.addListener('keyboardDidChangeFrame', (e) => {
        if (keyboardTop.current !== null) onShow(e);
      }),
      Keyboard.addListener('keyboardDidHide', onHide),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [revealFocused]);

  // Moving from one text box to the next while the keyboard stays open fires no keyboard event,
  // so check for a change of focus a few times a second (only while the keyboard is open).
  useEffect(() => {
    if (keyboardHeight === 0) return;
    const timer = setInterval(() => {
      const focused = TextInput.State.currentlyFocusedInput?.() ?? null;
      if (focused && focused !== lastFocused.current) {
        lastFocused.current = focused;
        revealFocused();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [keyboardHeight, revealFocused]);

  // Add the keyboard's height on top of whatever bottom padding the screen already has.
  const base = StyleSheet.flatten(contentContainerStyle) ?? {};
  const basePadding = Number(base.paddingBottom ?? base.paddingVertical ?? base.padding ?? 0) || 0;
  const padded: StyleProp<ViewStyle> = [base, { paddingBottom: basePadding + keyboardHeight }];

  return (
    <ScrollView
      ref={setRefs}
      keyboardShouldPersistTaps="handled"
      {...rest}
      contentContainerStyle={padded}
      scrollEventThrottle={16}
      onScroll={(e) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      }}
      // A multi-line box that grows while typing (the steps) changes the content size.
      onContentSizeChange={(w, h) => {
        onContentSizeChange?.(w, h);
        if (keyboardTop.current !== null) revealFocused();
      }}
    >
      {children}
    </ScrollView>
  );
});
