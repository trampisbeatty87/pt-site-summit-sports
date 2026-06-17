#!/usr/bin/env node
/* Tiny local preview server. Rebuilds, then serves dist/ on :8080.
   For local development only — production is built & served by Netlify. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

execSync(`"${process.execPath}" build.js`, { cwd: __dirname, stdio: "inherit" });

const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/index.html";
  const fp = path.join(__dirname, "dist", url);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "text/plain" });
    res.end(data);
  });
}).listen(8080, () => console.log("Preview at http://localhost:8080"));
