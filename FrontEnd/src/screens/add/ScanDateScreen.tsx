import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Redirect, router, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemHeader } from '../../components/add/AddItemHeader';
import { PrimaryButton, TextLink } from '../../components/add/Buttons';
import { CameraPermissionPrompt } from '../../components/add/CameraPermissionPrompt';
import { ScannerViewport } from '../../components/add/ScannerViewport';
import { StepIntro } from '../../components/add/StepIntro';
import { useAddItem } from '../../features/addItem/AddItemContext';
import { isOcrAvailable, readText } from '../../services/ocr';
import { styles } from '../../styles/add/addScreen.styles';
import { colors, spacing } from '../../styles/theme';
import { formatLongDate } from '../../utils/expiry';
import { parseExpirationDate } from '../../utils/parseExpirationDate';

const FRAME_PAUSE_MS = 700; // wait between pictures so the phone is not working non-stop
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Step 2 of 3 (Figma: "Scan expiration date"). Takes a picture about once a second, reads
// the text in it on the phone (no internet needed) and looks for a date.
export default function ScanDateScreen() {
  const insets = useSafeAreaInsets();
  const { draft, setScannedDate, update } = useAddItem();
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [scanRound, setScanRound] = useState(0); // bump to start looking again
  const ocrAvailable = isOcrAvailable();

  const granted = permission?.granted === true;

  useEffect(() => {
    if (!ocrAvailable || !focused || !granted || !cameraReady || detected) return;
    let cancelled = false;

    (async () => {
      while (!cancelled) {
        try {
          const photo = await cameraRef.current?.takePictureAsync({
            quality: 0.5,
            skipProcessing: true, // faster; we only need the text, not a nice picture
            shutterSound: false,
          });
          if (cancelled || !photo) break;
          const parsed = parseExpirationDate(await readText(photo.uri));
          if (parsed && !cancelled) {
            setDetected(parsed.iso);
            break;
          }
        } catch {
          // One bad frame is normal (camera busy, blurry picture). Just try again.
        }
        await sleep(FRAME_PAUSE_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ocrAvailable, focused, granted, cameraReady, detected, scanRound]);

  if (!draft.product) return <Redirect href="/add/scan-barcode" />;

  const confirm = () => {
    if (!detected) return;
    setScannedDate(detected);
    router.push('/add/review');
  };

  const enterManually = () => {
    // Go to the review screen with no date; the user picks one there.
    update({ expirationDate: null, dateSource: null });
    router.push('/add/review');
  };

  const statusLabel = !ocrAvailable
    ? 'Date scanning unavailable'
    : detected
      ? 'Date detected'
      : 'Looking for a date';

  return (
    <View style={styles.root}>
      <AddItemHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepIntro
          eyebrow="EXPIRATION DATE · 2 OF 3"
          step={2}
          title="Scan expiration date"
          subtitle="Find the printed date on the lid or package. Align just the date inside the narrow guide."
        />

        <ScannerViewport
          guide="date"
          statusLabel={statusLabel}
          statusTone={detected ? 'success' : 'searching'}
          torchOn={torchOn}
          onToggleTorch={() => setTorchOn((on) => !on)}
        >
          {granted ? (
            focused && (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torchOn}
                onCameraReady={() => setCameraReady(true)}
              />
            )
          ) : (
            <CameraPermissionPrompt permission={permission} onRequest={requestPermission} />
          )}
        </ScannerViewport>

        <View style={styles.sectionPadding}>
          <View style={styles.detectedCard}>
            <View style={styles.detectedText}>
              <Text style={styles.detectedLabel}>DETECTED BEST-BEFORE DATE</Text>
              <Text style={[styles.detectedDate, !detected && styles.detectedDateEmpty]}>
                {detected ? formatLongDate(detected) : ocrAvailable ? 'Looking…' : 'Not available'}
              </Text>
              <Text style={styles.detectedHint}>
                {detected
                  ? 'Check this matches your package before continuing.'
                  : ocrAvailable
                    ? 'Hold the printed date steady inside the guide.'
                    : 'This build cannot read text yet. Enter the date manually.'}
              </Text>
            </View>
            {detected && (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={18} color={colors.success} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton icon="checkmark" label="Confirm date" disabled={!detected} onPress={confirm} />
        {detected && (
          <TextLink
            label="Not right? Scan again"
            onPress={() => {
              setDetected(null);
              setScanRound((round) => round + 1);
            }}
          />
        )}
        <TextLink label="Enter date manually" onPress={enterManually} />
      </View>
    </View>
  );
}
