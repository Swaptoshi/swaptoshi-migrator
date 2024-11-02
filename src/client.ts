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
import { createIPCClient, APIClient } from '@klayr/api-client';

const clientCache: Record<string, APIClient> = {};

export const getAPIClient = async (
	swaptoshiCorePath: string,
	isForceInstantiate?: boolean,
): Promise<APIClient> => {
	let _client = clientCache[swaptoshiCorePath];

	if (!_client || isForceInstantiate) {
		_client = await createIPCClient(swaptoshiCorePath);
		clientCache[swaptoshiCorePath] = _client;
	}

	return _client;
};
