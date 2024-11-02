/*
 * Copyright © 2020 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
import util from 'util';
import * as fs from 'fs-extra';
import { join, resolve } from 'path';
import { ApplicationConfig, PartialApplicationConfig } from 'klayr-framework';
import { Database, StateDB } from '@liskhq/lisk-db';
import * as semver from 'semver';
import { Command, flags as flagsParser } from '@oclif/command';
import cli from 'cli-ux';
import { BlockHeader } from '@klayr/chain';
import {
	NETWORK_CONSTANT,
	ROUND_LENGTH,
	SNAPSHOT_DIR,
	MIN_SUPPORTED_SWAPTOSHI_CORE_VERSION,
	DEFAULT_SWAPTOSHI_CORE_PATH,
	ERROR_CODE,
	FILE_NAME,
	SWAPTOSHI_BACKUP_DATA_DIR,
	LEGACY_DB_PATH,
	DEFAULT_DATA_DIR,
} from './constants';
import { getAPIClient } from './client';
import {
	getConfig,
	migrateUserConfig,
	createBackup,
	writeConfig,
	validateConfig,
	setTokenIDSwxByNetID,
	setPrevSnapshotBlockHeightByNetID,
	writeGenesisAssets,
	createGenesisBlock,
	writeGenesisBlock,
	copyGenesisBlock,
	getGenesisBlockCreateCommand,
	setAdditionalAccountsByChainID,
	resolveConfigDefaultPath,
	observeChainHeight,
} from './utils';
import { captureForgingStatusAtSnapshotHeight } from './events';
import { CreateAsset } from './createAsset';
import { NetworkConfigLocal } from './types';
import {
	startSwaptoshiCore,
	isSwaptoshiCoreRunning,
	getSwaptoshiCoreStartCommand,
} from './utils/node';
import { resolveAbsolutePath, resolveSnapshotPath, verifyOutputPath } from './utils/path';
import { execAsync } from './utils/process';
import { getBlockHeaderByHeight } from './utils/block';
import { MigratorException } from './utils/exception';
import { writeCommandsToExec } from './utils/commands';
import { getChainId } from './utils/network';
import { extractTarBall } from './utils/fs';
import { downloadAndExtract } from './utils/download';

let swaptoshiConfig: PartialApplicationConfig;

class SwaptoshiMigrator extends Command {
	public static description = 'Migrate Swaptoshi Core';

	public static flags = {
		version: flagsParser.version({ char: 'v' }),
		help: flagsParser.help({ char: 'h' }),

		output: flagsParser.string({
			char: 'o',
			required: false,
			description: `File path to write the genesis block. If not provided, it will default to cwd/output/{networkIdentifier}/genesis_block.blob. Do not use any value starting with the default data path reserved for Swaptoshi Core: '${DEFAULT_SWAPTOSHI_CORE_PATH}'.`,
		}),
		'data-path': flagsParser.string({
			char: 'd',
			required: false,
			description:
				'Path where the Swaptoshi Core instance is running. When not supplied, defaults to the default data directory for Swaptoshi Core.',
		}),
		'snapshot-height': flagsParser.integer({
			char: 's',
			required: true,
			env: 'SNAPSHOT_HEIGHT',
			description:
				'The height at which re-genesis block will be generated. Can be specified with SNAPSHOT_HEIGHT as well.',
		}),
		config: flagsParser.string({
			char: 'c',
			required: false,
			description: 'Custom configuration file path for Swaptoshi Core',
		}),
		'auto-migrate-config': flagsParser.boolean({
			required: false,
			env: 'AUTO_MIGRATE_CONFIG',
			description: 'Migrate user configuration automatically. Defaults to false.',
			default: false,
		}),
		'auto-start-swaptoshi-core': flagsParser.boolean({
			required: false,
			env: 'AUTO_START_SWAPTOSHI_CORE',
			description:
				'Start Swaptoshi Core automatically. Defaults to false. When using this flag, kindly open another terminal window to stop Swaptoshi Core for when the migrator prompts.',
			default: false,
		}),
		'page-size': flagsParser.integer({
			char: 'p',
			required: false,
			default: 100000,
			description:
				'Maximum number of blocks to be iterated at once for computation. Defaults to 100000.',
		}),
		'snapshot-path': flagsParser.string({
			required: false,
			env: 'SNAPSHOT_PATH',
			description:
				'Local filepath to the state snapshot to run the migration offline. It could either point to a directory or a tarball (tar.gz).',
			dependsOn: ['network'],
			exclusive: ['snapshot-url'],
		}),
		'snapshot-url': flagsParser.string({
			required: false,
			env: 'SNAPSHOT_URL',
			description:
				'URL to download the state snapshot from. Use to run the migration offline. URL must end with tar.gz.',
			dependsOn: ['network'],
			exclusive: ['snapshot-path'],
		}),
		network: flagsParser.enum({
			char: 'n',
			required: false,
			env: 'NETWORK',
			description:
				"Network to be considered for the migration. Depends on the '--snapshot-path' flag.",
			options: ['mainnet', 'testnet', 'devnet'],
			exclusive: ['data-path', 'config', 'auto-migrate-config', 'auto-start-swaptoshi-core'],
		}),
	};

	public async run(): Promise<void> {
		const startTime = Date.now();
		const { flags } = this.parse(SwaptoshiMigrator);
		const swaptoshiCoreDataPath = resolveAbsolutePath(
			flags['data-path'] ?? DEFAULT_SWAPTOSHI_CORE_PATH,
		);
		const outputPath = flags.output ?? join(__dirname, '..', 'output');
		const snapshotHeight = flags['snapshot-height'];
		const customConfigPath = flags.config;
		const autoMigrateUserConfig = flags['auto-migrate-config'] ?? false;
		const autoStartSwaptoshiCore = flags['auto-start-swaptoshi-core'];
		const snapshotPath = flags['snapshot-path']
			? resolveAbsolutePath(flags['snapshot-path'])
			: (flags['snapshot-path'] as string);
		const snapshotURL = flags['snapshot-url'] as string;
		const network = flags.network?.toLowerCase() as string;
		const useSnapshot = !!(snapshotPath || snapshotURL);

		// Custom flag dependency check because neither exactlyOne or relationships properties are working for network
		if (network && !useSnapshot) {
			this.error(
				'Either --snapshot-path= or --snapshot-url= must be provided when using --network=',
			);
		}

		if (snapshotURL && (!snapshotURL.startsWith('http') || !snapshotURL.endsWith('tar.gz'))) {
			this.error(
				`Expected --snapshot-url to begin with http(s) and end with 'tar.gz' instead received ${snapshotURL}.`,
			);
		}

		verifyOutputPath(outputPath);

		const chainId: string = await getChainId(network, swaptoshiCoreDataPath);
		const networkConstant: NetworkConfigLocal = NETWORK_CONSTANT[chainId];
		const outputDir: string = flags.output ? outputPath : `${outputPath}/${chainId}`;

		// Ensure the output directory is present
		if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
		const filePathCommandsToExec = `${outputDir}/${FILE_NAME.COMMANDS_TO_EXEC}`;
		const dataDir = join(__dirname, '..', DEFAULT_DATA_DIR);

		try {
			if (useSnapshot) {
				if (snapshotURL?.startsWith('http')) {
					cli.action.start(`Downloading snapshot from ${snapshotURL} to ${outputDir}`);
					await downloadAndExtract(snapshotURL, outputDir, dataDir);
					cli.action.stop(`Successfully downloaded snapshot from ${snapshotURL} to ${outputDir}`);
				} else if (snapshotPath?.endsWith('.tar.gz')) {
					cli.action.start(`Extracting snapshot to ${dataDir}`);
					await extractTarBall(snapshotPath, dataDir);
					cli.action.stop(`Successfully extracted snapshot to ${dataDir}`);
				}
			} else {
				const client = await getAPIClient(swaptoshiCoreDataPath);
				const nodeInfo = await client.node.getNodeInfo();
				const { version: appVersion } = nodeInfo;

				cli.action.start('Verifying if backup height from node config matches snapshot height');
				const config = await getConfig(this, swaptoshiCoreDataPath, customConfigPath);
				if (snapshotHeight !== config.system.backup.height) {
					this.error(
						`Swaptoshi Core backup height mismatch. Actual: ${config.system.backup.height}, Expected: ${snapshotHeight}.`,
					);
				}
				cli.action.stop('Snapshot height matches backup height');

				cli.action.start(
					`Verifying snapshot height to be multiples of round length i.e ${ROUND_LENGTH}`,
				);
				if (snapshotHeight % ROUND_LENGTH !== 0) {
					this.error(
						`Invalid snapshot height provided: ${snapshotHeight}. It must be an exact multiple of round length (${ROUND_LENGTH}).`,
					);
				}
				cli.action.stop('Snapshot height is valid');

				// Asynchronously capture the node's Forging Status information at the snapshot height
				// This information is necessary for the node operators to enable generator post-migration without getting PoM'd
				captureForgingStatusAtSnapshotHeight(this, client, snapshotHeight, outputDir);

				if (autoStartSwaptoshiCore) {
					if (!networkConstant) {
						this.error(
							`Unknown network detected. No NETWORK_CONSTANT defined for networkID: ${chainId}.`,
						);
					}
				}

				cli.action.start('Verifying Swaptoshi Core version');
				const isSwaptoshiCoreVersionValid = semver.valid(appVersion);
				if (isSwaptoshiCoreVersionValid === null) {
					this.error(
						`Invalid Swaptoshi Core version detected: ${appVersion}. Minimum supported version is ${MIN_SUPPORTED_SWAPTOSHI_CORE_VERSION}.`,
					);
				}

				if (semver.lt(appVersion, MIN_SUPPORTED_SWAPTOSHI_CORE_VERSION)) {
					this.error(
						`Swaptoshi Migrator is not compatible with Swaptoshi Core version ${appVersion}. Minimum supported version is ${MIN_SUPPORTED_SWAPTOSHI_CORE_VERSION}.`,
					);
				}
				cli.action.stop(`${appVersion} detected`);

				await observeChainHeight({
					label: 'Waiting for snapshot height to be finalized',
					swaptoshiCoreDataPath,
					height: snapshotHeight,
					delay: 500,
					isFinal: true,
				});
			}

			setTokenIDSwxByNetID(chainId);
			setPrevSnapshotBlockHeightByNetID(chainId);
			setAdditionalAccountsByChainID(chainId);

			// Create new DB instance based on the snapshot path
			cli.action.start('Creating database instance');
			const snapshotDirPath = await resolveSnapshotPath(
				useSnapshot,
				snapshotPath,
				dataDir,
				swaptoshiCoreDataPath,
			);
			const db = new StateDB(`${snapshotDirPath}/state.db`);
			const blockchainDB = new Database(`${snapshotDirPath}/blockchain.db`);
			cli.action.stop();

			// Create genesis assets
			cli.action.start('Creating genesis assets');
			const createAsset = new CreateAsset(db, blockchainDB);
			const genesisAssets = await createAsset.init(snapshotHeight, networkConstant);
			cli.action.stop();

			// Create an app instance for creating genesis block
			const defaultConfigFilePath = await resolveConfigDefaultPath(networkConstant.name);
			const newConfig = await fs.readJSON(defaultConfigFilePath);

			cli.action.start(`Exporting genesis block to the path ${outputDir}`);
			await writeGenesisAssets(genesisAssets, outputDir);
			cli.action.stop();

			if (autoMigrateUserConfig && !useSnapshot) {
				// User specified custom config file
				const oldConfig: ApplicationConfig = customConfigPath
					? await getConfig(this, swaptoshiCoreDataPath, customConfigPath)
					: await getConfig(this, swaptoshiCoreDataPath);
				cli.action.start('Creating backup for old config');
				await createBackup(oldConfig);
				cli.action.stop();

				cli.action.start('Migrating user configuration');
				const migratedConfig = (await migrateUserConfig(
					oldConfig,
					newConfig,
					snapshotHeight,
				)) as ApplicationConfig;
				cli.action.stop();

				cli.action.start('Validating migrated user configuration');
				const isValidConfig = await validateConfig(migratedConfig);
				cli.action.stop();

				if (!isValidConfig) {
					throw new MigratorException(
						'Migrated user configuration is invalid.',
						ERROR_CODE.INVALID_CONFIG,
					);
				}

				cli.action.start(`Exporting user configuration to the path: ${outputDir}`);
				await writeConfig(migratedConfig, outputDir);
				cli.action.stop();

				swaptoshiConfig = migratedConfig as PartialApplicationConfig;
			}

			// NOTE: since we are using same core version, this will be disabled

			// cli.action.start('Installing Swaptoshi Core');
			// await installSwaptoshiCore();
			// cli.action.stop();

			cli.action.start('Creating genesis block');
			const blockHeaderAtSnapshotHeight = (await getBlockHeaderByHeight(
				blockchainDB,
				snapshotHeight,
			)) as BlockHeader;
			await createGenesisBlock(
				this,
				networkConstant.name,
				defaultConfigFilePath,
				outputDir,
				blockHeaderAtSnapshotHeight,
			);
			cli.action.stop();

			cli.action.start('Creating genesis block tar and SHA256 files');
			await writeGenesisBlock(outputDir);
			this.log(`Genesis block tar and SHA256 files have been created at: ${outputDir}.`);
			cli.action.stop();

			if (!useSnapshot) {
				if (autoStartSwaptoshiCore) {
					try {
						if (!autoMigrateUserConfig) {
							swaptoshiConfig = newConfig;
						}

						cli.action.start('Copying genesis block to the Swaptoshi Core executable directory');
						const swaptoshiCoreExecPath = await execAsync('which swaptoshi-core');
						const swaptoshiCoreConfigPath = resolve(
							swaptoshiCoreExecPath,
							'../..',
							`lib/node_modules/swaptoshi-core/config/${networkConstant.name}`,
						);

						await copyGenesisBlock(
							`${outputDir}/genesis_block.blob`,
							`${swaptoshiCoreConfigPath}/genesis_block.blob`,
						);
						this.log(`Genesis block has been copied to: ${swaptoshiCoreConfigPath}.`);
						cli.action.stop();

						// Ask user to manually stop Swaptoshi Core and continue
						const isSwaptoshiCoreStopped = await cli.confirm(
							"Please stop Swaptoshi Core to continue. Type 'yes' and press Enter when you stopped Swaptoshi Core. [yes/no]",
						);

						if (isSwaptoshiCoreStopped) {
							let numTriesLeft = 3;
							while (numTriesLeft) {
								numTriesLeft -= 1;

								const isSwaptoshiNodeRunning = await isSwaptoshiCoreRunning(swaptoshiCoreDataPath);
								if (!isSwaptoshiNodeRunning) break;

								if (numTriesLeft >= 0) {
									const isStopReconfirmed = await cli.confirm(
										"Swaptoshi Core still running. Please stop the node, type 'yes' to proceed and 'no' to exit. [yes/no]",
									);
									if (!isStopReconfirmed) {
										throw new Error(
											`Cannot proceed with Swaptoshi Core auto-start. Please continue manually. In order to access legacy blockchain information posts-migration, please copy the contents of the ${snapshotDirPath} directory to 'data/legacy.db' under the Swaptohsi Core data directory (e.g: ${DEFAULT_SWAPTOSHI_CORE_PATH}/data/legacy.db/). Exiting!!!`,
										);
									} else if (numTriesLeft === 0 && isStopReconfirmed) {
										const isSwaptoshiCoreStillRunning = await isSwaptoshiCoreRunning(
											swaptoshiCoreDataPath,
										);
										if (isSwaptoshiCoreStillRunning) {
											throw new Error(
												`Cannot auto-start Swaptoshi Core as Swaptoshi Core is still running. Please continue manually. In order to access legacy blockchain information posts-migration, please copy the contents of the ${snapshotDirPath} directory to 'data/legacy.db' under the Swaptoshi Core data directory (e.g: ${DEFAULT_SWAPTOSHI_CORE_PATH}/data/legacy.db/). Exiting!!!`,
											);
										}
									}
								}
							}

							const isUserConfirmed = await cli.confirm(
								`Start Swaptoshi Core with the following configuration? [yes/no]
							${util.inspect(swaptoshiConfig, false, 3)} `,
							);

							if (isUserConfirmed) {
								cli.action.start('Starting Swaptoshi Core');
								const networkName = networkConstant.name;
								await startSwaptoshiCore(
									this,
									swaptoshiCoreDataPath,
									swaptoshiConfig,
									networkName,
									outputDir,
								);
								this.log(
									`Started Swaptoshi Core at default data directory ('${DEFAULT_SWAPTOSHI_CORE_PATH}').`,
								);
								cli.action.stop();
							} else {
								this.log(
									'User did not accept the migrated config. Skipping the Swaptoshi Core auto-start process.',
								);
							}
						} else {
							throw new Error(
								`User did not confirm Swaptoshi Core node shutdown. Skipping the Swaptoshi Core auto-start process. Please continue manually. In order to access legacy blockchain information posts-migration, please copy the contents of the ${snapshotDirPath} directory to 'data/legacy.db' under the Swaptoshi Core data directory (e.g: ${DEFAULT_SWAPTOSHI_CORE_PATH}/data/legacy.db/). Exiting!!!`,
							);
						}
					} catch (err) {
						const errorMsg = `Failed to auto-start Swaptoshi Core.\nError: ${
							(err as Error).message
						}`;
						throw new MigratorException(
							errorMsg,
							err instanceof MigratorException ? err.code : ERROR_CODE.SWAPTOSHI_CORE_START,
						);
					}
				} else {
					this.log(
						`Please copy the contents of ${snapshotDirPath} directory to 'data/legacy.db' under the Swaptoshi Core data directory (e.g: ${DEFAULT_SWAPTOSHI_CORE_PATH}/data/legacy.db/) in order to access legacy blockchain information.`,
					);
					this.log('Please copy genesis block to the Swaptoshi Core network directory.');
				}
			}
		} catch (error) {
			const commandsToExecute: string[] = [];
			const code = Number(`${(error as MigratorException).code}`);

			const basicStartCommand = `swaptoshi-core start --network ${networkConstant.name}`;
			const swaptoshiCoreStartCommand = getSwaptoshiCoreStartCommand() ?? basicStartCommand;

			const backupLegacyDataDirCommand = `mv ${swaptoshiCoreDataPath} ${SWAPTOSHI_BACKUP_DATA_DIR}`;
			const copyLegacyDBCommand = `cp -r ${
				(resolve(SWAPTOSHI_BACKUP_DATA_DIR, SNAPSHOT_DIR), LEGACY_DB_PATH)
			}`;

			if (
				[ERROR_CODE.DEFAULT, ERROR_CODE.INVALID_CONFIG, ERROR_CODE.GENESIS_BLOCK_CREATE].includes(
					code,
				)
			) {
				const genesisBlockCreateCommand = getGenesisBlockCreateCommand();
				commandsToExecute.push(
					'\n',
					'## Create the genesis block',
					'## NOTE: This requires installing Swaptoshi Core locally. Please visit https://docs.swaptoshi.com/node/install for further instructions',
					'\n',
				);
				commandsToExecute.push(genesisBlockCreateCommand);
				commandsToExecute.push('\n', '-----------------------------------------------------', '\n');
			}

			if (
				[
					ERROR_CODE.DEFAULT,
					ERROR_CODE.INVALID_CONFIG,
					ERROR_CODE.GENESIS_BLOCK_CREATE,
					ERROR_CODE.BACKUP_LEGACY_DATA_DIR,
				].includes(code)
			) {
				commandsToExecute.push('\n', '## Backup Swaptoshi Core data directory', '\n');
				commandsToExecute.push(backupLegacyDataDirCommand);
				commandsToExecute.push('\n', '-----------------------------------------------------', '\n');
			}

			if (
				[
					ERROR_CODE.DEFAULT,
					ERROR_CODE.INVALID_CONFIG,
					ERROR_CODE.GENESIS_BLOCK_CREATE,
					ERROR_CODE.BACKUP_LEGACY_DATA_DIR,
					ERROR_CODE.COPY_LEGACY_DB,
				].includes(code)
			) {
				commandsToExecute.push(
					'\n',
					'## Copy old blockchain information to Swaptoshi Core legacy.db',
					'\n',
				);
				commandsToExecute.push(copyLegacyDBCommand);
				commandsToExecute.push('\n', '-----------------------------------------------------', '\n');
			}

			if (
				[
					ERROR_CODE.DEFAULT,
					ERROR_CODE.INVALID_CONFIG,
					ERROR_CODE.GENESIS_BLOCK_CREATE,
					ERROR_CODE.BACKUP_LEGACY_DATA_DIR,
					ERROR_CODE.COPY_LEGACY_DB,
					ERROR_CODE.SWAPTOSHI_CORE_START,
				].includes(code)
			) {
				commandsToExecute.push(
					'\n',
					'## Swaptoshi Core start command - Please modify if necessary',
					'\n',
				);
				commandsToExecute.push(swaptoshiCoreStartCommand);
				commandsToExecute.push('\n', '-----------------------------------------------------', '\n');
			}

			await writeCommandsToExec(
				this,
				networkConstant,
				snapshotHeight,
				outputDir,
				commandsToExecute,
			);

			this.error(
				`Migrator could not finish execution successfully due to: ${
					(error as Error).message
				}\nPlease check the commands to be executed in the file: ${filePathCommandsToExec}`,
			);
		}

		await writeCommandsToExec(this, networkConstant, snapshotHeight, outputDir);
		this.log(`Total execution time: ${(Date.now() - startTime) / 1000}s`);
		this.log('Successfully finished migration!');
		process.exit(0);
	}
}

export = SwaptoshiMigrator;
