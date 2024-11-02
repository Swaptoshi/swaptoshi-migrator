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
 *
 */
import { Database } from '@liskhq/lisk-db';
import { when } from 'jest-when';
import { uint32BE } from '@liskhq/lisk-chain/dist-node/utils';
import { getBlockHeaderByHeight } from '../../../src/utils/block';

jest.mock('@liskhq/lisk-db');

describe('Test getBlockHeaderByHeight method', () => {
	const db = new Database('fake.db');
	let blockHeaderBuffer: Buffer;
	const blockHeight = 21626291;
	const blockID = Buffer.from(
		'8bfa790bca5bcca9a4db8048bdf9c208ea62e4f3d538db771774957424fe52f6',
		'hex',
	);

	beforeAll(async () => {
		blockHeaderBuffer = Buffer.from(
			'0802108e96cbaf0618b4fba70a222010502579158829c873156c4d10ec448acd057f2434b72b8f47ea1d0b5d99a1502a144f1586d7d63755d0234f9981e2c9b179b03b36bc3220e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8553a2059f310cf3c5bafc4dd4abb94484606de52cf5d0374dbff1e22ff2630c6aa77eb422086d5dc2fa3d1a091edd053a1eab677d46bcfc0d2d887ae9fa0c85a9cab8b3fb44a202c95844eed87a4c548dfea0e560fd65ac4808d082af2e6d09b13851a8ea1bea950fcfaa70a58d1faa70a60016a207862e2fe268bacc0dc548c89b8b74eced8f6507dc906b7e877013d046fdb8287720908b6faa70a12001a007a40fb0f25a6f2898ea05e74bc0fcecf4c5edcae1dee99e42310f572765a93dd656a4b0232af991966b0436788b284aea5f92c97fd6f482d8c039a66e3267e9f640f',
			'hex',
		);
	});

	it('should return block header when called with valid height', async () => {
		const bufferHeight = uint32BE(blockHeight);

		when(db.get)
			.calledWith(Buffer.concat([Buffer.from([4]), bufferHeight]))
			.mockResolvedValue(blockID as never);
		when(db.get)
			.calledWith(Buffer.concat([Buffer.from([3]), blockID]))
			.mockResolvedValue(blockHeaderBuffer as never);

		const block = await getBlockHeaderByHeight(db, blockHeight);
		expect(Object.getOwnPropertyNames(block)).toEqual([
			'version',
			'timestamp',
			'height',
			'previousBlockID',
			'generatorAddress',
			'transactionRoot',
			'assetRoot',
			'eventRoot',
			'stateRoot',
			'maxHeightPrevoted',
			'maxHeightGenerated',
			'impliesMaxPrevotes',
			'validatorsHash',
			'aggregateCommit',
			'signature',
			'id',
		]);
	});
});
