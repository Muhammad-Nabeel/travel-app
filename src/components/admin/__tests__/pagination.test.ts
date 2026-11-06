import {
  ADMIN_PAGE_SIZE,
  clampPage,
  getPageCount,
  pageList,
} from "@/components/admin/pagination";

describe("admin pagination", () => {
  it("shows 10 records per page", () => {
    expect(ADMIN_PAGE_SIZE).toBe(10);
  });

  it("only needs a second page after 10 records", () => {
    expect(getPageCount(0)).toBe(1);
    expect(getPageCount(10)).toBe(1);
    expect(getPageCount(11)).toBe(2);
    expect(getPageCount(29)).toBe(3);
  });

  it("clamps out-of-range and junk ?page= values", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(-2, 3)).toBe(1);
    expect(clampPage(9, 3)).toBe(3); // e.g. after deleting rows on the last page
    expect(clampPage(Number("abc"), 3)).toBe(1);
    expect(clampPage(2.7, 3)).toBe(2);
  });

  it("lists every page when there are only a few", () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(2, 3)).toEqual([1, 2, 3]);
  });

  it("collapses long ranges around the current page", () => {
    expect(pageList(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageList(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageList(10, 10)).toEqual([1, "gap", 9, 10]);
  });
});
