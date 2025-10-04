import { Mastra } from '@mastra/core';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

export const mastra = new Mastra({
	deployer: new CloudflareDeployer({
		projectName: 'mastra-worker-hello-world',

		// D1 Database bindings
		d1Databases: [
			{
				binding: 'DB',
				database_name: 'mastra-db',
				database_id: 'paste-your-database-id-here', // From step 2
			},
		],

		// Environment variables (optional)
		env: {
			NODE_ENV: 'production',
		},
	}),
});
