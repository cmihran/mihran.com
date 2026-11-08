import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    "name": "charlie-mihran",
    "domains": ["charlie.mihran.com"],
    "compatibilityDate": "2026-11-04",
    "observability": {
      "enabled": true
    }
  }
});
