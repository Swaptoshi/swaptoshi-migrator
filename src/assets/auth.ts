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
import { authAccountSchema } from 'klayr-framework/dist-node/modules/auth/stores/auth_account';
import {
	AuthAccountEntry,
	AuthStoreEntry,
	AuthStoreEntryBuffer,
	GenesisAssetEntry,
} from '../types';
import { DB_PREFIX_AUTH_STORE, MODULE_NAME_AUTH } from '../constants';
import { genesisAuthStoreSchema } from '../schemas';
import { getStateStore } from '../utils/store';
import { getAdditionalAccounts } from '../utils';

const keyMapper = (key: Buffer) => key.toString('hex');
const keyComparator = (a: Buffer, b: Buffer) => a.compare(b);

export type AuthAccount = {
	key: Buffer;
	value: {
		numberOfSignatures: number;
		mandatoryKeys: Buffer[];
		optionalKeys: Buffer[];
		nonce: string;
	};
};

export const getAuthAccounts = async (db: StateDB): Promise<AuthAccount[]> => {
	const authStateStore = getStateStore(db, DB_PREFIX_AUTH_STORE);
	const auth = (await authStateStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		authAccountSchema,
	)) as AuthAccount[];
	const additionalAccounts = getAdditionalAccounts();
	additionalAccounts.forEach(({ address }) => {
		auth.push({
			key: address,
			value: {
				nonce: '0',
				numberOfSignatures: 0,
				mandatoryKeys: [],
				optionalKeys: [],
			},
		});
	});
	return auth;
};

export const getAuthModuleEntryBuffer = (account: AuthAccount): AuthStoreEntryBuffer => {
	const { numberOfSignatures, mandatoryKeys, optionalKeys, nonce } = account.value;

	const authObj: AuthAccountEntry = {
		numberOfSignatures,
		mandatoryKeys: mandatoryKeys.sort(keyComparator).map(keyMapper),
		optionalKeys: optionalKeys.sort(keyComparator).map(keyMapper),
		nonce: String(nonce),
	};

	return {
		address: account.key,
		authAccount: authObj,
	};
};

export const getAuthModuleEntry = async (
	authStoreEntries: AuthStoreEntry[],
): Promise<GenesisAssetEntry> => ({
	module: MODULE_NAME_AUTH,
	data: ({ authDataSubstore: authStoreEntries } as unknown) as Record<string, unknown>,
	schema: genesisAuthStoreSchema,
});
