import Pusher from "pusher-js";

export function createPusherClient(
  key: string = import.meta.env.VITE_PUSHER_KEY,
  cluster: string = import.meta.env.VITE_PUSHER_CLUSTER
) {
  if (!key || !cluster) {
    console.warn("Pusher key or cluster missing");
    return null;
  }

  const client = new Pusher(key, {
    cluster,
  });

  return client;
}


