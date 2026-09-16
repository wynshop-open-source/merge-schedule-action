import * as github from "@actions/github";
import { retry } from "@octokit/plugin-retry";

export default function getOctokit(token: string) {
  return github.getOctokit(
    token,
    {
      request: { fetch },
      // 405 added to the plugin's default doNotRetry list: without it, this
      // plugin would blindly retry every 405 (including a genuinely
      // unmergeable PR). The targeted "base branch was modified" retry in
      // handle-schedule.ts is the only thing that should retry a 405.
      retry: { doNotRetry: [400, 401, 403, 404, 405, 410, 422, 451] },
    },
    retry
  );
}
