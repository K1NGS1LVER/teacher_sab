#!/usr/bin/env node
// teacher-sab - interactive installer for the teaching system.
// Port of setup.sh to plain Node (stdlib only). Pedagogy by amosblomqvist/learn;
// this installer, the packaging, and the improvements are this fork's.

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------- colors
const Rst = "\x1b[0m", Bold = "\x1b[1m", Dim = "\x1b[2m";
const Saff = "\x1b[38;2;255;153;51m", Green = "\x1b[38;2;19;136;8m";
const Wht = "\x1b[38;2;255;255;255m", Yel = "\x1b[33m", Red = "\x1b[31m";
const say  = (s) => console.log(`${Wht}${s}${Rst}`);
const raw  = console.log;
const info = (s) => console.log(`${Saff}  ▶ ${s}${Rst}`);
const ok   = (s) => console.log(`${Green}  ✔ ${s}${Rst}`);
const warn = (s) => console.log(`${Yel}  ! ${s}${Rst}`);
const err  = (s) => console.error(`${Red}  ✘ ${s}${Rst}`);

// ---------------------------------------------------------------- harnesses
const ALL = ["opencode", "claude", "codex", "kilo", "cursor", "agy", "hermes", "pi", "universal", "chat"];
const NUM = { 1: "opencode", 2: "claude", 3: "codex", 4: "kilo", 5: "cursor", 6: "agy", 7: "hermes", 8: "pi", 9: "universal", 10: "chat" };

function parseAgents(input) {
  const t = input.trim().toLowerCase();
  if (t === "a" || t === "all") return [...ALL];
  const out = [];
  for (const bit of t.split(/[\s,]+/)) {
    if (!bit) continue;
    const h = NUM[bit] ?? (ALL.includes(bit) ? bit : null);
    if (!h) throw new Error(`bad pick: '${bit}' (use numbers 1-10 or a harness name, or 'all')`);
    if (!out.includes(h)) out.push(h);
  }
  if (!out.length) throw new Error("nothing recognizable picked");
  return out;
}

// ---------------------------------------------------------------- args
let agentsArg = null, dir = null, mode = "copy", yes = false, withVis = true, help = false, version = false;
let target = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--agents=")) agentsArg = a.slice(9);
  else if (a.startsWith("--dir=")) dir = a.slice(6);
  else switch (a) {
    case "-h": case "--help": help = true; break;
    case "-v": case "--version": version = true; break;
    case "-a": case "--agents": agentsArg = argv[++i]; break;
    case "-d": case "--dir": dir = argv[++i]; break;
    case "-l": case "--link": mode = "link"; break;
    case "-y": case "--yes": yes = true; break;
    default: err(`unknown option: ${a}`); help = true;
  }
}

function usage() {
  console.log(`Usage: npx teacher-sab [options]

Interactive installer for the teacher_sab teaching system.
Pedagogy by amosblomqvist/learn - https://github.com/amosblomqvist/learn
Installer, packaging, and improvements by K1NGS1LVER (this fork).

Options:
  -a, --agents <list>   harnesses to install: numbers 1-10 or names, space or
                        comma separated, or 'all' (default when -y)
  -d, --dir <path>      install target directory (default: current directory)
  -l, --link            symlink instead of copy (installs point into this npm cache)
  -y, --yes             skip all prompts
  -h, --help            show this help
  -v, --version         show version

Harnesses:
  1 opencode  2 Claude Code  3 Codex  4 Kilo Code  5 Cursor
  6 Antigravity (agy)  7 Hermes  8 pi (original)  9 Universal (.agents/skills)  10 Plain chat`);
}

function banner() {
  raw(`${Saff}  ═══════════════════════════════════════════════════`);
  raw(`${Bold}${Wht}  teacher-sab - one teaching system, any AI harness.`);
  raw(`${Wht}  Your teacher reads LEARNER.md every session.`);
  raw(`${Green}  ────────────────────────────────────────────────────────`);
  raw(`${Dim}  (fork of amosblomqvist/learn - pedagogy credit to them)`);
  raw("");
}

const rl = createInterface({ input, output });
const closed = () => { err("no input (stdin closed) - rerun interactively or use -y for non-interactive install"); process.exit(1); };
const ask = async (q) => {
  try { return await rl.question(`${Yel}${q}${Rst}`); }
  catch { closed(); }
};
const yesTo = async (q) => {
  const a = (await ask(q)).trim();
  return a === "" || /^y/i.test(a);
};

// ---------------------------------------------------------------- install helpers
function place(src, dst) {
  if (mode === "link") {
    try {
      fs.symlinkSync(src, dst);
      ok(`linked ${dst} -> ${src}`);
    } catch {
      fs.cpSync(src, dst, { recursive: true });
      warn(`symlink failed on this system, copied instead (${dst})`);
    }
  } else {
    fs.cpSync(src, dst, { recursive: true });
    ok(`installed ${dst}`);
  }
}

async function copyInto(src, dst) {
  const st = fs.lstatSync(dst, { throwIfNoEntry: false });
  if (st?.isSymbolicLink()) {
    if (mode === "link") { ok(`already linked ${dst}`); return; }
  }
  if (st !== undefined) {
    const go = yes || (await yesTo(`Overwrite existing ${path.basename(dst)}? [y/N]: `));
    if (!go) { warn(`left existing ${dst} in place`); return; }
    fs.rmSync(dst, { recursive: true, force: true });
  }
  place(src, dst);
}

const installSkills = async (skDir) => {
  fs.mkdirSync(skDir, { recursive: true });
  await copyInto(path.join(PKG, "skills", "teach"), path.join(skDir, "teach"));
  if (withVis) await copyInto(path.join(PKG, "skills", "visualize"), path.join(skDir, "visualize"));
};

const installAgents = async (agDir) => {
  fs.mkdirSync(agDir, { recursive: true });
  for (const f of ["researcher.md", "mermaid-maker.md", "svg-maker.md"]) {
    await copyInto(path.join(PKG, "agents", f), path.join(agDir, f));
  }
};

const genMdc = async (name, globs) => {
  const skill = fs.readFileSync(path.join(PKG, "skills", name, "SKILL.md"), "utf8");
  const desc = (skill.match(/^description:\s*(.+)$/m) || [])[1] || "";
  const dst = path.join(target, ".cursor", "rules", `${name}.mdc`);
  const body = `---\ndescription: ${desc}\nalwaysApply: true\nglobs: [${globs}]\n---\n\n${skill}`;
  if (fs.existsSync(dst)) {
    if (yes || (await yesTo(`Overwrite existing ${dst}? [y/N]: `))) {
      fs.writeFileSync(dst, body); ok(`updated ${dst}`);
    } else warn(`left existing ${dst}`);
  } else { fs.writeFileSync(dst, body); ok(`installed ${dst}`); }
};

const installOne = async (h) => {
  switch (h) {
    case "opencode":
      await installSkills(path.join(target, ".opencode", "skills"));
      if (withVis) await installAgents(path.join(target, ".opencode", "agent"));
      break;
    case "claude":
      await installSkills(path.join(target, ".claude", "skills"));
      if (withVis) await installAgents(path.join(target, ".claude", "agents"));
      break;
    case "codex":
      await installSkills(path.join(target, ".agents", "skills"));
      info("subagents are inline for Codex - nothing to install, research uses its own tools");
      info("want it for ALL your repos? install to ~/.agents/skills instead and rerun");
      break;
    case "kilo":
      await installSkills(path.join(target, ".kilo", "skills"));
      if (withVis) await installAgents(path.join(target, ".kilo", "agent"));
      info("Kilo Code also reads .agents/skills/ by default if you prefer the universal setup");
      break;
    case "agy":
      await installSkills(path.join(target, ".agents", "skills"));
      info("Antigravity (agy) reads .agents/skills/ by default");
      info("want it for ALL your projects? install to ~/.gemini/config/skills/ instead and rerun");
      info("subagents: Antigravity uses plugin-bundled agents - for plain skills, research runs inline");
      break;
    case "hermes":
      await installSkills(path.join(target, ".hermes", "skills"));
      info("for ALL your projects, install into ~/.hermes/skills/ instead and rerun (primary dir)");
      info("subagents: Hermes has no project agent file dir - research runs inline");
      break;
    case "cursor":
      fs.mkdirSync(path.join(target, ".cursor", "rules"), { recursive: true });
      await genMdc("teach", '"**/*"');
      if (withVis) await genMdc("visualize", '"**/*"');
      info("subagents are inline for Cursor - nothing to install");
      info("Cursor rules are generated .mdc files - always written, never symlinked");
      break;
    case "pi":
      await installSkills(path.join(target, ".pi", "skills"));
      if (withVis) await installAgents(path.join(target, ".pi", "agents"));
      break;
    case "universal":
      await installSkills(path.join(target, ".agents", "skills"));
      info("subagents: not installed (opencode/Claude can read .agents/skills too; for subagent files use that harness's own config)");
      break;
    case "chat":
      info("no files to install to - here's what to paste:");
      say(`  1) contents of ${PKG}/skills/teach/SKILL.md, prefixed: "You are a teacher. Follow this exactly."`);
      if (withVis) say(`  2) (optional) contents of ${PKG}/skills/visualize/SKILL.md - chat apps with Markdown render it`);
      say(`  3) your filled-in ${target}/LEARNER.md, prefixed: "This is the learner. Teach to this profile."`);
      break;
  }
};

const setupLearner = async () => {
  const dst = path.join(target, "LEARNER.md");
  const tpl = path.join(PKG, "LEARNER.template.md");
  if (fs.existsSync(dst)) {
    if (fs.existsSync(tpl) && fs.readFileSync(dst, "utf8") === fs.readFileSync(tpl, "utf8")) {
      info(`LEARNER.md exists (the blank template) - fill it in to become the learner`);
    } else {
      info(`LEARNER.md already exists at ${dst} - leaving it (edit it to change the learner)`);
    }
    return;
  }
  if (!fs.existsSync(tpl)) return;
  fs.copyFileSync(tpl, dst);
  ok(`created ${dst} from the template`);
  if (!yes && (await yesTo(`Open ${dst} in your editor now to fill in the learner profile? `))) {
    const ed = process.env.EDITOR || "vi";
    const { spawn } = await import("node:child_process");
    spawn(ed, [dst], { stdio: "inherit" });
  }
};

const runbook = (h) => {
  raw(`${Saff}  ── done. Next step:`);
  switch (h) {
    case "opencode":  say('  run opencode in this project and say:  "use the teach skill. Teach me <topic>."'); break;
    case "claude":    say('  run claude in this project and say:  "use the teach skill. Teach me <topic>."'); break;
    case "codex":     say('  restart Codex, then:  "use the teach skill. Teach me <topic>."'); break;
    case "kilo":      say('  in Kilo Code run "/reload" (project skills rescan), then ask:  "teach me <topic>."'); break;
    case "cursor":    say('  open Cursor in this project. The teach rule is alwaysApply, so just ask:  "teach me <topic>."'); break;
    case "agy":       say('  run agy (Antigravity CLI) here and ask:  "use the teach skill. Teach me <topic>."'); break;
    case "hermes":    say('  run hermes here and ask:  "use the teach skill. Teach me <topic>." (or /skills)'); break;
    case "pi":        say('  open pi in this project and ask:  "use the teach skill. Teach me <topic>."'); break;
    case "universal": say('  run any skill-capable agent here and ask:  "use the teach skill. Teach me <topic>."'); break;
    case "chat":      break;
  }
  say(`${Dim}  Every session, the teacher reads LEARNER.md first, so it adapts to ${Green}whoever${Dim} owns it.`);
  say(`${Dim}  Sessions log themselves to study-artifacts/ in the install dir.`);
  raw("");
};

// ---------------------------------------------------------------- main
if (version) {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG, "package.json"), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}
if (help) { usage(); process.exit(0); }

main().catch((e) => {
  err(e && e.message ? e.message : String(e));
  process.exit(1);
});

async function main() {
banner();

let harnesses;
try {
  harnesses = agentsArg != null ? parseAgents(agentsArg) : null;
} catch (e) { err(e.message); process.exit(1); }

if (harnesses == null) {
  if (yes) {
    harnesses = [...ALL];
  } else {
    while (true) {
      raw(`${Wht}  Which AI harnesses do you use? Pick one or more.`);
      raw(`${Saff}   1) opencode          2) Claude Code   3) Codex        4) Kilo Code`);
      raw(`${Saff}   5) Cursor            6) Antigravity (agy)  7) Hermes  8) pi (original)`);
      raw(`${Saff}   9) Universal (.agents/skills)     10) Plain chat (no files)`);
      try {
        harnesses = parseAgents(await ask("  Pick numbers, separated by space or comma (e.g. 2 6 9), or [a]:all: "));
        break;
      } catch (e) { err(e.message); }
    }
  }
}
ok(`harnesses: ${harnesses.join(" ")}`);

if (!yes) {
  mode = (await yesTo(`Copy the files in, or symlink to the package? (Enter = copy, 'n' = symlink) `)) ? "copy" : "link";
  if (mode === "link") warn("symlink points into the npm cache - re-run the installer if the cache is cleared");
}

if (dir == null) {
  if (yes) { dir = process.cwd(); }
  else { const r = await ask(`Install into directory (absolute or relative) [${process.cwd()}]: `); dir = r.trim() === "" ? process.cwd() : r.trim(); }
}
target = path.resolve(dir);
fs.mkdirSync(target, { recursive: true });
ok(`target: ${target}`);
fs.mkdirSync(path.join(target, "study-artifacts"), { recursive: true });
ok(`study-artifacts ready at ${target}/study-artifacts (sessions log here)`);

if (!yes) {
  withVis = await yesTo("Include the visualize skill and the 3 subagents (research/diagram makers)? ");
}

for (const h of harnesses) {
  await installOne(h);
  runbook(h);
}

await setupLearner();

const inner = `✔ teacher_sab installed (${harnesses.join(" ")}, ${mode})`;
const CW = Math.max(inner.length + 4, 44);
const border = `${Green}  ${"─".repeat(CW + 4)}${Rst}`;
const row = (plain, colored) =>
  `${Green}  │ ${colored || ""}${" ".repeat(Math.max(0, CW - plain.length))} │${Rst}`;
raw(border);
raw(row(""));
raw(row(inner, `✔${Wht} teacher_sab installed (${Green}${harnesses.join(" ")}${Wht}, ${Green}${mode}${Wht}`));
raw(row(""));
raw(border);
say(`${Dim}  improvements over upstream + credit: see IMPROVEMENTS.md (in this package)`);
say(`${Dim}  upstream pedagogy: https://github.com/amosblomqvist/learn${Rst}`);
rl.close();
}