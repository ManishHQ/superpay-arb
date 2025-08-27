import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfileStore } from '@/stores/userProfileStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AvatarService } from '@/services/avatarService';
import { Image } from 'react-native';

export default function BusinessDashboard() {
  const { currentProfile } = useUserProfileStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = currentProfile?.business_name || currentProfile?.display_name || currentProfile?.full_name || 'Business Owner';
  const avatarUrl = AvatarService.getAvatarUrl({
    avatar_url: currentProfile?.avatar_url,
    username: currentProfile?.username || 'business',
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Image
              source={{ uri: avatarUrl }}
              className="w-12 h-12 rounded-full mr-4"
              resizeMode="cover"
            />
            <View>
              <Text className="text-xl font-bold text-gray-900">
                {getGreeting()}!
              </Text>
              <Text className="text-gray-600">
                {displayName}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Business Stats Cards */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">$12.5K</Text>
                <Text className="text-sm text-gray-600">Monthly Revenue</Text>
              </View>
              <View className="bg-green-100 p-3 rounded-full">
                <Ionicons name="trending-up" size={20} color="#10B981" />
              </View>
            </View>
          </View>
          
          <View className="w-[48%] bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">248</Text>
                <Text className="text-sm text-gray-600">Transactions</Text>
              </View>
              <View className="bg-blue-100 p-3 rounded-full">
                <Ionicons name="card" size={20} color="#3B82F6" />
              </View>
            </View>
          </View>
          
          <View className="w-[48%] bg-white rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">89</Text>
                <Text className="text-sm text-gray-600">Customers</Text>
              </View>
              <View className="bg-purple-100 p-3 rounded-full">
                <Ionicons name="people" size={20} color="#8B5CF6" />
              </View>
            </View>
          </View>
          
          <View className="w-[48%] bg-white rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">4.8</Text>
                <Text className="text-sm text-gray-600">Avg Rating</Text>
              </View>
              <View className="bg-yellow-100 p-3 rounded-full">
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="bg-white rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-green-100 p-2 rounded-full mr-3">
                  <Ionicons name="arrow-down" size={16} color="#10B981" />
                </View>
                <View>
                  <Text className="font-medium text-gray-900">Payment Received</Text>
                  <Text className="text-sm text-gray-500">John Doe • 2 min ago</Text>
                </View>
              </View>
              <Text className="font-semibold text-green-600">+$45.00</Text>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-blue-100 p-2 rounded-full mr-3">
                  <Ionicons name="person-add" size={16} color="#3B82F6" />
                </View>
                <View>
                  <Text className="font-medium text-gray-900">New Customer</Text>
                  <Text className="text-sm text-gray-500">Sarah Wilson • 1 hour ago</Text>
                </View>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-orange-100 p-2 rounded-full mr-3">
                  <Ionicons name="time" size={16} color="#F97316" />
                </View>
                <View>
                  <Text className="font-medium text-gray-900">Payment Pending</Text>
                  <Text className="text-sm text-gray-500">Mike Chen • 3 hours ago</Text>
                </View>
              </View>
              <Text className="font-semibold text-orange-600">$28.50</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          
          <View className="flex-row justify-between">
            <TouchableOpacity className="items-center flex-1">
              <View className="bg-blue-100 p-4 rounded-full mb-2">
                <Ionicons name="add" size={24} color="#3B82F6" />
              </View>
              <Text className="text-sm font-medium text-gray-700">
                New Invoice
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center flex-1">
              <View className="bg-green-100 p-4 rounded-full mb-2">
                <Ionicons name="qr-code" size={24} color="#10B981" />
              </View>
              <Text className="text-sm font-medium text-gray-700">
                QR Payment
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center flex-1">
              <View className="bg-purple-100 p-4 rounded-full mb-2">
                <Ionicons name="analytics" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-sm font-medium text-gray-700">
                Reports
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="items-center flex-1">
              <View className="bg-orange-100 p-4 rounded-full mb-2">
                <Ionicons name="settings" size={24} color="#F97316" />
              </View>
              <Text className="text-sm font-medium text-gray-700">
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
