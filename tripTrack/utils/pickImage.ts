import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// PICK IMAGE
export const pickImage = async () => {
  try {
    // Ask Permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow gallery access to upload image.'
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    // Return Selected Image URI
    if (!result.canceled) {
      return result.assets[0].uri;
    }

    return null;

  } catch (error) {
    console.log('Image Picker Error:', error);
    return null;
  }
};

// UPLOAD TO CLOUDINARY
export const uploadToCloudinary = async (uri) => {
  try {
    const data = new FormData();

    data.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    data.append('upload_preset', 'transit-app');

    const cloudName = 'dsrl10j73';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: data,
      }
    );

    const result = await response.json();

    console.log('Cloudinary Response:', result);

    if (result.secure_url) {
      return result.secure_url;
    } else {
      throw new Error('Failed to upload image');
    }

  } catch (error) {
    console.log('Cloudinary Upload Error:', error);
    Alert.alert('Upload Failed', 'Could not upload image.');
    return null;
  }
};