import Pusher from "pusher";

let pusherInstance: Pusher | null = null;

export function getPusher() {
  if (pusherInstance) {
    return pusherInstance;
  }

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    console.warn("Pusher credentials are missing. Realtime notifications will be disabled.");
    return null;
  }

  pusherInstance = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });

  return pusherInstance;
}






