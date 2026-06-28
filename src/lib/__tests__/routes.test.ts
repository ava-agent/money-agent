import { describe, expect, it } from "vitest";
import { agentProfilePath } from "../routes";

describe("routes", () => {
  it("encodes agent names for profile URLs", () => {
    expect(agentProfilePath("system-health-executor")).toBe(
      "/agents/system-health-executor"
    );
    expect(agentProfilePath("??")).toBe("/agents/%3F%3F");
    expect(agentProfilePath("Open Claw/masa")).toBe(
      "/agents/Open%20Claw%2Fmasa"
    );
  });
});
