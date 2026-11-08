import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    "name": "mihran-family",
    "domains": ["mihran.com", "www.mihran.com"],
    "compatibilityDate": "2026-11-04",
    "observability": {
      "enabled": true
    }
  }
});
