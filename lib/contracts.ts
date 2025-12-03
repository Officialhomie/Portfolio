// Contract ABIs and addresses will be added here after deployment
// This file will be populated with actual contract addresses and ABIs

export const CONTRACT_ADDRESSES = {
  VISITOR_BOOK: process.env.NEXT_PUBLIC_VISITOR_BOOK_ADDRESS || '',
  PROJECT_NFT: process.env.NEXT_PUBLIC_PROJECT_NFT_ADDRESS || '',
  PROJECT_VOTING: process.env.NEXT_PUBLIC_PROJECT_VOTING_ADDRESS || '',
  VISIT_NFT: process.env.NEXT_PUBLIC_VISIT_NFT_ADDRESS || '',
  PORTFOLIO_TOKEN: process.env.NEXT_PUBLIC_PORTFOLIO_TOKEN_ADDRESS || '',
} as const

// Portfolio Token ABI
export const PORTFOLIO_TOKEN_ABI = [
  {
    inputs: [],
    name: 'claimFaucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'canClaimFaucet',
    outputs: [
      { internalType: 'bool', name: 'canClaim', type: 'bool' },
      { internalType: 'uint256', name: 'timeUntilClaim', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FAUCET_AMOUNT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Visitor Book ABI
export const VISITOR_BOOK_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'message', type: 'string' }],
    name: 'signVisitorBook',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalVisitors',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getVisitors',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'visitor', type: 'address' },
          { internalType: 'string', name: 'message', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct VisitorBook.Visitor[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getVisitor',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'visitor', type: 'address' },
          { internalType: 'string', name: 'message', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct VisitorBook.Visitor',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'visitor', type: 'address' },
      { indexed: false, internalType: 'string', name: 'message', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'visitNumber', type: 'uint256' },
    ],
    name: 'VisitorSigned',
    type: 'event',
  },
] as const

// Project NFT ABI (placeholder)
export const PROJECT_NFT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'tokenURI', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Project Voting ABI (updated for token-gated voting)
export const PROJECT_VOTING_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'projectId', type: 'string' }],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'projectId', type: 'string' }],
    name: 'getVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'voter', type: 'address' },
      { internalType: 'string', name: 'projectId', type: 'string' },
    ],
    name: 'checkVote',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'voteCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Visit NFT ABI (placeholder)
export const VISIT_NFT_ABI = [
  {
    inputs: [],
    name: 'mintVisitNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'hasMinted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'remainingSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
