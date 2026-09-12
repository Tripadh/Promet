import "dotenv/config";
import { improvePromptWithAI } from "../src/services/aiService.js";

const TEST_PROMPT = "write me a python script to download a webpage";

const runTests = async () => {
  console.log("==================================================");
  console.log("🚀 TESTING PROMET AI PROMPT IMPROVEMENT MODES 🚀");
  console.log("==================================================");
  console.log(`\n[ORIGINAL USER PROMPT]:\n"${TEST_PROMPT}"\n`);

  const modes = ["quick", "balanced", "auto", "expert"];

  for (const mode of modes) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing Mode: [${mode.toUpperCase()}]`);
    console.log(`--------------------------------------------------`);
    
    try {
      console.time(`${mode} Generation Time`);
      // We pass 'false' for isRetry, null for store, null for domain, and null for signal
      const improved = await improvePromptWithAI(TEST_PROMPT, mode, false, null, null, null);
      console.timeEnd(`${mode} Generation Time`);
      
      console.log(`\n[IMPROVED OUTPUT]:\n${improved}`);
    } catch (error) {
      console.error(`\n[ERROR IN ${mode.toUpperCase()}]:`, error.message);
    }
  }
};

runTests();
