import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";

dotenv.config();

const corsOptions: cors.CorsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const azureOpenaiKey = process.env.AZURE_OPENAI_KEY as string;
const model = process.env.AZURE_OPENAI_MODEL_ID as string;
const azureOpenaiEndpoint = process.env.AZURE_OPENAI_URL as string;
const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT as string;
const searchKey = process.env.AZURE_SEARCH_KEY as string;
const searchIndex = process.env.AZURE_SEARCH_INDEX as string;

const openaiClient = new OpenAIClient(
  azureOpenaiEndpoint,
  new AzureKeyCredential(azureOpenaiKey)
);

app.get("/", (_, response: Response) => {
  response.sendFile(path.join(process.cwd(), "index.html"));
});

app.post("/chat", async (request: Request, response: Response) => {
  try {
    const chunks = await openaiClient.streamChatCompletions(
      model,
      request.body.messages,
      {
        azureExtensionOptions: {
          extensions: [
            {
              type: "AzureCognitiveSearch",
              endpoint: searchEndpoint,
              key: searchKey,
              indexName: searchIndex,
            },
          ],
        },
      }
    );

    // Set response headers for streaming
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Transfer-Encoding", "chunked");
    response.setHeader("Connection", "keep-alive");

    for await (const chunk of chunks) {
      response.write(JSON.stringify(chunk) + "\n");
    }

    response.end();
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on http://${process.env.HOST}:${process.env.PORT}`);
});
