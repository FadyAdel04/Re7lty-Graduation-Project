export function toAbsoluteUrl(input: string | undefined | null, req: any): string | undefined {
  if (!input) return undefined;
  const val = String(input);
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) {
    return val;
  }
  const path = val.startsWith('/') ? val : `/${val}`;
  const protocol = (req?.headers?.['x-forwarded-proto'] as string) || req?.protocol || 'http';
  const host = (req?.headers?.['x-forwarded-host'] as string) || req?.get?.('host');
  if (!host) return val;
  return `${protocol}://${host}${path}`;
}

export function formatComment(raw: any, viewerId?: string) {
  if (!raw) return raw;
  const plain = typeof raw.toObject === 'function' ? raw.toObject() : raw;
  const likedBy: string[] = Array.isArray(plain?.likedBy) ? plain.likedBy : [];
  const { likedBy: _discard, _id, ...rest } = plain;
  return {
    ...rest,
    id: _id ? String(_id) : rest.id,
    viewerHasLiked: viewerId ? likedBy.includes(viewerId) : false,
  };
}

export function formatTripMedia(trip: any, req: any, viewerId?: string) {
  if (!trip) return trip;
  const plain = typeof trip.toObject === 'function' ? trip.toObject() : trip;

  const image = toAbsoluteUrl(plain.image, req) || plain.image;

  const activities = Array.isArray(plain.activities)
    ? plain.activities.map((act: any) => ({
      ...act,
      images: Array.isArray(act?.images)
        ? act.images.map((img: string) => toAbsoluteUrl(img, req) || img)
        : [],
      videos: Array.isArray(act?.videos)
        ? act.videos.map((vid: string) => toAbsoluteUrl(vid, req) || vid)
        : [],
    }))
    : [];

  const foodAndRestaurants = Array.isArray(plain.foodAndRestaurants)
    ? plain.foodAndRestaurants.map((f: any) => ({
      ...f,
      image: toAbsoluteUrl(f?.image, req) || f?.image,
    }))
    : [];

  const comments = Array.isArray(plain.comments)
    ? plain.comments.map((c: any) =>
      formatComment(
        {
          ...c,
          authorAvatar: toAbsoluteUrl(c?.authorAvatar, req) || c?.authorAvatar,
        },
        viewerId
      )
    )
    : [];

  const hotels = Array.isArray(plain.hotels)
    ? plain.hotels.map((h: any) => ({
      ...h,
      image: toAbsoluteUrl(h?.image, req) || h?.image,
    }))
    : [];

  return {
    ...plain,
    image,
    activities,
    foodAndRestaurants,
    hotels,
    comments,
  };
}

// Batch format trips with user data population
export async function formatTripsWithUserData(trips: any[], req: any, viewerId?: string) {
  if (!Array.isArray(trips) || trips.length === 0) return [];

  // Import User model dynamically to avoid circular dependencies
  const { User } = await import('../models/User');

  // Extract unique owner IDs
  const ownerIds = [...new Set(trips.map(t => t?.ownerId).filter(Boolean))];

  // Fetch all users in one query
  const users = await User.find({ clerkId: { $in: ownerIds } }).select('clerkId fullName imageUrl badgeLevel');
  const userMap = new Map(users.map((u: any) => [u.clerkId, u]));

  // Format each trip with media URLs and user data
  return trips.map(trip => {
    const formatted = formatTripMedia(trip, req, viewerId);
    const user = userMap.get(trip?.ownerId);

    return {
      ...formatted,
      // Populate with current user data from MongoDB
      author: user?.fullName || formatted.author || 'مستخدم',
      authorImage: user?.imageUrl || undefined,
      authorBadge: user?.badgeLevel || 'none',
    };
  });
}

















