const encodeCTIM = (ledger_seq, txn_index, network_id) => {
  if (typeof(ledger_seq) != 'number')
    throw new Error("ledger_seq must be a number.");
  if (ledger_seq > 0xFFFFFFF)
    throw new Error("ledger_seq must not be greater than 268435455.");

  if (typeof(txn_index) != 'number')
    throw new Error("txn_index must be a number.");
  if (txn_index > 0xFFFF)
    throw new Error("txn_index must not be greater than 65535.");

  if (typeof(network_id) != 'number')
    throw new Error("network_id must be a number.");
  if (network_id > 0xFFFF)
    throw new Error("network_id must not be greater than 65535.");

  return ((BigInt(0xC0000000) +
              (BigInt(ledger_seq)) << 32n) +
              (BigInt(txn_index) << 16n) +
               BigInt(network_id)).toString(16).toUpperCase();
};


const decodeCTIM = (ctim) => {
  let ctimValue;
  if (typeof(ctim) === 'string')
  {
    if (!/^[0-9A-F]+$/.test(ctim))
      throw new Error("ctim must be a hexadecimal string or BigInt");

    if (ctim.length !== 16)
      throw new Error("ctim must be exactly 16 nibbles and start with a C");

    ctimValue = BigInt('0x' + ctim);
  }
  else if (typeof(ctim) === 'bigint')
    ctimValue = ctim;
  else
    throw new Error("ctim must be a hexadecimal string or BigInt");

  if (ctimValue > 0xFFFFFFFFFFFFFFFFn ||
     (ctimValue & 0xF000000000000000n) != 0xC000000000000000n)
    throw new Error("ctim must be exactly 16 nibbles and start with a C");

  const ledger_seq = Number((ctimValue >> 32n) & 0xFFFFFFFn);
  const txn_index = Number((ctimValue >> 16n) & 0xFFFFn);
  const network_id = Number(ctimValue & 0xFFFFn);
  return {
    ledger_seq,
    txn_index,
    network_id
  };
};

// NOTE TO DEVELOPER:
// you only need the two functions above, below are test cases for nodejs, if you want them.
if (typeof(window) === 'undefined' && typeof(process) === 'object')
{
    console.log("Running test cases...");
    // Test cases For encodeCTIM
    const assert = require('assert');

    // Test case 1: Valid input values
    assert.equal(encodeCTIM(0xFFFFFFF, 0xFFFF, 0xFFFF), "CFFFFFFFFFFFFFFF");
    assert.equal(encodeCTIM(0, 0, 0), "C000000000000000");
    assert.equal(encodeCTIM(1, 2, 3), "C000000100020003");
    assert.equal(encodeCTIM(13249191, 12911, 49221), "C0CA2AA7326FC045");

    // Test case 2: ledger_seq greater than 0xFFFFFFF
    assert.throws(() => encodeCTIM(0x10000000, 0xFFFF, 0xFFFF), /ledger_seq must not be greater than 268435455./);

    // Test case 3: txn_index greater than 0xFFFF
    assert.throws(() => encodeCTIM(0xFFFFFFF, 0x10000, 0xFFFF), /txn_index must not be greater than 65535./);

    // Test case 4: network_id greater than 0xFFFF
    assert.throws(() => encodeCTIM(0xFFFFFFF, 0xFFFF, 0x10000), /network_id must not be greater than 65535./);

    // Test cases For decodeCTIM

    // Test case 5: Valid input values
    assert.deepEqual(decodeCTIM("CFFFFFFFFFFFFFFF"), { ledger_seq: 0xFFFFFFF, txn_index: 0xFFFF, network_id: 0xFFFF });
    assert.deepEqual(decodeCTIM("C000000000000000"), { ledger_seq: 0, txn_index: 0, network_id: 0 });
    assert.deepEqual(decodeCTIM("C000000100020003"), { ledger_seq:1, txn_index: 2, network_id: 3 });
    assert.deepEqual(decodeCTIM("C0CA2AA7326FC045"), { ledger_seq:13249191, txn_index: 12911, network_id: 49221 });

    // Test case 6: ctim not a string or big int
    assert.throws(() => decodeCTIM(0xCFF), /ctim must be a hexadecimal string or BigInt/);

    // Test case 7: ctim not a hexadecimal string
    assert.throws(() => decodeCTIM("C003FFFFFFFFFFFG"), /ctim must be a hexadecimal string or BigInt/);

    // Test case 8: ctim not exactly 16 nibbles
    assert.throws(() => decodeCTIM("C003FFFFFFFFFFF"), /ctim must be exactly 16 nibbles and start with a C/);

    // Test case 9: ctim too large to be a valid CTIM value
    assert.throws(() => decodeCTIM("CFFFFFFFFFFFFFFFF"), /ctim must be exactly 16 nibbles and start with a C/);

    // Test case 10: ctim doesn't start with a C nibble
    assert.throws(() => decodeCTIM("FFFFFFFFFFFFFFFF"), /ctim must be exactly 16 nibbles and start with a C/);

    // the same tests again but using bigint instead of string
    //

    // Test case 11: Valid input values
    assert.deepEqual(decodeCTIM(0xCFFFFFFFFFFFFFFFn), { ledger_seq: 0xFFFFFFF, txn_index: 0xFFFF, network_id: 0xFFFF });
    assert.deepEqual(decodeCTIM(0xC000000000000000n), { ledger_seq: 0, txn_index: 0, network_id: 0 });
    assert.deepEqual(decodeCTIM(0xC000000100020003n), { ledger_seq:1, txn_index: 2, network_id: 3 });
    assert.deepEqual(decodeCTIM(0xC0CA2AA7326FC045n), { ledger_seq:13249191, txn_index: 12911, network_id: 49221 });

    // Test case 12: ctim not exactly 16 nibbles
    assert.throws(() => decodeCTIM(0xC003FFFFFFFFFFFn), /ctim must be exactly 16 nibbles and start with a C/);

    // Test case 13: ctim too large to be a valid CTIM value
    assert.throws(() => decodeCTIM(0xCFFFFFFFFFFFFFFFFn), /ctim must be exactly 16 nibbles and start with a C/);

    // Test case 14: ctim doesn't start with a C nibble
    assert.throws(() => decodeCTIM(0xFFFFFFFFFFFFFFFFn), /ctim must be exactly 16 nibbles and start with a C/);

    console.log("Done.");
}
