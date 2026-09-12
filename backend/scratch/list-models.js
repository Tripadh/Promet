import "dotenv/config";

async function listModels() {
  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log(await response.text());
      return;
    }
    
    const data = await response.json();
    console.log(JSON.stringify(data.data.map(m => m.id), null, 2));
  } catch (error) {
    console.error(error);
  }
}

listModels();
