import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemFab } from '../components/AddItemFab';
import { BottomNavBar } from '../components/BottomNavBar';
import { ItemSection } from '../components/ItemSection';
import { RecommendedMealCarousel } from '../components/RecommendedMealCarousel';
import { RemoveSelectedButton } from '../components/RemoveSelectedButton';
import { sampleMeals } from '../data/sampleData';
import { useItems } from '../hooks/useItems';
import { styles } from '../styles/homeScreen.styles';
import { layout, spacing } from '../styles/theme';
import type { ItemCategory } from '../types/item';

// The Home screen. It owns all the state and passes it down to the components:
//   Frame 1 (default)      -> nothing open, nothing selected
//   Frame 2 (add menu)     -> isMenuOpen is true
//   Frame 3 (manage mode)  -> managingCategory is set and some items are selected
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Items come from the FastAPI backend (falls back to sample data if it is unreachable).
  const { items, offlineReason, refresh, removeItems } = useItems();
  // Reload every time Home is shown, so an item added on the add-item screens appears.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Which section is in manage mode (null = none). Only one at a time, like the mockup.
  const [managingCategory, setManagingCategory] = useState<ItemCategory | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const packagedItems = items.filter((item) => item.category === 'packaged');
  const produceItems = items.filter((item) => item.category === 'produce');

  // Heights that keep the floating controls above the system gesture bar.
  const navBottom = insets.bottom + layout.navBarBottomGap;
  const controlsBottom = navBottom + layout.navBarHeight + spacing.md; // FAB / remove button sit above the nav
  const scrollBottomPadding = controlsBottom + layout.fabSize + spacing.xl;

  const handleToggleManage = (category: ItemCategory) => {
    setIsMenuOpen(false);
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
        <RecommendedMealCarousel meals={sampleMeals} />

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

      {/* Frame 3 swaps the + button for the red remove bar. */}
      {isManaging ? (
        <RemoveSelectedButton
          bottomOffset={controlsBottom}
          count={selectedIds.length}
          onPress={handleRemoveSelected}
        />
      ) : (
        <AddItemFab
          bottomOffset={controlsBottom}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((open) => !open)}
          onCloseMenu={() => setIsMenuOpen(false)}
          onScanBarcode={() => router.push('/add/scan-barcode')}
          onEnterManually={() => router.push('/add/manual')}
        />
      )}

      <BottomNavBar activeTab="home" bottomOffset={navBottom} />
    </View>
  );
}
