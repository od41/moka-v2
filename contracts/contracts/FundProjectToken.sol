// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FundProjectToken is ERC20, ReentrancyGuard, Ownable {
    // Constants for bonding curve calculations
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASE_PRICE = 1e15; // 0.001 ETH initial price

    uint256 private constant MAX_ETH_AMOUNT = 1000 ether;
    uint256 private constant SCALING_FACTOR = 1e9;
    
    // Treasury address to receive fees
    address public treasuryAddress;
    
    // Fee percentages (in basis points, 100 = 1%)
    uint256 public buyFeePercent = 500;  // 5% buy fee
    uint256 public sellFeePercent = 500; // 5% sell fee
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount);
    event FeeCollected(uint256 feeAmount);
    
    constructor(address _treasuryAddress) ERC20("Sqrt Pump Token", "SQRT") Ownable(msg.sender) {
        require(_treasuryAddress != address(0), "Invalid treasury address");
        treasuryAddress = _treasuryAddress;
    }
    
    // Calculate token price based on current supply using square root curve
    // Price = BASE_PRICE * sqrt(supply/PRECISION)
    function getCurrentPrice() public view returns (uint256) {
        uint256 supply = totalSupply();
        return BASE_PRICE * _sqrt(supply * PRECISION) / PRECISION;
    }
    
    // Calculate tokens received for a given ETH amount
    function getTokensForETH(uint256 ethAmount) public view returns (uint256) {
        require(ethAmount > 0, "ETH amount must be greater than 0");
        require(ethAmount <= MAX_ETH_AMOUNT, "ETH amount too large"); // Add maximum limit
        
        uint256 currentSupply = totalSupply();
        uint256 newSupply = _solveSqrtBondingCurve(ethAmount, currentSupply);
        
        require(newSupply > currentSupply, "Invalid calculation result");
        return newSupply - currentSupply;
    }
    
    // Calculate ETH received for a given token amount
    function getETHForTokens(uint256 tokenAmount) public view returns (uint256) {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokenAmount <= totalSupply(), "Not enough tokens in supply");
        
        uint256 currentSupply = totalSupply();
        uint256 newSupply = currentSupply - tokenAmount;
        
        uint256 currentArea = _integrateSqrtCurve(currentSupply);
        uint256 newArea = _integrateSqrtCurve(newSupply);
        
        return currentArea - newArea;
    }
    
    // Buy tokens with ETH
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "ETH amount must be greater than 0");
        
        uint256 fee = (msg.value * buyFeePercent) / 10000;
        uint256 ethForTokens = msg.value - fee;
        
        uint256 tokensToMint = getTokensForETH(ethForTokens);
        require(tokensToMint > 0, "Must mint at least 1 token");
        
        // Transfer fee to treasury
        (bool success, ) = treasuryAddress.call{value: fee}("");
        require(success, "Fee transfer failed");
        
        // Mint tokens to buyer
        _mint(msg.sender, tokensToMint);
        
        emit TokensPurchased(msg.sender, msg.value, tokensToMint);
        emit FeeCollected(fee);
    }
    
    // Sell tokens for ETH
    function sellTokens(uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0, "Must sell at least 1 token");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 ethAmount = getETHForTokens(tokenAmount);
        require(ethAmount > 0, "Must receive at least 1 wei");
        
        uint256 fee = (ethAmount * sellFeePercent) / 10000;
        uint256 ethToSend = ethAmount - fee;
        
        // Burn tokens first (checks-effects-interactions pattern)
        _burn(msg.sender, tokenAmount);
        
        // Transfer ETH to seller
        (bool success, ) = msg.sender.call{value: ethToSend}("");
        require(success, "ETH transfer failed");
        
        // Transfer fee to treasury
        (success, ) = treasuryAddress.call{value: fee}("");
        require(success, "Fee transfer failed");
        
        emit TokensSold(msg.sender, tokenAmount, ethToSend);
        emit FeeCollected(fee);
    }
    
    // Internal function to solve the square root bonding curve equation
    // For price = BASE_PRICE * sqrt(supply/PRECISION)
    // Integral = BASE_PRICE * (2/3) * (supply/PRECISION)^(3/2)
    function _solveSqrtBondingCurve(uint256 ethAmount, uint256 currentSupply) internal pure returns (uint256) {
        // Recalculate with scaled values
        uint256 scaledPrecision = PRECISION / SCALING_FACTOR;  // Scale down precision
        uint256 scaledBase = BASE_PRICE / SCALING_FACTOR;      // Scale down base price
        
        // For a sqrt curve: price = BASE_PRICE * sqrt(supply/PRECISION)
            // ethAmount = BASE_PRICE * (2/3) * ((newSupply^(3/2) - currentSupply^(3/2))/PRECISION^(3/2))
            // Solving for newSupply:
        uint256 k = (3 * ethAmount * scaledPrecision) / (2 * scaledBase);
        uint256 currentTerm = _sqrt(currentSupply) * currentSupply / SCALING_FACTOR;
        uint256 newTerm = currentTerm + k;
        
        // Find the new supply by solving x^(3/2) = newTerm
        // x = (newTerm)^(2/3)
        return _cbrt(newTerm * 1e6) * 1e6;
    }
    
    // Internal function to integrate the square root curve
    function _integrateSqrtCurve(uint256 supply) internal pure returns (uint256) {
        // Integral of BASE_PRICE * sqrt(x/PRECISION)
        // = BASE_PRICE * (2/3) * (x/PRECISION)^(3/2)
        uint256 scaledSupply = supply / SCALING_FACTOR;
        uint256 scaledPrecision = PRECISION / SCALING_FACTOR;
        
        uint256 sqrtSupply = _sqrt(scaledSupply);
        return (2 * BASE_PRICE * sqrtSupply * scaledSupply) / (3 * scaledPrecision);
    }
    
    // Internal function to calculate square root
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    // Internal function to calculate cube root
    function _cbrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 y = x;
        uint256 z = (x + 2) / 3;
        
        while (z < y) {
            y = z;
            z = (2 * z + x / (z * z)) / 3;
        }
        
        return y;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
    
    // Admin functions
    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = _newTreasury;
    }
    
    function setFees(uint256 _buyFeePercent, uint256 _sellFeePercent) external onlyOwner {
        require(_buyFeePercent <= 1000 && _sellFeePercent <= 1000, "Fees cannot exceed 10%");
        buyFeePercent = _buyFeePercent;
        sellFeePercent = _sellFeePercent;
    }
}