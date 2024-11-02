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
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { resolve } from 'path';
import Command from '@oclif/command';

import { read, write, exists } from './fs';
import { FILE_NAME } from '../constants';
import { NetworkConfigLocal } from '../types';

export const getCommandsToExecPostMigration = async (
	_networkConstant: NetworkConfigLocal,
	snapshotHeight: number,
	outputDir: string,
) => {
	const commandsToExecute = [];

	const forgingStatusJsonFilepath = resolve(outputDir, FILE_NAME.FORGING_STATUS);
	if (await exists(forgingStatusJsonFilepath)) {
		const forgingStatusString = (await read(forgingStatusJsonFilepath)) as string;
		const forgingStatusJson = JSON.parse(forgingStatusString);

		for (const forgingStatus of forgingStatusJson) {
			commandsToExecute.push(
				'\n',
				`## Generate/Register the BLS keys for validator ${forgingStatus.address} - Please modify the command if necessary`,
				'\n',
			);

			commandsToExecute.push(
				'klayr-core keys:import --file-path {path_to/your_keys_file.json}',
				`klayr-core endpoint:invoke random_setHashOnion '{ "address":"${forgingStatus.address}"}'`,
				`klayr-core endpoint:invoke generator_setStatus '{ "address":"${
					forgingStatus.address
				}", "height": ${forgingStatus.height ?? snapshotHeight}, "maxHeightGenerated":  ${
					forgingStatus.maxHeightGenerated ?? snapshotHeight
				}, "maxHeightPrevoted":  ${forgingStatus.maxHeightPrevoted ?? snapshotHeight} }' --pretty`,
				`klayr-core generator:enable ${forgingStatus.address} --use-status-value`,
			);

			commandsToExecute.push('\n', '-----------------------------------------------------', '\n');
		}
	}

	return commandsToExecute;
};

export const writeCommandsToExec = async (
	_this: Command,
	networkConstant: NetworkConfigLocal,
	snapshotHeight: number,
	outputDir: string,
	preCompletionCommands?: string[],
) => {
	const commandsToExecPreCompletion = preCompletionCommands ?? [];
	const commandsToExecPostMigration = await getCommandsToExecPostMigration(
		networkConstant,
		snapshotHeight,
		outputDir,
	);

	const allCommandsToExec = [
		'## Please execute the following commands to finish the migration successfully:',
		'------------------------------------------------------------------------------',
		'\n',
		...commandsToExecPreCompletion,
		...commandsToExecPostMigration,
	].join('\n');

	// Create the document only when there are commands to be executed by the user
	if (commandsToExecPostMigration.length || commandsToExecPreCompletion.length) {
		const commandsToExecuteFilepath = resolve(outputDir, FILE_NAME.COMMANDS_TO_EXEC);

		_this.log(
			commandsToExecPreCompletion.length
				? `Creating file with the list of commands to execute post migration: ${commandsToExecuteFilepath}`
				: `Creating file with the list of commands to execute: ${commandsToExecuteFilepath}`,
		);

		await write(commandsToExecuteFilepath, allCommandsToExec);

		_this.log(
			commandsToExecPreCompletion.length
				? `Successfully created file with the list of commands to execute post migration: ${commandsToExecuteFilepath}`
				: `Successfully created file with the list of commands to execute: ${commandsToExecuteFilepath}`,
		);
	}
};
