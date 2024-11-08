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
import { MODULE_NAME_TOKEN } from 'klayr-framework/dist-node/modules/interoperability/cc_methods';
import { MODULE_NAME_POS } from 'klayr-framework/dist-node/modules/pos/constants';
import { MODULE_NAME_INTEROPERABILITY } from 'klayr-framework';
import { CreateAsset } from '../../src/createAsset';
import {
	setAdditionalAccountsByChainID,
	setPrevSnapshotBlockHeightByNetID,
	setTokenIDSwxByNetID,
} from '../../src/utils';
import {
	MODULE_NAME_AUTH,
	MODULE_NAME_DEX,
	MODULE_NAME_GOVERNANCE,
	MODULE_NAME_NFT,
	MODULE_NAME_TOKEN_FACTORY,
	NETWORK_CONSTANT,
} from '../../src/constants';
import { GenesisAssetEntry } from '../../src/types';

jest.setTimeout(20000);

describe('Build assets/legacy', () => {
	describe('createAsset', () => {
		it('should create assets', async () => {
			const networkConstant = utils.objects.cloneDeep(NETWORK_CONSTANT['01555555']);
			networkConstant.tokenID = '0100000000000000';

			setTokenIDSwxByNetID('01555555');
			setPrevSnapshotBlockHeightByNetID('01555555');
			setAdditionalAccountsByChainID('01555555');
			const db = new StateDB('test/unit/fixtures/data/state.db', { readonly: true });
			const blockchainDB = new Database('test/unit/fixtures/data/blockchain.db', {
				readonly: true,
			});
			const createAsset = new CreateAsset(db, blockchainDB);
			const response = await createAsset.init(605684, networkConstant);

			const moduleList = [
				MODULE_NAME_AUTH,
				MODULE_NAME_TOKEN,
				MODULE_NAME_POS,
				MODULE_NAME_INTEROPERABILITY,
				MODULE_NAME_DEX,
				MODULE_NAME_TOKEN_FACTORY,
				MODULE_NAME_GOVERNANCE,
				MODULE_NAME_NFT,
			];
			// Assert
			expect(response).toHaveLength(moduleList.length);

			response.forEach((asset: GenesisAssetEntry) => expect(moduleList).toContain(asset.module));
		});
	});
});
