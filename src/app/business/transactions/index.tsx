import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BusinessTransactions() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Transaction History
        </Text>
        
        <View className="bg-green-50 border border-green-200 rounded-lg p-4">
          <Text className="text-green-800 font-medium">
            Business Transactions Coming Soon
          </Text>
          <Text className="text-green-600 mt-1">
            View detailed business transaction analytics and history here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}