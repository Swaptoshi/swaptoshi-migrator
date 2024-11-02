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
import { resolve } from 'path';
import { NETWORK_CONSTANT } from '../../../src/constants';
import { NetworkConfigLocal } from '../../../src/types';

const clientFilePath = resolve(`${__dirname}/../../../src/client`);

afterEach(() => {
	jest.clearAllMocks();
	jest.resetModules();
});

describe('Test getNetworkIdentifier method', () => {
	const network = 'mainnet';
	const mainnetChainID = (Object.entries(NETWORK_CONSTANT).find(([, v]) => v.name === network) as [
		string,
		NetworkConfigLocal,
	])[0];

	it('should return chainID when use-snapshot is true', async () => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
		const { getChainId } = require('../../../src/utils/network');
		const chainID = await getChainId(network, './lisk/lisk-core');
		expect(chainID).toBe(mainnetChainID);
	});

	it('should return chainID when use-snapshot is false', async () => {
		jest.setTimeout(20_000);
		jest.mock(clientFilePath, () => ({
			getAPIClient: jest.fn().mockResolvedValueOnce({
				node: {
					getNodeInfo: jest.fn().mockReturnValue({ chainID: mainnetChainID }),
				},
			}),
		}));

		// eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
		const { getChainId } = require('../../../src/utils/network');
		const chainID = await getChainId(null, './lisk/lisk-core');
		expect(chainID).toBe(mainnetChainID);
	});
});
