import {prismaClient} from "db/client";
import express from "express";
import cors from "cors";
import {redisClient} from "@repo/redis/client";
import { authMiddleware } from "./middleware";
const app = express();
app.use(cors());
app.use(express.json());

app.post("/project",authMiddleware,  async (req,res)=>{
   const {prompt } = req.body;
   const userId= req.userId!;
   const description = prompt.split('\n')[0];
   const Project = await prismaClient.project.create({
     data: {
       description,userId
     }
   });

   
   fetch("http://worker:9091/prompt", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       prompt,
       projectId: Project.id,
     }),
   }).catch((err) => {
     console.error("Failed to trigger worker on project creation:", err);
   });

   res.json({projectId: Project.id});
});

app.post("/prompt", authMiddleware, async (req, res) => {
  const { prompt, projectId } = req.body;
  if (!prompt || !projectId) {
    return res.status(400).json({ error: "prompt and projectId are required" });
  }

  
  fetch("http://worker:9091/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      projectId,
    }),
  }).catch((err) => {
    console.error("Failed to trigger worker for follow-up prompt:", err);
  });

  res.json({ success: true });
});

app.get("/projects", authMiddleware, async (req,res)=>{
   const userId= req.userId
   const projects = await prismaClient.project.findMany({
     where: {
       userId
     }
   });
   res.json(projects);
});     

app.get("/prompts/:projectId", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const projectId = req.params.projectId as string;
try{
  
  const prompts = await prismaClient.prompt.findMany({
    where: {  projectId: projectId, },
    include: {
      actions: true,
    },
  });
  res.json({ prompts });
}catch(error){
  console.error("Error fetching prompts:", error);
  res.status(500).json({ error: "Failed to fetch prompts" });
}
});

app.listen(3000,()=>{
   console.log("Server is running on port 3000");
});