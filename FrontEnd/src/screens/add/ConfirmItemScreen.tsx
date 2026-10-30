import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemHeader } from '../../components/add/AddItemHeader';
import { PrimaryButton, TextLink } from '../../components/Buttons';
import { InfoCard } from '../../components/add/InfoCard';
import { StepIntro } from '../../components/add/StepIntro';
import { useAddItem } from '../../features/addItem/AddItemContext';
import { styles } from '../../styles/add/addScreen.styles';
import { colors, spacing } from '../../styles/theme';

// Step 1 of 3, second half (Figma: "Confirm item"). Shows what Open Food Facts found
// so the user can check it is the right product.
export default function ConfirmItemScreen() {
  const insets = useSafeAreaInsets();
  const { draft } = useAddItem();
  const [imageFailed, setImageFailed] = useState(false);
  const product = draft.product;

  // Opened without a scan (for example after the app reloaded): start over.
  if (!product) return <Redirect href="/add/scan-barcode" />;

  const details = [product.brand, product.quantityText].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <AddItemHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepIntro
          eyebrow="IDENTIFY ITEM · 1 OF 3"
          step={1}
          title="Is this the right item?"
          subtitle="We found a match for your barcode. Check the product before continuing."
        />

        <View style={styles.sectionPadding}>
          <View style={styles.productCard}>
            <View style={styles.productTopRow}>
              <View style={styles.matchedChip}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.matchedText}>Barcode matched</Text>
              </View>
              <Text style={styles.barcodeNumber}>{product.barcode}</Text>
            </View>

            <View style={styles.productImageWrap}>
              {product.imageUrl && !imageFailed ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                  resizeMode="contain"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <Ionicons name="cube-outline" size={56} color={colors.placeholderImage} />
              )}
            </View>

            <View>
              <Text style={styles.productName}>{product.itemName}</Text>
              {details ? <Text style={styles.productMeta}>{details}</Text> : null}
            </View>

            <View style={styles.categoryChip}>
              <Ionicons name="restaurant-outline" size={14} color={colors.textPrimary} />
              <Text style={styles.categoryChipText}>Food Items</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionPadding}>
          <InfoCard
            tone="blue"
            icon="calendar-outline"
            title="Next, check the expiration date"
            body="The barcode identifies the product, not its expiration date. We'll read that from the package."
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton
          icon="scan-outline"
          label="Yes, scan expiration date"
          onPress={() => router.push('/add/scan-date')}
        />
        <TextLink label="Not this item? Enter manually" onPress={() => router.replace('/add/manual')} />
      </View>
    </View>
  );
}
