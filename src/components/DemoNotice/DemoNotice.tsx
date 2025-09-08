import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const DemoNotice: React.FC = () => {
	return (
		<View style={styles.container}>
			<Text style={styles.icon}>ℹ️</Text>
			<Text style={styles.text}>
				Demo Mode: This is a demonstration of wallet features. Balance and
				transactions are simulated.
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#e3f2fd',
		borderRadius: 8,
		padding: 12,
		margin: 16,
		borderWidth: 1,
		borderColor: '#bbdefb',
	},
	icon: {
		fontSize: 16,
		marginRight: 8,
	},
	text: {
		flex: 1,
		fontSize: 12,
		color: '#1565c0',
		lineHeight: 16,
	},
});
