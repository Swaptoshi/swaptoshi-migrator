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
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import * as fs from 'fs-extra';
import * as utils from '@klayr/utils';
import cli from 'cli-ux';
import { Command } from '@oclif/command';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { validator } from '@klayr/validator';
import { ApplicationConfig, applicationConfigSchema } from 'klayr-framework';
import { objects } from '@klayr/utils';
import {
	GenesisAssetEntry,
	GovernanceGenesisStoreEntry,
	LoggerConfig,
	NetworkConfigLocal,
} from '../types';
import {
	BLOCK_TIME,
	DEFAULT_VERSION,
	MAX_BFT_WEIGHT_CAP,
	NETWORK_CONSTANT,
	NUMBER_ACTIVE_VALIDATORS_AFTER,
	NUMBER_STANDBY_VALIDATORS,
	POS_INIT_ROUNDS,
} from '../constants';
import { resolveAbsolutePath } from './path';

const LOG_LEVEL_PRIORITY = Object.freeze({
	FATAL: 0,
	ERROR: 1,
	WARN: 2,
	INFO: 3,
	DEBUG: 4,
	TRACE: 5,
}) as Record<string, number>;

export const getNetworkByNetworkID = (networkID: string): string | Error => {
	const networkInfo = NETWORK_CONSTANT[networkID];
	if (!networkInfo) {
		throw new Error('Migrator running against unidentified network. Cannot proceed.');
	}
	return networkInfo.name;
};

export const getLogLevel = (loggerConfig: LoggerConfig): string => {
	const highestLogPriority = Math.max(
		LOG_LEVEL_PRIORITY[String(loggerConfig.fileLogLevel || '').toUpperCase()] ??
			LOG_LEVEL_PRIORITY.INFO,
		LOG_LEVEL_PRIORITY[String(loggerConfig.consoleLogLevel || '').toUpperCase()] ??
			LOG_LEVEL_PRIORITY.INFO,
	);

	try {
		const [logLevel] = Object.entries(LOG_LEVEL_PRIORITY).find(
			([, v]) => v === highestLogPriority,
		) as [string, number];

		return logLevel.toLowerCase();
	} catch (err) {
		return 'info';
	}
};

export const getConfig = async (
	_this: Command,
	corePath: string,
	customConfigPath?: string,
): Promise<ApplicationConfig> => {
	const dataDirConfigPath = join(corePath, 'config', 'config.json');
	const dataDirConfig = await fs.readJSON(dataDirConfigPath);

	const customConfig = customConfigPath
		? await fs.readJSON(resolveAbsolutePath(customConfigPath))
		: {};

	cli.action.start('Compiling Swaptoshi Core configuration');
	const config = objects.mergeDeep({}, dataDirConfig, customConfig) as ApplicationConfig;
	cli.action.stop();

	return config;
};

export const resolveConfigDefaultPath = async (networkName: string): Promise<string> =>
	resolve(__dirname, '../../config', networkName, 'config.json');

export const resolveBaseGenesisAssetsDefaultPath = async (networkName: string): Promise<string> =>
	resolve(__dirname, '../../config', networkName, 'genesis_assets.json');

export const createBackup = async (config: ApplicationConfig): Promise<void> => {
	const backupPath = join(__dirname, '../..', 'backup');
	mkdirSync(backupPath, { recursive: true });
	writeFileSync(resolve(`${backupPath}/config.json`), JSON.stringify(config, null, '\t'));
};

export const updateConfigSubstore = (
	assets: GenesisAssetEntry[],
	networkConstant: NetworkConfigLocal,
) => {
	const assetsClone = utils.objects.cloneDeep(assets);
	const governanceIndex = assetsClone.findIndex(t => t.module === 'governance');
	if (governanceIndex !== -1) {
		const governanceAssets = (assetsClone[governanceIndex]
			.data as unknown) as GovernanceGenesisStoreEntry;
		for (const configToUpdate of networkConstant.updatedConfigSubstore) {
			const index = governanceAssets.configSubstore.findIndex(
				t => t.module === configToUpdate.module,
			);
			if (index !== -1) {
				governanceAssets.configSubstore[index].data = configToUpdate.data.toString('hex');
			}
		}
	}
	return assetsClone;
};

export const migrateUserConfig = async (
	oldConfig: ApplicationConfig,
	newConfig: ApplicationConfig,
	snapshotHeight: number,
): Promise<ApplicationConfig> => {
	cli.action.start('Starting migration of custom config properties.');

	// Assign default version if not available
	// Assign system config properties
	if (!newConfig.system?.version) {
		cli.action.start(`Setting config property 'system.version' to: ${DEFAULT_VERSION}.`);
		newConfig.system.version = DEFAULT_VERSION;
		cli.action.stop();
	}

	if (oldConfig?.system?.logLevel) {
		cli.action.start(
			`Setting config property 'system.logLevel' to: ${oldConfig?.system?.logLevel}.`,
		);
		newConfig.system.logLevel = oldConfig?.system?.logLevel;
		cli.action.stop();
	}

	if (oldConfig?.system?.keepEventsForHeights) {
		cli.action.start(
			`Setting config property 'system.keepEventsForHeights' to: ${oldConfig.system.keepEventsForHeights}.`,
		);
		newConfig.system.keepEventsForHeights = oldConfig.system.keepEventsForHeights;
		cli.action.stop();
	}

	if (oldConfig?.system?.keepInclusionProofsForHeights) {
		cli.action.start(
			`Setting config property 'system.keepInclusionProofsForHeights' to: ${oldConfig.system.keepInclusionProofsForHeights}.`,
		);
		newConfig.system.keepInclusionProofsForHeights = oldConfig.system.keepInclusionProofsForHeights;
		cli.action.stop();
	}

	if (oldConfig?.system?.inclusionProofKeys) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		cli.action.start(
			`Setting config property 'system.inclusionProofKeys' to: ${oldConfig.system.inclusionProofKeys}.`,
		);
		newConfig.system.inclusionProofKeys = oldConfig.system.inclusionProofKeys;
		cli.action.stop();
	}

	if (oldConfig?.system?.enableMetrics) {
		cli.action.start('Setting config property system.enableMetrics');
		newConfig.system.enableMetrics = oldConfig.system.enableMetrics;
		cli.action.stop();
	}

	// Assign rpc config properties
	if (oldConfig?.rpc?.modes) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		cli.action.start(`Setting config property 'rpc.modes' to: ${oldConfig.rpc.modes}.`);
		newConfig.rpc.modes = oldConfig.rpc.modes;
		cli.action.stop();
	}
	if (oldConfig?.rpc?.port) {
		cli.action.start(`Setting config property 'rpc.port' to: ${oldConfig.rpc.port}.`);
		newConfig.rpc.port = oldConfig.rpc.port;
		cli.action.stop();
	}
	if (oldConfig?.rpc?.host) {
		cli.action.start(`Setting config property 'rpc.host' to: ${oldConfig.rpc.host}.`);
		newConfig.rpc.host = oldConfig.rpc.host;
		cli.action.stop();
	}
	if (oldConfig?.rpc?.allowedMethods) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		cli.action.start(
			`Setting config property 'rpc.allowedMethods' to: ${oldConfig.rpc.allowedMethods}.`,
		);
		newConfig.rpc.allowedMethods = oldConfig.rpc.allowedMethods;
		cli.action.stop();
	}
	if (oldConfig?.rpc?.accessControlAllowOrigin) {
		cli.action.start(
			`Setting config property 'rpc.accessControlAllowOrigin' to: ${oldConfig.rpc.accessControlAllowOrigin}.`,
		);
		newConfig.rpc.accessControlAllowOrigin = oldConfig.rpc.accessControlAllowOrigin;
		cli.action.stop();
	}

	// Assign genesis config properties
	if (oldConfig?.genesis?.block?.fromFile || oldConfig?.genesis?.block?.blob) {
		cli.action.start('Setting config property "genesis.block".');
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		newConfig.genesis.block = { ...newConfig.genesis.block, ...oldConfig.genesis.block };
		cli.action.stop();
	}
	if (!newConfig?.genesis?.blockTime) {
		cli.action.start(`Setting config property 'genesis.blockTime' to: ${BLOCK_TIME}.`);
		newConfig.genesis.blockTime = BLOCK_TIME;
		cli.action.stop();
	}
	if (oldConfig?.genesis?.chainID) {
		cli.action.start(`Setting config property 'genesis.chainID' to: ${oldConfig.genesis.chainID}.`);
		newConfig.genesis.chainID = oldConfig.genesis.chainID;
		cli.action.stop();
	}
	if (oldConfig?.genesis?.maxTransactionsSize) {
		cli.action.start('Setting config property `genesis.maxTransactionsSize`.');
		newConfig.genesis.maxTransactionsSize = oldConfig.genesis.maxTransactionsSize;
		cli.action.stop();
	}

	cli.action.start("Calculating and updating config property 'genesis.minimumCertifyHeight'.");
	newConfig.genesis.minimumCertifyHeight =
		snapshotHeight +
		1 +
		(POS_INIT_ROUNDS + NUMBER_ACTIVE_VALIDATORS_AFTER - 1) *
			(NUMBER_ACTIVE_VALIDATORS_AFTER + NUMBER_STANDBY_VALIDATORS);
	cli.action.stop();

	// Assign transaction pool config properties
	if (oldConfig?.transactionPool) {
		if (oldConfig?.transactionPool?.maxTransactions) {
			cli.action.start(
				`Setting config property 'transactionPool.maxTransactions' to: ${oldConfig.transactionPool.maxTransactions}.`,
			);
			((newConfig.transactionPool
				.maxTransactions as unknown) as number) = oldConfig.transactionPool.maxTransactions;
			cli.action.stop();
		}

		if (oldConfig?.transactionPool?.maxTransactionsPerAccount) {
			cli.action.start(
				`Setting config property 'transactionPool.maxTransactionsPerAccount' to: ${oldConfig.transactionPool.maxTransactionsPerAccount}.`,
			);
			((newConfig.transactionPool
				.maxTransactionsPerAccount as unknown) as number) = oldConfig.transactionPool.maxTransactionsPerAccount;
			cli.action.stop();
		}

		if (oldConfig?.transactionPool?.transactionExpiryTime) {
			cli.action.start(
				`Setting config property 'transactionPool.transactionExpiryTime' to: ${oldConfig.transactionPool.transactionExpiryTime}.`,
			);
			((newConfig.transactionPool
				.transactionExpiryTime as unknown) as number) = oldConfig.transactionPool.transactionExpiryTime;
			cli.action.stop();
		}

		if (oldConfig?.transactionPool?.minEntranceFeePriority) {
			cli.action.start(
				`Setting config property 'transactionPool.minEntranceFeePriority' to: ${oldConfig.transactionPool.minEntranceFeePriority}.`,
			);
			((newConfig.transactionPool
				.minEntranceFeePriority as unknown) as string) = oldConfig.transactionPool.minEntranceFeePriority;
			cli.action.stop();
		}

		if (oldConfig?.transactionPool?.minReplacementFeeDifference) {
			cli.action.start(
				`Setting config property 'transactionPool.minReplacementFeeDifference' to: ${oldConfig.transactionPool.minReplacementFeeDifference}.`,
			);
			((newConfig.transactionPool
				.minReplacementFeeDifference as unknown) as string) = oldConfig.transactionPool.minReplacementFeeDifference;
			cli.action.stop();
		}
	}

	// Assign network config properties
	if (oldConfig?.network) {
		if (oldConfig?.network?.port) {
			cli.action.start(`Setting config property 'network.port' to: ${oldConfig.network.port}.`);
			newConfig.network.port = oldConfig.network.port;
			cli.action.stop();
		}

		if (oldConfig?.network?.host) {
			cli.action.start(`Setting config property 'network.host' to: ${oldConfig.network.host}.`);
			newConfig.network.host = oldConfig.network.host;
			cli.action.stop();
		}

		if (oldConfig?.network?.maxOutboundConnections) {
			cli.action.start(
				`Setting config property 'network.maxOutboundConnections' to: ${oldConfig.network.maxOutboundConnections}.`,
			);
			newConfig.network.maxOutboundConnections = oldConfig.network.maxOutboundConnections;
			cli.action.stop();
		}

		if (oldConfig?.network?.maxInboundConnections) {
			cli.action.start(
				`Setting config property 'network.maxInboundConnections' to: ${oldConfig.network.maxInboundConnections}.`,
			);
			newConfig.network.maxInboundConnections = oldConfig.network.maxInboundConnections;
			cli.action.stop();
		}

		if (oldConfig?.network?.wsMaxPayload) {
			cli.action.start(
				`Setting config property 'network.wsMaxPayload' to: ${oldConfig.network.wsMaxPayload}.`,
			);
			newConfig.network.wsMaxPayload = oldConfig.network.wsMaxPayload;
			cli.action.stop();
		}

		if (oldConfig?.network?.advertiseAddress) {
			cli.action.start(
				`Setting config property 'network.advertiseAddress' to: ${oldConfig.network.advertiseAddress}.`,
			);
			newConfig.network.advertiseAddress = oldConfig.network.advertiseAddress;
			cli.action.stop();
		}
	}

	// Assign forging config properties
	if (newConfig.modules?.pos && !newConfig.modules?.pos?.maxBFTWeightCap) {
		cli.action.start(
			`Setting config property 'modules.pos.maxBFTWeightCap' to: ${MAX_BFT_WEIGHT_CAP}.`,
		);
		newConfig.modules.pos.maxBFTWeightCap = MAX_BFT_WEIGHT_CAP;
		cli.action.stop();
	}

	cli.action.stop();

	return newConfig;
};

export const validateConfig = async (config: ApplicationConfig): Promise<boolean> => {
	try {
		const mergedConfig = objects.mergeDeep({}, applicationConfigSchema.default, config);
		(await validator.validate(applicationConfigSchema, mergedConfig)) as unknown;
		return true;
	} catch (error) {
		return false;
	}
};

export const writeConfig = async (config: ApplicationConfig, outputDir: string): Promise<void> => {
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	writeFileSync(resolve(outputDir, 'config.json'), JSON.stringify(config, null, '\t'));
};
