import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

async function main() {
	const deployer = new CloudflareDeployer({
		projectName: 'mastra-hono-hello-world',
	});

	await deployer.deploy();
}

main().catch((err) => {
	console.error('❌ Deployment failed:', err);
	process.exit(1);
});
