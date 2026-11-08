import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    "name": "greg-mihran",
    "domains": ["greg.mihran.com"],
    "compatibilityDate": "2026-11-04",
    "observability": {
      "enabled": true
    }
  }
});
