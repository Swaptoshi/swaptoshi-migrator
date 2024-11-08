/*
 * Copyright © 2022 Lisk Foundation
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
import { homedir } from 'os';

import {
	computeStorePrefix,
	computeSubstorePrefix,
} from 'klayr-framework/dist-node/modules/base_store';
import * as cryptography from '@klayr/cryptography';
import { codec } from '@klayr/codec';
import { NetworkConfigLocal } from './types';
import { feeConversionConfigSchema } from './schemas/feeConversion';
import { dexConfigSchema } from './schemas/dex';

export const MODULE_NAME_AUTH = 'auth';
export const MODULE_NAME_TOKEN = 'token';
export const MODULE_NAME_POS = 'pos';
export const MODULE_NAME_INTEROPERABILITY = 'interoperability';
export const MODULE_NAME_DYNAMIC_REWARD = 'dynamicReward';
export const MODULE_NAME_RANDOM = 'random';
export const MODULE_NAME_VALIDATORS = 'validators';

export const MODULE_NAME_DEX = 'dex';
export const MODULE_NAME_TOKEN_FACTORY = 'tokenFactory';
export const MODULE_NAME_GOVERNANCE = 'governance';
export const MODULE_NAME_FEE_CONVERSION = 'feeConversion';
export const MODULE_NAME_LIQUID_POS = 'liquidPos';
export const MODULE_NAME_NFT = 'nft';

const DEX_DEFAULT_NAME = 'Swaptoshi';
const DEX_DEFAULT_TOKEN_SYMBOL = 'SWX';
const DEX_DEFAULT_TOKEN_DECIMAL = 8;

const MAINCHAIN_DEFAULT_TOKEN_SYMBOL = 'KLY';
const MAINCHAIN_DEFAULT_TOKEN_DECIMAL = 8;

// auth stores
export const DB_PREFIX_AUTH_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_AUTH),
	computeSubstorePrefix(0),
]);

// token stores
export const DB_PREFIX_TOKEN_USER_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_TOKEN_SUPPLY_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN),
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_TOKEN_ESCROW_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN),
	computeSubstorePrefix(2),
]);
export const DB_PREFIX_TOKEN_SUPPORTED_TOKEN_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN),
	computeSubstorePrefix(3),
]);

// pos stores
export const DB_PREFIX_POS_STAKER_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_POS_VALIDATOR_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_POS_NAME_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(2),
]);
export const DB_PREFIX_POS_SNAPSHOT_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(3),
]);
export const DB_PREFIX_POS_GENESIS_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(4),
]);
export const DB_PREFIX_POS_TIMESTAMP_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(5),
]);
export const DB_PREFIX_POS_ELIGIBLE_VALIDATORS_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_POS),
	computeSubstorePrefix(6),
]);

// dynamicReward stores
export const DB_PREFIX_DYNAMIC_REWARD_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DYNAMIC_REWARD),
	computeSubstorePrefix(0),
]);

// random stores
export const DB_PREFIX_RANDOM_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_RANDOM),
	computeSubstorePrefix(0),
]);

// validators stores
export const DB_PREFIX_VALIDATORS_KEYS_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_VALIDATORS),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_VALIDATORS_PARAMS_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_VALIDATORS),
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_VALIDATORS_BLS_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_VALIDATORS),
	computeSubstorePrefix(2),
]);

// interoperability stores
const INTEROPERABILITY_PREFIX = Buffer.from([0x83, 0xed, 0x0d, 0x25]);
export const DB_PREFIX_INTEROPERABILITY_OUTBOX_ROOT_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_INTEROPERABILITY_CHAIN_ACCOUNT_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_INTEROPERABILITY_OWN_CHAIN_ACCOUNT_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(13),
]);
export const DB_PREFIX_INTEROPERABILITY_CHANNEL_DATA_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(5),
]);
export const DB_PREFIX_INTEROPERABILITY_CHAIN_VALIDATORS_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(9),
]);
export const DB_PREFIX_INTEROPERABILITY_TERMINATED_STATE_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(3),
]);
export const DB_PREFIX_INTEROPERABILITY_TERMINATED_OUTBOX_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(11),
]);
export const DB_PREFIX_INTEROPERABILITY_REGISTERED_NAMES_STORE = Buffer.concat([
	INTEROPERABILITY_PREFIX,
	computeSubstorePrefix(7),
]);

// dex stores
export const DB_PREFIX_DEX_POOL_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_DEX_POSITION_MANAGER_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_DEX_OBSERVATION_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(2),
]);
export const DB_PREFIX_DEX_POSITION_INFO_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(3),
]);
export const DB_PREFIX_DEX_TICK_BITMAP_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(4),
]);
export const DB_PREFIX_DEX_TICK_INFO_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(5),
]);
export const DB_PREFIX_DEX_TOKEN_SYMBOL_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(6),
]);
export const DB_PREFIX_DEX_SUPPORTED_TOKEN_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(7),
]);

// token factory store
export const DB_PREFIX_TOKEN_FACTORY_AIRDROP_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN_FACTORY),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_TOKEN_FACTORY_FACTORY_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN_FACTORY),
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_TOKEN_FACTORY_ICO_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN_FACTORY),
	computeSubstorePrefix(2),
]);
export const DB_PREFIX_TOKEN_FACTORY_NEXT_AVAILABLE_TOKEN_ID_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN_FACTORY),
	computeSubstorePrefix(3),
]);
export const DB_PREFIX_TOKEN_FACTORY_VESTING_UNLOCK_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN_FACTORY),
	computeSubstorePrefix(4),
]);

// governance store
export const DB_PREFIX_GOVERNANCE_PROPOSAL_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(1),
]);
export const DB_PREFIX_GOVERNANCE_QUEUE_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(2),
]);
export const DB_PREFIX_GOVERNANCE_BOOSTED_ACCOUNT_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(3),
]);
export const DB_PREFIX_GOVERNANCE_DELEGATED_VOTE_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(4),
]);
export const DB_PREFIX_GOVERNANCE_NEXT_AVAILABLE_PROPOSAL_ID_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(5),
]);
export const DB_PREFIX_GOVERNANCE_CASTED_VOTE_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(6),
]);
export const DB_PREFIX_GOVERNANCE_VOTE_SCORE_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(7),
]);
export const DB_PREFIX_GOVERNANCE_PROPOSAL_VOTER_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(8),
]);
export const DB_PREFIX_GOVERNANCE_CONFIG_REGISTRY = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(9),
]);

// governable config store
export const DB_PREFIX_FEE_CONVERSION_GOVERNABLE_CONFIG_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_FEE_CONVERSION),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_LIQUID_POS_GOVERNABLE_CONFIG_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_LIQUID_POS),
	computeSubstorePrefix(0),
]);
export const DB_PREFIX_DEX_GOVERNABLE_CONFIG_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_DEX),
	computeSubstorePrefix(8),
]);
export const DB_PREFIX_TOKEN_FACTORY_GOVERNABLE_CONFIG_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_TOKEN_FACTORY),
	computeSubstorePrefix(5),
]);
export const DB_PREFIX_GOVERNANCE_GOVERNABLE_CONFIG_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_GOVERNANCE),
	computeSubstorePrefix(0),
]);

// nft stores
export const DB_PREFIX_NFT_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_NFT),
	computeSubstorePrefix(0),
]);

export const DB_PREFIX_SUPPORTED_NFT_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_NFT),
	computeSubstorePrefix(3),
]);

export const POS_INIT_ROUNDS = 587 * 2;
export const NUMBER_ACTIVE_VALIDATORS = 51;
export const NUMBER_STANDBY_VALIDATORS = 2;
export const ROUND_LENGTH = NUMBER_ACTIVE_VALIDATORS + NUMBER_STANDBY_VALIDATORS;
export const MAX_BFT_WEIGHT_CAP = 1000;

export const SNAPSHOT_TIME_GAP = 3600;

export const DUMMY_PROOF_OF_POSSESSION = Buffer.alloc(96, 0).toString('hex');

export const SWAPTOSHI_CHAIN_NAME_MAINCHAIN = 'swaptoshi';

export const Q96_ZERO = Buffer.alloc(0);

const TOKEN_ID_SWX = Object.freeze({
	MAINNET: '0055555500000000',
	TESTNET: '0155555500000000',
	DEVNET: '0455555500000000',
}) as { [key: string]: string };

const HEIGHT_PREVIOUS_SNAPSHOT_BLOCK = Object.freeze({
	MAINNET: 0,
	TESTNET: 0,
	DEVNET: 0,
}) as { [key: string]: number };

export const NETWORK_CONSTANT: { [key: string]: NetworkConfigLocal } = {
	'00555555': {
		name: 'mainnet',
		tokenID: TOKEN_ID_SWX.MAINNET,
		prevSnapshotBlockHeight: HEIGHT_PREVIOUS_SNAPSHOT_BLOCK.MAINNET,
		updatedConfigSubstore: [],
		additionalConfigRegistry: [],
		additionalAccounts: [],
	},
	'01555555': {
		name: 'testnet',
		tokenID: TOKEN_ID_SWX.TESTNET,
		prevSnapshotBlockHeight: HEIGHT_PREVIOUS_SNAPSHOT_BLOCK.TESTNET,
		updatedConfigSubstore: [
			{
				module: 'feeConversion',
				data: codec.encode(feeConversionConfigSchema, {
					conversionPath: ['01555555000000000000640155555500000001'],
				}),
			},
			{
				module: 'dex',
				data: codec.encode(dexConfigSchema, {
					feeAmountTickSpacing: [
						{
							fee: '100',
							tickSpacing: '1',
						},
						{
							fee: '500',
							tickSpacing: '10',
						},
						{
							fee: '3000',
							tickSpacing: '60',
						},
						{
							fee: '10000',
							tickSpacing: '200',
						},
					],
					feeProtocol: 170,
					feeProtocolPool: cryptography.address.getKlayr32AddressFromAddress(
						cryptography.utils.hash('GovernanceTreasuryAccount', 'utf8').subarray(0, 20),
					),
					feeConversionEnabled: true,
					supportAllTokens: true,
					minTransactionFee: {
						createPool: '0',
						mint: '0',
						burn: '0',
						collect: '0',
						increaseLiquidity: '0',
						decreaseLiquidity: '0',
						exactInput: '0',
						exactInputSingle: '0',
						exactOutput: '0',
						exactOutputSingle: '0',
						treasurify: '0',
					},
					baseFee: {
						createPool: '0',
						mint: '0',
						burn: '0',
						collect: '0',
						increaseLiquidity: '0',
						decreaseLiquidity: '0',
						exactInput: '0',
						exactInputSingle: '0',
						exactOutput: '0',
						exactOutputSingle: '0',
						treasurify: '0',
					},
					nftPositionMetadata: {
						dex: {
							name: DEX_DEFAULT_NAME,
							symbol: DEX_DEFAULT_TOKEN_SYMBOL,
							decimal: DEX_DEFAULT_TOKEN_DECIMAL,
						},
						mainchain: {
							symbol: MAINCHAIN_DEFAULT_TOKEN_SYMBOL,
							decimal: MAINCHAIN_DEFAULT_TOKEN_DECIMAL,
						},
					},
					nftPositionColorRange: {
						hue: [0, 360],
						saturation: [70, 100],
						lightness: [50, 60],
					},
				}),
			},
		],
		additionalConfigRegistry: [
			{
				module: 'feeConversion',
				index: 0,
			},
			{ module: 'liquidPos', index: 0 },
			{ module: 'dex', index: 8 },
			{ module: 'tokenFactory', index: 5 },
			{ module: 'governance', index: 0 },
		],
		additionalAccounts: [],
	},
	'04555555': {
		name: 'devnet',
		tokenID: TOKEN_ID_SWX.DEVNET,
		prevSnapshotBlockHeight: HEIGHT_PREVIOUS_SNAPSHOT_BLOCK.DEVNET,
		updatedConfigSubstore: [],
		additionalConfigRegistry: [],
		additionalAccounts: [],
	},
};

export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_PORT_P2P = 7667;
export const DEFAULT_PORT_RPC = 7887;

export const SHA_256_HASH_LENGTH = 32;

export const LENGTH_GENERATOR_KEY = 32;
export const LENGTH_PROOF_OF_POSSESSION = 96;
export const LENGTH_BLS_KEY = 48;

export const DEFAULT_DATA_DIR = 'data';
export const SNAPSHOT_DIR = `${DEFAULT_DATA_DIR}/backup`;
export const BACKUP_DIR = 'backup';
export const MIN_SUPPORTED_SWAPTOSHI_CORE_VERSION = '1.0.0-alpha.0';
export const DEFAULT_SWAPTOSHI_CORE_PATH = `${homedir()}/.klayr/swaptoshi-core`;
export const LEGACY_DB_PATH = `${DEFAULT_SWAPTOSHI_CORE_PATH}/${DEFAULT_DATA_DIR}/legacy.db`;

export const DEFAULT_VERSION = '0.1.0';
export const EVENT_NEW_BLOCK = 'chain_newBlock';
export const BLOCK_TIME = 7;

export const FILE_NAME = {
	COMMANDS_TO_EXEC: 'commandsToExecute.txt',
	FORGING_STATUS: 'forgingStatus.json',
	KEYS: 'keys.json',
	GENESIS_ASSETS: 'genesis_assets.json',
	GENESIS_BLOCK_JSON: 'genesis_block.json',
	GENESIS_BLOCK_BLOB: 'genesis_block.blob',
};

export const enum ERROR_CODE {
	DEFAULT = 0,
	INVALID_CONFIG = 1,
	GENESIS_BLOCK_CREATE = 2,
	SWAPTOSHI_CORE_START = 3,
	BACKUP_LEGACY_DATA_DIR = 4,
	COPY_LEGACY_DB = 5,
}

export const SWAPTOSHI_BACKUP_DATA_DIR = `${homedir()}/.klayr/swaptoshi-core-old`;
