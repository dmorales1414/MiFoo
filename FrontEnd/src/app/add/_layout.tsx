import { Stack } from 'expo-router';

import { AddItemProvider } from '../../features/addItem/AddItemContext';

// Everything under /add shares one "draft item" (see features/addItem). The provider lives
// here, so the draft is created when the flow opens and discarded when it closes.
export default function AddItemLayout() {
  return (
    <AddItemProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </AddItemProvider>
  );
}
