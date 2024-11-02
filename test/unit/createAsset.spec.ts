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
import { MODULE_NAME_TOKEN } from 'lisk-framework/dist-node/modules/interoperability/cc_methods';
import { MODULE_NAME_POS } from 'lisk-framework/dist-node/modules/pos/constants';
import { MODULE_NAME_INTEROPERABILITY } from 'klayr-framework';
import { CreateAsset } from '../../src/createAsset';
import {
	setAdditionalAccountsByChainID,
	setPrevSnapshotBlockHeightByNetID,
	setTokenIDKlyByNetID,
} from '../../src/utils';
import { MODULE_NAME_AUTH, MODULE_NAME_LEGACY } from '../../src/constants';
import { GenesisAssetEntry } from '../../src/types';

jest.setTimeout(20000);

describe('Build assets/legacy', () => {
	describe('createAsset', () => {
		it('should create assets', async () => {
			setTokenIDKlyByNetID('01000000');
			setPrevSnapshotBlockHeightByNetID('01000000');
			setAdditionalAccountsByChainID('01000000');
			const db = new StateDB('test/unit/fixtures/data/state.db', { readonly: true });
			const blockchainDB = new Database('test/unit/fixtures/data/blockchain.db', {
				readonly: true,
			});
			const createAsset = new CreateAsset(db, blockchainDB);
			const response = await createAsset.init(21626292, '01000000');

			const moduleList = [
				MODULE_NAME_LEGACY,
				MODULE_NAME_AUTH,
				MODULE_NAME_TOKEN,
				MODULE_NAME_POS,
				MODULE_NAME_INTEROPERABILITY,
			];
			// Assert
			expect(response).toHaveLength(moduleList.length);

			response.forEach((asset: GenesisAssetEntry) => expect(moduleList).toContain(asset.module));
		});
	});
});
