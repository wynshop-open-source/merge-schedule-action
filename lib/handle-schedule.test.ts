import mockDate from "mockdate";
import { http, HttpResponse } from "msw";
import timezoneMock from "timezone-mock";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import handleSchedule from "./handle-schedule";
import * as comment from "./comment";
import stdMocks from "std-mocks";
import { server } from "../test/mocks";

timezoneMock.register("UTC");
mockDate.set("2022-06-10T00:00:00.000Z");

beforeEach(() => {
  stdMocks.use();
  process.env.INPUT_MERGE_METHOD = "merge";
});

afterEach(() => {
  stdMocks.restore();
});

describe("handleSchedule", () => {
  test("invalid merge method", async () => {
    process.env.INPUT_MERGE_METHOD = "bad-method";

    await handleSchedule();

    expect(stdMocks.flush().stdout).toEqual([
      `::error::merge_method "bad-method" is invalid\n`,
    ]);
  });

  test("due pull requests", async () => {
    const createComment = vi.spyOn(comment, "createComment");
    const updateComment = vi.spyOn(comment, "updateComment");

    await handleSchedule();

    const outputLines = stdMocks.flush().stdout.filter((line) => {
      if (line === "\n" || line.startsWith("::set-output")) return null;
      return line;
    });

    expect(outputLines).toEqual([
      `Loading open pull requests\n`,
      `7 scheduled pull requests found\n`,
      `6 due pull requests found\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/2 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-22\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/3 merged\n`,
      `Comment updated: https://github.com/gr2m/merge-schedule-action/issues/3#issuecomment-31\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/13#issuecomment-132\n`,
      `Label added: "automerge-fail"\n`,
      `Comment updated: https://github.com/gr2m/merge-schedule-action/issues/6#issuecomment-61\n`,
      `Label added: "automerge-fail"\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/7 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/7#issuecomment-72\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/14 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/14#issuecomment-142\n`,
    ]);
    expect(createComment.mock.calls).toHaveLength(4);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on 2022-06-08 (UTC) successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(createComment.mock.calls[1][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      Scheduled merge failed: Pull Request is not mergeable
      In order to let the automerge-automation try again, the label "automerge-fail" should be removed.
      <!-- Merge Schedule Pull Request Comment Fail -->"
    `);
    expect(createComment.mock.calls[2][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on next cron expression successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(updateComment.mock.calls).toHaveLength(2);
    expect(updateComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on 2022-06-09 (UTC) successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(updateComment.mock.calls[1][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      Scheduled merge failed: Pull Request is not mergeable
      In order to let the automerge-automation try again, the label "automerge-fail" should be removed.
      <!-- Merge Schedule Pull Request Comment Fail -->"
    `);
  });

  test("due pull requests with require_statuses_success = true", async () => {
    process.env.INPUT_REQUIRE_STATUSES_SUCCESS = "true";
    const createComment = vi.spyOn(comment, "createComment");
    const updateComment = vi.spyOn(comment, "updateComment");

    await handleSchedule();

    const outputLines = stdMocks.flush().stdout.filter((line) => {
      if (line === "\n" || line.startsWith("::set-output")) return null;
      return line;
    });

    expect(outputLines).toEqual([
      `Loading open pull requests\n`,
      `7 scheduled pull requests found\n`,
      `6 due pull requests found\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/2 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-22\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/3 is not ready to be merged yet because all checks are not completed or statuses are not success\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/13#issuecomment-132\n`,
      `Label added: "automerge-fail"\n`,
      `Comment updated: https://github.com/gr2m/merge-schedule-action/issues/6#issuecomment-61\n`,
      `Label added: "automerge-fail"\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/7 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/7#issuecomment-72\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/14 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/14#issuecomment-142\n`,
    ]);
    expect(createComment.mock.calls).toHaveLength(4);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on 2022-06-08 (UTC) successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(createComment.mock.calls[1][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      Scheduled merge failed: Pull Request is not mergeable
      In order to let the automerge-automation try again, the label "automerge-fail" should be removed.
      <!-- Merge Schedule Pull Request Comment Fail -->"
    `);
    expect(createComment.mock.calls[2][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on next cron expression successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(updateComment.mock.calls).toHaveLength(1);
    expect(updateComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      Scheduled merge failed: Pull Request is not mergeable
      In order to let the automerge-automation try again, the label "automerge-fail" should be removed.
      <!-- Merge Schedule Pull Request Comment Fail -->"
    `);
  });

  test("retries merge when base branch was modified, then succeeds", async () => {
    let mergeAttempts = 0;
    server.use(
      http.get("https://api.github.com/repos/:owner/:repo/pulls", () => {
        return HttpResponse.json([
          {
            number: 2,
            html_url: "https://github.com/gr2m/merge-schedule-action/pull/2",
            state: "open",
            body: "Simple body\n/schedule 2022-06-08",
            head: { sha: "abc123success", repo: { fork: false } },
            labels: [],
          },
        ]);
      }),
      http.put(
        "https://api.github.com/repos/:owner/:repo/pulls/:pull_number/merge",
        () => {
          mergeAttempts++;
          if (mergeAttempts <= 2) {
            return HttpResponse.json(
              {
                message:
                  "Base branch was modified. Review and try the merge again.",
              },
              { status: 405 }
            );
          }
          return HttpResponse.json({
            merged: true,
            message: "Pull Request successfully merged",
          });
        }
      )
    );

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    await Promise.all([handleSchedule(), vi.runAllTimersAsync()]);

    vi.useRealTimers();

    const outputLines = stdMocks.flush().stdout.filter((line) => {
      if (line === "\n" || line.startsWith("::set-output")) return null;
      return line;
    });

    expect(outputLines).toEqual([
      `Loading open pull requests\n`,
      `1 scheduled pull requests found\n`,
      `1 due pull requests found\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/2 base branch was modified, retrying in 1000ms (attempt 1/3)\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/2 base branch was modified, retrying in 2000ms (attempt 2/3)\n`,
      `https://github.com/gr2m/merge-schedule-action/pull/2 merged\n`,
      `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-22\n`,
    ]);
    expect(mergeAttempts).toBe(3);
  });

  test("does not retry a permanent 405 (not mergeable)", async () => {
    let mergeAttempts = 0;
    server.use(
      http.get("https://api.github.com/repos/:owner/:repo/pulls", () => {
        return HttpResponse.json([
          {
            number: 2,
            html_url: "https://github.com/gr2m/merge-schedule-action/pull/2",
            state: "open",
            body: "Simple body\n/schedule 2022-06-08",
            head: { sha: "abc123success", repo: { fork: false } },
            labels: [],
          },
        ]);
      }),
      http.put(
        "https://api.github.com/repos/:owner/:repo/pulls/:pull_number/merge",
        () => {
          mergeAttempts++;
          return HttpResponse.text("Pull Request is not mergeable", {
            status: 405,
          });
        }
      )
    );

    await handleSchedule();

    expect(mergeAttempts).toBe(1);
  });
});
