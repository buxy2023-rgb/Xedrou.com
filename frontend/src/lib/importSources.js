export const IMPORT_SOURCES = [
  { id: "base44", name: "Base44", mode: "import", description: "Import an existing website/project into the selected Xedruo company when the source provides an authorized export or API." },
  { id: "lovable", name: "Lovable", mode: "import", description: "Import an existing website/project through an authorized export or supported API." },
  { id: "replit", name: "Replit", mode: "import", description: "Import an existing website/project through an authorized export or supported API." },
  { id: "heroku", name: "Heroku", mode: "import", description: "Import an existing web application through an authorized source/export flow." },
];

export function getImportSource(id) {
  return IMPORT_SOURCES.find((source) => source.id === id) || null;
}
