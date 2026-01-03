
class ApiManager {
    async get(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error fetching:', error);
            throw error;
        }
    }

    async getStream(url, onProgress, onError) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                
                // Docker invia più oggetti JSON separati da \n nello stesso chunk
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        
                        // Se il JSON contiene un errore logico (es. immagine non trovata)
                        if (data.error) {
                            if (onError) onError(data.error);
                            return;
                        }

                        // Se tutto va bene, inviamo il progresso alla callback
                        if (onProgress) onProgress(data);
                    } catch (e) {
                        console.error("Errore nel parsing del chunk:", e);
                    }
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (onError) onError(error.message);
        }
    }

    async remove (url) {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
            throw new Error('Token not found');
            }
            
            const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Admin access required to post volumes');
                }
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('deleted successfully:', data);
            return data;
            
        } catch (error) {
            console.error('Error deleting:', error.message);
            throw error;
        }
    };

    async post (url, sentData){
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
            throw new Error('Token not found');
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sentData)
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Admin access required to create volumes, containers and images');
                }

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                
                throw new Error(error.error || 'Failed to create');
            }
            
            const data = await response.json();
            console.log('created successfully:', data);
            return data;
            
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    };
}

const apiManager = new ApiManager();
