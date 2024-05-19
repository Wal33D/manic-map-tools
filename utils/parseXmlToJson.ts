// Custom function to manually parse XML to JSON
export function parseXmlToJson(xmlText: string) {
  const files: {}[] = [];
  const fileTags = xmlText.match(/<file[^>]*>(.*?)<\/file>/gs); // Match each <file> block

  if (fileTags) {
    fileTags.forEach((fileTag: string) => {
      const file = {} as any;
      file.name = fileTag.match(/name="([^"]+)"/)?.[1];
      file.source = fileTag.match(/source="([^"]+)"/)?.[1];

      const properties = fileTag.match(/<(\w+)>(.*?)<\/\1>/gs); // Match each property inside <file>
      if (properties) {
        properties.forEach((prop: string) => {
          const key = prop.match(/<(\w+)>/)?.[1];
          const value = prop.match(/>(.*?)</)?.[1];
          if (key && value) {
            file[key] = value;
          }
        });
      }
      files.push(file);
    });
  }
  return files;
}
