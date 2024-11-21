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
import { posGenesisStoreSchema } from 'klayr-framework';
import * as fs from 'fs-extra';
import { Database, StateDB } from '@liskhq/lisk-db';
import { validatorStoreSchema } from 'klayr-framework/dist-node/modules/pos/stores/validator';
import { stakerStoreSchema } from 'klayr-framework/dist-node/modules/pos/stores/staker';
import {
	ValidatorKeys,
	validatorKeysSchema,
} from 'klayr-framework/dist-node/modules/validators/stores/validator_keys';
import { codec } from '@klayr/codec/';
import { Transaction, transactionSchema } from '@klayr/chain';
import {
	getAddressFromPublicKey,
	getKlayr32AddressFromAddress,
} from '@klayr/cryptography/dist-node/address';
import { snapshotStoreSchema } from 'klayr-framework/dist-node/modules/pos/stores/snapshot';
import { calculateStakeRewards } from 'klayr-framework/dist-node/modules/pos/utils';
import { validatorRegistrationCommandParamsSchema } from 'klayr-framework/dist-node/modules/pos/schemas';
import { registerKeysParamsSchema } from '../schemas';
import { getStateStore } from '../utils/store';
import {
	GenesisDataEntry,
	DelegateWeight,
	ValidatorEntryBuffer,
	StakerBuffer,
	ValidatorEntry,
	Staker,
	GenesisAssetEntry,
	PoSStoreEntry,
	BLSTransaction,
	NetworkConfigLocal,
} from '../types';
import {
	DUMMY_PROOF_OF_POSSESSION,
	POS_INIT_ROUNDS,
	ROUND_LENGTH,
	Q96_ZERO,
	MODULE_NAME_POS,
	DB_PREFIX_POS_VALIDATOR_STORE,
	DB_PREFIX_POS_STAKER_STORE,
	DB_PREFIX_VALIDATORS_KEYS_STORE,
	DB_PREFIX_POS_SNAPSHOT_STORE,
	NUMBER_ACTIVE_VALIDATORS_AFTER,
} from '../constants';
import { getTokenAccounts, sortUsersSubstore } from './token';
import { resolveBaseGenesisAssetsDefaultPath } from '../utils';

const AMOUNT_ZERO = BigInt('0');

const ceiling = (a: number, b: number) => {
	if (b === 0) throw new Error('Can not divide by 0.');
	return Math.floor((a + b - 1) / b);
};

export const getSnapshots = async (
	db: StateDB,
): Promise<{ round: number; snapshot: DelegateWeight[] }[]> => {
	const snapshotStore = getStateStore(db, DB_PREFIX_POS_SNAPSHOT_STORE);
	const snapshots = await snapshotStore.iterateWithSchema<{
		validatorWeightSnapshot: never;
	}>(
		{
			gte: Buffer.alloc(8, 0),
			lte: Buffer.alloc(8, 255),
		},
		snapshotStoreSchema,
	);
	return snapshots.map(snapshot => ({
		round: snapshot.key.readUInt32BE(0),
		snapshot: snapshot.value.validatorWeightSnapshot,
	}));
};

export const getBLSKey = async (db: StateDB, key: Buffer): Promise<ValidatorKeys> => {
	const blsStore = getStateStore(db, DB_PREFIX_VALIDATORS_KEYS_STORE);
	return blsStore.getWithSchema(key, validatorKeysSchema);
};

export const getBLSTransactions = async (db: Database) => {
	const stream = await db.createReadStream({
		gte: Buffer.concat([Buffer.from([6]), Buffer.alloc(64, 0)]),
		lte: Buffer.concat([Buffer.from([6]), Buffer.alloc(64, 255)]),
	});
	return new Promise<BLSTransaction[]>((resolve, reject) => {
		const kv: BLSTransaction[] = [];
		stream
			.on('data', ({ value }: { key: Buffer; value: Buffer }) => {
				const transaction = codec.decode(transactionSchema, value) as Transaction;
				if (transaction.module === 'pos' && transaction.command === 'registerValidator') {
					const params = codec.decode<BLSTransaction['params']>(
						validatorRegistrationCommandParamsSchema,
						transaction.params,
					);
					kv.push({
						senderAddress: getAddressFromPublicKey(transaction.senderPublicKey),
						params,
					});
				}
				if (transaction.module === 'legacy' && transaction.command === 'registerKeys') {
					const params = codec.decode<BLSTransaction['params']>(
						registerKeysParamsSchema,
						transaction.params,
					);
					kv.push({
						senderAddress: getAddressFromPublicKey(transaction.senderPublicKey),
						params,
					});
				}
			})
			.on('error', error => {
				reject(error);
			})
			.on('end', () => {
				resolve(kv);
			});
	});
};

export const getValidatorKeys = async (
	db: StateDB,
	blockchainDB: Database,
	networkConstant: NetworkConfigLocal,
): Promise<{ validatorKeys: ValidatorEntry[]; validatorIndex: Record<string, number> }> => {
	const posValidatorStore = getStateStore(db, DB_PREFIX_POS_VALIDATOR_STORE);
	const validators = (await posValidatorStore.iterateWithSchema(
		{
			gte: Buffer.alloc(21, 0),
			lte: Buffer.alloc(21, 255),
		},
		validatorStoreSchema,
	)) as { key: Buffer; value: ValidatorEntryBuffer }[];

	const defaultGenesisAssetsFilePath = await resolveBaseGenesisAssetsDefaultPath(
		networkConstant.name,
	);
	const defaultGenesisAssets = await fs.readJSON(defaultGenesisAssetsFilePath);
	const defaultPosGenesisAssets = defaultGenesisAssets.assets.find(
		(t: { module: string }) => t.module === 'pos',
	);
	if (!defaultGenesisAssets) {
		throw new Error(
			`genesis_assets.json in ${defaultGenesisAssetsFilePath} doens't include "pos" module. This is used to regenesis genesis validator's proofOfPossession`,
		);
	}
	const genesisValidators = defaultPosGenesisAssets.data.validators;

	const proofOfPossessions = await getBLSTransactions(blockchainDB);
	const validatorIndex: Record<string, number> = {};
	const validatorKeys: ValidatorEntry[] = await Promise.all(
		validators.map(async ({ key, value }, index) => {
			const bls = await getBLSKey(db, key);
			const address = getKlayr32AddressFromAddress(key);
			validatorIndex[address] = index;

			// eslint-disable-next-line no-nested-ternary
			const proofOfPossession = proofOfPossessions.find(p => p.senderAddress.equals(key))
				? proofOfPossessions
						.find(p => p.senderAddress.equals(key))
						?.params?.proofOfPossession?.toString('hex')
				: genesisValidators.find((p: { address: string }) => p.address === address)
				? genesisValidators.find((p: { address: string }) => p.address === address)
						.proofOfPossession
				: DUMMY_PROOF_OF_POSSESSION;
			return {
				...value,
				address,
				sharingCoefficients: value.sharingCoefficients.map(coefficient => ({
					tokenID: coefficient.tokenID,
					coefficient: !coefficient.coefficient ? Q96_ZERO : coefficient.coefficient,
				})),
				blsKey: bls.blsKey.toString('hex'),
				generatorKey: bls.generatorKey.toString('hex'),
				proofOfPossession,
			};
		}),
	);
	return { validatorKeys, validatorIndex };
};

export const getStakers = async (db: StateDB): Promise<Staker[]> => {
	const posStakerStore = getStateStore(db, DB_PREFIX_POS_STAKER_STORE);
	const stakers = (await posStakerStore.iterateWithSchema(
		{
			gte: Buffer.alloc(21, 0),
			lte: Buffer.alloc(21, 255),
		},
		stakerStoreSchema,
	)) as {
		key: Buffer;
		value: StakerBuffer;
	}[];
	return stakers.map(({ key, value }) => ({
		address: getKlayr32AddressFromAddress(key),
		stakes: value.stakes.map(stake => ({
			...stake,
			sharingCoefficients: stake.sharingCoefficients.map(coefficient => ({
				tokenID: coefficient.tokenID.toString('hex'),
				coefficient: !coefficient.coefficient ? Q96_ZERO : coefficient.coefficient,
			})),
			validatorAddress: getKlayr32AddressFromAddress(stake.validatorAddress),
		})),
		pendingUnlocks: value.pendingUnlocks.map(unlock => ({
			...unlock,
			validatorAddress: getKlayr32AddressFromAddress(unlock.validatorAddress),
		})),
	}));
};

export const processRewards = async (
	db: StateDB,
	blockchainDB: Database,
	networkConstant: NetworkConfigLocal,
) => {
	const { validatorKeys, validatorIndex } = await getValidatorKeys(
		db,
		blockchainDB,
		networkConstant,
	);
	// Get all user token accounts for token module
	const { userStore, userKeyIndex } = await getTokenAccounts(db, networkConstant.tokenID);
	const sortedStakers = await getStakers(db);
	const claimedStakersIndex: Record<string, number> = {};
	const sortedClaimedStakers = sortedStakers.map(
		(staker, index): Staker => {
			claimedStakersIndex[staker.address] = index;
			const stakerIndex = userKeyIndex[staker.address];
			return {
				...staker,
				stakes: staker.stakes.map(stake => {
					const validatorUserIndex = userKeyIndex[stake.validatorAddress];
					if (stake.sharingCoefficients[0]) {
						const sharingCoefficient = {
							coefficient: stake.sharingCoefficients[0].coefficient,
							tokenID: Buffer.from(stake.sharingCoefficients[0].tokenID, 'hex'),
						};
						const stakeReward = calculateStakeRewards(
							sharingCoefficient,
							stake.amount,
							validatorKeys[validatorIndex[stake.validatorAddress]].sharingCoefficients[0],
						);
						if (stakeReward > BigInt(0) && staker.address !== stake.validatorAddress) {
							const posIndex = userStore[validatorUserIndex].lockedBalances.findIndex(
								lb => lb.module === 'pos',
							);
							userStore[validatorUserIndex].lockedBalances[posIndex].amount -= stakeReward;
							userStore[stakerIndex].availableBalance += stakeReward;
						}
						return {
							...stake,
							sharingCoefficients: validatorKeys[
								validatorIndex[stake.validatorAddress]
							].sharingCoefficients.map(coefficient => ({
								tokenID: coefficient.tokenID.toString('hex'),
								coefficient: coefficient.coefficient,
							})),
						};
					}
					return stake;
				}),
			};
		},
	);

	validatorKeys.forEach(validator => {
		const validatorStakeIndex = claimedStakersIndex[validator.address];
		if (validatorStakeIndex > -1) {
			const validatorUserIndex = userKeyIndex[validator.address];
			const staked = sortedClaimedStakers[validatorStakeIndex].stakes.reduce(
				(acc: bigint, stake) => acc + stake.amount,
				AMOUNT_ZERO,
			);
			const pendingUnlocked = sortedClaimedStakers[validatorStakeIndex].pendingUnlocks.reduce(
				(acc: bigint, unlock) => acc + unlock.amount,
				AMOUNT_ZERO,
			);
			const posLockedBalanceIndex = userStore[validatorUserIndex].lockedBalances.findIndex(
				lb => lb.module === 'pos',
			);
			userStore[validatorUserIndex].availableBalance +=
				userStore[validatorUserIndex].lockedBalances[posLockedBalanceIndex].amount -
				staked -
				pendingUnlocked;
			userStore[validatorUserIndex].lockedBalances[posLockedBalanceIndex].amount =
				staked + pendingUnlocked;
		}
	});
	const { sortedTotalSupplySubstore, sortedUserSubstore } = sortUsersSubstore(userStore);

	return {
		sortedClaimedStakers,
		sortedUserSubstore,
		sortedTotalSupplySubstore,
		validatorKeys,
	};
};

export const createGenesisDataObj = async (
	accounts: ValidatorEntry[],
	delegatesVoteWeights: { round: number; snapshot: DelegateWeight[] }[],
	snapshotHeight: number,
): Promise<GenesisDataEntry> => {
	const r = ceiling(snapshotHeight, ROUND_LENGTH);
	const voteWeightR2 = delegatesVoteWeights.find(voteWeight => voteWeight.round === r);

	if (!voteWeightR2 || voteWeightR2.snapshot.length === 0) {
		throw new Error(`Delegate vote weights for round ${r} (r) unavailable, cannot proceed.`);
	}

	const initValidators: Buffer[] = [];
	const accountBannedMap = new Map(accounts.map(account => [account.address, account.isBanned]));

	// Sorting delegates by voteWeight is unnecessary as framework already does it
	const { snapshot } = voteWeightR2;
	snapshot.forEach((delegate: DelegateWeight) => {
		const isAccountBanned = accountBannedMap.get(delegate.address.toString('hex'));
		if (!isAccountBanned) {
			initValidators.push(delegate.address);
		}
	});

	const sortedInitValidators = initValidators
		.slice(0, NUMBER_ACTIVE_VALIDATORS_AFTER)
		.sort((a, b) => a.compare(b));

	return {
		initRounds: POS_INIT_ROUNDS,
		initValidators: sortedInitValidators.map(entry => getKlayr32AddressFromAddress(entry)),
	};
};

export const getPoSModuleEntry = async (
	validators: ValidatorEntry[],
	stakers: Staker[],
	genesisData: GenesisDataEntry,
): Promise<GenesisAssetEntry> => {
	const posObj: PoSStoreEntry = {
		validators,
		stakers,
		genesisData,
	};

	return {
		module: MODULE_NAME_POS,
		data: (posObj as unknown) as Record<string, unknown>,
		schema: posGenesisStoreSchema,
	};
};
