import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BusinessCustomers() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Customers
        </Text>
        
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Text className="text-blue-800 font-medium">
            Customer Management Coming Soon
          </Text>
          <Text className="text-blue-600 mt-1">
            View and manage your business customers here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}