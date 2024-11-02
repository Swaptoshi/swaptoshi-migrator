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
import { resolve } from 'path';
import { Command } from '@oclif/command';
import { APIClient } from '@liskhq/lisk-api-client';
import { BlockHeader } from '@liskhq/lisk-chain';
import { write } from './utils/fs';
import { EVENT_NEW_BLOCK, FILE_NAME } from './constants';
import { ForgingStatus } from './types';

export const captureForgingStatusAtSnapshotHeight = (
	_this: Command,
	client: APIClient,
	snapshotHeight: number,
	outputDir: string,
) => {
	client.subscribe(EVENT_NEW_BLOCK, async data => {
		const { blockHeader } = (data as unknown) as { blockHeader: BlockHeader };
		if (blockHeader.height === snapshotHeight) {
			const { status }: { status: ForgingStatus[] } = await client.invoke('generator_getStatus');
			if (status.length) {
				const klayrStatus = status.map(s => ({
					...s,
					address: `kly${s.address.slice(3)}`,
				}));
				try {
					const forgingStatusJsonFilepath = resolve(outputDir, FILE_NAME.FORGING_STATUS);
					await write(forgingStatusJsonFilepath, JSON.stringify(klayrStatus, null, '\t'));
					_this.log(`\nFinished exporting forging status to ${forgingStatusJsonFilepath}.`);
				} catch (error) {
					_this.log(
						`\nUnable to save the node Forging Status information to the disk, please find it below instead:\n${JSON.stringify(
							klayrStatus,
							null,
							2,
						)}`,
					);
				}
			}
		}
	});
};
