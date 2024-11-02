import { GovernableConfigSubstoreEntry } from './types';

export interface GovernanceGenesisStoreEntry {
	boostedAccountSubstore: BoostedAccountGenesisSubstoreEntry[];
	castedVoteSubstore: CastedVoteGenesisSubstoreEntry[];
	delegatedVoteSubstore: DelegatedVoteGenesisSubstoreEntry[];
	nextAvailableProposalIdSubstore: NextAvailableProposalIdStoreData;
	proposalVoterSubstore: ProposalVoterGenesisSubstoreEntry[];
	proposalSubstore: ProposalGenesisSubstoreEntry[];
	queueSubstore: ProposalQueueGenesisSubstoreEntry[];
	voteScoreSubstore: VoteScoreGenesisSubstoreEntry[];
	configSubstore: GovernableConfigSubstoreEntry;
}

export interface BoostedAccountStoreData {
	targetHeight: number;
}

export interface BoostedAccountGenesisSubstoreEntry {
	targetHeight: number;
	address: string;
}

export interface CastedVoteStoreData {
	activeVote: {
		proposalId: number;
		decision: number;
	}[];
}

export interface CastedVoteGenesisSubstoreEntry {
	activeVote: {
		proposalId: number;
		decision: number;
	}[];
	address: string;
}

export interface DelegatedVoteStoreData {
	outgoingDelegation: Buffer;
	incomingDelegation: Buffer[];
}

export interface DelegatedVoteGenesisSubstoreEntry {
	outgoingDelegation: string;
	incomingDelegation: string[];
	address: string;
}

export interface NextAvailableProposalIdStoreData {
	nextProposalId: number;
}

export interface ProposalVoterStoreData {
	voters: Buffer[];
}

export interface ProposalVoterGenesisSubstoreEntry {
	voters: string[];
	proposalId: number;
}

export interface ProposalStoreData {
	title: string;
	summary: string;
	deposited: bigint;
	author: Buffer;
	turnout: {
		for: bigint;
		against: bigint;
		abstain: bigint;
	};
	parameters: {
		createdHeight: number;
		startHeight: number;
		quorumHeight: number;
		endHeight: number;
		executionHeight: number;
		maxBoostDuration: number;
		boostFactor: number;
		enableBoosting: boolean;
		enableTurnoutBias: boolean;
		quorumMode: number;
		quorumTreshold: string;
	};
	voteSummary: {
		for: bigint;
		against: bigint;
		abstain: bigint;
	};
	status: number;
	actions: {
		type: 'funding' | 'config';
		payload: Buffer;
	}[];
	attributes: {
		key: string;
		data: Buffer;
	}[];
}

export interface ProposalGenesisSubstoreEntry {
	proposalId: number;
	title: string;
	summary: string;
	deposited: string;
	author: string;
	turnout: {
		for: string;
		against: string;
		abstain: string;
	};
	parameters: {
		createdHeight: number;
		startHeight: number;
		quorumHeight: number;
		endHeight: number;
		executionHeight: number;
		maxBoostDuration: number;
		boostFactor: number;
		enableBoosting: boolean;
		enableTurnoutBias: boolean;
		quorumMode: number;
		quorumTreshold: string;
	};
	voteSummary: {
		for: string;
		against: string;
		abstain: string;
	};
	status: number;
	actions: {
		type: 'funding' | 'config';
		payload: string;
	}[];
	attributes: {
		key: string;
		data: string;
	}[];
}

export interface ProposalQueueStoreData {
	start: number[];
	quorum: number[];
	ends: number[];
	execute: number[];
}

export interface ProposalQueueGenesisSubstoreEntry {
	height: number;
	start: number[];
	quorum: number[];
	ends: number[];
	execute: number[];
}

export interface VoteScoreStoreData {
	score: bigint;
}

export interface VoteScoreGenesisSubstoreEntry {
	score: string;
	address: string;
}
