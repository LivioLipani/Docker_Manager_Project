
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

    async remove(url) {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                window.location.href = '/login.html';
                throw new Error('Token not found');
            }
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html'; 
                throw new Error('Session expired');
            }

            const data = await response.json();

            if (!response.ok) {
                
                
                if (response.status === 403) {
                    throw new Error(data.message || 'Permission denied: Admin access required');
                }
                
                if (response.status === 404) {
                    throw new Error('Resource not found');
                }

                throw new Error(data.message);
            }

            console.log('Deleted successfully:', data);
            return data;
            
        } catch (error) {
            console.error('API Manager Error (DELETE):', error.message);
            throw error;
        }
    }

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

            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Admin access required to create volumes, containers and images');
                }

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                console.log(data);
                throw new Error(data.message);
            }
            
            console.log('created successfully:', data);
            return data;
            
        } catch (error) {
            throw error;
        }
    };
}

const apiManager = new ApiManager();
