// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FundProjectToken.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract FundProjectTokenFactory {
    address public immutable tokenImplementation;
    address[] public deployedTokens;
    
    event TokenCreated(address indexed tokenAddress, address indexed treasury, address indexed creator);
    
    constructor() {
        // Deploy the implementation contract once
        tokenImplementation = address(new FundProjectToken()); // dummy treasury
    }
    
    function createToken(address treasuryAddress) external returns (address) {
        // Clone the implementation contract
        address clone = Clones.clone(tokenImplementation);
        FundProjectToken(payable(clone)).initialize(treasuryAddress, msg.sender); // Need to add initialize function to token
        
        deployedTokens.push(clone);
        emit TokenCreated(clone, treasuryAddress, msg.sender);
        
        return clone;
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