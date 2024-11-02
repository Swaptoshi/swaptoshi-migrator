/*
 * Copyright © 2020 Lisk Foundation
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
import { Schema } from '@liskhq/lisk-codec';
import { StakeSharingCoefficient } from 'klayr-framework/dist-node/modules/pos/types';

export type KeyIndex = Record<string, number>;

export interface LoggerConfig {
	logFileName: string;
	fileLogLevel: string;
	consoleLogLevel: string;
}

export interface AuthAccountEntry {
	numberOfSignatures: number;
	mandatoryKeys: string[];
	optionalKeys: string[];
	nonce: string;
}

export interface AuthStoreEntry {
	address: string;
	authAccount: AuthAccountEntry;
}

export interface AuthStoreEntryBuffer extends Omit<AuthStoreEntry, 'address'> {
	address: Buffer;
}

export interface LegacyStoreEntry {
	address: string;
	balance: string;
}

export interface LegacyStoreEntryBuffer extends Omit<LegacyStoreEntry, 'address'> {
	address: Buffer;
}

export interface LegacyStoreData {
	accounts: LegacyStoreEntry[];
}

export interface UserSubstore {
	address: Buffer;
	tokenID: Buffer;
	availableBalance: bigint;
	lockedBalances: {
		module: string;
		amount: bigint;
	}[];
}

export interface UserSubstoreEntry {
	address: string;
	tokenID: string;
	availableBalance: string;
	lockedBalances: {
		module: string;
		amount: string;
	}[];
}

export interface SupplySubstoreEntry {
	tokenID: string;
	totalSupply: string;
}

export interface EscrowSubstoreEntry {
	escrowChainID: Buffer;
	tokenID: Buffer;
	amount: bigint;
}

export interface SupportedTokensSubstoreEntry {
	chainID: Buffer;
	supportedTokenIDs: Buffer[];
}

export interface TokenStoreEntry {
	userSubstore: UserSubstoreEntry[];
	supplySubstore: SupplySubstoreEntry[];
	escrowSubstore: EscrowSubstoreEntry[];
	supportedTokensSubstore: SupportedTokensSubstoreEntry[];
}

export interface SharingCoefficient {
	tokenID: string;
	coefficient: Buffer;
}

export interface ValidatorEntry {
	address: string;
	name: string;
	blsKey: string;
	proofOfPossession: string;
	generatorKey: string;
	lastGeneratedHeight: number;
	isBanned: boolean;
	reportMisbehaviorHeights: number[];
	consecutiveMissedBlocks: number;
	commission: number;
	lastCommissionIncreaseHeight: number;
	sharingCoefficients: StakeSharingCoefficient[];
}

export interface ValidatorEntryBuffer
	extends Omit<ValidatorEntry, 'address' | 'sharingCoefficients'> {
	address: Buffer;
	sharingCoefficients: StakeSharingCoefficient[];
}

export interface Stake {
	validatorAddress: string;
	amount: bigint;
	sharingCoefficients: SharingCoefficient[];
}

export interface StakeBuffer {
	validatorAddress: Buffer;
	amount: bigint;
	sharingCoefficients: StakeSharingCoefficient[];
}

export interface PendingUnlockBuffer {
	validatorAddress: Buffer;
	amount: bigint;
	unstakeHeight: number;
}

export interface Staker {
	address: string;
	stakes: Stake[];
	pendingUnlocks: {
		validatorAddress: string;
		amount: bigint;
		unstakeHeight: number;
	}[];
}

export interface StakerBuffer extends Omit<Staker, 'address' | 'stakes' | 'pendingUnlocks'> {
	address: Buffer;
	stakes: StakeBuffer[];
	pendingUnlocks: PendingUnlockBuffer[];
}

export interface GenesisDataEntry {
	initRounds: number;
	initValidators: string[];
}

export interface PoSStoreEntry {
	validators: ValidatorEntry[];
	stakers: Staker[];
	genesisData: GenesisDataEntry;
}

export interface GenesisAssetEntry {
	module: string;
	data: Record<string, unknown>;
	schema: Schema;
}

export interface DelegateWeight {
	readonly address: Buffer;
	readonly voteWeight: bigint;
}

export type Port = number;

export interface LastCertificate {
	height: number;
	timestamp: number;
	stateRoot: Buffer;
	validatorsHash: Buffer;
}

export interface ChainData {
	name: string;
	lastCertificate: LastCertificate;
	status: number;
}

type InboxOutbox = {
	appendPath: Buffer[];
	size: number;
	root: Buffer;
};
export type Inbox = InboxOutbox;
export type Outbox = InboxOutbox;

export interface ChannelData {
	inbox: Inbox;
	outbox: Outbox;
	partnerChainOutboxRoot: Buffer;
	messageFeeTokenID: Buffer;
	minReturnFeePerByte: bigint;
}

export interface ActiveValidator {
	blsKey: Buffer;
	bftWeight: bigint;
}

export interface ChainValidators {
	activeValidators: ActiveValidator[];
	certificateThreshold: bigint;
}

export interface TerminatedStateAccount {
	stateRoot: Buffer;
	mainchainStateRoot: Buffer;
	initialized?: boolean;
}

export interface TerminatedOutboxAccount {
	outboxRoot: Buffer;
	outboxSize: number;
	partnerChainInboxSize: number;
}

export interface ChainInfo {
	chainID: Buffer;
	chainData: ChainData;
	channelData: ChannelData;
	chainValidators: ChainValidators;
}

export interface TerminatedStateAccountWithChainID {
	chainID: Buffer;
	terminatedStateAccount: TerminatedStateAccount;
}

export interface TerminatedOutboxAccountWithChainID {
	chainID: Buffer;
	terminatedOutboxAccount: TerminatedOutboxAccount;
}

export interface GenesisInteroperability {
	ownChainName: string;
	ownChainNonce: bigint;
	chainInfos: ChainInfo[];
	terminatedStateAccounts: TerminatedStateAccountWithChainID[];
	terminatedOutboxAccounts: TerminatedOutboxAccountWithChainID[];
}

export interface NetworkConfigLocal {
	name: string;
	tokenID: string;
	prevSnapshotBlockHeight: number;
	additionalAccounts: { address: Buffer; balance: bigint }[];
}

export interface ForgingStatus {
	readonly address: string;
	readonly enabled: boolean;
	readonly height: number;
	readonly maxHeightPrevoted: number;
	readonly maxHeightGenerated: number;
}

export interface FileInfo {
	readonly fileName: string;
	readonly fileDir: string;
	readonly filePath: string;
}

export type BLSTransaction = {
	senderAddress: Buffer;
	params: {
		blsKey: Buffer;
		generatorKey: Buffer;
		proofOfPossession: Buffer;
	};
};
