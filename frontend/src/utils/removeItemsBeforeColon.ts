export function removeItemsBeforeColon(inputString: string) {
    const colonIndex = inputString.indexOf(":");
    
    if (colonIndex !== -1) {
      return inputString.substring(colonIndex + 1);
    }
    
    // Return the original string if no colon is found
    return inputString;
  }