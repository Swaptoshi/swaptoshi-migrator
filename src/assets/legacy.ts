/*
 * Copyright © 2024 Klayr Holding
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
import { StateDB } from '@liskhq/lisk-db';
import { DB_PREFIX_LEGACY_STORE, MODULE_NAME_LEGACY } from '../constants';
import { genesisLegacyStoreSchema, legacyAccountStoreSchema } from '../schemas';
import { GenesisAssetEntry, LegacyStoreEntry, LegacyStoreEntryBuffer } from '../types';
import { getStateStore } from '../utils/store';

export type LegacyDBAccount = {
	key: Buffer;
	value: {
		address: Buffer;
		balance: string;
	};
};

export const getLegacyAccounts = async (db: StateDB): Promise<LegacyDBAccount[]> => {
	const legacyStateStore = getStateStore(db, DB_PREFIX_LEGACY_STORE);
	return legacyStateStore.iterateWithSchema(
		{
			gte: Buffer.alloc(8, 0),
			lte: Buffer.alloc(8, 255),
		},
		legacyAccountStoreSchema,
	);
};

export const getLegacyModuleEntry = async (
	legacyAddresses: LegacyDBAccount[],
): Promise<GenesisAssetEntry> => {
	const legacyAccounts: LegacyStoreEntryBuffer[] = legacyAddresses.map(account => ({
		address: account.key,
		balance: String(account.value.balance),
	}));

	const sortedLegacyAccounts: LegacyStoreEntry[] = legacyAccounts
		.sort((a, b) => a.address.compare(b.address))
		.map(entry => ({
			...entry,
			address: entry.address.toString('hex'),
		}));

	return {
		module: MODULE_NAME_LEGACY,
		data: ({ accounts: sortedLegacyAccounts } as unknown) as Record<string, unknown>,
		schema: genesisLegacyStoreSchema,
	};
};
