import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BusinessSettings() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Business Settings
        </Text>
        
        <View className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Text className="text-purple-800 font-medium">
            Business Configuration Coming Soon
          </Text>
          <Text className="text-purple-600 mt-1">
            Configure your business profile, payment methods, and preferences here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}