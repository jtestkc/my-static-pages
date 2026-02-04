import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LoginScreen from './src/LoginScreen';
import ChatScreen from './src/ChatScreen';

export default function App() {
    const [user, setUser] = useState(null);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {user ? (
                <ChatScreen user={user} onLogout={() => setUser(null)} />
            ) : (
                <LoginScreen onLogin={setUser} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
});
