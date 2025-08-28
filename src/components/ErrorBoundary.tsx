import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <View className="flex-1 items-center justify-center p-6 bg-white">
          <Ionicons name="warning" size={64} color="#f59e0b" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            Something went wrong
          </Text>
          <Text className="text-base text-gray-600 mt-2 text-center">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 bg-blue-600 rounded-lg"
            onPress={this.resetError}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Payment-specific error fallback
export const PaymentErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <View className="flex-1 items-center justify-center p-6 bg-white">
    <Ionicons name="card" size={64} color="#ef4444" />
    <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
      Payment Error
    </Text>
    <Text className="text-base text-gray-600 mt-2 text-center">
      {error?.message?.includes('Network') 
        ? 'Network connection failed. Please check your internet connection and try again.'
        : error?.message?.includes('funds')
        ? 'Insufficient funds or gas fees. Please check your balance.'
        : error?.message || 'Payment processing failed'
      }
    </Text>
    <TouchableOpacity
      className="mt-6 px-6 py-3 bg-blue-600 rounded-lg"
      onPress={resetError}
    >
      <Text className="text-white font-semibold">Try Payment Again</Text>
    </TouchableOpacity>
  </View>
);