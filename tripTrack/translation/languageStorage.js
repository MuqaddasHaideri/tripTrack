import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "app_language";

// Save language
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.log("Error saving language:", error);
  }
};

// Get saved language
export const getLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);

    return language || "en";
  } catch (error) {
    console.log("Error getting language:", error);
    return "en";
  }
};

// Remove saved language (optional)
export const removeLanguage = async () => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
  } catch (error) {
    console.log("Error removing language:", error);
  }
};