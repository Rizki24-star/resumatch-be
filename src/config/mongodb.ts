import mongoose from "mongoose";

// Global connection promise to avoid multiple connection attempts
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectMongoDB = async (): Promise<boolean> => {
  try {
    // If already connected, return true
    if (mongoose.connection.readyState === (1 as any)) {
      console.log("MongoDB already connected");
      return true;
    }

    // If connection is in progress, wait for it
    if (connectionPromise) {
      console.log("Waiting for existing connection attempt...");
      await connectionPromise;
      return mongoose.connection.readyState === (1 as any);
    }

    console.log("Attempting MongoDB connection...");
    console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);
    console.log(
      "MongoDB URI starts with:",
      process.env.MONGODB_URI?.substring(0, 20)
    );

    // Serverless-optimized connection options
    const options = {
      serverSelectionTimeoutMS: 30000, // Increased timeout for Atlas
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 3, // Further reduced for serverless
      minPoolSize: 0, // Allow pool to shrink to 0
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: false, // Disable retries for serverless
      retryReads: false, // Disable retries for serverless
      connectTimeoutMS: 10000, // Connection timeout
    };

    console.log("Connection options:", options);

    connectionPromise = mongoose.connect(process.env.MONGODB_URI!, options);

    const result = await connectionPromise;
    connectionPromise = null;

    console.log("✅ MongoDB Atlas connected successfully");
    console.log("Connection readyState:", mongoose.connection.readyState);
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      code: error instanceof Error && "code" in error ? error.code : "Unknown",
    });
    connectionPromise = null;
    return false;
  }
};

// Lazy connection - connect only when needed
export const ensureMongoDBConnection = async (): Promise<boolean> => {
  return await connectMongoDB();
};

// Check if MongoDB is connected
export const isMongoDBConnected = (): boolean => {
  return mongoose.connection.readyState === (1 as any);
};
