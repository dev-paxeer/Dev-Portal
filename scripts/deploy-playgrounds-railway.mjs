#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = '/root/openapi/dev-portal';
const TOOLS_DIR = path.join(REPO_ROOT, 'tools');

function runRailway(args, { cwd = REPO_ROOT, json = false } = {}) {
  const fullArgs = [...args];
  if (json && !fullArgs.includes('--json')) fullArgs.push('--json');
  const out = execFileSync('railway', fullArgs, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  return out;
}

function tryRunRailway(args, { cwd = REPO_ROOT, json = false } = {}) {
  try {
    return { ok: true, stdout: runRailway(args, { cwd, json }) };
  } catch (err) {
    const stderr = err?.stderr?.toString?.() ?? '';
    const stdout = err?.stdout?.toString?.() ?? '';
    return { ok: false, stdout, stderr, error: err };
  }
}

function findPlaygroundDirs() {
  const result = [];
  const top = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });
  for (const ent of top) {
    if (!ent.isDirectory()) continue;
    const sdkDir = path.join(TOOLS_DIR, ent.name);
    const playgroundDir = path.join(sdkDir, 'playground');
    const pkg = path.join(playgroundDir, 'package.json');
    if (fs.existsSync(playgroundDir) && fs.existsSync(pkg)) {
      result.push({ sdkName: ent.name, playgroundDir });
    }
  }
  return result;
}

function toServiceName(sdkName) {
  return sdkName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function parseArgs(argv) {
  const args = {
    projectId: process.env.RAILWAY_PROJECT_ID ?? '',
    projectName: process.env.RAILWAY_PROJECT_NAME ?? 'dev-portal-playgrounds',
    // Railway CLI requires --environment when using --project.
    environment: process.env.RAILWAY_ENVIRONMENT ?? 'production',
    workspace: process.env.RAILWAY_WORKSPACE ?? '',
    detach: true,
    only: '',
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project' || a === '-p') args.projectId = argv[++i] ?? '';
    else if (a === '--name' || a === '-n') args.projectName = argv[++i] ?? '';
    else if (a === '--env' || a === '-e') args.environment = argv[++i] ?? '';
    else if (a === '--workspace' || a === '-w') args.workspace = argv[++i] ?? '';
    else if (a === '--no-detach') args.detach = false;
    else if (a === '--only') args.only = argv[++i] ?? '';
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: deploy-playgrounds-railway [options]\n\nOptions:\n  -p, --project <id>       Railway project id (if omitted, creates/links a new project)\n  -n, --name <name>        Project name when creating (default: dev-portal-playgrounds)\n  -e, --env <env>          Railway environment name/id (default: production)\n  -w, --workspace <ws>     Railway workspace name/id (only used for project creation)\n      --only <sdkName>     Deploy only one SDK playground (folder name under tools/)\n      --no-detach          Attach to logs during deploy\n\nEnv vars:\n  RAILWAY_PROJECT_ID, RAILWAY_PROJECT_NAME, RAILWAY_ENVIRONMENT, RAILWAY_WORKSPACE\n`);
      process.exit(0);
    }
  }
  return args;
}

function ensureProject({ projectId, projectName, workspace }) {
  if (projectId) return projectId;

  // `railway init --json` may still prompt (workspace selection), which pollutes JSON output.
  // To keep this script reliable, we:
  // - run `railway init` (interactive if needed)
  // - then fetch the linked project id via `railway status --json`

  const initArgs = ['init', '--name', projectName];
  if (workspace) initArgs.push('--workspace', workspace);

  // IMPORTANT: allow interactive prompts by inheriting stdio
  try {
    execFileSync('railway', initArgs, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      encoding: 'utf8',
    });
  } catch (err) {
    throw new Error('Failed to create Railway project (railway init).');
  }

  const statusRes = tryRunRailway(['status'], { json: true });
  if (!statusRes.ok) {
    process.stderr.write(statusRes.stdout);
    process.stderr.write(statusRes.stderr);
    throw new Error('Project created, but failed to read project id (railway status --json).');
  }

  const data = JSON.parse(statusRes.stdout);
  const id = data?.project?.id ?? data?.projectId ?? data?.id;
  if (!id) {
    throw new Error('Project created, but could not determine project id from railway status --json output.');
  }
  return id;
}

function ensureService({ projectId, serviceName }) {
  const res = tryRunRailway(['add', '--service', serviceName, '--project', projectId], { json: true });
  if (!res.ok) {
    // If it already exists, Railway may return non-zero; we still can deploy to it by name.
    return;
  }
  return;
}

function deployPlayground({ projectId, environment, detach, sdkName, playgroundDir }) {
  const serviceName = toServiceName(sdkName);

  ensureService({ projectId, serviceName });

  const upArgs = ['up', '--project', projectId, '--service', serviceName, '--path-as-root'];
  upArgs.push('--environment', environment || 'production');
  if (detach) upArgs.push('--detach');
  upArgs.push(playgroundDir);

  process.stdout.write(`\n==> Deploying ${sdkName} (${serviceName}) from ${playgroundDir}\n`);
  const res = tryRunRailway(upArgs, { cwd: REPO_ROOT });
  if (!res.ok) {
    process.stderr.write(res.stdout);
    process.stderr.write(res.stderr);
    throw new Error(`Deploy failed for ${sdkName}`);
  }
  process.stdout.write(res.stdout);
}

function main() {
  const args = parseArgs(process.argv);
  const playgrounds = findPlaygroundDirs().filter((p) => !args.only || p.sdkName === args.only);

  if (playgrounds.length === 0) {
    throw new Error('No playground directories found under tools/*/playground (with package.json).');
  }

  const projectId = ensureProject({
    projectId: args.projectId,
    projectName: args.projectName,
    workspace: args.workspace,
  });

  process.stdout.write(`Using Railway project: ${projectId}\n`);

  for (const p of playgrounds) {
    deployPlayground({
      projectId,
      environment: args.environment,
      detach: args.detach,
      sdkName: p.sdkName,
      playgroundDir: p.playgroundDir,
    });
  }

  process.stdout.write('\nAll playground deploys complete.\n');
}

main();
