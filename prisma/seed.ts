import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TemplateSection {
  title: string;
  prompt: string;
  placeholder: string;
  order: number;
}

interface TemplateData {
  name: string;
  description: string;
  category: string;
  isBuiltIn: boolean;
  sections: TemplateSection[];
}

const dataFile = path.join(__dirname, "seed-data.json");
const builtInTemplates: TemplateData[] = JSON.parse(
  fs.readFileSync(dataFile, "utf-8")
);

async function main() {
  for (const template of builtInTemplates) {
    const { sections, ...templateData } = template;
    await prisma.template.create({
      data: {
        ...templateData,
        sections: {
          create: sections,
        },
      },
    });
  }
  console.log(`Seeded ${builtInTemplates.length} built-in templates`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
