/*
 * Copyright © 2024 Klayr Holding
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
import { getLisk32AddressFromAddress } from '@liskhq/lisk-cryptography/dist-node/address';
import {
	GenesisAssetEntry,
	SupplySubstoreEntry,
	AuthStoreEntry,
	SupportedTokensSubstoreEntry,
	GenesisDataEntry,
} from './types';

import { getInteropModuleEntry } from './assets/interoperability';
import { getAuthAccounts, getAuthModuleEntry, getAuthModuleEntryBuffer } from './assets/auth';
import { getEscrowTokens, getTokenModuleEntry } from './assets/token';
import { getLegacyAccounts, getLegacyModuleEntry } from './assets/legacy';
import {
	createGenesisDataObj,
	getPoSModuleEntry,
	getSnapshots,
	processRewards,
} from './assets/pos';
import { getPrevSnapshotBlockHeight } from './utils';

const AMOUNT_ZERO = BigInt('0');

export class CreateAsset {
	private readonly _db: StateDB;
	private readonly _blockchainDB: Database;

	public constructor(db: StateDB, blockchainDB: Database) {
		this._db = db;
		this._blockchainDB = blockchainDB;
	}

	public init = async (snapshotHeight: number, tokenID: string): Promise<GenesisAssetEntry[]> => {
		const supportedTokensSubstoreEntries: SupportedTokensSubstoreEntry[] = [];

		// Create legacy module assets
		const legacyAddresses = await getLegacyAccounts(this._db);
		const legacyModuleAssets = await getLegacyModuleEntry(legacyAddresses);

		// Create auth module assets
		const allAccounts = await getAuthAccounts(this._db);
		const authSubstoreEntries = allAccounts.map(getAuthModuleEntryBuffer);
		const sortedAuthSubstoreEntries: AuthStoreEntry[] = authSubstoreEntries
			.sort((a, b) => a.address.compare(b.address))
			.map(entry => ({
				...entry,
				address: getLisk32AddressFromAddress(entry.address, 'kly'),
			}));
		const authModuleAssets = await getAuthModuleEntry(sortedAuthSubstoreEntries);
		// Process tokens rewards and get assets
		const {
			sortedUserSubstore,
			sortedClaimedStakers,
			totalSupply,
			validatorKeys,
		} = await processRewards(this._db, this._blockchainDB);

		// Get escrow tokens
		const escrowSubstore = await getEscrowTokens(this._db);
		const totalEscrow = escrowSubstore.reduce(
			(accumulator: bigint, escrow: { amount: bigint }) => accumulator + BigInt(escrow.amount),
			AMOUNT_ZERO,
		);

		// Create supply assets
		const supplySubstoreEntries: SupplySubstoreEntry[] = [
			{
				tokenID,
				totalSupply: String(totalSupply + totalEscrow),
			},
		];

		// Create genesis data assets
		const decodedDelegatesVoteWeights = await getSnapshots(this._db);
		const genesisData: GenesisDataEntry = await createGenesisDataObj(
			validatorKeys,
			decodedDelegatesVoteWeights,
			snapshotHeight - getPrevSnapshotBlockHeight(),
		);

		// Create token module assets
		const tokenModuleAssets = await getTokenModuleEntry(
			sortedUserSubstore, // done
			supplySubstoreEntries, // done?
			escrowSubstore, // done
			supportedTokensSubstoreEntries, // done
		);

		// Create PoS module assets
		const posModuleAssets = await getPoSModuleEntry(
			validatorKeys,
			sortedClaimedStakers,
			genesisData,
		);

		// Create interoperability module assets
		const interoperabilityModuleAssets = await getInteropModuleEntry(this._db);

		return [
			legacyModuleAssets,
			authModuleAssets,
			tokenModuleAssets,
			posModuleAssets,
			interoperabilityModuleAssets,
		].sort((a, b) => a.module.localeCompare(b.module, 'en')) as GenesisAssetEntry[];
	};
}
