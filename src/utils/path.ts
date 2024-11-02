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
import { homedir } from 'os';
import { isAbsolute, join } from 'path';
import { BACKUP_DIR, DEFAULT_SWAPTOSHI_CORE_PATH } from '../constants';
// import { getFiles } from './fs';

export const resolveAbsolutePath = (path: string) => {
	if (isAbsolute(path)) {
		return path;
	}

	if (path.startsWith('~')) {
		return path.replace('~', homedir());
	}

	return join(process.cwd(), path);
};

export const verifyOutputPath = (_outputPath: string): void | Error => {
	const absSwaptoshiCorePath = resolveAbsolutePath(DEFAULT_SWAPTOSHI_CORE_PATH);
	const absOutputPath = resolveAbsolutePath(_outputPath);

	if (absOutputPath.startsWith(absSwaptoshiCorePath)) {
		throw new Error(
			`Output path '${_outputPath}' is not allowed. Please restart the migrator with a different output path.`,
		);
	}
};

export const resolveSnapshotPath = async (
	useSnapshot: boolean,
	snapshotPath: string,
	dataDir: string,
	swaptoshiCoreDataPath: string,
) => {
	if (!useSnapshot) return join(swaptoshiCoreDataPath, BACKUP_DIR);
	if (snapshotPath && !snapshotPath.endsWith('.tar.gz')) return snapshotPath;

	return dataDir;

	// const [snapshotDirNameExtracted] = (await getFiles(dataDir)) as string[];
	// return join(dataDir, snapshotDirNameExtracted);
};
