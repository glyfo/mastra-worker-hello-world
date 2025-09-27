import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

async function main() {
	const deployer = new CloudflareDeployer({
		accountId: process.env.CF_ACCOUNT_ID!,
		apiToken: process.env.CF_API_TOKEN!,
		projectName: 'mastra-hono-hello-world', // must match wrangler.toml `name`
		wranglerConfigPath: './wrangler.toml', // 👈 hook directly into wrangler.toml
	});

	await deployer.deploy();
}

main().catch((err) => {
	console.error('Deployment failed:', err);
	process.exit(1);
});
