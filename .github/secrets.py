#!/usr/bin/env python3
"""Look for a secret's value in what git holds, without ever printing the value.

    python3 secrets.py all <top>              the tracked files and every commit of every branch
    python3 secrets.py range <top> <range>    the commits of a range (`main..feature/x`)
    python3 secrets.py installer <top>        this file as the repo's pre-commit hook
    .git/hooks/pre-commit                     run by git: the lines this commit adds

Prints one line per hit, `where: kind` (a path and line, or a commit and path), and exits 1; prints
nothing and exits 0 when clean. A key-like value is a known prefix (`sk_live_`, `AKIA`, a private
key's `-----BEGIN`, …) or a long random string given to a name ending in KEY, TOKEN, SECRET or
PASSWORD. A key every browser receives (a publishable key, a web API key) counts too: it is no
secret, and a repository that could become public still has no use for it. `install` leaves a hook already there, or a `core.hooksPath`, and says so.
"""
import re
import shutil
import stat
import subprocess
import sys
from pathlib import Path

KINDS = [
    ("Stripe live key", re.compile(r"\b[sr]k_live_[0-9A-Za-z]{10,}")),
    # Not secret, and still not for a repository that could become public: a key every browser receives.
    ("Stripe test or publishable key", re.compile(r"\b(sk_test|rk_test|pk_live|pk_test)_[0-9A-Za-z]{24,}")),
    ("AWS key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("private key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("jeton GitHub", re.compile(r"\b(ghp|gho|ghs|ghu)_[0-9A-Za-z]{36}\b|\bgithub_pat_[0-9A-Za-z_]{40,}")),
    ("jeton Slack", re.compile(r"\bxox[abprs]-[0-9A-Za-z-]{10,}")),
    ("Google key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
]
NAMED = re.compile(r"""(?i)\b\w*(key|token|secret|password)["']?\s*[:=]\s*["']?([A-Za-z0-9_+/=.-]{20,})""")
SKIP = re.compile(r"(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Cargo\.lock|uv\.lock)$")


def random_looking(v):
    if re.search(r"(?i)x{4,}|example|changeme|placeholder|your_|process\.env|environ", v):
        return False
    classes = sum(bool(re.search(p, v)) for p in (r"[a-z]", r"[A-Z]", r"[0-9]"))
    return classes >= 2 and len(set(v)) > 8


def kinds_in(line):
    found = [k for k, rx in KINDS if rx.search(line)]
    m = NAMED.search(line)
    if not found and m and random_looking(m.group(2)):
        found.append(f"a value given to a name in {m.group(1).upper()}")
    return found


def git(top, *args):
    r = subprocess.run(["git", "-C", str(top), *args], capture_output=True, text=True, errors="replace")
    if r.returncode != 0:
        sys.exit(f"git {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout


def scan_patch(text, out, label):
    """A `git log -p` or `git diff` output: each added line, named by commit (when any) and path."""
    commit, path, n = "", "", 0
    for line in text.splitlines():
        if line.startswith("commit "):
            commit = line.split()[1][:10]
        elif line.startswith("+++ "):
            path = line[6:] if line.startswith("+++ b/") else ""
        elif line.startswith("@@"):
            m = re.search(r"\+(\d+)", line)
            n = int(m.group(1)) - 1 if m else 0
        elif line.startswith("+") and path and not SKIP.search(path):
            n += 1
            for k in kinds_in(line[1:]):
                out.append(f"{label(commit, path, n)}: {k}")
        elif not line.startswith("-"):
            n += 1


def scan_all(top):
    out = []
    for path in git(top, "ls-files", "-z").split("\0"):
        f = Path(top) / path
        if not path or SKIP.search(path) or not f.is_file():
            continue
        try:
            lines = f.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        for i, line in enumerate(lines):
            for k in kinds_in(line):
                out.append(f"{path}:{i + 1}: {k}")
    scan_patch(git(top, "log", "-p", "--all", "--no-color", "--unified=0"), out,
               lambda c, p, n: f"commit {c} {p}")
    return sorted(set(out))


def scan_range(top, rng):
    out = []
    scan_patch(git(top, "log", "-p", "--no-color", "--unified=0", rng), out, lambda c, p, n: f"commit {c} {p}")
    return sorted(set(out))


def staged():
    out = []
    scan_patch(git(".", "diff", "--cached", "--no-color", "--unified=0"), out, lambda c, p, n: f"{p}:{n}")
    return out


def install(top):
    if subprocess.run(["git", "-C", str(top), "config", "--get", "core.hooksPath"], capture_output=True).returncode == 0:
        return "core.hooksPath set: not installed, the hooks of that folder run instead"
    hooks = Path(top) / git(top, "rev-parse", "--git-common-dir").strip() / "hooks"
    hook = hooks / "pre-commit"
    if hook.exists():
        same = hook.read_bytes() == Path(__file__).read_bytes()
        return f"{hook}: " + ("already this hook" if same else "another hook is there: left as is")
    hooks.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(__file__, hook)
    hook.chmod(hook.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    return f"{hook}: installed"


def main(argv):
    if Path(argv[0]).name == "pre-commit":
        out = staged()
        if out:
            print("\n".join(out), file=sys.stderr)
            print("commit refused: a secret's value; read it by its name, from outside the repository", file=sys.stderr)
        return 1 if out else 0
    if len(argv) == 3 and argv[1] == "all":
        out = scan_all(argv[2])
    elif len(argv) == 4 and argv[1] == "range":
        out = scan_range(argv[2], argv[3])
    elif len(argv) == 3 and argv[1] == "install":
        print(install(argv[2]))
        return 0
    else:
        print("\n".join(l.strip() for l in __doc__.strip().splitlines()[2:5]), file=sys.stderr)
        return 2
    for line in out:
        print(line)
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
