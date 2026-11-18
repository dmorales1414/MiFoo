import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '../components/BottomNavBar';
import { ItemRow } from '../components/ItemRow';
import { ItemFilterSheet } from '../components/items/ItemFilterSheet';
import { RemoveItemsSheet } from '../components/items/RemoveItemsSheet';
import { RemoveSelectedButton } from '../components/RemoveSelectedButton';
import { SegmentedTabs } from '../components/SegmentedTabs';
import {
  applyItemFilters,
  classificationsIn,
  DEFAULT_ITEM_FILTERS,
  itemFiltersActive,
  type ItemFilters,
} from '../features/items/filters';
import { LOCATION_TABS, type LocationFilter } from '../features/items/locations';
import { useItems, type RemoveEntry } from '../hooks/useItems';
import { useReminderSync } from '../hooks/useReminderSync';
import { styles } from '../styles/pantryScreen.styles';
import { colors, layout, spacing } from '../styles/theme';
import type { Item } from '../types/item';

// The Pantry tab (Figma: "Pantry Screen"): everything you have stored, most urgent first.
// Search by name or kind of food, filter by place, and use the blue settings button to
// filter, sort, or select items to remove.
export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const { items, loaded, usingSample, offlineReason, refresh, removeAmounts } = useItems();
  useReminderSync(items, loaded, usingSample);

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState<LocationFilter>('all');
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_ITEM_FILTERS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // "Select items to remove" mode.
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reload every time the tab is shown (an item may have been added, edited or removed).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const visible = useMemo(
    () => applyItemFilters(items, location, search, filters),
    [items, location, search, filters],
  );
  const kinds = useMemo(() => classificationsIn(items), [items]);
  const selectedItems = useMemo(() => items.filter((i) => selectedIds.includes(i.id)), [items, selectedIds]);

  const navBottom = insets.bottom + layout.navBarBottomGap;
  const controlsBottom = navBottom + layout.navBarHeight + spacing.md; // the remove bar sits above the nav
  const hasFilters = itemFiltersActive(filters) || search.trim().length > 0 || location !== 'all';

  const stopSelecting = () => {
    setSelecting(false);
    setSelectedIds([]);
  };

  const handlePress = (item: Item) => {
    if (selecting) {
      setSelectedIds((current) =>
        current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
      );
      return;
    }
    router.push({ pathname: '/item/[id]', params: { id: item.id } });
  };

  const handleConfirmRemove = async (entries: RemoveEntry[]) => {
    setRemoving(true);
    const failed = await removeAmounts(entries);
    setRemoving(false);
    setRemoveOpen(false);
    stopSelecting();
    if (failed > 0) {
      Alert.alert(
        "Some items couldn't be removed",
        `${failed} of ${entries.length} could not be updated. Pull down to refresh and try again.`,
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const empty = !loaded ? (
    <View style={styles.emptyBox}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : items.length === 0 ? (
    <View style={styles.emptyBox}>
      <Ionicons name="basket-outline" size={40} color={colors.textPlaceholder} />
      <Text style={styles.emptyTitle}>Your pantry is empty</Text>
      <Text style={styles.emptyText}>Tap the + button and choose "Add an Item" to scan or enter your first food.</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>No items match</Text>
      <Text style={styles.emptyText}>
        {hasFilters ? 'Try a different search, place or filter.' : 'Nothing to show.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onPress={handlePress}
            selectable={selecting}
            selected={selectedIds.includes(item.id)}
          />
        )}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: controlsBottom + layout.fabSize + spacing.xl },
        ]}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.sm }}>
            <Text style={styles.title} accessibilityRole="header">
              Pantry
            </Text>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search Food"
                  placeholderTextColor={colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search food"
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={18} color={colors.textPlaceholder} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                style={styles.settingsButton}
                onPress={() => setSettingsOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Pantry settings: filter, sort and remove items"
              >
                <Ionicons name="options-outline" size={22} color={colors.primary} />
                {itemFiltersActive(filters) ? <View style={styles.settingsDot} /> : null}
              </Pressable>
            </View>

            <SegmentedTabs options={LOCATION_TABS} value={location} onChange={setLocation} />

            {selecting ? (
              <View style={styles.selectBanner}>
                <Text style={styles.selectText}>Tap the items you want to remove.</Text>
                <Pressable onPress={stopSelecting} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.selectCancel}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}

            {offlineReason ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  {usingSample ? "Can't reach the server, so you're seeing sample data. " : 'Showing your last loaded items. '}
                  {offlineReason}
                </Text>
              </View>
            ) : null}

            {loaded && items.length > 0 ? (
              <Text style={styles.count}>
                {visible.length} {visible.length === 1 ? 'item' : 'items'}
              </Text>
            ) : null}
          </View>
        }
      />

      {selecting && (
        <RemoveSelectedButton
          bottomOffset={controlsBottom}
          count={selectedIds.length}
          onPress={() => setRemoveOpen(true)}
        />
      )}

      <BottomNavBar activeTab="pantry" bottomOffset={navBottom} showCreateButton={!selecting} />

      <ItemFilterSheet
        visible={settingsOpen}
        filters={filters}
        classifications={kinds}
        onChange={setFilters}
        onSelectToRemove={() => {
          setSelectedIds([]);
          setSelecting(true);
        }}
        onClose={() => setSettingsOpen(false)}
      />
      <RemoveItemsSheet
        visible={removeOpen}
        items={selectedItems}
        busy={removing}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleConfirmRemove}
      />
    </View>
  );
}
