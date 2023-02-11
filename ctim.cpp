#include <cassert>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <optional>
#include <regex>
#include <sstream>
#include <string>
#include <tuple>
#include <type_traits>

std::optional<std::string>
encodeCTIM(uint32_t ledger_seq, uint16_t txn_index, uint16_t network_id) noexcept
{
  if (ledger_seq > 0xFFFFFFF)
    return {};

  if (txn_index > 0xFFFF)
    return {};

  if (network_id > 0xFFFF)
    return {};

  uint64_t ctimValue =
      ((0xC0000000ULL + static_cast<uint64_t>(ledger_seq)) << 32) +
      (static_cast<uint64_t>(txn_index) << 16) + network_id;

  std::stringstream buffer;
  buffer << std::hex << std::uppercase << std::setfill('0') << std::setw(16)
         << ctimValue;
  return {buffer.str()};
}

template <typename T>
std::optional<std::tuple<uint32_t, uint16_t, uint16_t>>
decodeCTIM(const T ctim) noexcept
{
  uint64_t ctimValue {0};
  if constexpr (std::is_same_v<T, std::string> || std::is_same_v<T, char *> ||
                std::is_same_v<T, const char *> ||
                std::is_same_v<T, std::string_view>)
  {
    const std::string ctimString(ctim);

    if (ctimString.length() != 16)
      return {};

    if (!std::regex_match(ctimString, std::regex("^[0-9A-F]+$")))
      return {};

    ctimValue = std::stoull(ctimString, nullptr, 16);
  } else if constexpr (std::is_integral_v<T>)
    ctimValue = ctim;
  else
    return {};

  if (ctimValue > 0xFFFFFFFFFFFFFFFFULL ||
      (ctimValue & 0xF000000000000000ULL) != 0xC000000000000000ULL)
    return {};

  uint32_t ledger_seq = (ctimValue >> 32) & 0xFFFFFFFUL;
  uint16_t txn_index = (ctimValue >> 16) & 0xFFFFU;
  uint16_t network_id = ctimValue & 0xFFFFU;
  return {{ledger_seq, txn_index, network_id}};
}

// NOTE TO DEVELOPER:
// you only need the two functions above, below are test cases for nodejs, if
// you want them.

int main() {
  std::cout << "Running test cases..." << std::endl;
  // Test case 1: Valid input values
  assert(encodeCTIM(0xFFFFFFFUL, 0xFFFFU, 0xFFFFU) ==
         std::optional<std::string>("CFFFFFFFFFFFFFFF"));
  assert(encodeCTIM(0, 0, 0) == std::optional<std::string>("C000000000000000"));
  assert(encodeCTIM(1U, 2U, 3U) ==
         std::optional<std::string>("C000000100020003"));
  assert(encodeCTIM(13249191UL, 12911U, 49221U) ==
         std::optional<std::string>("C0CA2AA7326FC045"));

  // Test case 2: ledger_seq greater than 0xFFFFFFF
  assert(!encodeCTIM(0x10000000UL, 0xFFFFU, 0xFFFFU));

  // Test case 3: txn_index greater than 0xFFFF
  // this test case is impossible in c++ due to the type, left in for
  // completeness assert(!encodeCTIM(0xFFFFFFF, 0x10000, 0xFFFF));

  // Test case 4: network_id greater than 0xFFFF
  // this test case is impossible in c++ due to the type, left in for
  // completeness assert(!encodeCTIM(0xFFFFFFFUL, 0xFFFFU, 0x10000U));

  // Test case 5: Valid input values
  assert((decodeCTIM("CFFFFFFFFFFFFFFF") ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(0xFFFFFFFULL, 0xFFFFU, 0xFFFFU))));
  assert((decodeCTIM("C000000000000000") ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(0, 0, 0))));
  assert((decodeCTIM("C000000100020003") ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(1U, 2U, 3U))));
  assert((decodeCTIM("C0CA2AA7326FC045") ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(13249191UL, 12911U, 49221U))));

  // Test case 6: ctim not a string or big int
  assert(!decodeCTIM(0xCFF));

  // Test case 7: ctim not a hexadecimal string
  assert(!decodeCTIM("C003FFFFFFFFFFFG"));

  // Test case 8: ctim not exactly 16 nibbles
  assert(!decodeCTIM("C003FFFFFFFFFFF"));

  // Test case 9: ctim too large to be a valid CTIM value
  assert(!decodeCTIM("CFFFFFFFFFFFFFFFF"));

  // Test case 10: ctim doesn't start with a C nibble
  assert(!decodeCTIM("FFFFFFFFFFFFFFFF"));

  // Test case 11: Valid input values
  assert((decodeCTIM(0xCFFFFFFFFFFFFFFFULL) ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(0xFFFFFFFUL, 0xFFFFU, 0xFFFFU))));
  assert((decodeCTIM(0xC000000000000000ULL) ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(0, 0, 0))));
  assert((decodeCTIM(0xC000000100020003ULL) ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(1U, 2U, 3U))));
  assert((decodeCTIM(0xC0CA2AA7326FC045ULL) ==
          std::optional<std::tuple<int32_t, uint16_t, uint16_t>>(
              std::make_tuple(13249191UL, 12911U, 49221U))));

  // Test case 12: ctim not exactly 16 nibbles
  assert(!decodeCTIM(0xC003FFFFFFFFFFF));

  // Test case 13: ctim too large to be a valid CTIM value
  // this test case is not possible in c++ because it would overflow the type,
  // left in for completeness assert(!decodeCTIM(0xCFFFFFFFFFFFFFFFFULL));

  // Test case 14: ctim doesn't start with a C nibble
  assert(!decodeCTIM(0xFFFFFFFFFFFFFFFFULL));

  std::cout << "Done!" << std::endl;
  return 0;
}
