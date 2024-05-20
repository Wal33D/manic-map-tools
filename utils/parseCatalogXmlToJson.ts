import { parseStringPromise } from "xml2js";
import { camelCaseString } from "../utils/camelCaseString";
import { parse } from "node-html-parser";

export async function parseCatalogXmlToJson(
  xml: string,
  dirPath: string,
  files: any[],
  thumbnailUrl: string
): Promise<any> {
  try {
    const result = await parseStringPromise(xml, {
      explicitArray: false,
      trim: true,
      mergeAttrs: true,
    });
    const metadata = result.metadata;

    const keywords = Array.isArray(metadata.subject)
      ? metadata.subject
      : [metadata.subject];

    const originalTitle = metadata.title;
    const name = originalTitle.split("|")[0].trim();
    const title = camelCaseString(name);

    const collection = metadata.collection.split("-");

    const roomTitle = collection[2]
      ? collection[2].charAt(0).toUpperCase() + collection[2].slice(1)
      : "Archive";

    const htmlDescription = metadata.description;
    const textDescription = parse(htmlDescription).innerText.trim();

    const screenshot = files.some((file: any) =>
      ["PNG", "JPG", "JPEG"].includes(file.fileType.toUpperCase())
    );

    const parsedJson = {
      catalog: roomTitle,
      catalogType: "Level",
      archived: true,
      pre_release: true,
      catalogId: metadata.identifier,
      title,
      postedDate: metadata.date,
      author: metadata.creator,
      thumbnail: thumbnailUrl,
      screenshot,
      shortDescription: "",
      textDescription,
      htmlDescription,
      path: dirPath,
      url: `https://archive.org/details/${metadata.identifier}`,
      filesUrl: `https://archive.org/download/${metadata.identifier}/${metadata.identifier}_files.xml`,
      files,
    };

    return parsedJson;
  } catch (error) {
    console.error("Error parsing XML to JSON:", error);
    throw error;
  }
}
