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
import * as utils from '@klayr/utils';
import { SupplySubstoreEntry } from '../../../src/types';

import { getEscrowTokens, getTokenModuleEntry } from '../../../src/assets/token';
import { MODULE_NAME_TOKEN, NETWORK_CONSTANT } from '../../../src/constants';
import { processRewards } from '../../../src/assets/pos';
import { setTokenIDSwxByNetID } from '../../../src/utils';

jest.setTimeout(20000);

describe('Build assets/token', () => {
	const db = new StateDB('test/unit/fixtures/data/state.db', { readonly: true });
	const blockchainDB = new Database('test/unit/fixtures/data/blockchain.db', { readonly: true });
	it('should create token module asset', async () => {
		setTokenIDSwxByNetID('01555555');

		const networkConstant = utils.objects.cloneDeep(NETWORK_CONSTANT['01555555']);
		networkConstant.tokenID = '0100000000000000';

		const { sortedUserSubstore, sortedTotalSupplySubstore } = await processRewards(
			db,
			blockchainDB,
			networkConstant,
		);

		const escrowSubstore = await getEscrowTokens(db);

		const supplySubstoreEntries: SupplySubstoreEntry[] = sortedTotalSupplySubstore;

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
