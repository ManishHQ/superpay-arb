import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export class AvatarService {
  /**
   * Pick image from camera or gallery
   */
  static async pickImage(allowsEditing: boolean = true): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Media library permission denied');
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  static async takePhoto(allowsEditing: boolean = true): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Camera permission denied');
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  /**
   * Resize and optimize image
   */
  static async processImage(uri: string, size: number = 300): Promise<string | null> {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: size, height: size } },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  }

  /**
   * Upload image to Supabase Storage
   */
  static async uploadAvatar(imageUri: string, userId: string): Promise<string | null> {
    try {
      // Process the image first
      const processedUri = await this.processImage(imageUri);
      if (!processedUri) {
        throw new Error('Failed to process image');
      }

      // Create file name
      const fileExt = processedUri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Convert to blob for upload
      const response = await fetch(processedUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  /**
   * Delete old avatar from storage
   */
  static async deleteAvatar(avatarUrl: string): Promise<boolean> {
    try {
      if (!avatarUrl || !avatarUrl.includes('/avatars/')) {
        return true; // Nothing to delete
      }

      // Extract file path from URL
      const urlParts = avatarUrl.split('/avatars/');
      if (urlParts.length < 2) {
        return true;
      }

      const filePath = `avatars/${urlParts[1]}`;

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting avatar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }
  }

  /**
   * Complete avatar upload flow - pick, process, and upload
   */
  static async selectAndUploadAvatar(userId: string, fromCamera: boolean = false): Promise<string | null> {
    try {
      // Pick image
      const result = fromCamera 
        ? await this.takePhoto() 
        : await this.pickImage();

      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const imageUri = result.assets[0].uri;

      // Upload the image
      const avatarUrl = await this.uploadAvatar(imageUri, userId);
      
      return avatarUrl;
    } catch (error) {
      console.error('Error in avatar upload flow:', error);
      return null;
    }
  }

  /**
   * Generate default avatar URL (using a service like DiceBear or UI Avatars)
   */
  static generateDefaultAvatar(username: string, seed?: string): string {
    const avatarSeed = seed || username || 'default';
    // Using DiceBear avataaars style
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  /**
   * Get avatar URL with fallback
   */
  static getAvatarUrl(profile: { avatar_url?: string | null; username: string }): string {
    if (profile.avatar_url && profile.avatar_url.trim()) {
      return profile.avatar_url;
    }
    
    return this.generateDefaultAvatar(profile.username);
  }
}