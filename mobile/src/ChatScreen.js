import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { socket, api, API_URL } from '../api';

export default function ChatScreen({ user, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef();

    useEffect(() => {
        api.get('/messages').then(res => setMessages(res.data)).catch(console.error);

        socket.emit('join_room', 'general');
        socket.on('receive_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => socket.off('receive_message');
    }, []);

    // Auto-scroll on new message
    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1, // High quality
        });

        if (!result.canceled) {
            uploadFile(result.assets[0]);
        }
    };

    const uploadFile = async (asset) => {
        const formData = new FormData();
        const filename = asset.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        // Note: Basic mime type guess, usually expo gives type

        formData.append('file', {
            uri: asset.uri,
            name: filename,
            type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg'
        });

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            sendMessage(null, res.data.url, res.data.type);
        } catch (err) {
            Alert.alert("Upload Failed", "Could not upload file");
            console.error(err);
        }
    };

    const sendMessage = (content, fileUrl = null, type = 'text') => {
        const msgData = {
            content,
            type,
            fileUrl,
            senderId: user.id,
            senderName: user.username
        };
        socket.emit('send_message', msgData);
        setInput('');
    };

    const renderItem = ({ item }) => {
        const isMe = item.senderId === user.id;
        return (
            <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                <View style={[styles.msgBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}

                    {item.type === 'text' && <Text style={styles.msgText}>{item.content}</Text>}

                    {item.type === 'image' && (
                        <Image source={{ uri: API_URL + item.fileUrl }} style={styles.media} />
                    )}

                    {item.type === 'video' && (
                        <Video
                            style={styles.media}
                            source={{ uri: API_URL + item.fileUrl }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            isLooping
                        />
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>General Chat</Text>
                <TouchableOpacity onPress={onLogout}>
                    <Text style={styles.logoutText}>Exit</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
            />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                        <Text style={styles.attachText}>+</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Message..."
                        placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                        style={styles.sendBtn}
                        onPress={() => input.trim() && sendMessage(input)}
                    >
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#1F2937',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    logoutText: { color: '#EF4444' },
    listContent: { padding: 10 },
    msgRow: { flexDirection: 'row', marginBottom: 10 },
    msgRowMe: { justifyContent: 'flex-end' },
    msgRowThem: { justifyContent: 'flex-start' },
    msgBubble: {
        maxWidth: '75%',
        padding: 10,
        borderRadius: 15,
    },
    bubbleMe: { backgroundColor: '#2563EB', borderBottomRightRadius: 2 },
    bubbleThem: { backgroundColor: '#374151', borderBottomLeftRadius: 2 },
    senderName: { color: '#9CA3AF', fontSize: 10, marginBottom: 4 },
    msgText: { color: 'white', fontSize: 16 },
    media: { width: 200, height: 200, borderRadius: 10, backgroundColor: '#000' },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#1F2937',
        alignItems: 'center'
    },
    attachBtn: { padding: 10, marginRight: 5 },
    attachText: { color: '#3B82F6', fontSize: 24 },
    input: {
        flex: 1,
        backgroundColor: '#374151',
        color: 'white',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10
    },
    sendBtn: { backgroundColor: '#2563EB', padding: 10, borderRadius: 20, paddingHorizontal: 20 },
    sendText: { color: 'white', fontWeight: 'bold' }
});
