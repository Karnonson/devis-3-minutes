#!/usr/bin/env python3
"""The nightly cleanup of fleet's Cloud Run pipeline (fleet: pipelines/cloud-run.md). Run by cleanup.yml.

    cleanup.py released    the released service: keep the newest KEEP_IMAGES images, and whatever visitors
                           or a label (candidate, checked, previous) point to; remove the other images and
                           the revisions that ran them.
    cleanup.py previews    the previews: remove the address of a pull request that is closed or got no
                           commit for PREVIEW_DAYS days; then every revision and image no address points to.

Settings come from the environment (.github/pipeline.env). DRY_RUN=1 lists and removes nothing.
An image younger than an hour is never removed: a run may be about to put it online.
"""
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

E = os.environ
DRY = bool(E.get("DRY_RUN"))
NOW = datetime.now(timezone.utc)
YOUNG = timedelta(hours=1)
lines = []


def say(text):
    print(text, flush=True)
    lines.append(text)


def gcloud(*args, check=True):
    done = subprocess.run(["gcloud", *args], capture_output=True, text=True)
    if done.returncode and check:
        sys.exit(f"::error::Google refused, or the call failed: gcloud {' '.join(args[:4])}: {done.stderr[:300]}")
    return done


def read(*args):
    return json.loads(gcloud(*args, "--format", "json").stdout or "[]")


def remove(what, *args):
    """Runs one removal. Returns True when it is gone (or would be, in a dry run)."""
    if DRY:
        say(f"- would remove {what}")
        return True
    done = gcloud(*args, "--quiet", check=False)
    if done.returncode:
        say(f"- left {what}: {done.stderr.strip().splitlines()[-1][:160] if done.stderr.strip() else 'refused'}")
        return False
    say(f"- removed {what}")
    return True


def when(stamp):
    return datetime.strptime(stamp[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)


def tags_of(image):
    tags = image.get("tags") or []
    return [t.strip() for t in tags.split(",") if t.strip()] if isinstance(tags, str) else tags


def parts_of(store, digest, token):
    """An image may be stored as one head and several parts. Returns the digests of the parts."""
    host, path = store.split("/", 1)
    ask = urllib.request.Request(
        f"https://{host}/v2/{path}/manifests/{digest}",
        headers={"Authorization": f"Bearer {token}",
                 "Accept": "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json"})
    with urllib.request.urlopen(ask, timeout=30) as answer:
        return [m["digest"] for m in json.load(answer).get("manifests", [])]


def sweep_images(store, keep):
    """Removes every image of the store that `keep` (a set of digests) does not hold. A kept head keeps its
    parts, and a kept part keeps its head. Returns the digests still there, and how many were removed."""
    images = read("artifacts", "docker", "images", "list", store, "--include-tags")
    token = gcloud("auth", "print-access-token").stdout.strip()
    parts = {}
    for image in images:
        kind = image.get("metadata", {}).get("mediaType", "")
        if "index" in kind or "manifest.list" in kind:
            parts[image["version"]] = parts_of(store, image["version"], token)
    keep = set(keep) | {i["version"] for i in images if when(i.get("updateTime") or i["createTime"]) > NOW - YOUNG}
    for head, its in parts.items():
        if head in keep or keep & set(its):
            keep |= {head, *its}
    there, removed = keep & {i["version"] for i in images}, 0
    # Heads first: a part cannot go while its head is there.
    for image in sorted(images, key=lambda i: i["version"] not in parts):
        digest = image["version"]
        if digest in keep:
            continue
        name = ", ".join(tags_of(image)) or digest[7:19]
        if remove(f"image {name}", "artifacts", "docker", "images", "delete", f"{store}@{digest}", "--delete-tags"):
            removed += 1
        else:
            there.add(digest)
    return there, removed


def service(name, on):
    described = read("run", "services", "describe", name, *on)
    revisions = read("run", "revisions", "list", "--service", name, *on)
    return described["status"].get("traffic", []), revisions


def released():
    on = ["--project", E["GCP_PROJECT"], "--region", E["GCP_REGION"]]
    store = f"{E['GCP_REGION']}-docker.pkg.dev/{E['GCP_PROJECT']}/{E['IMAGE_STORE']}/{E['SERVICE']}"
    keep_count = int(E.get("KEEP_IMAGES") or 3)
    traffic, revisions = service(E["SERVICE"], on)
    needed = {t["revisionName"] for t in traffic if t.get("percent") or t.get("tag")}
    digest_of = {r["metadata"]["name"]: (r["status"].get("imageDigest") or "").rpartition("@")[2] for r in revisions}

    say(f"### Released service `{E['SERVICE']}`" + (" (dry run)" if DRY else ""))
    images = read("artifacts", "docker", "images", "list", store, "--include-tags")
    named = sorted((i for i in images if tags_of(i)), key=lambda i: i.get("updateTime") or i["createTime"], reverse=True)
    keep = {i["version"] for i in named[:keep_count]} | {digest_of[r] for r in needed if digest_of.get(r)}
    there, removed = sweep_images(store, keep)

    # A revision goes when its image is gone, unless visitors or a label need it.
    gone = 0
    for revision in revisions:
        name = revision["metadata"]["name"]
        if name not in needed and digest_of.get(name) not in there:
            gone += remove(f"revision {name}", "run", "revisions", "delete", name, *on)
    say(f"\nKept the newest {keep_count} images, and what visitors or a label need: {len(there)} stored pieces. "
        f"Removed {removed} pieces and {gone} revisions.")


def previews():
    on = ["--project", E["PREVIEW_PROJECT"], "--region", E["GCP_REGION"]]
    store = f"{E['GCP_REGION']}-docker.pkg.dev/{E['PREVIEW_PROJECT']}/{E['PREVIEW_IMAGE_STORE']}/{E['PREVIEW_SERVICE']}"
    days = int(E.get("PREVIEW_DAYS") or 7)
    name = E["PREVIEW_SERVICE"]
    listed = subprocess.run(["gh", "pr", "list", "--state", "open", "--limit", "500", "--json", "number"],
                            capture_output=True, text=True)
    if listed.returncode:
        sys.exit(f"::error::GitHub did not give the open pull requests: {listed.stderr[:300]}")
    open_ones = {str(p["number"]) for p in json.loads(listed.stdout)}
    traffic, revisions = service(name, on)
    made = {r["metadata"]["name"]: when(r["metadata"]["creationTimestamp"]) for r in revisions}

    say(f"### Previews `{name}`" + (" (dry run)" if DRY else ""))
    dropped = set()
    for entry in traffic:
        tag = entry.get("tag", "")
        if not tag.startswith("pr-"):
            continue
        number = tag[3:]
        if number not in open_ones:
            why = "its pull request is closed"
        elif NOW - made.get(entry["revisionName"], NOW) >= timedelta(days=days):
            why = f"no commit for {days} days"
        else:
            continue
        if remove(f"the address of pull request {number} ({why})",
                  "run", "services", "update-traffic", name, *on, "--remove-tags", tag):
            dropped.add(tag)
            if not DRY and number in open_ones:
                subprocess.run(["gh", "pr", "comment", number, "--body",
                                f"**Preview: removed** after {days} days without a commit. A new commit brings it back."],
                               capture_output=True)

    online = [t for t in traffic if t.get("tag", "").startswith("pr-") and t["tag"] not in dropped]
    needed = {t["revisionName"] for t in traffic if t.get("percent")} | {t["revisionName"] for t in online}
    gone = 0
    for revision in revisions:
        rname = revision["metadata"]["name"]
        if "-pr-" in rname and rname not in needed:
            gone += remove(f"revision {rname}", "run", "revisions", "delete", rname, *on)
    keep = {(r["status"].get("imageDigest") or "").rpartition("@")[2] for r in revisions if r["metadata"]["name"] in needed}
    there, removed = sweep_images(store, keep - {""})
    say(f"\n{len(online)} previews online, {len(there)} stored pieces kept. "
        f"Removed {removed} pieces and {gone} revisions.")


if __name__ == "__main__":
    {"released": released, "previews": previews}[sys.argv[1]]()
    if E.get("GITHUB_STEP_SUMMARY"):
        with open(E["GITHUB_STEP_SUMMARY"], "a") as page:
            page.write("\n".join(lines) + "\n")
