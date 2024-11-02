/*
 * Copyright © 2024 Klayr Holding
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
import { codec } from '@liskhq/lisk-codec';
import { Database } from '@liskhq/lisk-db';
import { BlockHeaderAttrs, blockHeaderSchema } from '@liskhq/lisk-chain';

import { uint32BE } from '@liskhq/lisk-chain/dist-node/utils';

export const getBlockHeaderByHeight = async (
	db: Database,
	height: number,
): Promise<BlockHeaderAttrs> => {
	const bufferHeight = uint32BE(height);
	const id = await db.get(Buffer.concat([Buffer.from([4]), bufferHeight]));
	const blockHeaderBuffer = await db.get(Buffer.concat([Buffer.from([3]), id]));
	const blockHeader = codec.decode<BlockHeaderAttrs>(blockHeaderSchema, blockHeaderBuffer);

	return { ...blockHeader, id };
};
