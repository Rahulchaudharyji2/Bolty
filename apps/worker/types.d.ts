export type VscodeMessagePayload = {
    event: "vscode_diff";
    diff: string;
    callbackId: string;
}