import fs from "fs"

const safeUnlink = (filePath?: string) => {
  if (!filePath) return;
  fs.unlink(filePath, err => {
    if (err) console.error("Error deleting file:", err);
  });
};

export default safeUnlink