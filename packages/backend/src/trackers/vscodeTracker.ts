import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function startVSCodeTracker() {
    console.log("Starting VS Code tracker...");

    const base = path.join(process.env.APPDATA || "", "Code", "logs");

    if (!fs.existsSync(base)) {
        console.log("VS Code logs not found. Tracker disabled.");
        return;
    }

    const logFolders = fs.readdirSync(base).sort().reverse();
    const latest = logFolders[0];

    const latestFolder = path.join(base, latest);

    // search ALL window folders: window1, window2, window3...
    const windowDirs = fs.readdirSync(latestFolder)
        .filter(f => f.startsWith("window"));

    const possibleLogs: string[] = [];

    for (const w of windowDirs) {
        possibleLogs.push(path.join(latestFolder, w, "renderer.log"));
        possibleLogs.push(path.join(latestFolder, w, "renderer1.log"));
    }

    const logPath = possibleLogs.find(p => fs.existsSync(p));

    if (!logPath) {
        console.log("VS Code log file not found. Tracker disabled.");
        return;
    }

    console.log("Watching:", logPath);

    const watcher = chokidar.watch(logPath, { ignoreInitial: true });

    watcher.on("change", () => {
        const data = fs.readFileSync(logPath, "utf8");
        const lines = data.split("\n");
        const last = lines[lines.length - 2];

        if (!last) return;

        handleLogLine(last);
    });
}

async function handleLogLine(line: string) {
    const now = new Date();

    try {
        if (line.includes("File Opened")) {
            const file = extract(line);
            await prisma.event.create({
                data: {
                    timestamp: now,
                    source: "vscode",
                    type: "file_opened",
                    text: `Opened ${file}`,
                    meta: JSON.stringify({ file })
                }
            });
            console.log("Logged VS Code event: file_opened", file);
        }

        if (line.includes("Active Editor Changed")) {
            const file = extract(line);
            await prisma.event.create({
                data: {
                    timestamp: now,
                    source: "vscode",
                    type: "editor_changed",
                    text: `Active editor is now ${file}`,
                    meta: JSON.stringify({ file })
                }
            });
            console.log("Logged VS Code event: editor_changed", file);
        }
    } catch (err) {
        console.log("Prisma write error:", err);
    }
}

function extract(line: string): string {
    const match = line.match(/\] (.*)$/);
    return match ? match[1] : "Unknown file";
}
