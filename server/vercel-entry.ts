import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app";

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
