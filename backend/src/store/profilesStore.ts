import { clerkClient } from "../utils/auth";

export interface Profile {
  userId: string;
  username?: string | null;
  fullName?: string | null;
  bio?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  coverImage?: string | null;
  stats?: { trips: number; followers: number; following: number; likes: number };
}

class ProfilesStore {
  private map = new Map<string, Profile>();

  async getOrHydrateFromClerk(userId: string): Promise<Profile> {
    let p = this.map.get(userId);
    if (p) return p;
    const user = await clerkClient.users.getUser(userId);
    p = {
      userId,
      username: user.username,
      fullName: user.fullName || user.firstName || user.username,
      bio: (user.publicMetadata as any)?.bio || null,
      location: (user.publicMetadata as any)?.location || null,
      imageUrl: user.imageUrl,
      coverImage: (user.publicMetadata as any)?.coverImage || null,
      stats: { trips: 0, followers: 0, following: 0, likes: 0 },
    };
    this.map.set(userId, p);
    return p;
  }

  async update(userId: string, changes: Partial<Profile>): Promise<Profile> {
    const current = await this.getOrHydrateFromClerk(userId);
    const next: Profile = { ...current, ...changes };
    // Persist to Clerk public metadata where applicable
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...(current.bio ? { bio: current.bio } : {}),
        ...(current.location ? { location: current.location } : {}),
        ...(current.coverImage ? { coverImage: current.coverImage } : {}),
        ...(changes.bio !== undefined ? { bio: changes.bio } : {}),
        ...(changes.location !== undefined ? { location: changes.location } : {}),
        ...(changes.coverImage !== undefined ? { coverImage: changes.coverImage } : {}),
      },
    });
    this.map.set(userId, next);
    return next;
  }

  async getByUsername(username: string): Promise<Profile | null> {
    // Try local cache first
    for (const p of this.map.values()) {
      if (p.username?.toLowerCase() === username.toLowerCase()) return p;
    }
    // Fallback to Clerk search
    const list = await clerkClient.users.getUserList({ username: [username] });
    if (list?.data?.length) {
      const u = list.data[0];
      return {
        userId: u.id,
        username: u.username,
        fullName: u.fullName || u.firstName || u.username,
        bio: (u.publicMetadata as any)?.bio || null,
        location: (u.publicMetadata as any)?.location || null,
        imageUrl: u.imageUrl,
        coverImage: (u.publicMetadata as any)?.coverImage || null,
        stats: { trips: 0, followers: 0, following: 0, likes: 0 },
      };
    }
    return null;
  }
}

export const profilesStore = new ProfilesStore();


