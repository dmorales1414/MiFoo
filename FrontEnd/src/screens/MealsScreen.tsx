import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '../components/BottomNavBar';
import { MealFilterSheet } from '../components/recipes/MealFilterSheet';
import { MealRow } from '../components/recipes/MealRow';
import { applyFilters, DEFAULT_FILTERS, filtersActive, type MealFilters } from '../features/recipes/filters';
import { useRecipes } from '../hooks/useRecipes';
import { styles } from '../styles/recipes/meals.styles';
import { colors, layout, spacing } from '../styles/theme';

// The Meals tab: every recipe you saved. Tap one to read it; the + button creates a new one.
export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, loaded, refreshing, error, refresh } = useRecipes();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MealFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // Reload every time the tab is shown (a meal may have been created, edited or cooked).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const visible = useMemo(() => applyFilters(recipes, search, filters), [recipes, search, filters]);
  const navBottom = insets.bottom + layout.navBarBottomGap;
  const hasFilters = filtersActive(filters) || search.trim().length > 0;

  const empty = !loaded ? (
    <View style={styles.emptyBox}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : recipes.length === 0 ? (
    <View style={styles.emptyBox}>
      <Ionicons name="restaurant-outline" size={40} color={colors.textPlaceholder} />
      <Text style={styles.emptyTitle}>No meals yet</Text>
      <Text style={styles.emptyText}>Tap the + button and choose "Add a Meal" to save your first recipe.</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>No meals match</Text>
      <Text style={styles.emptyText}>
        {hasFilters ? 'Try a different search or reset the filters.' : 'Nothing to show.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <MealRow recipe={item} />}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing && loaded} onRefresh={refresh} />}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: navBottom + layout.navBarHeight + layout.fabSize },
        ]}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <Text style={styles.title} accessibilityRole="header">
              Meals
            </Text>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search meals"
                  placeholderTextColor={colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search meals"
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={18} color={colors.textPlaceholder} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                style={styles.filterButton}
                onPress={() => setFilterOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Filter and sort meals"
              >
                <Ionicons name="options-outline" size={22} color={colors.primary} />
                {filtersActive(filters) ? <View style={styles.filterDot} /> : null}
              </Pressable>
            </View>
            {error ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  {recipes.length > 0 ? 'Showing your last loaded meals. ' : ''}
                  {error}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />

      <BottomNavBar activeTab="meals" bottomOffset={navBottom} />
      <MealFilterSheet
        visible={filterOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}
