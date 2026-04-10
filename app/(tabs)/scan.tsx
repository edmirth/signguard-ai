import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import DocumentScanner, { ResponseType, ScanDocumentResponseStatus } from 'react-native-document-scanner-plugin';
import { colors, fontSizes, fonts, spacing, radius } from '@/constants/theme';
import { setPendingScan } from '@/lib/pendingScan';
import { trackEvent } from '@/lib/analytics';

type ScreenState = 'choose' | 'preview' | 'converting';

export default function ScanScreen() {
  const [state, setState] = useState<ScreenState>('choose');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('image/jpeg');

  const handleScanDocument = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Document scanning requires a native build. Please use the upload option instead.');
      return;
    }
    try {
      const result = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
        responseType: ResponseType.Base64,
        maxNumDocuments: 1,
      });
      if (result.status === ScanDocumentResponseStatus.Success && result.scannedImages?.length) {
        const base64 = result.scannedImages[0];
        setPreviewBase64(base64);
        setPreviewUri(`data:image/jpeg;base64,${base64}`);
        setPreviewMime('image/jpeg');
        setState('preview');
      }
    } catch {
      // user cancelled — stay on choose screen
    }
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a contract.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const b64 = asset.base64 ?? null;
      if (b64) {
        setPreviewBase64(b64);
        setPreviewUri(asset.uri);
        setPreviewMime(asset.mimeType ?? 'image/jpeg');
        setState('preview');
      }
    }
  }, []);

  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setState('converting');
      try {
        const b64 = await readAsStringAsync(asset.uri, { encoding: 'base64' });
        setPreviewBase64(b64);
        setPreviewUri(asset.uri);
        setPreviewMime(asset.mimeType ?? 'image/jpeg');
        setState('preview');
      } catch {
        setState('choose');
        Alert.alert('Error', 'Failed to read the file. Please try a different file.');
      }
    }
  }, []);

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
    setPreviewBase64(null);
    setPreviewMime('image/jpeg');
    setState('choose');
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!previewBase64) return;
    setPendingScan(previewBase64, previewMime);
    trackEvent('scan_started');
    router.push('/analyzing');
  }, [previewBase64, previewMime]);

  if (state === 'converting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.convertingText}>PROCESSING FILE</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'preview' && previewUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewHeader}>
          <Text style={styles.screenLabel}>DOCUMENT PREVIEW</Text>
          <Text style={styles.previewHint}>Confirm the document is clear and readable</Text>
        </View>
        <View style={styles.previewImageContainer}>
          <Image
            source={{ uri: previewUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          {/* Corner marks */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeText}>RETAKE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
            <Text style={styles.analyzeText}>ANALYZE →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.chooseContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenLabel}>SCAN CONTRACT</Text>
        <Text style={styles.screenSubtitle}>
          Choose how to import your document
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Scan with camera — primary */}
        <TouchableOpacity style={styles.primaryOption} onPress={handleScanDocument} activeOpacity={0.75}>
          <View style={styles.optionNumber}>
            <Text style={styles.optionNumberText}>01</Text>
          </View>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>CAMERA SCAN</Text>
            <Text style={styles.optionDesc}>
              Automatic edge detection{Platform.OS === 'web' ? ' — requires native build' : ''}
            </Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.optionDivider} />

        {/* Gallery */}
        <TouchableOpacity style={styles.secondaryOption} onPress={handlePickFromGallery} activeOpacity={0.75}>
          <View style={styles.optionNumber}>
            <Text style={styles.optionNumberText}>02</Text>
          </View>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>PHOTO LIBRARY</Text>
            <Text style={styles.optionDesc}>Select an existing photo of a contract</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.optionDivider} />

        {/* Files */}
        <TouchableOpacity style={styles.secondaryOption} onPress={handlePickDocument} activeOpacity={0.75}>
          <View style={styles.optionNumber}>
            <Text style={styles.optionNumberText}>03</Text>
          </View>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>IMPORT FILE</Text>
            <Text style={styles.optionDesc}>PDF or image from your device storage</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.disclaimer}>
          Your document is processed securely and never stored without your consent.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  convertingText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: fonts.mono,
  },

  // Choose state
  chooseContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  screenLabel: {
    color: colors.accent,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginBottom: spacing.xl,
  },

  // Options
  primaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  secondaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  optionDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  optionNumber: {
    width: 36,
  },
  optionNumberText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    fontFamily: fonts.mono,
    letterSpacing: 1,
  },
  optionTextGroup: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  optionDesc: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  optionArrow: {
    color: colors.accent,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },

  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  // Preview state
  previewHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  previewHint: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
  },
  previewImageContainer: {
    flex: 1,
    marginHorizontal: spacing.xl,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  // Corner bracket marks
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: colors.accent,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  retakeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    letterSpacing: 2,
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  analyzeText: {
    color: colors.bg,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
