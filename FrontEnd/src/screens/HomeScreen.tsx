import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '../components/BottomNavBar';
import { ItemSection } from '../components/ItemSection';
import { RecommendedMealCarousel } from '../components/RecommendedMealCarousel';
import { RemoveSelectedButton } from '../components/RemoveSelectedButton';
import { useAuth } from '../features/auth/AuthContext';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { syncExpiryReminders } from '../services/notifications';
import { styles } from '../styles/homeScreen.styles';
import { layout, spacing } from '../styles/theme';
import type { ItemCategory, Meal } from '../types/item';

// The Home screen. It owns all the state and passes it down to the components:
//   Frame 1 (default)      -> nothing open, nothing selected
//   Frame 2 (add menu)     -> the + button in the nav bar (components/CreateMenuFab.tsx)
//   Frame 3 (manage mode)  -> managingCategory is set and some items are selected
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Items come from the FastAPI backend (falls back to sample data if it is unreachable).
  const { items, loaded, usingSample, offlineReason, refresh, removeItems } = useItems();
  const { me } = useAuth();
  // Reload every time Home is shown, so an item added on the add-item screens appears.
  // Meals for the carousel: best suggestion first (uses food that is about to expire).
  const { recipes, refresh: refreshRecipes } = useRecipes();
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshRecipes();
    }, [refresh, refreshRecipes]),
  );

  // Keep the expiration reminders in step with what is stored. Runs after every load, add
  // and remove (the list changes), and when the Push Notifications switch changes.
  // Skipped for sample data, and until the profile has loaded (it holds the switch).
  const pushEnabled = me?.pushNotificationsEnabled;
  useEffect(() => {
    if (!loaded || usingSample || pushEnabled === undefined) return;
    syncExpiryReminders(items, pushEnabled);
  }, [items, loaded, usingSample, pushEnabled]);

  const carouselMeals: Meal[] = recipes.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    image: r.imageUrl ? { uri: r.imageUrl } : undefined,
    note: r.usesExpiringSoon.length > 0
      ? `Uses ${r.usesExpiringSoon.slice(0, 2).join(', ')}`
      : r.canMakeNow
        ? 'Ready to cook'
        : undefined,
  }));

  // Which section is in manage mode (null = none). Only one at a time, like the mockup.
  const [managingCategory, setManagingCategory] = useState<ItemCategory | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const packagedItems = items.filter((item) => item.category === 'packaged');
  const produceItems = items.filter((item) => item.category === 'produce');

  // Heights that keep the floating controls above the system gesture bar.
  const navBottom = insets.bottom + layout.navBarBottomGap;
  const controlsBottom = navBottom + layout.navBarHeight + spacing.md; // the remove button sits above the nav
  const scrollBottomPadding = controlsBottom + layout.fabSize + spacing.xl;

  const handleToggleManage = (category: ItemCategory) => {
    setSelectedIds([]);
    // Pressing "Done" on the section that is already managed exits manage mode.
    setManagingCategory((current) => (current === category ? null : category));
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const handleRemoveSelected = () => {
    removeItems(selectedIds);
    setSelectedIds([]);
    setManagingCategory(null);
  };

  const isManaging = managingCategory !== null;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: scrollBottomPadding,
        }}
      >
        <RecommendedMealCarousel
          meals={carouselMeals}
          onPressMeal={(id) => router.push({ pathname: '/recipe/[id]', params: { id } })}
          emptyText="Add a meal to get recommendations"
          onPressEmpty={() => router.push('/recipe/new')}
        />

        {offlineReason && (
          <View style={[styles.offlineBanner, { marginTop: spacing.lg }]}>
            <Text style={styles.offlineText}>
              Can't reach the server, so you're seeing sample data. {offlineReason}
            </Text>
          </View>
        )}

        <View style={styles.sections}>
          <ItemSection
            title="Food Items"
            items={packagedItems}
            isManaging={managingCategory === 'packaged'}
            selectedIds={selectedIds}
            onToggleManage={() => handleToggleManage('packaged')}
            onToggleItem={handleToggleItem}
          />
          <ItemSection
            title="Produce Items"
            items={produceItems}
            isManaging={managingCategory === 'produce'}
            selectedIds={selectedIds}
            onToggleManage={() => handleToggleManage('produce')}
            onToggleItem={handleToggleItem}
          />
        </View>
      </ScrollView>

      {/* Frame 3: while removing items the + button hides and the red remove bar appears. */}
      {isManaging && (
        <RemoveSelectedButton
          bottomOffset={controlsBottom}
          count={selectedIds.length}
          onPress={handleRemoveSelected}
        />
      )}

      <BottomNavBar activeTab="home" bottomOffset={navBottom} showCreateButton={!isManaging} />
    </View>
  );
}
