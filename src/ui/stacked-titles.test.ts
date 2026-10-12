import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";
import { findMissingStackedTitles } from "./stacked-titles";

const STACKED_LIST = /\.stacked\b/;

describe("findMissingStackedTitles", () => {
  it("finds nothing when every column title is carried by a cell", () => {
    const code = `
      <th>Mahasiswa</th>
      <th>Program studi</th>
      <th>
        <span className={shared.hidden}>Tindakan</span>
      </th>
      <td data-title="Mahasiswa">{student.name}</td>
      <td className={shared.detail} data-title="Program studi" />
      <td className={shared.rowActions} />
    `;

    expect(findMissingStackedTitles(code)).toEqual([]);
  });

  it("finds a column whose cells carry no title", () => {
    const code = `
      <th>Mahasiswa</th>
      <th>Angkatan</th>
      <td data-title="Mahasiswa">{student.name}</td>
      <td>{student.cohortYear}</td>
    `;

    expect(findMissingStackedTitles(code)).toEqual(["Angkatan"]);
  });

  it("finds a column whose cells carry another title", () => {
    const code = `
      <th>Provinsi</th>
      <td data-title="Propinsi">{student.province}</td>
    `;

    expect(findMissingStackedTitles(code)).toEqual(["Provinsi"]);
  });
});

describe("stacked lists", () => {
  const lists = sourceFilesEndingWith(".tsx").filter((path) =>
    STACKED_LIST.test(readFileSync(path, "utf8")),
  );

  it("has stacked lists to check", () => {
    expect(lists.length).toBeGreaterThan(0);
  });

  it.each(lists)("%s carries every column title in its rows", (path) => {
    expect(findMissingStackedTitles(readFileSync(path, "utf8"))).toEqual([]);
  });
});
