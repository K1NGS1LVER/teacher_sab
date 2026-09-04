#!/usr/bin/env bash
# teacher_sab setup - install the teaching system into any AI harness.
# Proof of concept. Later maybe a Bubble Tea TUI; for now this is the script.
set -euo pipefail

# ---------------------------------------------------------------- colors
C_RST=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
C_SAFF=$'\033[38;2;255;153;51m'      # saffron - top stripe
C_GREEN=$'\033[38;2;19;136;8m'       # india green - bottom stripe
C_NAVY=$'\033[38;2;0;0;128m'         # navy - accents
C_WHT=$'\033[38;2;255;255;255m'      # flag white
C_YEL=$'\033[33m'; C_RED=$'\033[31m'

say()   { printf "%b%s%b\n"    "$C_WHT" "$*" "$C_RST"; }
info()  { printf "%b  ▶ %s%b\n" "$C_SAFF" "$*" "$C_RST"; }
ok()    { printf "%b  ✔ %s%b\n" "$C_GREEN" "$*" "$C_RST"; }
warn()  { printf "%b  ! %s%b\n" "$C_YEL" "$*" "$C_RST"; }
err()   { printf "%b  ✘ %s%b\n" "$C_RED" "$*" "$C_RST" >&2; }

confirm()   { local a; read -r -p "$(printf '%b%s [Y/n]: %b' "$C_YEL" "$*" "$C_RST")" a; [[ -z "${a:-}" || "$a" =~ ^[Yy] ]]; }
confirm_no(){ local a; read -r -p "$(printf '%b%s [y/N]: %b' "$C_YEL" "$*" "$C_RST")" a; [[ "$a" =~ ^[Yy] ]]; }
prompt()    { local a; read -r -p "$(printf '%b%s %b' "$C_SAFF" "$*" "$C_RST")" a; printf '%s\n' "$a"; }

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

banner() {
  printf "%b  ═══════════════════════════════════════════════════%b\n" "$C_SAFF" "$C_SAFF"
  printf "  %bteacher_sab - one teaching system, any AI harness.%b\n" "$C_BOLD$C_WHT" "$C_RST"
  printf "  %bYour teacher reads LEARNER.md every session.%b\n" "$C_WHT" "$C_RST"
  printf "  %b────────────────────────────────────────────────────────%b\n" "$C_GREEN" "$C_GREEN"
  printf "  %b(fork of amosblomqvist/learn - pedagogy credit to them)%b\n\n" "$C_DIM" "$C_RST"
}

# ---------------------------------------------------------------- helpers
# copy_into SRC DST - copies a file or dir; on conflict asks before overwriting.
copy_into() {
  local src="$1" dst="$2"
  if [[ -e "$dst" ]]; then
    if confirm_no "Overwrite existing $(basename "$dst")? "; then
      rm -rf "$dst"; cp -R "$src" "$dst"; ok "updated $dst"
    else
      warn "left existing $dst in place"
    fi
  else
    cp -R "$src" "$dst"; ok "installed $dst"
  fi
}

# install_skills SKILLS_DIR [viz y/n]
install_skills() {
  local sk="$1" viz="${2:-y}"
  mkdir -p "$sk"
  copy_into "$SCRIPT_DIR/skills/teach" "$sk/teach"
  if [[ "$viz" == "y" ]]; then copy_into "$SCRIPT_DIR/skills/visualize" "$sk/visualize"; fi
}

# install_agents AGENTS_DIR
install_agents() {
  local ag="$1"
  mkdir -p "$ag"
  copy_into "$SCRIPT_DIR/agents/researcher.md" "$ag/researcher.md"
  copy_into "$SCRIPT_DIR/agents/mermaid-maker.md" "$ag/mermaid-maker.md"
  copy_into "$SCRIPT_DIR/agents/svg-maker.md" "$ag/svg-maker.md"
}

# gen_mdc NAME GLOBS - emit a Cursor rule file from a SKILL.md
gen_mdc() {
  local name="$1" globs="$2" desc dst
  desc=$(grep -m1 '^description:' "$SCRIPT_DIR/skills/$name/SKILL.md" | sed 's/^description:[[:space:]]*//')
  dst="$TARGET/.cursor/rules/$name.mdc"
  {
    printf -- '---\ndescription: %s\nalwaysApply: true\nglobs: [%s]\n---\n\n' "$desc" "$globs"
    cat "$SCRIPT_DIR/skills/$name/SKILL.md"
  } > "$dst.new"
  if [[ -e "$dst" ]]; then
    if confirm_no "Overwrite existing $dst? "; then mv "$dst.new" "$dst"; ok "updated $dst"; else rm -f "$dst.new"; warn "left existing $dst"; fi
  else mv "$dst.new" "$dst"; ok "installed $dst"; fi
}

# setup_learner TARGET_DIR - ensure a LEARNER.md the skill can read
setup_learner() {
  local dst="$1/LEARNER.md"
  if [[ -e "$dst" ]]; then
    info "LEARNER.md already exists at $dst - leaving it (edit it to change the learner)"
    return
  fi
  if [[ -e "$1/LEARNER.template.md" ]]; then
    cp "$1/LEARNER.template.md" "$dst"; ok "created $dst from the template"
  else
    cp "$SCRIPT_DIR/LEARNER.template.md" "$dst"; ok "created $dst from the template"
  fi
  if confirm "Open $dst in your editor now to fill in the learner profile? "; then
    "${EDITOR:-vi}" "$dst"
  fi
}

harness_picker() {
  printf "%b\n  Which AI harness do you use?%b\n" "$C_WHT" "$C_RST"
  printf "  %b 1)%b opencode        %b 2)%b Claude Code   %b 3)%b Codex        %b 4)%b Kilo Code%b\n" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST"
  printf "  %b 5)%b Cursor          %b 6)%b Antigravity (agy) %b 7)%b Hermes    %b 8)%b pi (original)%b\n" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST"
  printf "  %b 9)%b Universal (.agents/skills)          %b10)%b Plain chat (no files)%b\n" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST" "$C_SAFF" "$C_RST"
  local a
  read -r -p "$(printf '%b  Pick a number 1-10: %b' "$C_SAFF" "$C_RST")" a
  case "$a" in
    1) CHOICE=opencode;;    2) CHOICE=claude;;    3) CHOICE=codex;;    4) CHOICE=kilo;;
    5) CHOICE=cursor;;      6) CHOICE=agy;;       7) CHOICE=hermes;;   8) CHOICE=pi;;
    9) CHOICE=universal;;   10) CHOICE=chat;;
    *) err "pick a number 1-10"; return 1;;
  esac
  ok "harness: $CHOICE"
}

runbook() {
  printf "%b\n  ── done. Next step:%b\n" "$C_SAFF" "$C_RST"
  case "$1" in
    opencode)   say '  run opencode in this project and say:  "use the teach skill. Teach me <topic>."';;
    claude)     say '  run claude in this project and say:  "use the teach skill. Teach me <topic>."' ;;
    codex)      say '  restart Codex, then:  "use the teach skill. Teach me <topic>."' ;;
    kilo)       say '  in Kilo Code run "/reload" (project skills rescan), then ask:  "teach me <topic>."' ;;
    cursor)     say '  open Cursor in this project. The teach rule is alwaysApply, so just ask:  "teach me <topic>."';;
    agy)        say '  run agy (Antigravity CLI) here and ask:  "use the teach skill. Teach me <topic>."' ;;
    hermes)     say '  run hermes here and ask:  "use the teach skill. Teach me <topic>." (or /skills)' ;;
    pi)         say '  open pi in this project and ask:  "use the teach skill. Teach me <topic>."';;
    universal)  say '  run any skill-capable agent here and ask:  "use the teach skill. Teach me <topic>."';;
    chat)       :
  esac
  printf "%b  Every session, the teacher reads LEARNER.md first, so it adapts to %bwhoever%b owns it.%b\n\n" "$C_DIM" "$C_GREEN" "$C_DIM" "$C_RST"
}

# ---------------------------------------------------------------- main
banner

while ! harness_picker; do :; done

TARGET=$(prompt "Install into directory (absolute or relative) [$(pwd)]:")
TARGET=$(cd "${TARGET:-$(pwd)}" && pwd)
ok "target: $TARGET"

if confirm "Include the visualize skill and the 3 subagents (research/diagram makers)? "; then
  WITH_VIS=y; WITH_AGENTS=y
else
  WITH_VIS=n; WITH_AGENTS=n
fi

case "$CHOICE" in
  opencode)
    install_skills "$TARGET/.opencode/skills" "$WITH_VIS"
    [[ "$WITH_AGENTS" == "y" ]] && install_agents "$TARGET/.opencode/agent"
    ;;
  claude)
    install_skills "$TARGET/.claude/skills" "$WITH_VIS"
    [[ "$WITH_AGENTS" == "y" ]] && install_agents "$TARGET/.claude/agents"
    ;;
  codex)
    install_skills "$TARGET/.agents/skills" "$WITH_VIS"
    info "subagents are inline for Codex - nothing to install, research uses its own tools"
    info "want it for ALL your repos? install to ~/.agents/skills instead and rerun"
    ;;
  kilo)
    install_skills "$TARGET/.kilo/skills" "$WITH_VIS"
    [[ "$WITH_AGENTS" == "y" ]] && install_agents "$TARGET/.kilo/agent"
    info "Kilo Code also reads .agents/skills/ by default if you prefer the universal setup"
    ;;
  agy)
    install_skills "$TARGET/.agents/skills" "$WITH_VIS"
    info "Antigravity (agy) reads .agents/skills/ by default"
    info "want it for ALL your projects? install to ~/.gemini/config/skills/ instead and rerun"
    info "subagents: Antigravity uses plugin-bundled agents - for plain skills, research runs inline"
    ;;
  hermes)
    install_skills "$TARGET/.hermes/skills" "$WITH_VIS"
    info "for ALL your projects, install into ~/.hermes/skills/ instead and rerun (primary dir)"
    info "subagents: Hermes has no project agent file dir - research runs inline"
    ;;
  cursor)
    mkdir -p "$TARGET/.cursor/rules"
    gen_mdc teach '"**/*"'
    [[ "$WITH_VIS" == "y" ]] && gen_mdc visualize '"**/*"'
    info "subagents are inline for Cursor - nothing to install"
    ;;
  pi)
    install_skills "$TARGET/.pi/skills" "$WITH_VIS"
    [[ "$WITH_AGENTS" == "y" ]] && install_agents "$TARGET/.pi/agents"
    ;;
  universal)
    install_skills "$TARGET/.agents/skills" "$WITH_VIS"
    info "subagents: not installed (opencode/Claude can read .agents/skills too; for subagent files use that harness's own config)"
    ;;
  chat)
    info "no files to install to - here's what to paste:"
    say "  1) contents of $SCRIPT_DIR/skills/teach/SKILL.md, prefixed: \"You are a teacher. Follow this exactly.\""
    [[ "$WITH_VIS" == "y" ]] && say "  2) (optional) contents of $SCRIPT_DIR/skills/visualize/SKILL.md - chat apps with Markdown render it"
    say "  3) your filled-in LEARNER.md, prefixed: \"This is the learner. Teach to this profile.\""
    ;;
esac

setup_learner "$TARGET"

printf "%b\n  ┌─────────────────────────────────────────────┐%b\n" "$C_GREEN" "$C_GREEN"
printf "  %b│   %b✔ teacher_sab%b installed into %b%s%b   │%b\n" "$C_GREEN" "$C_GREEN" "$C_WHT" "$C_GREEN" "$(basename "$TARGET")" "$C_GREEN" "$C_GREEN"
printf "  %b└─────────────────────────────────────────────┘%b\n" "$C_GREEN" "$C_GREEN"
runbook "$CHOICE"