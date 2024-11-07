// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundProjectToken.sol";

contract FundProjectTokenFactory {
    // Array to keep track of all deployed tokens
    address[] public deployedTokens;
    
    // Event emitted when a new token is created
    event TokenCreated(address indexed tokenAddress, address indexed treasury, address indexed creator);
    
    // Deploy a new FundProjectToken
    function createToken(address treasuryAddress) external returns (address) {
        // Deploy new token contract
        FundProjectToken newToken = new FundProjectToken(treasuryAddress);
        
        // Transfer ownership to the creator
        newToken.transferOwnership(msg.sender);
        
        // Store the token address
        deployedTokens.push(address(newToken));
        
        // Emit event
        emit TokenCreated(address(newToken), treasuryAddress, msg.sender);
        
        return address(newToken);
    }
    
    // Get total number of deployed tokens
    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }
    
    // Get deployed token at index
    function getDeployedToken(uint256 index) external view returns (address) {
        require(index < deployedTokens.length, "Index out of bounds");
        return deployedTokens[index];
    }
    
    // Get all deployed tokens
    function getAllDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
} 