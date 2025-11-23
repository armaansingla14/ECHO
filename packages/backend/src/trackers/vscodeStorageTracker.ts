import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import chokidar from "chokidar";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function startVSCodeStorageTracker() {
    console.log("Starting VS Code storage tracker...");

    // Find workspaceStorage folder
    const base = path.join(process.env.APPDATA || "", "Code", "User", "workspaceStorage");

    if (!fs.existsSync(base)) {
        console.log("workspaceStorage folder not found.");
        return;
    }

    // Find most recently modified workspace folder
    const folders = fs.readdirSync(base)
        .map(name => ({
            name,
            full: path.join(base, name),
            time: fs.statSync(path.join(base, name)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

    const activeFolder = folders[0];
    const dbPath = path.join(activeFolder.full, "state.vscdb");

    if (!fs.existsSync(dbPath)) {
        console.log("state.vscdb not found.");
        return;
    }

    console.log("Watching VS Code workspace DB:", dbPath);

    const watcher = chokidar.watch(dbPath, { ignoreInitial: true });

    watcher.on("change", async () => {
        try {
            const file = await readActiveFile(dbPath);
            if (file) {
                await prisma.event.create({
                    data: {
                        timestamp: new Date(),
                        source: "vscode",
                        type: "editor_changed",
                        text: `Active file: ${file}`,
                        meta: JSON.stringify({ file })
                    }
                });

                console.log("Logged active file:", file);
            }
        } catch (err) {
            console.error("Error reading VS Code DB:", err);
        }
    });
}

async function readActiveFile(dbPath: string): Promise<string | null> {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        const row = await db.get(
            `SELECT value FROM ItemTable WHERE key = 'workbench.editor.activeEditor'`
        );

        if (!row?.value) return null;

        // Row contains JSON with file URI inside
        const parsed = JSON.parse(row.value);
        if (!parsed?.resource) return null;

        return parsed.resource; // returns something like: "file:///c:/Users/.../index.ts"
    } catch {
        return null;
    } finally {
        await db.close();
    }
}
