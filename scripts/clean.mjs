import { rm } from 'node:fs/promises';

// Only remove this package's generated output, independently of the shell or cwd.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
