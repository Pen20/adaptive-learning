import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  const eventType = evt.type;

  // --- 1. USER CREATED ---
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    const email = email_addresses[0]?.email_address;

    await fetchMutation(api.users.createUser, {
      userId: id,
      email: email || "",
      firstName: first_name || "",
      surname: last_name || "",
      birthDay: "", // Handled via profile setup later
      institutionName: (public_metadata as { institution?: string })?.institution || "",
    });
  }

  // --- 2. USER UPDATED ---
  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    const email = email_addresses[0]?.email_address;

    await fetchMutation(api.users.updateUser, {
      userId: id,
      email: email || "",
      firstName: first_name || "",
      surname: last_name || "",
      institutionName: (public_metadata as { institution?: string })?.institution || "",
    });
  }

  // --- 3. USER DELETED ---
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    // Clerk sends the ID of the deleted user. 
    // We clean up their profile to maintain database hygiene.
    if (id) {
      await fetchMutation(api.users.deleteUser, { userId: id });
    }
  }

  return new Response("Webhook processed", { status: 200 });
}