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
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import { Database, StateDB } from '@liskhq/lisk-db';
import { MODULE_NAME_POS } from 'lisk-framework/dist-node/modules/pos/constants';
import {
	createGenesisDataObj,
	getPoSModuleEntry,
	getSnapshots,
	processRewards,
} from '../../../src/assets/pos';
import { GenesisDataEntry } from '../../../src/types';
import {
	getPrevSnapshotBlockHeight,
	setAdditionalAccountsByChainID,
	setPrevSnapshotBlockHeightByNetID,
	setTokenIDKlyByNetID,
} from '../../../src/utils';

describe('Build assets/pos', () => {
	it('should create createPoSModuleEntry', async () => {
		const db = new StateDB('test/unit/fixtures/data/state.db', { readonly: true });
		const blockchainDB = new Database('test/unit/fixtures/data/blockchain.db', { readonly: true });
		setTokenIDKlyByNetID('01000000');
		setPrevSnapshotBlockHeightByNetID('01000000');
		setAdditionalAccountsByChainID('01000000');
		const { sortedClaimedStakers, validatorKeys } = await processRewards(db, blockchainDB);
		const decodedDelegatesVoteWeights = await getSnapshots(db);
		const genesisData: GenesisDataEntry = await createGenesisDataObj(
			validatorKeys,
			decodedDelegatesVoteWeights,
			21626292 - getPrevSnapshotBlockHeight(),
		);
		const posModuleAssets = await getPoSModuleEntry(
			validatorKeys,
			sortedClaimedStakers,
			genesisData,
		);
		expect(posModuleAssets.module).toEqual(MODULE_NAME_POS);
		expect(Object.getOwnPropertyNames(posModuleAssets.data)).toEqual([
			'validators',
			'stakers',
			'genesisData',
		]);
		expect(posModuleAssets.schema).toBeDefined();
	});
});
