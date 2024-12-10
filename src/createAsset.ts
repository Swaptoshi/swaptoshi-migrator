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
import { Snapshot } from 'swaptoshi-sdk';
import { getKlayr32AddressFromAddress } from '@klayr/cryptography/dist-node/address';
import {
	GenesisAssetEntry,
	SupplySubstoreEntry,
	AuthStoreEntry,
	SupportedTokensSubstoreEntry,
	GenesisDataEntry,
	EscrowSubstoreEntry,
	NetworkConfigLocal,
} from './types';

import { getInteropModuleEntry } from './assets/interoperability';
import { getAuthAccounts, getAuthModuleEntry, getAuthModuleEntryBuffer } from './assets/auth';
import { getEscrowTokens, getTokenModuleEntry } from './assets/token';
import {
	createGenesisDataObj,
	getPoSModuleEntry,
	getSnapshots,
	processRewards,
} from './assets/pos';
import { getPrevSnapshotBlockHeight, updateConfigSubstore } from './utils';

const AMOUNT_ZERO = BigInt('0');

export class CreateAsset {
	private readonly _db: StateDB;
	private readonly _blockchainDB: Database;

	public constructor(db: StateDB, blockchainDB: Database) {
		this._db = db;
		this._blockchainDB = blockchainDB;
	}

	public init = async (
		snapshotHeight: number,
		networkConstant: NetworkConfigLocal,
	): Promise<GenesisAssetEntry[]> => {
		const supportedTokensSubstoreEntries: SupportedTokensSubstoreEntry[] = [];

		// Create auth module assets
		const allAccounts = await getAuthAccounts(this._db);
		const authSubstoreEntries = allAccounts.map(getAuthModuleEntryBuffer);
		const sortedAuthSubstoreEntries: AuthStoreEntry[] = authSubstoreEntries
			.sort((a, b) => a.address.compare(b.address))
			.map(entry => ({
				...entry,
				address: getKlayr32AddressFromAddress(entry.address),
			}));
		const authModuleAssets = await getAuthModuleEntry(sortedAuthSubstoreEntries);
		// Process tokens rewards and get assets
		const {
			sortedUserSubstore,
			sortedClaimedStakers,
			sortedTotalSupplySubstore,
			validatorKeys,
		} = await processRewards(this._db, this._blockchainDB, networkConstant);

		// Get escrow tokens
		const escrowSubstore = await getEscrowTokens(this._db);

		// Create supply assets
		const supplySubstoreEntries: SupplySubstoreEntry[] = sortedTotalSupplySubstore;

		escrowSubstore.forEach(t => {
			const index = supplySubstoreEntries.findIndex(k => k.tokenID === t.tokenID.toString('hex'));
			if (index !== -1) {
				const totalEscrow = escrowSubstore.reduce(
					(accumulator: bigint, escrow: EscrowSubstoreEntry) => {
						if (t.tokenID.equals(escrow.tokenID)) {
							return accumulator + BigInt(escrow.amount);
						}
						return accumulator;
					},
					AMOUNT_ZERO,
				);

				supplySubstoreEntries[index].totalSupply = String(
					BigInt(supplySubstoreEntries[index].totalSupply) + totalEscrow,
				);
			}
		});

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

		// Create dex module assets
		const dexModuleAssets = await Snapshot.DEX.createDexModuleAsset(this._db);

		// create tokenFactory module assets
		const tokenFactoryModuleAssets = await Snapshot.TokenFactory.createTokenFactoryModuleAsset(
			this._db,
		);

		// create governance module assets
		const governanceModuleAssets = await Snapshot.Governance.createGovernanceModuleAsset(
			this._db,
			networkConstant.additionalConfigRegistry,
		);

		// create nft module assets
		const nftModuleSubstore = await Snapshot.NFT.createNFTModuleAsset(this._db);

		return updateConfigSubstore(
			[
				dexModuleAssets,
				tokenFactoryModuleAssets,
				governanceModuleAssets,
				nftModuleSubstore,
				authModuleAssets,
				tokenModuleAssets,
				posModuleAssets,
				interoperabilityModuleAssets,
			].sort((a, b) => a.module.localeCompare(b.module, 'en')) as GenesisAssetEntry[],
			networkConstant,
		);
	};
}
