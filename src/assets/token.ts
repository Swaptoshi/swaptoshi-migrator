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
import { tokenGenesisStoreSchema } from 'klayr-framework';

import { userStoreSchema } from 'lisk-framework/dist-node/modules/token/stores/user';
import { StateDB } from '@liskhq/lisk-db';
import { escrowStoreSchema } from 'lisk-framework/dist-node/modules/token/stores/escrow';
import { getLisk32AddressFromAddress } from '@liskhq/lisk-cryptography/dist-node/address';
import {
	MODULE_NAME_TOKEN,
	DB_PREFIX_TOKEN_USER_STORE,
	DB_PREFIX_TOKEN_ESCROW_STORE,
} from '../constants';

import {
	EscrowSubstoreEntry,
	GenesisAssetEntry,
	KeyIndex,
	SupplySubstoreEntry,
	SupportedTokensSubstoreEntry,
	TokenStoreEntry,
	UserSubstore,
	UserSubstoreEntry,
} from '../types';
import { getStateStore } from '../utils/store';
import { getAdditionalAccounts, getTokenIDKly } from '../utils';

const AMOUNT_ZERO = BigInt('0');

export const getEscrowTokens = async (db: StateDB): Promise<EscrowSubstoreEntry[]> => {
	const tokenEscrowStore = getStateStore(db, DB_PREFIX_TOKEN_ESCROW_STORE);
	const tokens = (await tokenEscrowStore.iterateWithSchema(
		{
			gte: Buffer.alloc(8, 0),
			lte: Buffer.alloc(8, 255),
		},
		escrowStoreSchema,
	)) as { key: Buffer; value: object }[];
	return tokens
		.map(token => ({
			tokenID: token.key.subarray(4),
			escrowChainID: token.key.subarray(0, 4),
			...token.value,
		}))
		.sort((a, b) => {
			if (!a.escrowChainID.equals(b.escrowChainID)) {
				return a.escrowChainID.compare(b.escrowChainID);
			}
			return a.tokenID.compare(b.tokenID);
		}) as EscrowSubstoreEntry[];
};

export const getTokenAccounts = async (
	db: StateDB,
): Promise<{ userStore: UserSubstore[]; userKeyIndex: KeyIndex }> => {
	const tokenUserStore = getStateStore(db, DB_PREFIX_TOKEN_USER_STORE);
	const accounts = (await tokenUserStore.iterateWithSchema(
		{
			gte: Buffer.alloc(8, 0),
			lte: Buffer.alloc(8, 255),
		},
		userStoreSchema,
	)) as { key: Buffer; value: object }[];
	const userKeyIndex: KeyIndex = {};
	const userStore = accounts.map((account, index) => {
		userKeyIndex[getLisk32AddressFromAddress(account.key.subarray(0, 20), 'kly')] = index;
		return {
			address: account.key.subarray(0, 20),
			...account.value,
			tokenID: account.key.subarray(20),
		};
	}) as UserSubstore[];
	return {
		userStore,
		userKeyIndex,
	};
};

export const getTokenModuleEntry = async (
	userSubstore: UserSubstoreEntry[],
	supplySubstore: SupplySubstoreEntry[],
	escrowSubstore: EscrowSubstoreEntry[],
	supportedTokensSubstore: SupportedTokensSubstoreEntry[],
): Promise<GenesisAssetEntry> => {
	const tokenObj: TokenStoreEntry = {
		userSubstore,
		supplySubstore,
		escrowSubstore,
		supportedTokensSubstore,
	};
	return {
		module: MODULE_NAME_TOKEN,
		data: (tokenObj as unknown) as Record<string, unknown>,
		schema: tokenGenesisStoreSchema,
	};
};

export const sortUsersSubstore = (
	users: UserSubstore[],
): {
	sortedUserSubstore: UserSubstoreEntry[];
	totalSupply: bigint;
} => {
	let totalSupply = AMOUNT_ZERO;
	const additionalAccounts = getAdditionalAccounts();
	additionalAccounts.forEach(({ address, balance }) => {
		users.push({
			address,
			tokenID: Buffer.from(getTokenIDKly(), 'hex'),
			availableBalance: balance,
			lockedBalances: [],
		});
	});

	// Sort user substore entries in lexicographical order
	const sortedUserSubstore: UserSubstoreEntry[] = users
		.sort((a: UserSubstore, b: UserSubstore) =>
			a.address.equals(b.address) ? a.tokenID.compare(b.tokenID) : a.address.compare(b.address),
		)
		.map(({ address: addr, ...entry }) => {
			totalSupply += entry.availableBalance;
			totalSupply += entry.lockedBalances.reduce(
				(accumulator: bigint, lockedBalance: { amount: bigint }) =>
					accumulator + BigInt(lockedBalance.amount),
				AMOUNT_ZERO,
			);
			return {
				...entry,
				address: getLisk32AddressFromAddress(addr, 'kly'),
				tokenID: entry.tokenID.toString('hex'),
				availableBalance: entry.availableBalance.toString(),
				lockedBalances: entry.lockedBalances.map(({ module, amount }) => ({
					module,
					amount: amount.toString(),
				})),
			};
		});

	return {
		sortedUserSubstore,
		totalSupply,
	};
};
