// scripts/test-supabase.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Log environment variables (without showing full keys)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl || "Not set");
console.log("Anon Key:", anonKey ? `${anonKey.substring(0, 10)}...` : "Not set");

if (!supabaseUrl || !anonKey) {
  console.error("Error: Supabase URL or Anon Key is missing in .env.local");
  process.exit(1);
}

// Create a Supabase client with the anon key
const supabase = createClient(supabaseUrl, anonKey);

async function testConnection() {
  try {
    console.log("Testing connection to Supabase...");

    // Try to get the service status
    let data, error;
    try {
      const response = await supabase.from("_test_connection").select("*").limit(1);
      data = response.data;
      error = response.error;
    } catch (err) {
      error = err;
    }

    if (error) {
      if (error.message && error.message.includes("ENOTFOUND")) {
        console.error(
          "Error: Could not connect to Supabase. Please check your internet connection and Supabase URL."
        );
        console.error(`The URL "${supabaseUrl}" could not be resolved.`);
        console.error("If you are using a test project, make sure it exists and is active.");
      } else if (error.message && error.message.includes("does not exist")) {
        // This is actually a good sign - we connected to the database but the test table doesn't exist
        console.log("✅ Successfully connected to Supabase!");
        console.log(
          "The error about a missing table is expected and indicates the connection works."
        );
      } else {
        console.error("Error connecting to Supabase:", error.message);
      }
    } else {
      console.log("✅ Successfully connected to Supabase!");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testConnection();
