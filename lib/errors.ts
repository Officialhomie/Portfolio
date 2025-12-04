// Custom error types for better error handling

export class ContractNotDeployedError extends Error {
  constructor(contractName: string) {
    super(`Contract ${contractName} is not deployed or address is not configured`)
    this.name = 'ContractNotDeployedError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TransactionError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'TransactionError'
  }
}

export class UserRejectedError extends Error {
  constructor() {
    super('User rejected the transaction')
    this.name = 'UserRejectedError'
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle user rejection
    if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
      return 'Transaction was cancelled'
    }
    
    // Handle insufficient funds
    if (error.message.includes('insufficient funds') || error.message.includes('insufficient balance')) {
      return 'Insufficient balance for this transaction'
    }
    
    // Handle network errors
    if (error.message.includes('network') || error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.'
    }
    
    // Handle contract not deployed
    if (error.message.includes('not deployed') || error.message.includes('address')) {
      return 'Contract is not available. Please contact support.'
    }
    
    return error.message
  }
  
  return 'An unexpected error occurred'
}

