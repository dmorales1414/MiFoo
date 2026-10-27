import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemHeader } from '../../components/add/AddItemHeader';
import { TextLink } from '../../components/add/Buttons';
import { CameraPermissionPrompt } from '../../components/add/CameraPermissionPrompt';
import { InfoCard } from '../../components/add/InfoCard';
import { ScannerViewport } from '../../components/add/ScannerViewport';
import { StepIntro } from '../../components/add/StepIntro';
import { useAddItem } from '../../features/addItem/AddItemContext';
import { ApiError, lookupBarcode } from '../../services/api';
import { styles } from '../../styles/add/addScreen.styles';
import { spacing } from '../../styles/theme';
import { BARCODE_TYPES, isValidBarcode } from '../../utils/barcode';

// Step 1 of 3 (Figma: "Scan barcode"). Reads a barcode with the camera, asks the backend
// (which asks Open Food Facts) what the product is, then moves on to "Confirm item".
export default function ScanBarcodeScreen() {
  const insets = useSafeAreaInsets();
  const { startFromProduct } = useAddItem();
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused(); // the camera is switched off while another screen is on top
  const [torchOn, setTorchOn] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  // The camera reports the same barcode many times per second. This lock makes sure
  // we handle one scan at a time.
  const busy = useRef(false);
  useEffect(() => {
    if (focused) {
      busy.current = false;
      setLookingUp(false);
    }
  }, [focused]);

  const unlock = useCallback(() => {
    busy.current = false;
    setLookingUp(false);
  }, []);

  const handleScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      // Ignore misreads: a real barcode has a correct check digit.
      if (busy.current || !isValidBarcode(data)) return;
      busy.current = true;
      setLookingUp(true);
      try {
        const product = await lookupBarcode(data);
        startFromProduct(product);
        router.push('/add/confirm-item');
      } catch (error) {
        const notFound = error instanceof ApiError && error.status === 404;
        Alert.alert(
          notFound ? 'Barcode not found' : "Couldn't look up that barcode",
          notFound
            ? "This product isn't in the Open Food Facts database. You can add it manually instead."
            : error instanceof Error
              ? error.message
              : 'Something went wrong.',
          [
            { text: 'Scan again', onPress: unlock },
            { text: 'Enter manually', onPress: () => router.replace('/add/manual') },
          ],
          { cancelable: true, onDismiss: unlock },
        );
      }
    },
    [startFromProduct, unlock],
  );

  const granted = permission?.granted === true;

  return (
    <View style={styles.root}>
      <AddItemHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepIntro
          eyebrow="IDENTIFY ITEM · 1 OF 3"
          step={1}
          title="Scan barcode"
          subtitle="Center the barcode inside the guide. Keep the package steady and well lit."
        />

        <ScannerViewport
          guide="barcode"
          statusLabel={lookingUp ? 'Looking up product…' : 'Looking for a barcode'}
          statusTone={lookingUp ? 'busy' : 'searching'}
          torchOn={torchOn}
          onToggleTorch={() => setTorchOn((on) => !on)}
        >
          {granted ? (
            focused && (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torchOn}
                barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                onBarcodeScanned={handleScanned}
              />
            )
          ) : (
            <CameraPermissionPrompt permission={permission} onRequest={requestPermission} />
          )}
        </ScannerViewport>

        <View style={styles.sectionPadding}>
          <InfoCard
            icon="scan-outline"
            title="Start with the package barcode"
            body="We'll identify the item first, then scan its expiration date separately."
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={styles.footnote}>Scans automatically when the barcode is clear</Text>
        <TextLink label="Enter item manually" onPress={() => router.replace('/add/manual')} />
      </View>
    </View>
  );
}
