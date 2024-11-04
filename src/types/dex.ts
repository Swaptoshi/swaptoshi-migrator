import { GovernableConfigSubstoreEntry } from './types';

export interface Slot0 {
	sqrtPriceX96: string;
	tick: string;
	observationIndex: string;
	observationCardinality: string;
	observationCardinalityNext: string;
}

export interface DEXPoolData {
	token0: Buffer;
	token1: Buffer;
	fee: string;
	tickSpacing: string;
	maxLiquidityPerTick: string;
	feeGrowthGlobal0X128: string;
	feeGrowthGlobal1X128: string;
	liquidity: string;
	slot0: Slot0;
}

export interface PositionManager {
	poolAddress: Buffer;
	name: string;
	symbol: string;
}

export interface ObservationSubstoreEntry {
	blockTimestamp: string;
	tickCumulative: string;
	secondsPerLiquidityCumulativeX128: string;
	initialized: boolean;
	poolAddress: string;
	index: string;
}

export interface DEXPoolSubstoreEntry {
	token0: string;
	token1: string;
	fee: string;
	tickSpacing: string;
	maxLiquidityPerTick: string;
	feeGrowthGlobal0X128: string;
	feeGrowthGlobal1X128: string;
	liquidity: string;
	slot0: {
		sqrtPriceX96: string;
		tick: string;
		observationIndex: string;
		observationCardinality: string;
		observationCardinalityNext: string;
	};
}

export interface PositionInfoSubstoreEntry {
	liquidity: string;
	feeGrowthInside0LastX128: string;
	feeGrowthInside1LastX128: string;
	tokensOwed0: string;
	tokensOwed1: string;
	poolAddress: string;
	key: string;
}

export interface PositionManagerSubstoreEntry {
	poolAddress: string;
	name: string;
	symbol: string;
}

export interface SupportedTokenManager {
	supportAll: boolean;
	supported: Buffer[];
}

export interface SupportedTokenManagerSubstoreEntry {
	supportAll: boolean;
	supported: string[];
}

export interface TickBitmapSubstoreEntry {
	bitmap: string;
	poolAddress: string;
	index: string;
}

export interface TickInfoSubstoreEntry {
	liquidityGross: string;
	liquidityNet: string;
	feeGrowthOutside0X128: string;
	feeGrowthOutside1X128: string;
	tickCumulativeOutside: string;
	secondsPerLiquidityOutsideX128: string;
	secondsOutside: string;
	initialized: boolean;
	poolAddress: string;
	tick: string;
}

export interface TokenSymbolSubstoreEntry {
	symbol: string;
	decimal: number;
	tokenId: string;
}

export interface DexGenesisStoreEntry {
	observationSubstore: ObservationSubstoreEntry[];
	poolSubstore: DEXPoolSubstoreEntry[];
	positionInfoSubstore: PositionInfoSubstoreEntry[];
	positionManagerSubstore: PositionManagerSubstoreEntry[];
	supportedTokenSubstore: SupportedTokenManagerSubstoreEntry[];
	tickBitmapSubstore: TickBitmapSubstoreEntry[];
	tickInfoSubstore: TickInfoSubstoreEntry[];
	tokenSymbolSubstore: TokenSymbolSubstoreEntry[];
	configSubstore: GovernableConfigSubstoreEntry;
}
