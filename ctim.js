const encodeCTIM = (lgrIndex, txnIndex, networkId) => {
  if (typeof lgrIndex != "number")
    throw new Error("lgrIndex must be a number.");
  if (lgrIndex > 0xfffffff || lgrIndex < 0)
    throw new Error(
      "lgrIndex must not be greater than 268435455 or less than 0."
    );

  if (typeof txnIndex != "number")
    throw new Error("txnIndex must be a number.");
  if (txnIndex > 0xffff || txnIndex < 0)
    throw new Error("txnIndex must not be greater than 65535 or less than 0.");

  if (typeof networkId != "number")
    throw new Error("networkId must be a number.");
  if (networkId > 0xffff || networkId < 0)
    throw new Error("networkId must not be greater than 65535 or less than 0.");

  return (
    ((BigInt(0xc0000000) + BigInt(lgrIndex)) << 32n) +
    (BigInt(txnIndex) << 16n) +
    BigInt(networkId)
  )
    .toString(16)
    .toUpperCase();
};

const decodeCTIM = (ctim) => {
  let ctimValue;
  if (typeof ctim === "string") {
    if (!/^[0-9A-F]+$/.test(ctim))
      throw new Error("ctim must be a hexadecimal string or BigInt");

    if (ctim.length !== 16)
      throw new Error("ctim must be exactly 16 nibbles and start with a C");

    ctimValue = BigInt("0x" + ctim);
  } else if (typeof ctim === "bigint") ctimValue = ctim;
  else throw new Error("ctim must be a hexadecimal string or BigInt");

  if (
    ctimValue > 0xffffffffffffffffn ||
    (ctimValue & 0xf000000000000000n) != 0xc000000000000000n
  )
    throw new Error("ctim must be exactly 16 nibbles and start with a C");

  const lgrIndex = Number((ctimValue >> 32n) & 0xfffffffn);
  const txnIndex = Number((ctimValue >> 16n) & 0xffffn);
  const networkId = Number(ctimValue & 0xffffn);
  return {
    lgrIndex,
    txnIndex,
    networkId,
  };
};

// NOTE TO DEVELOPER:
// you only need the two functions above, below are test cases for nodejs, if you want them.
if (typeof window === "undefined" && typeof process === "object") {
  console.log("Running test cases...");
  // Test cases For encodeCTIM
  const assert = require("assert");

  // Test case 1: Valid input values
  assert.equal(encodeCTIM(0xfffffff, 0xffff, 0xffff), "CFFFFFFFFFFFFFFF");
  assert.equal(encodeCTIM(0, 0, 0), "C000000000000000");
  assert.equal(encodeCTIM(1, 2, 3), "C000000100020003");
  assert.equal(encodeCTIM(13249191, 12911, 49221), "C0CA2AA7326FC045");

  // Test case 2: lgrIndex greater than 0xFFFFFFF
  assert.throws(
    () => encodeCTIM(0x10000000, 0xffff, 0xffff),
    /lgrIndex must not be greater than 268435455 or less than 0./
  );
  assert.throws(
    () => encodeCTIM(-1, 0xffff, 0xffff),
    /lgrIndex must not be greater than 268435455 or less than 0./
  );

  // Test case 3: txnIndex greater than 0xFFFF
  assert.throws(
    () => encodeCTIM(0xfffffff, 0x10000, 0xffff),
    /txnIndex must not be greater than 65535 or less than 0./
  );
  assert.throws(
    () => encodeCTIM(0xfffffff, -1, 0xffff),
    /txnIndex must not be greater than 65535 or less than 0./
  );

  // Test case 4: networkId greater than 0xFFFF
  assert.throws(
    () => encodeCTIM(0xfffffff, 0xffff, 0x10000),
    /networkId must not be greater than 65535 or less than 0./
  );
  assert.throws(
    () => encodeCTIM(0xfffffff, 0xffff, -1),
    /networkId must not be greater than 65535 or less than 0./
  );

  // Test cases For decodeCTIM

  // Test case 5: Valid input values
  assert.deepEqual(decodeCTIM("CFFFFFFFFFFFFFFF"), {
    lgrIndex: 0xfffffff,
    txnIndex: 0xffff,
    networkId: 0xffff,
  });
  assert.deepEqual(decodeCTIM("C000000000000000"), {
    lgrIndex: 0,
    txnIndex: 0,
    networkId: 0,
  });
  assert.deepEqual(decodeCTIM("C000000100020003"), {
    lgrIndex: 1,
    txnIndex: 2,
    networkId: 3,
  });
  assert.deepEqual(decodeCTIM("C0CA2AA7326FC045"), {
    lgrIndex: 13249191,
    txnIndex: 12911,
    networkId: 49221,
  });

  // Test case 6: ctim not a string or big int
  assert.throws(
    () => decodeCTIM(0xcff),
    /ctim must be a hexadecimal string or BigInt/
  );

  // Test case 7: ctim not a hexadecimal string
  assert.throws(
    () => decodeCTIM("C003FFFFFFFFFFFG"),
    /ctim must be a hexadecimal string or BigInt/
  );

  // Test case 8: ctim not exactly 16 nibbles
  assert.throws(
    () => decodeCTIM("C003FFFFFFFFFFF"),
    /ctim must be exactly 16 nibbles and start with a C/
  );

  // Test case 9: ctim too large to be a valid CTIM value
  assert.throws(
    () => decodeCTIM("CFFFFFFFFFFFFFFFF"),
    /ctim must be exactly 16 nibbles and start with a C/
  );

  // Test case 10: ctim doesn't start with a C nibble
  assert.throws(
    () => decodeCTIM("FFFFFFFFFFFFFFFF"),
    /ctim must be exactly 16 nibbles and start with a C/
  );

  // the same tests again but using bigint instead of string
  //

  // Test case 11: Valid input values
  assert.deepEqual(decodeCTIM(0xcfffffffffffffffn), {
    lgrIndex: 0xfffffff,
    txnIndex: 0xffff,
    networkId: 0xffff,
  });
  assert.deepEqual(decodeCTIM(0xc000000000000000n), {
    lgrIndex: 0,
    txnIndex: 0,
    networkId: 0,
  });
  assert.deepEqual(decodeCTIM(0xc000000100020003n), {
    lgrIndex: 1,
    txnIndex: 2,
    networkId: 3,
  });
  assert.deepEqual(decodeCTIM(0xc0ca2aa7326fc045n), {
    lgrIndex: 13249191,
    txnIndex: 12911,
    networkId: 49221,
  });

  // Test case 12: ctim not exactly 16 nibbles
  assert.throws(
    () => decodeCTIM(0xc003fffffffffffn),
    /ctim must be exactly 16 nibbles and start with a C/
  );

  // Test case 13: ctim too large to be a valid CTIM value
  assert.throws(
    () => decodeCTIM(0xcffffffffffffffffn),
    /ctim must be exactly 16 nibbles and start with a C/
  );

  // Test case 14: ctim doesn't start with a C nibble
  assert.throws(
    () => decodeCTIM(0xffffffffffffffffn),
    /ctim must be exactly 16 nibbles and start with a C/
  );

  console.log("Done.");
}
