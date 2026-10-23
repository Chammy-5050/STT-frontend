import { describe, expect, it } from "vitest";
import { deadlineFor } from "./deadlines";

const today = new Date(2026, 9, 23, 23, 59);
describe("task deadlines", () => {
  it("distinguishes overdue, today, and the next three calendar days", () => {
    expect(deadlineFor({ status: "Pending", dueDate: "2026-10-22" }, today)?.kind).toBe("overdue");
    expect(deadlineFor({ status: "In Progress", dueDate: "2026-10-23" }, today)?.kind).toBe("today");
    expect(deadlineFor({ status: "Pending", dueDate: "2026-10-26" }, today)?.kind).toBe("soon");
    expect(deadlineFor({ status: "Pending", dueDate: "2026-10-27" }, today)).toBeNull();
  });
  it("never warns about completed or undated tasks", () => {
    for (const dueDate of ["2026-10-01", "2026-10-23", "2026-10-24"]) {
      expect(deadlineFor({ status: "Done", dueDate }, today)).toBeNull();
    }
    expect(deadlineFor({ status: "Pending" }, today)).toBeNull();
  });
  it("uses calendar dates across year boundaries", () => {
    expect(deadlineFor({ status: "Pending", dueDate: "2027-01-02" }, new Date(2026, 11, 31))?.kind).toBe("soon");
  });
});
