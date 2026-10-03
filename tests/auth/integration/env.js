import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.DB_NAME = process.env.DB_TEST_NAME || "POSSystem_test";