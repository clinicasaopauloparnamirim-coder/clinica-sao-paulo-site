import { DurableObject } from "cloudflare:workers";

export type WhatsAppEvent = {
  received_at: string;
  event_type: "message" | "status" | "unknown";
  phone_number_id?: string;
  display_phone_number?: string;
  wa_id?: string;
  message_id?: string;
  timestamp?: string;
  message_type?: string;
  text?: string;
  ctwa_clid?: string;
  source_url?: string;
};

export class WhatsAppEvents extends DurableObject {
  private async readEvents(): Promise<WhatsAppEvent[]> {
    const row = await this.ctx.storage.get<WhatsAppEvent[]>("events");
    return row || [];
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/events") {
      const events = await this.readEvents();
      return Response.json({ ok: true, count: events.length, events });
    }

    if (request.method === "POST" && url.pathname === "/events") {
      const event = (await request.json()) as WhatsAppEvent;
      const events = await this.readEvents();
      events.push(event);
      await this.ctx.storage.put("events", events.slice(-200));
      return Response.json({ ok: true });
    }

    return new Response("Not Found", { status: 404 });
  }
}
