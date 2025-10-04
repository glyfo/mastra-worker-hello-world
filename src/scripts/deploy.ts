import { Mastra } from '@mastra/core';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

export const mastra = new Mastra({
	deployer: new CloudflareDeployer({
		projectName: 'mastra-worker-hello-world',

		// Configure your routes
		routes: [
			{
				pattern: 'your-domain.com/*',
				zone_name: 'your-domain.com',
				custom_domain: true,
			},
		],

		// Worker namespace (optional)
		workerNamespace: 'mastra-workers',

		// Environment variables
		env: {
			NODE_ENV: 'production',
			// Add your environment variables here
		},

		// D1 Database bindings
		d1Databases: [
			{
				binding: 'DB',
				database_name: 'mastra-db',
				database_id: 'your-d1-database-id',
				preview_database_id: 'your-preview-database-id', // optional
			},
		],

		// KV Namespace bindings (optional)
		kvNamespaces: [
			{
				binding: 'CACHE',
				id: 'your-kv-namespace-id',
			},
		],
	}),

	// Your existing Mastra configuration
	// agents, workflows, etc.
});
