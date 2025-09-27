import { Mastra } from "@mastra/core/mastra";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";
 
export const mastra = new Mastra({
  // ...
  deployer: new CloudflareDeployer({
    projectName: "hello-mastra",
    routes: [
      {
        pattern: "example.com/*",
        zone_name: "example.com",
        custom_domain: true
      }
    ],
    workerNamespace: "my-namespace",
    env: {
      NODE_ENV: "production",
      API_KEY: "<api-key>"
    },
    d1Databases: [
      {
        binding: "DB",
        database_name: "my-database",
        database_id: "d1-database-id",
        preview_database_id: "your-preview-database-id"
      }
    ],
    kvNamespaces: [
      {
        binding: "CACHE",
        id: "kv-namespace-id"
      }
    ]
});