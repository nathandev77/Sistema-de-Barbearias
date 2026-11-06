const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

export async function fetchSaas(endpoint, options = {}) {
    const masterKey = localStorage.getItem('saas_master_key');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(masterKey ? { 'x-super-admin-key': masterKey } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('saas_master_key');
            throw new Error('Unauthorized. Invalid master key.');
        }
        let errorMsg = 'SaaS API request error';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }
    
    return response.json();
}
