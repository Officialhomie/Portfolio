// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Secp256r1Verifier.sol";

/**
 * @title WebAuthnLib
 * @notice Library for verifying WebAuthn Authentication Assertions on-chain
 * @dev Integrates with EIP-7951 secp256r1 precompile (0x100) via Secp256r1Verifier
 *
 * WebAuthn Flow:
 * 1. Browser calls navigator.credentials.get() with challenge
 * 2. Device authenticates user (Face ID, Touch ID, PIN, etc.)
 * 3. Secure Enclave generates secp256r1 signature
 * 4. Browser returns authenticatorData + clientDataJSON + signature
 * 5. This library verifies the assertion on-chain
 *
 * Gas Optimization:
 * - Uses EIP-7951 precompile when available (~6,900 gas)
 * - Falls back to P256.sol (~100,000 gas) on older chains
 *
 * @author Web3 Portfolio Platform
 */
library WebAuthnLib {
    /**
     * @dev WebAuthn Authentication Assertion data structure
     * Matches the output from navigator.credentials.get()
     *
     * Reference: https://www.w3.org/TR/webauthn-2/#assertion
     */
    struct WebAuthnAuth {
        /// @dev Authenticator data from the WebAuthn assertion
        /// Contains: rpIdHash (32) + flags (1) + signCount (4) + attestedCredentialData + extensions
        bytes authenticatorData;

        /// @dev Client data JSON string from the WebAuthn assertion
        /// Contains: {"type":"webauthn.get","challenge":"...","origin":"...","crossOrigin":false}
        string clientDataJSON;

        /// @dev Index where "challenge" field starts in clientDataJSON
        /// Used for efficient verification without full JSON parsing
        uint256 challengeIndex;

        /// @dev Index where "type" field starts in clientDataJSON
        /// Used to verify this is a "webauthn.get" assertion
        uint256 typeIndex;

        /// @dev ECDSA signature r component (secp256r1)
        uint256 r;

        /// @dev ECDSA signature s component (secp256r1)
        uint256 s;
    }

    /**
     * @dev User Verification flag position in authenticatorData.flags
     * Bit 2 (0x04): User Verified (UV)
     */
    uint8 private constant UV_FLAG = 0x04;

    /**
     * @dev Expected type value for WebAuthn get assertions
     */
    string private constant EXPECTED_TYPE = '"type":"webauthn.get"';

    /**
     * @notice Verify a WebAuthn Authentication Assertion
     * @dev Main entry point for WebAuthn signature verification
     *
     * Verification Steps:
     * 1. Verify clientDataJSON structure and extract challenge
     * 2. Optionally check User Verified flag
     * 3. Compute messageHash = sha256(authenticatorData || sha256(clientDataJSON))
     * 4. Verify secp256r1 signature using EIP-7951 precompile
     *
     * @param challenge The original challenge that was signed (usually userOpHash or txHash)
     * @param requireUV Whether to require User Verification (Face ID vs just device unlock)
     * @param webAuthnAuth The WebAuthn assertion data from the browser
     * @param x Public key X coordinate (from passkey credential)
     * @param y Public key Y coordinate (from passkey credential)
     * @return True if the assertion is valid, false otherwise
     */
    function verify(
        bytes memory challenge,
        bool requireUV,
        WebAuthnAuth memory webAuthnAuth,
        uint256 x,
        uint256 y
    ) internal view returns (bool) {
        // Step 1: Verify clientDataJSON structure
        if (!verifyClientDataJSON(webAuthnAuth, challenge)) {
            return false;
        }

        // Step 2: Check User Verification flag if required
        if (requireUV) {
            if (!checkUserVerified(webAuthnAuth.authenticatorData)) {
                return false;
            }
        }

        // Step 3: Compute the message hash that was signed
        bytes32 messageHash = computeMessageHash(webAuthnAuth);

        // Step 4: Verify secp256r1 signature using EIP-7951 precompile
        return Secp256r1Verifier.verify(
            messageHash,
            bytes32(webAuthnAuth.r),
            bytes32(webAuthnAuth.s),
            bytes32(x),
            bytes32(y)
        );
    }

    /**
     * @notice Compute the message hash that was signed by the authenticator
     * @dev Hash = SHA256(authenticatorData || SHA256(clientDataJSON))
     *
     * This matches the WebAuthn specification for authentication signatures.
     * The authenticator signs over the concatenation of the raw authenticator data
     * and the hash of the client data JSON.
     *
     * Reference: https://www.w3.org/TR/webauthn-2/#op-get-assertion (step 17)
     *
     * @param webAuthnAuth The WebAuthn assertion data
     * @return The SHA256 message hash
     */
    function computeMessageHash(
        WebAuthnAuth memory webAuthnAuth
    ) internal pure returns (bytes32) {
        // Hash the clientDataJSON
        bytes32 clientDataHash = sha256(bytes(webAuthnAuth.clientDataJSON));

        // Concatenate authenticatorData || clientDataHash
        bytes memory message = abi.encodePacked(
            webAuthnAuth.authenticatorData,
            clientDataHash
        );

        // Return SHA256 hash
        return sha256(message);
    }

    /**
     * @notice Verify the clientDataJSON structure and challenge
     * @dev Checks:
     *      1. The "type" field equals "webauthn.get"
     *      2. The "challenge" field matches the expected challenge
     *
     * We use index-based verification to avoid full JSON parsing on-chain,
     * which would be extremely expensive.
     *
     * @param webAuthnAuth The WebAuthn assertion data
     * @param expectedChallenge The challenge that should be in clientDataJSON (base64url encoded)
     * @return True if clientDataJSON is valid
     */
    function verifyClientDataJSON(
        WebAuthnAuth memory webAuthnAuth,
        bytes memory expectedChallenge
    ) internal pure returns (bool) {
        string memory clientDataJSON = webAuthnAuth.clientDataJSON;

        // Verify the type field
        if (!verifyTypeField(clientDataJSON, webAuthnAuth.typeIndex)) {
            return false;
        }

        // Verify the challenge field
        if (!verifyChallengeField(clientDataJSON, webAuthnAuth.challengeIndex, expectedChallenge)) {
            return false;
        }

        return true;
    }

    /**
     * @notice Verify the "type" field in clientDataJSON
     * @dev Checks that clientDataJSON contains '"type":"webauthn.get"' at the specified index
     *
     * @param clientDataJSON The client data JSON string
     * @param typeIndex The index where the type field starts
     * @return True if the type field is valid
     */
    function verifyTypeField(
        string memory clientDataJSON,
        uint256 typeIndex
    ) internal pure returns (bool) {
        bytes memory clientDataBytes = bytes(clientDataJSON);
        bytes memory expectedTypeBytes = bytes(EXPECTED_TYPE);

        // Check bounds
        if (typeIndex + expectedTypeBytes.length > clientDataBytes.length) {
            return false;
        }

        // Compare bytes
        for (uint256 i = 0; i < expectedTypeBytes.length; i++) {
            if (clientDataBytes[typeIndex + i] != expectedTypeBytes[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Verify the "challenge" field in clientDataJSON
     * @dev Checks that the challenge field matches the expected value
     *
     * The challenge is base64url encoded in the clientDataJSON.
     * Format: "challenge":"<base64url-encoded-challenge>"
     *
     * @param clientDataJSON The client data JSON string
     * @param challengeIndex The index where "challenge" starts
     * @param expectedChallenge The expected challenge bytes (will be base64url encoded for comparison)
     * @return True if the challenge matches
     */
    function verifyChallengeField(
        string memory clientDataJSON,
        uint256 challengeIndex,
        bytes memory expectedChallenge
    ) internal pure returns (bool) {
        bytes memory clientDataBytes = bytes(clientDataJSON);

        // Expected format at challengeIndex: "challenge":"..."
        bytes memory challengePrefix = bytes('"challenge":"');

        // Verify the prefix exists at challengeIndex
        if (challengeIndex + challengePrefix.length > clientDataBytes.length) {
            return false;
        }

        for (uint256 i = 0; i < challengePrefix.length; i++) {
            if (clientDataBytes[challengeIndex + i] != challengePrefix[i]) {
                return false;
            }
        }

        // Base64url encode the expected challenge
        string memory expectedChallengeB64 = base64UrlEncode(expectedChallenge);
        bytes memory expectedChallengeBytes = bytes(expectedChallengeB64);

        // Verify the challenge value matches
        uint256 challengeValueStart = challengeIndex + challengePrefix.length;

        if (challengeValueStart + expectedChallengeBytes.length > clientDataBytes.length) {
            return false;
        }

        for (uint256 i = 0; i < expectedChallengeBytes.length; i++) {
            if (clientDataBytes[challengeValueStart + i] != expectedChallengeBytes[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Check if User Verification flag is set in authenticatorData
     * @dev The UV flag (bit 2) indicates that the user was verified (e.g., Face ID succeeded)
     *
     * authenticatorData structure:
     * - Bytes 0-31: rpIdHash (SHA256 of relying party ID)
     * - Byte 32: flags (UP | UV | BE | BS | AT | ED)
     * - Bytes 33-36: signCount
     * - Rest: attestedCredentialData and extensions
     *
     * Flags (byte 32):
     * - Bit 0 (0x01): User Present (UP) - user is present
     * - Bit 2 (0x04): User Verified (UV) - user was verified (biometric/PIN)
     * - Bit 6 (0x40): Attested Credential (AT) - contains attestedCredentialData
     * - Bit 7 (0x80): Extension Data (ED) - contains extensions
     *
     * @param authenticatorData The authenticator data from WebAuthn assertion
     * @return True if UV flag is set
     */
    function checkUserVerified(
        bytes memory authenticatorData
    ) internal pure returns (bool) {
        // authenticatorData must be at least 37 bytes (rpIdHash + flags + signCount)
        if (authenticatorData.length < 37) {
            return false;
        }

        // Extract flags byte (byte 32)
        uint8 flags = uint8(authenticatorData[32]);

        // Check if UV flag (bit 2) is set
        return (flags & UV_FLAG) == UV_FLAG;
    }

    /**
     * @notice Base64url encode bytes (URL-safe base64 without padding)
     * @dev Used to encode the challenge for comparison with clientDataJSON
     *
     * Base64url differs from standard base64:
     * - Uses '-' instead of '+'
     * - Uses '_' instead of '/'
     * - No padding ('=' characters)
     *
     * @param data The bytes to encode
     * @return The base64url encoded string
     */
    function base64UrlEncode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        // Base64 encoding table (standard)
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        bytes memory tableBytes = bytes(table);

        // Calculate output length (4/3 of input, rounded up, no padding)
        uint256 encodedLen = 4 * ((data.length + 2) / 3);

        // Account for padding removal
        if (data.length % 3 == 1) {
            encodedLen -= 2;
        } else if (data.length % 3 == 2) {
            encodedLen -= 1;
        }

        bytes memory result = new bytes(encodedLen);
        uint256 resultIndex = 0;

        // Encode 3 bytes at a time
        for (uint256 i = 0; i < data.length; i += 3) {
            uint256 a = uint8(data[i]);
            uint256 b = (i + 1 < data.length) ? uint8(data[i + 1]) : 0;
            uint256 c = (i + 2 < data.length) ? uint8(data[i + 2]) : 0;

            uint256 triple = (a << 16) | (b << 8) | c;

            result[resultIndex++] = tableBytes[(triple >> 18) & 0x3F];
            result[resultIndex++] = tableBytes[(triple >> 12) & 0x3F];

            if (i + 1 < data.length) {
                result[resultIndex++] = tableBytes[(triple >> 6) & 0x3F];
            }

            if (i + 2 < data.length) {
                result[resultIndex++] = tableBytes[triple & 0x3F];
            }
        }

        return string(result);
    }

    /**
     * @notice Get information about the verification method used
     * @dev Useful for debugging and gas estimation
     * @return method The verification method ("precompile" or "p256-library")
     * @return estimatedGas The estimated gas cost
     */
    function getVerificationInfo()
        internal
        view
        returns (string memory method, uint256 estimatedGas)
    {
        return Secp256r1Verifier.getVerificationMethod();
    }
}
