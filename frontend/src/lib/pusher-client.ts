import Pusher from "pusher-js";

export function createPusherClient(key?: string, cluster?: string) {
  if (!key || !cluster) {
    return null;
  }

  const client = new Pusher(key, {
    cluster,
  });

  return client;
}


