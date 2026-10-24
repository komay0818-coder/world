import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { checkLocalApiReady, loadRealAuthSmokeConfig, runRealAuthSmoke } from '../src/real-auth-smoke.js';

async function readEmail(): Promise<string> {
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    return await terminal.question('Test account email: ');
  } finally {
    terminal.close();
  }
}

async function readMaskedPassword(): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Password entry requires an interactive local terminal');
  }

  return new Promise<string>((resolve, reject) => {
    let password = '';
    const previousRawMode = stdin.isRaw;
    const finish = (error?: Error) => {
      stdin.off('data', onData);
      stdin.setRawMode(previousRawMode);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error);
      else resolve(password);
    };
    const onData = (chunk: Buffer | string) => {
      const text = chunk.toString();
      for (const character of text) {
        if (character === '\u0003') return finish(new Error('Login test cancelled'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          continue;
        }
        if (character >= ' ') {
          password += character;
          stdout.write('*');
        }
      }
    };

    stdout.write('Test account password: ');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  const config = loadRealAuthSmokeConfig();
  await checkLocalApiReady(config);
  stdout.write('Local lorn-dev API is ready. Credentials and tokens will not be logged.\n');
  const email = await readEmail();
  const password = await readMaskedPassword();
  try {
    const result = await runRealAuthSmoke(config, { email, password });
    stdout.write(`${JSON.stringify({ ok: true, ...result })}\n`);
  } finally {
    // JavaScript strings cannot be securely wiped; keep the password scoped to this process only.
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown login test failure';
  process.stderr.write(`${JSON.stringify({ ok: false, error: message })}\n`);
  process.exitCode = 1;
});
