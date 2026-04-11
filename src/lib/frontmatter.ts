function formatYamlString(value: string): string {
  return JSON.stringify(value);
}

function formatYamlArray(values: string[]): string {
  return `[${values.map((value) => formatYamlString(value)).join(", ")}]`;
}

export interface FrontmatterMetadata {
  date: string;
  authors: string[];
  title: string;
  description: string;
  tags: string[];
  image: string;
}

export function buildFrontmatterHeader(metadata: FrontmatterMetadata): string {
  return [
    "---",
    `title: ${formatYamlString(metadata.title)}`,
    `description: ${formatYamlString(metadata.description)}`,
    `date: ${metadata.date}`,
    `tags: ${formatYamlArray(metadata.tags)}`,
    `image: ${formatYamlString(metadata.image)}`,
    `author: ${formatYamlArray(metadata.authors)}`,
    "---",
  ].join("\n");
}
