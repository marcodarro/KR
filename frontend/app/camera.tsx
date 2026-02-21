import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { analyzeFood } from '../src/services/api';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo.base64) {
        const result = await analyzeFood(photo.base64);
        router.push({
          pathname: '/food-result',
          params: { result: JSON.stringify(result) },
        });
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to analyze food. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsAnalyzing(true);
        const analysisResult = await analyzeFood(result.assets[0].base64);
        router.push({
          pathname: '/food-result',
          params: { result: JSON.stringify(analysisResult) },
        });
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#64748B" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan and analyze your food
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
          <Ionicons name="images-outline" size={20} color="#10B981" />
          <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.analyzingText}>Analyzing food...</Text>
          <Text style={styles.analyzingSubtext}>
            Our AI is identifying your food and calculating nutrients
          </Text>
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            {/* Scan Frame Overlay */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.instructionText}>
                Position your food within the frame
              </Text>
            </View>
          </CameraView>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePickImage}>
              <Ionicons name="images" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.controlButton} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  galleryButtonText: {
    fontSize: 16,
    color: '#10B981',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10B981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#0F172A',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
  },
  analyzingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  analyzingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
  },
  analyzingSubtext: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});
