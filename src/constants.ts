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
} from 'lisk-framework/dist-node/modules/base_store';
import { NetworkConfigLocal } from './types';

export const MODULE_NAME_LEGACY = 'legacy';
export const MODULE_NAME_AUTH = 'auth';
export const MODULE_NAME_TOKEN = 'token';
export const MODULE_NAME_POS = 'pos';
export const MODULE_NAME_INTEROPERABILITY = 'interoperability';
export const MODULE_NAME_DYNAMIC_REWARD = 'dynamicReward';
export const MODULE_NAME_RANDOM = 'random';
export const MODULE_NAME_VALIDATORS = 'validators';

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

// legacy stores
export const DB_PREFIX_LEGACY_STORE = Buffer.concat([
	computeStorePrefix(MODULE_NAME_LEGACY),
	computeSubstorePrefix(0),
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

export const POS_INIT_ROUNDS = 587 * 2;
export const NUMBER_ACTIVE_VALIDATORS = 101;
export const NUMBER_KLAYR_ACTIVE_VALIDATORS = 51;
export const NUMBER_STANDBY_VALIDATORS = 2;
export const ROUND_LENGTH = NUMBER_ACTIVE_VALIDATORS + NUMBER_STANDBY_VALIDATORS;
export const KLAYR_ROUND_LENGTH = NUMBER_KLAYR_ACTIVE_VALIDATORS + NUMBER_STANDBY_VALIDATORS;
export const MAX_BFT_WEIGHT_CAP = 1000;

export const SNAPSHOT_TIME_GAP = 3600;

export const DUMMY_PROOF_OF_POSSESSION = Buffer.alloc(96, 0).toString('hex');

export const KLAYR_CHAIN_NAME_MAINCHAIN = 'klayr_mainchain';

export const Q96_ZERO = Buffer.alloc(0);

const TOKEN_ID_LSK = Object.freeze({
	MAINNET: '0000000000000000',
	TESTNET: '0100000000000000',
	DEVNET: '0400000000000000',
}) as { [key: string]: string };

const HEIGHT_PREVIOUS_SNAPSHOT_BLOCK = Object.freeze({
	MAINNET: 23390991,
	TESTNET: 20449414,
	DEVNET: 0,
}) as { [key: string]: number };

export const NETWORK_CONSTANT: { [key: string]: NetworkConfigLocal } = {
	'00000000': {
		name: 'mainnet',
		tokenID: TOKEN_ID_LSK.MAINNET,
		prevSnapshotBlockHeight: HEIGHT_PREVIOUS_SNAPSHOT_BLOCK.MAINNET,
		additionalAccounts: [
			{
				address: Buffer.from('5fa998cb3aa5e233a34b1e8fd1a243b2e38bf1cb', 'hex'),
				balance: BigInt(4_500_000_00000000),
			},
			{
				address: Buffer.from('48328d8ccc152d3ab018a6632374c0e278a4b25a', 'hex'),
				balance: BigInt(1_000_000_00000000),
			},
			{
				address: Buffer.from('aee55db4c8f7fd8bfc18b6ecba6632e4580aee8a', 'hex'),
				balance: BigInt(9_500_000_00000000),
			},
			{
				address: Buffer.from('7765b9adb4cc65162c20c300da3e6734a9cbfbcc', 'hex'),
				balance: BigInt(3_000_000_00000000),
			},
			{
				address: Buffer.from('6b25ca51fff16b727ae9cd331935ad4a1fe27363', 'hex'),
				balance: BigInt(2_000_000_00000000),
			},
			{
				address: Buffer.from('5ffe83fe10100825f49808c8a9d3319052c2530d', 'hex'),
				balance: BigInt(5_000_000_00000000),
			},
			{
				address: Buffer.from('6fee835c819aba154b3099ebd897162bbaf28a99', 'hex'),
				balance: BigInt(3_000_000_00000000),
			},
			{
				address: Buffer.from('db6998c8aa025435c81a646a868c3a56a05c5058', 'hex'),
				balance: BigInt(2_000_000_00000000),
			},
		],
	},
	'01000000': {
		name: 'testnet',
		tokenID: TOKEN_ID_LSK.TESTNET,
		prevSnapshotBlockHeight: HEIGHT_PREVIOUS_SNAPSHOT_BLOCK.TESTNET,
		additionalAccounts: [
			{
				address: Buffer.from('5fa998cb3aa5e233a34b1e8fd1a243b2e38bf1cb', 'hex'),
				balance: BigInt(4_500_000_00000000),
			},
			{
				address: Buffer.from('48328d8ccc152d3ab018a6632374c0e278a4b25a', 'hex'),
				balance: BigInt(1_000_000_00000000),
			},
			{
				address: Buffer.from('aee55db4c8f7fd8bfc18b6ecba6632e4580aee8a', 'hex'),
				balance: BigInt(9_500_000_00000000),
			},
			{
				address: Buffer.from('7765b9adb4cc65162c20c300da3e6734a9cbfbcc', 'hex'),
				balance: BigInt(3_000_000_00000000),
			},
			{
				address: Buffer.from('6b25ca51fff16b727ae9cd331935ad4a1fe27363', 'hex'),
				balance: BigInt(2_000_000_00000000),
			},
			{
				address: Buffer.from('5ffe83fe10100825f49808c8a9d3319052c2530d', 'hex'),
				balance: BigInt(5_000_000_00000000),
			},
			{
				address: Buffer.from('6fee835c819aba154b3099ebd897162bbaf28a99', 'hex'),
				balance: BigInt(3_000_000_00000000),
			},
			{
				address: Buffer.from('db6998c8aa025435c81a646a868c3a56a05c5058', 'hex'),
				balance: BigInt(2_000_000_00000000),
			},
		],
	},
	'04000000': {
		name: 'devnet',
		tokenID: TOKEN_ID_LSK.DEVNET,
		prevSnapshotBlockHeight: HEIGHT_PREVIOUS_SNAPSHOT_BLOCK.DEVNET,
		additionalAccounts: [
			{
				address: Buffer.from('870d6772fcec81fbc02b7044605bc1359610a032', 'hex'),
				balance: BigInt(500000000000000),
			},
			{
				address: Buffer.from('870d6772fcec81fbc02b7044605bc1359610a0a0', 'hex'),
				balance: BigInt(500000000000000),
			},
		],
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
export const MIN_SUPPORTED_LISK_CORE_VERSION = '4.0.1';
export const DEFAULT_LISK_CORE_PATH = `${homedir()}/.lisk/lisk-core`;
export const DEFAULT_KLAYR_CORE_PATH = `${homedir()}/.klayr/klayr-core`;
export const LEGACY_DB_PATH = `${DEFAULT_KLAYR_CORE_PATH}/${DEFAULT_DATA_DIR}/legacy.db`;

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
	KLAYR_CORE_START = 3,
	BACKUP_LEGACY_DATA_DIR = 4,
	COPY_LEGACY_DB = 5,
}

export const LISK_V4_BACKUP_DATA_DIR = `${homedir()}/.lisk/lisk-core-v4`;
