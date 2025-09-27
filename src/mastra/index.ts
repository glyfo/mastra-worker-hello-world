import { Mastra } from '@mastra/core/mastra';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

export const mastra = new Mastra({
	// Your Mastra agents/config go here...
	deployer: new CloudflareDeployer({
		projectName: 'mastra-worker-hello', // 👈 must match wrangler.toml name
		workerNamespace: 'agent', // optional namespace for workers

		// Auto-pickup from process.env instead of hardcoding
		env: {
			NODE_ENV: 'production',
			API_KEY: process.env.API_KEY!,
		},

		// Only include optional resources if you’re really using them
		d1Databases: process.env.D1_DATABASE_ID
			? [
					{
						binding: 'DB',
						database_name: 'my-database',
						database_id: process.env.D1_DATABASE_ID!,
						preview_database_id: process.env.D1_PREVIEW_DATABASE_ID!,
					},
			  ]
			: [],

		kvNamespaces: process.env.KV_NAMESPACE_ID
			? [
					{
						binding: 'CACHE',
						id: process.env.KV_NAMESPACE_ID!,
					},
			  ]
			: [],

		// Routes simplified: custom_domain inferred if `zone_name` exists
		routes: [
			{
				pattern: `${process.env.DOMAIN ?? 'example.com'}/*`,
				zone_name: process.env.DOMAIN ?? 'example.com',
				custom_domain: true,
			},
		],
	}),
});
