/*
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
import { StateDB } from '@liskhq/lisk-db';
import { MODULE_NAME_INTEROPERABILITY } from 'klayr-framework';
import { getInteropModuleEntry } from '../../../src/assets/interoperability';
import { GenesisAssetEntry } from '../../../src/types';
import { KLAYR_CHAIN_NAME_MAINCHAIN } from '../../../src/constants';

describe('Build assets/interoperability', () => {
	it('should create interoperability module asset', async () => {
		const db = new StateDB('test/unit/fixtures/data/state.db', { readonly: true });
		const response: GenesisAssetEntry = await getInteropModuleEntry(db);
		expect(response.module).toEqual(MODULE_NAME_INTEROPERABILITY);
		expect(Object.getOwnPropertyNames(response.data)).toEqual([
			'ownChainName',
			'ownChainNonce',
			'chainInfos',
			'terminatedStateAccounts',
			'terminatedOutboxAccounts',
		]);
		expect(response.data.ownChainName).toBe(KLAYR_CHAIN_NAME_MAINCHAIN);
		expect(response.data.ownChainNonce).toBe(BigInt('61'));
	});
});
