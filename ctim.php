<?php

function encodeCTIM($lgrIndex, $txnIndex, $networkId)
{
  if (!is_numeric($lgrIndex))
    throw new Exception("lgrIndex must be a number.");
  if ($lgrIndex > 0xFFFFFFF || $lgrIndex < 0)
    throw new Exception("lgrIndex must not be greater than 268435455 or less than 0.");

  if (!is_numeric($txnIndex))
    throw new Exception("txnIndex must be a number.");
  if ($txnIndex > 0xFFFF || $txnIndex < 0)
    throw new Exception("txnIndex must not be greater than 65535 or less than 0.");

  if (!is_numeric($networkId))
    throw new Exception("networkId must be a number.");
  if ($networkId > 0xFFFF || $networkId < 0)
    throw new Exception("networkId must not be greater than 65535 or less than 0.");

  $ledger_part = dechex($lgrIndex);
  $txn_part = dechex($txnIndex);
  $network_part = dechex($networkId);

  if (strlen($ledger_part) < 7)
      $ledger_part = str_repeat("0", 7 - strlen($ledger_part)) . $ledger_part;
  if (strlen($txn_part) < 4)
      $txn_part = str_repeat("0", 4 - strlen($txn_part)) . $txn_part;
  if (strlen($network_part) < 4)
      $network_part = str_repeat("0", 4 - strlen($network_part)) . $network_part;

  return strtoupper("C" . $ledger_part . $txn_part . $network_part);
}

function decodeCTIM($ctim)
{
  if (is_string($ctim))
  {
    if (!ctype_xdigit($ctim))
      throw new Exception("ctim must be a hexadecimal string");
    if (strlen($ctim) !== 16)
      throw new Exception("ctim must be exactly 16 nibbles and start with a C");
  } else
    throw new Exception("ctim must be a hexadecimal string");

  if (substr($ctim, 0, 1) !== 'C')
    throw new Exception("ctim must be exactly 16 nibbles and start with a C");

  $lgrIndex = substr($ctim, 1, 7);
  $txnIndex = substr($ctim, 8, 4);
  $networkId = substr($ctim, 12, 4);
  return array(
    "lgrIndex" => hexdec($lgrIndex),
    "txnIndex" => hexdec($txnIndex),
    "networkId" => hexdec($networkId)
  );
}

// NOTE TO DEVELOPER:
// you only need the two functions above, below are test cases, if you want them.

print("Running tests...\n");

function assert_test($x)
{
    if (!$x)
        echo "test failed!\n";
    else
        echo "test passed\n";
}

// Test case 1: Valid input values
assert_test(encodeCTIM(0xFFFFFFF, 0xFFFF, 0xFFFF) == "CFFFFFFFFFFFFFFF");
assert_test(encodeCTIM(0, 0, 0) == "C000000000000000");
assert_test(encodeCTIM(1, 2, 3) == "C000000100020003");
assert_test(encodeCTIM(13249191, 12911, 49221) == "C0CA2AA7326FC045");

// Test case 2: lgrIndex greater than 0xFFFFFFF
try {
  encodeCTIM(0x10000000, 0xFFFF, 0xFFFF);
  assert_test(false);
} catch (Exception $e) {
  assert_test(strcmp($e->getMessage(), "lgrIndex must not be greater than 268435455 or less than 0.") == 0);
}
try {
  encodeCTIM(-1, 0xFFFF, 0xFFFF);
  assert_test(false);
} catch (Exception $e) {
  assert_test(strcmp($e->getMessage(), "lgrIndex must not be greater than 268435455 or less than 0.") == 0);
}

// Test case 3: txnIndex greater than 0xFFFF
try {
  encodeCTIM(0xFFFFFFF, 0x10000, 0xFFFF);
  assert_test(false);
} catch (Exception $e) {
  assert_test(strcmp($e->getMessage(), "txnIndex must not be greater than 65535 or less than 0.") == 0);
}
try {
  encodeCTIM(0xFFFFFFF, -1, 0xFFFF);
  assert_test(false);
} catch (Exception $e) {
  assert_test(strcmp($e->getMessage(), "txnIndex must not be greater than 65535 or less than 0.") == 0);
}

// Test case 4: networkId greater than 0xFFFF
try {
  encodeCTIM(0xFFFFFFF, 0xFFFF, 0x10000);
  assert_test(false);
} catch (Exception $e) {
  assert_test(strcmp($e->getMessage(), "networkId must not be greater than 65535 or less than 0.") == 0);
}
try {
  encodeCTIM(0xFFFFFFF, 0xFFFF, -1);
  assert_test(false);
} catch (Exception $e) {
  assert_test(strcmp($e->getMessage(), "networkId must not be greater than 65535 or less than 0.") == 0);
}

// Test case 5: Valid input values
assert_test(decodeCTIM("CFFFFFFFFFFFFFFF") == array("lgrIndex" => 0xFFFFFFF, "txnIndex" => 0xFFFF, "networkId" => 0xFFFF));
assert_test(decodeCTIM("C000000000000000") == array("lgrIndex" => 0, "txnIndex" => 0, "networkId" => 0));
assert_test(decodeCTIM("C000000100020003") == array("lgrIndex" =>1, "txnIndex" => 2, "networkId" => 3));
assert_test(decodeCTIM("C0CA2AA7326FC045") == array("lgrIndex" =>13249191, "txnIndex" => 12911, "networkId" => 49221));


print("Done!\n");

?>
