import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

const API_URL = API_BASE_URL;

export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    senderType: 'user' | 'company';
    content: string;
    read: boolean;
    createdAt: string;
}

export interface Conversation {
    _id: string;
    userId: string;
    companyId: {
        _id: string;
        name: string;
        logo: string;
    };
    tripId?: {
        _id: string;
        title: string;
        slug: string;
    };
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    user?: { // If fetched as company
        fullName: string;
        imageUrl: string;
    };
}

export const chatService = {
    // Start or get conversation
    async startChat(companyId: string, tripId?: string, token?: string): Promise<Conversation> {
        const response = await axios.post(
            `${API_URL}/api/chat/start`,
            { companyId, tripId },
            {
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    },

    // Get conversations
    async getConversations(token?: string, asCompany: boolean = false): Promise<Conversation[]> {
        const response = await axios.get(`${API_URL}/api/chat/conversations`, {
            params: { asCompany },
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    // Get messages
    async getMessages(conversationId: string, token?: string): Promise<Message[]> {
        const response = await axios.get(`${API_URL}/api/chat/${conversationId}/messages`, {
            headers: getAuthHeaders(token),
            withCredentials: true
        });
        return response.data;
    },

    // Send message
    async sendMessage(conversationId: string, content: string, senderType: 'user' | 'company', token?: string): Promise<Message> {
        const response = await axios.post(
            `${API_URL}/api/chat/${conversationId}/messages`,
            { content, senderType },
            {
                headers: getAuthHeaders(token),
                withCredentials: true
            }
        );
        return response.data;
    }
};
