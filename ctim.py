def encodeCTIM(ledger_seq, txn_index, network_id):
    if not isinstance(ledger_seq, int):
        raise ValueError("ledger_seq must be a number.")
    if ledger_seq > 0xFFFFFFF or ledger_seq < 0:
        raise ValueError("ledger_seq must not be greater than 268435455 or less than 0.")

    if not isinstance(txn_index, int):
        raise ValueError("txn_index must be a number.")
    if txn_index > 0xFFFF or txn_index < 0:
        raise ValueError("txn_index must not be greater than 65535 or less than 0.")

    if not isinstance(network_id, int):
        raise ValueError("network_id must be a number.")
    if network_id > 0xFFFF or network_id < 0:
        raise ValueError("network_id must not be greater than 65535 or less than 0.")

    ctim_value = ((0xC0000000 + ledger_seq) << 32) + (txn_index << 16) + network_id
    return format(ctim_value, 'x').upper()

def decodeCTIM(ctim):
    if isinstance(ctim, str):
        if not ctim.isalnum():
            raise ValueError("ctim must be a hexadecimal string or BigInt")

        if len(ctim) != 16:
            raise ValueError("ctim must be exactly 16 nibbles and start with a C")

        ctim_value = int(ctim, 16)
    elif isinstance(ctim, int):
        ctim_value = ctim
    else:
        raise ValueError("ctim must be a hexadecimal string or BigInt")

    if ctim_value > 0xFFFFFFFFFFFFFFFF or ctim_value & 0xF000000000000000 != 0xC000000000000000:
        raise ValueError("ctim must be exactly 16 nibbles and start with a C")

    ledger_seq = (ctim_value >> 32) & 0xFFFFFFF
    txn_index = (ctim_value >> 16) & 0xFFFF
    network_id = ctim_value & 0xFFFF
    return {
        'ledger_seq': ledger_seq,
        'txn_index': txn_index,
        'network_id': network_id
    }

import unittest

class TestEncodeAndDecodeCTIM(unittest.TestCase):
    def test(self):
        # Test case 1: Valid input values
        self.assertEqual(encodeCTIM(0xFFFFFFF, 0xFFFF, 0xFFFF), "CFFFFFFFFFFFFFFF")
        self.assertEqual(encodeCTIM(0, 0, 0), "C000000000000000")
        self.assertEqual(encodeCTIM(1, 2, 3), "C000000100020003")
        self.assertEqual(encodeCTIM(13249191, 12911, 49221), "C0CA2AA7326FC045")

        # Test case 2: ledger_seq greater than 0xFFFFFFF or less than 0
        with self.assertRaises(ValueError, msg="ledger_seq must not be greater than 268435455 or less than 0."):
            encodeCTIM(0x10000000, 0xFFFF, 0xFFFF)
            encodeCTIM(-1, 0xFFFF, 0xFFFF)

        # Test case 3: txn_index greater than 0xFFFF or less than 0
        with self.assertRaises(ValueError, msg="txn_index must not be greater than 65535 or less than 0."):
            encodeCTIM(0xFFFFFFF, 0x10000, 0xFFFF)
            encodeCTIM(0xFFFFFFF, -1, 0xFFFF)

        # Test case 4: network_id greater than 0xFFFF or less than 0
        with self.assertRaises(ValueError, msg="network_id must not be greater than 65535 or less than 0."):
            encodeCTIM(0xFFFFFFF, 0xFFFF, -1)

        # Test case 5: Valid input values
        self.assertDictEqual(decodeCTIM("CFFFFFFFFFFFFFFF"), {'ledger_seq': 0xFFFFFFF, 'txn_index': 0xFFFF, 'network_id': 0xFFFF})
        self.assertDictEqual(decodeCTIM("C000000000000000"), {'ledger_seq': 0, 'txn_index': 0, 'network_id': 0})
        self.assertDictEqual(decodeCTIM("C000000100020003"), {'ledger_seq': 1, 'txn_index': 2, 'network_id': 3})
        self.assertDictEqual(decodeCTIM("C0CA2AA7326FC045"), {'ledger_seq': 13249191, 'txn_index': 12911, 'network_id': 49221})

        # Test case 6: ctim not a string or big int
        with self.assertRaises(ValueError, msg="ctim must be a hexadecimal string or BigInt"):
            decodeCTIM(0xCFF)

        # Test case 7: ctim not a hexadecimal string
        with self.assertRaises(ValueError, msg="ctim must be a hexadecimal string or BigInt"):
            decodeCTIM("C003FFFFFFFFFFFG")
            
        # Test case 8: ctim not exactly 16 nibbles
        with self.assertRaises(ValueError, msg="ctim must be exactly 16 nibbles and start with a C"):
            decodeCTIM("C003FFFFFFFFFFF")

        # Test case 9: ctim too large to be a valid CTIM value
        with self.assertRaises(ValueError, msg="ctim must be exactly 16 nibbles and start with a C"):
            decodeCTIM("CFFFFFFFFFFFFFFFF")

        # Test case 10: ctim doesn't start with a C nibble
        with self.assertRaises(ValueError, msg="ctim must be exactly 16 nibbles and start with a C"):
            decodeCTIM("FFFFFFFFFFFFFFFF")

        # the same tests again but using bigint instead of string
        #

        # Test case 11: Valid input values
        self.assertDictEqual(decodeCTIM(0xCFFFFFFFFFFFFFFF), {'ledger_seq': 0xFFFFFFF, 'txn_index': 0xFFFF, 'network_id': 0xFFFF})
        self.assertDictEqual(decodeCTIM(0xC000000000000000), {'ledger_seq': 0, 'txn_index': 0, 'network_id': 0})
        self.assertDictEqual(decodeCTIM(0xC000000100020003), {'ledger_seq': 1, 'txn_index': 2, 'network_id': 3})
        self.assertDictEqual(decodeCTIM(0xC0CA2AA7326FC045), {'ledger_seq': 13249191, 'txn_index': 12911, 'network_id': 49221})

        # Test case 12: ctim not exactly 16 nibbles
        with self.assertRaises(ValueError, msg="ctim must be exactly 16 nibbles and start with a C"):
            decodeCTIM(0xC003FFFFFFFFFFF)

        # Test case 13: ctim too large to be a valid CTIM value
        with self.assertRaises(ValueError, msg="ctim must be exactly 16 nibbles and start with a C"):
            decodeCTIM(0xCFFFFFFFFFFFFFFFF)

        # Test case 14: ctim doesn't start with a C nibble
        with self.assertRaises(ValueError, msg="ctim must be exactly 16 nibbles and start with a C"):
            decodeCTIM(0xFFFFFFFFFFFFFFFF)


if __name__ == '__main__':
    (TestEncodeAndDecodeCTIM()).test()
