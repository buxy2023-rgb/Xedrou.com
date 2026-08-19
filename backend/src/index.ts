import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import entitiesRouter from "./routes/entities";
import authRouter from "./routes/auth";
import integrationsRouter from "./routes/integrations";
import companyAIRouter from "./routes/company-ai";
import aiRouter from "./routes/ai";
import companyPortalRouter from "./routes/company-portal";
import developerRouter from "./routes/developer";
import companyApiRouter from "./routes/company-api";
import companyDomainsRouter from "./routes/company-domains";
import platformUsageRouter from "./routes/platform-usage";
import { attachRealtime } from "./realtime";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "https://xedrou-production-live.vercel.app",
  "https://xedrou-production-live-xedruo-9003s-projects.vercel.app",
  "https://xedrou-production-live-git-main-xedruo-9003s-projects.vercel.app",
  ...configuredOrigins,
  "http://localhost:3000",
]);

app.set("trust proxy", 1);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/entities", entitiesRouter);
app.use("/api/auth", authRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/company-ai", companyAIRouter);
app.use("/api/ai", aiRouter);
app.use("/api/company-portal", companyPortalRouter);
app.use("/api/developer", developerRouter);
app.use("/api/company", companyApiRouter);
app.use("/api/company-domains", companyDomainsRouter);
app.use("/api/platform-usage", platformUsageRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const httpServer = http.createServer(app);
attachRealtime(httpServer);
httpServer.listen(PORT, () => console.log(`Xedruo API (+ realtime) listening on :${PORT}`));
