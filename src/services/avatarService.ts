import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export class AvatarService {
	/**
	 * Pick image from camera or gallery
	 */
	static async pickImage(
		allowsEditing: boolean = true
	): Promise<ImagePicker.ImagePickerResult | null> {
		try {
			// Request permissions
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

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
	static async takePhoto(
		allowsEditing: boolean = true
	): Promise<ImagePicker.ImagePickerResult | null> {
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
	static async processImage(
		uri: string,
		size: number = 300
	): Promise<string | null> {
		try {
			console.log('🔄 Processing image:', uri, 'target size:', size);

			const manipulatedImage = await ImageManipulator.manipulateAsync(
				uri,
				[{ resize: { width: size, height: size } }],
				{
					compress: 0.8,
					format: ImageManipulator.SaveFormat.JPEG,
				}
			);

			console.log('✅ Image processed:', {
				originalUri: uri,
				processedUri: manipulatedImage.uri,
				width: manipulatedImage.width,
				height: manipulatedImage.height,
			});

			return manipulatedImage.uri;
		} catch (error) {
			console.error('❌ Error processing image:', error);
			return null;
		}
	}

	/**
	 * Upload image to Supabase Storage
	 */
	static async uploadAvatar(
		imageUri: string,
		userId: string
	): Promise<string | null> {
		try {
			console.log('🔄 Starting avatar upload for user:', userId);
			console.log('📤 Using public upload (no auth required)');

			// Process the image first (optimize for storage)
			const processedUri = await this.processImage(imageUri, 400); // Higher quality for storage
			if (!processedUri) {
				throw new Error('Failed to process image');
			}

			console.log('✅ Image processed successfully');

			// Validate processed image URI
			if (
				!processedUri.startsWith('file://') &&
				!processedUri.startsWith('content://')
			) {
				console.warn('⚠️ Processed URI may be invalid:', processedUri);
			}

			// Create file name with user ID prefix for easier management
			const fileExt = processedUri.split('.').pop() || 'jpg';
			const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
			const filePath = fileName; // Store directly in bucket root

			console.log('📁 Uploading to path:', filePath);

			// Convert to base64, then ArrayBuffer for React Native compatibility
			// As per Supabase docs: React Native requires ArrayBuffer from base64 data
			const response = await fetch(processedUri);
			if (!response.ok) {
				throw new Error(`Failed to fetch processed image: ${response.status}`);
			}

			// Convert to base64 first
			const blob = await response.blob();
			const base64Data = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const result = reader.result as string;
					// Remove data:image/jpeg;base64, prefix
					const base64 = result.split(',')[1];
					resolve(base64);
				};
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});

			console.log('📦 Base64 data length:', base64Data.length);

			// Convert base64 to ArrayBuffer (required for React Native)
			const { decode } = await import('base64-arraybuffer');
			const arrayBuffer = decode(base64Data);
			console.log('📦 ArrayBuffer created, size:', arrayBuffer.byteLength);

			// Validate arrayBuffer
			if (arrayBuffer.byteLength === 0) {
				throw new Error(
					'Image data is empty - image processing may have failed'
				);
			}
			if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
				// 5MB limit
				throw new Error('Image too large after processing');
			}

			// Try to verify the bucket exists by attempting a simple operation
			// Since listBuckets() might require special permissions, we'll try a direct approach
			console.log('🔍 Verifying avatars bucket exists...');

			try {
				// Try to list files in the avatars bucket to verify it exists
				const { data: testList, error: testError } = await supabase.storage
					.from('avatars')
					.list('', { limit: 1 });

				if (testError && testError.message.includes('Bucket not found')) {
					throw new Error(
						'Avatars bucket not found. Please create the "avatars" bucket in your Supabase Storage dashboard.'
					);
				} else if (testError) {
					console.warn('⚠️ Bucket test warning:', testError.message);
					// Continue anyway - might just be empty or permission issue
				}

				console.log('✅ Avatars bucket verified, proceeding with upload...');
			} catch (bucketError) {
				console.error('❌ Bucket verification failed:', bucketError);
				throw bucketError;
			}

			// Delete old avatar files for this user (cleanup)
			try {
				const { data: existingFiles } = await supabase.storage
					.from('avatars')
					.list('', {
						search: `avatar_${userId}_`,
					});

				if (existingFiles && existingFiles.length > 0) {
					const filesToDelete = existingFiles.map((file) => file.name);
					console.log('🗑️ Cleaning up old avatars:', filesToDelete);

					await supabase.storage.from('avatars').remove(filesToDelete);
				}
			} catch (cleanupError) {
				console.warn('⚠️ Could not clean up old avatars:', cleanupError);
				// Continue with upload even if cleanup fails
			}

			// Upload to Supabase Storage
			console.log('⬆️ Attempting upload with params:', {
				bucket: 'avatars',
				filePath,
				dataSize: arrayBuffer.byteLength,
				contentType: 'image/jpeg',
			});

			const { data, error } = await supabase.storage
				.from('avatars')
				.upload(filePath, arrayBuffer, {
					contentType: 'image/jpeg',
					upsert: true, // Allow overwriting
				});

			if (error) {
				console.error('❌ Error uploading avatar:', error);
				console.error('Error details:', {
					message: error.message,
					statusCode: error.statusCode,
					error: error.error,
				});
				throw error;
			}

			console.log('✅ Upload successful:', data);

			// Get public URL
			const { data: publicUrlData } = supabase.storage
				.from('avatars')
				.getPublicUrl(data.path);

			const publicUrl = publicUrlData.publicUrl;
			console.log('🔗 Public URL generated:', publicUrl);

			// Test if the uploaded file is accessible
			try {
				const testResponse = await fetch(publicUrl);
				console.log(
					'🧪 URL test - Status:',
					testResponse.status,
					'Content-Type:',
					testResponse.headers.get('content-type')
				);
				if (!testResponse.ok) {
					console.warn(
						'⚠️ Uploaded file may not be accessible:',
						testResponse.status
					);
				}
			} catch (testError) {
				console.warn(
					'⚠️ Could not test uploaded file accessibility:',
					testError
				);
			}

			return publicUrl;
		} catch (error) {
			console.error('💥 Error uploading avatar:', error);

			// No fallback - we want to use Supabase Storage exclusively

			// Provide more specific error messages
			if (error.message?.includes('Avatars bucket not found')) {
				throw new Error(
					'Storage setup required: Please create the "avatars" bucket in your Supabase dashboard.'
				);
			} else if (error.statusCode === 400) {
				throw new Error('Invalid file: Please try a different image format.');
			} else if (error.statusCode === 413) {
				throw new Error('File too large: Please choose a smaller image.');
			} else {
				throw new Error(
					`Upload failed: ${error.message || 'Unknown error occurred'}`
				);
			}
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
	static async selectAndUploadAvatar(
		userId: string,
		fromCamera: boolean = false
	): Promise<string | null> {
		try {
			// Pick image
			const result = fromCamera
				? await this.takePhoto()
				: await this.pickImage();

			if (
				!result ||
				result.canceled ||
				!result.assets ||
				result.assets.length === 0
			) {
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
	static getAvatarUrl(profile: {
		avatar_url?: string | null;
		username: string;
	}): string {
		if (profile.avatar_url && profile.avatar_url.trim()) {
			return profile.avatar_url;
		}

		return this.generateDefaultAvatar(profile.username);
	}
}
