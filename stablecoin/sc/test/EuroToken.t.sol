// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public token;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        token = new EuroToken(owner);
    }

    function test_Deploy() public view {
        assertEq(token.name(), "EuroToken");
        assertEq(token.symbol(), "EURT");
        assertEq(token.decimals(), 6);
        assertEq(token.owner(), owner);
        assertEq(token.totalSupply(), 0);
    }

    function test_MintByOwner() public {
        uint256 amount = 100 * 10 ** 6; // 100 EURT
        token.mint(user1, amount);
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_MintByNonOwnerFails() public {
        uint256 amount = 100 * 10 ** 6;
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user1, amount);
    }

    function test_MintToZeroAddressFails() public {
        vm.expectRevert("EuroToken: mint to zero address");
        token.mint(address(0), 100);
    }

    function test_MintZeroAmountFails() public {
        vm.expectRevert("EuroToken: mint amount must be positive");
        token.mint(user1, 0);
    }

    function test_Transfer() public {
        uint256 amount = 100 * 10 ** 6;
        token.mint(user1, amount);

        vm.prank(user1);
        token.transfer(user2, 50 * 10 ** 6);

        assertEq(token.balanceOf(user1), 50 * 10 ** 6);
        assertEq(token.balanceOf(user2), 50 * 10 ** 6);
    }

    function test_Decimals() public view {
        assertEq(token.decimals(), 6);
    }

    // Fuzz test for mint amounts
    function testFuzz_Mint(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount < type(uint256).max);
        token.mint(user1, amount);
        assertEq(token.balanceOf(user1), amount);
    }
}
