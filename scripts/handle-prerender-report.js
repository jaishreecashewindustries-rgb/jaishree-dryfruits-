/**
 * Turns build/prerender-report.json into GitHub issues — one per currently
 * broken route, deduplicated by exact title match (not fuzzy `gh issue
 * list --search`, which can cross-match similar product IDs), and
 * auto-closes issues for routes that have since started passing.
 *
 * Requires `gh` CLI authenticated (GITHUB_TOKEN is set automatically inside
 * GitHub Actions). Safe to run locally too — no-ops gracefully if `gh` isn't
 * available or the report doesn't exist.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPORT_PATH = path.join(__dirname, "..", "build", "prerender-report.json");

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

function labelFor(status) {
  return status === "timeout" ? "prerender-timeout" : "prerender-mismatch";
}

function titleFor(status, route) {
  return `[${labelFor(status)}] ${route}`;
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.log("[report] no prerender-report.json found — nothing to do.");
    return;
  }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const currentFailures = [
    ...report.timeout.map((r) => ({ ...r, status: "timeout" })),
    ...report.mismatch.map((r) => ({ ...r, status: "mismatch" })),
  ];

  // Exact-match, not fuzzy: pull all open issues carrying either label,
  // compare titles as plain strings.
  let openIssues = [];
  try {
    const raw = gh([
      "issue", "list",
      "--label", "prerender-timeout,prerender-mismatch",
      "--state", "open",
      "--json", "number,title",
      "--limit", "200",
    ]);
    openIssues = JSON.parse(raw);
  } catch (err) {
    console.error("[report] could not list existing issues — skipping dedup/auto-close this run:", err.message);
    openIssues = [];
  }

  const currentTitles = new Set(currentFailures.map((f) => titleFor(f.status, f.route)));

  // Create new issues only for failures that don't already have one.
  for (const failure of currentFailures) {
    const title = titleFor(failure.status, failure.route);
    const existing = openIssues.find((i) => i.title === title);
    if (existing) {
      console.log(`[report] already open, skipping duplicate: ${title}`);
      continue;
    }
    const body = [
      `**Route:** \`${failure.route}\``,
      `**Failure type:** ${failure.status === "timeout" ? "Data never became ready (waitForSelector timeout) — page is likely broken or missing." : "Content mismatch — rendered page did not contain the expected text (cloaking risk, needs review before it reaches search results)."}`,
      `**Reason:** ${failure.reason || "n/a"}`,
      "",
      `_Auto-filed by the nightly prerender workflow. This route was skipped — it still works as a normal client-rendered page, it's just not prerendered for search engines until this is fixed._`,
    ].join("\n");
    try {
      gh(["issue", "create", "--title", title, "--body", body, "--label", labelFor(failure.status)]);
      console.log(`[report] opened issue: ${title}`);
    } catch (err) {
      console.error(`[report] failed to create issue for ${title}:`, err.message);
    }
  }

  // Auto-close issues for routes that no longer fail.
  for (const issue of openIssues) {
    if (currentTitles.has(issue.title)) continue; // still failing
    try {
      gh(["issue", "close", String(issue.number), "--comment", "Auto-resolved — this route passed prerender validation on the latest run."]);
      console.log(`[report] auto-closed: ${issue.title}`);
    } catch (err) {
      console.error(`[report] failed to close issue #${issue.number}:`, err.message);
    }
  }
}

main();
