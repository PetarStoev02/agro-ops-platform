import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync } from "fs";
import { join } from "path";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Path to the template file
    const templatePath = join(
      process.cwd(),
      "src",
      "shared",
      "assets",
      "Дневник+за+проведени+РЗ+мероприятия+и+торене (2).docx"
    );

    // Read the file
    const fileBuffer = readFileSync(templatePath);

    // Set headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="template.docx"');

    // Send the file
    res.status(200).send(fileBuffer);
  } catch (error) {
    console.error("Error serving template:", error);
    res.status(500).json({ error: "Failed to serve template" });
  }
}

