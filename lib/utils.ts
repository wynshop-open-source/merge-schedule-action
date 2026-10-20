import type { SimplePullRequest } from "@octokit/webhooks-types";

export function hasScheduleCommand(text: string | null): boolean {
  if (!text) return false;
  return /(^|\n)\/schedule/.test(text);
}

export function isFork(pullRequest: SimplePullRequest): boolean {
  return pullRequest.head.repo.fork;
}

export function getScheduleDateString(text: string | null): string {
  if (!text) return "";
  return (
    text
      .match(/(^|\n)\/schedule[ \t]+(.*)/)
      ?.pop()
      ?.trim() ?? ""
  );
}

const scheduleFormats = `"/schedule YYYY-MM-DD" or "/schedule YYYY-MM-DDTHH:MM:SSZ"`;

/**
 * Returns why the /schedule command in a pull request body cannot be
 * scheduled, or "" if it can. A bare "/schedule" or a loosely parsed date
 * (e.g. "/schedule 1" is the year 2001) would merge on the next cron run.
 */
export function getScheduleError(text: string | null): string {
  const commandCount = text?.match(/(^|\n)\/schedule/g)?.length ?? 0;
  if (commandCount > 1) {
    return `Scheduling failed: found ${commandCount} "/schedule" commands, keep exactly one`;
  }
  const datestring = getScheduleDateString(text);
  if (!datestring) {
    return `Scheduling failed: "/schedule" requires a date, use ${scheduleFormats}`;
  }
  if (!isValidDate(datestring)) {
    return `Scheduling failed: "${datestring}" is not a valid date, use ${scheduleFormats}`;
  }
  return "";
}

type MergeMethod = "merge" | "squash" | "rebase";

export function isValidMergeMethod(method: string): method is MergeMethod {
  return ["merge", "squash", "rebase"].includes(method);
}

const isoDatePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z|[+-](\d{2}):(\d{2}))?)?$/;

/**
 * Strict ISO 8601 date or date-time with real calendar values: new Date()
 * alone accepts "1" or "2022" and rolls "2022-02-30" over into March
 */
export function isValidDate(datestring: string): boolean {
  const match = isoDatePattern.exec(datestring);
  if (!match) return false;
  const [
    year,
    month,
    day,
    hour,
    minute,
    second,
    fraction,
    offsetHour,
    offsetMinute,
  ] = match.slice(1, 10).map((group) => Number(group ?? 0));
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth[month - 1] &&
    // "T24:00" is a valid end-of-day time, anything past it is not
    (hour < 24 ||
      (hour === 24 && minute === 0 && second === 0 && fraction === 0)) &&
    minute < 60 &&
    second < 60 &&
    offsetHour < 24 &&
    offsetMinute < 60
  );
}

export function stringifyDate(datestring: string): string {
  const dateTimeString = new Date(datestring).toISOString().split(".")[0];
  const [date, time] = dateTimeString.split("T");
  return `${date} ${time}`;
}

export function isBaseBranchModifiedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as { status: unknown }).status === 405 &&
    /base branch was modified/i.test(error.message)
  );
}
