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
import { ApplicationConfig, PartialApplicationConfig } from 'lisk-framework';
import { Database, StateDB } from '@liskhq/lisk-db';
import * as semver from 'semver';
import { Command, flags as flagsParser } from '@oclif/command';
import cli from 'cli-ux';
import { BlockHeader } from '@liskhq/lisk-chain';
import {
	NETWORK_CONSTANT,
	ROUND_LENGTH,
	SNAPSHOT_DIR,
	MIN_SUPPORTED_LISK_CORE_VERSION,
	DEFAULT_LISK_CORE_PATH,
	ERROR_CODE,
	FILE_NAME,
	LISK_V4_BACKUP_DATA_DIR,
	LEGACY_DB_PATH,
	DEFAULT_DATA_DIR,
	DEFAULT_KLAYR_CORE_PATH,
} from './constants';
import { getAPIClient } from './client';
import {
	getConfig,
	migrateUserConfig,
	createBackup,
	writeConfig,
	validateConfig,
	setTokenIDKlyByNetID,
	setPrevSnapshotBlockHeightByNetID,
	getTokenIDKly,
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
	startKlayrCore,
	isLiskCoreV4Running,
	getKlayrCoreStartCommand,
	installKlayrCore,
} from './utils/node';
import { resolveAbsolutePath, resolveSnapshotPath, verifyOutputPath } from './utils/path';
import { execAsync } from './utils/process';
import { getBlockHeaderByHeight } from './utils/block';
import { MigratorException } from './utils/exception';
import { writeCommandsToExec } from './utils/commands';
import { getChainId } from './utils/network';
import { extractTarBall } from './utils/fs';
import { downloadAndExtract } from './utils/download';

let configCoreV4: PartialApplicationConfig;
class KlayrMigrator extends Command {
	public static description = 'Migrate Lisk Core to Klayr Core';

	public static flags = {
		version: flagsParser.version({ char: 'v' }),
		help: flagsParser.help({ char: 'h' }),

		output: flagsParser.string({
			char: 'o',
			required: false,
			description: `File path to write the genesis block. If not provided, it will default to cwd/output/{v4_networkIdentifier}/genesis_block.blob. Do not use any value starting with the default data path reserved for Lisk Core: '${DEFAULT_LISK_CORE_PATH}'.`,
		}),
		'lisk-core-data-path': flagsParser.string({
			char: 'd',
			required: false,
			description:
				'Path where the Lisk Core v4.x instance is running. When not supplied, defaults to the default data directory for Lisk Core.',
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
			description: 'Custom configuration file path for Lisk Core v4.0.x.',
		}),
		'auto-migrate-config': flagsParser.boolean({
			required: false,
			env: 'AUTO_MIGRATE_CONFIG',
			description: 'Migrate user configuration automatically. Defaults to false.',
			default: false,
		}),
		'auto-start-klayr-core-v4': flagsParser.boolean({
			required: false,
			env: 'AUTO_START_KLAYR_CORE',
			description:
				'Start Klayr Core v4 automatically. Defaults to false. When using this flag, kindly open another terminal window to stop Lisk Core v4.0.x for when the migrator prompts.',
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
			exclusive: [
				'lisk-core-data-path',
				'config',
				'auto-migrate-config',
				'auto-start-lisk-core-v4',
				'auto-start-klayr-core-v4',
			],
		}),
	};

	public async run(): Promise<void> {
		const startTime = Date.now();
		const { flags } = this.parse(KlayrMigrator);
		const liskCoreV4DataPath = resolveAbsolutePath(
			flags['lisk-core-data-path'] ?? DEFAULT_LISK_CORE_PATH,
		);
		const outputPath = flags.output ?? join(__dirname, '..', 'output');
		const snapshotHeight = flags['snapshot-height'];
		const customConfigPath = flags.config;
		const autoMigrateUserConfig = flags['auto-migrate-config'] ?? false;
		const autoStartKlayrCoreV4 = flags['auto-start-klayr-core-v4'];
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

		const chainId: string = await getChainId(network, liskCoreV4DataPath);
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
				const client = await getAPIClient(liskCoreV4DataPath);
				const nodeInfo = await client.node.getNodeInfo();
				const { version: appVersion } = nodeInfo;

				cli.action.start('Verifying if backup height from node config matches snapshot height');
				const config = await getConfig(this, liskCoreV4DataPath, customConfigPath);
				if (snapshotHeight !== config.system.backup.height) {
					this.error(
						`Lisk Core v4 backup height mismatch. Actual: ${config.system.backup.height}, Expected: ${snapshotHeight}.`,
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

				if (autoStartKlayrCoreV4) {
					if (!networkConstant) {
						this.error(
							`Unknown network detected. No NETWORK_CONSTANT defined for networkID: ${chainId}.`,
						);
					}
				}

				cli.action.start('Verifying Lisk Core version');
				const isLiskCoreVersionValid = semver.valid(appVersion);
				if (isLiskCoreVersionValid === null) {
					this.error(
						`Invalid Lisk Core version detected: ${appVersion}. Minimum supported version is ${MIN_SUPPORTED_LISK_CORE_VERSION}.`,
					);
				}

				if (semver.lt(appVersion, MIN_SUPPORTED_LISK_CORE_VERSION)) {
					this.error(
						`Klayr Migrator is not compatible with Lisk Core version ${appVersion}. Minimum supported version is ${MIN_SUPPORTED_LISK_CORE_VERSION}.`,
					);
				}
				cli.action.stop(`${appVersion} detected`);

				await observeChainHeight({
					label: 'Waiting for snapshot height to be finalized',
					liskCoreV4DataPath,
					height: snapshotHeight,
					delay: 500,
					isFinal: true,
				});
			}

			setTokenIDKlyByNetID(chainId);
			setPrevSnapshotBlockHeightByNetID(chainId);
			setAdditionalAccountsByChainID(chainId);

			// Create new DB instance based on the snapshot path
			cli.action.start('Creating database instance');
			const snapshotDirPath = await resolveSnapshotPath(
				useSnapshot,
				snapshotPath,
				dataDir,
				liskCoreV4DataPath,
			);
			const db = new StateDB(`${snapshotDirPath}/state.db`);
			const blockchainDB = new Database(`${snapshotDirPath}/blockchain.db`);
			cli.action.stop();

			// Create genesis assets
			cli.action.start('Creating genesis assets');
			const createAsset = new CreateAsset(db, blockchainDB);
			const tokenID = getTokenIDKly();
			const genesisAssets = await createAsset.init(snapshotHeight, tokenID);
			cli.action.stop();

			// Create an app instance for creating genesis block
			const defaultConfigFilePath = await resolveConfigDefaultPath(networkConstant.name);
			const defaultConfigV4 = await fs.readJSON(defaultConfigFilePath);

			cli.action.start(`Exporting genesis block to the path ${outputDir}`);
			await writeGenesisAssets(genesisAssets, outputDir);
			cli.action.stop();

			if (autoMigrateUserConfig && !useSnapshot) {
				// User specified custom config file
				const configV4: ApplicationConfig = customConfigPath
					? await getConfig(this, liskCoreV4DataPath, customConfigPath)
					: await getConfig(this, liskCoreV4DataPath);
				cli.action.start('Creating backup for old config');
				await createBackup(configV4);
				cli.action.stop();

				cli.action.start('Migrating user configuration');
				const migratedConfigV4 = (await migrateUserConfig(
					configV4,
					defaultConfigV4,
					snapshotHeight,
				)) as ApplicationConfig;
				cli.action.stop();

				cli.action.start('Validating migrated user configuration');
				const isValidConfig = await validateConfig(migratedConfigV4);
				cli.action.stop();

				if (!isValidConfig) {
					throw new MigratorException(
						'Migrated user configuration is invalid.',
						ERROR_CODE.INVALID_CONFIG,
					);
				}

				cli.action.start(`Exporting user configuration to the path: ${outputDir}`);
				await writeConfig(migratedConfigV4, outputDir);
				cli.action.stop();

				// Set configCoreV4 to the migrated Core config
				configCoreV4 = migratedConfigV4 as PartialApplicationConfig;
			}

			cli.action.start('Installing Klayr Core v4');
			await installKlayrCore();
			cli.action.stop();

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
				if (autoStartKlayrCoreV4) {
					try {
						if (!autoMigrateUserConfig) {
							configCoreV4 = defaultConfigV4;
						}

						cli.action.start('Copying genesis block to the Klayr Core executable directory');
						const klayrCoreExecPath = await execAsync('which klayr-core');
						const klayrCoreV4ConfigPath = resolve(
							klayrCoreExecPath,
							'../..',
							`lib/node_modules/klayr-core/config/${networkConstant.name}`,
						);

						await copyGenesisBlock(
							`${outputDir}/genesis_block.blob`,
							`${klayrCoreV4ConfigPath}/genesis_block.blob`,
						);
						this.log(`Genesis block has been copied to: ${klayrCoreV4ConfigPath}.`);
						cli.action.stop();

						// Ask user to manually stop Lisk Core v3 and continue
						const isLiskCoreV4Stopped = await cli.confirm(
							"Please stop Lisk Core to continue. Type 'yes' and press Enter when you stopped Lisk Core. [yes/no]",
						);

						if (isLiskCoreV4Stopped) {
							let numTriesLeft = 3;
							while (numTriesLeft) {
								numTriesLeft -= 1;

								const isCoreV4Running = await isLiskCoreV4Running(liskCoreV4DataPath);
								if (!isCoreV4Running) break;

								if (numTriesLeft >= 0) {
									const isStopReconfirmed = await cli.confirm(
										"Lisk Core still running. Please stop the node, type 'yes' to proceed and 'no' to exit. [yes/no]",
									);
									if (!isStopReconfirmed) {
										throw new Error(
											`Cannot proceed with Klayr Core auto-start. Please continue manually. In order to access legacy blockchain information posts-migration, please copy the contents of the ${snapshotDirPath} directory to 'data/legacy.db' under the Klayr Core v4 data directory (e.g: ${DEFAULT_KLAYR_CORE_PATH}/data/legacy.db/). Exiting!!!`,
										);
									} else if (numTriesLeft === 0 && isStopReconfirmed) {
										const isCoreV4StillRunning = await isLiskCoreV4Running(liskCoreV4DataPath);
										if (isCoreV4StillRunning) {
											throw new Error(
												`Cannot auto-start Klayr Core as Lisk Core is still running. Please continue manually. In order to access legacy blockchain information posts-migration, please copy the contents of the ${snapshotDirPath} directory to 'data/legacy.db' under the Klayr Core v4 data directory (e.g: ${DEFAULT_KLAYR_CORE_PATH}/data/legacy.db/). Exiting!!!`,
											);
										}
									}
								}
							}

							const isUserConfirmed = await cli.confirm(
								`Start Klayr Core with the following configuration? [yes/no]
							${util.inspect(configCoreV4, false, 3)} `,
							);

							if (isUserConfirmed) {
								cli.action.start('Starting Klayr Core');
								const networkName = networkConstant.name;
								await startKlayrCore(
									this,
									liskCoreV4DataPath,
									configCoreV4,
									networkName,
									outputDir,
								);
								this.log(
									`Started Klayr Core v4 at default data directory ('${DEFAULT_KLAYR_CORE_PATH}').`,
								);
								cli.action.stop();
							} else {
								this.log(
									'User did not accept the migrated config. Skipping the Klayr Core auto-start process.',
								);
							}
						} else {
							throw new Error(
								`User did not confirm Lisk Core node shutdown. Skipping the Klayr Core auto-start process. Please continue manually. In order to access legacy blockchain information posts-migration, please copy the contents of the ${snapshotDirPath} directory to 'data/legacy.db' under the Klayr Core v4 data directory (e.g: ${DEFAULT_KLAYR_CORE_PATH}/data/legacy.db/). Exiting!!!`,
							);
						}
					} catch (err) {
						const errorMsg = `Failed to auto-start Klayr Core v4.\nError: ${
							(err as Error).message
						}`;
						throw new MigratorException(
							errorMsg,
							err instanceof MigratorException ? err.code : ERROR_CODE.KLAYR_CORE_START,
						);
					}
				} else {
					this.log(
						`Please copy the contents of ${snapshotDirPath} directory to 'data/legacy.db' under the Klayr Core data directory (e.g: ${DEFAULT_KLAYR_CORE_PATH}/data/legacy.db/) in order to access legacy blockchain information.`,
					);
					this.log('Please copy genesis block to the Klayr Core network directory.');
				}
			}
		} catch (error) {
			const commandsToExecute: string[] = [];
			const code = Number(`${(error as MigratorException).code}`);

			const basicStartCommand = `klayr-core start --network ${networkConstant.name}`;
			const klayrCoreStartCommand = getKlayrCoreStartCommand() ?? basicStartCommand;

			const backupLegacyDataDirCommand = `mv ${liskCoreV4DataPath} ${LISK_V4_BACKUP_DATA_DIR}`;
			const copyLegacyDBCommand = `cp -r ${
				(resolve(LISK_V4_BACKUP_DATA_DIR, SNAPSHOT_DIR), LEGACY_DB_PATH)
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
					'## NOTE: This requires installing Klayr Core locally. Please visit https://klayr.xyz/documentation/klayr-core/setup/npm.html for further instructions',
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
				commandsToExecute.push('\n', '## Backup Lisk Core data directory', '\n');
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
					'## Copy legacy (v4) blockchain information to Klayr Core legacy.db',
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
					ERROR_CODE.KLAYR_CORE_START,
				].includes(code)
			) {
				commandsToExecute.push(
					'\n',
					'## Klayr Core start command - Please modify if necessary',
					'\n',
				);
				commandsToExecute.push(klayrCoreStartCommand);
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
		this.log('Successfully finished migration. We are now Klayr!!!');
		process.exit(0);
	}
}

export = KlayrMigrator;
