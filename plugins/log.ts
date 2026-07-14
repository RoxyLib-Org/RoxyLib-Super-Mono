import {
  createWriteStream,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  type WriteStream,
} from "node:fs";
import { resolve } from "node:path";

const MAX_LINES = 20_000;
const MAX_TRASH = 15;

const root = process.env.NX_WORKSPACE_ROOT ?? process.cwd();
export const agentsDir = resolve(root, ".agents");
const trashDir = resolve(agentsDir, "trash");

mkdirSync(agentsDir, { recursive: true });
mkdirSync(trashDir, { recursive: true });

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function moveToTrash(filePath: string, fileName: string) {
  try {
    renameSync(filePath, resolve(trashDir, fileName));
  } catch (e) {
    console.error("[log] moveToTrash error", e);
  }
}

function pruneTrash() {
  try {
    const files = readdirSync(trashDir)
      .map((f) => ({ name: f, mtime: statSync(resolve(trashDir, f)).mtimeMs }))
      .sort((a, b) => a.mtime - b.mtime);

    while (files.length > MAX_TRASH) {
      const oldest = files.shift()!;
      unlinkSync(resolve(trashDir, oldest.name));
    }
  } catch (e) {
    console.error("[log] pruneTrash error", e);
  }
}

export class RotatingLog {
  private stream: WriteStream;
  private lineCount = 0;
  private startLine = 1;
  private readonly name: string;
  private lastContent = "";
  private repeatCount = 0;

  constructor(name: string, header?: string) {
    this.name = name;
    this.archiveExisting();
    pruneTrash();
    this.stream = this.openNew();
    if (header) {
      this.stream.write(`=== ${timestamp()} | ${header} ===\n`);
    }
  }

  write(text: string) {
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === this.lastContent) {
        this.repeatCount++;
        continue;
      }
      this.flushPending();
      this.lastContent = trimmed;
      this.repeatCount = 0;
      const formatted = `[${timestamp()}] ${trimmed}`;
      this.writeLine(formatted);
    }
  }

  end() {
    this.flushPending();
    this.finalizeFileName();
    this.stream.end();
  }

  private archiveExisting() {
    try {
      const files = readdirSync(agentsDir).filter(
        (f) => f.startsWith("output-") && f.endsWith(".log"),
      );
      for (const f of files) {
        moveToTrash(resolve(agentsDir, f), f);
      }
    } catch {
      // ignore
    }
  }

  private flushPending() {
    if (this.repeatCount > 0) {
      const msg = `[${timestamp()}] (repeated ${this.repeatCount} more times)`;
      this.writeLine(msg);
      this.repeatCount = 0;
    }
  }

  private writeLine(formatted: string) {
    this.stream.write(`${formatted}\n`);
    this.lineCount++;
    if (this.lineCount >= MAX_LINES) {
      this.rotate();
    }
  }

  private buildFileName(endLine: number): string {
    return `output-${this.name}-${this.startLine}-${endLine}.log`;
  }

  private openNew(): WriteStream {
    const filePath = resolve(agentsDir, this.buildFileName(this.startLine));
    return createWriteStream(filePath, { flags: "w" });
  }

  private finalizeFileName() {
    const oldName = this.buildFileName(this.startLine);
    const newName = this.buildFileName(this.startLine + this.lineCount - 1);
    try {
      renameSync(resolve(agentsDir, oldName), resolve(agentsDir, newName));
    } catch {
      // ignore
    }
  }

  private rotate() {
    this.finalizeFileName();
    this.stream.end();
    this.startLine += this.lineCount;
    this.lineCount = 0;
    this.stream = this.openNew();
  }
}
