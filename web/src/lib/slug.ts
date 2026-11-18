/** Convert catalog data_file to URL slug: ybs_111_industrial_zone_data.json → 111_industrial_zone */
export function dataFileToSlug(dataFile: string): string {
  return dataFile.replace(/^ybs_/, "").replace(/_data\.json$/i, "");
}

export function slugToDataFile(slug: string): string {
  return `ybs_${slug}_data.json`;
}
