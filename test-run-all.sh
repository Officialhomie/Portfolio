#!/bin/bash

# Comprehensive Test Runner for Web3 Portfolio Platform
# This script runs all tests and generates detailed reports

set -e

echo "🚀 Starting Web3 Portfolio Platform Test Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if forge is installed
if ! command -v forge &> /dev/null; then
    print_error "Foundry/Forge is not installed. Please install it first."
    exit 1
fi

# Clean and build
print_status "Cleaning and building contracts..."
forge clean
forge build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_success "Build completed successfully"

# Run individual test files
declare -a test_files=(
    "SmartAccount.t.sol"
    "SmartAccountFactory.t.sol"
    "HomieToken.t.sol"
    "ProjectNFT.t.sol"
    "VisitNFT.t.sol"
    "VisitorBook.t.sol"
    "UserInteractionTracker.t.sol"
    "CompleteIntegration.t.sol"
    "BalanceIntegration.t.sol"
    "PortfolioTokenBalance.t.sol"
    "ProjectVotingBalance.t.sol"
)

declare -a test_results=()

echo ""
echo "🧪 Running Individual Test Suites"
echo "=================================="

total_tests=0
passed_tests=0

for test_file in "${test_files[@]}"; do
    test_path="test/${test_file}"
    if [ -f "$test_path" ]; then
        print_status "Running $test_file..."

        # Run the test with verbose output and capture result
        if forge test --match-path "$test_path" -v --gas-report > "test_output_${test_file}.log" 2>&1; then
            print_success "$test_file passed"
            test_results+=("$test_file: PASS")
            ((passed_tests++))
        else
            print_error "$test_file failed"
            test_results+=("$test_file: FAIL")
            echo "Check test_output_${test_file}.log for details"
        fi
        ((total_tests++))
    else
        print_warning "$test_file not found, skipping"
    fi
done

echo ""
echo "📊 Test Results Summary"
echo "======================="
for result in "${test_results[@]}"; do
    if [[ $result == *"PASS"* ]]; then
        print_success "$result"
    else
        print_error "$result"
    fi
done

echo ""
print_status "Overall: $passed_tests/$total_tests test suites passed"

# Run complete test suite with coverage
echo ""
echo "📈 Running Full Test Suite with Gas Reporting"
echo "=============================================="

print_status "Running all tests with gas reporting..."
if forge test --gas-report > full_test_output.log 2>&1; then
    print_success "Full test suite completed successfully"
else
    print_error "Full test suite had failures"
fi

# Generate coverage report if available
if command -v forge &> /dev/null && forge coverage --help &> /dev/null; then
    echo ""
    echo "📊 Generating Coverage Report"
    echo "============================="
    print_status "Running coverage analysis..."
    forge coverage --report lcov > coverage_output.log 2>&1
    print_success "Coverage report generated (check lcov-report/index.html)"
else
    print_warning "Coverage tool not available, skipping coverage report"
fi

# Analyze gas usage
echo ""
echo "⛽ Gas Usage Analysis"
echo "===================="

if [ -f "full_test_output.log" ]; then
    echo "Top 10 most gas-intensive functions:"
    grep -A 10 "Gas usage" full_test_output.log | head -20 || echo "No gas usage data found"

    echo ""
    echo "Gas usage by contract:"
    grep -E "(contract|Function)" full_test_output.log | grep -v "Suite" | head -20 || echo "No contract gas data found"
fi

# Final summary
echo ""
echo "🎯 Final Test Summary"
echo "===================="
if [ $passed_tests -eq $total_tests ]; then
    print_success "All tests passed! 🎉"
    print_success "Your Web3 Portfolio Platform is ready for deployment."
else
    print_error "Some tests failed. Please review the output above."
    print_status "Failed tests:"
    for result in "${test_results[@]}"; do
        if [[ $result == *"FAIL"* ]]; then
            echo "  - $result"
        fi
    done
fi

echo ""
print_status "Test output files generated:"
echo "  - full_test_output.log (complete test run)"
echo "  - coverage_output.log (coverage analysis)"
echo "  - test_output_*.log (individual test outputs)"

echo ""
print_status "Next steps:"
echo "  1. Review any failed tests and fix issues"
echo "  2. Check gas usage for optimization opportunities"
echo "  3. Review coverage report for untested code paths"
echo "  4. Run tests on testnet before mainnet deployment"

echo ""
echo "Happy testing! 🚀"
