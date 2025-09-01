import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfileStore } from '@/stores/userProfileStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AvatarService } from '@/services/avatarService';
import { Image } from 'react-native';
import { QRPaymentRequestModal } from '@/components/QRPaymentRequestModal';
import { PaymentRequestModal } from '@/components/PaymentRequestModal';
import { QuickQRGenerator } from '@/components/QuickQRGenerator';
import { useState } from 'react';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  desktopContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    marginRight: 16,
    width: 280,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default function BusinessDashboard() {
  const { currentProfile } = useUserProfileStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [showQuickQRModal, setShowQuickQRModal] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <View style={isDesktop ? styles.desktopContainer : {}}>
        <ScrollView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.greeting}>
                  {getGreeting()}!
                </Text>
                <Text style={styles.businessName}>
                  {displayName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={{ padding: 8 }}>
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Business Stats Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View>
                  <Text style={styles.statValue}>$12.5K</Text>
                  <Text style={styles.statLabel}>Monthly Revenue</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="trending-up" size={24} color="#16a34a" />
                </View>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View>
                  <Text style={styles.statValue}>248</Text>
                  <Text style={styles.statLabel}>Transactions</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="card" size={24} color="#2563eb" />
                </View>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View>
                  <Text style={styles.statValue}>89</Text>
                  <Text style={styles.statLabel}>Customers</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="people" size={24} color="#7c3aed" />
                </View>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View>
                  <Text style={styles.statValue}>4.8</Text>
                  <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="star" size={24} color="#d97706" />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Recent Activity */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>
              Recent Activity
            </Text>
            
            <View>
              <View style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="arrow-down" size={20} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={styles.activityTitle}>Payment Received</Text>
                    <Text style={styles.activitySubtitle}>John Doe • 2 min ago</Text>
                  </View>
                </View>
                <Text style={[styles.activityAmount, { color: '#16a34a' }]}>+$45.00</Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="person-add" size={20} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.activityTitle}>New Customer</Text>
                    <Text style={styles.activitySubtitle}>Sarah Wilson • 1 hour ago</Text>
                  </View>
                </View>
              </View>
              
              <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#fed7aa' }]}>
                    <Ionicons name="time" size={20} color="#ea580c" />
                  </View>
                  <View>
                    <Text style={styles.activityTitle}>Payment Pending</Text>
                    <Text style={styles.activitySubtitle}>Mike Chen • 3 hours ago</Text>
                  </View>
                </View>
                <Text style={[styles.activityAmount, { color: '#ea580c' }]}>$28.50</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setShowPaymentRequestModal(true)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="card" size={28} color="#2563eb" />
                </View>
                <Text style={styles.quickActionLabel}>
                  Request Payment
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setShowQuickQRModal(true)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="qr-code" size={28} color="#16a34a" />
                </View>
                <Text style={styles.quickActionLabel}>
                  Quick QR
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="analytics" size={28} color="#7c3aed" />
                </View>
                <Text style={styles.quickActionLabel}>
                  Reports
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#fed7aa' }]}>
                  <Ionicons name="settings" size={28} color="#ea580c" />
                </View>
                <Text style={styles.quickActionLabel}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      
      <QRPaymentRequestModal
        visible={showQRPaymentModal}
        onClose={() => setShowQRPaymentModal(false)}
      />
      
      <PaymentRequestModal
        visible={showPaymentRequestModal}
        onClose={() => setShowPaymentRequestModal(false)}
        onRequestSent={(requestData) => {
          console.log('Payment request sent:', requestData);
          // You can refresh the dashboard or show a success message here
        }}
      />
      
      <QuickQRGenerator
        visible={showQuickQRModal}
        onClose={() => setShowQuickQRModal(false)}
      />
    </SafeAreaView>
  );
}
