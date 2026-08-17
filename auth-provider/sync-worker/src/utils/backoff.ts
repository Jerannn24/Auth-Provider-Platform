
export function calculatedNextRetryDelay(attempt: number){
    const baseDelay = 2000; 
    const maxDelay = 30000; 

    const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));

    const jitter = Math.floor(Math.random() * (exponentialDelay * 0.5));

    return new Date(Date.now() + exponentialDelay + jitter);
}