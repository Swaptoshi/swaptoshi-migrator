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
import cli from 'cli-ux';
import { Command } from '@oclif/command';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { validator } from '@liskhq/lisk-validator';
import { ApplicationConfig, applicationConfigSchema } from 'lisk-framework';
import { objects } from '@liskhq/lisk-utils';
import { LoggerConfig } from '../types';
import {
	BLOCK_TIME,
	DEFAULT_VERSION,
	MAX_BFT_WEIGHT_CAP,
	NETWORK_CONSTANT,
	NUMBER_ACTIVE_VALIDATORS,
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

	cli.action.start('Compiling Lisk Core configuration');
	const config = objects.mergeDeep({}, dataDirConfig, customConfig) as ApplicationConfig;
	cli.action.stop();

	return config;
};

export const resolveConfigDefaultPath = async (networkName: string): Promise<string> =>
	resolve(__dirname, '../../config', networkName, 'config.json');

export const createBackup = async (config: ApplicationConfig): Promise<void> => {
	const backupPath = join(__dirname, '../..', 'backup');
	mkdirSync(backupPath, { recursive: true });
	writeFileSync(resolve(`${backupPath}/config.json`), JSON.stringify(config, null, '\t'));
};

export const migrateUserConfig = async (
	configV4: ApplicationConfig,
	configKlayrV4: ApplicationConfig,
	snapshotHeight: number,
): Promise<ApplicationConfig> => {
	cli.action.start('Starting migration of custom config properties.');

	// Assign default version if not available
	// Assign system config properties
	if (!configKlayrV4.system?.version) {
		cli.action.start(`Setting config property 'system.version' to: ${DEFAULT_VERSION}.`);
		configKlayrV4.system.version = DEFAULT_VERSION;
		cli.action.stop();
	}

	if (configV4?.system?.logLevel) {
		cli.action.start(
			`Setting config property 'system.logLevel' to: ${configV4?.system?.logLevel}.`,
		);
		configKlayrV4.system.logLevel = configV4?.system?.logLevel;
		cli.action.stop();
	}

	if (configV4?.system?.keepEventsForHeights) {
		cli.action.start(
			`Setting config property 'system.keepEventsForHeights' to: ${configV4.system.keepEventsForHeights}.`,
		);
		configKlayrV4.system.keepEventsForHeights = configV4.system.keepEventsForHeights;
		cli.action.stop();
	}

	if (configV4?.system?.keepInclusionProofsForHeights) {
		cli.action.start(
			`Setting config property 'system.keepInclusionProofsForHeights' to: ${configV4.system.keepInclusionProofsForHeights}.`,
		);
		configKlayrV4.system.keepInclusionProofsForHeights =
			configV4.system.keepInclusionProofsForHeights;
		cli.action.stop();
	}

	if (configV4?.system?.inclusionProofKeys) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		cli.action.start(
			`Setting config property 'system.inclusionProofKeys' to: ${configV4.system.inclusionProofKeys}.`,
		);
		configKlayrV4.system.inclusionProofKeys = configV4.system.inclusionProofKeys;
		cli.action.stop();
	}

	if (configV4?.system?.enableMetrics) {
		cli.action.start('Setting config property system.enableMetrics');
		configKlayrV4.system.enableMetrics = configV4.system.enableMetrics;
		cli.action.stop();
	}

	// Assign rpc config properties
	if (configV4?.rpc?.modes) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		cli.action.start(`Setting config property 'rpc.modes' to: ${configV4.rpc.modes}.`);
		configKlayrV4.rpc.modes = configV4.rpc.modes;
		cli.action.stop();
	}
	if (configV4?.rpc?.port) {
		cli.action.start(`Setting config property 'rpc.port' to: ${configV4.rpc.port}.`);
		configKlayrV4.rpc.port = configV4.rpc.port;
		cli.action.stop();
	}
	if (configV4?.rpc?.host) {
		cli.action.start(`Setting config property 'rpc.host' to: ${configV4.rpc.host}.`);
		configKlayrV4.rpc.host = configV4.rpc.host;
		cli.action.stop();
	}
	if (configV4?.rpc?.allowedMethods) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		cli.action.start(
			`Setting config property 'rpc.allowedMethods' to: ${configV4.rpc.allowedMethods}.`,
		);
		configKlayrV4.rpc.allowedMethods = configV4.rpc.allowedMethods;
		cli.action.stop();
	}
	if (configV4?.rpc?.accessControlAllowOrigin) {
		cli.action.start(
			`Setting config property 'rpc.accessControlAllowOrigin' to: ${configV4.rpc.accessControlAllowOrigin}.`,
		);
		configKlayrV4.rpc.accessControlAllowOrigin = configV4.rpc.accessControlAllowOrigin;
		cli.action.stop();
	}

	// Assign genesis config properties
	if (configV4?.genesis?.block?.fromFile || configV4?.genesis?.block?.blob) {
		cli.action.start('Setting config property "genesis.block".');
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		configKlayrV4.genesis.block = { ...configKlayrV4.genesis.block, ...configV4.genesis.block };
		cli.action.stop();
	}
	if (!configKlayrV4?.genesis?.blockTime) {
		cli.action.start(`Setting config property 'genesis.blockTime' to: ${BLOCK_TIME}.`);
		configKlayrV4.genesis.blockTime = BLOCK_TIME;
		cli.action.stop();
	}
	if (configV4?.genesis?.chainID) {
		cli.action.start(`Setting config property 'genesis.chainID' to: ${configV4.genesis.chainID}.`);
		configKlayrV4.genesis.chainID = configV4.genesis.chainID;
		cli.action.stop();
	}
	if (configV4?.genesis?.maxTransactionsSize) {
		cli.action.start('Setting config property `genesis.maxTransactionsSize`.');
		configKlayrV4.genesis.maxTransactionsSize = configV4.genesis.maxTransactionsSize;
		cli.action.stop();
	}

	cli.action.start("Calculating and updating config property 'genesis.minimumCertifyHeight'.");
	configKlayrV4.genesis.minimumCertifyHeight =
		snapshotHeight +
		1 +
		(POS_INIT_ROUNDS + NUMBER_ACTIVE_VALIDATORS - 1) *
			(NUMBER_ACTIVE_VALIDATORS + NUMBER_STANDBY_VALIDATORS);
	cli.action.stop();

	// Assign transaction pool config properties
	if (configV4?.transactionPool) {
		if (configV4?.transactionPool?.maxTransactions) {
			cli.action.start(
				`Setting config property 'transactionPool.maxTransactions' to: ${configV4.transactionPool.maxTransactions}.`,
			);
			((configKlayrV4.transactionPool
				.maxTransactions as unknown) as number) = configV4.transactionPool.maxTransactions;
			cli.action.stop();
		}

		if (configV4?.transactionPool?.maxTransactionsPerAccount) {
			cli.action.start(
				`Setting config property 'transactionPool.maxTransactionsPerAccount' to: ${configV4.transactionPool.maxTransactionsPerAccount}.`,
			);
			((configKlayrV4.transactionPool
				.maxTransactionsPerAccount as unknown) as number) = configV4.transactionPool.maxTransactionsPerAccount;
			cli.action.stop();
		}

		if (configV4?.transactionPool?.transactionExpiryTime) {
			cli.action.start(
				`Setting config property 'transactionPool.transactionExpiryTime' to: ${configV4.transactionPool.transactionExpiryTime}.`,
			);
			((configKlayrV4.transactionPool
				.transactionExpiryTime as unknown) as number) = configV4.transactionPool.transactionExpiryTime;
			cli.action.stop();
		}

		if (configV4?.transactionPool?.minEntranceFeePriority) {
			cli.action.start(
				`Setting config property 'transactionPool.minEntranceFeePriority' to: ${configV4.transactionPool.minEntranceFeePriority}.`,
			);
			((configKlayrV4.transactionPool
				.minEntranceFeePriority as unknown) as string) = configV4.transactionPool.minEntranceFeePriority;
			cli.action.stop();
		}

		if (configV4?.transactionPool?.minReplacementFeeDifference) {
			cli.action.start(
				`Setting config property 'transactionPool.minReplacementFeeDifference' to: ${configV4.transactionPool.minReplacementFeeDifference}.`,
			);
			((configKlayrV4.transactionPool
				.minReplacementFeeDifference as unknown) as string) = configV4.transactionPool.minReplacementFeeDifference;
			cli.action.stop();
		}
	}

	// Assign network config properties
	if (configV4?.network) {
		if (configV4?.network?.port) {
			cli.action.start(`Setting config property 'network.port' to: ${configV4.network.port}.`);
			configKlayrV4.network.port = configV4.network.port;
			cli.action.stop();
		}

		if (configV4?.network?.host) {
			cli.action.start(`Setting config property 'network.host' to: ${configV4.network.host}.`);
			configKlayrV4.network.host = configV4.network.host;
			cli.action.stop();
		}

		if (configV4?.network?.maxOutboundConnections) {
			cli.action.start(
				`Setting config property 'network.maxOutboundConnections' to: ${configV4.network.maxOutboundConnections}.`,
			);
			configKlayrV4.network.maxOutboundConnections = configV4.network.maxOutboundConnections;
			cli.action.stop();
		}

		if (configV4?.network?.maxInboundConnections) {
			cli.action.start(
				`Setting config property 'network.maxInboundConnections' to: ${configV4.network.maxInboundConnections}.`,
			);
			configKlayrV4.network.maxInboundConnections = configV4.network.maxInboundConnections;
			cli.action.stop();
		}

		if (configV4?.network?.wsMaxPayload) {
			cli.action.start(
				`Setting config property 'network.wsMaxPayload' to: ${configV4.network.wsMaxPayload}.`,
			);
			configKlayrV4.network.wsMaxPayload = configV4.network.wsMaxPayload;
			cli.action.stop();
		}

		if (configV4?.network?.advertiseAddress) {
			cli.action.start(
				`Setting config property 'network.advertiseAddress' to: ${configV4.network.advertiseAddress}.`,
			);
			configKlayrV4.network.advertiseAddress = configV4.network.advertiseAddress;
			cli.action.stop();
		}
	}

	// Assign forging config properties
	if (configKlayrV4.modules?.pos && !configKlayrV4.modules?.pos?.maxBFTWeightCap) {
		cli.action.start(
			`Setting config property 'modules.pos.maxBFTWeightCap' to: ${MAX_BFT_WEIGHT_CAP}.`,
		);
		configKlayrV4.modules.pos.maxBFTWeightCap = MAX_BFT_WEIGHT_CAP;
		cli.action.stop();
	}

	cli.action.stop();

	return configKlayrV4;
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
