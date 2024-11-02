/*
 * Copyright © 2024 Klayr Holding
 * Copyright © 2023 Lisk Foundation
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
import { genesisInteroperabilitySchema } from 'klayr-framework';
import { StateDB } from '@liskhq/lisk-db';
import { ownChainAccountSchema } from 'lisk-framework/dist-node/modules/interoperability/stores/own_chain_account';
import { MAX_UINT32 } from 'lisk-framework/dist-node/modules/interoperability/constants';
import { utils } from '@liskhq/lisk-cryptography';
import { chainDataSchema } from 'lisk-framework/dist-node/modules/interoperability/stores/chain_account';
import { channelSchema } from 'lisk-framework/dist-node/modules/interoperability/stores/channel_data';
import { chainValidatorsSchema } from 'lisk-framework/dist-node/modules/interoperability/stores/chain_validators';
import { terminatedStateSchema } from 'lisk-framework/dist-node/modules/interoperability/stores/terminated_state';
import { terminatedOutboxSchema } from 'lisk-framework/dist-node/modules/interoperability/stores/terminated_outbox';
import { GenesisAssetEntry, GenesisInteroperability } from '../types';
import { getStateStore } from '../utils/store';
import {
	MODULE_NAME_INTEROPERABILITY,
	KLAYR_CHAIN_NAME_MAINCHAIN,
	DB_PREFIX_INTEROPERABILITY_OWN_CHAIN_ACCOUNT_STORE,
	DB_PREFIX_INTEROPERABILITY_CHAIN_ACCOUNT_STORE,
	DB_PREFIX_INTEROPERABILITY_CHANNEL_DATA_STORE,
	DB_PREFIX_INTEROPERABILITY_CHAIN_VALIDATORS_STORE,
	DB_PREFIX_INTEROPERABILITY_TERMINATED_STATE_STORE,
	DB_PREFIX_INTEROPERABILITY_TERMINATED_OUTBOX_STORE,
} from '../constants';

export const getOwnChainAccount = async (db: StateDB): Promise<{ nonce: bigint }> => {
	const interoperabilityOwnChainAccountStore = getStateStore(
		db,
		DB_PREFIX_INTEROPERABILITY_OWN_CHAIN_ACCOUNT_STORE,
	);
	return interoperabilityOwnChainAccountStore.getWithSchema(Buffer.alloc(0), ownChainAccountSchema);
};

export const getChannelData = async (db: StateDB, chainID: Buffer): Promise<unknown[]> => {
	const interoperabilityChannelDataStore = getStateStore(
		db,
		DB_PREFIX_INTEROPERABILITY_CHANNEL_DATA_STORE,
	);
	return interoperabilityChannelDataStore.getWithSchema(chainID, channelSchema);
};

export const getValidators = async (db: StateDB, chainID: Buffer): Promise<unknown[]> => {
	const interoperabilityChainValidatorsStore = getStateStore(
		db,
		DB_PREFIX_INTEROPERABILITY_CHAIN_VALIDATORS_STORE,
	);
	return interoperabilityChainValidatorsStore.getWithSchema(chainID, chainValidatorsSchema);
};

export const getChainAccounts = async (db: StateDB): Promise<unknown[]> => {
	const interoperabilityChainAccountStoreStore = getStateStore(
		db,
		DB_PREFIX_INTEROPERABILITY_CHAIN_ACCOUNT_STORE,
	);
	const endBuf = utils.intToBuffer(MAX_UINT32, 4);

	const chainAccounts = await interoperabilityChainAccountStoreStore.iterateWithSchema(
		{
			gte: Buffer.alloc(8, 0),
			lte: endBuf,
		},
		chainDataSchema,
	);
	return Promise.all(
		chainAccounts.map(async ({ key, value }) => {
			const channelData = await getChannelData(db, key);
			const chainValidators = await getValidators(db, key);
			return {
				chainID: key,
				chainData: value,
				channelData,
				chainValidators,
			};
		}),
	);
};

export const getTerminatedStateAccounts = async (db: StateDB): Promise<unknown[]> => {
	const interoperabilityTerminatedStateStore = getStateStore(
		db,
		DB_PREFIX_INTEROPERABILITY_TERMINATED_STATE_STORE,
	);
	return interoperabilityTerminatedStateStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(8, 255),
		},
		terminatedStateSchema,
	);
};

export const getTerminatedOutboxAccounts = async (db: StateDB): Promise<unknown[]> => {
	const interoperabilityTerminatedOutboxStore = getStateStore(
		db,
		DB_PREFIX_INTEROPERABILITY_TERMINATED_OUTBOX_STORE,
	);
	return interoperabilityTerminatedOutboxStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(8, 255),
		},
		terminatedOutboxSchema,
	);
};

export const getInteropModuleEntry = async (db: StateDB): Promise<GenesisAssetEntry> => {
	const chainInfos = await getChainAccounts(db);
	const ownAccount = await getOwnChainAccount(db);
	const interopObj = ({
		ownChainName: KLAYR_CHAIN_NAME_MAINCHAIN,
		ownChainNonce: ownAccount.nonce,
		chainInfos,
		terminatedStateAccounts: await getTerminatedStateAccounts(db),
		terminatedOutboxAccounts: await getTerminatedOutboxAccounts(db),
	} as unknown) as GenesisInteroperability;

	return {
		module: MODULE_NAME_INTEROPERABILITY,
		data: (interopObj as unknown) as Record<string, unknown>,
		schema: genesisInteroperabilitySchema,
	};
};
