const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/trip-groups";

export async function getTripGroups(token: string) {
    const res = await fetch(`${API_BASE}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch trip groups');
    return res.json();
}

export async function getTripGroupMessages(groupId: string, token: string) {
    const res = await fetch(`${API_BASE}/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
}

export async function getTripGroupParticipants(groupId: string, token: string) {
    const res = await fetch(`${API_BASE}/${groupId}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch participants');
    return res.json();
}

export async function sendTripGroupMessage(groupId: string, payload: any, token: string) {
    const res = await fetch(`${API_BASE}/${groupId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
}

export async function pinGroupMessage(groupId: string, messageId: string, token: string) {
    const res = await fetch(`${API_BASE}/${groupId}/pin/${messageId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
}

export async function toggleGroupLock(groupId: string, token: string) {
    const res = await fetch(`${API_BASE}/${groupId}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
}

export async function markTripGroupRead(groupId: string, token: string) {
    const res = await fetch(`${API_BASE}/${groupId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to mark read');
    return res.json();
}

export async function toggleGroupMessageReaction(messageId: string, emoji: string, token: string) {
    const res = await fetch(`${API_BASE}/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
    });
    if (!res.ok) throw new Error('Failed to toggle reaction');
    return res.json();
}
