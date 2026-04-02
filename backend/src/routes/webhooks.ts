import { Router } from "express";
import { Webhook } from "svix";
import express from "express";
import { User } from "../models/User";

const router = Router();

router.post("/clerk", express.raw({ type: "application/json" }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error('Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const wh = new Webhook(SIGNING_SECRET);

  const headers = req.headers;
  // req.body should be a Buffer because of express.raw Middleware
  const payload = req.body; 

  const svix_id = headers['svix-id'] as string;
  const svix_timestamp = headers['svix-timestamp'] as string;
  const svix_signature = headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error: Missing svix headers' });
  }

  let evt: any;
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err: any) {
    console.error('Error: Could not verify webhook:', err.message);
    return res.status(400).json({ error: err.message });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`[Clerk Webhook] Received event: ${eventType} for user ${id}`);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { email_addresses, username, first_name, last_name, image_url, public_metadata } = evt.data;
    
    let primaryEmail = "";
    if (email_addresses && email_addresses.length > 0) {
        primaryEmail = email_addresses.find((e: any) => e.id === evt.data.primary_email_address_id)?.email_address || email_addresses[0].email_address;
    }

    const fullName = [first_name, last_name].filter(Boolean).join(" ") || username || 'User';

    const updateData: any = {
      clerkId: id,
      email: primaryEmail,
      username: username || primaryEmail.split('@')[0],
      fullName,
      imageUrl: image_url,
      bio: public_metadata?.bio || null,
      location: public_metadata?.location || null,
    };

    if (public_metadata?.coverImage) {
        updateData.coverImage = public_metadata.coverImage;
    }
    
    try {
        await User.findOneAndUpdate({ clerkId: id }, { $set: updateData }, { upsert: true, new: true });
        console.log(`[Clerk Webhook] Successfully synced user ${id} to database`);
    } catch (dbErr) {
        console.error("[Clerk Webhook] Database sync error:", dbErr);
    }
  } else if (eventType === 'user.deleted') {
    try {
        await User.findOneAndDelete({ clerkId: id });
        console.log(`[Clerk Webhook] Successfully deleted user ${id} from database`);
    } catch (dbErr) {
        console.error("[Clerk Webhook] Database sync error (delete):", dbErr);
    }
  }

  return res.status(200).json({ success: true, message: 'Webhook processed' });
});

export default router;
