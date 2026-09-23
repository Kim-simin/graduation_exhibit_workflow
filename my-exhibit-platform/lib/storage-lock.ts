/**
 * my-exhibit-platform/lib/storage-lock.ts
 * Cross-language compatible inter-process file locking for Node.js / Next.js API routes.
 * Interoperates with Python's storage_manager.py using atomic O_CREAT | O_EXCL (<path>.lock).
 */
import fs from "fs";
import path from "path";

export function canonicalPath(filePath: string): string {
  return path.resolve(filePath).toLowerCase();
}

export async function withFileLock<T>(
  targetPath: string,
  action: () => Promise<T> | T,
  timeoutMs: number = 20000
): Promise<T> {
  const normPath = path.resolve(targetPath);
  const lockPath = normPath + ".lock";
  const startTime = Date.now();

  let lockFd: number | null = null;

  while (true) {
    try {
      // 'wx' flag opens for writing, fails if path already exists (O_CREAT | O_EXCL)
      lockFd = fs.openSync(lockPath, "wx");
      fs.writeSync(lockFd, `${process.pid}\n${Date.now()}\n`);
      break;
    } catch (err: any) {
      if (err.code === "EEXIST") {
        // Check for stale lock (> 30s)
        try {
          const stats = fs.statSync(lockPath);
          if (Date.now() - stats.mtimeMs > 30000) {
            try {
              fs.unlinkSync(lockPath);
            } catch (_) {}
          }
        } catch (_) {}

        if (Date.now() - startTime > timeoutMs) {
          throw new Error(`Timeout acquiring lock on ${lockPath} after ${timeoutMs}ms`);
        }
        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 50));
      } else {
        throw err;
      }
    }
  }

  try {
    return await action();
  } finally {
    if (lockFd !== null) {
      try {
        fs.closeSync(lockFd);
      } catch (_) {}
      try {
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
        }
      } catch (_) {}
    }
  }
}
