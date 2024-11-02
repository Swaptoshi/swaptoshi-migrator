/*
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
 *
 */
import { utils } from '@liskhq/lisk-cryptography';

const { getRandomBytes } = utils;

export type AuthAccount = {
	key: Buffer;
	value: {
		numberOfSignatures: number;
		mandatoryKeys: Buffer[];
		optionalKeys: Buffer[];
		nonce: string;
	};
};

export const createFakeDefaultAuthAccount = (account: AuthAccount) => ({
	key: account?.key ?? getRandomBytes(20),
	value: {
		nonce: account?.value?.nonce ?? '0',
		numberOfSignatures: account?.value?.numberOfSignatures ?? 0,
		mandatoryKeys: account?.value?.mandatoryKeys ?? [],
		optionalKeys: account?.value?.optionalKeys ?? [],
	},
});

export const createFakeDefaultPOSAccount = (account: AuthAccount) => ({
	key: account?.key ?? getRandomBytes(20),
	value: {
		nonce: account?.value?.nonce ?? '0',
		numberOfSignatures: account?.value?.numberOfSignatures ?? 0,
		mandatoryKeys: account?.value?.mandatoryKeys ?? [],
		optionalKeys: account?.value?.optionalKeys ?? [],
	},
});

export const createFakeDefaultTokenAccount = (account: AuthAccount) => ({
	key: account?.key ?? getRandomBytes(20),
	value: {
		nonce: account?.value?.nonce ?? '0',
		numberOfSignatures: account?.value?.numberOfSignatures ?? 0,
		mandatoryKeys: account?.value?.mandatoryKeys ?? [],
		optionalKeys: account?.value?.optionalKeys ?? [],
	},
});
