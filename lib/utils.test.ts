import timezoneMock from "timezone-mock";
import { test, expect } from "vitest";
import {
  getScheduleDateString,
  getScheduleError,
  hasScheduleCommand,
  isBaseBranchModifiedError,
  isValidMergeMethod,
  isValidDate,
  stringifyDate,
} from "./utils";

timezoneMock.register("UTC");

test("getScheduleDateString", () => {
  expect(getScheduleDateString("")).toBe("");
  expect(getScheduleDateString("/schedule")).toBe("");
  expect(getScheduleDateString("/schedule 2022-06-08")).toBe("2022-06-08");
  expect(getScheduleDateString("/schedule 2022-06-08T12:00:00")).toBe(
    "2022-06-08T12:00:00"
  );
  expect(getScheduleDateString("/schedule   ")).toBe("");
  expect(getScheduleDateString("/schedule 2022-06-08 \r\nmore")).toBe(
    "2022-06-08"
  );
});

test("getScheduleError", () => {
  const format = `use "/schedule YYYY-MM-DD" or "/schedule YYYY-MM-DDTHH:MM:SSZ"`;
  expect(getScheduleError("/schedule")).toBe(
    `Scheduling failed: "/schedule" requires a date, ${format}`
  );
  expect(getScheduleError("body\n/schedule  \r\nmore")).toBe(
    `Scheduling failed: "/schedule" requires a date, ${format}`
  );
  // new Date() parses these, but they are not what anyone means
  for (const date of [
    "2022-06-08T09:00:00+24:00",
    "2022-06-08T09:00:00-24:00",
    "2022-06-08T09:00:00+00:60",
    "2022-06-08T09:00:00+99:99",
    "2022-06-08T24:01:00Z",
    "2022-06-08T24:00:01Z",
    "2022-06-08T24:00:00.001Z",
    "1",
    "0",
    "2022",
    "06/08/2022",
    "2022-02-30",
    "2022-16-08",
  ]) {
    expect(getScheduleError(`/schedule ${date}`)).toBe(
      `Scheduling failed: "${date}" is not a valid date, ${format}`
    );
  }
  expect(getScheduleError("/schedule 2022-06-08\n/schedule 2027-06-08")).toBe(
    `Scheduling failed: found 2 "/schedule" commands, keep exactly one`
  );
  expect(getScheduleError("/schedule\n/schedule 2022-06-08")).toBe(
    `Scheduling failed: found 2 "/schedule" commands, keep exactly one`
  );
  expect(getScheduleError("/schedule 2022-06-08")).toBe("");
  expect(getScheduleError("/schedule\t2022-06-08")).toBe("");
  expect(getScheduleError("/schedule 2024-02-29")).toBe("");
  expect(
    getScheduleError("body\r\n/schedule 2022-06-08T09:00:00.000Z\r\n")
  ).toBe("");
  expect(getScheduleError("/schedule 2022-06-08T09:00:00+02:00")).toBe("");
  expect(getScheduleError("/schedule 2022-06-08T09:00")).toBe("");
  expect(getScheduleError("/schedule 2022-06-08T24:00:00.000Z")).toBe("");
  expect(getScheduleError("/schedule 2022-12-31T24:00")).toBe("");
});

test("hasScheduleCommand", () => {
  expect(hasScheduleCommand(null)).toBe(false);
  expect(hasScheduleCommand("")).toBe(false);
  expect(hasScheduleCommand("/schedule")).toBe(true);
  expect(hasScheduleCommand("/schedule ")).toBe(true);
  expect(hasScheduleCommand("\n/schedule")).toBe(true);
  expect(hasScheduleCommand("\n/schedule ")).toBe(true);
  expect(hasScheduleCommand("Something\n/schedule")).toBe(true);
  expect(hasScheduleCommand("Something /schedule ")).toBe(false);
  expect(hasScheduleCommand("Something\n/schedule ")).toBe(true);
  expect(hasScheduleCommand("Something /schedule \nelse")).toBe(false);
  expect(hasScheduleCommand("Something\n/schedule \nelse")).toBe(true);
});

test("isValidMergeMethod", () => {
  expect(isValidMergeMethod("merge")).toBe(true);
  expect(isValidMergeMethod("squash")).toBe(true);
  expect(isValidMergeMethod("rebase")).toBe(true);
  expect(isValidMergeMethod("bad")).toBe(false);
});

test("isValidDate", () => {
  expect(isValidDate("2022-06-08")).toBe(true);
  expect(isValidDate("2022-06-08T09:00:00")).toBe(true);
  expect(isValidDate("2022-06-08T15:00:00Z")).toBe(true);
  expect(isValidDate("2022-16-08")).toBe(false);
  expect(isValidDate("2022-16-08T09:00:00")).toBe(false);
  expect(isValidDate("2022-16-08T15:00:00Z")).toBe(false);
});

test("stringifyDate", () => {
  expect(stringifyDate("2022-06-08")).toBe("2022-06-08 00:00:00");
  expect(stringifyDate("2022-06-08T09:00:00")).toBe("2022-06-08 09:00:00");
  expect(stringifyDate("2022-06-08T15:00:00Z")).toBe("2022-06-08 15:00:00");
});

test("isBaseBranchModifiedError", () => {
  const baseBranchModifiedError = Object.assign(
    new Error("Base branch was modified. Review and try the merge again."),
    { status: 405 }
  );
  expect(isBaseBranchModifiedError(baseBranchModifiedError)).toBe(true);

  const notMergeableError = Object.assign(
    new Error("Pull Request is not mergeable"),
    { status: 405 }
  );
  expect(isBaseBranchModifiedError(notMergeableError)).toBe(false);

  const serverError = Object.assign(
    new Error("Base branch was modified. Review and try the merge again."),
    { status: 500 }
  );
  expect(isBaseBranchModifiedError(serverError)).toBe(false);

  expect(isBaseBranchModifiedError("not an error")).toBe(false);
});
