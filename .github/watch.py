#!/usr/bin/env python3
"""The watch of fleet's Cloud Run pipeline (fleet: pipelines/cloud-run.md). Run by release.yml and watch.yml.

    watch.py after-open     watches the visitors' address for WATCH_MINUTES after a release was opened.
                            Exits 3, printing what failed, as soon as it has failed twice in a row.
    watch.py alert <labels> <what happened>
                            says it in the repository: one open issue per incident, never a second one.
    watch.py scheduled      the watch that runs by itself: is the site answering? Failing twice in a row,
                            it opens an issue, and when a release was opened less than GO_BACK_WITHIN_MINUTES
                            ago it starts the way back. Answering again, it says so and closes what it opened.

Filtered on purpose: one failure is not an alert (a slow start, a lost packet), and one incident is one issue,
updated without a new notice while it lasts.

Settings come from the environment (.github/pipeline.env). It reads the visitors' address from outside, like a
visitor: it holds no key. The issue's words are this script's own, never something read from the site.
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

E = os.environ
LABEL = "pipeline-alert"          # every issue of the watch
DOWN = "still-down"               # the site is failing now
BACK = "went-back"                # the visitors were sent back: the release that failed is still to fix
NOW = datetime.now(timezone.utc)
STAMP = "%Y-%m-%d %H:%M UTC"


def address() -> str:
    found = (E.get("PUBLIC_ADDRESS") or E.get("SERVICE_ADDRESS") or "").rstrip("/")
    if not found:
        sys.exit("::error::No address to watch: set PUBLIC_ADDRESS in .github/pipeline.env.")
    return found


def probe() -> str:
    """What failed, as one line; empty when every page answered."""
    out = []
    for path in [E.get("VERSION_PATH") or "/version", *(E.get("CHECK_PATHS") or "/").split()]:
        try:
            ask = urllib.request.Request(address() + path, headers={"User-Agent": "pipeline-watch"})
            with urllib.request.urlopen(ask, timeout=20) as answer:
                code = answer.status
        except urllib.error.HTTPError as error:
            code = error.code
        except Exception as error:                      # no answer at all: a timeout, a refused connection
            code = type(error).__name__
        if code != 200:
            out.append(f"{path} answered {code}")
    return ", ".join(out)


def failing(wait: int) -> str:
    """Failing twice in a row, `wait` seconds apart: what failed the second time. Else empty."""
    if not probe():
        return ""
    time.sleep(wait)
    return probe()


def gh(*args, check=True) -> str:
    done = subprocess.run(["gh", *args], capture_output=True, text=True)
    if done.returncode and check:
        sys.exit(f"::error::GitHub refused: gh {' '.join(args[:3])}: {done.stderr.strip()[:300]}")
    return done.stdout.strip()


def open_alerts() -> list[dict]:
    """The watch's own open issues: its label, and written by the pipeline, never by a passer-by."""
    found = json.loads(gh("issue", "list", "--label", LABEL, "--state", "open", "--limit", "20",
                          "--json", "number,author,labels,title") or "[]")
    return [i for i in found if (i.get("author") or {}).get("login", "").replace("app/", "") in ("github-actions", "github-actions[bot]")]


def labels(issue: dict) -> set[str]:
    return {label["name"] for label in issue.get("labels", [])}


def run_link() -> str:
    return f"{E.get('GITHUB_SERVER_URL', 'https://github.com')}/{E.get('GITHUB_REPOSITORY', '')}/actions/runs/{E.get('GITHUB_RUN_ID', '')}"


def alert(wanted: str, what: str) -> None:
    """`wanted`: the labels of the incident, separated by commas."""
    want = [w for w in wanted.split(",") if w]
    for name, color, about in ((LABEL, "B60205", "Raised by the pipeline's watch"), (DOWN, "D93F0B", "The site is failing now"),
                               (BACK, "FBCA04", "The visitors were sent back: the release that failed is to fix")):
        gh("label", "create", name, "--color", color, "--description", about, check=False)
    text = f"{what}\n\n- Address watched: {address()}\n- Seen: {NOW.strftime(STAMP)}\n- Run: {run_link()}"
    ongoing = [i for i in open_alerts() if DOWN in labels(i)]
    if ongoing:                                  # the same incident: add to it, raise no second issue
        number = str(ongoing[0]["number"])
        gh("issue", "comment", number, "--body", text)
        for label in want:
            if label not in labels(ongoing[0]):
                gh("issue", "edit", number, "--add-label", label)
        print(f"Added to issue {number}.")
        return
    title = "The site failed after a release, and the visitors were sent back" if BACK in want else "The site is failing"
    print(gh("issue", "create", "--title", title, "--label", LABEL, *[x for label in want for x in ("--label", label)], "--body", text))


def after_open() -> int:
    end = time.time() + float(E.get("WATCH_MINUTES") or 5) * 60
    while time.time() < end:
        bad = failing(20)
        if bad:
            print(bad)
            return 3
        time.sleep(30)
    return 0


def release_runs() -> list[dict]:
    return json.loads(gh("run", "list", "--workflow", "release.yml", "--status", "success", "--limit", "30",
                         "--json", "displayTitle,updatedAt", check=False) or "[]")


def opened_lately() -> bool:
    """A release was opened less than GO_BACK_WITHIN_MINUTES ago, and nobody went back since."""
    runs = release_runs()
    for run in runs:                             # newest first
        title = run.get("displayTitle", "")
        if title.startswith("go-back"):
            return False
        if title.startswith("open"):
            when = datetime.strptime(run["updatedAt"][:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
            return NOW - when < timedelta(minutes=float(E.get("GO_BACK_WITHIN_MINUTES") or 120))
    return False


def scheduled() -> int:
    bad = failing(60)
    mine = open_alerts()
    ongoing = [i for i in mine if DOWN in labels(i)]
    if not bad:
        for issue in ongoing:                    # it is back
            number = str(issue["number"])
            gh("issue", "edit", number, "--remove-label", DOWN)
            if BACK in labels(issue):
                gh("issue", "comment", number, "--body",
                   f"The site answers again since {NOW.strftime(STAMP)}, on the release before. The release that failed is still to fix: this issue stays open for that.")
            else:
                gh("issue", "comment", number, "--body", f"The site answers again since {NOW.strftime(STAMP)}. Nothing was changed by the pipeline.")
                gh("issue", "close", number)
        print("The site answers." + (f" {len(ongoing)} issue(s) updated." if ongoing else ""))
        return 0
    if not any(run.get("displayTitle", "").startswith("open") for run in release_runs()):
        print(f"Nothing was ever opened to the visitors here: not an alert yet ({bad}).")
        return 0
    print(f"::warning::The site is failing: {bad}")
    if ongoing:                                  # already said: no new notice while it lasts
        print(f"Already said in issue {ongoing[0]['number']}.")
        return 0
    if opened_lately():
        alert(f"{BACK},{DOWN}", f"The site is failing: {bad}.\n\nA release was opened less than {E.get('GO_BACK_WITHIN_MINUTES') or 120} minutes ago, "
                                 "so the way back was started: the visitors return to the release before.")
        gh("workflow", "run", "release.yml", "--ref", "main", "-f", "action=go-back")
    else:
        alert(DOWN, f"The site is failing: {bad}.\n\nNo release was opened lately, so going back would not help: "
                    "the cause is elsewhere (the data, a provider, a quota, the host). Nothing was changed.")
    return 0


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "after-open":
        sys.exit(after_open())
    if mode == "alert" and len(sys.argv) == 4:
        alert(sys.argv[2], sys.argv[3])
    elif mode == "scheduled":
        sys.exit(scheduled())
    else:
        sys.exit("usage: watch.py after-open | alert <labels> <what happened> | scheduled")
