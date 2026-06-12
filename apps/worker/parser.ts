 

export class ArtifactProcessor {
    public currentArtifact: string;
    private onFileContent: (
        filePath: string,
        fileContent: string
    ) => void;
    private onShellCommand: (
        shellCommand: string
    ) => void;

    constructor(
        currentArtifact: string,
        onFileContent: (
            filePath: string,
            fileContent: string
        ) => void,
        onShellCommand: (
            shellCommand: string
        ) => void
    ) {
        this.currentArtifact = currentArtifact;
        this.onFileContent = onFileContent;
        this.onShellCommand = onShellCommand;
    }

    append(artifact: string) {
        this.currentArtifact += artifact;
    }

    parse() {
        while (true) {
            const lines = this.currentArtifact.split("\n");

            const latestActionStart = lines.findIndex((line) =>
                line.includes("<boltAction type=")
            );

            const latestActionEnd = lines.findIndex((line) =>
                line.includes("</boltAction>")
            );

            if (latestActionStart === -1 || latestActionEnd === -1) {
                break;
            }

            const actionLine = lines[latestActionStart];

            if (!actionLine || !actionLine.includes("type=")) {
                break;
            }

            const typePart = actionLine.split("type=")[1];

            if (!typePart) {
                break;
            }

            const typePartSplit = typePart.split(" ")[0];
            if (!typePartSplit) {
                break;
            }
            const latestActionType = typePartSplit.split(">")[0];

            const latestActionContent = lines
                .slice(latestActionStart, latestActionEnd + 1)
                .join("\n");

            try {
                if (latestActionType === '"shell"') {
                    let shellCommand = latestActionContent
                        .split("\n")
                        .slice(1)
                        .join("\n");

                    if (shellCommand.includes("</boltAction>")) {
                        shellCommand =
                            shellCommand.split("</boltAction>")[0] ?? "";

                        this.currentArtifact =
                            this.currentArtifact.split(
                                latestActionContent
                            )[1] ?? "";

                        this.onShellCommand(
                            shellCommand.trim()
                        );
                    } else {
                        break;
                    }
                } else if (latestActionType === '"file"') {
                    const filePathPart =
                        actionLine.split("filePath=")[1];

                    if (!filePathPart) {
                        break;
                    }

                    const filePath =
                        filePathPart.split(">")[0];

                    if (!filePath) {
                        break;
                    }

                    let fileContent = latestActionContent
                        .split("\n")
                        .slice(1)
                        .join("\n");

                    if (fileContent.includes("</boltAction>")) {
                        fileContent =
                            fileContent.split("</boltAction>")[0] ?? "";

                        this.currentArtifact =
                            this.currentArtifact.split(
                                latestActionContent
                            )[1] ?? "";

                        const cleanFilePath =
                            filePath.split('"')[1];

                        if (!cleanFilePath) {
                            break;
                        }

                        this.onFileContent(
                            cleanFilePath,
                            fileContent
                        );
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } catch (error) {
                console.error(
                    "Artifact parsing error:",
                    error
                );
                break;
            }
        }
    }
}