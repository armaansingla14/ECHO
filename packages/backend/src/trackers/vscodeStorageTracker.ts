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
  let base = "";
  if (process.platform === "darwin") {
    base = path.join(
      process.env.HOME || "",
      "Library",
      "Application Support",
      "Code",
      "User",
      "workspaceStorage"
    );
  } else {
    base = path.join(
      process.env.APPDATA || "",
      "Code",
      "User",
      "workspaceStorage"
    );
  }

  if (!fs.existsSync(base)) {
    console.log("workspaceStorage folder not found:", base);
    return;
  }

  console.log("workspaceStorage base:", base);

  // Find most recently modified workspace folder
  const folders = fs
    .readdirSync(base)
    .map((name) => ({
      name,
      full: path.join(base, name),
      time: fs.statSync(path.join(base, name)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  if (!folders || folders.length === 0) {
    console.log(
      "No workspaceStorage folders found. Will watch base folder for additions."
    );

    const baseWatcher = chokidar.watch(base, { ignoreInitial: true });
    baseWatcher.on("addDir", (_p) => {
      console.log(
        "New workspaceStorage folder added. Re-attempting tracker setup."
      );
      // Re-run setup (best-effort)
      startVSCodeStorageTracker().catch((err) =>
        console.error("Re-start error:", err)
      );
    });

    return;
  }

  const activeFolder = folders[0];
  const dbPath = path.join(activeFolder.full, "state.vscdb");

  console.log("Selected workspace folder:", activeFolder.name);
  console.log("Looking for DB at:", dbPath);

  if (!fs.existsSync(dbPath)) {
    console.log(
      "state.vscdb not found in selected folder. Watching folder for DB file."
    );

    const folderWatcher = chokidar.watch(activeFolder.full, {
      ignoreInitial: true,
    });
    folderWatcher.on("add", (p) => {
      if (path.basename(p) === "state.vscdb") {
        console.log("state.vscdb created, starting watch on it:", p);
        watchDbAndProcess(p);
      }
    });

    return;
  }

  console.log("Watching VS Code workspace DB:", dbPath);
  watchDbAndProcess(dbPath);
}

function watchDbAndProcess(dbPath: string) {
  const watcher = chokidar.watch(dbPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  });

  watcher.on("change", async () => {
    try {
      const st = fs.statSync(dbPath);
      console.log(
        `DB change detected. size=${st.size} mtime=${st.mtime.toISOString()}`
      );
    } catch (err) {
      console.log("DB change detected (stat failed):", err);
    }
    try {
      const file = await processDbChange(dbPath);
      if (file) {
        await prisma.event.create({
          data: {
            timestamp: new Date(),
            source: "vscode",
            type: "editor_changed",
            text: `Active file: ${file}`,
            meta: JSON.stringify({ file }),
          },
        });

        console.log("Logged active file:", file);
      } else {
        console.log("No active file found in DB change.");
      }
    } catch (err) {
      console.error("Error processing VS Code DB change:", err);
    }
  });
}

async function processDbChange(dbPath: string): Promise<string | null> {
  // Copy DB to a temporary file to avoid locks from VS Code
  const tmpPath = dbPath + ".copy";

  try {
    fs.copyFileSync(dbPath, tmpPath);
  } catch (err) {
    console.error("Failed to copy DB for safe read:", err);
    // fallback: try reading original (may fail if locked)
    return await readActiveFile(dbPath);
  }

  try {
    const file = await readActiveFile(tmpPath);
    return file;
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}

async function readActiveFile(dbPath: string): Promise<string | null> {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    // Try specific key first, then fallback to LIKE search for keys mentioning activeEditor
    let row: any | undefined = undefined;

    try {
      row = await db.get(
        `SELECT value FROM ItemTable WHERE key = 'workbench.editor.activeEditor'`
      );
    } catch {
      /* ignore */
    }

    if (!row) {
      try {
        row = await db.get(
          `SELECT value FROM ItemTable WHERE key LIKE '%activeEditor%' LIMIT 1`
        );
      } catch {
        /* ignore */
      }
    }

    if (!row?.value) {
      console.log(
        "No direct activeEditor row found. Sampling ItemTable keys for debugging..."
      );
      try {
        const samples = await db.all(
          `SELECT key, substr(value,1,300) as sample FROM ItemTable LIMIT 20`
        );
        console.log(
          "DB sample keys:",
          samples.map((r: any) => r.key)
        );
        // print a couple of samples (truncated) to help identify shape
        for (const s of samples.slice(0, 5)) {
          console.log(
            `- ${s.key}: ${String(s.sample).slice(0, 200).replace(/\n/g, " ")}${
              String(s.sample).length > 200 ? "..." : ""
            }`
          );
        }
      } catch (err) {
        console.error("Failed to sample ItemTable:", err);
      }

      // Additionally search values for common file/uri patterns to find any stored editor URIs
      try {
        const matches = await db.all(
          `SELECT key, substr(value,1,500) as sample FROM ItemTable WHERE value LIKE '%file:///%' OR value LIKE '%resource%' OR value LIKE '%uri%' LIMIT 50`
        );

        if (matches && matches.length) {
          console.log(
            "DB value matches (file/uri/resource):",
            matches.map((r: any) => r.key)
          );

          for (const m of matches.slice(0, 10)) {
            console.log(
              `* ${m.key}: ${String(m.sample)
                .replace(/\n/g, " ")
                .slice(0, 400)}${String(m.sample).length > 400 ? "..." : ""}`
            );
          }
        } else {
          console.log(
            "No value matches for file:///, resource, or uri patterns."
          );
        }
      } catch (err) {
        console.error("Value search failed:", err);
      }

      return null;
    }

    // Row contains JSON with file URI inside
    let parsed: any;
    try {
      parsed = JSON.parse(row.value);
    } catch (err) {
      console.error(
        "Failed to parse DB value as JSON. Raw value (truncated):",
        String(row.value).slice(0, 300)
      );
      return null;
    }

    // Support both { resource: 'file:///...' } and nested shapes
    if (parsed?.resource) return parsed.resource;

    // if it has editor info in nested fields, attempt to search
    if (parsed?.activeEditor?.resource) return parsed.activeEditor.resource;

    // Fallback: attempt to stringify and search for file:// pattern
    const asString = JSON.stringify(parsed);
    const m = asString.match(/file:\/\/\/[^\"']+/);
    if (m) return m[0];

    console.log(
      "Parsed DB value did not contain resource. Parsed shape:",
      Object.keys(parsed).slice(0, 10)
    );
    return null;
  } catch (err) {
    console.error("Error querying DB:", err);
    return null;
  } finally {
    await db.close();
  }
}
