
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
            return [];
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
                    throw new Error('Admin access required to create volumes');
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

    async create (url, volumeData){
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
                body: JSON.stringify(volumeData)
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Admin access required to create volumes');
                }

                if (response.status === 400) {
                    throw new Error(error.error || 'Volume name is required');
                }

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                
                throw new Error(error.error || 'Failed to create volume');
            }
            
            const data = await response.json();
            console.log('Created successfully:', data);
            return data;
            
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    };
}

const apiManager = new ApiManager();
