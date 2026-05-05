#!/usr/bin/env python3
"""Idempotently merge the VeloRail Seeds backlog into this repo.

The setup pack uses a portable issue shape with ``depends_on`` and
``assigned_role``. This repo's Seeds CLI stores dependencies as ``blockedBy`` /
``blocks`` and uses labels for role filtering, so this script adapts the pack
to the current repo schema instead of writing non-native fields.
"""
from __future__ import annotations

import json
import shutil
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path.cwd()
SEEDS_DIR = ROOT / ".seeds"
SEEDS_FILE = SEEDS_DIR / "issues.jsonl"
BACKLOG_FILE = ROOT / "velorail-seeds.jsonl"
ROLES_FILE = ROOT / "velorail-agent-roles.json"

SCALAR_FIELDS = ["title", "type", "priority", "status", "description"]
LIST_FIELDS = ["labels", "blockedBy", "blocks"]
VALID_STATUSES = {"open", "in_progress", "closed"}
VALID_TYPES = {"task", "bug", "feature", "epic"}


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for lineno, line in enumerate(path.read_text().splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError as exc:
            raise SystemExit(f"Invalid JSONL in {path} line {lineno}: {exc}") from exc
        if not isinstance(obj, dict):
            raise SystemExit(f"Invalid JSONL in {path} line {lineno}: expected object")
        rows.append(obj)
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) for row in rows)
    path.write_text(text + "\n")


def unique_list(values: object) -> list[str]:
    if values is None:
        return []
    raw = values if isinstance(values, list) else [values]
    result: list[str] = []
    for item in raw:
        if not isinstance(item, str) or item == "":
            continue
        if item not in result:
            result.append(item)
    return result


def normalize_incoming(issue: dict, now: str) -> dict:
    iid = issue.get("id")
    if not isinstance(iid, str) or not iid:
        raise SystemExit("Every incoming issue must have a string id.")

    title = issue.get("title")
    if not isinstance(title, str) or not title:
        raise SystemExit(f"{iid}: missing title")

    status = issue.get("status", "open")
    if status not in VALID_STATUSES:
        raise SystemExit(f"{iid}: invalid status {status!r}")

    issue_type = issue.get("type", "task")
    if issue_type not in VALID_TYPES:
        raise SystemExit(f"{iid}: invalid type {issue_type!r}")

    priority = issue.get("priority", 2)
    if not isinstance(priority, int) or priority < 0 or priority > 4:
        raise SystemExit(f"{iid}: invalid priority {priority!r}")

    labels = unique_list(issue.get("labels"))
    role = issue.get("assigned_role")
    if isinstance(role, str) and role:
        role_label = f"role/{role}"
        if role_label not in labels:
            labels.append(role_label)

    normalized = {
        "id": iid,
        "title": title,
        "status": status,
        "type": issue_type,
        "priority": priority,
        "createdAt": now,
        "updatedAt": now,
    }
    description = issue.get("description")
    if isinstance(description, str) and description:
        normalized["description"] = description
    if labels:
        normalized["labels"] = labels

    return normalized


def merge_issue(existing: dict, incoming: dict) -> dict:
    merged = dict(existing)

    for field in SCALAR_FIELDS:
        if (field not in merged or merged[field] in (None, "", [])) and incoming.get(field) not in (None, "", []):
            merged[field] = incoming[field]

    for field in LIST_FIELDS:
        current = unique_list(merged.get(field))
        for item in unique_list(incoming.get(field)):
            if item not in current:
                current.append(item)
        if current:
            merged[field] = current

    # If the existing description is very short and the incoming description is rich, append a VeloRail spec.
    existing_desc = str(existing.get("description", "") or "")
    incoming_desc = str(incoming.get("description", "") or "")
    if incoming_desc and "## Google Maps Integration" not in existing_desc and len(existing_desc) < 500:
        if existing_desc.strip():
            merged["description"] = existing_desc.rstrip() + "\n\n---\n\n## VeloRail Expanded Spec\n\n" + incoming_desc
        else:
            merged["description"] = incoming_desc

    # Keep setup-pack compatibility fields out of the active Seeds schema.
    if merged.get("id") in incoming_ids:
        merged.pop("assigned_role", None)
        merged.pop("depends_on", None)

    return merged


def add_dependency(rows_by_id: dict[str, dict], issue_id: str, depends_on_id: str, now: str) -> bool:
    issue = rows_by_id.get(issue_id)
    dependency = rows_by_id.get(depends_on_id)
    if issue is None:
        raise SystemExit(f"Cannot add dependency for unknown issue {issue_id}")
    if dependency is None:
        raise SystemExit(f"{issue_id} depends on missing issue {depends_on_id}")

    changed = False
    blocked_by = unique_list(issue.get("blockedBy"))
    if depends_on_id not in blocked_by:
        blocked_by.append(depends_on_id)
        issue["blockedBy"] = blocked_by
        issue["updatedAt"] = now
        changed = True

    blocks = unique_list(dependency.get("blocks"))
    if issue_id not in blocks:
        blocks.append(issue_id)
        dependency["blocks"] = blocks
        dependency["updatedAt"] = now
        changed = True

    return changed


incoming_ids: set[str] = set()


def main() -> None:
    if not BACKLOG_FILE.exists():
        raise SystemExit(f"Missing {BACKLOG_FILE}. Copy velorail-seeds.jsonl into repo root first.")

    incoming_raw = read_jsonl(BACKLOG_FILE)
    if not incoming_raw:
        raise SystemExit("Backlog file contains no issues.")

    now = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    seen = set()
    depends_on: dict[str, list[str]] = {}
    incoming: list[dict] = []
    for issue in incoming_raw:
        iid = issue.get("id")
        if not iid:
            raise SystemExit("Every incoming issue must have an id.")
        if iid in seen:
            raise SystemExit(f"Duplicate incoming issue id: {iid}")
        seen.add(iid)
        incoming_ids.add(iid)
        depends_on[iid] = unique_list(issue.get("depends_on"))
        incoming.append(normalize_incoming(issue, now))

    existing = read_jsonl(SEEDS_FILE)

    if SEEDS_FILE.exists():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = SEEDS_FILE.with_suffix(f".jsonl.backup-{stamp}")
        shutil.copy2(SEEDS_FILE, backup)
        print(f"Backed up existing Seeds file to {backup}")

    by_id = {}
    order = []
    for issue in existing:
        iid = issue.get("id")
        if iid:
            by_id[iid] = issue
            order.append(iid)
        else:
            # Preserve anonymous/unknown rows by synthetic id in output order.
            synthetic = f"__anonymous_{len(order)}"
            by_id[synthetic] = issue
            order.append(synthetic)

    added = 0
    updated = 0
    for issue in incoming:
        iid = issue["id"]
        if iid in by_id:
            before = json.dumps(by_id[iid], sort_keys=True)
            by_id[iid] = merge_issue(by_id[iid], issue)
            after = json.dumps(by_id[iid], sort_keys=True)
            if before != after:
                by_id[iid]["updatedAt"] = now
                updated += 1
        else:
            by_id[iid] = issue
            order.append(iid)
            added += 1

    dependency_updates = 0
    for issue_id, dependency_ids in depends_on.items():
        for depends_on_id in dependency_ids:
            if add_dependency(by_id, issue_id, depends_on_id, now):
                dependency_updates += 1

    rows = [by_id[iid] for iid in order]
    write_jsonl(SEEDS_FILE, rows)

    print(f"Merged VeloRail Seeds backlog into {SEEDS_FILE}")
    print(f"Added: {added}")
    print(f"Updated: {updated}")
    print(f"Dependency links updated: {dependency_updates}")
    print(f"Total rows: {len(rows)}")

    if ROLES_FILE.exists():
        try:
            json.loads(ROLES_FILE.read_text())
            print(f"Validated {ROLES_FILE}")
        except json.JSONDecodeError as exc:
            raise SystemExit(f"Invalid {ROLES_FILE}: {exc}") from exc

if __name__ == "__main__":
    main()
