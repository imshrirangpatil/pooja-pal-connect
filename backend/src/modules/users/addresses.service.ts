import { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db';
import { Errors } from '../../utils/errors';
import { AddressRow } from './user.types';
import { AddressInput } from '../../utils/validators';

const MAX_ADDRESSES = 10;

export async function listAddresses(userId: string): Promise<AddressRow[]> {
  const { rows } = await query<AddressRow>(
    `SELECT * FROM addresses WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getDefaultAddress(userId: string): Promise<AddressRow | null> {
  const { rows } = await query<AddressRow>(
    `SELECT * FROM addresses WHERE user_id = $1 AND is_default = true LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function getAddress(userId: string, id: string): Promise<AddressRow | null> {
  const { rows } = await query<AddressRow>(
    `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ?? null;
}

async function countAddresses(client: PoolClient, userId: string): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    'SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1',
    [userId],
  );
  return Number(rows[0].count);
}

async function clearDefault(client: PoolClient, userId: string, exceptId?: string) {
  await client.query(
    `UPDATE addresses SET is_default = false
     WHERE user_id = $1 AND is_default = true ${exceptId ? 'AND id <> $2' : ''}`,
    exceptId ? [userId, exceptId] : [userId],
  );
}

/**
 * Add an address. The first address a user adds becomes their default
 * automatically; an explicit is_default=true also promotes it (and demotes
 * the previous default) — all inside one transaction.
 */
export async function createAddress(userId: string, input: AddressInput): Promise<AddressRow> {
  return withTransaction(async (client) => {
    const existing = await countAddresses(client, userId);
    if (existing >= MAX_ADDRESSES) throw Errors.addressLimit();

    const makeDefault = input.is_default === true || existing === 0;
    if (makeDefault) await clearDefault(client, userId);

    const { rows } = await client.query<AddressRow>(
      `INSERT INTO addresses
         (user_id, label, name, phone, line1, line2, city, state, pincode, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        userId,
        input.label ?? 'Home',
        input.name,
        input.phone,
        input.line1,
        input.line2 ?? null,
        input.city,
        input.state,
        input.pincode,
        input.country ?? 'India',
        makeDefault,
      ],
    );
    return rows[0];
  });
}

/** Replace an address's editable fields. Honours is_default promotion. */
export async function updateAddress(
  userId: string,
  id: string,
  input: AddressInput,
): Promise<AddressRow> {
  return withTransaction(async (client) => {
    const owned = await client.query<AddressRow>(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId],
    );
    if (!owned.rows[0]) throw Errors.notFound('Address not found.');

    const makeDefault = input.is_default === true || owned.rows[0].is_default;
    if (input.is_default === true) await clearDefault(client, userId, id);

    const { rows } = await client.query<AddressRow>(
      `UPDATE addresses SET
         label = $3, name = $4, phone = $5, line1 = $6, line2 = $7,
         city = $8, state = $9, pincode = $10, country = $11, is_default = $12
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        input.label ?? 'Home',
        input.name,
        input.phone,
        input.line1,
        input.line2 ?? null,
        input.city,
        input.state,
        input.pincode,
        input.country ?? 'India',
        makeDefault,
      ],
    );
    return rows[0];
  });
}

/**
 * Placeholder for the future Orders module: returns true if the address is
 * referenced by a pending order. The orders table does not exist yet, so this
 * is a no-op guard today. When Orders lands, implement the real check here.
 */
async function isAddressInUse(_client: PoolClient, _addressId: string): Promise<boolean> {
  // TODO(orders-module): SELECT 1 FROM orders WHERE address_id = $1 AND status = 'pending'
  return false;
}

/**
 * Delete an address. Blocks deletion if linked to a pending order.
 * If the deleted address was the default, the most recently added remaining
 * address is promoted to default — all in one transaction.
 */
export async function deleteAddress(userId: string, id: string): Promise<void> {
  return withTransaction(async (client) => {
    const owned = await client.query<AddressRow>(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId],
    );
    if (!owned.rows[0]) throw Errors.notFound('Address not found.');

    if (await isAddressInUse(client, id)) throw Errors.addressInUse();

    const wasDefault = owned.rows[0].is_default;
    await client.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);

    if (wasDefault) {
      // Promote the most recently added remaining address, if any.
      await client.query(
        `UPDATE addresses SET is_default = true
         WHERE id = (
           SELECT id FROM addresses WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 1
         )`,
        [userId],
      );
    }
  });
}

/** Set a specific address as the user's default (transactional). */
export async function setDefaultAddress(userId: string, id: string): Promise<AddressRow> {
  return withTransaction(async (client) => {
    const owned = await client.query<AddressRow>(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId],
    );
    if (!owned.rows[0]) throw Errors.notFound('Address not found.');

    await clearDefault(client, userId, id);
    const { rows } = await client.query<AddressRow>(
      `UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId],
    );
    return rows[0];
  });
}
