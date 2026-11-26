import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/Buttons';
import { RemoveItemsSheet } from '../components/items/RemoveItemsSheet';
import { MealRow } from '../components/recipes/MealRow';
import { StatusBadge } from '../components/StatusBadge';
import { classificationLabel } from '../features/items/classification';
import { LOCATION_LABELS } from '../features/items/locations';
import { useRecipes } from '../hooks/useRecipes';
import { ApiError, fetchItem, removeItemAmount } from '../services/api';
import { cacheItem, forgetItem, getCachedItem } from '../services/itemCache';
import { styles } from '../styles/itemInfo.styles';
import { colors, spacing, statusColors } from '../styles/theme';
import type { Item } from '../types/item';
import { daysSince, formatLongDate, getItemDisplay } from '../utils/expiry';
import { useTheme } from '../features/theme/ThemeContext';

// "January 5, 2026" from the full timestamp the backend sends.
function formatAdded(dateAdded: string): string {
  return new Date(dateAdded).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Item Info (Figma: "Item Info"): everything about one stored item, the meals you could cook
// with it, and the Update / Remove buttons.
export default function ItemInfoScreen() {
  useTheme(); // draw again when Light / Dark changes
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, refresh: refreshRecipes } = useRecipes();

  // Start from the copy the list already has, so the page appears at once. The fresh copy loads in
  // the background (below) and replaces it.
  const [item, setItem] = useState<Item | null>(() => getCachedItem(String(id)));
  const [error, setError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Reload whenever the screen is shown, so changes made on the Update screen appear.
  const load = useCallback(async () => {
    try {
      const fresh = await fetchItem(String(id));
      cacheItem(fresh);
      setItem(fresh);
      setError(null);
      setRefreshFailed(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // Gone (removed on another phone): stop showing the old copy.
        forgetItem(String(id));
        setItem(null);
        setError('This item is no longer in your kitchen.');
      } else if (getCachedItem(String(id))) {
        setRefreshFailed(true); // keep showing the copy we have, and say it may be out of date
      } else {
        setError(
          e instanceof ApiError && e.status >= 500
            ? 'The server is busy or waking up. Please try again in a moment.'
            : e instanceof Error
              ? e.message
              : 'Could not load this item.',
        );
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshRecipes();
    }, [load, refreshRecipes]),
  );

  // Meals that use this item, best pantry match first (the list from the server is already ordered).
  const cookable = useMemo(
    () => (item ? recipes.filter((r) => r.matchedItemIds.includes(item.id)) : []),
    [recipes, item],
  );

  const handleRemove = async (entries: { id: string; amount: number }[]) => {
    if (!item) return;
    setRemoving(true);
    try {
      const result = await removeItemAmount(item.id, entries[0].amount);
      setRemoveOpen(false);
      if (result.removed) {
        forgetItem(item.id);
        router.back(); // nothing left: the item is gone, so leave its page
      } else if (result.item) {
        setItem(result.item);
      }
    } catch (e) {
      Alert.alert("Couldn't remove the item", e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const topPadding = insets.top + spacing.lg;

  if (!item) {
    return (
      <View style={styles.root}>
        <View style={[styles.headerRow, { paddingTop: topPadding, paddingHorizontal: spacing.xl }]}>
          <Pressable style={styles.roundButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <PrimaryButton label="Try again" small onPress={load} />
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.primaryText} />
              <Text style={styles.errorText}>Loading item…</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const display = getItemDisplay(item);
  const palette = statusColors[display.status];
  const statColor = display.status === 'none' ? colors.textPrimary : palette.metaText;
  const stored = Math.max(0, daysSince(item.dateAdded));

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding, paddingBottom: insets.bottom + 120 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.roundButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.roundButton}
            onPress={() => router.dismissTo('/')}
            accessibilityRole="button"
            accessibilityLabel="Close and go to Home"
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {refreshFailed ? (
          <Pressable style={styles.staleBanner} onPress={load} accessibilityRole="button">
            <Text style={styles.staleText}>Couldn't refresh this item, so details may be out of date. Tap to retry.</Text>
          </Pressable>
        ) : null}

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{item.itemName}</Text>
          <Text style={styles.stored}>
            Stored In <Text style={styles.storedStrong}>{LOCATION_LABELS[item.location]}</Text>
          </Text>
          {display.status !== 'none' ? (
            <View style={styles.badgeRow}>
              <StatusBadge status={display.status} />
            </View>
          ) : null}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Classified As</Text>
            <Text style={styles.statValue} numberOfLines={2}>
              {classificationLabel(item)}
            </Text>
          </View>
          <View style={[styles.stat, styles.statDivider]}>
            <Text style={[styles.statLabel, display.status !== 'none' && { color: statColor }]}>{display.statLabel}</Text>
            <Text style={[styles.statValue, { color: statColor }]}>{display.statValue}</Text>
          </View>
          <View style={[styles.stat, styles.statDivider]}>
            <Text style={styles.statLabel}>Quantity</Text>
            <Text style={styles.statValue}>{item.quantity}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expiration date</Text>
            <Text style={styles.detailValue}>
              {item.expirationDate ? formatLongDate(item.expirationDate) : 'None (tracked by time stored)'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Added</Text>
            <Text style={styles.detailValue}>
              {formatAdded(item.dateAdded)}
              {stored > 0 ? ` (${stored} ${stored === 1 ? 'day' : 'days'} ago)` : ' (today)'}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.cookTitle}>Let's Cook It!</Text>
          <Text style={styles.cookSub}>Cook With What You Have</Text>
        </View>
        <View style={styles.cookList}>
          {cookable.length > 0 ? (
            cookable.map((recipe) => <MealRow key={recipe.id} recipe={recipe} />)
          ) : (
            <View>
              <Text style={styles.cookEmpty}>None of your saved meals use {item.itemName} yet.</Text>
              <Pressable onPress={() => router.push('/recipe/new')} accessibilityRole="link">
                <Text style={styles.cookEmptyLink}>Add a meal</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={[styles.footerButton, styles.updateButton]}
          onPress={() => router.push({ pathname: '/add/manual', params: { edit: item.id } })}
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={20} color={colors.onPrimary} />
          <Text style={styles.updateLabel}>Update</Text>
        </Pressable>
        <Pressable
          style={[styles.footerButton, styles.removeButton]}
          onPress={() => setRemoveOpen(true)}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
          <Text style={styles.removeLabel}>Remove</Text>
        </Pressable>
      </View>

      <RemoveItemsSheet
        visible={removeOpen}
        items={[item]}
        busy={removing}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
      />
    </View>
  );
}
