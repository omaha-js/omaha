const cp = require('child_process');
const path = require('path');

const bin = path.resolve(__dirname, '../node_modules/typeorm/cli.js');
const args = [
	'-r', 'ts-node/register',
	'-r', 'tsconfig-paths/register',
	bin,
	'-d', './src/typeorm.ts',
	...process.argv.slice(2)
];

cp.spawnSync('node', args, {
	stdio: "inherit",
	env: {
		...process.env,
		NODE_OPTIONS: [
			process.env["NODE_OPTIONS"],
			"--no-warnings",
		]
			.filter((item) => !!item)
			.join(" "),
	},
	windowsHide: true,
});
