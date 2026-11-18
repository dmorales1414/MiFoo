import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '../components/BottomNavBar';
import { ItemRow } from '../components/ItemRow';
import { RecommendedMealCarousel } from '../components/RecommendedMealCarousel';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { applyItemFilters, DEFAULT_ITEM_FILTERS } from '../features/items/filters';
import { LOCATION_TABS, type LocationFilter } from '../features/items/locations';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { useReminderSync } from '../hooks/useReminderSync';
import { styles } from '../styles/homeScreen.styles';
import { colors, layout, spacing } from '../styles/theme';
import type { Item, Meal } from '../types/item';
import { getItemDisplay } from '../utils/expiry';

// How many items Home shows before pointing to the Pantry tab for the full list.
const HOME_ITEM_LIMIT = 6;

// The Home screen (Figma: "Home Screen v2"): recommended meals on top, then what needs to be
// used first, filtered by where it is kept. The whole list lives in the Pantry tab.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Items come from the FastAPI backend (falls back to sample data if it is unreachable).
  const { items, loaded, usingSample, offlineReason, refresh } = useItems();
  // Meals for the carousel: best suggestion first (uses food that is about to expire).
  const { recipes, refresh: refreshRecipes } = useRecipes();
  // Reload every time Home is shown, so an item added, edited or removed elsewhere shows up.
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshRecipes();
    }, [refresh, refreshRecipes]),
  );
  useReminderSync(items, loaded, usingSample);

  const carouselMeals: Meal[] = recipes.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    image: r.imageUrl ? { uri: r.imageUrl } : undefined,
    note:
      r.usesExpiringSoon.length > 0
        ? `Uses ${r.usesExpiringSoon.slice(0, 2).join(', ')}`
        : r.canMakeNow
          ? 'Ready to cook'
          : undefined,
  }));

  const [location, setLocation] = useState<LocationFilter>('all');

  // Everything in the chosen place, most urgent first.
  const inLocation = useMemo(
    () => applyItemFilters(items, location, '', DEFAULT_ITEM_FILTERS),
    [items, location],
  );
  const shown = inLocation.slice(0, HOME_ITEM_LIMIT);
  const hiddenCount = inLocation.length - shown.length;

  // The bell gets a red dot when something is Urgent or Use soon.
  const needsAttention = useMemo(
    () =>
      items.some((item) => {
        const { status } = getItemDisplay(item);
        return status === 'urgent' || status === 'useSoon';
      }),
    [items],
  );

  const navBottom = insets.bottom + layout.navBarBottomGap;
  const scrollBottomPadding = navBottom + layout.navBarHeight + layout.fabSize + spacing.xl;

  const openItem = (item: Item) => router.push({ pathname: '/item/[id]', params: { id: item.id } });

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: scrollBottomPadding,
        }}
      >
        <View style={styles.topRow}>
          <Pressable
            style={styles.bell}
            onPress={() => router.replace('/pantry')}
            accessibilityRole="button"
            accessibilityLabel={needsAttention ? 'Some items need attention. Open the Pantry' : 'Open the Pantry'}
          >
            <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
            {needsAttention ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        <RecommendedMealCarousel
          meals={carouselMeals}
          onPressMeal={(id) => router.push({ pathname: '/recipe/[id]', params: { id } })}
          emptyText="Add a meal to get recommendations"
          onPressEmpty={() => router.push('/recipe/new')}
        />

        {offlineReason && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              Can't reach the server, so you're seeing sample data. {offlineReason}
            </Text>
          </View>
        )}

        <View style={styles.tabsWrap}>
          <SegmentedTabs options={LOCATION_TABS} value={location} onChange={setLocation} />
        </View>

        <View style={styles.list}>
          {!loaded ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : shown.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="basket-outline" size={40} color={colors.textPlaceholder} />
              <Text style={styles.emptyTitle}>{items.length === 0 ? 'Nothing stored yet' : 'Nothing here'}</Text>
              <Text style={styles.emptyText}>
                {items.length === 0
                  ? 'Tap the + button and choose "Add an Item" to scan or enter your first food.'
                  : 'No items are stored in this place yet.'}
              </Text>
            </View>
          ) : (
            shown.map((item) => <ItemRow key={item.id} item={item} onPress={openItem} />)
          )}

          {hiddenCount > 0 ? (
            <Pressable
              style={styles.seeAll}
              onPress={() => router.replace('/pantry')}
              accessibilityRole="link"
            >
              <Text style={styles.seeAllText}>
                See all {inLocation.length} items in Pantry
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" bottomOffset={navBottom} />
    </View>
  );
}
