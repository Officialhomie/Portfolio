#!/usr/bin/env node

/**
 * Test InitCode Generation
 * Verifies that the factory can generate proper initCode for undeployed accounts
 */

import { createPublicClient, http, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

// Configuration
const FACTORY_ADDRESS = '0x6DE5AF843d270E45A9541805aA42E14544E4AD5c';
const RPC_URL = 'https://mainnet.base.org';

// Your EOA address (replace with actual connected wallet address)
const EOA_ADDRESS = process.argv[2];

if (!EOA_ADDRESS || !EOA_ADDRESS.startsWith('0x')) {
  console.error('Usage: node test-initcode.mjs <your-eoa-address>');
  console.error('Example: node test-initcode.mjs 0x1234...');
  process.exit(1);
}

// Create public client
const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// Factory ABI
const FACTORY_ABI = [
  {
    name: 'createAccount',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'bytes' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: 'account', type: 'address' }],
  },
  {
    name: 'getAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'bytes' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
];

async function testInitCode() {
  console.log('🧪 Testing InitCode Generation\n');
  console.log('Configuration:');
  console.log('  Factory:', FACTORY_ADDRESS);
  console.log('  EOA:', EOA_ADDRESS);
  console.log('  Chain: Base (8453)\n');

  try {
    // Step 1: Encode owner bytes (32-byte padded address)
    const ownerBytes = `0x${EOA_ADDRESS.slice(2).padStart(64, '0')}`;
    console.log('1️⃣ Owner Bytes (32-byte padded):');
    console.log('  ', ownerBytes);
    console.log('   Length:', ownerBytes.length);
    console.log('');

    // Step 2: Compute smart wallet address
    console.log('2️⃣ Computing smart wallet address from factory...');
    const smartWalletAddress = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'getAddress',
      args: [ownerBytes, 0n],
    });
    console.log('   Smart Wallet Address:', smartWalletAddress);
    console.log('');

    // Step 3: Check if deployed
    console.log('3️⃣ Checking deployment status...');
    const code = await publicClient.getCode({ address: smartWalletAddress });
    const isDeployed = code !== undefined && code !== '0x';
    console.log('   Code:', code?.substring(0, 20) + '...');
    console.log('   Is Deployed:', isDeployed);
    console.log('');

    if (isDeployed) {
      console.log('✅ Account is already deployed!');
      console.log('   InitCode should be: 0x (empty)');
      return;
    }

    // Step 4: Generate initCode
    console.log('4️⃣ Generating initCode...');
    const createAccountCallData = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: 'createAccount',
      args: [ownerBytes, 0n],
    });
    console.log('   CreateAccount CallData:');
    console.log('   ', createAccountCallData);
    console.log('   Length:', createAccountCallData.length);
    console.log('');

    // InitCode format: factoryAddress + callData
    const initCode = `${FACTORY_ADDRESS}${createAccountCallData.slice(2)}`;
    console.log('5️⃣ Final InitCode:');
    console.log('   ', initCode);
    console.log('   Length:', initCode.length);
    console.log('');

    // Validate
    if (initCode.length < 42) {
      console.error('❌ ERROR: InitCode too short!');
      process.exit(1);
    }

    if (!initCode.startsWith(FACTORY_ADDRESS.toLowerCase())) {
      console.error('❌ ERROR: InitCode doesnt start with factory address!');
      process.exit(1);
    }

    console.log('✅ InitCode generation successful!');
    console.log('');
    console.log('📋 Use this in your UserOperation:');
    console.log('   sender:', smartWalletAddress);
    console.log('   initCode:', initCode);
    console.log('');
    console.log('💡 This will deploy your smart wallet on first transaction!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testInitCode();
