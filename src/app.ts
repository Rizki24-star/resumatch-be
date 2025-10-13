import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import mongoose from "mongoose";
import { connectMongoDB } from "./config/mongodb.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import resumeRouter from "./routes/resume.route.js";
import authRouter from "./routes/auth.route.js";
import "dotenv/config";

// Initialize app asynchronously
async function initializeApp() {
  console.log("🚀 Starting app initialization...");
  console.log("Node environment:", process.env.NODE_ENV || "not set");
  console.log("Current working directory:", process.cwd());

  // Check environment variables
  const requiredEnvVars = [
    "MONGODB_URI",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "JWT_SECRET",
  ];

  console.log("🔍 Checking environment variables...");
  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(
        `✅ ${varName}: Set (${
          varName === "MONGODB_URI" ? "MongoDB URI configured" : "configured"
        })`
      );
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });

  try {
    console.log("📦 Loading Cloudinary config...");
    await import("./config/cloudinary.js");
    console.log("✅ Cloudinary config loaded successfully");
  } catch (error) {
    console.error("❌ Error loading cloudinary config:", error);
  }
}

const app: Application = express();

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Global error handler:", error);
  res
    .status(500)
    .json({ error: "Internal server error", message: error.message });
});

// Middlewares
try {
  console.log("🔧 Setting up middlewares...");
  app.use(cors());
  app.use(helmet());
  app.use(express.json({ limit: "10mb" }));
  app.use(morgan("dev"));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  console.log("✅ Middlewares configured");
} catch (error) {
  console.error("❌ Error setting up middlewares:", error);
}

// Initialize app - MongoDB connection will be lazy-loaded on first request
initializeApp()
  .then(() => {
    console.log(
      "✅ App initialization completed - MongoDB will connect on first request"
    );
  })
  .catch((error) => {
    console.error("❌ App initialization failed:", error);
  });

// Export connection status for health checks
export const getConnectionStatus = async () => {
  console.log("🔍 Checking connection status...");

  // Always try to connect for health check (lazy loading)
  let mongodbConnected = false;
  try {
    console.log("Attempting MongoDB connection for health check...");
    const { ensureMongoDBConnection } = await import("./config/mongodb.js");
    mongodbConnected = await ensureMongoDBConnection();
    console.log("Health check MongoDB result:", mongodbConnected);
  } catch (error) {
    console.error("❌ Health check MongoDB connection failed:", error);
    mongodbConnected = false;
  }

  const cloudinaryConfigured = !!process.env.CLOUDINARY_CLOUD_NAME;
  console.log("Cloudinary configured:", cloudinaryConfigured);

  const result = {
    mongodb: mongodbConnected,
    cloudinary: cloudinaryConfigured,
  };

  console.log("Final connection status:", result);
  return result;
};

app.get("/", async (req: Request, res: Response) => {
  console.log("Root route accessed");
  const status = await getConnectionStatus();
  res.json({
    message: "Hello from Express + TypeScript + pnpm!",
    status,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  const status = await getConnectionStatus();
  const isHealthy = status.mongodb && status.cloudinary;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    services: status,
    timestamp: new Date().toISOString(),
  });
});

console.log("Setting up routes...");
try {
  app.use("/api/resume", resumeRouter);
  console.log("Resume routes loaded");
} catch (error) {
  console.error("Error loading resume routes:", error);
}

try {
  app.use("/api/user-auth", authRouter);
  console.log("Auth routes loaded");
} catch (error) {
  console.error("Error loading auth routes:", error);
}

export default app;
