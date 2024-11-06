import { StateDB } from '@liskhq/lisk-db';
import { getKlayr32AddressFromAddress } from '@klayr/cryptography/dist-node/address';
import { getStateStore } from '../utils/store';
import {
	BoostedAccountGenesisSubstoreEntry,
	BoostedAccountStoreData,
	CastedVoteGenesisSubstoreEntry,
	CastedVoteStoreData,
	DelegatedVoteGenesisSubstoreEntry,
	DelegatedVoteStoreData,
	GenesisAssetEntry,
	GovernableConfigStoreData,
	GovernableConfigSubstoreEntry,
	GovernanceGenesisStoreEntry,
	NextAvailableProposalIdStoreData,
	ProposalGenesisSubstoreEntry,
	ProposalQueueGenesisSubstoreEntry,
	ProposalQueueStoreData,
	ProposalStoreData,
	ProposalVoterGenesisSubstoreEntry,
	ProposalVoterStoreData,
	VoteScoreGenesisSubstoreEntry,
	VoteScoreStoreData,
} from '../types';
import {
	boostedAccountStoreSchema,
	castedVoteStoreSchema,
	delegatedVoteStoreSchema,
	governableConfigSchema,
	governanceGenesisStoreSchema,
	nextAvailableProposalIdStoreSchema,
	proposalQueueStoreSchema,
	proposalStoreSchema,
	proposalVoterStoreSchema,
	voteScoreStoreSchema,
} from '../schemas';
import {
	DB_PREFIX_GOVERNANCE_BOOSTED_ACCOUNT_STORE,
	DB_PREFIX_GOVERNANCE_CASTED_VOTE_STORE,
	DB_PREFIX_GOVERNANCE_DELEGATED_VOTE_STORE,
	DB_PREFIX_GOVERNANCE_NEXT_AVAILABLE_PROPOSAL_ID_STORE,
	DB_PREFIX_GOVERNANCE_PROPOSAL_STORE,
	DB_PREFIX_GOVERNANCE_PROPOSAL_VOTER_STORE,
	DB_PREFIX_GOVERNANCE_QUEUE_STORE,
	DB_PREFIX_GOVERNANCE_VOTE_SCORE_STORE,
	MODULE_NAME_GOVERNANCE,
} from '../constants';

export const getGovernableConfigSubstore = async (
	db: StateDB,
	prefix: Buffer,
): Promise<GovernableConfigSubstoreEntry> => {
	const configSubstore = getStateStore(db, prefix);
	try {
		const config = await configSubstore.getWithSchema<GovernableConfigStoreData>(
			Buffer.alloc(0),
			governableConfigSchema,
		);

		return {
			data: config.data.toString('hex'),
		};
	} catch {
		return { data: '' };
	}
};

export const getBoostedAccountSubstore = async (
	db: StateDB,
): Promise<BoostedAccountGenesisSubstoreEntry[]> => {
	const boostedAccountStore = getStateStore(db, DB_PREFIX_GOVERNANCE_BOOSTED_ACCOUNT_STORE);
	const boostedAccounts = (await boostedAccountStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		boostedAccountStoreSchema,
	)) as { key: Buffer; value: BoostedAccountStoreData }[];

	return boostedAccounts
		.sort((a, b) => a.key.compare(b.key))
		.map(item => ({
			...item.value,
			address: getKlayr32AddressFromAddress(item.key),
		}));
};

export const getCastedVoteSubstore = async (
	db: StateDB,
): Promise<CastedVoteGenesisSubstoreEntry[]> => {
	const castedVoteStore = getStateStore(db, DB_PREFIX_GOVERNANCE_CASTED_VOTE_STORE);
	const castedVotes = (await castedVoteStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		castedVoteStoreSchema,
	)) as { key: Buffer; value: CastedVoteStoreData }[];

	return castedVotes
		.sort((a, b) => a.key.compare(b.key))
		.map(item => ({
			...item.value,
			address: getKlayr32AddressFromAddress(item.key),
		}));
};

export const getDelegatedVoteSubstore = async (
	db: StateDB,
): Promise<DelegatedVoteGenesisSubstoreEntry[]> => {
	const delegatedVoteStore = getStateStore(db, DB_PREFIX_GOVERNANCE_DELEGATED_VOTE_STORE);
	const delegatedVotes = (await delegatedVoteStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		delegatedVoteStoreSchema,
	)) as { key: Buffer; value: DelegatedVoteStoreData }[];

	return delegatedVotes
		.sort((a, b) => a.key.compare(b.key))
		.map(item => ({
			outgoingDelegation: getKlayr32AddressFromAddress(item.value.outgoingDelegation),
			incomingDelegation: item.value.incomingDelegation.map(t => getKlayr32AddressFromAddress(t)),
			address: getKlayr32AddressFromAddress(item.key),
		}));
};

export const getNextAvailableProposalIdSubstore = async (
	db: StateDB,
): Promise<NextAvailableProposalIdStoreData> => {
	const nextAvailableProposalIdStore = getStateStore(
		db,
		DB_PREFIX_GOVERNANCE_NEXT_AVAILABLE_PROPOSAL_ID_STORE,
	);

	let nextAvailableProposalId;
	try {
		nextAvailableProposalId = await nextAvailableProposalIdStore.getWithSchema<
			NextAvailableProposalIdStoreData
		>(Buffer.alloc(0), nextAvailableProposalIdStoreSchema);
	} catch {
		return {
			nextProposalId: 0,
		};
	}

	return {
		nextProposalId: nextAvailableProposalId.nextProposalId,
	};
};

export const getProposalVoterSubstore = async (
	db: StateDB,
): Promise<ProposalVoterGenesisSubstoreEntry[]> => {
	const proposalVoterStore = getStateStore(db, DB_PREFIX_GOVERNANCE_PROPOSAL_VOTER_STORE);
	const proposalVoters = (await proposalVoterStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(4, 255),
		},
		proposalVoterStoreSchema,
	)) as { key: Buffer; value: ProposalVoterStoreData }[];

	return proposalVoters
		.sort((a, b) => a.key.readUIntBE(0, 4) - b.key.readUIntBE(0, 4)) // sort by proposalId
		.map(item => ({
			voters: item.value.voters.map(t => getKlayr32AddressFromAddress(t)),
			proposalId: item.key.readUIntBE(0, 4),
		}));
};

export const getProposalSubstore = async (db: StateDB): Promise<ProposalGenesisSubstoreEntry[]> => {
	const proposalStore = getStateStore(db, DB_PREFIX_GOVERNANCE_PROPOSAL_STORE);
	const proposals = (await proposalStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(4, 255),
		},
		proposalStoreSchema,
	)) as { key: Buffer; value: ProposalStoreData }[];

	return proposals
		.sort((a, b) => a.key.readUIntBE(0, 4) - b.key.readUIntBE(0, 4)) // sort by proposalId
		.map(item => ({
			...item.value,
			deposited: item.value.deposited.toString(),
			author: getKlayr32AddressFromAddress(item.value.author),
			turnout: {
				for: item.value.turnout.for.toString(),
				against: item.value.turnout.against.toString(),
				abstain: item.value.turnout.abstain.toString(),
			},
			voteSummary: {
				for: item.value.voteSummary.for.toString(),
				against: item.value.voteSummary.against.toString(),
				abstain: item.value.voteSummary.abstain.toString(),
			},
			actions: item.value.actions.map(t => ({
				...t,
				payload: t.payload.toString('hex'),
			})),
			attributes: item.value.attributes.map(t => ({
				...t,
				data: t.data.toString('hex'),
			})),
			proposalId: item.key.readUIntBE(0, 4),
		}));
};

export const getProposalQueueSubstore = async (
	db: StateDB,
): Promise<ProposalQueueGenesisSubstoreEntry[]> => {
	const proposalQueueStore = getStateStore(db, DB_PREFIX_GOVERNANCE_QUEUE_STORE);
	const proposalQueues = (await proposalQueueStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(4, 255),
		},
		proposalQueueStoreSchema,
	)) as { key: Buffer; value: ProposalQueueStoreData }[];

	return proposalQueues
		.sort((a, b) => a.key.readUIntBE(0, 4) - b.key.readUIntBE(0, 4)) // sort by height
		.map(item => ({
			...item.value,
			height: item.key.readUIntBE(0, 4),
		}));
};

export const getVoteScoreSubstore = async (
	db: StateDB,
): Promise<VoteScoreGenesisSubstoreEntry[]> => {
	const voteScoreStore = getStateStore(db, DB_PREFIX_GOVERNANCE_VOTE_SCORE_STORE);
	const voteScores = (await voteScoreStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		voteScoreStoreSchema,
	)) as { key: Buffer; value: VoteScoreStoreData }[];

	return voteScores
		.sort((a, b) => a.key.compare(b.key))
		.map(item => ({
			score: item.value.score.toString(),
			address: getKlayr32AddressFromAddress(item.key),
		}));
};

export const getGovernanceModuleEntry = async (
	boostedAccountSubstore: BoostedAccountGenesisSubstoreEntry[],
	castedVoteSubstore: CastedVoteGenesisSubstoreEntry[],
	delegatedVoteSubstore: DelegatedVoteGenesisSubstoreEntry[],
	nextAvailableProposalIdSubstore: NextAvailableProposalIdStoreData,
	proposalVoterSubstore: ProposalVoterGenesisSubstoreEntry[],
	proposalSubstore: ProposalGenesisSubstoreEntry[],
	queueSubstore: ProposalQueueGenesisSubstoreEntry[],
	voteScoreSubstore: VoteScoreGenesisSubstoreEntry[],
	configSubstore: GovernableConfigSubstoreEntry,
): Promise<GenesisAssetEntry> => {
	const genesisObj: GovernanceGenesisStoreEntry = {
		boostedAccountSubstore,
		castedVoteSubstore,
		delegatedVoteSubstore,
		nextAvailableProposalIdSubstore,
		proposalVoterSubstore,
		proposalSubstore,
		queueSubstore,
		voteScoreSubstore,
		configSubstore,
	};
	return {
		module: MODULE_NAME_GOVERNANCE,
		data: (genesisObj as unknown) as Record<string, unknown>,
		schema: governanceGenesisStoreSchema,
	};
};
