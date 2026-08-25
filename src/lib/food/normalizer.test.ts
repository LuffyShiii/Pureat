import { describe, it, expect } from "vitest";
import { normalizeFoodName } from "./normalizer";

describe("normalizeFoodName", () => {
  it("matches exact alias", async () => {
    const result = await normalizeFoodName("红烧肉");
    expect(result).not.toBeNull();
    expect(result?.food_id).toBe("pork_braised");
    expect(result?.confidence).toBe("high");
  });

  it("matches case-insensitive alias", async () => {
    const result = await normalizeFoodName(" 红烧牛肉 ");
    expect(result).not.toBeNull();
    expect(result?.food_id).toBe("beef_braised");
  });

  it("returns null for unknown food", async () => {
    const result = await normalizeFoodName("不存在的食物 xyz123");
    expect(result).toBeNull();
  });
});
