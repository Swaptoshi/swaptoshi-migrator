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
import {
	getDexModuleEntry,
	getObservationSubstore,
	getPoolSubstore,
	getPositionInfoSubstore,
	getPositionManagerSubstore,
	getSupportedTokenSubstore,
	getTickBitmapSubstore,
	getTickInfoSubstore,
	getTokenSymbolSubstore,
} from './assets/dex';
import {
	getAirdropSubstore,
	getFactorySubstore,
	getICOSubstore,
	getNextAvailableTokenIdSubstore,
	getTokenFactoryModuleEntry,
	getVestingUnlockSubstore,
} from './assets/tokenFactory';
import {
	getBoostedAccountSubstore,
	getCastedVoteSubstore,
	getDelegatedVoteSubstore,
	getGovernableConfigSubstore,
	getGovernanceModuleEntry,
	getNextAvailableProposalIdSubstore,
	getProposalQueueSubstore,
	getProposalSubstore,
	getProposalVoterSubstore,
	getVoteScoreSubstore,
} from './assets/governance';
import {
	DB_PREFIX_DEX_GOVERNABLE_CONFIG_STORE,
	DB_PREFIX_FEE_CONVERSION_GOVERNABLE_CONFIG_STORE,
	DB_PREFIX_GOVERNANCE_GOVERNABLE_CONFIG_STORE,
	DB_PREFIX_LIQUID_POS_GOVERNABLE_CONFIG_STORE,
	DB_PREFIX_TOKEN_FACTORY_GOVERNABLE_CONFIG_STORE,
} from './constants';
import { getFeeConversionModuleEntry } from './assets/feeConversion';
import { getLiquidPosModuleEntry } from './assets/liquidPos';
import { getNFTModuleEntry, getNFTSubstore, getSupportedNFTsSubstore } from './assets/nft';

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
		const observationSubstore = await getObservationSubstore(this._db);
		const poolSubstore = await getPoolSubstore(this._db);
		const positionInfoSubstore = await getPositionInfoSubstore(this._db);
		const positionManagerSubstore = await getPositionManagerSubstore(this._db);
		const supportedTokenSubstore = await getSupportedTokenSubstore(this._db);
		const tickBitmapSubstore = await getTickBitmapSubstore(this._db);
		const tickInfoSubstore = await getTickInfoSubstore(this._db);
		const tokenSymbolSubstore = await getTokenSymbolSubstore(this._db);
		const dexConfigSubstore = await getGovernableConfigSubstore(
			this._db,
			DB_PREFIX_DEX_GOVERNABLE_CONFIG_STORE,
		);
		const dexModuleAssets = await getDexModuleEntry(
			observationSubstore,
			poolSubstore,
			positionInfoSubstore,
			positionManagerSubstore,
			supportedTokenSubstore,
			tickBitmapSubstore,
			tickInfoSubstore,
			tokenSymbolSubstore,
			dexConfigSubstore,
		);

		// create tokenFactory module assets
		const airdropSubstore = await getAirdropSubstore(this._db);
		const factorySubstore = await getFactorySubstore(this._db);
		const icoSubstore = await getICOSubstore(this._db);
		const nextAvailableTokenIdSubstore = await getNextAvailableTokenIdSubstore(this._db);
		const vestingUnlockSubstore = await getVestingUnlockSubstore(this._db);
		const tokenFactoryConfigSubstore = await getGovernableConfigSubstore(
			this._db,
			DB_PREFIX_TOKEN_FACTORY_GOVERNABLE_CONFIG_STORE,
		);
		const tokenFactoryModuleAssets = await getTokenFactoryModuleEntry(
			airdropSubstore,
			factorySubstore,
			icoSubstore,
			nextAvailableTokenIdSubstore,
			vestingUnlockSubstore,
			tokenFactoryConfigSubstore,
		);

		// create fee conversion module assets
		const feeConversionConfigSubstore = await getGovernableConfigSubstore(
			this._db,
			DB_PREFIX_FEE_CONVERSION_GOVERNABLE_CONFIG_STORE,
		);
		const feeConversionModuleAssets = await getFeeConversionModuleEntry(
			feeConversionConfigSubstore,
		);

		// create liquid pos module assets
		const liquidPosConfigSubstore = await getGovernableConfigSubstore(
			this._db,
			DB_PREFIX_LIQUID_POS_GOVERNABLE_CONFIG_STORE,
		);
		const liquidPosModuleAssets = await getLiquidPosModuleEntry(liquidPosConfigSubstore);

		// create governance module assets
		const boostedAccountSubstore = await getBoostedAccountSubstore(this._db);
		const castedVoteSubstore = await getCastedVoteSubstore(this._db);
		const delegatedVoteSubstore = await getDelegatedVoteSubstore(this._db);
		const nextAvailableProposalIdSubstore = await getNextAvailableProposalIdSubstore(this._db);
		const proposalVoterSubstore = await getProposalVoterSubstore(this._db);
		const proposalSubstore = await getProposalSubstore(this._db);
		const queueSubstore = await getProposalQueueSubstore(this._db);
		const voteScoreSubstore = await getVoteScoreSubstore(this._db);
		const governanceConfigSubstore = await getGovernableConfigSubstore(
			this._db,
			DB_PREFIX_GOVERNANCE_GOVERNABLE_CONFIG_STORE,
		);
		const governanceModuleAssets = await getGovernanceModuleEntry(
			boostedAccountSubstore,
			castedVoteSubstore,
			delegatedVoteSubstore,
			nextAvailableProposalIdSubstore,
			proposalVoterSubstore,
			proposalSubstore,
			queueSubstore,
			voteScoreSubstore,
			governanceConfigSubstore,
		);

		// create nft module assets
		const nftSubstore = await getNFTSubstore(this._db);
		const supportedNFTsSubstore = await getSupportedNFTsSubstore(this._db);
		const nftModuleSubstore = await getNFTModuleEntry(nftSubstore, supportedNFTsSubstore);

		return updateConfigSubstore(
			[
				dexModuleAssets,
				tokenFactoryModuleAssets,
				feeConversionModuleAssets,
				liquidPosModuleAssets,
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
