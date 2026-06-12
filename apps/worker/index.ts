
import cors from "cors";
import express from "express";
import { prismaClient } from "db/client";
import { GoogleGenAI } from "@google/genai";

import { systemPrompt } from "./systemPrompt";
import { ArtifactProcessor } from "./parser";
import { createProjectDir, onFileUpdate, onPromptEnd, onShellCommand } from "./os";
import { RelayWebsocket } from "./ws";

const app = express();

app.use(cors());
app.use(express.json());
console.log("api key is", process.env.GEMINI_API_KEY);

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

app.post("/prompt", async (req, res) => {
  try {
    const { prompt, projectId } = req.body;

    const project = await prismaClient.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    createProjectDir(projectId, project.type as "NEXTJS" | "REACT_NATIVE" | "REACT");

    const promptDb = await prismaClient.prompt.create({
      data: {
        content: prompt,
        projectId: projectId,
        type: "USER",
      },
    });

    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    

    const allPrompts = await prismaClient.prompt.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    let artifact = "";

    const artifactProcessor = new ArtifactProcessor(
      "",
      (filePath, fileContent) =>
        onFileUpdate(
          filePath,
          fileContent,
          projectId,
          promptDb.id,
          project.type as "NEXTJS" | "REACT_NATIVE"
        ),
      (shellCommand) =>
        onShellCommand(
          shellCommand,
          projectId,
          promptDb.id
        )
    );

    let stream;
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        stream = await client.models.generateContentStream({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

          contents: allPrompts.map((p: any) => ({
            role: p.type === "USER" ? "user" : "model",
            parts: [
              {
                text: p.content,
              },
            ],
          })),

          config: {
            systemInstruction: systemPrompt(project.type),
            maxOutputTokens: 8000,
            temperature: 0.2,
          },
        });
        break;
      } catch (err: any) {
        retries--;
        console.error(`Gemini API call failed (retries left: ${retries}):`, err.message || err);
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    for await (const chunk of stream) {
      const text = chunk.text || "";

      artifact += text;

      artifactProcessor.append(text);
      artifactProcessor.parse();
    }

    await prismaClient.prompt.create({
      data: {
        content: artifact,
        projectId: projectId,
        type: "SYSTEM",
      },
    });

    await prismaClient.action.create({
      data: {
        content: "Done!",
        projectId,
        promptId: promptDb.id,
      },
    });

    onPromptEnd(promptDb.id);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(9091, () => {
  console.log("Server running on port 9091");
});
