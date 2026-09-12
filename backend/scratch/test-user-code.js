import OpenAI from 'openai';
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

const models = [
  "deepseek-ai/deepseek-v4-flash-0731",
  "deepseek-ai/deepseek-v4-pro-0813",
  "moonshotai/kimi-k3"
];

async function main() {
  const prompt = "Explain the theory of relativity in exactly two sentences.";
  
  for (const model of models) {
    console.log(`\n========================================`);
    console.log(`Testing Model: ${model}`);
    console.log(`========================================`);
    
    console.time(`Time taken (${model})`);
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [{"role":"user","content": prompt}],
        temperature: 0.5,
        max_tokens: 1024,
      });
      
      const content = completion.choices[0]?.message?.content || '';
      console.timeEnd(`Time taken (${model})`);
      console.log(`Output length: ${content.length} characters`);
      console.log(`Output: ${content}`);
    } catch (e) {
      console.timeEnd(`Time taken (${model})`);
      console.error(`Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
