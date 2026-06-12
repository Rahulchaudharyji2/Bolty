import { prismaClient } from "db/client";
import { RelayWebsocket } from "./ws";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

import { NEXTJS_BOILERPLATE, REACT_BOILERPLATE, REACT_NATIVE_BOILERPLATE } from "./templates";

export function createProjectDir(projectId: string, type?: "NEXTJS" | "REACT_NATIVE" | "REACT") {
    const projectsDir = process.env.PROJECTS_DIR || "/tmp/projects";
    const projectDir = path.join(projectsDir, projectId);
    fs.mkdirSync(projectDir, { recursive: true });

    if (type) {
        let filesToWrite = null;
        if (type === "NEXTJS") {
            filesToWrite = NEXTJS_BOILERPLATE;
        } else if (type === "REACT") {
            filesToWrite = REACT_BOILERPLATE;
        } else if (type === "REACT_NATIVE") {
            filesToWrite = REACT_NATIVE_BOILERPLATE;
        }

        if (filesToWrite) {
            for (const file of filesToWrite) {
                const fullPath = path.join(projectDir, file.path);
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                    fs.writeFileSync(fullPath, file.content, "utf-8");
                }
            }
        }
    }
}

function getBaseWorkerDir(type: "NEXTJS" | "REACT_NATIVE", projectId: string) {
    const projectsDir = process.env.PROJECTS_DIR || "/tmp/projects";
    return path.join(projectsDir, projectId);
}

export async function onFileUpdate(filePath: string, fileContent: string, projectId: string, promptId: string, type: "NEXTJS" | "REACT_NATIVE") {
    const projectDir = getBaseWorkerDir(type, projectId);
    const fullPath = path.join(projectDir, filePath);
    
    
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    
    
    fs.writeFileSync(fullPath, fileContent, "utf-8");

    await prismaClient.action.create({
        data: {
            projectId,
            promptId,
            content: `Updated file ${filePath}`
        },
    });

    RelayWebsocket.getInstance().send(JSON.stringify({
        event: "admin",
        data: {
            type: "update-file",
            content: fileContent,
            path: fullPath
        }
    }));
}

export async function onShellCommand(shellCommand: string, projectId: string, promptId: string) {
    const projectDir = getBaseWorkerDir("NEXTJS", projectId);
    
    fs.mkdirSync(projectDir, { recursive: true });

    const commands = shellCommand.split("&&");
    for (const command of commands) {
        const trimmedCommand = command.trim();
        if (!trimmedCommand) continue;

        console.log(`Running command: ${trimmedCommand} in ${projectDir}`);

        const success = await new Promise<boolean>((resolve) => {
            const child = exec(trimmedCommand, { cwd: projectDir });
            
            child.stdout?.on("data", (data) => console.log(`[shellout]: ${data}`));
            child.stderr?.on("data", (data) => console.error(`[shellerr]: ${data}`));

            RelayWebsocket.getInstance().send(JSON.stringify({
                event: "admin",
                data: {
                    type: "command",
                    content: trimmedCommand
                }
            }));

            prismaClient.action.create({
                data: {
                    projectId,
                    promptId,
                    content: `Ran command: ${trimmedCommand}`,
                },
            }).catch(err => console.error("Prisma action create error:", err));

            child.on("close", (code) => {
                console.log(`Command '${trimmedCommand}' exited with code ${code}`);
                resolve(code === 0);
            });

            child.on("error", (err) => {
                console.error(`Command '${trimmedCommand}' failed to start:`, err);
                resolve(false);
            });
        });

        if (!success) {
            console.log(`Command failed, stopping execution of subsequent chained commands.`);
            break;
        }
    }
}

export function onPromptEnd(promptId: string) {
    RelayWebsocket.getInstance().send(JSON.stringify({
        event: "admin",
        data: {
            type: "prompt-end"
        }
    }));
}