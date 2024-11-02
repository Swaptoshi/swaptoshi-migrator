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

import { Database, StateDB } from '@liskhq/lisk-db';
import { SupplySubstoreEntry } from '../../../src/types';

import { getEscrowTokens, getTokenModuleEntry } from '../../../src/assets/token';
import { MODULE_NAME_TOKEN } from '../../../src/constants';
import { processRewards } from '../../../src/assets/pos';

describe('Build assets/token', () => {
	const db = new StateDB('test/unit/fixtures/data/state.db', { readonly: true });
	const blockchainDB = new Database('test/unit/fixtures/data/blockchain.db', { readonly: true });
	it('should create token module asset', async () => {
		const { sortedUserSubstore, totalSupply } = await processRewards(db, blockchainDB);

		const escrowSubstore = await getEscrowTokens(db);
		const AMOUNT_ZERO = BigInt('0');
		const totalEscrow = escrowSubstore.reduce(
			(accumulator: bigint, escrow: { amount: bigint }) => accumulator + BigInt(escrow.amount),
			AMOUNT_ZERO,
		);

		const supplySubstoreEntries: SupplySubstoreEntry[] = [
			{
				tokenID: '01000000000000',
				totalSupply: String(totalSupply + totalEscrow),
			},
		];

		const response = await getTokenModuleEntry(
			sortedUserSubstore,
			supplySubstoreEntries,
			escrowSubstore,
			[],
		);

		// Assert
		expect(response.module).toEqual(MODULE_NAME_TOKEN);
		expect(Object.getOwnPropertyNames(response.data)).toEqual([
			'userSubstore',
			'supplySubstore',
			'escrowSubstore',
			'supportedTokensSubstore',
		]);
	});
});
